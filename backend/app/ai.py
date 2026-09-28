import json
from typing import Any

import httpx

from .config import get_settings


class AIProviderError(RuntimeError):
    pass


def generate_study_set(material_text: str, flashcard_count: int = 10, quiz_count: int = 10) -> dict[str, list[dict[str, Any]]]:
    settings = get_settings()
    if not settings.groq_api_key:
        raise AIProviderError("AI is not configured on the backend. Add GROQ_API_KEY in the Render environment.")

    prompt = f"""
You are the FlashStudy study assistant.

Use ONLY the supplied study material. Do not add outside facts. Create useful revision material for a college student.

Return one valid JSON object with exactly these top-level arrays:
"flashcards" and "quizzes".

Each flashcard must contain:
- "question": a clear question
- "answer": an accurate answer supported by the material
- "difficulty": exactly "Easy", "Medium", or "Hard"
- "source_label": the exact source label from the material

Each quiz must contain:
- "question": a multiple-choice question
- "options": exactly 4 answer choices
- "correct_answer": the exact text of the correct option
- "explanation": a short explanation grounded in the material
- "difficulty": exactly "Easy", "Medium", or "Hard"
- "source_label": the exact source label from the material

Create up to {flashcard_count} flashcards and up to {quiz_count} quizzes. Cover different parts of the material. Never invent information.

STUDY MATERIAL:
{material_text}
""".strip()

    payload = {
        "model": settings.groq_model,
        "messages": [
            {"role": "system", "content": "Generate strictly material-grounded study content and valid JSON."},
            {"role": "user", "content": prompt},
        ],
        "temperature": 0.2,
        "max_completion_tokens": 12000,
        "response_format": {"type": "json_object"},
    }

    try:
        with httpx.Client(timeout=120) as client:
            response = client.post(
                "https://api.groq.com/openai/v1/chat/completions",
                headers={"Authorization": f"Bearer {settings.groq_api_key}", "Content-Type": "application/json"},
                json=payload,
            )
            response.raise_for_status()
    except httpx.HTTPStatusError as exc:
        raise AIProviderError(f"Groq returned an error: {exc.response.text[:500]}") from exc
    except httpx.HTTPError as exc:
        raise AIProviderError("Could not reach the AI provider.") from exc

    try:
        content = response.json()["choices"][0]["message"]["content"]
        data = json.loads(content)
    except (KeyError, IndexError, TypeError, json.JSONDecodeError) as exc:
        raise AIProviderError("The AI returned an invalid study-set response.") from exc

    if not isinstance(data.get("flashcards"), list) or not isinstance(data.get("quizzes"), list):
        raise AIProviderError("The AI response did not contain valid flashcards and quizzes.")

    return {"flashcards": data["flashcards"], "quizzes": data["quizzes"]}
