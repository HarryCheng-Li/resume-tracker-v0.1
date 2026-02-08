"""
简历工作流服务 - 核心业务逻辑
"""
from datetime import datetime, timedelta
from typing import Optional, List, Tuple
from sqlalchemy.orm import Session

from app.models import Resume, User, Department, WorkflowLog, Notification
from app.models.enums import ResumeStatus, ActionType, Role, NotificationType
from app.core.config import settings


class WorkflowService:
    """简历工作流服务"""
    
    # 状态转换规则
    STATUS_TRANSITIONS = {
        ResumeStatus.POOL_HR: [ResumeStatus.POOL_L2],
        ResumeStatus.POOL_L2: [ResumeStatus.POOL_L3],
        ResumeStatus.POOL_L3: [ResumeStatus.WAIT_IDENTIFY],
        ResumeStatus.WAIT_IDENTIFY: [ResumeStatus.WAIT_CONTACT_INFO, ResumeStatus.REJECTED],
        ResumeStatus.WAIT_CONTACT_INFO: [ResumeStatus.WAIT_CONNECTION],
        ResumeStatus.WAIT_CONNECTION: [ResumeStatus.WAIT_FEEDBACK, ResumeStatus.RELEASED],
        ResumeStatus.WAIT_FEEDBACK: [ResumeStatus.ARCHIVED, ResumeStatus.RELEASED],
        ResumeStatus.RELEASED: [ResumeStatus.POOL_L2],  # 释放后回到二层重新分发
        ResumeStatus.REJECTED: [],
        ResumeStatus.ARCHIVED: [],
    }
    
    # 状态对应的SLA（小时）
    STATUS_SLA = {
        ResumeStatus.WAIT_IDENTIFY: settings.SLA_IDENTIFY_HOURS,
        ResumeStatus.WAIT_CONNECTION: settings.SLA_CONNECTION_HOURS,
        ResumeStatus.WAIT_FEEDBACK: settings.SLA_FEEDBACK_HOURS,
    }
    
    # 状态显示名称
    STATUS_NAMES = {
        ResumeStatus.POOL_HR: "待分发(HR)",
        ResumeStatus.POOL_L2: "待分发(二层)",
        ResumeStatus.POOL_L3: "待指派专家",
        ResumeStatus.WAIT_IDENTIFY: "待识别",
        ResumeStatus.WAIT_CONTACT_INFO: "待填联系方式",
        ResumeStatus.WAIT_CONNECTION: "待建联",
        ResumeStatus.WAIT_FEEDBACK: "待反馈",
        ResumeStatus.ARCHIVED: "已归档",
        ResumeStatus.RELEASED: "已释放",
        ResumeStatus.REJECTED: "不识别",
    }
    
    def __init__(self, db: Session):
        self.db = db
    
    def _calculate_duration(self, resume: Resume) -> int:
        """计算在当前状态停留的秒数"""
        if resume.updated_at:
            return int((datetime.utcnow() - resume.updated_at).total_seconds())
        return int((datetime.utcnow() - resume.created_at).total_seconds())
    
    def _set_sla_deadline(self, resume: Resume, status: ResumeStatus) -> None:
        """设置SLA截止时间"""
        if status in self.STATUS_SLA:
            hours = self.STATUS_SLA[status]
            resume.sla_deadline = datetime.utcnow() + timedelta(hours=hours)
        else:
            resume.sla_deadline = None
    
    def _log_action(
        self,
        resume: Resume,
        operator: User,
        action: ActionType,
        prev_status: ResumeStatus,
        new_status: ResumeStatus,
        comment: str = None,
        metadata: dict = None
    ) -> WorkflowLog:
        """记录工作流日志"""
        duration = self._calculate_duration(resume)
        log = WorkflowLog(
            resume_id=resume.id,
            operator_id=operator.id,
            action=action,
            previous_status=prev_status,
            new_status=new_status,
            comment=comment,
            metadata=metadata,
            duration_seconds=duration
        )
        self.db.add(log)
        return log
    
    def _create_notification(
        self,
        user_id: str,
        resume: Resume,
        title: str,
        message: str,
        notification_type: NotificationType = NotificationType.INFO,
        current_handler: str = None,
        current_stage: str = None,
        overdue_time: str = None
    ) -> Notification:
        """创建通知"""
        notification = Notification(
            user_id=user_id,
            resume_id=resume.id,
            title=title,
            message=message,
            type=notification_type,
            current_handler=current_handler,
            current_stage=current_stage,
            overdue_time=overdue_time,
            link=f"/resumes/{resume.id}"
        )
        self.db.add(notification)
        return notification
    
    def _get_l2_managers(self, department_id: str) -> List[User]:
        """获取二层部门的经理"""
        dept = self.db.query(Department).filter(Department.id == department_id).first()
        if not dept:
            return []
        # 如果是三层部门，获取其父级（二层部门）的经理
        target_dept_id = dept.parent_id if dept.level == 3 else dept.id
        return self.db.query(User).filter(
            User.department_id == target_dept_id,
            User.role == Role.L2_MANAGER,
            User.is_active == True
        ).all()
    
    # ==================== 业务操作 ====================
    
    def distribute_to_l2(
        self,
        resume: Resume,
        operator: User,
        l2_department_id: str
    ) -> Resume:
        """HR分发给二层部门"""
        if resume.status != ResumeStatus.POOL_HR:
            raise ValueError(f"当前状态不允许此操作: {resume.status}")
        
        prev_status = resume.status
        resume.l2_department_id = l2_department_id
        resume.status = ResumeStatus.POOL_L2
        resume.current_handler_id = None  # 待二层认领
        
        self._log_action(resume, operator, ActionType.DISTRIBUTE_L2, prev_status, resume.status)
        
        # 通知二层经理
        for manager in self._get_l2_managers(l2_department_id):
            self._create_notification(
                manager.id, resume,
                f"新简历待分发",
                f"简历【{resume.candidate_name}】已分发至您的部门，请及时处理。",
                NotificationType.INFO
            )
        
        self.db.commit()
        return resume
    
    def distribute_to_l3(
        self,
        resume: Resume,
        operator: User,
        l3_department_id: str
    ) -> Resume:
        """二层分发给三层部门"""
        if resume.status != ResumeStatus.POOL_L2:
            raise ValueError(f"当前状态不允许此操作: {resume.status}")
        
        prev_status = resume.status
        resume.l3_department_id = l3_department_id
        resume.status = ResumeStatus.POOL_L3
        resume.current_handler_id = operator.id
        
        self._log_action(resume, operator, ActionType.DISTRIBUTE_L3, prev_status, resume.status)
        
        # 通知三层助理
        assistants = self.db.query(User).filter(
            User.department_id == l3_department_id,
            User.role == Role.L3_ASSISTANT,
            User.is_active == True
        ).all()
        for assistant in assistants:
            self._create_notification(
                assistant.id, resume,
                f"新简历待指派专家",
                f"简历【{resume.candidate_name}】已分发至您的团队，请指派专家。",
                NotificationType.INFO
            )
        
        self.db.commit()
        return resume
    
    def assign_expert(
        self,
        resume: Resume,
        operator: User,
        expert_id: str
    ) -> Resume:
        """三层指派专家"""
        if resume.status != ResumeStatus.POOL_L3:
            raise ValueError(f"当前状态不允许此操作: {resume.status}")
        
        expert = self.db.query(User).filter(User.id == expert_id).first()
        if not expert or expert.role != Role.EXPERT:
            raise ValueError("无效的专家ID")
        
        prev_status = resume.status
        resume.expert_id = expert_id
        resume.current_handler_id = expert_id
        resume.status = ResumeStatus.WAIT_IDENTIFY
        self._set_sla_deadline(resume, resume.status)
        
        self._log_action(resume, operator, ActionType.ASSIGN_EXPERT, prev_status, resume.status)
        
        # 通知专家
        self._create_notification(
            expert_id, resume,
            f"新简历待识别",
            f"简历【{resume.candidate_name}】已指派给您，请在{settings.SLA_IDENTIFY_HOURS}小时内完成识别。",
            NotificationType.INFO
        )
        
        self.db.commit()
        return resume
    
    def identify(
        self,
        resume: Resume,
        operator: User,
        identified: bool,
        comment: str = None
    ) -> Resume:
        """专家识别"""
        if resume.status != ResumeStatus.WAIT_IDENTIFY:
            raise ValueError(f"当前状态不允许此操作: {resume.status}")
        if operator.id != resume.expert_id:
            raise ValueError("只有指派的专家才能进行识别")
        
        prev_status = resume.status
        
        if identified:
            resume.status = ResumeStatus.WAIT_CONTACT_INFO
            action = ActionType.IDENTIFY_YES
            # 通知二层填写联系方式
            for manager in self._get_l2_managers(resume.l2_department_id):
                self._create_notification(
                    manager.id, resume,
                    f"请填写联系方式",
                    f"专家已识别简历【{resume.candidate_name}】，请联系推荐人获取联系方式并填写。",
                    NotificationType.WARNING
                )
        else:
            resume.status = ResumeStatus.REJECTED
            action = ActionType.IDENTIFY_NO
        
        resume.is_overdue = False
        resume.sla_deadline = None
        
        self._log_action(resume, operator, action, prev_status, resume.status, comment)
        self.db.commit()
        return resume
    
    def fill_contact_info(
        self,
        resume: Resume,
        operator: User,
        email: str = None,
        phone: str = None
    ) -> Resume:
        """二层填写联系方式"""
        if resume.status != ResumeStatus.WAIT_CONTACT_INFO:
            raise ValueError(f"当前状态不允许此操作: {resume.status}")
        
        if not email and not phone:
            raise ValueError("至少需要填写邮箱或电话")
        
        prev_status = resume.status
        resume.email = email
        resume.phone = phone
        resume.status = ResumeStatus.WAIT_CONNECTION
        resume.current_handler_id = resume.expert_id
        self._set_sla_deadline(resume, resume.status)
        
        self._log_action(resume, operator, ActionType.FILL_CONTACT, prev_status, resume.status)
        
        # 通知专家建联
        self._create_notification(
            resume.expert_id, resume,
            f"请联系候选人",
            f"简历【{resume.candidate_name}】的联系方式已填写，请在{settings.SLA_CONNECTION_HOURS}小时内完成建联。",
            NotificationType.WARNING
        )
        
        self.db.commit()
        return resume
    
    def start_connection(
        self,
        resume: Resume,
        operator: User
    ) -> Resume:
        """专家开始建联"""
        if resume.status != ResumeStatus.WAIT_CONNECTION:
            raise ValueError(f"当前状态不允许此操作: {resume.status}")
        
        prev_status = resume.status
        resume.status = ResumeStatus.WAIT_FEEDBACK
        self._set_sla_deadline(resume, resume.status)
        resume.is_overdue = False
        
        self._log_action(resume, operator, ActionType.CONNECT_START, prev_status, resume.status)
        self.db.commit()
        return resume
    
    def submit_feedback(
        self,
        resume: Resume,
        operator: User,
        feedback: str,
        archive: bool = True
    ) -> Resume:
        """提交反馈"""
        if resume.status != ResumeStatus.WAIT_FEEDBACK:
            raise ValueError(f"当前状态不允许此操作: {resume.status}")
        
        prev_status = resume.status
        if archive:
            resume.status = ResumeStatus.ARCHIVED
        
        resume.is_overdue = False
        resume.sla_deadline = None
        
        self._log_action(resume, operator, ActionType.FEEDBACK, prev_status, resume.status, feedback)
        self.db.commit()
        return resume
    
    def release(
        self,
        resume: Resume,
        operator: User,
        reason: str = None
    ) -> Resume:
        """释放简历（重新分发）"""
        allowed_statuses = [
            ResumeStatus.WAIT_CONNECTION,
            ResumeStatus.WAIT_FEEDBACK
        ]
        if resume.status not in allowed_statuses:
            raise ValueError(f"当前状态不允许释放: {resume.status}")
        
        prev_status = resume.status
        resume.status = ResumeStatus.RELEASED
        resume.expert_id = None
        resume.l3_department_id = None
        resume.current_handler_id = None
        resume.is_overdue = False
        resume.sla_deadline = None
        
        self._log_action(resume, operator, ActionType.RELEASE, prev_status, resume.status, reason)
        
        # 释放后自动回到二层待分发
        resume.status = ResumeStatus.POOL_L2
        
        self.db.commit()
        return resume
    
    def submit_overdue_reason(
        self,
        resume: Resume,
        operator: User,
        reason: str
    ) -> Resume:
        """提交超期原因"""
        if not resume.is_overdue:
            raise ValueError("简历未超期，无需填写原因")
        
        resume.overdue_reason = reason
        self._log_action(
            resume, operator, ActionType.OVERDUE_REASON,
            resume.status, resume.status, reason
        )
        self.db.commit()
        return resume
