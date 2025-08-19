from fastapi import APIRouter, HTTPException, Depends, status
from supabase import Client
from gotrue.errors import AuthApiError
import jwt
import logging
import uuid
import requests
from datetime import datetime

from config import settings
from database import get_anon_supabase
import schemas
from dependencies import get_current_user, get_supabase_authed

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/auth", tags=["authentication"])

@router.post("/register", response_model=schemas.User)
def register_user(user: schemas.UserCreate, supabase: Client = Depends(get_anon_supabase)):
    try:
        # 构建重置密码页面的URL
        redirect_url = f"{settings.FRONTEND_URL}/auth/login"
        res = supabase.auth.sign_up({"email": user.email, "password": user.password, "options": {"data": {"full_name": user.full_name}}})
        if res.user:
            return schemas.User(id=res.user.id, email=res.user.email, full_name=res.user.user_metadata.get("full_name", ""))
        raise HTTPException(status_code=400, detail="Could not register user.")
    except AuthApiError as e:
        raise HTTPException(status_code=e.status, detail=e.message)

@router.post("/login")
def login(user: schemas.UserLogin, supabase: Client = Depends(get_anon_supabase)):
    try:
        res = supabase.auth.sign_in_with_password({"email": user.email, "password": user.password})
        access_token = jwt.encode({"sub": str(res.user.id), "email": res.user.email, "full_name": res.user.user_metadata.get("full_name", ""), "exp": res.session.expires_at}, settings.SUPABASE_JWT_SECRET, algorithm="HS256")
        return {"access_token": access_token, "token_type": "bearer"}
    except AuthApiError as e:
        raise HTTPException(status_code=e.status, detail=e.message)

@router.post("/forgot-password", status_code=status.HTTP_200_OK)
def forgot_password(payload: schemas.ForgotPasswordPayload, supabase: Client = Depends(get_anon_supabase)):
    try:
        # 构建重置密码页面的URL
        reset_url = f"{settings.FRONTEND_URL}/auth/reset-password"
        
        supabase.auth.reset_password_for_email(
            email=payload.email,
            options={"redirect_to": reset_url}
        )
        return {"message": "Password reset email sent successfully."}
    except Exception as e:
        logger.error(f"Forgot password attempt for {payload.email} resulted in error: {e}")
        return {"message": "If an account with this email exists, a password reset link has been sent."}

@router.post("/reset-password", status_code=status.HTTP_200_OK)
def reset_password(payload: schemas.ResetPasswordPayload, current_user: dict = Depends(get_current_user), supabase: Client = Depends(get_supabase_authed)):
    try:
        # 使用当前用户的token更新密码
        supabase.auth.update_user({
            "password": payload.password
        })
        return {"message": "Password reset successfully."}
    except AuthApiError as e:
        logger.error(f"Reset password attempt for user {current_user['id']} resulted in error: {e}")
        raise HTTPException(status_code=e.status, detail=e.message)
    except Exception as e:
        logger.error(f"Reset password attempt for user {current_user['id']} resulted in error: {e}")
        raise HTTPException(status_code=500, detail="Failed to reset password")

