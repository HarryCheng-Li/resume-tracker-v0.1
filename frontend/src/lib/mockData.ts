/**
 * Mock数据 - 纯前端演示用（带本地持久化）
 */
import {
  AccountApprovalRequest,
  ActionType,
  CandidateType,
  Department,
  EducationLevel,
  ExcellenceTag,
  Notification,
  RECRUITMENT_SCENARIO_LABELS,
  Resume,
  ResumeStatus,
  Role,
  SchoolTag,
  SLA_HOURS,
  Source,
  User,
  WorkflowLog,
} from '../types';

const STORAGE_KEYS = {
  users: 'rt_users_v2',
  departments: 'rt_departments_v2',
  resumes: 'rt_resumes_v2',
  notifications: 'rt_notifications_v2',
  requests: 'rt_requests_v2',
  passwords: 'rt_passwords_v2',
};

const THIRD_LEVEL_CODES = 'ABCDEFGHIJKLMNO'.split('');

const now = () => new Date().toISOString();

const defaultDepartments: Department[] = [
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

const defaultUsers: User[] = [
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

const defaultPasswords: Record<string, string> = {
  admin: '123',
  hr: '123',
  l2_manager_1: '123',
  ...Object.fromEntries(THIRD_LEVEL_CODES.map((code) => [`l3_assistant_${code.toLowerCase()}`, '123'])),
  ...Object.fromEntries(THIRD_LEVEL_CODES.flatMap((code) => [
    [`expert_${code.toLowerCase()}_1`, '123'],
    [`expert_${code.toLowerCase()}_2`, '123'],
  ])),
};

// 随机数据生成辅助函数
const RANDOM_SURNAMES = ['张', '李', '王', '刘', '陈', '杨', '赵', '黄', '周', '吴', '徐', '孙', '胡', '朱', '高', '林', '何', '郭', '马', '罗'];
const RANDOM_NAMES = ['伟', '芳', '娜', '敏', '静', '丽', '强', '磊', '军', '洋', '勇', '艳', '杰', '娟', '涛', '明', '超', '秀英', '华', '慧', '鑫', '宇', '峰', '博', '浩', '晨', '阳', '文', '彬', '欣', '悦'];
const RANDOM_SCHOOLS = ['清华大学', '北京大学', '复旦大学', '上海交通大学', '浙江大学', '南京大学', '中国科学技术大学', '哈尔滨工业大学', '西安交通大学', '同济大学', '武汉大学', '中山大学', '华中科技大学', '北京航空航天大学', '北京理工大学', '东南大学', '天津大学', '南开大学', '厦门大学', '四川大学', 'MIT', 'Stanford', 'CMU', 'UC Berkeley', 'Harvard', 'Princeton', 'Oxford', 'Cambridge'];
const RANDOM_SKILLS = ['Python', 'Java', 'C++', 'JavaScript', 'TypeScript', 'React', 'Vue', 'Node.js', 'Go', 'Rust', '机器学习', '深度学习', '自然语言处理', '计算机视觉', '系统设计', '分布式系统', '算法', '数据结构', '云计算', 'Kubernetes', 'Docker', '前端工程化', '后端开发', '全栈开发', '数据分析', 'SQL', 'MongoDB', 'Redis'];
const GRADUATION_YEARS = ['27届', '28届', '29届', '30届', '31届', '32届', '33届', '34届', '35届'];
const SCENARIOS: Resume['recruitmentScenario'][] = ['DOMESTIC_BACHELOR_MASTER', 'DOMESTIC_PHD', 'OVERSEAS_BACHELOR_MASTER', 'OVERSEAS_PHD'];
const CANDIDATE_TYPES: CandidateType[] = ['GRADUATE', 'INTERN'];
const SOURCES: Source[] = [Source.A, Source.B, Source.C, Source.D, Source.E, Source.F, Source.G];
const ALL_STATUSES: ResumeStatus[] = [
  ResumeStatus.POOL_L2, ResumeStatus.POOL_L3, ResumeStatus.WAIT_IDENTIFY,
  ResumeStatus.WAIT_CONTACT_INFO, ResumeStatus.WAIT_CONNECTION, ResumeStatus.WAIT_FEEDBACK,
  ResumeStatus.ARCHIVED, ResumeStatus.RELEASED, ResumeStatus.REJECTED
];
const SCHOOL_TAGS: SchoolTag[] = ['C9', 'DOMESTIC_TARGET', 'DOMESTIC_GENERAL', 'DOMESTIC_SPECIAL', 'OVERSEAS_TOP50_HARVARD', 'OVERSEAS_TOP50', 'OVERSEAS_GENERAL', 'OVERSEAS_SPECIAL', 'NON_TARGET'];
const EXCELLENCE_TAGS: ExcellenceTag[] = ['TOP_CLASS', 'TOP_JOURNAL', 'TOP_CONFERENCE', 'COMPETITION'];
const EDUCATION_LEVELS: EducationLevel[] = ['PHD', 'MASTER', 'BACHELOR'];

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomItems<T>(arr: T[], count: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

function generateRandomResumes(count: number): Resume[] {
  const resumes: Resume[] = [];
  const baseTime = Date.now();
  
  for (let i = 0; i < count; i++) {
    const status = randomItem(ALL_STATUSES);
    const l3Code = randomItem(THIRD_LEVEL_CODES).toLowerCase();
    const hasL3 = ![ResumeStatus.POOL_L2].includes(status);
    const hasExpert = [
      ResumeStatus.WAIT_IDENTIFY, ResumeStatus.WAIT_CONTACT_INFO,
      ResumeStatus.WAIT_CONNECTION, ResumeStatus.WAIT_FEEDBACK,
      ResumeStatus.ARCHIVED, ResumeStatus.REJECTED
    ].includes(status);
    
    // 根据状态计算SLA截止时间
    let slaDeadline: string | undefined;
    let isOverdue = false;
    if ([ResumeStatus.WAIT_IDENTIFY, ResumeStatus.WAIT_CONNECTION, ResumeStatus.WAIT_FEEDBACK].includes(status)) {
      const slaHours = SLA_HOURS[status] || 24;
      // 随机生成：部分已超期、部分即将超期、部分正常
      const rand = Math.random();
      if (rand < 0.15) {
        // 15% 已超期（超期1-5天不等）
        slaDeadline = new Date(baseTime - (1 + Math.random() * 4) * 24 * 60 * 60 * 1000).toISOString();
        isOverdue = true;
      } else if (rand < 0.35) {
        // 20% 即将超期（剩余 ≤ 1/5）
        const threshold = (slaHours * 60 * 60 * 1000) / 5;
        slaDeadline = new Date(baseTime + Math.random() * threshold).toISOString();
      } else {
        // 65% 正常
        const remaining = (slaHours * 60 * 60 * 1000) * (0.3 + Math.random() * 0.7);
        slaDeadline = new Date(baseTime + remaining).toISOString();
      }
    }
    
    // 确定当前责任人
    let currentHandlerId: string | undefined;
    let currentHandlerName: string | undefined;
    if (status === ResumeStatus.POOL_L2 || status === ResumeStatus.WAIT_CONTACT_INFO) {
      currentHandlerId = 'user-l2-1';
      currentHandlerName = 'l2_manager_1';
    } else if (status === ResumeStatus.POOL_L3 || status === ResumeStatus.REJECTED) {
      currentHandlerId = `user-l3-${l3Code}`;
      currentHandlerName = `l3_assistant_${l3Code}`;
    } else if (hasExpert) {
      const expertNum = Math.random() > 0.5 ? 1 : 2;
      currentHandlerId = `user-exp-${l3Code}-${expertNum}`;
      currentHandlerName = `expert_${l3Code}_${expertNum}`;
    }
    
    const surname = randomItem(RANDOM_SURNAMES);
    const givenName = randomItem(RANDOM_NAMES) + (Math.random() > 0.5 ? randomItem(RANDOM_NAMES) : '');
    
    resumes.push({
      id: `resume-${i + 100}`,
      candidateName: surname + givenName,
      school: randomItem(RANDOM_SCHOOLS),
      graduationYear: randomItem(GRADUATION_YEARS),
      recruitmentScenario: randomItem(SCENARIOS),
      candidateType: randomItem(CANDIDATE_TYPES),
      schoolTag: randomItem(SCHOOL_TAGS),
      excellenceTags: Math.random() > 0.6 ? randomItems(EXCELLENCE_TAGS, 1 + Math.floor(Math.random() * 2)) : undefined,
      educationLevel: randomItem(EDUCATION_LEVELS),
      remark: '',
      skills: randomItems(RANDOM_SKILLS, 2 + Math.floor(Math.random() * 3)),
      source: randomItem(SOURCES),
      status,
      resumeUrl: '/sample-resume.pdf',
      uploaderId: 'user-hr',
      uploaderName: 'hr',
      l2DepartmentId: 'dept-l2',
      l2DepartmentName: '二层',
      l3DepartmentId: hasL3 ? `dept-l3-${l3Code}` : undefined,
      l3DepartmentName: hasL3 ? `三层部门${l3Code.toUpperCase()}` : undefined,
      expertId: hasExpert ? currentHandlerId : undefined,
      expertName: hasExpert ? currentHandlerName : undefined,
      currentHandlerId,
      currentHandlerName,
      slaDeadline,
      isOverdue,
      createdAt: new Date(baseTime - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: now(),
    });
  }
  
  return resumes;
}

const defaultResumes: Resume[] = generateRandomResumes(200);

const defaultNotifications: Notification[] = [
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

const defaultRequests: AccountApprovalRequest[] = [
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

const defaultWorkflowLogs: Record<string, WorkflowLog[]> = {
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

function loadLocal<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  const raw = localStorage.getItem(key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function saveLocal<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(key, JSON.stringify(value));
}

export const mockDepartments: Department[] = loadLocal(STORAGE_KEYS.departments, defaultDepartments);
export const mockUsers: User[] = loadLocal(STORAGE_KEYS.users, defaultUsers);
export const mockResumes: Resume[] = loadLocal(STORAGE_KEYS.resumes, defaultResumes);
export const mockNotifications: Notification[] = loadLocal(STORAGE_KEYS.notifications, defaultNotifications);
export const mockWorkflowLogs: Record<string, WorkflowLog[]> = defaultWorkflowLogs;

let runtimeDepartments = [...mockDepartments];
let runtimeUsers = [...mockUsers];
let runtimeResumes = [...mockResumes];
let runtimeNotifications = [...mockNotifications];
let runtimeRequests = loadLocal<AccountApprovalRequest[]>(STORAGE_KEYS.requests, defaultRequests);
let runtimePasswords = loadLocal<Record<string, string>>(STORAGE_KEYS.passwords, defaultPasswords);

function persistAll() {
  saveLocal(STORAGE_KEYS.departments, runtimeDepartments);
  saveLocal(STORAGE_KEYS.users, runtimeUsers);
  saveLocal(STORAGE_KEYS.resumes, runtimeResumes);
  saveLocal(STORAGE_KEYS.notifications, runtimeNotifications);
  saveLocal(STORAGE_KEYS.requests, runtimeRequests);
  saveLocal(STORAGE_KEYS.passwords, runtimePasswords);
}

export function resetMockData() {
  runtimeDepartments = [...defaultDepartments];
  runtimeUsers = [...defaultUsers];
  runtimeResumes = [...defaultResumes];
  runtimeNotifications = [...defaultNotifications];
  runtimeRequests = [...defaultRequests];
  runtimePasswords = { ...defaultPasswords };
  persistAll();
}

export function getDepartments(): Department[] {
  return [...runtimeDepartments];
}

export function getUsers(): User[] {
  return [...runtimeUsers];
}

export function getResumes(): Resume[] {
  return [...runtimeResumes];
}

export function getNotificationsByUserId(userId?: string): Notification[] {
  if (!userId) return [];
  return runtimeNotifications.filter((item) => item.userId === userId);
}

export function getAccountApprovalRequests(): AccountApprovalRequest[] {
  return [...runtimeRequests].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function createDirectUser(input: {
  username: string;
  email: string;
  role: Role;
  password: string;
  departmentId: string;
  creator: User;
}): { ok: boolean; message: string } {
  if (runtimeUsers.some((item) => item.username === input.username)) {
    return { ok: false, message: '用户名已存在' };
  }

  const department = runtimeDepartments.find((item) => item.id === input.departmentId);
  if (!department) {
    return { ok: false, message: '部门不存在' };
  }

  const user: User = {
    id: `user-${Date.now()}`,
    username: input.username,
    email: input.email,
    role: input.role,
    departmentId: department.id,
    departmentName: department.name,
    status: 'ACTIVE',
    createdById: input.creator.id,
    createdByName: input.creator.username,
    createdAt: now(),
  };

  runtimeUsers = [...runtimeUsers, user];
  runtimePasswords = { ...runtimePasswords, [input.username]: input.password };
  persistAll();
  return { ok: true, message: '创建成功并已激活' };
}

export function submitAccountRequest(input: {
  requestType: 'CREATE_L3_ASSISTANT' | 'CREATE_EXPERT';
  applicant: User;
  targetUsername: string;
  targetEmail: string;
  targetRole: Role;
  targetDepartmentId: string;
  targetPassword: string;
  reason?: string;
}): { ok: boolean; message: string } {
  if (runtimeUsers.some((item) => item.username === input.targetUsername)) {
    return { ok: false, message: '用户名已存在' };
  }

  const department = runtimeDepartments.find((item) => item.id === input.targetDepartmentId);
  if (!department) {
    return { ok: false, message: '部门不存在' };
  }

  const request: AccountApprovalRequest = {
    id: `req-${Date.now()}`,
    requestType: input.requestType,
    applicantId: input.applicant.id,
    applicantName: input.applicant.username,
    applicantRole: input.applicant.role,
    targetRole: input.targetRole,
    targetUsername: input.targetUsername,
    targetEmail: input.targetEmail,
    targetDepartmentId: input.targetDepartmentId,
    targetDepartmentName: department.name,
    targetPassword: input.targetPassword,
    reason: input.reason,
    status: 'PENDING',
    createdAt: now(),
  };

  runtimeRequests = [request, ...runtimeRequests];
  runtimeNotifications = [
    ...runtimeNotifications,
    {
      id: `notif-${Date.now()}-hr`,
      userId: 'user-hr',
      title: '新建账户申请待审批',
      message: `${request.applicantName} 提交了 ${request.targetRole === 'EXPERT' ? '专家' : '三层助理'} 账户申请`,
      type: 'INFO',
      isRead: false,
      link: '/approval-center',
      createdAt: now(),
    },
    {
      id: `notif-${Date.now()}-admin`,
      userId: 'user-admin',
      title: '新建账户申请待审批',
      message: `${request.applicantName} 提交了 ${request.targetRole === 'EXPERT' ? '专家' : '三层助理'} 账户申请`,
      type: 'INFO',
      isRead: false,
      link: '/approval-center',
      createdAt: now(),
    },
  ];
  persistAll();
  return { ok: true, message: '申请已提交，待HR/Admin审批' };
}

export function reviewAccountRequest(input: {
  requestId: string;
  approve: boolean;
  reviewer: User;
  reviewComment?: string;
}): { ok: boolean; message: string } {
  const request = runtimeRequests.find((item) => item.id === input.requestId);
  if (!request) return { ok: false, message: '申请不存在' };
  if (request.status !== 'PENDING') return { ok: false, message: '该申请已处理' };

  runtimeRequests = runtimeRequests.map((item) => {
    if (item.id !== input.requestId) return item;
    return {
      ...item,
      status: input.approve ? 'APPROVED' : 'REJECTED',
      reviewedById: input.reviewer.id,
      reviewedByName: input.reviewer.username,
      reviewComment: input.reviewComment,
      reviewedAt: now(),
    };
  });

  if (input.approve) {
    const newUser: User = {
      id: `user-${Date.now()}`,
      username: request.targetUsername,
      email: request.targetEmail,
      role: request.targetRole,
      departmentId: request.targetDepartmentId,
      departmentName: request.targetDepartmentName,
      status: 'ACTIVE',
      createdById: input.reviewer.id,
      createdByName: input.reviewer.username,
      createdAt: now(),
    };
    runtimeUsers = [...runtimeUsers, newUser];
    runtimePasswords = { ...runtimePasswords, [request.targetUsername]: request.targetPassword };
  }

  runtimeNotifications = [
    ...runtimeNotifications,
    {
      id: `notif-${Date.now()}-review`,
      userId: request.applicantId,
      title: input.approve ? '账户申请已通过' : '账户申请被驳回',
      message: `${request.targetUsername} 的创建申请${input.approve ? '已通过' : '被驳回'}${input.reviewComment ? `：${input.reviewComment}` : ''}`,
      type: input.approve ? 'SUCCESS' : 'WARNING',
      isRead: false,
      link: '/approval-center',
      createdAt: now(),
    },
  ];

  persistAll();
  return { ok: true, message: input.approve ? '审批通过并已激活账户' : '已驳回申请' };
}

export function createResume(input: Omit<Resume, 'id' | 'createdAt' | 'updatedAt' | 'isOverdue' | 'status'>): Resume {
  const created: Resume = {
    ...input,
    id: `resume-${Date.now()}`,
    status: ResumeStatus.POOL_L2,
    isOverdue: false,
    createdAt: now(),
    updatedAt: now(),
  };
  runtimeResumes = [created, ...runtimeResumes];
  persistAll();
  return created;
}

export function getResumeById(resumeId: string): Resume | null {
  return runtimeResumes.find((item) => item.id === resumeId) || null;
}

function getL2Manager(): User | undefined {
  return runtimeUsers.find((item) => item.role === 'L2_MANAGER');
}

function getL3AssistantByDepartment(departmentId?: string): User | undefined {
  if (!departmentId) return undefined;
  return runtimeUsers.find((item) => item.role === 'L3_ASSISTANT' && item.departmentId === departmentId);
}

function appendNotification(userId: string, title: string, message: string, type: Notification['type'], link?: string): void {
  runtimeNotifications = [
    ...runtimeNotifications,
    {
      id: `notif-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
      userId,
      title,
      message,
      type,
      isRead: false,
      link,
      createdAt: now(),
    },
  ];
}

export function updateResumeProgress(input: { resumeId: string; progress: string; operator: User }): { ok: boolean; message: string } {
  const target = runtimeResumes.find((item) => item.id === input.resumeId);
  if (!target) return { ok: false, message: '简历不存在' };
  runtimeResumes = runtimeResumes.map((item) => {
    if (item.id !== input.resumeId) return item;
    return {
      ...item,
      remark: input.progress,
      updatedAt: now(),
    };
  });
  persistAll();
  return { ok: true, message: '进展已保存' };
}

export function markResumeUnfit(input: {
  resumeId: string;
  operator: User;
  reason: string;
}): { ok: boolean; message: string } {
  const target = runtimeResumes.find((item) => item.id === input.resumeId);
  if (!target) return { ok: false, message: '简历不存在' };

  const l3Assistant = getL3AssistantByDepartment(target.l3DepartmentId);
  runtimeResumes = runtimeResumes.map((item) => {
    if (item.id !== input.resumeId) return item;
    return {
      ...item,
      status: ResumeStatus.REJECTED,
      remark: `不合适：${input.reason}`,
      currentHandlerId: l3Assistant?.id,
      currentHandlerName: l3Assistant?.username || item.currentHandlerName,
      updatedAt: now(),
    };
  });

  if (l3Assistant) {
    appendNotification(
      l3Assistant.id,
      '待办：候选人不合适待上报',
      `简历【${target.candidateName}】已被标记不合适，请上报二层。`,
      'WARNING',
      `/resumes/${target.id}`,
    );
  }

  persistAll();
  return { ok: true, message: '已标记不合适并回流三层助理' };
}

export function reportRejectedToL2(input: { resumeId: string; operator: User }): { ok: boolean; message: string } {
  const target = runtimeResumes.find((item) => item.id === input.resumeId);
  if (!target) return { ok: false, message: '简历不存在' };
  if (target.status !== ResumeStatus.REJECTED) return { ok: false, message: '当前不是待上报状态' };

  const l2Manager = getL2Manager();
  runtimeResumes = runtimeResumes.map((item) => {
    if (item.id !== input.resumeId) return item;
    return {
      ...item,
      status: ResumeStatus.POOL_L2,
      currentHandlerId: l2Manager?.id,
      currentHandlerName: l2Manager?.username || item.currentHandlerName,
      updatedAt: now(),
    };
  });

  if (l2Manager) {
    appendNotification(
      l2Manager.id,
      '三层已上报不合适简历',
      `简历【${target.candidateName}】已上报至二层，请确认后续处理。`,
      'INFO',
      `/resumes/${target.id}`,
    );
  }

  persistAll();
  return { ok: true, message: '已上报至二层经理' };
}

export function assignResumeToExpert(input: { resumeId: string; expertId: string; operator: User }): { ok: boolean; message: string } {
  const target = runtimeResumes.find((item) => item.id === input.resumeId);
  const expert = runtimeUsers.find((item) => item.id === input.expertId && item.role === 'EXPERT');
  if (!target || !expert) return { ok: false, message: '简历或专家不存在' };

  runtimeResumes = runtimeResumes.map((item) => {
    if (item.id !== input.resumeId) return item;
    return {
      ...item,
      status: ResumeStatus.WAIT_IDENTIFY,
      expertId: expert.id,
      expertName: expert.username,
      currentHandlerId: expert.id,
      currentHandlerName: expert.username,
      slaDeadline: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: now(),
    };
  });
  appendNotification(expert.id, '新简历待识别', `简历【${target.candidateName}】已分配给你。`, 'INFO', `/resumes/${target.id}`);
  persistAll();
  return { ok: true, message: '已指派专家' };
}

export function expertIdentifyResult(input: {
  resumeId: string;
  operator: User;
  accepted: boolean;
  comment?: string;
}): { ok: boolean; message: string } {
  if (!input.accepted) {
    return markResumeUnfit({
      resumeId: input.resumeId,
      operator: input.operator,
      reason: input.comment || '专家识别不通过',
    });
  }

  const target = runtimeResumes.find((item) => item.id === input.resumeId);
  if (!target) return { ok: false, message: '简历不存在' };
  const l2Manager = getL2Manager();

  runtimeResumes = runtimeResumes.map((item) => {
    if (item.id !== input.resumeId) return item;
    return {
      ...item,
      status: ResumeStatus.WAIT_CONTACT_INFO,
      currentHandlerId: l2Manager?.id,
      currentHandlerName: l2Manager?.username || item.currentHandlerName,
      remark: input.comment || item.remark,
      slaDeadline: undefined,
      updatedAt: now(),
    };
  });
  if (l2Manager) {
    appendNotification(l2Manager.id, '待补充联系方式', `简历【${target.candidateName}】识别通过，待补充联系方式。`, 'INFO', `/resumes/${target.id}`);
  }
  persistAll();
  return { ok: true, message: '识别结果已提交' };
}

export function submitExpertFeedback(input: { resumeId: string; operator: User; feedback: string }): { ok: boolean; message: string } {
  const target = runtimeResumes.find((item) => item.id === input.resumeId);
  if (!target) return { ok: false, message: '简历不存在' };

  runtimeResumes = runtimeResumes.map((item) => {
    if (item.id !== input.resumeId) return item;
    return {
      ...item,
      status: ResumeStatus.ARCHIVED,
      remark: input.feedback,
      currentHandlerId: undefined,
      currentHandlerName: undefined,
      slaDeadline: undefined,
      updatedAt: now(),
    };
  });
  persistAll();
  return { ok: true, message: '反馈已提交并归档' };
}

export function markNotificationAsRead(notificationId: string): void {
  runtimeNotifications = runtimeNotifications.map((item) => (item.id === notificationId ? { ...item, isRead: true } : item));
  persistAll();
}

export function markAllNotificationsAsRead(userId?: string): void {
  if (!userId) return;
  runtimeNotifications = runtimeNotifications.map((item) => (item.userId === userId ? { ...item, isRead: true } : item));
  persistAll();
}

export function getSourceLabel(source: Source): string {
  const sourceLabels: Record<Source, string> = {
    [Source.A]: '内部推荐',
    [Source.B]: '领英',
    [Source.C]: '招聘网站',
    [Source.D]: '猎头',
    [Source.E]: '招聘会',
    [Source.F]: '直接投递',
    [Source.G]: '其他',
  };
  return sourceLabels[source];
}

export function getRecruitmentScenarioLabel(value?: Resume['recruitmentScenario']): string {
  if (!value) return '-';
  return RECRUITMENT_SCENARIO_LABELS[value];
}

export function getCandidateTypeLabel(value?: CandidateType): string {
  if (!value) return '-';
  return value === 'GRADUATE' ? '应届生' : '实习生';
}

export function isSlaDueIn24Hours(resume: Resume): boolean {
  if (!resume.slaDeadline || resume.isOverdue) return false;
  const deadline = new Date(resume.slaDeadline).getTime();
  const diff = deadline - Date.now();
  return diff > 0 && diff <= 24 * 60 * 60 * 1000;
}

// 判断是否即将超期（SLA剩余时间 ≤ 1/5）
export function isNearSla(resume: Resume): boolean {
  if (!resume.slaDeadline || resume.isOverdue) return false;
  const slaHours = SLA_HOURS[resume.status];
  if (!slaHours) return false;
  
  const deadline = new Date(resume.slaDeadline).getTime();
  const remaining = deadline - Date.now();
  if (remaining <= 0) return false; // 已超期
  
  const threshold = (slaHours * 60 * 60 * 1000) / 5; // SLA的1/5
  return remaining <= threshold;
}

// 计算超期天数（向下取整，超过1天才返回数值，否则返回null）
export function getOverdueDays(resume: Resume): number | null {
  if (!resume.isOverdue || !resume.slaDeadline) return null;
  
  const deadline = new Date(resume.slaDeadline).getTime();
  const overdueMs = Date.now() - deadline;
  const overdueDays = Math.floor(overdueMs / (24 * 60 * 60 * 1000));
  
  // 超过1天才显示
  return overdueDays >= 1 ? overdueDays : null;
}

export function mockLogin(username: string, password: string): User | null {
  const matchedPassword = runtimePasswords[username];
  if (matchedPassword !== password) {
    return null;
  }
  const user = runtimeUsers.find((item) => item.username === username);
  if (!user || user.status === 'PENDING_APPROVAL') {
    return null;
  }
  return user;
}

// 释放简历到资源池（只有一层可见）
export function releaseResume(input: { resumeId: string; operator: User }): { ok: boolean; message: string } {
  const target = runtimeResumes.find((item) => item.id === input.resumeId);
  if (!target) return { ok: false, message: '简历不存在' };

  runtimeResumes = runtimeResumes.map((item) => {
    if (item.id !== input.resumeId) return item;
    return {
      ...item,
      status: ResumeStatus.RELEASED,
      currentHandlerId: undefined,
      currentHandlerName: undefined,
      l3DepartmentId: undefined,
      l3DepartmentName: undefined,
      expertId: undefined,
      expertName: undefined,
      slaDeadline: undefined,
      updatedAt: now(),
    };
  });
  persistAll();
  return { ok: true, message: '简历已释放到资源池' };
}

// 更新用户个人信息
export function updateUserProfile(input: {
  userId: string;
  displayName?: string;
  email?: string;
  newPassword?: string;
}): { ok: boolean; message: string } {
  const target = runtimeUsers.find((item) => item.id === input.userId);
  if (!target) return { ok: false, message: '用户不存在' };

  runtimeUsers = runtimeUsers.map((item) => {
    if (item.id !== input.userId) return item;
    return {
      ...item,
      displayName: input.displayName ?? item.displayName,
      email: input.email ?? item.email,
    };
  });

  if (input.newPassword && target.username) {
    runtimePasswords = { ...runtimePasswords, [target.username]: input.newPassword };
  }

  persistAll();
  return { ok: true, message: '个人信息已更新' };
}

// 增加用户超期计数
export function incrementUserOverdueCount(userId: string): void {
  const currentYear = new Date().getFullYear();
  const target = runtimeUsers.find((item) => item.id === userId);
  if (!target) return;

  runtimeUsers = runtimeUsers.map((item) => {
    if (item.id !== userId) return item;
    const countYear = item.overdueCountYear || currentYear;
    const resetCount = countYear !== currentYear;
    const newCount = resetCount ? 1 : (item.overdueCount || 0) + 1;
    return {
      ...item,
      overdueCount: newCount,
      overdueCountYear: currentYear,
    };
  });

  const updated = runtimeUsers.find((item) => item.id === userId);
  if (!updated) return;

  // 3倍数提醒
  const count = updated.overdueCount || 0;
  if (count > 0 && count % 3 === 0) {
    if (updated.role === 'EXPERT') {
      // 通知三层助理和二层经理
      const l3Assistant = getL3AssistantByDepartment(updated.departmentId);
      const l2Manager = getL2Manager();
      const displayName = updated.displayName || updated.username;
      const msg = `专家【${displayName}】本年超期次数已达 ${count} 次`;
      if (l3Assistant) appendNotification(l3Assistant.id, '超期提醒', msg, 'WARNING');
      if (l2Manager) appendNotification(l2Manager.id, '超期提醒', msg, 'WARNING');
    } else if (updated.role === 'L3_ASSISTANT') {
      // 通知二层经理
      const l2Manager = getL2Manager();
      const displayName = updated.displayName || updated.username;
      if (l2Manager) {
        appendNotification(l2Manager.id, '超期提醒', `三层助理【${displayName}】本年超期次数已达 ${count} 次`, 'WARNING');
      }
    }
  }

  persistAll();
}

// 按角色过滤简历
export function getResumesByRole(user: User): Resume[] {
  const all = [...runtimeResumes];
  switch (user.role) {
    case 'ADMIN':
    case 'HR':
      return all; // 全部可见
    case 'L2_MANAGER':
      // 看所有非RELEASED状态的简历
      return all.filter((item) => item.status !== ResumeStatus.RELEASED);
    case 'L3_ASSISTANT':
      // 只看本三层部门的简历，排除POOL_L2和RELEASED
      return all.filter(
        (item) =>
          item.l3DepartmentId === user.departmentId &&
          item.status !== ResumeStatus.POOL_L2 &&
          item.status !== ResumeStatus.RELEASED
      );
    case 'EXPERT':
      // 只看分配给自己的简历
      return all.filter((item) => item.expertId === user.id || item.currentHandlerId === user.id);
    default:
      return [];
  }
}

// 获取分析数据
export function getAnalyticsData(user: User): {
  byStatus: Record<string, number>;
  bySource: Record<string, number>;
  byDepartment: Record<string, { total: number; overdue: number; inProgress: number }>;
  overdueUsers: Array<{ userId: string; username: string; displayName?: string; departmentName?: string; role: Role; count: number }>;
  releasedBySource: Record<string, number>;
} {
  const resumes = user.role === 'L3_ASSISTANT'
    ? runtimeResumes.filter((item) => item.l3DepartmentId === user.departmentId)
    : runtimeResumes;

  const byStatus: Record<string, number> = {};
  const bySource: Record<string, number> = {};
  const byDepartment: Record<string, { total: number; overdue: number; inProgress: number }> = {};
  const releasedBySource: Record<string, number> = {};

  for (const resume of resumes) {
    // 按状态
    byStatus[resume.status] = (byStatus[resume.status] || 0) + 1;
    // 按来源
    bySource[resume.source] = (bySource[resume.source] || 0) + 1;
    // 释放来源统计
    if (resume.status === ResumeStatus.RELEASED) {
      releasedBySource[resume.source] = (releasedBySource[resume.source] || 0) + 1;
    }
    // 按部门
    const deptName = resume.l3DepartmentName || '未分配';
    if (!byDepartment[deptName]) {
      byDepartment[deptName] = { total: 0, overdue: 0, inProgress: 0 };
    }
    byDepartment[deptName].total += 1;
    if (resume.isOverdue) byDepartment[deptName].overdue += 1;
    if (![ResumeStatus.ARCHIVED, ResumeStatus.RELEASED].includes(resume.status)) {
      byDepartment[deptName].inProgress += 1;
    }
  }

  // 超期用户统计
  const currentYear = new Date().getFullYear();
  const overdueUsers = runtimeUsers
    .filter((item) => item.overdueCount && item.overdueCount > 0 && item.overdueCountYear === currentYear)
    .filter((item) => {
      if (user.role === 'L3_ASSISTANT') return item.departmentId === user.departmentId;
      if (user.role === 'L2_MANAGER') return ['L3_ASSISTANT', 'EXPERT'].includes(item.role);
      return true;
    })
    .map((item) => ({
      userId: item.id,
      username: item.username,
      displayName: item.displayName,
      departmentName: item.departmentName,
      role: item.role,
      count: item.overdueCount || 0,
    }))
    .sort((a, b) => b.count - a.count);

  return { byStatus, bySource, byDepartment, overdueUsers, releasedBySource };
}

// 获取用户对应可见的用户列表
export function getUsersByRole(currentUser: User): User[] {
  const all = [...runtimeUsers];
  switch (currentUser.role) {
    case 'ADMIN':
    case 'HR':
      return all;
    case 'L2_MANAGER':
      // 只看三层部门的账号
      return all.filter((item) => item.role === 'L3_ASSISTANT' || item.role === 'EXPERT');
    case 'L3_ASSISTANT':
      // 只看本部门的专家
      return all.filter((item) => item.role === 'EXPERT' && item.departmentId === currentUser.departmentId);
    default:
      return [];
  }
}
