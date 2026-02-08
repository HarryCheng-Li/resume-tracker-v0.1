import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { updateUserProfile } from '../lib/mockData';
import { User, Settings, Mail, Lock, Save } from 'lucide-react';

const ProfilePage: React.FC = () => {
  const { user, setUser } = useAuth();
  const [form, setForm] = useState({
    displayName: user?.displayName || user?.username || '',
    email: user?.email || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (!user) return <div>请先登录</div>;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (form.newPassword && form.newPassword !== form.confirmPassword) {
      setMessage({ type: 'error', text: '两次输入的新密码不一致' });
      return;
    }

    const result = updateUserProfile({
      userId: user.id,
      displayName: form.displayName || undefined,
      email: form.email || undefined,
      newPassword: form.newPassword || undefined,
    });

    if (result.ok) {
      setMessage({ type: 'success', text: '个人信息已更新' });
      // Update local user state
      if (setUser) {
        setUser({
          ...user,
          displayName: form.displayName,
          email: form.email,
        });
      }
      // Clear password fields
      setForm(prev => ({ ...prev, currentPassword: '', newPassword: '', confirmPassword: '' }));
    } else {
      setMessage({ type: 'error', text: result.message });
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
        <Settings className="w-6 h-6" /> 个人设置
      </h1>

      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
        <div className="flex items-center gap-4 pb-6 border-b border-slate-200 mb-6">
          <div className="w-16 h-16 rounded-full bg-slate-200 flex items-center justify-center text-2xl font-bold text-slate-600">
            {(form.displayName || user.username).charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="text-lg font-semibold text-slate-900">{form.displayName || user.username}</p>
            <p className="text-sm text-slate-500">{user.role} · {user.departmentName || '未分配部门'}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {message && (
            <div className={`p-3 rounded-lg text-sm ${message.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
              {message.text}
            </div>
          )}

          <div className="space-y-4">
            <h3 className="font-medium text-slate-800 flex items-center gap-2">
              <User className="w-4 h-4" /> 基本信息
            </h3>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">用户名（不可修改）</label>
              <input
                type="text"
                className="input-field bg-slate-50"
                value={user.username}
                disabled
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">显示名称</label>
              <input
                type="text"
                className="input-field"
                placeholder="设置您的显示名称"
                value={form.displayName}
                onChange={(e) => setForm(prev => ({ ...prev, displayName: e.target.value }))}
              />
              <p className="text-xs text-slate-500 mt-1">此名称将显示在系统中代替用户名</p>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-medium text-slate-800 flex items-center gap-2">
              <Mail className="w-4 h-4" /> 联系方式
            </h3>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">邮箱地址</label>
              <input
                type="email"
                className="input-field"
                placeholder="your@email.com"
                value={form.email}
                onChange={(e) => setForm(prev => ({ ...prev, email: e.target.value }))}
              />
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-medium text-slate-800 flex items-center gap-2">
              <Lock className="w-4 h-4" /> 修改密码
            </h3>
            <p className="text-sm text-slate-500">如不修改密码，请留空以下字段</p>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">新密码</label>
              <input
                type="password"
                className="input-field"
                placeholder="输入新密码"
                value={form.newPassword}
                onChange={(e) => setForm(prev => ({ ...prev, newPassword: e.target.value }))}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">确认新密码</label>
              <input
                type="password"
                className="input-field"
                placeholder="再次输入新密码"
                value={form.confirmPassword}
                onChange={(e) => setForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200">
            <button type="submit" className="btn-primary flex items-center gap-2">
              <Save className="w-4 h-4" /> 保存更改
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfilePage;
