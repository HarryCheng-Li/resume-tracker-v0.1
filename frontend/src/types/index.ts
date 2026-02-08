// 角色定义：HR、二层经理、三层助理、专家、管理员
export type Role = 'HR' | 'L2_MANAGER' | 'L3_ASSISTANT' | 'EXPERT' | 'ADMIN';

// 简历状态：对应4层流程的8个状态
export enum ResumeStatus {
  POOL_HR = 'POOL_HR',                    // HR已上传，待分发给二层
  POOL_L2 = 'POOL_L2',                    // 二层待分发给三层
  POOL_L3 = 'POOL_L3',                    // 三层待指派专家
  WAIT_IDENTIFY = 'WAIT_IDENTIFY',        // 待专家识别 (SLA: 1天)
  WAIT_CONTACT_INFO = 'WAIT_CONTACT_INFO',// 已识别，待二层填联系方式
  WAIT_CONNECTION = 'WAIT_CONNECTION',    // 待专家建联 (SLA: 1天)
  WAIT_FEEDBACK = 'WAIT_FEEDBACK',        // 已建联，待反馈 (SLA: 5天)
  ARCHIVED = 'ARCHIVED',                  // 已归档（成功/失败）
  RELEASED = 'RELEASED',                  // 已释放（待重新分发）
  REJECTED = 'REJECTED'                   // 专家不识别
}

// 简历来源
export enum Source {
  A = 'A',
  B = 'B',
  C = 'C',
  D = 'D',
  E = 'E',
  F = 'F',
  G = 'G'
}

export type RecruitmentScenario = 'DOMESTIC_BACHELOR_MASTER' | 'DOMESTIC_PHD' | 'OVERSEAS_BACHELOR_MASTER' | 'OVERSEAS_PHD';

export type CandidateType = 'GRADUATE' | 'INTERN';

export const RECRUITMENT_SCENARIO_LABELS: Record<RecruitmentScenario, string> = {
  DOMESTIC_BACHELOR_MASTER: '国内本硕',
  DOMESTIC_PHD: '国内博士',
  OVERSEAS_BACHELOR_MASTER: '留学生本硕',
  OVERSEAS_PHD: '留学生博士'
};

export const CANDIDATE_TYPE_LABELS: Record<CandidateType, string> = {
  GRADUATE: '应届生',
  INTERN: '实习生'
};

// 院校标签
export type SchoolTag = 
  | 'C9'
  | 'DOMESTIC_TARGET'
  | 'DOMESTIC_GENERAL'
  | 'DOMESTIC_SPECIAL'
  | 'OVERSEAS_TOP50_HARVARD'
  | 'OVERSEAS_TOP50'
  | 'OVERSEAS_GENERAL'
  | 'OVERSEAS_SPECIAL'
  | 'NON_TARGET';

export const SCHOOL_TAG_LABELS: Record<SchoolTag, string> = {
  C9: 'C9',
  DOMESTIC_TARGET: '国内目标',
  DOMESTIC_GENERAL: '国内通用',
  DOMESTIC_SPECIAL: '国内特定专业',
  OVERSEAS_TOP50_HARVARD: '海外50所-哈耶',
  OVERSEAS_TOP50: '海外50所',
  OVERSEAS_GENERAL: '海外通用',
  OVERSEAS_SPECIAL: '海外特定专业',
  NON_TARGET: '非目标'
};

// 优秀标签（可多选）
export type ExcellenceTag = 'TOP_CLASS' | 'TOP_JOURNAL' | 'TOP_CONFERENCE' | 'COMPETITION';

export const EXCELLENCE_TAG_LABELS: Record<ExcellenceTag, string> = {
  TOP_CLASS: '尖子生班',
  TOP_JOURNAL: '顶刊',
  TOP_CONFERENCE: '顶会',
  COMPETITION: '竞赛'
};

// 最高学历
export type EducationLevel = 'PHD' | 'MASTER' | 'BACHELOR';

export const EDUCATION_LEVEL_LABELS: Record<EducationLevel, string> = {
  PHD: '博士',
  MASTER: '硕士',
  BACHELOR: '本科'
};

export type AccountStatus = 'ACTIVE' | 'PENDING_APPROVAL' | 'REJECTED';

// 状态显示名称映射
export const STATUS_LABELS: Record<ResumeStatus, string> = {
  [ResumeStatus.POOL_HR]: '待分发(HR)',
  [ResumeStatus.POOL_L2]: '待分发(二层)',
  [ResumeStatus.POOL_L3]: '待指派专家',
  [ResumeStatus.WAIT_IDENTIFY]: '待识别',
  [ResumeStatus.WAIT_CONTACT_INFO]: '待填联系方式',
  [ResumeStatus.WAIT_CONNECTION]: '待建联',
  [ResumeStatus.WAIT_FEEDBACK]: '待反馈',
  [ResumeStatus.ARCHIVED]: '已归档',
  [ResumeStatus.RELEASED]: '已释放',
  [ResumeStatus.REJECTED]: '不识别'
};

// SLA配置（小时）
export const SLA_HOURS: Partial<Record<ResumeStatus, number>> = {
  [ResumeStatus.WAIT_IDENTIFY]: 24,      // 1天
  [ResumeStatus.WAIT_CONNECTION]: 24,    // 1天
  [ResumeStatus.WAIT_FEEDBACK]: 120      // 5天
};

