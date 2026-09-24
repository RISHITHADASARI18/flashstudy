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
