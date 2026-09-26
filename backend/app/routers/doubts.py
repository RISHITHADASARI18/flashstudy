import json
from uuid import UUID

import httpx
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from ..auth import get_current_user_id
from ..config import get_settings
from ..db import get_db
from ..models import ContentUnit, Doubt, StudyMaterial
from ..providers.ollama import OllamaProvider
from ..schemas import DoubtCitation, DoubtCreate, DoubtOut, DoubtResolve

router = APIRouter(prefix="/api/v1/doubts", tags=["doubts"])
ai_provider = OllamaProvider()


def _citations(value: str) -> list[dict]:
    try:
        parsed = json.loads(value or "[]")
        return parsed if isinstance(parsed, list) else []
    except json.JSONDecodeError:
        return []


def _to_out(doubt: Doubt) -> DoubtOut:
    return DoubtOut(
        id=doubt.id,
        document_id=doubt.document_id,
        question=doubt.question,
        answer=doubt.answer,
        citations=[DoubtCitation(**item) for item in _citations(doubt.citations)],
        resolved=doubt.resolved,
        created_at=doubt.created_at,
        updated_at=doubt.updated_at,
    )


def _owned_document(db: Session, document_id: UUID, owner_id: str) -> StudyMaterial:
    document = db.scalar(
        select(StudyMaterial).where(
            StudyMaterial.id == document_id,
            StudyMaterial.owner_id == owner_id,
        )
    )
    if document is None:
        raise HTTPException(status_code=404, detail="Document not found.")
    if document.status != "ready":
        raise HTTPException(status_code=409, detail="This document is not ready for questions yet.")
    return document


def _retrieve_units(
    db: Session, question: str, owner_id: str, document_id: UUID | None
) -> list[ContentUnit]:
    base = (
        select(ContentUnit)
        .join(StudyMaterial, StudyMaterial.id == ContentUnit.material_id)
        .where(StudyMaterial.owner_id == owner_id, StudyMaterial.status == "ready")
    )
    if document_id is not None:
        base = base.where(ContentUnit.material_id == document_id)

    units = db.scalars(base.order_by(ContentUnit.position)).all()
    terms = [term.lower() for term in question.split() if len(term) >= 3]
    if not terms:
        return units[:5]

    scored = []
    for unit in units:
        text = unit.text.lower()
        score = sum(text.count(term) for term in terms)
        if score:
            scored.append((score, unit))
    scored.sort(key=lambda item: item[0], reverse=True)
    return [unit for _, unit in scored[:5]]


def _context(units: list[ContentUnit]) -> str:
    return "\n\n".join(f"[{unit.source_label}]\n{unit.text[:5000]}" for unit in units)[:25000]


def _fallback_answer(units: list[ContentUnit]) -> str:
    if not units:
        return "I could not find this information in the selected study material. Try asking with a term or topic that appears in your notes."
    labels = ", ".join(unit.source_label for unit in units[:3])
    return (
        "I found relevant material in your study notes, but the AI answer provider is not configured. "
        f"Relevant sources: {labels}. Configure Ollama locally to generate a grounded explanation."
    )


@router.get("", response_model=list[DoubtOut])
def list_doubts(
    resolved: bool | None = None,
    document_id: UUID | None = None,
    db: Session = Depends(get_db),
    owner_id: str = Depends(get_current_user_id),
):
    query = select(Doubt).where(Doubt.owner_id == owner_id)
    if resolved is not None:
        query = query.where(Doubt.resolved == resolved)
    if document_id is not None:
        query = query.where(Doubt.document_id == document_id)
    doubts = db.scalars(query.order_by(Doubt.created_at.desc())).all()
    return [_to_out(doubt) for doubt in doubts]


@router.post("", response_model=DoubtOut, status_code=status.HTTP_201_CREATED)
async def create_doubt(
    payload: DoubtCreate,
    db: Session = Depends(get_db),
    owner_id: str = Depends(get_current_user_id),
):
    question = payload.question.strip()
    if not question:
        raise HTTPException(status_code=422, detail="Question cannot be empty.")
    if len(question) > 4000:
        raise HTTPException(status_code=422, detail="Question is too long.")

    if payload.document_id is not None:
        _owned_document(db, payload.document_id, owner_id)

    units = _retrieve_units(db, question, owner_id, payload.document_id)
    answer = ai_provider.answer_doubt(question, _context(units))
    if answer is None:
        answer = _fallback_answer(units)

    citation_items = [
        {
            "content_unit_id": str(unit.id),
            "source_label": unit.source_label,
            "source_number": unit.source_number,
            "snippet": unit.text[:300].replace("\n", " "),
        }
        for unit in units
    ]

    doubt = Doubt(
        owner_id=owner_id,
        document_id=payload.document_id,
        question=question,
        answer=answer,
        citations=json.dumps(citation_items),
        resolved=False,
    )
    db.add(doubt)
    db.commit()
    db.refresh(doubt)
    return _to_out(doubt)


@router.patch("/{doubt_id}", response_model=DoubtOut)
def resolve_doubt(
    doubt_id: UUID,
    payload: DoubtResolve,
    db: Session = Depends(get_db),
    owner_id: str = Depends(get_current_user_id),
):
    doubt = db.scalar(
        select(Doubt).where(Doubt.id == doubt_id, Doubt.owner_id == owner_id)
    )
    if doubt is None:
        raise HTTPException(status_code=404, detail="Doubt not found.")
    doubt.resolved = payload.resolved
    db.commit()
    db.refresh(doubt)
    return _to_out(doubt)


@router.delete("/{doubt_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_doubt(
    doubt_id: UUID,
    db: Session = Depends(get_db),
    owner_id: str = Depends(get_current_user_id),
):
    doubt = db.scalar(
        select(Doubt).where(Doubt.id == doubt_id, Doubt.owner_id == owner_id)
    )
    if doubt is None:
        raise HTTPException(status_code=404, detail="Doubt not found.")
    db.delete(doubt)
    db.commit()
