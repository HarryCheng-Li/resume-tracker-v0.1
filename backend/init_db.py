"""
初始化数据库脚本 - 创建默认用户和部门
"""
import asyncio
import sys
sys.path.insert(0, '.')

from sqlalchemy.orm import Session
from app.core.database import SessionLocal, engine, Base
from app.models import User, Department
from app.models.enums import Role
from app.core.security import get_password_hash


def init_db():
    """初始化数据库表和默认数据"""
    # 创建表
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    try:
        # 检查是否已初始化
        if db.query(User).first():
            print("数据库已初始化，跳过")
            return
        
        # 创建二层部门
        dept_l2_1 = Department(name="业务一部", level=2)
        dept_l2_2 = Department(name="业务二部", level=2)
        dept_l2_3 = Department(name="技术部", level=2)
        db.add_all([dept_l2_1, dept_l2_2, dept_l2_3])
        db.flush()
        
        # 创建三层部门
        dept_l3_1 = Department(name="业务一部-团队A", level=3, parent_id=dept_l2_1.id)
        dept_l3_2 = Department(name="业务一部-团队B", level=3, parent_id=dept_l2_1.id)
        dept_l3_3 = Department(name="业务二部-团队A", level=3, parent_id=dept_l2_2.id)
        dept_l3_4 = Department(name="技术部-前端组", level=3, parent_id=dept_l2_3.id)
        dept_l3_5 = Department(name="技术部-后端组", level=3, parent_id=dept_l2_3.id)
        db.add_all([dept_l3_1, dept_l3_2, dept_l3_3, dept_l3_4, dept_l3_5])
        db.flush()
        
        # 创建用户
        users = [
            # 管理员
            User(
                username="admin",
                email="admin@company.com",
                password_hash=get_password_hash("admin123"),
                role=Role.ADMIN,
                is_active=True
            ),
            # HR
            User(
                username="hr",
                email="hr@company.com",
                password_hash=get_password_hash("hr123"),
                role=Role.HR,
                is_active=True
            ),
            # 二层经理
            User(
                username="l2_manager_1",
                email="l2_manager_1@company.com",
                password_hash=get_password_hash("l2123"),
                role=Role.L2_MANAGER,
                department_id=dept_l2_1.id,
                is_active=True
            ),
            User(
                username="l2_manager_2",
                email="l2_manager_2@company.com",
                password_hash=get_password_hash("l2123"),
                role=Role.L2_MANAGER,
                department_id=dept_l2_2.id,
                is_active=True
            ),
            # 三层助理
            User(
                username="l3_assistant_1",
                email="l3_assistant_1@company.com",
                password_hash=get_password_hash("l3123"),
                role=Role.L3_ASSISTANT,
                department_id=dept_l3_1.id,
                is_active=True
            ),
            User(
                username="l3_assistant_2",
                email="l3_assistant_2@company.com",
                password_hash=get_password_hash("l3123"),
                role=Role.L3_ASSISTANT,
                department_id=dept_l3_4.id,
                is_active=True
            ),
            # 专家
            User(
                username="expert_1",
                email="expert_1@company.com",
                password_hash=get_password_hash("expert123"),
                role=Role.EXPERT,
                department_id=dept_l3_1.id,
                is_active=True
            ),
            User(
                username="expert_2",
                email="expert_2@company.com",
                password_hash=get_password_hash("expert123"),
                role=Role.EXPERT,
                department_id=dept_l3_4.id,
                is_active=True
            ),
        ]
        db.add_all(users)
        db.commit()
        
        print("✅ 数据库初始化完成!")
        print("=" * 50)
        print("默认账号:")
        print("  管理员: admin / admin123")
        print("  HR: hr / hr123")
        print("  二层经理: l2_manager_1 / l2123")
        print("  三层助理: l3_assistant_1 / l3123")
        print("  专家: expert_1 / expert123")
        print("=" * 50)
        
    except Exception as e:
        print(f"❌ 初始化失败: {e}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    init_db()
