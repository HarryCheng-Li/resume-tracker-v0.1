/**
 * 静态默认数据 - 部门、用户初始配置
 */
import { Department, User, Role, Notification, AccountApprovalRequest, WorkflowLog, ActionType, ResumeStatus } from '../../types';

export const THIRD_LEVEL_CODES = 'ABCDEFGHIJKLMNO'.split('');

export const defaultDepartments: Department[] = [
  { id: 'dept-coe', name: '招聘COE', level: 1, createdAt: '2024-01-01' },
  { id: 'dept-l2', name: '二层', level: 2, parentId: 'dept-coe', parentName: '招聘COE', createdAt: '2024-01-01' },
  ...THIRD_LEVEL_CODES.map((code) => ({
    id: `dept-l3-${code.toLowerCase()}`,
    name: `三层部门${code}`,
    level: 3 as const,
    parentId: 'dept-l2',
    parentName: '二层',
    createdAt: '2024-01-01',
  })),
];

export const defaultUsers: User[] = [
  {
    id: 'user-admin',
    username: 'admin',
    email: 'admin@company.com',
    role: 'ADMIN',
    departmentId: 'dept-coe',
    departmentName: '招聘COE',
    status: 'ACTIVE',
    createdAt: '2024-01-01',
  },
  {
    id: 'user-hr',
    username: 'hr',
    email: 'hr@company.com',
    role: 'HR',
    departmentId: 'dept-coe',
    departmentName: '招聘COE',
    status: 'ACTIVE',
    createdAt: '2024-01-01',
  },
  {
    id: 'user-l2-1',
    username: 'l2_manager_1',
    email: 'l2m1@company.com',
    role: 'L2_MANAGER',
    departmentId: 'dept-l2',
    departmentName: '二层',
    status: 'ACTIVE',
    createdAt: '2024-01-01',
  },
  ...THIRD_LEVEL_CODES.map((code) => ({
    id: `user-l3-${code.toLowerCase()}`,
    username: `l3_assistant_${code.toLowerCase()}`,
    email: `l3_${code.toLowerCase()}@company.com`,
    role: 'L3_ASSISTANT' as Role,
    departmentId: `dept-l3-${code.toLowerCase()}`,
    departmentName: `三层部门${code}`,
    status: 'ACTIVE' as const,
    createdAt: '2024-01-01',
  })),
  ...THIRD_LEVEL_CODES.flatMap((code) => [
    {
      id: `user-exp-${code.toLowerCase()}-1`,
      username: `expert_${code.toLowerCase()}_1`,
      email: `expert_${code.toLowerCase()}_1@company.com`,
      role: 'EXPERT' as Role,
      departmentId: `dept-l3-${code.toLowerCase()}`,
      departmentName: `三层部门${code}`,
      status: 'ACTIVE' as const,
      createdAt: '2024-01-01',
    },
    {
      id: `user-exp-${code.toLowerCase()}-2`,
      username: `expert_${code.toLowerCase()}_2`,
      email: `expert_${code.toLowerCase()}_2@company.com`,
      role: 'EXPERT' as Role,
      departmentId: `dept-l3-${code.toLowerCase()}`,
      departmentName: `三层部门${code}`,
      status: 'ACTIVE' as const,
      createdAt: '2024-01-01',
    },
  ]),
];

export const defaultPasswords: Record<string, string> = {
  admin: '123',
  hr: '123',
  l2_manager_1: '123',
  ...Object.fromEntries(THIRD_LEVEL_CODES.map((code) => [`l3_assistant_${code.toLowerCase()}`, '123'])),
  ...Object.fromEntries(THIRD_LEVEL_CODES.flatMap((code) => [
    [`expert_${code.toLowerCase()}_1`, '123'],
    [`expert_${code.toLowerCase()}_2`, '123'],
  ])),
};

const now = () => new Date().toISOString();

export const defaultNotifications: Notification[] = [
  {
    id: 'notif-1',
    userId: 'user-exp-a-1',
    resumeId: 'resume-3',
    resumeName: '王五',
    title: '待办提醒：距离SLA不足24小时',
    message: '简历【王五】待识别仅剩8小时，请尽快处理。',
    type: 'WARNING',
    isRead: false,
    currentHandler: 'expert_a_1',
    currentStage: '待识别',
    overdueTime: '剩余8小时',
    link: '/resumes/resume-3',
    createdAt: now(),
  },
  {
    id: 'notif-2',
    userId: 'user-hr',
    title: '系统通知',
    message: '审批中心有新的账户申请待处理。',
    type: 'INFO',
    isRead: false,
    link: '/approval-center',
    createdAt: now(),
  },
];

export const defaultRequests: AccountApprovalRequest[] = [
  {
    id: 'req-1',
    requestType: 'CREATE_EXPERT',
    applicantId: 'user-l3-a',
    applicantName: 'l3_assistant_a',
    applicantRole: 'L3_ASSISTANT',
    targetRole: 'EXPERT',
    targetUsername: 'expert_new_a',
    targetEmail: 'expert_new_a@company.com',
    targetDepartmentId: 'dept-l3-a',
    targetDepartmentName: '三层部门A',
    targetPassword: 'expert123',
    reason: '补充算法方向专家',
    status: 'PENDING',
    createdAt: now(),
  },
  {
    id: 'req-2',
    requestType: 'CREATE_L3_ASSISTANT',
    applicantId: 'user-l2-1',
    applicantName: 'l2_manager_1',
    applicantRole: 'L2_MANAGER',
    targetRole: 'L3_ASSISTANT',
    targetUsername: 'l3_assistant_new',
    targetEmail: 'l3_assistant_new@company.com',
    targetDepartmentId: 'dept-l3-c',
    targetDepartmentName: '三层部门C',
    targetPassword: 'l3123',
    reason: '三层部门C业务扩张新增助理',
    status: 'PENDING',
    createdAt: now(),
  },
];

export const defaultWorkflowLogs: Record<string, WorkflowLog[]> = {
  'resume-3': [
    {
      id: 'log-3-1',
      resumeId: 'resume-3',
      operatorId: 'user-hr',
      operatorName: 'hr',
      action: ActionType.UPLOAD,
      newStatus: ResumeStatus.POOL_L2,
      timestamp: now(),
    },
  ],
};
