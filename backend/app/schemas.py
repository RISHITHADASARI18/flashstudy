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
