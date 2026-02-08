"""
工作流日志模型
"""
from sqlalchemy import Column, String, ForeignKey, DateTime, Enum, Text, Integer, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid

from app.core.database import Base
from app.models.enums import ActionType, ResumeStatus


class WorkflowLog(Base):
    __tablename__ = "workflow_logs"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    resume_id = Column(String(36), ForeignKey("resumes.id"), nullable=False, index=True)
    operator_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    action = Column(Enum(ActionType), nullable=False)
    previous_status = Column(Enum(ResumeStatus), nullable=True)
    new_status = Column(Enum(ResumeStatus), nullable=True)
    comment = Column(Text, nullable=True)
    metadata = Column(JSON, nullable=True)  # 额外信息
    duration_seconds = Column(Integer, nullable=True)  # 在上一状态停留时间
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # 关系
    resume = relationship("Resume", back_populates="workflow_logs")
    operator = relationship("User")
    
    def __repr__(self):
        return f"<WorkflowLog {self.action.value} on {self.resume_id}>"
