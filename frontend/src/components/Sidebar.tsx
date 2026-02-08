import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import {
  LayoutDashboard,
  FileText,
  Upload,
  Building2,
  Users,
  CheckSquare,
  LogOut,
  Settings
} from 'lucide-react';
import { clsx } from 'clsx';

// 角色中文映射
const ROLE_LABELS: Record<string, string> = {
  'ADMIN': '管理员',
  'HR': 'HR',
  'L2_MANAGER': '二层经理',
  'L3_ASSISTANT': '三层助理',
  'EXPERT': '专家',
};

const Sidebar: React.FC = () => {
  const { user, logout } = useAuth();

  const navItems = [
    { 
      name: '工作台', 
      path: '/', 
      icon: LayoutDashboard, 
      roles: ['HR', 'L2_MANAGER', 'L3_ASSISTANT', 'EXPERT', 'ADMIN'] 
    },
    { 
      name: '简历列表', 
      path: '/resumes', 
      icon: FileText, 
      roles: ['HR', 'L2_MANAGER', 'L3_ASSISTANT', 'EXPERT', 'ADMIN'] 
    },
      {
        name: '上传简历',
        path: '/upload',
        icon: Upload,
        roles: ['L2_MANAGER', 'HR', 'ADMIN']
      },
      {
        name: '部门管理',
        path: '/departments',
        icon: Building2,
        roles: ['ADMIN', 'HR', 'L2_MANAGER', 'L3_ASSISTANT']
      },
      {
        name: '用户管理',
        path: '/users',
        icon: Users,
        roles: ['ADMIN', 'HR', 'L2_MANAGER', 'L3_ASSISTANT']
      },
      {
        name: '审批中心',
        path: '/approval-center',
        icon: CheckSquare,
        roles: ['ADMIN', 'HR']
      },
  ];

  const filteredNavItems = navItems.filter(item => 
    user && item.roles.includes(user.role)
  );

  return (
    <div className="flex flex-col w-64 bg-slate-900 text-white h-screen fixed left-0 top-0 overflow-y-auto">
      <div className="flex items-center justify-center h-16 border-b border-slate-800">
        <h1 className="text-xl font-bold tracking-wider">简历跟踪系统</h1>
      </div>
      
      <div className="flex flex-col flex-1 py-4">
        <nav className="flex-1 px-2 space-y-1">
          {filteredNavItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) =>
                clsx(
                  'group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors',
                  isActive
                    ? 'bg-slate-800 text-white'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                )
              }
            >
              <item.icon
                className="mr-3 flex-shrink-0 h-5 w-5"
                aria-hidden="true"
              />
              {item.name}
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="border-t border-slate-800 p-4">
        <div className="flex items-center mb-4">
          <div className="h-8 w-8 rounded-full bg-slate-700 flex items-center justify-center text-sm font-bold">
            {(user?.displayName || user?.username)?.charAt(0).toUpperCase()}
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-white">{user?.displayName || user?.username}</p>
            <p className="text-xs text-slate-400">{ROLE_LABELS[user?.role || ''] || user?.role}</p>
          </div>
        </div>
        <NavLink
          to="/profile"
          className={({ isActive }) =>
            clsx(
              'flex w-full items-center px-2 py-2 text-sm font-medium rounded-md transition-colors mb-1',
              isActive
                ? 'bg-slate-800 text-white'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            )
          }
        >
          <Settings className="mr-3 h-5 w-5" />
          个人设置
        </NavLink>
        <button
          onClick={logout}
          className="flex w-full items-center px-2 py-2 text-sm font-medium text-slate-300 rounded-md hover:bg-slate-800 hover:text-white transition-colors"
        >
          <LogOut className="mr-3 h-5 w-5" />
          退出登录
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