# 微信认证路由
@router.post("/wechat/mini", response_model=schemas.User)
def wechat_mini_login(request: schemas.WechatMiniLoginRequest, supabase: Client = Depends(get_anon_supabase)):
    """
    微信小程序登录
    """
    try:
        # 1. 向微信服务器验证 code
        wx_url = "https://api.weixin.qq.com/sns/jscode2session"
        params = {
            "appid": settings.WECHAT_MINI_APP_ID,
            "secret": settings.WECHAT_MINI_APP_SECRET,
            "js_code": request.code,
            "grant_type": "authorization_code"
        }
        
        response = requests.get(wx_url, params=params)
        wx_data = response.json()
        
        if "errcode" in wx_data:
            raise HTTPException(status_code=400, detail=f"WeChat API error: {wx_data.get('errmsg', 'Unknown error')}")
        
        openid = wx_data.get("openid")
        unionid = wx_data.get("unionid")
        session_key = wx_data.get("session_key")
        
        if not openid:
            raise HTTPException(status_code=400, detail="Failed to get openid from WeChat")
        
        # 2. 查找或创建用户
        user_query = supabase.table("users").select("*").eq("wechat_openid", openid)
        if unionid:
            user_query = user_query.or_(f"wechat_unionid.eq.{unionid}")
        
        existing_user = user_query.execute()
        
        if existing_user.data:
            # 用户已存在，更新信息
            user_data = existing_user.data[0]
            update_data = {
                "wechat_openid": openid,
                "wechat_unionid": unionid,
                "wechat_nickname": request.user_info.nickname if request.user_info else None,
                "wechat_avatar": request.user_info.avatar_url if request.user_info else None
            }
            supabase.table("users").update(update_data).eq("id", user_data["id"]).execute()
            user_id = user_data["id"]
            email = user_data.get("email", f"wechat_{openid}@membuddy.local")
            full_name = user_data.get("full_name") or (request.user_info.nickname if request.user_info else "微信用户")
        else:
            # 创建新用户
            new_user_data = {
                "id": str(uuid.uuid4()),
                "email": f"wechat_{openid}@membuddy.local",
                "full_name": request.user_info.nickname if request.user_info else "微信用户",
                "wechat_openid": openid,
                "wechat_unionid": unionid,
                "wechat_nickname": request.user_info.nickname if request.user_info else None,
                "wechat_avatar": request.user_info.avatar_url if request.user_info else None
            }
            
            result = supabase.table("users").insert(new_user_data).execute()
            if not result.data:
                raise HTTPException(status_code=500, detail="Failed to create user")
            
            user_id = new_user_data["id"]
            email = new_user_data["email"]
            full_name = new_user_data["full_name"]
        
        # 3. 生成JWT token
        access_token = jwt.encode({
            "sub": user_id,
            "email": email,
            "full_name": full_name,
            "exp": datetime.utcnow().timestamp() + 86400 * 30  # 30天过期
        }, settings.SUPABASE_JWT_SECRET, algorithm="HS256")
        
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": schemas.User(id=user_id, email=email, full_name=full_name)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"WeChat mini login error: {e}")
        raise HTTPException(status_code=500, detail="WeChat login failed")

@router.get("/wechat/qrcode", response_model=schemas.WechatQrCodeResponse)
def get_wechat_qrcode(request: schemas.WechatQrCodeRequest = Depends()):
    """
    生成微信网站应用授权二维码URL
    """
    try:
        # 生成随机state参数用于防CSRF攻击
        state = str(uuid.uuid4())
        
        # 构建微信授权URL
        redirect_uri = request.redirect_uri or f"{settings.FRONTEND_URL}/auth/wechat/callback"
        
        # 详细日志记录配置信息
        logger.info(f"WeChat QR Code Generation:")
        logger.info(f"  - WECHAT_WEB_APP_ID: {settings.WECHAT_WEB_APP_ID}")
        logger.info(f"  - FRONTEND_URL: {settings.FRONTEND_URL}")
        logger.info(f"  - redirect_uri: {redirect_uri}")
        logger.info(f"  - state: {state}")
        
        from urllib.parse import quote
        auth_url = (
            f"https://open.weixin.qq.com/connect/qrconnect?"
            f"appid={settings.WECHAT_WEB_APP_ID}&"
            f"redirect_uri={quote(redirect_uri, safe='')}&"
            f"response_type=code&"
            f"scope=snsapi_login&"
            f"state={state}#wechat_redirect"
        )
        
        logger.info(f"Generated WeChat auth URL: {auth_url}")
        
        return schemas.WechatQrCodeResponse(
            auth_url=auth_url,
            state=state
        )
        
    except Exception as e:
        logger.error(f"Generate WeChat QR code error: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate WeChat QR code")

