import json
import mimetypes
import re
from pathlib import Path
from uuid import UUID

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from fastapi.responses import FileResponse
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from ..ai import AIProviderError, generate_study_set
from ..auth import get_current_user_id
from ..config import get_settings
from ..db import get_db
from ..extractors import SUPPORTED_TYPES, detect_material_type, extract_content
from ..models import ContentUnit, Flashcard, QuizQuestion, StudyMaterial
from ..schemas import StudyMaterialDetail, StudyMaterialOut, StudySetGenerateResponse

router = APIRouter(prefix="/api/v1/documents", tags=["documents"])
settings = get_settings()
SAFE_NAME = re.compile(r"[^A-Za-z0-9._-]+")

def safe_filename(filename: str) -> str:
    cleaned = SAFE_NAME.sub("_", Path(filename).name).strip("._")
    return cleaned[:180] or "upload"

def validate_upload(file: UploadFile, data: bytes) -> str:
    if not file.filename:
        raise HTTPException(400, "A filename is required.")
    if len(data) > settings.max_upload_size_mb * 1024 * 1024:
        raise HTTPException(413, f"File is larger than {settings.max_upload_size_mb} MB.")
    material_type = detect_material_type(file.filename, file.content_type or "")
    if Path(file.filename).suffix.lower() not in SUPPORTED_TYPES or material_type is None:
        raise HTTPException(415, "Unsupported or mismatched file type. Use PDF, DOCX, or PPTX.")
    return material_type

def get_owned_document(db: Session, document_id: UUID, owner_id: str) -> StudyMaterial:
    doc = db.scalar(
        select(StudyMaterial)
        .where(StudyMaterial.id == document_id, StudyMaterial.owner_id == owner_id)
        .options(selectinload(StudyMaterial.content_units))
    )
    if doc is None:
        raise HTTPException(404, "Document not found.")
    return doc

def document_path(document: StudyMaterial) -> Path:
    root = Path(settings.storage_dir).resolve()
    path = (root / document.storage_key).resolve()
    if root not in path.parents:
        raise HTTPException(500, "Invalid document storage path.")
    return path

def process_document(db: Session, document: StudyMaterial, path: Path) -> None:
    document.status = "processing"
    document.error_message = None
    db.query(ContentUnit).filter(ContentUnit.material_id == document.id).delete()
    db.commit()
    try:
        units = extract_content(path, document.material_type)
        if not units:
            raise RuntimeError("No readable content was found in this file.")
        for unit in units:
            db.add(ContentUnit(
                material_id=document.id,
                position=unit.position,
                source_type=unit.source_type,
                source_number=unit.source_number,
                source_label=unit.source_label,
                text=unit.text,
            ))
        document.status = "ready"
        document.error_message = None
        db.commit()
    except Exception as exc:
        db.rollback()
        document.status = "failed"
        document.error_message = str(exc)[:1000]
        db.commit()
        raise

def _material_text(units: list[ContentUnit]) -> str:
    chunks = []
    total = 0
    limit = 90000
    for unit in units:
        chunk = f"[{unit.source_label}]\n{unit.text.strip()}"
        if not chunk.strip():
            continue
        remaining = limit - total
        if remaining <= 0:
            break
        piece = chunk[:remaining]
        chunks.append(piece)
        total += len(piece)
    return "\n\n".join(chunks)

def _save_ai_results(db: Session, document: StudyMaterial, units: list[ContentUnit], owner_id: str) -> tuple[int, int]:
    try:
        result = generate_study_set(_material_text(units), flashcard_count=10, quiz_count=10)
    except AIProviderError as exc:
        raise HTTPException(502, str(exc)) from exc

    units_by_label = {unit.source_label: unit for unit in units}
    flashcards = []
    quizzes = []

    for item in result["flashcards"]:
        if not isinstance(item.get("question"), str) or not isinstance(item.get("answer"), str):
            continue
        source = units_by_label.get(item.get("source_label")) or units[0]
        flashcards.append(Flashcard(
            owner_id=owner_id,
            document_id=document.id,
            source_unit_id=source.id,
            question=item["question"].strip(),
            answer=item["answer"].strip(),
            difficulty=item.get("difficulty", "Medium"),
        ))

    for item in result["quizzes"]:
        options = item.get("options")
        correct = item.get("correct_answer")
        if (
            not isinstance(item.get("question"), str)
            or not isinstance(options, list)
            or len(options) != 4
            or not isinstance(correct, str)
        ):
            continue
        source = units_by_label.get(item.get("source_label")) or units[0]
        quizzes.append(QuizQuestion(
            owner_id=owner_id,
            document_id=document.id,
            source_unit_id=source.id,
            question=item["question"].strip(),
            options_json=json.dumps([str(option) for option in options]),
            correct_answer=correct.strip(),
            explanation=str(item.get("explanation", "")).strip(),
            difficulty=item.get("difficulty", "Medium"),
        ))

    if not flashcards or not quizzes:
        raise HTTPException(422, "The AI could not create valid flashcards and quizzes from this material.")

    db.add_all(flashcards + quizzes)
    db.commit()
    return len(flashcards), len(quizzes)

