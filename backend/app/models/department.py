"""
部门模型
"""
from sqlalchemy import Column, String, Integer, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid

from app.core.database import Base


class Department(Base):
    __tablename__ = "departments"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(100), nullable=False)
    level = Column(Integer, nullable=False)  # 2=二层部门, 3=三层部门
    parent_id = Column(String(36), ForeignKey("departments.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # 关系
    parent = relationship("Department", remote_side=[id], back_populates="children")
    children = relationship("Department", back_populates="parent")
    users = relationship("User", back_populates="department")
    
    def __repr__(self):
        return f"<Department {self.name} (L{self.level})>"
