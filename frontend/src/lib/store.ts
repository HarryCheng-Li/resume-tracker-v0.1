/**
 * 本地存储管理
 */
import { Department, User, Resume, Notification, AccountApprovalRequest } from '../types';
import {
  defaultDepartments,
  defaultUsers,
  defaultPasswords,
  defaultNotifications,
  defaultRequests,
  defaultWorkflowLogs,
} from './data/defaultData';
import { generateRandomResumes } from './resumeGenerator';

export const STORAGE_KEYS = {
  users: 'rt_users_v2',
  departments: 'rt_departments_v2',
  resumes: 'rt_resumes_v2',
  notifications: 'rt_notifications_v2',
  requests: 'rt_requests_v2',
  passwords: 'rt_passwords_v2',
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

// 生成默认简历数据
const defaultResumes: Resume[] = generateRandomResumes(200);

// 初始化运行时数据
let runtimeDepartments = loadLocal(STORAGE_KEYS.departments, defaultDepartments);
let runtimeUsers = loadLocal(STORAGE_KEYS.users, defaultUsers);
let runtimeResumes = loadLocal(STORAGE_KEYS.resumes, defaultResumes);
let runtimeNotifications = loadLocal(STORAGE_KEYS.notifications, defaultNotifications);
let runtimeRequests = loadLocal<AccountApprovalRequest[]>(STORAGE_KEYS.requests, defaultRequests);
let runtimePasswords = loadLocal<Record<string, string>>(STORAGE_KEYS.passwords, defaultPasswords);
const runtimeWorkflowLogs = { ...defaultWorkflowLogs };

function persistAll() {
  saveLocal(STORAGE_KEYS.departments, runtimeDepartments);
  saveLocal(STORAGE_KEYS.users, runtimeUsers);
  saveLocal(STORAGE_KEYS.resumes, runtimeResumes);
  saveLocal(STORAGE_KEYS.notifications, runtimeNotifications);
  saveLocal(STORAGE_KEYS.requests, runtimeRequests);
  saveLocal(STORAGE_KEYS.passwords, runtimePasswords);
}

// 导出存储状态管理器
export const store = {
  // Getters
  getDepartments: (): Department[] => [...runtimeDepartments],
  getUsers: (): User[] => [...runtimeUsers],
  getResumes: (): Resume[] => [...runtimeResumes],
  getNotifications: (): Notification[] => [...runtimeNotifications],
  getRequests: (): AccountApprovalRequest[] => [...runtimeRequests],
  getPasswords: (): Record<string, string> => ({ ...runtimePasswords }),
  getWorkflowLogs: () => ({ ...runtimeWorkflowLogs }),

  // Setters
  setDepartments: (data: Department[]) => {
    runtimeDepartments = data;
    persistAll();
  },
  setUsers: (data: User[]) => {
    runtimeUsers = data;
    persistAll();
  },
  setResumes: (data: Resume[]) => {
    runtimeResumes = data;
    persistAll();
  },
  setNotifications: (data: Notification[]) => {
    runtimeNotifications = data;
    persistAll();
  },
  setRequests: (data: AccountApprovalRequest[]) => {
    runtimeRequests = data;
    persistAll();
  },
  setPasswords: (data: Record<string, string>) => {
    runtimePasswords = data;
    persistAll();
  },

  // 重置
  reset: () => {
    runtimeDepartments = [...defaultDepartments];
    runtimeUsers = [...defaultUsers];
    runtimeResumes = [...defaultResumes];
    runtimeNotifications = [...defaultNotifications];
    runtimeRequests = [...defaultRequests];
    runtimePasswords = { ...defaultPasswords };
    persistAll();
  },

  // 持久化
  persist: persistAll,
};
