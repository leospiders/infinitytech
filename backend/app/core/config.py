import os
import json
from dotenv import load_dotenv

load_dotenv()

class Settings:
    PROJECT_NAME: str = "Infinity Technology POS & Technical Service Management System"
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite+aiosqlite:///./infinity_tech.db")

    SUPABASE_URL: str = os.getenv("SUPABASE_URL", "")
    SUPABASE_ANON_KEY: str = os.getenv("SUPABASE_ANON_KEY", "")
    SUPABASE_JWT_SECRET: str = os.getenv("SUPABASE_JWT_SECRET", "")
    SUPABASE_SERVICE_ROLE_KEY: str = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
    MOCK_AUTH: bool = os.getenv("MOCK_AUTH", "False").lower() in ("true", "1", "yes")

    CORS_ORIGINS: list[str] = json.loads(os.getenv("CORS_ORIGINS", '["http://localhost:5173","http://127.0.0.1:5173","http://localhost:3000"]'))

    # Secret for generating short-lived share links (auto-generated fallback)
    SHARE_SECRET: str = os.getenv("SHARE_SECRET", "insecure-dev-share-secret-change-in-prod")

settings = Settings()
