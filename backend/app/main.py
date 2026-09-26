from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .config import get_settings
from .db import Base,engine
from .routers.documents import router as documents_router
from .routers.doubts import router as doubts_router
from .routers.flashcards import router as flashcards_router

@asynccontextmanager
async def lifespan(app:FastAPI):
    Base.metadata.create_all(bind=engine)
    yield

settings=get_settings()
app=FastAPI(title="FlashStudy API",version="1.0.0",description="Study-material upload and processing backend.",lifespan=lifespan)
app.add_middleware(CORSMiddleware,allow_origins=settings.allowed_origins,allow_origin_regex=settings.frontend_origin_regex,allow_credentials=True,allow_methods=["*"],allow_headers=["*"])
app.include_router(documents_router)
app.include_router(doubts_router)
app.include_router(flashcards_router)

@app.get("/health")
def health()->dict[str,str]:
    return {"status":"ok","service":"flashstudy-api"}
