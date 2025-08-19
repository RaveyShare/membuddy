from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import logging
import traceback
from datetime import datetime

# 导入路由模块
from routers import auth, memory_items, reviews, ai_generation, sharing

# --- 日志配置 ---
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
logger = logging.getLogger(__name__)

# 设置第三方库的日志级别
logging.getLogger("httpx").setLevel(logging.INFO)
logging.getLogger("httpcore").setLevel(logging.INFO)
logging.getLogger("hpack").setLevel(logging.INFO)
logging.getLogger("requests").setLevel(logging.INFO)
logging.getLogger("urllib3").setLevel(logging.INFO)
logging.getLogger("supabase").setLevel(logging.INFO)
logging.getLogger("postgrest").setLevel(logging.INFO)

# --- FastAPI应用初始化 ---
app = FastAPI(title="MemBuddy API")

# --- CORS中间件 ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",  # React frontend
        "http://localhost:8000",  # FastAPI backend
        "https://membuddy.ravey.site",  # Custom domain
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- 健康检查 ---
@app.get("/health")
def health_check():
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}

# --- 微信公众号授权回调处理 ---
@app.get("/auth/wechat/callback")
def wechat_callback(code: str = None, state: str = None):
    """
    微信公众号授权回调处理
    接收微信返回的授权码，重定向到前端页面
    """
    try:
        if not code:
            # 如果没有授权码，重定向到前端登录页面并显示错误
            return JSONResponse(
                status_code=400,
                content={"error": "授权失败", "message": "未获取到授权码"}
            )
        
        # 重定向到前端回调页面，传递授权码和状态
        from fastapi.responses import RedirectResponse
        frontend_callback_url = f"https://membuddy.ravey.site/auth/wechat/callback?code={code}"
        if state:
            frontend_callback_url += f"&state={state}"
        
        return RedirectResponse(url=frontend_callback_url)
        
    except Exception as e:
        logger.error(f"WeChat callback error: {e}")
        return JSONResponse(
            status_code=500,
            content={"error": "回调处理失败", "message": str(e)}
        )

# --- 注册路由 ---
app.include_router(auth.router)
app.include_router(memory_items.router)
app.include_router(reviews.router)
app.include_router(ai_generation.router)
app.include_router(sharing.router)

# --- 异常处理器 ---
@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    logger.warning(f"HTTP {exc.status_code} error: {exc.detail}")
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail, "status_code": exc.status_code}
    )

@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception: {exc}")
    logger.error(f"Traceback: {traceback.format_exc()}")
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error", "status_code": 500}
    )

if __name__ == "__main__":
    import uvicorn
    import os
    port = int(os.environ.get("PORT", 8000))
    logger.info(f"Starting MemBuddy API server on port {port}")
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=False)