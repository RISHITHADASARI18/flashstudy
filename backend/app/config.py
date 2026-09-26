from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    database_url: str = "postgresql+psycopg://postgres:postgres@localhost:5432/flashstudy"
    storage_dir: str = "./storage"
    max_upload_size_mb: int = 25
    auth_mode: str = "development"
    dev_user_id: str = "dev-user"
    frontend_origins: str = "http://localhost:3000,https://flashstudy-rila2.vercel.app"
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    @property
    def allowed_origins(self) -> list[str]:
        return [x.strip() for x in self.frontend_origins.split(",") if x.strip()]

@lru_cache
def get_settings() -> Settings:
    return Settings()