@router.post("/wechat/web")
def wechat_web_login(request: schemas.WechatWebLoginRequest, supabase: Client = Depends(get_anon_supabase)):
    """
    处理微信网站应用登录
    """
    try:
        # 1. 验证state参数（这里简化处理，实际应用中应该存储state并验证）
        if not request.state:
            raise HTTPException(status_code=400, detail="Invalid state parameter")
        
        # 2. 使用code换取access_token
        token_url = "https://api.weixin.qq.com/sns/oauth2/access_token"
        token_params = {
            "appid": settings.WECHAT_WEB_APP_ID,
            "secret": settings.WECHAT_WEB_APP_SECRET,
            "code": request.code,
            "grant_type": "authorization_code"
        }
        
        token_response = requests.get(token_url, params=token_params)
        token_data = token_response.json()
        
        if "errcode" in token_data:
            raise HTTPException(status_code=400, detail=f"WeChat token error: {token_data.get('errmsg', 'Unknown error')}")
        
        access_token = token_data.get("access_token")
        openid = token_data.get("openid")
        unionid = token_data.get("unionid")
        
        if not access_token or not openid:
            raise HTTPException(status_code=400, detail="Failed to get access token or openid from WeChat")
        
        # 3. 获取用户信息
        userinfo_url = "https://api.weixin.qq.com/sns/userinfo"
        userinfo_params = {
            "access_token": access_token,
            "openid": openid
        }
        
        userinfo_response = requests.get(userinfo_url, params=userinfo_params)
        userinfo_data = userinfo_response.json()
        
        if "errcode" in userinfo_data:
            raise HTTPException(status_code=400, detail=f"WeChat userinfo error: {userinfo_data.get('errmsg', 'Unknown error')}")
        
        nickname = userinfo_data.get("nickname", "微信用户")
        avatar_url = userinfo_data.get("headimgurl")
        
        # 4. 查找或创建用户
        user_query = supabase.table("users").select("*").eq("wechat_openid", openid)
        if unionid:
            user_query = user_query.or_(f"wechat_unionid.eq.{unionid}")
        
        existing_user = user_query.execute()
        
        if existing_user.data:
            # 用户已存在，更新信息
            user_data = existing_user.data[0]
            update_data = {
                "wechat_openid": openid,
                "wechat_unionid": unionid,
                "wechat_nickname": nickname,
                "wechat_avatar": avatar_url
            }
            supabase.table("users").update(update_data).eq("id", user_data["id"]).execute()
            user_id = user_data["id"]
            email = user_data.get("email", f"wechat_{openid}@membuddy.local")
            full_name = user_data.get("full_name") or nickname
        else:
            # 创建新用户
            new_user_data = {
                "id": str(uuid.uuid4()),
                "email": f"wechat_{openid}@membuddy.local",
                "full_name": nickname,
                "wechat_openid": openid,
                "wechat_unionid": unionid,
                "wechat_nickname": nickname,
                "wechat_avatar": avatar_url
            }
            
            result = supabase.table("users").insert(new_user_data).execute()
            if not result.data:
                raise HTTPException(status_code=500, detail="Failed to create user")
            
            user_id = new_user_data["id"]
            email = new_user_data["email"]
            full_name = new_user_data["full_name"]
        
        # 5. 生成JWT token
        access_token = jwt.encode({
            "sub": user_id,
            "email": email,
            "full_name": full_name,
            "exp": datetime.utcnow().timestamp() + 86400 * 30  # 30天过期
        }, settings.SUPABASE_JWT_SECRET, algorithm="HS256")
        
        logger.info(f"WeChat web login successful for user: {user_id}")
        
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": schemas.User(id=user_id, email=email, full_name=full_name)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"WeChat web login error: {e}")
        raise HTTPException(status_code=500, detail="WeChat web login failed")