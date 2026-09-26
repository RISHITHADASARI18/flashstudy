import json
import os
import urllib.request

url = os.getenv("OLLAMA_URL", "http://127.0.0.1:11434").rstrip("/")
model = os.getenv("OLLAMA_MODEL", "llama3.2")
prompt = """Create 2 study flashcards from ONLY this material.
Return ONLY a JSON array. Each item must have exactly these keys:
question, answer, difficulty, source_label.
difficulty must be Easy, Medium, or Hard.
source_label must be copied exactly.

Study material:
[Page 1]
A database is an organized collection of related data. A DBMS is software
used to create, store, retrieve, and manage databases.
"""
payload = json.dumps({"model": model, "prompt": prompt, "stream": False}).encode()
request = urllib.request.Request(f"{url}/api/generate", data=payload, headers={"Content-Type": "application/json"}, method="POST")
with urllib.request.urlopen(request, timeout=120) as response:
    body = json.load(response)
raw = body.get("response", "").strip()
if raw.startswith("```json"): raw = raw[7:]
elif raw.startswith("```"): raw = raw[3:]
if raw.endswith("```"): raw = raw[:-3]
cards = json.loads(raw.strip())
if not isinstance(cards, list) or not cards: raise SystemExit("Ollama returned no flashcards.")
for card in cards:
    if not isinstance(card, dict): raise SystemExit("Ollama returned a non-object flashcard.")
    for key in ("question", "answer", "difficulty", "source_label"):
        if not str(card.get(key, "")).strip(): raise SystemExit(f"Missing required field: {key}")
    if card["difficulty"] not in {"Easy", "Medium", "Hard"}: raise SystemExit("Invalid difficulty returned by Ollama.")
    if card["source_label"] != "Page 1": raise SystemExit("Ollama did not preserve the source label.")
print(f"Ollama generation test passed: {len(cards)} card(s) generated.")
print(json.dumps(cards, indent=2))