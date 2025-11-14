from fastapi import APIRouter, HTTPException, Depends, status
from gotrue.errors import AuthApiError
import jwt
import logging
import uuid
import requests
from datetime import datetime

from config import settings
import schemas
from dependencies import get_current_user
from mock_store import users, get_or_create_user, create_user

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/auth", tags=["authentication"])

@router.post("/register", response_model=schemas.User)
def register_user(user: schemas.UserCreate):
    u = users.get(user.email)
    if u:
        raise HTTPException(status_code=400, detail="User already exists")
    u = create_user(user.email, user.full_name or "", user.password)
    return schemas.User(id=uuid.UUID(u["id"]), email=u["email"], full_name=u["full_name"])

@router.post("/login")
def login(user: schemas.UserLogin):
    u = users.get(user.email)
    if not u:
        u = get_or_create_user(user.email, user.password)
    if u.get("password") != user.password:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    payload = {"sub": u["id"], "email": u["email"], "full_name": u["full_name"], "exp": datetime.utcnow().timestamp() + 86400}
    access_token = jwt.encode(payload, settings.SUPABASE_JWT_SECRET, algorithm="HS256")
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/forgot-password", status_code=status.HTTP_200_OK)
def forgot_password(payload: schemas.ForgotPasswordPayload):
    return {"message": "Password reset email sent successfully."}

@router.post("/reset-password", status_code=status.HTTP_200_OK)
def reset_password(payload: schemas.ResetPasswordPayload, current_user: dict = Depends(get_current_user)):
    uid = current_user["id"]
    for u in users.values():
        if u["id"] == uid:
            u["password"] = payload.password
            return {"message": "Password reset successfully."}
    raise HTTPException(status_code=404, detail="User not found")

# 微信认证路由
@router.post("/wechat/mini")
def wechat_mini_login(request: schemas.WechatMiniLoginRequest):
    """
    微信小程序登录
    """
    try:
        logger.info(f"WeChat mini login attempt with code: {request.code[:10]}...")
        
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
        
        logger.info(f"WeChat API response: {wx_data}")
        
        if "errcode" in wx_data:
            logger.error(f"WeChat API error: {wx_data}")
            raise HTTPException(status_code=400, detail=f"WeChat API error: {wx_data.get('errmsg', 'Unknown error')}")
        
        openid = wx_data.get("openid")
        unionid = wx_data.get("unionid")
        session_key = wx_data.get("session_key")
        
        if not openid:
            logger.error("Failed to get openid from WeChat")
            raise HTTPException(status_code=400, detail="Failed to get openid from WeChat")
        
        user_nickname = None
        user_avatar = None
        if request.user_info:
            user_nickname = request.user_info.nickname
            user_avatar = request.user_info.avatar_url
        u = None
        for x in users.values():
            if x.get("wechat_openid") == openid or (unionid and x.get("wechat_unionid") == unionid):
                u = x
                break
        if u:
            u["wechat_openid"] = openid
            u["wechat_unionid"] = unionid
            if user_nickname:
                u["wechat_nickname"] = user_nickname
            if user_avatar:
                u["wechat_avatar"] = user_avatar
        else:
            u = create_user(f"wechat_{openid}@membuddy.local", user_nickname or "微信用户", "")
            u["wechat_openid"] = openid
            u["wechat_unionid"] = unionid
            u["wechat_nickname"] = user_nickname
            u["wechat_avatar"] = user_avatar
        user_id = u["id"]
        email = u["email"]
        full_name = u["full_name"]
        wechat_openid = openid
        wechat_unionid = unionid
        wechat_nickname = u.get("wechat_nickname")
        wechat_avatar = u.get("wechat_avatar")
        
        # 3. 生成JWT token
        # Access token (1天过期)
        access_token_payload = {
            "sub": user_id,
            "email": email,
            "full_name": full_name,
            "exp": datetime.utcnow().timestamp() + 86400  # 1天过期
        }
        access_token = jwt.encode(access_token_payload, settings.SUPABASE_JWT_SECRET, algorithm="HS256")
        
        # Refresh token (30天过期)
        refresh_token_payload = {
            "sub": user_id,
            "type": "refresh",
            "exp": datetime.utcnow().timestamp() + 86400 * 30  # 30天过期
        }
        refresh_token = jwt.encode(refresh_token_payload, settings.SUPABASE_JWT_SECRET, algorithm="HS256")
        
        # 构建用户对象
        user_obj = schemas.User(
            id=user_id,
            email=email,
            full_name=full_name,
            wechat_openid=wechat_openid,
            wechat_unionid=wechat_unionid,
            wechat_nickname=wechat_nickname,
            wechat_avatar=wechat_avatar
        )
        
        logger.info(f"WeChat mini login successful for user: {user_id}")
        
        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer",
            "user": user_obj
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
def wechat_web_login(request: schemas.WechatWebLoginRequest):
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
        
        token_data = {"access_token": str(uuid.uuid4()), "openid": str(uuid.uuid4()), "unionid": str(uuid.uuid4())}
        
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
        
        userinfo_data = {"nickname": "微信用户", "headimgurl": ""}
        
        if "errcode" in userinfo_data:
            raise HTTPException(status_code=400, detail=f"WeChat userinfo error: {userinfo_data.get('errmsg', 'Unknown error')}")
        
        nickname = userinfo_data.get("nickname", "微信用户")
        avatar_url = userinfo_data.get("headimgurl")
        
        # 4. 查找或创建用户
        u = None
        for x in users.values():
            if x.get("wechat_openid") == openid or (unionid and x.get("wechat_unionid") == unionid):
                u = x
                break
        if u:
            u["wechat_openid"] = openid
            u["wechat_unionid"] = unionid
            u["wechat_nickname"] = nickname
            u["wechat_avatar"] = avatar_url
            user_id = u["id"]
            email = u.get("email", f"wechat_{openid}@membuddy.local")
            full_name = u.get("full_name") or nickname
        else:
            u = create_user(f"wechat_{openid}@membuddy.local", nickname, "")
            u["wechat_openid"] = openid
            u["wechat_unionid"] = unionid
            u["wechat_nickname"] = nickname
            u["wechat_avatar"] = avatar_url
            user_id = u["id"]
            email = u["email"]
            full_name = u["full_name"]
        
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
            "user": schemas.User(id=uuid.UUID(user_id), email=email, full_name=full_name)
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"WeChat web login error: {e}")
        raise HTTPException(status_code=500, detail="WeChat web login failed")

@router.post("/wechat/mp")
def wechat_mp_login(request: schemas.WechatWebLoginRequest):
    return wechat_web_login(request)