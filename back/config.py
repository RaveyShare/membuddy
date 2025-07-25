from pydantic_settings import BaseSettings
from typing import Optional
import os
from dotenv import load_dotenv

load_dotenv()

class Settings(BaseSettings):
    # API Settings
    API_V1_STR: str = "/api"
    PROJECT_NAME: str = "MemBuddy"
    
    # Supabase
    SUPABASE_URL: str = os.getenv("SUPABASE_URL", "your-supabase-url-here")
    SUPABASE_KEY: str = os.getenv("SUPABASE_KEY", "your-supabase-key-here")
    SUPABASE_JWT_SECRET: str = os.getenv("SUPABASE_JWT_SECRET", "your-supabase-jwt-secret-here")

    # Gemini
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "your-gemini-api-key-here")
    
    # Frontend
    FRONTEND_URL: str = os.getenv("FRONTEND_URL", "https://membuddy.ravey.site")

    # CORS
    BACKEND_CORS_ORIGINS: list = [
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
