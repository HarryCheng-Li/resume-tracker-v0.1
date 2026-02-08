"""
通知管理路由
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime

from app.core.database import get_db
from app.models import Notification, User
from app.models.enums import NotificationType
from app.api.deps import get_current_user

router = APIRouter()


class NotificationResponse(BaseModel):
    id: str
    resume_id: Optional[str] = None
    title: str
    message: str
    type: str
    is_read: bool
    current_handler: Optional[str] = None
    current_stage: Optional[str] = None
    overdue_time: Optional[str] = None
    link: Optional[str] = None
    created_at: datetime
    
    class Config:
        from_attributes = True


class NotificationCount(BaseModel):
    total: int
    unread: int


@router.get("/", response_model=List[NotificationResponse])
def list_notifications(
    unread_only: bool = Query(False),
    limit: int = Query(50, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """获取当前用户的通知列表"""
    query = db.query(Notification).filter(
        Notification.user_id == current_user.id
    )
    
    if unread_only:
        query = query.filter(Notification.is_read == False)
    
    notifications = query.order_by(
        Notification.created_at.desc()
    ).limit(limit).all()
    
    return [NotificationResponse(
        id=n.id,
        resume_id=n.resume_id,
        title=n.title,
        message=n.message,
        type=n.type.value,
        is_read=n.is_read,
        current_handler=n.current_handler,
        current_stage=n.current_stage,
        overdue_time=n.overdue_time,
        link=n.link,
        created_at=n.created_at
    ) for n in notifications]


@router.get("/count", response_model=NotificationCount)
def get_notification_count(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """获取通知数量统计"""
    total = db.query(Notification).filter(
        Notification.user_id == current_user.id
    ).count()
    
    unread = db.query(Notification).filter(
        Notification.user_id == current_user.id,
        Notification.is_read == False
    ).count()
    
    return NotificationCount(total=total, unread=unread)


@router.put("/{notification_id}/read")
def mark_as_read(
    notification_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """标记通知为已读"""
    notification = db.query(Notification).filter(
        Notification.id == notification_id,
        Notification.user_id == current_user.id
    ).first()
    
    if not notification:
        raise HTTPException(status_code=404, detail="通知不存在")
    
    notification.is_read = True
    db.commit()
    return {"message": "已标记为已读"}


@router.put("/read-all")
def mark_all_as_read(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """标记所有通知为已读"""
    db.query(Notification).filter(
        Notification.user_id == current_user.id,
        Notification.is_read == False
    ).update({"is_read": True})
    db.commit()
    return {"message": "已全部标记为已读"}


@router.delete("/{notification_id}")
def delete_notification(
    notification_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """删除通知"""
    notification = db.query(Notification).filter(
        Notification.id == notification_id,
        Notification.user_id == current_user.id
    ).first()
    
    if not notification:
        raise HTTPException(status_code=404, detail="通知不存在")
    
    db.delete(notification)
    db.commit()
    return {"message": "删除成功"}
