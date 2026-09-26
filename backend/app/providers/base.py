from typing import Protocol

class AIProvider(Protocol):
    def generate_flashcards(self, context: str, count: int) -> list[dict]:
        ...
