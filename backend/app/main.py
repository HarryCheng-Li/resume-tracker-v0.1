"""
FastAPI 主入口
"""
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os

from app.core.config import settings
from app.api import auth, users, departments, resumes, notifications
from app.services.scheduler import start_scheduler, shutdown_scheduler


@asynccontextmanager
async def lifespan(app: FastAPI):
    """应用生命周期管理"""
    # 启动时
    start_scheduler()
    yield
    # 关闭时
    shutdown_scheduler()


# 创建应用
app = FastAPI(
    title="简历跟踪系统",
    description="内部简历流转跟踪系统API",
    version="1.0.0",
    lifespan=lifespan
)

# CORS配置
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 挂载静态文件（上传的简历）
upload_dir = settings.UPLOAD_DIR
if not os.path.exists(upload_dir):
    os.makedirs(upload_dir)
app.mount("/uploads", StaticFiles(directory=upload_dir), name="uploads")

# 注册路由
app.include_router(auth.router, prefix="/api/auth", tags=["认证"])
app.include_router(users.router, prefix="/api/users", tags=["用户管理"])
app.include_router(departments.router, prefix="/api/departments", tags=["部门管理"])
app.include_router(resumes.router, prefix="/api/resumes", tags=["简历管理"])
app.include_router(notifications.router, prefix="/api/notifications", tags=["通知"])


@app.get("/health")
def health_check():
    """健康检查"""
    return {"status": "healthy", "version": "1.0.0"}


@app.get("/")
def root():
    """根路径"""
    return {"message": "简历跟踪系统API", "docs": "/docs"}
