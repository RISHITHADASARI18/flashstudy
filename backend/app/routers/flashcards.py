import json
from datetime import datetime, timedelta, timezone
from uuid import UUID
import httpx
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session
from ..auth import get_current_user_id
from ..config import get_settings
from ..db import get_db
from ..models import ContentUnit, Flashcard, StudyMaterial
from ..schemas import FlashcardGenerate, FlashcardGenerateResponse, FlashcardOut, FlashcardReview

router = APIRouter(prefix="/api/v1/flashcards", tags=["flashcards"])
settings = get_settings()
VALID_RATINGS = {"Again", "Hard", "Good", "Easy"}
REVIEW_DAYS = {"Again": 0, "Hard": 1, "Good": 3, "Easy": 7}

def _to_out(card: Flashcard) -> FlashcardOut:
    return FlashcardOut(id=card.id, document_id=card.document_id, source_unit_id=card.source_unit_id, question=card.question, answer=card.answer, difficulty=card.difficulty, review_rating=card.review_rating, review_count=card.review_count, next_review_at=card.next_review_at, created_at=card.created_at, updated_at=card.updated_at, source_label=card.source_unit.source_label if card.source_unit else None)

def _owned_document(db: Session, document_id: UUID, owner_id: str) -> StudyMaterial:
    document = db.scalar(select(StudyMaterial).where(StudyMaterial.id == document_id, StudyMaterial.owner_id == owner_id))
    if document is None: raise HTTPException(404, "Document not found.")
    if document.status != "ready": raise HTTPException(409, "This document is not ready for flashcards yet.")
    return document

def _generate_with_ollama(context: str, count: int) -> list[dict]:
    prompt = f"""Create {count} useful study flashcards from ONLY the supplied study material.
Return ONLY a JSON array. Each item must have exactly: question, answer, difficulty.
difficulty must be Easy, Medium, or Hard. Do not invent facts that are not in the material.
Questions should test important concepts, definitions, relationships, or procedures.
Answers should be concise but complete.

Study material:
{context}
"""
    try:
        with httpx.Client(timeout=120) as client:
            response = client.post(f"{settings.ollama_url.rstrip('/')}/api/generate", json={"model": settings.ollama_model, "prompt": prompt, "stream": False})
            response.raise_for_status()
            raw = response.json().get("response", "").strip()
            fence = chr(96) * 3
            if raw.startswith(fence + "json"): raw = raw[7:]
            if raw.endswith(fence): raw = raw[:-3]
            parsed = json.loads(raw.strip())
            if not isinstance(parsed, list): return []
            cards = []
            for item in parsed:
                if not isinstance(item, dict): continue
                q, a = str(item.get("question", "")).strip(), str(item.get("answer", "")).strip()
                d = str(item.get("difficulty", "Medium")).strip().title()
                if q and a: cards.append({"question": q, "answer": a, "difficulty": d if d in {"Easy", "Medium", "Hard"} else "Medium"})
            return cards[:count]
    except (httpx.HTTPError, ValueError, json.JSONDecodeError):
        return []

def _fallback_cards(units: list[ContentUnit], count: int) -> list[dict]:
    cards = []
    for unit in units:
        sentences = [s.strip() for s in unit.text.replace("\n", " ").split(".") if len(s.strip()) > 35]
        for sentence in sentences[:3]:
            words = sentence.split()
            if len(words) < 8: continue
            cards.append({"question": f"What does the study material explain about {' '.join(words[:6])}?", "answer": sentence + ".", "difficulty": "Medium"})
            if len(cards) >= count: return cards
    return cards

@router.get("", response_model=list[FlashcardOut])
def list_flashcards(document_id: UUID | None = None, db: Session = Depends(get_db), owner_id: str = Depends(get_current_user_id)):
    query = select(Flashcard).where(Flashcard.owner_id == owner_id)
    if document_id is not None: query = query.where(Flashcard.document_id == document_id)
    cards = db.scalars(query.order_by(Flashcard.created_at.desc())).all()\n    for card in cards: _ = card.source_unit\n    return [_to_out(card) for card in cards]

@router.post("/generate", response_model=FlashcardGenerateResponse, status_code=status.HTTP_201_CREATED)
def generate_flashcards(payload: FlashcardGenerate, db: Session = Depends(get_db), owner_id: str = Depends(get_current_user_id)):
    count = max(1, min(payload.count, 30))
    document = _owned_document(db, payload.document_id, owner_id)
    units = db.scalars(select(ContentUnit).where(ContentUnit.material_id == document.id).order_by(ContentUnit.position)).all()
    if not units: raise HTTPException(409, "This document has no extracted study content.")
    context = "\n\n".join(f"[{unit.source_label}]\n{unit.text[:6000]}" for unit in units)
    generated = _generate_with_ollama(context, count) or _fallback_cards(units, count)
    if not generated: raise HTTPException(422, "Could not generate flashcards from this document.")
    created = []
    for item in generated:
        card = Flashcard(owner_id=owner_id, document_id=document.id, source_unit_id=units[0].id, question=item["question"], answer=item["answer"], difficulty=item["difficulty"])
        db.add(card); created.append(card)
    db.commit()
    for card in created: db.refresh(card)
    return {"created": len(created), "cards": [_to_out(card) for card in created]}

@router.patch("/{card_id}/review", response_model=FlashcardOut)
def review_flashcard(card_id: UUID, payload: FlashcardReview, db: Session = Depends(get_db), owner_id: str = Depends(get_current_user_id)):
    if payload.rating not in VALID_RATINGS: raise HTTPException(422, "Rating must be Again, Hard, Good, or Easy.")
    card = db.scalar(select(Flashcard).where(Flashcard.id == card_id, Flashcard.owner_id == owner_id))
    if card is None: raise HTTPException(404, "Flashcard not found.")
    card.review_rating = payload.rating; card.review_count += 1
    card.next_review_at = datetime.now(timezone.utc) + timedelta(days=REVIEW_DAYS[payload.rating])
    db.commit(); db.refresh(card); _ = card.source_unit; return _to_out(card)

@router.delete("/{card_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_flashcard(card_id: UUID, db: Session = Depends(get_db), owner_id: str = Depends(get_current_user_id)):
    card = db.scalar(select(Flashcard).where(Flashcard.id == card_id, Flashcard.owner_id == owner_id))
    if card is None: raise HTTPException(404, "Flashcard not found.")
    db.delete(card); db.commit()
