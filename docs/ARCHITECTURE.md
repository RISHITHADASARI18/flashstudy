# FlashStudy Architecture

## Goal

FlashStudy accepts multiple kinds of student study material and turns that material into grounded study tools.

## Material types

| Type | Examples | Extraction |
|---|---|---|
| PDF | textbooks, notes, question papers | PyMuPDF |
| DOCX | notes, assignments | document parser |
| PPTX | lecture slides | slide parser |
| TXT/MD | typed notes | text reader |
| Images | screenshots, handwritten notes, board photos | OCR / vision extraction |

## Processing pipeline

```
Upload
  -> validate
  -> object storage
  -> create StudyMaterial record
  -> choose extractor
  -> normalize extracted content
  -> preserve source location
  -> chunk
  -> embed
  -> PostgreSQL + pgvector
  -> RAG retrieval
  -> Groq
  -> notes / doubts / flashcards / quizzes
  -> persist results and progress
```

## Data model direction

The central resource is `StudyMaterial`, not `PDF`.

Conceptually:

- User
- StudyMaterial
- ContentUnit (page, slide, document section, image)
- Chunk
- Embedding
- Note
- Doubt
- DoubtSource
- Flashcard
- Quiz
- QuizAttempt
- Review
- Progress

All records that belong to a student carry an ownership relationship to that authenticated user.

## Source citations

Content must retain source metadata so answers can cite the original material:

- PDF -> page
- PPTX -> slide
- DOCX -> section/paragraph when available
- Image -> image reference and extracted region when supported

If evidence is insufficient, the AI response should state that the uploaded material does not contain enough information.

## Storage separation

- Object storage: original uploads
- PostgreSQL: metadata and application state
- pgvector: semantic embeddings
- AI provider: generation only

Do not put original binary files into PostgreSQL unless there is a specific future requirement.

## Provider abstraction

Keep extraction, storage, embeddings, and AI behind small interfaces so providers can be replaced without rewriting the API.

Planned hosted AI provider: Groq.

Planned authentication: Clerk.

## Security

- Validate MIME type and extension on the server.
- Enforce file-size limits.
- Never trust a client-provided user ID.
- Authenticate every protected backend request.
- Check ownership before reading or modifying any study material or generated resource.
- Keep API secrets in environment variables.
- Do not store authentication tokens in localStorage.

## Processing status

Each material should have a lifecycle:

`uploaded -> processing -> ready`

or

`uploaded -> processing -> failed`

Failures should be visible to the student and retryable without losing the original upload.
