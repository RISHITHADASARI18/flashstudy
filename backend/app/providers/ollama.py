import json
import httpx

from ..config import get_settings

class OllamaProvider:
    """Free local AI provider used for grounded study generation."""

    def _generate(self, prompt: str, timeout: float = 120) -> str | None:
        try:
            with httpx.Client(timeout=timeout) as client:
                response = client.post(
                    f"{self.settings.ollama_url.rstrip('/')}/api/generate",
                    json={"model": self.settings.ollama_model, "prompt": prompt, "stream": False},
                )
                response.raise_for_status()
                return response.json().get("response", "").strip() or None
        except (httpx.HTTPError, ValueError, json.JSONDecodeError):
            return None

    def answer_doubt(self, question: str, context: str) -> str | None:
        prompt = f"""You are FlashStudy, a study assistant.
Answer the student's question using ONLY the supplied study material.
If the material does not contain enough information, say that clearly instead of guessing.
Give a clear, student-friendly explanation.
Cite relevant source labels such as (Page 3) or (Slide 5). Do not invent source labels.

Question:
{question}

Study material:
{context}
"""
        return self._generate(prompt)


    """Free local AI provider. Runs the model through a local Ollama server."""

    def __init__(self) -> None:
        self.settings = get_settings()

    def generate_flashcards(self, context: str, count: int) -> list[dict]:
        prompt = f"""Create {count} useful study flashcards from ONLY the supplied study material.
Return ONLY a JSON array. Each item must have exactly these keys:
question, answer, difficulty, source_label.

difficulty must be exactly Easy, Medium, or Hard.
source_label must be copied from the supplied material's [source_label] marker.
Do not invent facts. Keep answers concise but complete.
Cover different source sections when possible.

Study material:
{context}
"""
        try:
            with httpx.Client(timeout=120) as client:
                response = client.post(
                    f"{self.settings.ollama_url.rstrip('/')}/api/generate",
                    json={
                        "model": self.settings.ollama_model,
                        "prompt": prompt,
                        "stream": False,
                    },
                )
                response.raise_for_status()
                raw = response.json().get("response", "").strip()

            if raw.startswith("```json"):
                raw = raw[7:]
            elif raw.startswith("```"):
                raw = raw[3:]
            if raw.endswith("```"):
                raw = raw[:-3]

            parsed = json.loads(raw.strip())
            if not isinstance(parsed, list):
                return []

            cards: list[dict] = []
            for item in parsed:
                if not isinstance(item, dict):
                    continue
                question = str(item.get("question", "")).strip()
                answer = str(item.get("answer", "")).strip()
                difficulty = str(item.get("difficulty", "Medium")).strip().title()
                source_label = str(item.get("source_label", "")).strip()
                if not question or not answer:
                    continue
                if difficulty not in {"Easy", "Medium", "Hard"}:
                    difficulty = "Medium"
                cards.append({
                    "question": question,
                    "answer": answer,
                    "difficulty": difficulty,
                    "source_label": source_label,
                })
            return cards[:count]
        except (httpx.HTTPError, ValueError, json.JSONDecodeError):
            return []
