import os
import shutil
import hashlib
from typing import List, Optional
from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form, Query
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models.user import User
from app.models.knowledge import KnowledgeDocument, FAQ
from app.schemas.knowledge import (
    DocumentOut, FAQOut, FAQCreate, FAQUpdate,
    RetrievalChunk, KnowledgeSearchResponse
)
from app.api.deps import require_admin, get_optional_current_user
from app.services.rag import rag_service
from app.core.config import settings

router = APIRouter(prefix="/knowledge", tags=["Knowledge Base & RAG"])


@router.get("/documents", response_model=List[DocumentOut])
def list_documents(db: Session = Depends(get_db)):
    """List all knowledge base documents and their indexing status."""
    return db.query(KnowledgeDocument).order_by(KnowledgeDocument.uploaded_at.desc()).all()


@router.post("/upload", response_model=DocumentOut, status_code=status.HTTP_201_CREATED)
async def upload_document(
    file: UploadFile = File(...),
    title: str = Form(...),
    category: str = Form("General"),
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    Upload and index an institutional document (.md, .txt, .pdf, .json).
    Validates file type and size (<10MB), checks duplicate hash, chunks, and indexes into RAG vector store.
    """
    allowed_exts = {".md", ".txt", ".pdf", ".json"}
    ext = Path(file.filename).suffix.lower()
    if ext not in allowed_exts:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file format '{ext}'. Allowed formats: {', '.join(allowed_exts)}"
        )

    # Read file content and compute hash
    content_bytes = await file.read()
    if len(content_bytes) > 10 * 1024 * 1024:  # 10MB limit
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File size exceeds the 10MB maximum limit."
        )

    content_hash = hashlib.sha256(content_bytes).hexdigest()

    existing = db.query(KnowledgeDocument).filter(KnowledgeDocument.content_hash == content_hash).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Duplicate document detected. This exact file is already indexed as '{existing.title}'."
        )

    # Save to disk
    safe_filename = f"{hashlib.md5(file.filename.encode()).hexdigest()[:8]}_{file.filename}"
    saved_path = settings.KNOWLEDGE_BASE_DIR / safe_filename
    with open(saved_path, "wb") as f:
        f.write(content_bytes)

    # Create DB record
    doc_record = KnowledgeDocument(
        title=title.strip(),
        filename=safe_filename,
        file_type=ext.lstrip("."),
        category=category.strip(),
        content_hash=content_hash,
        chunk_count=0,
        is_indexed=False,
        ingestion_status="Processing"
    )
    db.add(doc_record)
    db.commit()
    db.refresh(doc_record)

    # Ingest into RAG pipeline
    try:
        chunks_indexed = rag_service.ingest_document(
            file_path=saved_path,
            title=doc_record.title,
            category=doc_record.category,
            document_id=doc_record.id
        )
        doc_record.chunk_count = chunks_indexed
        doc_record.is_indexed = True
        doc_record.ingestion_status = "Indexed"
        db.commit()
        db.refresh(doc_record)
    except Exception as e:
        doc_record.ingestion_status = "Failed"
        doc_record.error_message = str(e)
        db.commit()
        db.refresh(doc_record)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Document parsing failed: {str(e)}"
        )

    return doc_record


@router.delete("/documents/{document_id}", status_code=status.HTTP_200_OK)
def delete_document(
    document_id: int,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Delete a document from database and remove its chunks from RAG vector store."""
    doc = db.query(KnowledgeDocument).filter(KnowledgeDocument.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")

    # Remove file from disk if present
    file_path = settings.KNOWLEDGE_BASE_DIR / doc.filename
    if file_path.exists():
        try:
            os.remove(file_path)
        except Exception:
            pass

    # Remove chunks from vector store
    rag_service.delete_document(document_id)

    db.delete(doc)
    db.commit()
    return {"message": f"Successfully deleted document '{doc.title}' and purged associated vector chunks."}


@router.post("/reindex", status_code=status.HTTP_200_OK)
def reindex_all_documents(
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Re-index all documents in the knowledge base."""
    docs = db.query(KnowledgeDocument).all()
    total_chunks = 0
    reindexed_docs = 0

    for doc in docs:
        file_path = settings.KNOWLEDGE_BASE_DIR / doc.filename
        if file_path.exists():
            try:
                cnt = rag_service.ingest_document(
                    file_path=file_path,
                    title=doc.title,
                    category=doc.category,
                    document_id=doc.id
                )
                doc.chunk_count = cnt
                doc.is_indexed = True
                doc.ingestion_status = "Indexed"
                doc.error_message = None
                total_chunks += cnt
                reindexed_docs += 1
            except Exception as e:
                doc.ingestion_status = "Failed"
                doc.error_message = str(e)
        else:
            doc.ingestion_status = "Missing File"

    db.commit()
    return {
        "message": f"Successfully re-indexed {reindexed_docs} documents with {total_chunks} total chunks.",
        "documents_count": reindexed_docs,
        "chunks_count": total_chunks
    }


# ===================== FAQ ENDPOINTS =====================

@router.get("/faqs", response_model=List[FAQOut])
def list_faqs(
    category: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """List all active Frequently Asked Questions, with optional category filtering."""
    query = db.query(FAQ)
    if category:
        query = query.filter(FAQ.category.ilike(f"%{category}%"))
    return query.order_by(FAQ.faq_id).all()


@router.post("/faqs", response_model=FAQOut, status_code=status.HTTP_201_CREATED)
def create_faq(
    faq_in: FAQCreate,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Create a new FAQ entry (Admin only)."""
    existing = db.query(FAQ).filter(FAQ.faq_id == faq_in.faq_id.upper()).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"FAQ with identifier {faq_in.faq_id.upper()} already exists"
        )

    new_faq = FAQ(
        faq_id=faq_in.faq_id.upper().strip(),
        category=faq_in.category.strip(),
        question=faq_in.question.strip(),
        answer=faq_in.answer.strip(),
        is_active=faq_in.is_active
    )
    db.add(new_faq)
    db.commit()
    db.refresh(new_faq)
    return new_faq


@router.put("/faqs/{faq_id}", response_model=FAQOut)
def update_faq(
    faq_id: str,
    faq_update: FAQUpdate,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Update an existing FAQ entry (Admin only)."""
    faq = db.query(FAQ).filter(FAQ.faq_id == faq_id.upper()).first()
    if not faq:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="FAQ not found")

    if faq_update.category is not None:
        faq.category = faq_update.category.strip()
    if faq_update.question is not None:
        faq.question = faq_update.question.strip()
    if faq_update.answer is not None:
        faq.answer = faq_update.answer.strip()
    if faq_update.is_active is not None:
        faq.is_active = faq_update.is_active

    db.commit()
    db.refresh(faq)
    return faq


@router.delete("/faqs/{faq_id}", status_code=status.HTTP_200_OK)
def delete_faq(
    faq_id: str,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Delete an FAQ entry (Admin only)."""
    faq = db.query(FAQ).filter(FAQ.faq_id == faq_id.upper()).first()
    if not faq:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="FAQ not found")

    db.delete(faq)
    db.commit()
    return {"message": f"FAQ {faq_id.upper()} deleted successfully"}


# ===================== KNOWLEDGE SEARCH =====================

@router.get("/search", response_model=KnowledgeSearchResponse)
def search_knowledge(
    q: str = Query(..., min_length=2, description="Search query string"),
    top_k: int = Query(6, ge=1, le=20),
    db: Session = Depends(get_db)
):
    """
    Search the institutional knowledge base using the RAG vector store and keyword retrieval.
    Returns matched chunks with document title, category, similarity score, and text excerpt.
    """
    chunks = rag_service.search(query=q, top_k=top_k, min_score=0.10)
    results = [
        RetrievalChunk(
            document_title=c["title"],
            category=c["category"],
            chunk_text=c["chunk_text"],
            similarity_score=c["similarity_score"],
            page_number=c.get("page_number")
        )
        for c in chunks
    ]
    return KnowledgeSearchResponse(
        query=q,
        results=results,
        total_found=len(results)
    )
