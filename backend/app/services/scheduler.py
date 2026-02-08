"""
定时任务 - SLA检查
"""
from apscheduler.schedulers.background import BackgroundScheduler
from sqlalchemy.orm import Session

from app.core.database import SessionLocal
from app.services.sla import SLAService

scheduler = BackgroundScheduler()


def check_sla_job():
    """SLA检查定时任务"""
    db = SessionLocal()
    try:
        sla_service = SLAService(db)
        
        # 检查超期
        overdue = sla_service.check_overdue_resumes()
        if overdue:
            print(f"[SLA] 发现 {len(overdue)} 份超期简历")
        
        # 检查即将超期（提前4小时提醒）
        upcoming = sla_service.check_upcoming_deadlines(hours_before=4)
        if upcoming:
            print(f"[SLA] 发送 {len(upcoming)} 份即将超期提醒")
        
        db.commit()
    except Exception as e:
        print(f"[SLA] 检查失败: {e}")
        db.rollback()
    finally:
        db.close()


def start_scheduler():
    """启动定时任务调度器"""
    # 每30分钟检查一次SLA
    scheduler.add_job(
        check_sla_job,
        'interval',
        minutes=30,
        id='sla_check',
        replace_existing=True
    )
    scheduler.start()
    print("[Scheduler] SLA检查任务已启动，每30分钟执行一次")


def shutdown_scheduler():
    """关闭调度器"""
    if scheduler.running:
        scheduler.shutdown()
        print("[Scheduler] 已关闭")
