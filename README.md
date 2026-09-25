# FlashStudy

AI-powered study companion for students.

## Product architecture

FlashStudy is designed around **study material**, not PDF-only uploads. Students can upload PDFs, Word documents, PowerPoint slides, text files, and common images such as screenshots or handwritten notes.

### Supported study material

- PDF
- DOCX
- PPTX
- TXT / Markdown
- JPG / JPEG
- PNG
- WEBP

The upload layer validates file type and size, stores the original file, then sends it through a type-specific extraction pipeline.

### End-to-end flow

```
Student
  |
  v
Frontend upload
  |
  v
FastAPI backend
  |
  +--> Object storage (original file)
  |
  v
File-type router
  |
  +--> PDF   -> PyMuPDF -> page text
  +--> DOCX  -> document parser -> paragraphs
  +--> PPTX  -> slide parser -> slide text
  +--> TXT   -> text reader
  +--> Image -> OCR / vision extraction
  |
  v
Normalized content
  |
  v
Page/slide-aware chunks
  |
  +--> PostgreSQL (metadata, extracted content, user ownership)
  |
  +--> Embeddings
          |
          v
       pgvector
          |
          v
      RAG retrieval
          |
          v
       Groq AI
          |
     +----+---------+-----------+
     |              |           |
    Notes        Doubts     Flashcards
                                  |
                               Quizzes
                                  |
                               Progress
```

## Core backend components

### API
- FastAPI
- Pydantic
- SQLAlchemy
- Alembic

### Database
PostgreSQL stores:
- users / external auth IDs
- study materials
- extracted pages/slides/content
- chunks and embeddings
- notes
- doubts and answers
- flashcards
- quizzes and attempts
- review/progress data

pgvector stores embeddings so a student's question can retrieve relevant material.

### Storage

Original uploads should live in object storage rather than inside PostgreSQL. The database stores metadata and the storage key/URL.

The storage provider should be configurable so development can use one provider and production can use an S3-compatible provider without changing application logic.

### Extraction

Each supported file type gets its own extractor. Extracted content keeps source location metadata wherever possible:

- PDF: page number
- PPTX: slide number
- DOCX: paragraph/section where available
- Image: image identifier and OCR/vision result

This metadata is required for useful source citations in AI answers.

### AI and RAG

The AI layer must not answer study questions from general model knowledge when the question is about an uploaded source.

For a doubt:

1. Identify the student's selected document/material scope.
2. Embed the question.
3. Retrieve the most relevant chunks from pgvector.
4. Give only those chunks plus the question to the configured AI provider.
5. Generate an answer grounded in the retrieved material.
6. Return source locations such as `Page 7` or `Slide 12`.
7. If the material does not contain enough information, explicitly say so instead of inventing an answer.

Groq is the planned hosted AI provider. The provider layer should remain replaceable.

### Authentication and ownership

Clerk will provide authentication.

Every backend resource must be owned by the authenticated user. Backend authorization checks must prevent one student from reading another student's documents, doubts, notes, flashcards, quizzes, or progress.

Authentication should not depend on localStorage.

## Frontend routes

- `/` — landing
- `/login` — login alias
- `/signup` — signup alias
- `/dashboard` — study overview
- `/documents` — upload and material library
- `/doubts` — saved questions and answers
- `/flashcards` — generated/review cards
- `/quizzes` — generated quizzes
- `/progress` — learning progress
- `/settings` — account/preferences

## Upload UX

The Documents page uses a general **Upload study material** flow rather than a PDF-only flow.

Students can select multiple supported files. Each upload should show a processing state such as:

```
Uploading -> Processing -> Ready
                    \\-> Failed (with retry)
```

A ready material can link to its extracted content, generated notes, doubts, flashcards, and quizzes.

## Implementation phases

1. Frontend routes and study-material UI
2. FastAPI + PostgreSQL foundation
3. Object storage integration
4. Multi-format extraction pipeline
5. Chunking + embeddings + pgvector
6. Groq provider + grounded RAG
7. Notes, doubts, flashcards, quizzes
8. Progress and spaced review persistence
9. Clerk authentication and ownership enforcement
10. Production deployment and end-to-end testing

## Important architecture rule

Do **not** build the backend around a PDF-only abstraction. The core entity is a **StudyMaterial** with a `type`/MIME type and a type-specific extractor. This keeps images, slides, documents, and PDFs in the same student workflow and avoids a rewrite later.

<!-- Deployment trigger: keep GitHub/Vercel production in sync with the current main branch. -->
