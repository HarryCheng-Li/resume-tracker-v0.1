"""
简历管理路由 - 核心业务逻辑
"""
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel, EmailStr
from datetime import datetime
import os
import uuid
import shutil

from app.core.database import get_db
from app.core.config import settings
from app.models import Resume, User, Department, WorkflowLog
from app.models.enums import ResumeStatus, Source, Role, ActionType
from app.api.deps import get_current_user, require_roles
from app.services.workflow import WorkflowService

router = APIRouter()


# ==================== Schema定义 ====================

class ResumeResponse(BaseModel):
    id: str
    candidate_name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    source: str
    status: str
    resume_url: str
    l2_department_id: Optional[str] = None
    l2_department_name: Optional[str] = None
    l3_department_id: Optional[str] = None
    l3_department_name: Optional[str] = None
    uploader_id: str
    uploader_name: Optional[str] = None
    current_handler_id: Optional[str] = None
    current_handler_name: Optional[str] = None
    expert_id: Optional[str] = None
    expert_name: Optional[str] = None
    sla_deadline: Optional[datetime] = None
    is_overdue: bool = False
    overdue_reason: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True


class WorkflowLogResponse(BaseModel):
    id: str
    resume_id: str
    operator_id: str
    operator_name: Optional[str] = None
    action: str
    previous_status: Optional[str] = None
    new_status: Optional[str] = None
    comment: Optional[str] = None
    duration_seconds: Optional[int] = None
    created_at: datetime
    
    class Config:
        from_attributes = True


class ResumeListResponse(BaseModel):
    items: List[ResumeResponse]
    total: int
    page: int
    page_size: int


class DistributeL2Request(BaseModel):
    l2_department_id: str


class DistributeL3Request(BaseModel):
    l3_department_id: str


class AssignExpertRequest(BaseModel):
    expert_id: str


class IdentifyRequest(BaseModel):
    identified: bool
    comment: Optional[str] = None


class FillContactRequest(BaseModel):
    email: Optional[EmailStr] = None
    phone: Optional[str] = None


class FeedbackRequest(BaseModel):
    feedback: str
    archive: bool = True


class ReleaseRequest(BaseModel):
    reason: Optional[str] = None


class OverdueReasonRequest(BaseModel):
    reason: str


# ==================== 辅助函数 ====================

def _build_resume_response(resume: Resume) -> ResumeResponse:
    """构建简历响应对象"""
    response = ResumeResponse(
        id=resume.id,
        candidate_name=resume.candidate_name,
        email=resume.email,
        phone=resume.phone,
        source=resume.source.value,
        status=resume.status.value,
        resume_url=resume.resume_url,
        l2_department_id=resume.l2_department_id,
        l3_department_id=resume.l3_department_id,
        uploader_id=resume.uploader_id,
        current_handler_id=resume.current_handler_id,
        expert_id=resume.expert_id,
        sla_deadline=resume.sla_deadline,
        is_overdue=resume.is_overdue,
        overdue_reason=resume.overdue_reason,
        created_at=resume.created_at,
        updated_at=resume.updated_at
    )
    
    if resume.l2_department:
        response.l2_department_name = resume.l2_department.name
    if resume.l3_department:
        response.l3_department_name = resume.l3_department.name
    if resume.uploader:
        response.uploader_name = resume.uploader.username
    if resume.current_handler:
        response.current_handler_name = resume.current_handler.username
    if resume.expert:
        response.expert_name = resume.expert.username
    
    return response


# ==================== API端点 ====================