export interface User {
  id: string;
  username: string;
  displayName?: string;              // 显示名称（可修改）
  email: string;
  role: Role;
  departmentId?: string;
  departmentName?: string;
  status?: AccountStatus;
  createdById?: string;
  createdByName?: string;
  overdueCount?: number;             // 超期计数（年度）
  overdueCountYear?: number;         // 计数年份
  createdAt: string;
}

// 角色中文标签
export const ROLE_LABELS: Record<Role, string> = {
  ADMIN: '管理员',
  HR: 'HR',
  L2_MANAGER: '二层经理',
  L3_ASSISTANT: '三层助理',
  EXPERT: '专家',
};

// 获取用户显示角色（含部门）
export function getUserRoleDisplay(user: User): string {
  const name = user.displayName || user.username;
  if (user.role === 'L3_ASSISTANT' && user.departmentName) {
    return `${user.departmentName}助理 ${name}`;
  }
  if (user.role === 'EXPERT' && user.departmentName) {
    return `${user.departmentName}专家 ${name}`;
  }
  return `${ROLE_LABELS[user.role]} ${name}`;
}

// 部门结构：支持二层/三层层级
export interface Department {
  id: string;
  name: string;
  level: 1 | 2 | 3;          // 1=招聘COE, 2=二层部门, 3=三层部门
  parentId?: string;         // 子部门父级ID
  parentName?: string;       // 父级名称
  createdAt: string;
}

export interface Resume {
  id: string;
  candidateName: string;
  email?: string;              // 候选人邮箱（二层填写）
  phone?: string;              // 候选人电话（二层填写）
  school?: string;             // 毕业院校
  graduationYear?: string;     // 应聘届次，如27届
  recruitmentScenario?: RecruitmentScenario; // 招聘场景
  candidateType?: CandidateType; // 应届生/实习生
  schoolTag?: SchoolTag;       // 院校标签
  excellenceTags?: ExcellenceTag[]; // 优秀标签（可多选）
  educationLevel?: EducationLevel; // 最高学历
  remark?: string;             // 备注
  skills?: string[];           // 技能标签
  source: Source;              // 来源 A-G
  status: ResumeStatus;
  resumeUrl: string;           // 简历文件路径
  
  // 部门关联
  l2DepartmentId?: string;     // 二层部门ID
  l2DepartmentName?: string;
  l3DepartmentId?: string;     // 三层部门ID
  l3DepartmentName?: string;
  
  // 人员关联
  uploaderId: string;          // HR上传者ID
  uploaderName?: string;
  currentHandlerId?: string;   // 当前责任人ID
  currentHandlerName?: string;
  expertId?: string;           // 指派的专家ID
  expertName?: string;
  
  // SLA相关
  slaDeadline?: string;        // 当前阶段截止时间
  isOverdue: boolean;          // 是否超期
  overdueReason?: string;      // 超期原因（如需填写）
  
  // 时间戳
  createdAt: string;
  updatedAt: string;
  
  // 统计
  totalDurationHours?: number; // 从上传至今的总时长
}

// 操作类型枚举
export enum ActionType {
  UPLOAD = 'UPLOAD',                    // HR上传
  DISTRIBUTE_L2 = 'DISTRIBUTE_L2',      // 分发给二层
  DISTRIBUTE_L3 = 'DISTRIBUTE_L3',      // 二层分发给三层
  ASSIGN_EXPERT = 'ASSIGN_EXPERT',      // 三层指派专家
  IDENTIFY_YES = 'IDENTIFY_YES',        // 专家识别-是
  IDENTIFY_NO = 'IDENTIFY_NO',          // 专家识别-否
  FILL_CONTACT = 'FILL_CONTACT',        // 二层填写联系方式
  CONNECT_START = 'CONNECT_START',      // 专家开始建联
  CONNECT_SUCCESS = 'CONNECT_SUCCESS',  // 建联成功
  CONNECT_FAIL = 'CONNECT_FAIL',        // 建联失败
  FEEDBACK = 'FEEDBACK',                // 反馈
  RELEASE = 'RELEASE',                  // 释放
  ARCHIVE = 'ARCHIVE',                  // 归档
  OVERDUE_REASON = 'OVERDUE_REASON'     // 填写超期原因
}

export interface WorkflowLog {
  id: string;
  resumeId: string;
  operatorId: string;
  operatorName?: string;
  action: ActionType;
  previousStatus?: ResumeStatus;
  newStatus?: ResumeStatus;
  comment?: string;
  metadata?: Record<string, unknown>; // 额外信息JSON
  durationSeconds?: number;           // 在上一状态停留时间
  timestamp: string;
}

export interface Notification {
  id: string;
  userId: string;
  resumeId?: string;
  resumeName?: string;               // 候选人姓名
  title: string;
  message: string;
  type: 'INFO' | 'WARNING' | 'URGENT' | 'SUCCESS';
  isRead: boolean;
  
  // 提醒内容（用于二层复制发邮件）
  currentHandler?: string;           // 当前责任人
  currentStage?: string;             // 当前环节
  overdueTime?: string;              // 超期时间
  
  link?: string;
  createdAt: string;
}

export type AccountRequestType = 'CREATE_L3_ASSISTANT' | 'CREATE_EXPERT';

export interface AccountApprovalRequest {
  id: string;
  requestType: AccountRequestType;
  applicantId: string;
  applicantName: string;
  applicantRole: Role;
  targetRole: Role;
  targetUsername: string;
  targetEmail: string;
  targetDepartmentId: string;
  targetDepartmentName: string;
  targetPassword: string;
  reason?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  reviewedById?: string;
  reviewedByName?: string;
  reviewComment?: string;
  createdAt: string;
  reviewedAt?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}
