from supabase import create_client, Client
from config import settings

def get_anon_supabase() -> Client:
    return create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)
