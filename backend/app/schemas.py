from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, ConfigDict

class ContentUnitOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    position: int
    source_type: str
    source_number: int | None
    source_label: str
    text: str

class StudyMaterialOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    original_filename: str
    mime_type: str
    material_type: str
    size_bytes: int
    status: str
    error_message: str | None
    created_at: datetime
    updated_at: datetime

class StudyMaterialDetail(StudyMaterialOut):
    content_units: list[ContentUnitOut]

class DoubtCreate(BaseModel):
    question: str
    document_id: UUID | None = None

class DoubtCitation(BaseModel):
    content_unit_id: UUID
    source_label: str
    source_number: int | None = None
    snippet: str

class DoubtOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    document_id: UUID | None
    question: str
    answer: str
    citations: list[DoubtCitation]
    resolved: bool
    created_at: datetime
    updated_at: datetime

class DoubtResolve(BaseModel):
    resolved: bool

class FlashcardGenerate(BaseModel):
    document_id: UUID
    count: int = 10

class FlashcardOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    document_id: UUID | None
    source_unit_id: UUID | None
    question: str
    answer: str
    difficulty: str
    review_rating: str | None
    review_count: int
    next_review_at: datetime | None
    created_at: datetime
    updated_at: datetime

class FlashcardReview(BaseModel):
    rating: str

class FlashcardGenerateResponse(BaseModel):
    created: int
    cards: list[FlashcardOut]
