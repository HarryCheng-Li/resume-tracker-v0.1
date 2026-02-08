import React, { useMemo } from 'react';
import { useAuth } from '../hooks/useAuth';
import { getDepartments, getUsers } from '../lib/mockData';
import { getUserRoleDisplay } from '../types';
import { Building2, Users, ChevronDown, ChevronRight } from 'lucide-react';

const DepartmentsPage: React.FC = () => {
  const { user } = useAuth();
  const departments = getDepartments();
  const users = getUsers();

  const topDepartment = useMemo(() => departments.find((item) => item.level === 1), [departments]);
  const l2Department = useMemo(() => departments.find((item) => item.level === 2), [departments]);
  const l3Departments = useMemo(() => departments.filter((item) => item.level === 3), [departments]);

  const getMembersByDept = (departmentId: string) => users.filter((item) => item.departmentId === departmentId);

  const [expandedDepts, setExpandedDepts] = React.useState<Set<string>>(new Set());

  const toggleExpand = (deptId: string) => {
    setExpandedDepts(prev => {
      const next = new Set(prev);
      if (next.has(deptId)) {
        next.delete(deptId);
      } else {
        next.add(deptId);
      }
      return next;
    });
  };

  if (!user) return <div className="text-slate-500">请先登录</div>;

  // 角色权限过滤
  const visibleL3Depts = useMemo(() => {
    if (user.role === 'L3_ASSISTANT') {
      return l3Departments.filter(d => d.id === user.departmentId);
    }
    return l3Departments;
  }, [user, l3Departments]);

  const showTopLevel = user.role === 'ADMIN' || user.role === 'HR';
  const showL2Level = user.role === 'ADMIN' || user.role === 'HR';

  const DepartmentCard = ({ 
    title, 
    name, 
    departmentId, 
  }: { 
    title: string; 
    name: string; 
    departmentId: string;
  }) => {
    const members = getMembersByDept(departmentId);
    const isExpanded = expandedDepts.has(departmentId);

    return (
      <div className="border border-slate-200 rounded-lg overflow-hidden">
        <div 
          className="p-4 bg-slate-50 flex justify-between items-center cursor-pointer hover:bg-slate-100 transition-colors"
          onClick={() => toggleExpand(departmentId)}
        >
          <div className="flex items-center gap-3">
            <Building2 className="w-5 h-5 text-slate-500" />
            <div>
              <p className="text-xs text-slate-500">{title}</p>
              <h3 className="font-semibold text-slate-900">{name}</h3>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-500 flex items-center gap-1">
              <Users className="w-4 h-4" /> {members.length} 人
            </span>
            {isExpanded ? <ChevronDown className="w-5 h-5 text-slate-400" /> : <ChevronRight className="w-5 h-5 text-slate-400" />}
          </div>
        </div>
        {isExpanded && (
          <div className="p-4 border-t border-slate-200 bg-white">
            {members.length === 0 ? (
              <p className="text-sm text-slate-500">暂无成员</p>
            ) : (
              <div className="space-y-2">
                {members.map(member => (
                  <div key={member.id} className="flex justify-between items-center py-2 px-3 rounded bg-slate-50">
                    <span className="text-sm font-medium text-slate-800">{member.displayName || member.username}</span>
                    <span className="text-xs text-slate-500">{getUserRoleDisplay(member)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">部门管理</h1>

      <div className="space-y-6">
        {showTopLevel && topDepartment && (
          <DepartmentCard 
            title="一级部门（招聘COE）" 
            name={topDepartment.name} 
            departmentId={topDepartment.id}
          />
        )}

        {showL2Level && l2Department && (
          <DepartmentCard 
            title="二层部门" 
            name={l2Department.name} 
            departmentId={l2Department.id}
          />
        )}

        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-800">三层部门</h2>
            <span className="text-sm text-slate-500">{visibleL3Depts.length} 个部门</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {visibleL3Depts.map((dept) => {
              const members = getMembersByDept(dept.id);
              const isExpanded = expandedDepts.has(dept.id);
              return (
                <div key={dept.id} className="border border-slate-200 rounded-lg overflow-hidden bg-white">
                  <div 
                    className="p-4 flex justify-between items-center cursor-pointer hover:bg-slate-50 transition-colors"
                    onClick={() => toggleExpand(dept.id)}
                  >
                    <div>
                      <h3 className="font-medium text-slate-900">{dept.name}</h3>
                      <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                        <Users className="w-3 h-3" /> {members.length} 人
                      </p>
                    </div>
                    {isExpanded ? <ChevronDown className="w-5 h-5 text-slate-400" /> : <ChevronRight className="w-5 h-5 text-slate-400" />}
                  </div>
                  {isExpanded && (
                    <div className="px-4 pb-4 border-t border-slate-100">
                      {members.length === 0 ? (
                        <p className="text-sm text-slate-500 pt-3">暂无成员</p>
                      ) : (
                        <div className="space-y-1 pt-3">
                          {members.map(member => (
                            <div key={member.id} className="flex justify-between items-center py-1.5 px-2 rounded text-sm">
                              <span className="text-slate-800">{member.displayName || member.username}</span>
                              <span className="text-xs text-slate-500 px-2 py-0.5 bg-slate-100 rounded">
                                {member.role === 'L3_ASSISTANT' ? '助理' : member.role === 'EXPERT' ? '专家' : member.role}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DepartmentsPage;
