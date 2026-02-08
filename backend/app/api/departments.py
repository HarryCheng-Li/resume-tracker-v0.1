"""
部门管理路由
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel

from app.core.database import get_db
from app.models import Department, User, Role
from app.api.deps import get_current_user, require_roles

router = APIRouter()


class DepartmentCreate(BaseModel):
    name: str
    level: int  # 2 or 3
    parent_id: Optional[str] = None


class DepartmentUpdate(BaseModel):
    name: Optional[str] = None


class DepartmentResponse(BaseModel):
    id: str
    name: str
    level: int
    parent_id: Optional[str] = None
    parent_name: Optional[str] = None
    
    class Config:
        from_attributes = True


@router.get("/", response_model=List[DepartmentResponse])
def list_departments(
    level: Optional[int] = Query(None),
    parent_id: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """获取部门列表"""
    query = db.query(Department)
    
    if level:
        query = query.filter(Department.level == level)
    if parent_id:
        query = query.filter(Department.parent_id == parent_id)
    
    departments = query.all()
    result = []
    for dept in departments:
        dept_dict = DepartmentResponse(
            id=dept.id,
            name=dept.name,
            level=dept.level,
            parent_id=dept.parent_id
        )
        if dept.parent:
            dept_dict.parent_name = dept.parent.name
        result.append(dept_dict)
    
    return result


@router.get("/l2", response_model=List[DepartmentResponse])
def list_l2_departments(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """获取所有二层部门"""
    departments = db.query(Department).filter(Department.level == 2).all()
    return [DepartmentResponse(
        id=d.id, name=d.name, level=d.level, parent_id=d.parent_id
    ) for d in departments]


@router.get("/l3", response_model=List[DepartmentResponse])
def list_l3_departments(
    parent_id: Optional[str] = Query(None, description="二层部门ID"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """获取三层部门（可按二层部门筛选）"""
    query = db.query(Department).filter(Department.level == 3)
    if parent_id:
        query = query.filter(Department.parent_id == parent_id)
    
    departments = query.all()
    result = []
    for dept in departments:
        dept_dict = DepartmentResponse(
            id=dept.id,
            name=dept.name,
            level=dept.level,
            parent_id=dept.parent_id
        )
        if dept.parent:
            dept_dict.parent_name = dept.parent.name
        result.append(dept_dict)
    return result


@router.post("/", response_model=DepartmentResponse)
def create_department(
    dept_in: DepartmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(Role.ADMIN))
):
    """创建部门（仅管理员）"""
    if dept_in.level not in [2, 3]:
        raise HTTPException(status_code=400, detail="部门层级必须是2或3")
    
    if dept_in.level == 3 and not dept_in.parent_id:
        raise HTTPException(status_code=400, detail="三层部门必须指定父级部门")
    
    if dept_in.parent_id:
        parent = db.query(Department).filter(Department.id == dept_in.parent_id).first()
        if not parent:
            raise HTTPException(status_code=404, detail="父级部门不存在")
        if parent.level != 2:
            raise HTTPException(status_code=400, detail="父级部门必须是二层部门")
    
    dept = Department(
        name=dept_in.name,
        level=dept_in.level,
        parent_id=dept_in.parent_id
    )
    db.add(dept)
    db.commit()
    db.refresh(dept)
    
    return DepartmentResponse(
        id=dept.id,
        name=dept.name,
        level=dept.level,
        parent_id=dept.parent_id
    )


@router.put("/{dept_id}", response_model=DepartmentResponse)
def update_department(
    dept_id: str,
    dept_in: DepartmentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(Role.ADMIN))
):
    """更新部门（仅管理员）"""
    dept = db.query(Department).filter(Department.id == dept_id).first()
    if not dept:
        raise HTTPException(status_code=404, detail="部门不存在")
    
    if dept_in.name:
        dept.name = dept_in.name
    
    db.commit()
    db.refresh(dept)
    
    response = DepartmentResponse(
        id=dept.id,
        name=dept.name,
        level=dept.level,
        parent_id=dept.parent_id
    )
    if dept.parent:
        response.parent_name = dept.parent.name
    return response


@router.delete("/{dept_id}")
def delete_department(
    dept_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(Role.ADMIN))
):
    """删除部门（仅管理员）"""
    dept = db.query(Department).filter(Department.id == dept_id).first()
    if not dept:
        raise HTTPException(status_code=404, detail="部门不存在")
    
    # 检查是否有子部门
    if db.query(Department).filter(Department.parent_id == dept_id).count() > 0:
        raise HTTPException(status_code=400, detail="请先删除子部门")
    
    # 检查是否有用户
    if db.query(User).filter(User.department_id == dept_id).count() > 0:
        raise HTTPException(status_code=400, detail="请先移除部门内的用户")
    
    db.delete(dept)
    db.commit()
    return {"message": "删除成功"}
