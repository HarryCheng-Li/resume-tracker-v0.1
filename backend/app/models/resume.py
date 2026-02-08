"""
简历模型
"""
from sqlalchemy import Column, String, Boolean, ForeignKey, DateTime, Enum, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid

from app.core.database import Base
from app.models.enums import ResumeStatus, Source


class Resume(Base):
    __tablename__ = "resumes"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    candidate_name = Column(String(100), nullable=False)
    email = Column(String(100), nullable=True)  # 二层填写
    phone = Column(String(50), nullable=True)   # 二层填写
    source = Column(Enum(Source), nullable=False)
    status = Column(Enum(ResumeStatus), default=ResumeStatus.POOL_HR, nullable=False)
    resume_url = Column(String(500), nullable=False)  # 文件路径
    
    # 部门关联
    l2_department_id = Column(String(36), ForeignKey("departments.id"), nullable=True)
    l3_department_id = Column(String(36), ForeignKey("departments.id"), nullable=True)
    
    # 人员关联
    uploader_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    current_handler_id = Column(String(36), ForeignKey("users.id"), nullable=True)
    expert_id = Column(String(36), ForeignKey("users.id"), nullable=True)
    
    # SLA相关
    sla_deadline = Column(DateTime(timezone=True), nullable=True)
    is_overdue = Column(Boolean, default=False)
    overdue_reason = Column(Text, nullable=True)
    
    # 时间戳
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # 关系
    l2_department = relationship("Department", foreign_keys=[l2_department_id])
    l3_department = relationship("Department", foreign_keys=[l3_department_id])
    uploader = relationship("User", foreign_keys=[uploader_id])
    current_handler = relationship("User", foreign_keys=[current_handler_id])
    expert = relationship("User", foreign_keys=[expert_id])
    workflow_logs = relationship("WorkflowLog", back_populates="resume", order_by="WorkflowLog.created_at.desc()")
    
    def __repr__(self):
        return f"<Resume {self.candidate_name} ({self.status.value})>"
