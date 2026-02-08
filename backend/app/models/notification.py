"""
通知模型
"""
from sqlalchemy import Column, String, Boolean, ForeignKey, DateTime, Enum, Text
from sqlalchemy.sql import func
import uuid

from app.core.database import Base
from app.models.enums import NotificationType


class Notification(Base):
    __tablename__ = "notifications"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    resume_id = Column(String(36), ForeignKey("resumes.id"), nullable=True)
    title = Column(String(200), nullable=False)
    message = Column(Text, nullable=False)
    type = Column(Enum(NotificationType), default=NotificationType.INFO)
    is_read = Column(Boolean, default=False)
    
    # 提醒内容（用于二层复制发邮件）
    current_handler = Column(String(100), nullable=True)
    current_stage = Column(String(50), nullable=True)
    overdue_time = Column(String(50), nullable=True)
    
    link = Column(String(200), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    def __repr__(self):
        return f"<Notification {self.title} for {self.user_id}>"
