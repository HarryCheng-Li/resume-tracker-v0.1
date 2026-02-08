"""
SLA检查服务 - 超期检测和提醒
"""
from datetime import datetime
from typing import List
from sqlalchemy.orm import Session

from app.models import Resume, User, Notification
from app.models.enums import ResumeStatus, Role, NotificationType
from app.core.config import settings


class SLAService:
    """SLA超期检查服务"""
    
    # 需要检查SLA的状态
    SLA_STATUSES = [
        ResumeStatus.WAIT_IDENTIFY,
        ResumeStatus.WAIT_CONNECTION,
        ResumeStatus.WAIT_FEEDBACK,
    ]
    
    def __init__(self, db: Session):
        self.db = db
    
    def check_overdue_resumes(self) -> List[Resume]:
        """检查所有超期简历"""
        now = datetime.utcnow()
        overdue_resumes = self.db.query(Resume).filter(
            Resume.status.in_(self.SLA_STATUSES),
            Resume.sla_deadline < now,
            Resume.is_overdue == False
        ).all()
        
        for resume in overdue_resumes:
            resume.is_overdue = True
            self._send_overdue_notification(resume)
        
        if overdue_resumes:
            self.db.commit()
        
        return overdue_resumes
    
    def check_upcoming_deadlines(self, hours_before: int = 4) -> List[Resume]:
        """检查即将超期的简历（提前提醒）"""
        from datetime import timedelta
        now = datetime.utcnow()
        threshold = now + timedelta(hours=hours_before)
        
        upcoming_resumes = self.db.query(Resume).filter(
            Resume.status.in_(self.SLA_STATUSES),
            Resume.sla_deadline > now,
            Resume.sla_deadline <= threshold,
            Resume.is_overdue == False
        ).all()
        
        for resume in upcoming_resumes:
            self._send_reminder_notification(resume)
        
        return upcoming_resumes
    
    def _get_status_name(self, status: ResumeStatus) -> str:
        """获取状态显示名称"""
        names = {
            ResumeStatus.WAIT_IDENTIFY: "待识别",
            ResumeStatus.WAIT_CONNECTION: "待建联",
            ResumeStatus.WAIT_FEEDBACK: "待反馈",
        }
        return names.get(status, str(status.value))
    
    def _get_handler_name(self, resume: Resume) -> str:
        """获取当前责任人名称"""
        if resume.current_handler:
            return resume.current_handler.username
        if resume.expert:
            return resume.expert.username
        return "未指定"
    
    def _calculate_overdue_time(self, resume: Resume) -> str:
        """计算超期时长"""
        if not resume.sla_deadline:
            return "未知"
        now = datetime.utcnow()
        if resume.sla_deadline > now:
            return "未超期"
        
        delta = now - resume.sla_deadline
        hours = int(delta.total_seconds() / 3600)
        if hours < 24:
            return f"{hours}小时"
        days = hours // 24
        return f"{days}天{hours % 24}小时"
    
    def _send_overdue_notification(self, resume: Resume) -> None:
        """发送超期通知"""
        handler_name = self._get_handler_name(resume)
        stage_name = self._get_status_name(resume.status)
        overdue_time = self._calculate_overdue_time(resume)
        
        # 通知当前责任人
        if resume.current_handler_id:
            notification = Notification(
                user_id=resume.current_handler_id,
                resume_id=resume.id,
                title=f"⚠️ 简历已超期",
                message=f"简历【{resume.candidate_name}】在【{stage_name}】阶段已超期{overdue_time}，请尽快处理！",
                type=NotificationType.URGENT,
                current_handler=handler_name,
                current_stage=stage_name,
                overdue_time=overdue_time,
                link=f"/resumes/{resume.id}"
            )
            self.db.add(notification)
        
        # 通知二层经理（如果有）
        if resume.l2_department_id:
            l2_managers = self.db.query(User).filter(
                User.department_id == resume.l2_department_id,
                User.role == Role.L2_MANAGER,
                User.is_active == True
            ).all()
            
            for manager in l2_managers:
                if manager.id != resume.current_handler_id:
                    notification = Notification(
                        user_id=manager.id,
                        resume_id=resume.id,
                        title=f"⚠️ 简历超期提醒",
                        message=f"简历【{resume.candidate_name}】已超期，当前责任人：{handler_name}，当前环节：{stage_name}，超期时间：{overdue_time}",
                        type=NotificationType.WARNING,
                        current_handler=handler_name,
                        current_stage=stage_name,
                        overdue_time=overdue_time,
                        link=f"/resumes/{resume.id}"
                    )
                    self.db.add(notification)
    
    def _send_reminder_notification(self, resume: Resume) -> None:
        """发送即将超期提醒"""
        handler_name = self._get_handler_name(resume)
        stage_name = self._get_status_name(resume.status)
        
        # 计算剩余时间
        if resume.sla_deadline:
            delta = resume.sla_deadline - datetime.utcnow()
            hours_left = max(0, int(delta.total_seconds() / 3600))
            time_left = f"{hours_left}小时" if hours_left > 0 else "不足1小时"
        else:
            time_left = "未知"
        
        if resume.current_handler_id:
            notification = Notification(
                user_id=resume.current_handler_id,
                resume_id=resume.id,
                title=f"📢 简历即将超期",
                message=f"简历【{resume.candidate_name}】在【{stage_name}】阶段将于{time_left}后超期，请及时处理！",
                type=NotificationType.WARNING,
                current_handler=handler_name,
                current_stage=stage_name,
                link=f"/resumes/{resume.id}"
            )
            self.db.add(notification)
    
    def get_overdue_summary(self) -> dict:
        """获取超期统计摘要"""
        overdue_count = self.db.query(Resume).filter(
            Resume.is_overdue == True
        ).count()
        
        by_status = {}
        for status in self.SLA_STATUSES:
            count = self.db.query(Resume).filter(
                Resume.status == status,
                Resume.is_overdue == True
            ).count()
            if count > 0:
                by_status[status.value] = count
        
        return {
            "total_overdue": overdue_count,
            "by_status": by_status
        }
