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

    # CORS
    BACKEND_CORS_ORIGINS: list = [
        "http://localhost:3000",  # React frontend
        "http://localhost:8000",  # FastAPI backend
        "https://front-d19hf1aa7-raveys-projects.vercel.app",  # Vercel frontend
        "https://*.vercel.app",  # All Vercel apps
        "https://*.onrender.com",  # Render apps
    ]

    class Config:
        case_sensitive = True

settings = Settings()
