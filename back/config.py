from pydantic_settings import BaseSettings
from typing import Optional, List
import os
from dotenv import load_dotenv

load_dotenv()

class Settings(BaseSettings):
    # API Settings
    API_V1_STR: str = "/api"
    PROJECT_NAME: str = "MemBuddy"
    
    # Supabase
    SUPABASE_URL: str = os.getenv("SUPABASE_URL", "your-supabase-url-here")
    SUPABASE_KEY: str = os.getenv("SUPABASE_ANON_KEY", "your-supabase-key-here")
    SUPABASE_JWT_SECRET: str = os.getenv("SUPABASE_JWT_SECRET", "your-supabase-jwt-secret-here")

    # Gemini
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "your-gemini-api-key-here")
    
    # Google Cloud
    GOOGLE_CLOUD_PROJECT_ID: str = os.getenv("GOOGLE_CLOUD_PROJECT_ID", "your-google-cloud-project-id")
    GOOGLE_CLOUD_LOCATION: str = os.getenv("GOOGLE_CLOUD_LOCATION", "us-central1")
    
    # WeChat Configuration
    WECHAT_MINI_APP_ID: str = os.getenv("WECHAT_MINI_APP_ID", "")
    WECHAT_MINI_APP_SECRET: str = os.getenv("WECHAT_MINI_APP_SECRET", "")
    WECHAT_MP_APP_ID: str = os.getenv("WECHAT_MP_APP_ID", "")
    WECHAT_MP_APP_SECRET: str = os.getenv("WECHAT_MP_APP_SECRET", "")
    
    # Frontend
    FRONTEND_URL: str = os.getenv("FRONTEND_URL", "https://membuddy.ravey.site")

    # CORS
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:3000",  # React frontend
        "http://localhost:8000",  # FastAPI backend
        "https://membuddy.ravey.site",  # Custom domain
        "https://front-75934ladd-raveys-projects.vercel.app",  # Latest Vercel frontend
        "https://front-4jsgo8xpz-raveys-projects.vercel.app",  # Previous Vercel frontend
        "https://front-d19hf1aa7-raveys-projects.vercel.app",  # Previous Vercel frontend
        "https://*.vercel.app",  # All Vercel apps (wildcard)
    ]

    class Config:
        case_sensitive = True

settings = Settings()
