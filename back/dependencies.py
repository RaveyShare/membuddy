from fastapi import HTTPException, Depends, status, Header
from supabase import Client, create_client
import jwt
import logging
from config import settings
from database import get_anon_supabase

logger = logging.getLogger(__name__)

async def get_current_user(authorization: str = Header(...)):
    if not authorization or not authorization.startswith("Bearer "):
        logger.warning("Authorization header missing or invalid")
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authorization header missing or invalid")
    
    token = authorization.split(" ")[1]
    try:
        payload = jwt.decode(token, settings.SUPABASE_JWT_SECRET, algorithms=["HS256"])
        user_id = payload.get("sub")
        if user_id is None:
            logger.warning("Invalid token: 'sub' claim missing")
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token: 'sub' claim missing")
        
        user_info = {"id": user_id, "email": payload.get("email"), "full_name": payload.get("full_name", ""), "token": token}
        logger.info(f"User authenticated: {user_id}")
        return user_info
    except jwt.ExpiredSignatureError:
        logger.warning("Token has expired")
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token has expired")
    except jwt.InvalidTokenError as e:
        logger.warning(f"Invalid token: {e}")
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    except Exception as e:
        logger.error(f"Unexpected error during token validation: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Internal server error")

def get_supabase_authed(current_user: dict = Depends(get_current_user)) -> Client:
    supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)
    supabase.postgrest.auth(current_user['token'])
    return supabase