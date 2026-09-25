from datetime import datetime
from uuid import UUID, uuid4
from sqlalchemy import DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from .db import Base

class StudyMaterial(Base):
    __tablename__ = "study_materials"
    id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True, default=uuid4)
    owner_id: Mapped[str] = mapped_column(String(255), index=True)
    original_filename: Mapped[str] = mapped_column(String(255))
    storage_key: Mapped[str] = mapped_column(String(500), unique=True)
    mime_type: Mapped[str] = mapped_column(String(120))
    material_type: Mapped[str] = mapped_column(String(30), index=True)
    size_bytes: Mapped[int] = mapped_column(Integer)
    status: Mapped[str] = mapped_column(String(30), default="uploaded", index=True)
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    content_units: Mapped[list["ContentUnit"]] = relationship(back_populates="material", cascade="all, delete-orphan", order_by="ContentUnit.position")

class ContentUnit(Base):
    __tablename__ = "content_units"
    id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True, default=uuid4)
    material_id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), ForeignKey("study_materials.id", ondelete="CASCADE"), index=True)
    position: Mapped[int] = mapped_column(Integer)
    source_type: Mapped[str] = mapped_column(String(30))
    source_number: Mapped[int | None] = mapped_column(Integer, nullable=True)
    source_label: Mapped[str] = mapped_column(String(120))
    text: Mapped[str] = mapped_column(Text)
    material: Mapped[StudyMaterial] = relationship(back_populates="content_units")

class Doubt(Base):
    __tablename__ = "doubts"
    id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True, default=uuid4)
    owner_id: Mapped[str] = mapped_column(String(255), index=True)
    document_id: Mapped[UUID | None] = mapped_column(PGUUID(as_uuid=True), ForeignKey("study_materials.id", ondelete="SET NULL"), nullable=True, index=True)
    question: Mapped[str] = mapped_column(Text)
    answer: Mapped[str] = mapped_column(Text)
    citations: Mapped[str] = mapped_column(Text, default="[]")
    resolved: Mapped[bool] = mapped_column(default=False, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    document: Mapped[StudyMaterial | None] = relationship()

class Flashcard(Base):
    __tablename__ = "flashcards"
    id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True, default=uuid4)
    owner_id: Mapped[str] = mapped_column(String(255), index=True)
    document_id: Mapped[UUID | None] = mapped_column(PGUUID(as_uuid=True), ForeignKey("study_materials.id", ondelete="SET NULL"), nullable=True, index=True)
    source_unit_id: Mapped[UUID | None] = mapped_column(PGUUID(as_uuid=True), ForeignKey("content_units.id", ondelete="SET NULL"), nullable=True, index=True)
    question: Mapped[str] = mapped_column(Text)
    answer: Mapped[str] = mapped_column(Text)
    difficulty: Mapped[str] = mapped_column(String(20), default="Medium")
    review_rating: Mapped[str | None] = mapped_column(String(20), nullable=True)
    review_count: Mapped[int] = mapped_column(Integer, default=0)
    next_review_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    document: Mapped[StudyMaterial | None] = relationship()
    source_unit: Mapped[ContentUnit | None] = relationship()
