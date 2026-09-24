from fastapi import HTTPException, status
from .config import get_settings

def get_current_user_id() -> str:
    settings=get_settings()
    if settings.auth_mode=="development":
        return settings.dev_user_id
    raise HTTPException(status_code=status.HTTP_501_NOT_IMPLEMENTED, detail="Clerk authentication is not enabled on the backend yet.")
