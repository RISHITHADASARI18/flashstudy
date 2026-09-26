import json
import httpx

from ..config import get_settings

class OllamaProvider:
    """Free local AI provider used for grounded study generation."""
    def __init__(self) -> None:
        self.settings = get_settings()

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

    def generate_flashcards(self, context: str, count: int) -> list[dict]:
        prompt = (f"Create {count} useful study flashcards from ONLY the supplied study material.\n"
                  "Return ONLY a JSON array. Each item must have exactly these keys: question, answer, difficulty, source_label.\n"
                  "difficulty must be exactly Easy, Medium, or Hard.\n"
                  "source_label must be copied from the supplied material marker. Do not invent facts.\n\n"
                  f"Study material:\n{context}")
        raw = self._generate(prompt)
        if not raw: return []
        if raw.startswith("```json"): raw = raw[7:]
        elif raw.startswith("```"): raw = raw[3:]
        if raw.endswith("```"): raw = raw[:-3]
        try: parsed = json.loads(raw.strip())
        except (ValueError, json.JSONDecodeError): return []
        if not isinstance(parsed, list): return []
        cards = []
        for item in parsed:
            if not isinstance(item, dict): continue
            question = str(item.get("question", "")).strip()
            answer = str(item.get("answer", "")).strip()
            difficulty = str(item.get("difficulty", "Medium")).strip().title()
            source_label = str(item.get("source_label", "")).strip()
            if not question or not answer: continue
            if difficulty not in {"Easy", "Medium", "Hard"}: difficulty = "Medium"
            cards.append({"question": question, "answer": answer, "difficulty": difficulty, "source_label": source_label})
        return cards[:count]

    def answer_doubt(self, question: str, context: str) -> str | None:
        prompt = ("You are FlashStudy, a study assistant.\n"
                  "Answer the student question using ONLY the supplied study material.\n"
                  "If there is not enough information, say so instead of guessing.\n"
                  "Give a clear student-friendly explanation and cite relevant source labels.\n\n"
                  f"Question:\n{question}\n\nStudy material:\n{context}")
        return self._generate(prompt)