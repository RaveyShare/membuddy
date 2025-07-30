from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel
import requests
import logging
import os
from typing import Optional

# 配置日志
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="WeChat Auth Service", version="1.0.0")

# CORS配置
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 生产环境请配置具体域名
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 微信配置
WECHAT_APP_ID = os.getenv("WECHAT_APP_ID")
WECHAT_APP_SECRET = os.getenv("WECHAT_APP_SECRET")
WECHAT_MINI_APP_ID = os.getenv("WECHAT_MINI_APP_ID")
WECHAT_MINI_APP_SECRET = os.getenv("WECHAT_MINI_APP_SECRET")

# 请求模型
class WeChatMPLoginRequest(BaseModel):
    code: str

class WeChatMiniLoginRequest(BaseModel):
    code: str

# 响应模型
class WeChatUserInfo(BaseModel):
    openid: str
    nickname: Optional[str] = None
    headimgurl: Optional[str] = None
    unionid: Optional[str] = None

@app.get("/")
async def root():
    return {"message": "WeChat Auth Service is running"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

@app.get("/MP_verify_mluLfyNcp0fnRTDW.txt")
async def wechat_verify():
    """微信域名验证文件"""
    return FileResponse("MP_verify_mluLfyNcp0fnRTDW.txt", media_type="text/plain")

@app.post("/auth/wechat/mp")
async def wechat_mp_login(request: WeChatMPLoginRequest):
    """微信公众号网页授权登录"""
    try:
        logger.info(f"微信公众号登录请求，code: {request.code}")
        
        # 第一步：通过code获取access_token
        token_url = "https://api.weixin.qq.com/sns/oauth2/access_token"
        token_params = {
            "appid": WECHAT_APP_ID,
            "secret": WECHAT_APP_SECRET,
            "code": request.code,
            "grant_type": "authorization_code"
        }
        
        logger.info(f"请求微信access_token，URL: {token_url}")
        logger.info(f"请求参数: {token_params}")
        
        token_response = requests.get(token_url, params=token_params, timeout=10)
        logger.info(f"微信access_token响应状态码: {token_response.status_code}")
        logger.info(f"微信access_token响应数据: {token_response.text}")
        
        if token_response.status_code != 200:
            logger.error(f"微信access_token请求失败，状态码: {token_response.status_code}")
            raise HTTPException(status_code=500, detail="微信登录失败")
        
        token_data = token_response.json()
        
        if "errcode" in token_data:
            logger.error(f"微信access_token错误: {token_data}")
            raise HTTPException(status_code=400, detail=f"微信登录失败: {token_data.get('errmsg', '未知错误')}")
        
        access_token = token_data.get("access_token")
        openid = token_data.get("openid")
        
        if not access_token or not openid:
            logger.error(f"微信access_token响应缺少必要字段: {token_data}")
            raise HTTPException(status_code=500, detail="微信登录失败")
        
        # 第二步：获取用户信息
        userinfo_url = "https://api.weixin.qq.com/sns/userinfo"
        userinfo_params = {
            "access_token": access_token,
            "openid": openid,
            "lang": "zh_CN"
        }
        
        logger.info(f"请求微信用户信息，URL: {userinfo_url}")
        logger.info(f"请求参数: {userinfo_params}")
        
        userinfo_response = requests.get(userinfo_url, params=userinfo_params, timeout=10)
        logger.info(f"微信用户信息响应状态码: {userinfo_response.status_code}")
        logger.info(f"微信用户信息响应数据: {userinfo_response.text}")
        
        if userinfo_response.status_code != 200:
            logger.error(f"微信用户信息请求失败，状态码: {userinfo_response.status_code}")
            raise HTTPException(status_code=500, detail="获取用户信息失败")
        
        userinfo_data = userinfo_response.json()
        
        if "errcode" in userinfo_data:
            logger.error(f"微信用户信息错误: {userinfo_data}")
            raise HTTPException(status_code=400, detail=f"获取用户信息失败: {userinfo_data.get('errmsg', '未知错误')}")
        
        # 返回用户信息
        user_info = WeChatUserInfo(
            openid=userinfo_data.get("openid"),
            nickname=userinfo_data.get("nickname"),
            headimgurl=userinfo_data.get("headimgurl"),
            unionid=userinfo_data.get("unionid")
        )
        
        logger.info(f"微信公众号登录成功，openid: {user_info.openid}")
        return {"success": True, "user_info": user_info.dict()}
        
    except requests.RequestException as e:
        logger.error(f"微信API请求异常: {str(e)}")
        raise HTTPException(status_code=500, detail="微信服务请求失败")
    except Exception as e:
        logger.error(f"微信公众号登录异常: {str(e)}")
        raise HTTPException(status_code=500, detail="微信登录失败")

@app.post("/auth/wechat/mini")
async def wechat_mini_login(request: WeChatMiniLoginRequest):
    """微信小程序登录"""
    try:
        logger.info(f"微信小程序登录请求，code: {request.code}")
        
        # 调用微信小程序code2Session接口
        url = "https://api.weixin.qq.com/sns/jscode2session"
        params = {
            "appid": WECHAT_MINI_APP_ID,
            "secret": WECHAT_MINI_APP_SECRET,
            "js_code": request.code,
            "grant_type": "authorization_code"
        }
        
        logger.info(f"请求微信小程序session，URL: {url}")
        logger.info(f"请求参数: {params}")
        
        response = requests.get(url, params=params, timeout=10)
        logger.info(f"微信小程序session响应状态码: {response.status_code}")
        logger.info(f"微信小程序session响应数据: {response.text}")
        
        if response.status_code != 200:
            logger.error(f"微信小程序session请求失败，状态码: {response.status_code}")
            raise HTTPException(status_code=500, detail="微信小程序登录失败")
        
        data = response.json()
        
        if "errcode" in data:
            logger.error(f"微信小程序session错误: {data}")
            raise HTTPException(status_code=400, detail=f"微信小程序登录失败: {data.get('errmsg', '未知错误')}")
        
        openid = data.get("openid")
        session_key = data.get("session_key")
        unionid = data.get("unionid")
        
        if not openid or not session_key:
            logger.error(f"微信小程序session响应缺少必要字段: {data}")
            raise HTTPException(status_code=500, detail="微信小程序登录失败")
        
        # 返回用户信息
        user_info = {
            "openid": openid,
            "session_key": session_key,
            "unionid": unionid
        }
        
        logger.info(f"微信小程序登录成功，openid: {openid}")
        return {"success": True, "user_info": user_info}
        
    except requests.RequestException as e:
        logger.error(f"微信API请求异常: {str(e)}")
        raise HTTPException(status_code=500, detail="微信服务请求失败")
    except Exception as e:
        logger.error(f"微信小程序登录异常: {str(e)}")
        raise HTTPException(status_code=500, detail="微信小程序登录失败")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)