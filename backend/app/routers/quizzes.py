import json
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session
from ..auth import get_current_user_id
from ..db import get_db
from ..models import QuizQuestion, StudyMaterial
from ..schemas import QuizOut

router = APIRouter(prefix="/api/v1/quizzes", tags=["quizzes"])

def _to_out(quiz: QuizQuestion) -> QuizOut:
    return QuizOut(
        id=quiz.id, document_id=quiz.document_id, source_unit_id=quiz.source_unit_id,
        question=quiz.question, options=json.loads(quiz.options_json),
        correct_answer=quiz.correct_answer, explanation=quiz.explanation,
        difficulty=quiz.difficulty,
        source_label=quiz.source_unit.source_label if quiz.source_unit else None,
        created_at=quiz.created_at,
    )

@router.get("", response_model=list[QuizOut])
def list_quizzes(document_id: UUID | None = None, db: Session = Depends(get_db), owner_id: str = Depends(get_current_user_id)):
    query = select(QuizQuestion).where(QuizQuestion.owner_id == owner_id)
    if document_id is not None:
        query = query.where(QuizQuestion.document_id == document_id)
    quizzes = db.scalars(query.order_by(QuizQuestion.created_at.desc())).all()
    for quiz in quizzes:
        _ = quiz.source_unit
    return [_to_out(quiz) for quiz in quizzes]

@router.delete("/{quiz_id}", status_code=204)
def delete_quiz(quiz_id: UUID, db: Session = Depends(get_db), owner_id: str = Depends(get_current_user_id)):
    quiz = db.scalar(select(QuizQuestion).where(QuizQuestion.id == quiz_id, QuizQuestion.owner_id == owner_id))
    if quiz is None:
        raise HTTPException(404, "Quiz question not found.")
    db.delete(quiz)
    db.commit()
