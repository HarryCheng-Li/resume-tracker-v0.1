"""
用户管理路由
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel, EmailStr

from app.core.database import get_db
from app.core.security import get_password_hash
from app.models import User, Department, Role
from app.api.deps import get_current_user, require_roles

router = APIRouter()


class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str
    role: Role
    department_id: Optional[str] = None


class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    role: Optional[Role] = None
    department_id: Optional[str] = None
    is_active: Optional[bool] = None


class UserResponse(BaseModel):
    id: str
    username: str
    email: str
    role: str
    department_id: Optional[str] = None
    department_name: Optional[str] = None
    is_active: bool
    
    class Config:
        from_attributes = True


@router.get("/", response_model=List[UserResponse])
def list_users(
    role: Optional[Role] = Query(None),
    department_id: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """获取用户列表"""
    query = db.query(User)
    
    if role:
        query = query.filter(User.role == role)
    if department_id:
        query = query.filter(User.department_id == department_id)
    
    users = query.all()
    result = []
    for user in users:
        user_dict = UserResponse(
            id=user.id,
            username=user.username,
            email=user.email,
            role=user.role.value,
            department_id=user.department_id,
            is_active=user.is_active
        )
        if user.department:
            user_dict.department_name = user.department.name
        result.append(user_dict)
    
    return result


@router.post("/", response_model=UserResponse)
def create_user(
    user_in: UserCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(Role.ADMIN))
):
    """创建用户（仅管理员）"""
    # 检查用户名是否已存在
    if db.query(User).filter(User.username == user_in.username).first():
        raise HTTPException(status_code=400, detail="用户名已存在")
    
    # 检查邮箱是否已存在
    if db.query(User).filter(User.email == user_in.email).first():
        raise HTTPException(status_code=400, detail="邮箱已存在")
    
    user = User(
        username=user_in.username,
        email=user_in.email,
        password_hash=get_password_hash(user_in.password),
        role=user_in.role,
        department_id=user_in.department_id,
        is_active=True
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    
    return UserResponse(
        id=user.id,
        username=user.username,
        email=user.email,
        role=user.role.value,
        department_id=user.department_id,
        is_active=user.is_active
    )


@router.get("/{user_id}", response_model=UserResponse)
def get_user(
    user_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """获取用户详情"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="用户不存在")
    
    response = UserResponse(
        id=user.id,
        username=user.username,
        email=user.email,
        role=user.role.value,
        department_id=user.department_id,
        is_active=user.is_active
    )
    if user.department:
        response.department_name = user.department.name
    return response


@router.put("/{user_id}", response_model=UserResponse)
def update_user(
    user_id: str,
    user_in: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(Role.ADMIN))
):
    """更新用户（仅管理员）"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="用户不存在")
    
    update_data = user_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(user, field, value)
    
    db.commit()
    db.refresh(user)
    
    response = UserResponse(
        id=user.id,
        username=user.username,
        email=user.email,
        role=user.role.value,
        department_id=user.department_id,
        is_active=user.is_active
    )
    if user.department:
        response.department_name = user.department.name
    return response


@router.delete("/{user_id}")
def delete_user(
    user_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(Role.ADMIN))
):
    """删除用户（仅管理员）"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="用户不存在")
    
    if user.id == current_user.id:
        raise HTTPException(status_code=400, detail="不能删除自己")
    
    db.delete(user)
    db.commit()
    return {"message": "删除成功"}
