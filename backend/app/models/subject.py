from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship
from app.database.session import Base


class Subject(Base):
    __tablename__ = "subjects"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(50), unique=True, index=True, nullable=False)
    name = Column(String(255), nullable=False)
    department = Column(String(150), nullable=False, default="Computer Science & Engineering")
    semester = Column(Integer, nullable=False, default=5)
    faculty_name = Column(String(255), nullable=False)

    # Relationships
    feedbacks = relationship("Feedback", back_populates="subject", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Subject {self.code} - {self.name}>"
