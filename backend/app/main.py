from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .config import get_settings
from .db import Base,engine
from .routers.documents import router as documents_router

@asynccontextmanager
async def lifespan(app:FastAPI):
    Base.metadata.create_all(bind=engine)
    yield

settings=get_settings()
app=FastAPI(title="FlashStudy API",version="1.0.0",description="Study-material upload and processing backend.",lifespan=lifespan)
app.add_middleware(CORSMiddleware,allow_origins=settings.allowed_origins,allow_credentials=True,allow_methods=["*"],allow_headers=["*"])
app.include_router(documents_router)

@app.get("/health")
def health()->dict[str,str]:
    return {"status":"ok","service":"flashstudy-api"}