@router.get("/", response_model=ResumeListResponse)
def list_resumes(
    status: Optional[ResumeStatus] = Query(None),
    source: Optional[Source] = Query(None),
    is_overdue: Optional[bool] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """获取简历列表（根据角色过滤）"""
    query = db.query(Resume)
    
    # 根据角色过滤
    if current_user.role == Role.HR:
        # HR看所有
        pass
    elif current_user.role == Role.L2_MANAGER:
        # 二层经理看本部门相关
        query = query.filter(Resume.l2_department_id == current_user.department_id)
    elif current_user.role == Role.L3_ASSISTANT:
        # 三层助理看本部门
        query = query.filter(Resume.l3_department_id == current_user.department_id)
    elif current_user.role == Role.EXPERT:
        # 专家看分配给自己的
        query = query.filter(Resume.expert_id == current_user.id)
    elif current_user.role != Role.ADMIN:
        # 其他角色无权限
        raise HTTPException(status_code=403, detail="无权限查看简历列表")
    
    # 应用筛选条件
    if status:
        query = query.filter(Resume.status == status)
    if source:
        query = query.filter(Resume.source == source)
    if is_overdue is not None:
        query = query.filter(Resume.is_overdue == is_overdue)
    
    # 分页
    total = query.count()
    resumes = query.order_by(Resume.created_at.desc()).offset(
        (page - 1) * page_size
    ).limit(page_size).all()
    
    items = [_build_resume_response(r) for r in resumes]
    
    return ResumeListResponse(
        items=items,
        total=total,
        page=page,
        page_size=page_size
    )


@router.get("/my-tasks")
def get_my_tasks(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """获取当前用户的待办任务"""
    tasks = []
    
    if current_user.role == Role.HR:
        # HR: 待分发的简历
        pool_hr = db.query(Resume).filter(Resume.status == ResumeStatus.POOL_HR).all()
        tasks.append({
            "type": "待分发",
            "count": len(pool_hr),
            "items": [_build_resume_response(r) for r in pool_hr[:10]]
        })
    
    elif current_user.role == Role.L2_MANAGER:
        # 二层经理: 待分发给三层 + 待填联系方式
        pool_l2 = db.query(Resume).filter(
            Resume.status == ResumeStatus.POOL_L2,
            Resume.l2_department_id == current_user.department_id
        ).all()
        tasks.append({
            "type": "待分发给三层",
            "count": len(pool_l2),
            "items": [_build_resume_response(r) for r in pool_l2[:10]]
        })
        
        wait_contact = db.query(Resume).filter(
            Resume.status == ResumeStatus.WAIT_CONTACT_INFO,
            Resume.l2_department_id == current_user.department_id
        ).all()
        tasks.append({
            "type": "待填联系方式",
            "count": len(wait_contact),
            "items": [_build_resume_response(r) for r in wait_contact[:10]]
        })
        
        # 超期简历
        overdue = db.query(Resume).filter(
            Resume.l2_department_id == current_user.department_id,
            Resume.is_overdue == True
        ).all()
        tasks.append({
            "type": "超期简历",
            "count": len(overdue),
            "items": [_build_resume_response(r) for r in overdue[:10]]
        })
    
    elif current_user.role == Role.L3_ASSISTANT:
        # 三层助理: 待指派专家
        pool_l3 = db.query(Resume).filter(
            Resume.status == ResumeStatus.POOL_L3,
            Resume.l3_department_id == current_user.department_id
        ).all()
        tasks.append({
            "type": "待指派专家",
            "count": len(pool_l3),
            "items": [_build_resume_response(r) for r in pool_l3[:10]]
        })
    
    elif current_user.role == Role.EXPERT:
        # 专家: 待识别 + 待建联 + 待反馈
        wait_identify = db.query(Resume).filter(
            Resume.status == ResumeStatus.WAIT_IDENTIFY,
            Resume.expert_id == current_user.id
        ).all()
        tasks.append({
            "type": "待识别",
            "count": len(wait_identify),
            "items": [_build_resume_response(r) for r in wait_identify]
        })
        
        wait_connection = db.query(Resume).filter(
            Resume.status == ResumeStatus.WAIT_CONNECTION,
            Resume.expert_id == current_user.id
        ).all()
        tasks.append({
            "type": "待建联",
            "count": len(wait_connection),
            "items": [_build_resume_response(r) for r in wait_connection]
        })
        
        wait_feedback = db.query(Resume).filter(
            Resume.status == ResumeStatus.WAIT_FEEDBACK,
            Resume.expert_id == current_user.id
        ).all()
        tasks.append({
            "type": "待反馈",
            "count": len(wait_feedback),
            "items": [_build_resume_response(r) for r in wait_feedback]
        })
    
    return {"tasks": tasks}


@router.get("/stats")
def get_resume_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(Role.ADMIN, Role.HR))
):
    """获取简历统计数据（管理员/HR）"""
    stats = {}
    
    # 按状态统计
    for status in ResumeStatus:
        count = db.query(Resume).filter(Resume.status == status).count()
        stats[status.value] = count
    
    # 超期统计
    overdue_count = db.query(Resume).filter(Resume.is_overdue == True).count()
    stats["overdue"] = overdue_count
    
    # 按来源统计
    source_stats = {}
    for source in Source:
        count = db.query(Resume).filter(Resume.source == source).count()
        source_stats[source.value] = count
    stats["by_source"] = source_stats
    
    # 今日上传
    from datetime import date
    today = date.today()
    today_count = db.query(Resume).filter(
        Resume.created_at >= datetime.combine(today, datetime.min.time())
    ).count()
    stats["today_uploaded"] = today_count
    
    return stats


