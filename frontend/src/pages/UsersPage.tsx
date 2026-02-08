import React, { useMemo, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import {
  createDirectUser,
  getAccountApprovalRequests,
  getDepartments,
  getUsersByRole,
  submitAccountRequest,
} from '../lib/mockData';
import { getUserRoleDisplay, ROLE_LABELS, Role } from '../types';

const UsersPage: React.FC = () => {
  const { user } = useAuth();
  const [refreshToken, setRefreshToken] = useState(0);

  const [directForm, setDirectForm] = useState({
    username: '',
    email: '',
    role: 'L2_MANAGER' as Role,
    password: '',
    departmentId: 'dept-l2',
  });

  const [requestForm, setRequestForm] = useState({
    username: '',
    email: '',
    password: '',
    reason: '',
    departmentId: 'dept-l3-a',
  });

  const users = useMemo(() => {
    void refreshToken;
    if (!user) return [];
    return getUsersByRole(user);
  }, [refreshToken, user]);
  const departments = getDepartments();
  const requests = useMemo(() => {
    void refreshToken;
    return getAccountApprovalRequests();
  }, [refreshToken]);

  if (!user || !['ADMIN', 'HR', 'L2_MANAGER', 'L3_ASSISTANT'].includes(user.role)) {
    return <div className="text-slate-500">您没有用户管理权限。</div>;
  }

  const l3Departments = departments.filter((item) => item.level === 3);

  const allowedDirectRoles: Role[] =
    user.role === 'ADMIN'
      ? ['HR', 'L2_MANAGER', 'L3_ASSISTANT', 'EXPERT']
      : user.role === 'HR'
        ? ['L2_MANAGER', 'L3_ASSISTANT']
        : [];

  const handleCreateDirectUser = (event: React.FormEvent) => {
    event.preventDefault();
    if (!user) return;
    const result = createDirectUser({
      username: directForm.username,
      email: directForm.email,
      role: directForm.role,
      password: directForm.password,
      departmentId: directForm.departmentId,
      creator: user,
    });
    alert(result.message);
    if (result.ok) {
      setDirectForm((prev) => ({ ...prev, username: '', email: '', password: '' }));
      setRefreshToken((prev) => prev + 1);
    }
  };

  const handleSubmitRequest = (event: React.FormEvent) => {
    event.preventDefault();
    if (!user) return;
    const targetRole: Role = user.role === 'L2_MANAGER' ? 'L3_ASSISTANT' : 'EXPERT';
    const requestType = user.role === 'L2_MANAGER' ? 'CREATE_L3_ASSISTANT' : 'CREATE_EXPERT';
    const result = submitAccountRequest({
      requestType,
      applicant: user,
      targetUsername: requestForm.username,
      targetEmail: requestForm.email,
      targetRole,
      targetDepartmentId: requestForm.departmentId,
      targetPassword: requestForm.password,
      reason: requestForm.reason,
    });
    alert(result.message);
    if (result.ok) {
      setRequestForm((prev) => ({ ...prev, username: '', email: '', password: '', reason: '' }));
      setRefreshToken((prev) => prev + 1);
    }
  };

  const myRequests = requests.filter((item) => item.applicantId === user.id);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">用户管理</h1>

      {(user.role === 'ADMIN' || user.role === 'HR') && (
        <section className="bg-white rounded-lg border border-slate-200 shadow-sm p-6 space-y-4">
          <h2 className="text-lg font-semibold text-slate-800">创建账号（立即激活）</h2>
          <form className="grid grid-cols-1 md:grid-cols-2 gap-4" onSubmit={handleCreateDirectUser}>
            <input
              className="input-field"
              placeholder="用户名"
              value={directForm.username}
              onChange={(event) => setDirectForm((prev) => ({ ...prev, username: event.target.value }))}
              required
            />
            <input
              className="input-field"
              placeholder="邮箱"
              type="email"
              value={directForm.email}
              onChange={(event) => setDirectForm((prev) => ({ ...prev, email: event.target.value }))}
              required
            />
            <select
              className="input-field"
              value={directForm.role}
              onChange={(event) => setDirectForm((prev) => ({ ...prev, role: event.target.value as Role }))}
            >
              {allowedDirectRoles.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
            <select
              className="input-field"
              value={directForm.departmentId}
              onChange={(event) => setDirectForm((prev) => ({ ...prev, departmentId: event.target.value }))}
            >
              {departments.map((department) => (
                <option key={department.id} value={department.id}>
                  {department.name}
                </option>
              ))}
            </select>
            <input
              className="input-field md:col-span-2"
              placeholder="初始密码"
              value={directForm.password}
              onChange={(event) => setDirectForm((prev) => ({ ...prev, password: event.target.value }))}
              required
            />
            <button className="btn-primary md:col-span-2" type="submit">创建并激活</button>
          </form>
        </section>
      )}

      {(user.role === 'L2_MANAGER' || user.role === 'L3_ASSISTANT') && (
        <section className="bg-white rounded-lg border border-slate-200 shadow-sm p-6 space-y-4">
          <h2 className="text-lg font-semibold text-slate-800">
            {user.role === 'L2_MANAGER' ? '申请创建三层助理账号' : '申请创建专家账号'}
          </h2>
          <form className="grid grid-cols-1 md:grid-cols-2 gap-4" onSubmit={handleSubmitRequest}>
            <input
              className="input-field"
              placeholder="用户名"
              value={requestForm.username}
              onChange={(event) => setRequestForm((prev) => ({ ...prev, username: event.target.value }))}
              required
            />
            <input
              className="input-field"
              placeholder="邮箱"
              type="email"
              value={requestForm.email}
              onChange={(event) => setRequestForm((prev) => ({ ...prev, email: event.target.value }))}
              required
            />
            <select
              className="input-field"
              value={requestForm.departmentId}
              onChange={(event) => setRequestForm((prev) => ({ ...prev, departmentId: event.target.value }))}
            >
              {l3Departments.map((department) => (
                <option key={department.id} value={department.id}>
                  {department.name}
                </option>
              ))}
            </select>
            <input
              className="input-field"
              placeholder="初始密码"
              value={requestForm.password}
              onChange={(event) => setRequestForm((prev) => ({ ...prev, password: event.target.value }))}
              required
            />
            <textarea
              className="input-field md:col-span-2 h-24"
              placeholder="申请理由（可选）"
              value={requestForm.reason}
              onChange={(event) => setRequestForm((prev) => ({ ...prev, reason: event.target.value }))}
            />
            <button className="btn-primary md:col-span-2" type="submit">提交审批</button>
          </form>

          <div className="pt-4 border-t border-slate-200">
            <h3 className="font-medium text-slate-800 mb-2">我的申请记录</h3>
            <div className="space-y-2">
              {myRequests.length === 0 ? (
                <p className="text-sm text-slate-500">暂无申请记录</p>
              ) : (
                myRequests.map((request) => (
                  <div key={request.id} className="border border-slate-200 rounded-lg p-3 space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="font-medium">{request.targetUsername}</span>
                        <span className={`ml-2 px-2 py-0.5 rounded text-xs ${
                          request.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                          request.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {request.status === 'PENDING' ? '待审批' : request.status === 'APPROVED' ? '已通过' : '已驳回'}
                        </span>
                      </div>
                      <span className="text-xs text-slate-400">{new Date(request.createdAt).toLocaleString()}</span>
                    </div>
                    <div className="text-sm text-slate-600 space-y-1">
                      <p>目标角色: {ROLE_LABELS[request.targetRole]} | 部门: {request.targetDepartmentName}</p>
                      {request.reason && <p>申请理由: {request.reason}</p>}
                      {request.status !== 'PENDING' && (
                        <>
                          <p>审批人: {request.reviewedByName || '-'}</p>
                          <p>审批时间: {request.reviewedAt ? new Date(request.reviewedAt).toLocaleString() : '-'}</p>
                          {request.reviewComment && <p>审批备注: {request.reviewComment}</p>}
                        </>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>
      )}

      <section className="bg-white rounded-lg border border-slate-200 shadow-sm p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-slate-800">账户列表</h2>
          <span className="text-sm text-slate-500">{users.length} 个</span>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500">
                <th className="py-2 text-left">用户名</th>
                <th className="py-2 text-left">邮箱</th>
                <th className="py-2 text-left">角色</th>
                <th className="py-2 text-left">部门</th>
                <th className="py-2 text-left">状态</th>
              </tr>
            </thead>
            <tbody>
              {users.map((item) => (
                <tr key={item.id} className="border-b border-slate-100">
                  <td className="py-2">{item.username}</td>
                  <td className="py-2">{item.email}</td>
                  <td className="py-2">{getUserRoleDisplay(item)}</td>
                  <td className="py-2">{item.departmentName || '-'}</td>
                  <td className="py-2">{item.status || 'ACTIVE'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default UsersPage;
