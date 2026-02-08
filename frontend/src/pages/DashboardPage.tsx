import React, { useMemo } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  getAccountApprovalRequests,
  getAnalyticsData,
  getResumesByRole,
  getSourceLabel,
  isNearSla,
  getOverdueDays,
} from '../lib/mockData';
import { Resume, ResumeStatus, Role, STATUS_LABELS, Source } from '../types';
import DataTable from '../components/DataTable';
import ResumeStatusBadge from '../components/ResumeStatusBadge';
import LoadingSpinner from '../components/LoadingSpinner';
import { AlertTriangle, CheckCircle, Clock, FileText, Users, BarChart3, TrendingUp, PieChart } from 'lucide-react';

const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ['dashboard', user?.role, user?.id],
    queryFn: async () => {
      await new Promise((resolve) => setTimeout(resolve, 200));
      if (!user) return null;
      const resumes = getResumesByRole(user);
      const requests = getAccountApprovalRequests();
      const analytics = getAnalyticsData(user);
      // 即将到期：只显示当前用户作为责任人的
      const nearSlaResumes = resumes.filter((r) => r.currentHandlerId === user.id && isNearSla(r));
      const myResumes = resumes.filter((item) => item.currentHandlerId === user.id);

      return { resumes, requests, analytics, nearSlaResumes, myResumes };
    },
    enabled: !!user,
  });

  const columns = useMemo(() => [
    { header: '候选人', accessor: 'candidateName' as keyof Resume },
    { header: '状态', accessor: (item: Resume) => <ResumeStatusBadge status={item.status} isOverdue={item.isOverdue} isNearSla={isNearSla(item)} overdueDays={getOverdueDays(item)} /> },
    { header: '学校', accessor: (item: Resume) => item.school || '-' },
    { header: '处理人', accessor: (item: Resume) => item.currentHandlerName || '-' },
  ], []);

  if (isLoading || !data || !user) return <LoadingSpinner />;

  const { resumes, requests, analytics, nearSlaResumes, myResumes } = data;
  const pendingApprovals = requests.filter((item) => item.status === 'PENDING').length;
  // 全局即将超期统计（用于数据卡片，只显示不提醒）
  const allNearSla = resumes.filter(isNearSla);

  // Clickable Card Component
  const Card = ({ 
    title, 
    value, 
    icon: Icon, 
    color, 
    onClick 
  }: { 
    title: string; 
    value: number; 
    icon: React.ElementType; 
    color: string;
    onClick?: () => void;
  }) => (
    <div 
      onClick={onClick}
      className={`bg-white p-6 rounded-lg shadow-sm border border-slate-200 flex items-center justify-between ${onClick ? 'cursor-pointer hover:shadow-md hover:border-slate-300 transition-all' : ''}`}
    >
      <div>
        <p className="text-sm font-medium text-slate-500">{title}</p>
        <p className={`text-2xl font-bold ${color}`}>{value}</p>
      </div>
      <div className={`p-3 rounded-full ${color.replace('text-', 'bg-').replace('600', '100')}`}>
        <Icon className={`w-6 h-6 ${color}`} />
      </div>
    </div>
  );

  // Simple Bar Chart Component
  const SimpleBarChart = ({ data, title, onItemClick }: { data: Record<string, number>; title: string; onItemClick?: (key: string) => void }) => {
    const entries = Object.entries(data).sort((a, b) => b[1] - a[1]).slice(0, 8);
    const max = Math.max(...entries.map(([, v]) => v), 1);
    return (
      <div className="bg-white p-5 rounded-lg shadow-sm border border-slate-200">
        <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <BarChart3 className="w-5 h-5" /> {title}
        </h3>
        <div className="space-y-3">
          {entries.map(([key, value]) => (
            <div 
              key={key} 
              className={`flex items-center gap-3 ${onItemClick ? 'cursor-pointer hover:bg-slate-50 rounded p-1 -m-1' : ''}`}
              onClick={() => onItemClick?.(key)}
            >
              <div className="w-24 text-sm text-slate-600 truncate">{STATUS_LABELS[key as ResumeStatus] || getSourceLabel(key as Source) || key}</div>
              <div className="flex-1 bg-slate-100 rounded-full h-4 overflow-hidden">
                <div 
                  className="bg-blue-500 h-full rounded-full transition-all" 
                  style={{ width: `${(value / max) * 100}%` }}
                />
              </div>
              <div className="w-8 text-sm font-medium text-slate-700">{value}</div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Simple Pie Chart Component (CSS-based)
  const SimplePieChart = ({ data, title, onItemClick }: { data: Record<string, number>; title: string; onItemClick?: (key: string) => void }) => {
    const entries = Object.entries(data).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]);
    const total = entries.reduce((sum, [, v]) => sum + v, 0);
    if (total === 0) return null;
    
    const colors = [
      'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-purple-500', 
      'bg-pink-500', 'bg-indigo-500', 'bg-red-500', 'bg-orange-500',
      'bg-teal-500', 'bg-cyan-500'
    ];
    
    // 计算饼图各部分
    let cumulative = 0;
    const segments = entries.map(([key, value], i) => {
      const percentage = (value / total) * 100;
      const start = cumulative;
      cumulative += percentage;
      return { key, value, percentage, start, color: colors[i % colors.length] };
    });
    
    // 生成conic-gradient
    const gradient = segments.map((seg) => {
      const colorHex = {
        'bg-blue-500': '#3b82f6', 'bg-green-500': '#22c55e', 'bg-yellow-500': '#eab308',
        'bg-purple-500': '#a855f7', 'bg-pink-500': '#ec4899', 'bg-indigo-500': '#6366f1',
        'bg-red-500': '#ef4444', 'bg-orange-500': '#f97316', 'bg-teal-500': '#14b8a6',
        'bg-cyan-500': '#06b6d4'
      }[seg.color] || '#94a3b8';
      return `${colorHex} ${seg.start}% ${seg.start + seg.percentage}%`;
    }).join(', ');

    return (
      <div className="bg-white p-5 rounded-lg shadow-sm border border-slate-200">
        <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <PieChart className="w-5 h-5" /> {title}
        </h3>
        <div className="flex items-start gap-6">
          <div 
            className="w-32 h-32 rounded-full flex-shrink-0"
            style={{ background: `conic-gradient(${gradient})` }}
          />
          <div className="flex-1 space-y-2 max-h-32 overflow-y-auto">
            {segments.map((seg) => (
              <div 
                key={seg.key}
                className={`flex items-center gap-2 text-sm ${onItemClick ? 'cursor-pointer hover:bg-slate-50 rounded px-1' : ''}`}
                onClick={() => onItemClick?.(seg.key)}
              >
                <div className={`w-3 h-3 rounded-sm flex-shrink-0 ${seg.color}`} />
                <span className="truncate flex-1">{STATUS_LABELS[seg.key as ResumeStatus] || getSourceLabel(seg.key as Source) || seg.key}</span>
                <span className="text-slate-500">{seg.value} ({seg.percentage.toFixed(1)}%)</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // Department Stats Table
  const DeptStatsTable = ({ data }: { data: Record<string, { total: number; overdue: number; inProgress: number }> }) => {
    const entries = Object.entries(data).sort((a, b) => b[1].total - a[1].total);
    const totals = entries.reduce((acc, [, v]) => ({
      total: acc.total + v.total,
      overdue: acc.overdue + v.overdue,
      inProgress: acc.inProgress + v.inProgress,
    }), { total: 0, overdue: 0, inProgress: 0 });

    return (
      <div className="bg-white p-5 rounded-lg shadow-sm border border-slate-200">
        <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <PieChart className="w-5 h-5" /> 部门数据概览
        </h3>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-slate-500">
              <th className="py-2 text-left">部门</th>
              <th className="py-2 text-right">总数</th>
              <th className="py-2 text-right">超期</th>
              <th className="py-2 text-right">跟进中</th>
              <th className="py-2 text-right">超期率</th>
            </tr>
          </thead>
          <tbody>
            {entries.map(([dept, stats]) => (
              <tr key={dept} className="border-b border-slate-100">
                <td className="py-2">{dept}</td>
                <td className="py-2 text-right">{stats.total}</td>
                <td className="py-2 text-right text-red-600">{stats.overdue}</td>
                <td className="py-2 text-right text-blue-600">{stats.inProgress}</td>
                <td className="py-2 text-right">{stats.total > 0 ? ((stats.overdue / stats.total) * 100).toFixed(1) : 0}%</td>
              </tr>
            ))}
            <tr className="font-semibold bg-slate-50">
              <td className="py-2">合计</td>
              <td className="py-2 text-right">{totals.total}</td>
              <td className="py-2 text-right text-red-600">{totals.overdue}</td>
              <td className="py-2 text-right text-blue-600">{totals.inProgress}</td>
              <td className="py-2 text-right">{totals.total > 0 ? ((totals.overdue / totals.total) * 100).toFixed(1) : 0}%</td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  };

  // Overdue Users Table
  const OverdueUsersTable = ({ users }: { users: typeof analytics.overdueUsers }) => {
    if (users.length === 0) return null;
    return (
      <div className="bg-white p-5 rounded-lg shadow-sm border border-slate-200">
        <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-amber-500" /> 超期责任人统计
        </h3>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-slate-500">
              <th className="py-2 text-left">姓名</th>
              <th className="py-2 text-left">部门</th>
              <th className="py-2 text-left">角色</th>
              <th className="py-2 text-right">超期次数</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.userId} className="border-b border-slate-100">
                <td className="py-2">{u.displayName || u.username}</td>
                <td className="py-2">{u.departmentName || '-'}</td>
                <td className="py-2">{u.role}</td>
                <td className="py-2 text-right font-semibold text-red-600">{u.count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const roleLabel: Record<Role, string> = {
    HR: 'HR',
    L2_MANAGER: '二层经理',
    L3_ASSISTANT: '三层助理',
    EXPERT: '专家',
    ADMIN: '管理员',
  };

  const renderRoleContent = () => {
    switch (user.role) {
      case 'ADMIN':
      case 'HR':
        return (
          <>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
              <Card title="简历总数" value={resumes.length} icon={FileText} color="text-slate-600" onClick={() => navigate('/resumes')} />
              <Card title="待审批账户" value={pendingApprovals} icon={Users} color="text-yellow-600" onClick={() => navigate('/approval-center')} />
              <Card title="已超期" value={resumes.filter(r => r.isOverdue).length} icon={AlertTriangle} color="text-red-600" onClick={() => navigate('/resumes?filter=overdue')} />
              <Card title="即将超期" value={allNearSla.length} icon={Clock} color="text-amber-600" onClick={() => navigate('/resumes?filter=nearSla')} />
              <Card title="我的即将到期" value={nearSlaResumes.length} icon={TrendingUp} color="text-orange-600" onClick={() => navigate('/resumes?filter=myNearSla')} />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <SimplePieChart 
                data={analytics.byStatus} 
                title="状态分布" 
                onItemClick={(key) => navigate(`/resumes?status=${key}`)} 
              />
              <SimplePieChart 
                data={analytics.bySource} 
                title="来源分布" 
                onItemClick={(key) => navigate(`/resumes?source=${key}`)} 
              />
            </div>
            <DeptStatsTable data={analytics.byDepartment} />
            {analytics.releasedBySource && Object.keys(analytics.releasedBySource).length > 0 && (
              <SimpleBarChart 
                data={analytics.releasedBySource} 
                title="释放来源统计" 
                onItemClick={(key) => navigate(`/resumes?status=RELEASED&source=${key}`)} 
              />
            )}
            <OverdueUsersTable users={analytics.overdueUsers} />
          </>
        );

      case 'L2_MANAGER':
        return (
          <>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
              <Card title="待分发到三层" value={resumes.filter(r => r.status === ResumeStatus.POOL_L2).length} icon={Users} color="text-blue-600" onClick={() => navigate('/resumes?status=POOL_L2')} />
              <Card title="待填联系方式" value={resumes.filter(r => r.status === ResumeStatus.WAIT_CONTACT_INFO).length} icon={FileText} color="text-yellow-600" onClick={() => navigate('/resumes?status=WAIT_CONTACT_INFO')} />
              <Card title="即将到期" value={nearSlaResumes.length} icon={AlertTriangle} color="text-amber-600" onClick={() => navigate('/resumes?filter=myNearSla')} />
              <Card title="即将超期(全)" value={allNearSla.length} icon={Clock} color="text-orange-600" onClick={() => navigate('/resumes?filter=nearSla')} />
              <Card title="进行中" value={resumes.filter(r => ![ResumeStatus.ARCHIVED, ResumeStatus.RELEASED].includes(r.status)).length} icon={TrendingUp} color="text-green-600" onClick={() => navigate('/resumes')} />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <SimplePieChart 
                data={analytics.byStatus} 
                title="状态分布" 
                onItemClick={(key) => navigate(`/resumes?status=${key}`)} 
              />
              <DeptStatsTable data={analytics.byDepartment} />
            </div>
            <OverdueUsersTable users={analytics.overdueUsers} />
          </>
        );

      case 'L3_ASSISTANT':
        const l3Resumes = resumes.filter(r => r.l3DepartmentId === user.departmentId);
        const waitAssign = l3Resumes.filter(r => r.status === ResumeStatus.POOL_L3);
        const rejected = l3Resumes.filter(r => r.status === ResumeStatus.REJECTED);
        const l3NearSla = l3Resumes.filter(r => r.currentHandlerId === user.id && isNearSla(r));
        return (
          <>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
              <Card title="待分配专家" value={waitAssign.length} icon={Users} color="text-blue-600" onClick={() => navigate('/resumes?status=POOL_L3')} />
              <Card title="不合适待上报" value={rejected.length} icon={AlertTriangle} color="text-yellow-600" onClick={() => navigate('/resumes?status=REJECTED')} />
              <Card title="本部门简历" value={l3Resumes.length} icon={FileText} color="text-slate-600" onClick={() => navigate('/resumes')} />
              <Card title="即将到期" value={l3NearSla.length} icon={Clock} color="text-amber-600" onClick={() => navigate('/resumes?filter=myNearSla')} />
              <Card title="即将超期(全)" value={l3Resumes.filter(isNearSla).length} icon={TrendingUp} color="text-orange-600" onClick={() => navigate('/resumes?filter=nearSla')} />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <SimplePieChart 
                data={analytics.byStatus} 
                title="状态分布" 
                onItemClick={(key) => navigate(`/resumes?status=${key}`)} 
              />
              <OverdueUsersTable users={analytics.overdueUsers} />
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
                <h2 className="font-semibold text-slate-800">待处理任务</h2>
              </div>
              <DataTable data={[...waitAssign, ...rejected]} columns={columns} onRowClick={(item) => navigate(`/resumes/${item.id}`)} emptyMessage="暂无待处理任务" />
            </div>
          </>
        );

      case 'EXPERT':
        const waitIdentify = myResumes.filter(r => r.status === ResumeStatus.WAIT_IDENTIFY);
        const waitFeedback = myResumes.filter(r => r.status === ResumeStatus.WAIT_FEEDBACK);
        const myNearSla = myResumes.filter(isNearSla);
        return (
          <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card title="分配到我" value={myResumes.length} icon={Users} color="text-blue-600" onClick={() => navigate('/resumes')} />
              <Card title="待识别" value={waitIdentify.length} icon={FileText} color="text-yellow-600" onClick={() => navigate('/resumes?status=WAIT_IDENTIFY')} />
              <Card title="待反馈" value={waitFeedback.length} icon={CheckCircle} color="text-green-600" onClick={() => navigate('/resumes?status=WAIT_FEEDBACK')} />
              <Card title="即将到期" value={myNearSla.length} icon={AlertTriangle} color="text-amber-600" onClick={() => navigate('/resumes?filter=myNearSla')} />
            </div>
            {myNearSla.length > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <h3 className="font-semibold text-amber-800 mb-2 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" /> 紧急提醒：以下简历即将到期
                </h3>
                <DataTable data={myNearSla} columns={columns} onRowClick={(item) => navigate(`/resumes/${item.id}`)} />
              </div>
            )}
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
                <h2 className="font-semibold text-slate-800">我的简历</h2>
              </div>
              <DataTable data={myResumes} columns={columns} onRowClick={(item) => navigate(`/resumes/${item.id}`)} emptyMessage="暂无分配的简历" />
            </div>
          </>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-800">
          工作台 <span className="text-slate-400 text-lg font-normal">| {roleLabel[user.role]}</span>
        </h1>
        {(user.role === 'L2_MANAGER' || user.role === 'HR') && (
          <button onClick={() => navigate('/upload')} className="btn-primary">录入简历</button>
        )}
      </div>
      {renderRoleContent()}
    </div>
  );
};

export default DashboardPage;