@router.get("/{resume_id}", response_model=ResumeResponse)
def get_resume(
    resume_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """获取简历详情"""
    resume = db.query(Resume).filter(Resume.id == resume_id).first()
    if not resume:
        raise HTTPException(status_code=404, detail="简历不存在")
    
    return _build_resume_response(resume)


@router.get("/{resume_id}/logs", response_model=List[WorkflowLogResponse])
def get_resume_logs(
    resume_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """获取简历操作日志"""
    resume = db.query(Resume).filter(Resume.id == resume_id).first()
    if not resume:
        raise HTTPException(status_code=404, detail="简历不存在")
    
    logs = db.query(WorkflowLog).filter(
        WorkflowLog.resume_id == resume_id
    ).order_by(WorkflowLog.created_at.desc()).all()
    
    result = []
    for log in logs:
        log_response = WorkflowLogResponse(
            id=log.id,
            resume_id=log.resume_id,
            operator_id=log.operator_id,
            action=log.action.value,
            previous_status=log.previous_status.value if log.previous_status else None,
            new_status=log.new_status.value if log.new_status else None,
            comment=log.comment,
            duration_seconds=log.duration_seconds,
            created_at=log.created_at
        )
        if log.operator:
            log_response.operator_name = log.operator.username
        result.append(log_response)
    
    return result


@router.post("/upload", response_model=ResumeResponse)
async def upload_resume(
    candidate_name: str = Form(...),
    source: Source = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(Role.HR, Role.ADMIN))
):
    """上传简历（HR/管理员）"""
    # 验证文件类型
    file_ext = os.path.splitext(file.filename)[1].lower()
    if file_ext not in settings.ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"不支持的文件类型。允许: {settings.ALLOWED_EXTENSIONS}"
        )
    
    # 保存文件
    file_id = str(uuid.uuid4())
    file_name = f"{file_id}{file_ext}"
    file_path = os.path.join(settings.UPLOAD_DIR, file_name)
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    # 创建简历记录
    resume = Resume(
        candidate_name=candidate_name,
        source=source,
        resume_url=f"/uploads/{file_name}",
        uploader_id=current_user.id,
        status=ResumeStatus.POOL_HR
    )
    db.add(resume)
    
    # 记录日志
    log = WorkflowLog(
        resume_id=resume.id,
        operator_id=current_user.id,
        action=ActionType.UPLOAD,
        new_status=ResumeStatus.POOL_HR
    )
    db.add(log)
    
    db.commit()
    db.refresh(resume)
    
    return _build_resume_response(resume)


