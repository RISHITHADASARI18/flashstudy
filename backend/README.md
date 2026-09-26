# FlashStudy Backend

FastAPI backend for FlashStudy study-material uploads and study generation.

## What it does
- accepts PDF, DOCX, PPTX, TXT, Markdown, JPG, JPEG, PNG, and WEBP
- validates type and file size
- stores original uploads outside PostgreSQL
- extracts source-aware text
- stores content units with page/slide/image metadata
- exposes document list/detail/download/delete/retry APIs
- tracks uploaded -> processing -> ready or failed
- stores doubts and their source citations
- generates grounded flashcards from uploaded study material
- stores flashcard reviews and next-review dates

## Run
1. Create a PostgreSQL database.
2. Copy .env.example to .env.
3. Install dependencies with `pip install -r requirements.txt`.
5. Start the API with `uvicorn app.main:app --reload`.

API docs: /docs

## AI generation

The AI provider is currently unconfigured. Flashcard generation uses a deterministic material-only fallback until a hosted AI provider is selected. It does not invent replacement facts.

## Flashcards API

- GET /api/v1/flashcards — saved cards for the current user
- GET /api/v1/flashcards?document_id={id} — cards for one document
- GET /api/v1/flashcards?due_only=true — cards currently due for review
- POST /api/v1/flashcards/generate — generate and save cards from one ready document
- PATCH /api/v1/flashcards/{id}/review — save Again/Hard/Good/Easy review
- DELETE /api/v1/flashcards/{id} — delete a saved card

Generation is limited to 30 cards per request. Each card keeps the source content-unit/page label used to ground the generation.

## Doubts API

- GET /api/v1/doubts — saved doubts for the current user
- POST /api/v1/doubts — ask and save a doubt
- PATCH /api/v1/doubts/{id} — mark a doubt resolved/unresolved
- DELETE /api/v1/doubts/{id} — remove a saved doubt

When a document is selected, retrieval is restricted to that user's document. The backend stores page/slide citations with each answer.

Development uses a server-side DEV_USER_ID until real authentication is activated. The browser never supplies an owner ID.

