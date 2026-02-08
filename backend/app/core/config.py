"""
应用配置
"""
from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    # 数据库
    DATABASE_URL: str = "postgresql://postgres:postgres123@db:5432/resume_tracker"
    
    # JWT
    SECRET_KEY: str = "your-super-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 480  # 8小时
    
    # 文件上传
    UPLOAD_DIR: str = "/app/uploads"
    MAX_UPLOAD_SIZE: int = 10 * 1024 * 1024  # 10MB
    ALLOWED_EXTENSIONS: set = {".pdf", ".doc", ".docx"}
    
    # SLA配置（小时）
    SLA_IDENTIFY_HOURS: int = 24       # 识别：1天
    SLA_CONNECTION_HOURS: int = 24     # 建联：1天
    SLA_FEEDBACK_HOURS: int = 120      # 反馈：5天
    
    # CORS
    CORS_ORIGINS: list = ["http://localhost:5173", "http://localhost:3000"]
    
    class Config:
        env_file = ".env"
        extra = "allow"


settings = Settings()