@router.post("/{resume_id}/distribute-l2", response_model=ResumeResponse)
def distribute_to_l2(
    resume_id: str,
    request: DistributeL2Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(Role.HR, Role.ADMIN))
):
    """分发给二层部门（HR）"""
    resume = db.query(Resume).filter(Resume.id == resume_id).first()
    if not resume:
        raise HTTPException(status_code=404, detail="简历不存在")
    
    workflow = WorkflowService(db)
    try:
        resume = workflow.distribute_to_l2(resume, current_user, request.l2_department_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    
    return _build_resume_response(resume)


@router.post("/{resume_id}/distribute-l3", response_model=ResumeResponse)
def distribute_to_l3(
    resume_id: str,
    request: DistributeL3Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(Role.L2_MANAGER, Role.ADMIN))
):
    """分发给三层部门（二层经理）"""
    resume = db.query(Resume).filter(Resume.id == resume_id).first()
    if not resume:
        raise HTTPException(status_code=404, detail="简历不存在")
    
    workflow = WorkflowService(db)
    try:
        resume = workflow.distribute_to_l3(resume, current_user, request.l3_department_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    
    return _build_resume_response(resume)


@router.post("/{resume_id}/assign-expert", response_model=ResumeResponse)
def assign_expert(
    resume_id: str,
    request: AssignExpertRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(Role.L3_ASSISTANT, Role.ADMIN))
):
    """指派专家（三层助理）"""
    resume = db.query(Resume).filter(Resume.id == resume_id).first()
    if not resume:
        raise HTTPException(status_code=404, detail="简历不存在")
    
    workflow = WorkflowService(db)
    try:
        resume = workflow.assign_expert(resume, current_user, request.expert_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    
    return _build_resume_response(resume)


@router.post("/{resume_id}/identify", response_model=ResumeResponse)
def identify_resume(
    resume_id: str,
    request: IdentifyRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(Role.EXPERT))
):
    """专家识别"""
    resume = db.query(Resume).filter(Resume.id == resume_id).first()
    if not resume:
        raise HTTPException(status_code=404, detail="简历不存在")
    
    workflow = WorkflowService(db)
    try:
        resume = workflow.identify(resume, current_user, request.identified, request.comment)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    
    return _build_resume_response(resume)


@router.post("/{resume_id}/fill-contact", response_model=ResumeResponse)
def fill_contact_info(
    resume_id: str,
    request: FillContactRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(Role.L2_MANAGER, Role.ADMIN))
):
    """填写联系方式（二层经理）"""
    resume = db.query(Resume).filter(Resume.id == resume_id).first()
    if not resume:
        raise HTTPException(status_code=404, detail="简历不存在")
    
    workflow = WorkflowService(db)
    try:
        resume = workflow.fill_contact_info(resume, current_user, request.email, request.phone)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    
    return _build_resume_response(resume)


@router.post("/{resume_id}/start-connection", response_model=ResumeResponse)
def start_connection(
    resume_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(Role.EXPERT))
):
    """开始建联（专家）"""
    resume = db.query(Resume).filter(Resume.id == resume_id).first()
    if not resume:
        raise HTTPException(status_code=404, detail="简历不存在")
    
    workflow = WorkflowService(db)
    try:
        resume = workflow.start_connection(resume, current_user)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    
    return _build_resume_response(resume)


@router.post("/{resume_id}/feedback", response_model=ResumeResponse)
def submit_feedback(
    resume_id: str,
    request: FeedbackRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(Role.EXPERT))
):
    """提交反馈（专家）"""
    resume = db.query(Resume).filter(Resume.id == resume_id).first()
    if not resume:
        raise HTTPException(status_code=404, detail="简历不存在")
    
    workflow = WorkflowService(db)
    try:
        resume = workflow.submit_feedback(resume, current_user, request.feedback, request.archive)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    
    return _build_resume_response(resume)


@router.post("/{resume_id}/release", response_model=ResumeResponse)
def release_resume(
    resume_id: str,
    request: ReleaseRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(Role.L2_MANAGER, Role.ADMIN))
):
    """释放简历（二层经理）"""
    resume = db.query(Resume).filter(Resume.id == resume_id).first()
    if not resume:
        raise HTTPException(status_code=404, detail="简历不存在")
    
    workflow = WorkflowService(db)
    try:
        resume = workflow.release(resume, current_user, request.reason)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    
    return _build_resume_response(resume)


@router.post("/{resume_id}/overdue-reason", response_model=ResumeResponse)
def submit_overdue_reason(
    resume_id: str,
    request: OverdueReasonRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """提交超期原因"""
    resume = db.query(Resume).filter(Resume.id == resume_id).first()
    if not resume:
        raise HTTPException(status_code=404, detail="简历不存在")
    
    workflow = WorkflowService(db)
    try:
        resume = workflow.submit_overdue_reason(resume, current_user, request.reason)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    
    return _build_resume_response(resume)
