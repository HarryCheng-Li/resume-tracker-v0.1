"""
枚举定义
"""
import enum


class Role(str, enum.Enum):
    """用户角色"""
    HR = "HR"
    L2_MANAGER = "L2_MANAGER"      # 二层经理
    L3_ASSISTANT = "L3_ASSISTANT"  # 三层助理
    EXPERT = "EXPERT"              # 专家
    ADMIN = "ADMIN"                # 管理员


class ResumeStatus(str, enum.Enum):
    """简历状态"""
    POOL_HR = "POOL_HR"                      # HR已上传，待分发给二层
    POOL_L2 = "POOL_L2"                      # 二层待分发给三层
    POOL_L3 = "POOL_L3"                      # 三层待指派专家
    WAIT_IDENTIFY = "WAIT_IDENTIFY"          # 待专家识别 (SLA: 1天)
    WAIT_CONTACT_INFO = "WAIT_CONTACT_INFO"  # 已识别，待二层填联系方式
    WAIT_CONNECTION = "WAIT_CONNECTION"      # 待专家建联 (SLA: 1天)
    WAIT_FEEDBACK = "WAIT_FEEDBACK"          # 已建联，待反馈 (SLA: 5天)
    ARCHIVED = "ARCHIVED"                    # 已归档
    RELEASED = "RELEASED"                    # 已释放（待重新分发）
    REJECTED = "REJECTED"                    # 专家不识别


class Source(str, enum.Enum):
    """简历来源"""
    A = "A"
    B = "B"
    C = "C"
    D = "D"
    E = "E"
    F = "F"
    G = "G"


class ActionType(str, enum.Enum):
    """操作类型"""
    UPLOAD = "UPLOAD"                        # HR上传
    DISTRIBUTE_L2 = "DISTRIBUTE_L2"          # 分发给二层
    DISTRIBUTE_L3 = "DISTRIBUTE_L3"          # 二层分发给三层
    ASSIGN_EXPERT = "ASSIGN_EXPERT"          # 三层指派专家
    IDENTIFY_YES = "IDENTIFY_YES"            # 专家识别-是
    IDENTIFY_NO = "IDENTIFY_NO"              # 专家识别-否
    FILL_CONTACT = "FILL_CONTACT"            # 二层填写联系方式
    CONNECT_START = "CONNECT_START"          # 专家开始建联
    CONNECT_SUCCESS = "CONNECT_SUCCESS"      # 建联成功
    CONNECT_FAIL = "CONNECT_FAIL"            # 建联失败
    FEEDBACK = "FEEDBACK"                    # 反馈
    RELEASE = "RELEASE"                      # 释放
    ARCHIVE = "ARCHIVE"                      # 归档
    OVERDUE_REASON = "OVERDUE_REASON"        # 填写超期原因


class NotificationType(str, enum.Enum):
    """通知类型"""
    INFO = "INFO"
    WARNING = "WARNING"
    URGENT = "URGENT"
    SUCCESS = "SUCCESS"
