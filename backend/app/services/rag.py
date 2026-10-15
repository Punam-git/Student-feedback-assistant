import os
import re
import json
import math
import hashlib
from pathlib import Path
from typing import List, Dict, Any, Optional, Tuple
from datetime import datetime

from app.core.config import settings

try:
    import pypdf
    HAS_PYPDF = True
except ImportError:
    HAS_PYPDF = False


class RAGVectorStore:
    """
    Lightweight, deterministic, pure-Python vector index using TF-IDF & Cosine Similarity.
    Persists locally in JSON, works 100% offline with zero native compilation dependencies.
    """
    def __init__(self, index_path: Optional[Path] = None):
        self.index_path = index_path or (settings.VECTOR_STORE_DIR / "vector_index.json")
        self.chunks: List[Dict[str, Any]] = []
        self.idf: Dict[str, float] = {}
        self.doc_vectors: List[Dict[str, float]] = []
        self.load_index()

    def _tokenize(self, text: str) -> List[str]:
        """Convert text into lowercase word tokens."""
        text = text.lower()
        words = re.findall(r"[a-z0-9_\-\u0900-\u097f]+", text)
        # Filter single characters except numbers
        return [w for w in words if len(w) > 1 or w.isdigit()]

    def _compute_tf(self, tokens: List[str]) -> Dict[str, float]:
        """Compute sublinear term frequency: 1 + log(tf)."""
        tf_raw: Dict[str, int] = {}
        for t in tokens:
            tf_raw[t] = tf_raw.get(t, 0) + 1
        
        tf_scaled: Dict[str, float] = {}
        for t, count in tf_raw.items():
            tf_scaled[t] = 1.0 + math.log(count)
        return tf_scaled

    def rebuild_model(self):
        """Recompute IDF values and unit-normalized TF-IDF vectors for all chunks."""
        N = len(self.chunks)
        if N == 0:
            self.idf = {}
            self.doc_vectors = []
            return

        # Document frequency (DF)
        df: Dict[str, int] = {}
        all_tfs: List[Dict[str, float]] = []

        for chunk in self.chunks:
            tokens = self._tokenize(chunk["text"])
            tf = self._compute_tf(tokens)
            all_tfs.append(tf)
            for term in tf.keys():
                df[term] = df.get(term, 0) + 1

        # Smooth IDF: log((N + 1) / (df + 1)) + 1
        self.idf = {}
        for term, doc_count in df.items():
            self.idf[term] = math.log((N + 1.0) / (doc_count + 1.0)) + 1.0

        # Build normalized TF-IDF vectors
        self.doc_vectors = []
        for tf in all_tfs:
            vec: Dict[str, float] = {}
            norm_sq = 0.0
            for term, tf_val in tf.items():
                w = tf_val * self.idf.get(term, 1.0)
                vec[term] = w
                norm_sq += w * w
            
            norm = math.sqrt(norm_sq) if norm_sq > 0 else 1.0
            unit_vec = {t: val / norm for t, val in vec.items()}
            self.doc_vectors.append(unit_vec)

    def add_chunks(self, new_chunks: List[Dict[str, Any]]):
        """Add new text chunks and update index."""
        self.chunks.extend(new_chunks)
        self.rebuild_model()
        self.save_index()

    def remove_document(self, document_id: int):
        """Remove all chunks belonging to a specific document."""
        self.chunks = [c for c in self.chunks if c.get("document_id") != document_id]
        self.rebuild_model()
        self.save_index()

    def search(self, query: str, top_k: int = 4, min_score: float = 0.15) -> List[Dict[str, Any]]:
        """
        Search indexed chunks by cosine similarity with the query.
        """
        if not self.chunks or not query.strip():
            return []

        q_tokens = self._tokenize(query)
        if not q_tokens:
            return []

        q_tf = self._compute_tf(q_tokens)
        q_vec: Dict[str, float] = {}
        norm_sq = 0.0
        for term, tf_val in q_tf.items():
            idf_val = self.idf.get(term, 0.5)
            w = tf_val * idf_val
            q_vec[term] = w
            norm_sq += w * w

        norm = math.sqrt(norm_sq) if norm_sq > 0 else 1.0
        q_unit = {t: val / norm for t, val in q_vec.items()}

        results: List[Tuple[float, Dict[str, Any]]] = []

        for idx, doc_vec in enumerate(self.doc_vectors):
            # Dot product of unit vectors = cosine similarity
            sim = 0.0
            for term, q_val in q_unit.items():
                if term in doc_vec:
                    sim += q_val * doc_vec[term]
            
            if sim >= min_score:
                results.append((sim, self.chunks[idx]))

        results.sort(key=lambda x: x[0], reverse=True)
        
        output = []
        for sim, chunk in results[:top_k]:
            output.append({
                "chunk_id": chunk.get("chunk_id"),
                "document_id": chunk.get("document_id"),
                "title": chunk.get("title", "Institutional Document"),
                "category": chunk.get("category", "General"),
                "chunk_text": chunk.get("text", ""),
                "similarity_score": round(sim, 3),
                "page_number": chunk.get("page_number")
            })
        return output

    def save_index(self):
        """Persist index to file."""
        data = {
            "version": "1.0",
            "saved_at": datetime.utcnow().isoformat(),
            "total_chunks": len(self.chunks),
            "chunks": self.chunks
        }
        with open(self.index_path, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)

    def load_index(self):
        """Load index from file if exists."""
        if self.index_path.exists():
            try:
                with open(self.index_path, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    self.chunks = data.get("chunks", [])
                    self.rebuild_model()
            except Exception:
                self.chunks = []
                self.rebuild_model()


class RAGPipeline:
    """
    Complete RAG ingestion, parsing, chunking, and retrieval pipeline.
    """
    def __init__(self):
        self.vector_store = RAGVectorStore()

    def extract_text(self, file_path: Path) -> List[Tuple[str, Optional[int]]]:
        """
        Extract clean text from supported files: .txt, .md, .json, .pdf.
        Returns a list of (text_content, optional_page_number) tuples.
        """
        suffix = file_path.suffix.lower()
        pages: List[Tuple[str, Optional[int]]] = []

        if suffix in [".txt", ".md"]:
            with open(file_path, "r", encoding="utf-8", errors="replace") as f:
                content = f.read()
                pages.append((content, 1))

        elif suffix == ".json":
            with open(file_path, "r", encoding="utf-8", errors="replace") as f:
                data = json.load(f)
                if isinstance(data, list):
                    # List of objects or FAQs
                    text_parts = []
                    for item in data:
                        if isinstance(item, dict):
                            parts = [f"{k}: {v}" for k, v in item.items() if v]
                            text_parts.append("\n".join(parts))
                        else:
                            text_parts.append(str(item))
                    pages.append(("\n\n---\n\n".join(text_parts), 1))
                elif isinstance(data, dict):
                    parts = [f"{k}: {v}" for k, v in data.items() if v]
                    pages.append(("\n".join(parts), 1))

        elif suffix == ".pdf":
            if not HAS_PYPDF:
                raise RuntimeError("pypdf is not installed. PDF parsing unavailable.")
            reader = pypdf.PdfReader(str(file_path))
            for page_idx, page in enumerate(reader.pages):
                text = page.extract_text() or ""
                if text.strip():
                    pages.append((text.strip(), page_idx + 1))

        else:
            raise ValueError(f"Unsupported file format: {suffix}")

        return pages

    def chunk_text(
        self,
        text: str,
        chunk_size: int = 500,
        chunk_overlap: int = 50
    ) -> List[str]:
        """
        Split text into semantically cohesive overlapping chunks.
        Splits preferentially by paragraphs, then sentences.
        """
        paragraphs = [p.strip() for p in text.split("\n\n") if p.strip()]
        chunks: List[str] = []
        current_chunk: List[str] = []
        current_len = 0

        for para in paragraphs:
            para_len = len(para)
            if current_len + para_len > chunk_size and current_chunk:
                chunks.append("\n\n".join(current_chunk))
                # Retain overlap from last paragraph if reasonable
                last = current_chunk[-1]
                if len(last) <= chunk_overlap:
                    current_chunk = [last, para]
                    current_len = len(last) + para_len
                else:
                    current_chunk = [para]
                    current_len = para_len
            else:
                current_chunk.append(para)
                current_len += para_len

        if current_chunk:
            chunks.append("\n\n".join(current_chunk))

        # Handle very large single paragraphs by sentence chunking
        final_chunks: List[str] = []
        for c in chunks:
            if len(c) > chunk_size * 2:
                sentences = re.split(r"(?<=[.!?])\s+", c)
                sub_c: List[str] = []
                sub_len = 0
                for s in sentences:
                    if sub_len + len(s) > chunk_size and sub_c:
                        final_chunks.append(" ".join(sub_c))
                        sub_c = [s]
                        sub_len = len(s)
                    else:
                        sub_c.append(s)
                        sub_len += len(s)
                if sub_c:
                    final_chunks.append(" ".join(sub_c))
            else:
                final_chunks.append(c)

        return [c.strip() for c in final_chunks if len(c.strip()) > 20]

    def ingest_document(
        self,
        file_path: Path,
        title: str,
        category: str,
        document_id: int
    ) -> int:
        """
        Extract text, chunk, and index an authorized document.
        Returns total number of chunks indexed.
        """
        # First remove any previous chunks from this document
        self.vector_store.remove_document(document_id)

        pages = self.extract_text(file_path)
        new_chunks = []
        chunk_index = 0

        for page_text, page_num in pages:
            chunks = self.chunk_text(page_text, chunk_size=500, chunk_overlap=50)
            for c_text in chunks:
                chunk_index += 1
                new_chunks.append({
                    "chunk_id": f"doc_{document_id}_c{chunk_index}",
                    "document_id": document_id,
                    "title": title,
                    "category": category,
                    "text": c_text,
                    "page_number": page_num,
                    "created_at": datetime.utcnow().isoformat()
                })

        if new_chunks:
            self.vector_store.add_chunks(new_chunks)

        return len(new_chunks)

    def search(self, query: str, top_k: int = 4, min_score: float = 0.15) -> List[Dict[str, Any]]:
        """Retrieve relevant source chunks for query."""
        return self.vector_store.search(query, top_k=top_k, min_score=min_score)

    def delete_document(self, document_id: int):
        """Remove document chunks from the vector store."""
        self.vector_store.remove_document(document_id)


# Global singleton instance
rag_service = RAGPipeline()
