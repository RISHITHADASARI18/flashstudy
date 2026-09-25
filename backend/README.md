# FlashStudy Backend

FastAPI backend for FlashStudy study-material uploads.

## What it does
- accepts PDF, DOCX, PPTX, TXT, Markdown, JPG, JPEG, PNG, and WEBP
- validates type and file size
- stores original uploads outside PostgreSQL
- extracts source-aware text
- stores content units with page/slide/image metadata
- exposes document list/detail/delete/retry APIs
- tracks uploaded -> processing -> ready or failed

## Run
1. Create a PostgreSQL database.
2. Copy .env.example to .env.
3. pip install -r requirements.txt
4. uvicorn app.main:app --reload

API docs: /docs

Development uses a server-side DEV_USER_ID until Clerk is activated. The browser never supplies an owner ID.

## API
GET /health
GET /api/v1/documents
POST /api/v1/documents
GET /api/v1/documents/{id}
DELETE /api/v1/documents/{id}
POST /api/v1/documents/{id}/retry


## Doubts API

- GET /api/v1/doubts — saved doubts for the current user
- POST /api/v1/doubts — ask and save a doubt
- PATCH /api/v1/doubts/{id} — mark a doubt resolved/unresolved
- DELETE /api/v1/doubts/{id} — remove a saved doubt

When a document is selected, retrieval is restricted to that user's document. The backend stores page/slide citations with each answer. If Ollama is running, the retrieved context is sent to the configured local model; otherwise the API returns a clear configuration fallback instead of inventing an answer.
