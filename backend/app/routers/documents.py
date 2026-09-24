import mimetypes
import re
from pathlib import Path
from uuid import UUID
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload
from ..auth import get_current_user_id
from ..config import get_settings
from ..db import get_db
from ..extractors import SUPPORTED_TYPES, detect_material_type, extract_content
from ..models import ContentUnit, StudyMaterial
from ..schemas import StudyMaterialDetail, StudyMaterialOut

router=APIRouter(prefix="/api/v1/documents",tags=["documents"])
settings=get_settings()
SAFE_NAME=re.compile(r"[^A-Za-z0-9._-]+")

def safe_filename(filename:str)->str:
    cleaned=SAFE_NAME.sub("_",Path(filename).name).strip("._")
    return cleaned[:180] or "upload"

def validate_upload(file:UploadFile,data:bytes)->str:
    if not file.filename: raise HTTPException(400,"A filename is required.")
    if len(data)>settings.max_upload_size_mb*1024*1024:
        raise HTTPException(413,f"File is larger than {settings.max_upload_size_mb} MB.")
    material_type=detect_material_type(file.filename,file.content_type or "")
    if Path(file.filename).suffix.lower() not in SUPPORTED_TYPES or material_type is None:
        raise HTTPException(415,"Unsupported or mismatched file type.")
    return material_type

def get_owned_document(db:Session,document_id:UUID,owner_id:str)->StudyMaterial:
    doc=db.scalar(select(StudyMaterial).where(StudyMaterial.id==document_id,StudyMaterial.owner_id==owner_id).options(selectinload(StudyMaterial.content_units)))
    if doc is None: raise HTTPException(404,"Document not found.")
    return doc

def process_document(db:Session,document:StudyMaterial,path:Path)->None:
    document.status="processing"; document.error_message=None
    db.query(ContentUnit).filter(ContentUnit.material_id==document.id).delete()
    db.commit()
    try:
        for unit in extract_content(path,document.material_type):
            db.add(ContentUnit(material_id=document.id,position=unit.position,source_type=unit.source_type,source_number=unit.source_number,source_label=unit.source_label,text=unit.text))
        document.status="ready"
        db.commit()
    except Exception as exc:
        document.status="failed"; document.error_message=str(exc)[:1000]; db.commit()
        raise

@router.get("",response_model=list[StudyMaterialOut])
def list_documents(db:Session=Depends(get_db),owner_id:str=Depends(get_current_user_id)):
    return db.scalars(select(StudyMaterial).where(StudyMaterial.owner_id==owner_id).order_by(StudyMaterial.created_at.desc())).all()

@router.post("",response_model=StudyMaterialDetail,status_code=status.HTTP_201_CREATED)
async def upload_document(file:UploadFile=File(...),db:Session=Depends(get_db),owner_id:str=Depends(get_current_user_id)):
    data=await file.read()
    material_type=validate_upload(file,data)
    original_name=safe_filename(file.filename or "upload")
    root=Path(settings.storage_dir); root.mkdir(parents=True,exist_ok=True)
    doc=StudyMaterial(owner_id=owner_id,original_filename=original_name,storage_key="pending",mime_type=file.content_type or mimetypes.guess_type(original_name)[0] or "application/octet-stream",material_type=material_type,size_bytes=len(data),status="uploaded")
    db.add(doc); db.commit(); db.refresh(doc)
    storage_key=f"{owner_id}/{doc.id}_{original_name}"
    path=root/storage_key; path.parent.mkdir(parents=True,exist_ok=True); path.write_bytes(data)
    doc.storage_key=storage_key; db.commit()
    try: process_document(db,doc,path)
    except Exception: pass
    return get_owned_document(db,doc.id,owner_id)

@router.get("/{document_id}",response_model=StudyMaterialDetail)
def get_document(document_id:UUID,db:Session=Depends(get_db),owner_id:str=Depends(get_current_user_id)):
    return get_owned_document(db,document_id,owner_id)

@router.post("/{document_id}/retry",response_model=StudyMaterialDetail)
def retry_document(document_id:UUID,db:Session=Depends(get_db),owner_id:str=Depends(get_current_user_id)):
    doc=get_owned_document(db,document_id,owner_id)
    path=Path(settings.storage_dir)/doc.storage_key
    if not path.exists(): raise HTTPException(404,"Original upload is missing from storage.")
    try: process_document(db,doc,path)
    except Exception: pass
    return get_owned_document(db,doc.id,owner_id)

@router.delete("/{document_id}",status_code=status.HTTP_204_NO_CONTENT)
def delete_document(document_id:UUID,db:Session=Depends(get_db),owner_id:str=Depends(get_current_user_id)):
    doc=get_owned_document(db,document_id,owner_id)
    path=Path(settings.storage_dir)/doc.storage_key
    if path.exists(): path.unlink()
    db.delete(doc); db.commit()