@router.get("", response_model=list[StudyMaterialOut])
def list_documents(db: Session = Depends(get_db), owner_id: str = Depends(get_current_user_id)):
    return db.scalars(
        select(StudyMaterial)
        .where(StudyMaterial.owner_id == owner_id)
        .order_by(StudyMaterial.created_at.desc())
    ).all()

@router.post("", response_model=StudyMaterialDetail, status_code=status.HTTP_201_CREATED)
async def upload_document(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    owner_id: str = Depends(get_current_user_id),
):
    data = await file.read()
    material_type = validate_upload(file, data)
    original_name = safe_filename(file.filename or "upload")
    root = Path(settings.storage_dir)
    root.mkdir(parents=True, exist_ok=True)

    doc = StudyMaterial(
        owner_id=owner_id,
        original_filename=original_name,
        storage_key="pending",
        mime_type=file.content_type or mimetypes.guess_type(original_name)[0] or "application/octet-stream",
        material_type=material_type,
        size_bytes=len(data),
        status="uploaded",
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)

    storage_key = f"{doc.id}/{original_name}"
    path = (root / storage_key).resolve()
    if root.resolve() not in path.parents:
        db.delete(doc)
        db.commit()
        raise HTTPException(500, "Unable to create a safe storage path.")
    path.parent.mkdir(parents=True, exist_ok=True)

    try:
        path.write_bytes(data)
        doc.storage_key = storage_key
        db.commit()
        process_document(db, doc, path)
    except Exception:
        if path.exists():
            path.unlink()
        raise HTTPException(422, doc.error_message or "Could not process this file.")

    return get_owned_document(db, doc.id, owner_id)

@router.post("/generate", response_model=StudySetGenerateResponse, status_code=status.HTTP_201_CREATED)
async def upload_and_generate(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    owner_id: str = Depends(get_current_user_id),
):
    data = await file.read()
    material_type = validate_upload(file, data)
    original_name = safe_filename(file.filename or "upload")
    root = Path(settings.storage_dir)
    root.mkdir(parents=True, exist_ok=True)

    doc = StudyMaterial(
        owner_id=owner_id,
        original_filename=original_name,
        storage_key="pending",
        mime_type=file.content_type or mimetypes.guess_type(original_name)[0] or "application/octet-stream",
        material_type=material_type,
        size_bytes=len(data),
        status="uploaded",
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)

    path = (root / f"{doc.id}/{original_name}").resolve()
    if root.resolve() not in path.parents:
        db.delete(doc)
        db.commit()
        raise HTTPException(500, "Unable to create a safe storage path.")
    path.parent.mkdir(parents=True, exist_ok=True)

    try:
        path.write_bytes(data)
        doc.storage_key = f"{doc.id}/{original_name}"
        db.commit()
        process_document(db, doc, path)
        units = db.scalars(
            select(ContentUnit)
            .where(ContentUnit.material_id == doc.id)
            .order_by(ContentUnit.position)
        ).all()
        flashcard_count, quiz_count = _save_ai_results(db, doc, units, owner_id)
    except HTTPException:
        if path.exists():
            path.unlink()
        raise
    except Exception as exc:
        db.rollback()
        if path.exists():
            path.unlink()
        raise HTTPException(500, f"Could not generate study material: {str(exc)[:500]}") from exc

    return StudySetGenerateResponse(
        document_id=doc.id,
        filename=doc.original_filename,
        flashcards_created=flashcard_count,
        quizzes_created=quiz_count,
    )

@router.get("/{document_id}", response_model=StudyMaterialDetail)
def get_document(document_id: UUID, db: Session = Depends(get_db), owner_id: str = Depends(get_current_user_id)):
    return get_owned_document(db, document_id, owner_id)

@router.post("/{document_id}/retry", response_model=StudyMaterialDetail)
def retry_document(document_id: UUID, db: Session = Depends(get_db), owner_id: str = Depends(get_current_user_id)):
    doc = get_owned_document(db, document_id, owner_id)
    path = document_path(doc)
    if not path.exists():
        raise HTTPException(404, "Original upload is missing from storage.")
    try:
        process_document(db, doc, path)
    except Exception:
        pass
    return get_owned_document(db, doc.id, owner_id)

@router.delete("/{document_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_document(document_id: UUID, db: Session = Depends(get_db), owner_id: str = Depends(get_current_user_id)):
    doc = get_owned_document(db, document_id, owner_id)
    path = document_path(doc)
    if path.exists():
        path.unlink()
    db.delete(doc)
    db.commit()

@router.get("/{document_id}/download", response_class=FileResponse)
def download_document(document_id: UUID, db: Session = Depends(get_db), owner_id: str = Depends(get_current_user_id)):
    doc = get_owned_document(db, document_id, owner_id)
    path = document_path(doc)
    if not path.exists():
        raise HTTPException(404, "Original upload is missing from storage.")
    return FileResponse(path=path, media_type=doc.mime_type, filename=doc.original_filename)
