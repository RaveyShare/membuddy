from supabase import create_client, Client
from config import settings


def get_anon_supabase() -> Client:
    url = settings.SUPABASE_URL
    key = settings.SUPABASE_KEY
    if not url or url == "your-supabase-url-here" or not key or key == "your-supabase-key-here":
        raise RuntimeError("缺少 SUPABASE_URL/SUPABASE_ANON_KEY 环境变量，后端无法连接 Supabase")
    return create_client(url, key)
