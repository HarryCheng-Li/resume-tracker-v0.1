import React, { useMemo, useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import {
  CANDIDATE_TYPE_LABELS,
  RECRUITMENT_SCENARIO_LABELS,
  Resume,
  ResumeStatus,
  Source,
  STATUS_LABELS,
  SCHOOL_TAG_LABELS,
  EDUCATION_LEVEL_LABELS,
} from '../types';
import DataTable from '../components/DataTable';
import ResumeStatusBadge from '../components/ResumeStatusBadge';
import { Search, Filter, AlertCircle, X, GraduationCap, User, Download } from 'lucide-react';
import { getResumesByRole, getSourceLabel, isNearSla, getOverdueDays } from '../lib/mockData';

const ResumesPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const urlStatus = searchParams.get('status');
  const urlFilter = searchParams.get('filter');
  const urlSource = searchParams.get('source');

  const fetchResumes = async (): Promise<Resume[]> => {
    await new Promise((resolve) => setTimeout(resolve, 200));
    if (!user) return [];
    return getResumesByRole(user);
  };

  const [searchTerm, setSearchTerm] = useState('');
  const [schoolFilter, setSchoolFilter] = useState('');
  const [handlerFilter, setHandlerFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>(urlStatus || 'ALL');
  const [sourceFilter, setSourceFilter] = useState<string>(urlSource || 'ALL');
  const [yearFilter, setYearFilter] = useState('ALL');
  const [scenarioFilter, setScenarioFilter] = useState('ALL');
  const [candidateTypeFilter, setCandidateTypeFilter] = useState('ALL');
  const [schoolTagFilter, setSchoolTagFilter] = useState('ALL');
  const [educationLevelFilter, setEducationLevelFilter] = useState('ALL');

  const { data: resumes = [], isLoading } = useQuery({
    queryKey: ['resumes', user?.id, user?.role],
    queryFn: fetchResumes,
    enabled: !!user,
  });

  useEffect(() => {
    if (urlStatus) {
      setStatusFilter(urlStatus);
    }
    if (urlSource) {
      setSourceFilter(urlSource);
    }
  }, [urlFilter, urlStatus, urlSource]);

  const uniqueSchools = useMemo(() => {
    const schools = resumes.map((item) => item.school).filter((item): item is string => Boolean(item));
    return [...new Set(schools)].sort();
  }, [resumes]);

  const uniqueHandlers = useMemo(() => {
    const handlers = resumes.map((item) => item.currentHandlerName).filter((item): item is string => Boolean(item));
    return [...new Set(handlers)].sort();
  }, [resumes]);

  const filteredResumes = useMemo(
    () => {
      let filtered = resumes.filter((resume) => {
        const search = searchTerm.toLowerCase();
        const matchesSearch =
          !search ||
          resume.candidateName.toLowerCase().includes(search) ||
          (resume.email?.toLowerCase().includes(search) ?? false);

        const matchesSchool = !schoolFilter || (resume.school?.toLowerCase().includes(schoolFilter.toLowerCase()) ?? false);
        const matchesHandler = !handlerFilter || resume.currentHandlerName === handlerFilter;
        const matchesStatus = statusFilter === 'ALL' || resume.status === statusFilter;
        const matchesSource = sourceFilter === 'ALL' || resume.source === sourceFilter;
        const matchesYear = yearFilter === 'ALL' || resume.graduationYear === yearFilter;
        const matchesScenario = scenarioFilter === 'ALL' || resume.recruitmentScenario === scenarioFilter;
        const matchesCandidateType = candidateTypeFilter === 'ALL' || resume.candidateType === candidateTypeFilter;
        const matchesSchoolTag = schoolTagFilter === 'ALL' || resume.schoolTag === schoolTagFilter;
        const matchesEducationLevel = educationLevelFilter === 'ALL' || resume.educationLevel === educationLevelFilter;

        return (
          matchesSearch &&
          matchesSchool &&
          matchesHandler &&
          matchesStatus &&
          matchesSource &&
          matchesYear &&
          matchesScenario &&
          matchesCandidateType &&
          matchesSchoolTag &&
          matchesEducationLevel
        );
      });

      if (urlFilter === 'nearSla') {
        filtered = filtered.filter(isNearSla);
      }
      if (urlFilter === 'myNearSla' && user) {
        filtered = filtered.filter((r) => r.currentHandlerId === user.id && isNearSla(r));
      }
      if (urlFilter === 'overdue') {
        filtered = filtered.filter((r) => r.isOverdue);
      }

      return filtered;
    },
    [
      resumes,
      searchTerm,
      schoolFilter,
      handlerFilter,
      statusFilter,
      sourceFilter,
      yearFilter,
      scenarioFilter,
      candidateTypeFilter,
      schoolTagFilter,
      educationLevelFilter,
      urlFilter,
      user,
    ],
  );

  const hasFilters =
    searchTerm ||
    schoolFilter ||
    handlerFilter ||
    statusFilter !== 'ALL' ||
    sourceFilter !== 'ALL' ||
    yearFilter !== 'ALL' ||
    scenarioFilter !== 'ALL' ||
    candidateTypeFilter !== 'ALL' ||
    schoolTagFilter !== 'ALL' ||
    educationLevelFilter !== 'ALL';

  const clearFilters = () => {
    setSearchTerm('');
    setSchoolFilter('');
    setHandlerFilter('');
    setStatusFilter('ALL');
    setSourceFilter('ALL');
    setYearFilter('ALL');
    setScenarioFilter('ALL');
    setCandidateTypeFilter('ALL');
    setSchoolTagFilter('ALL');
    setEducationLevelFilter('ALL');
  };

  const exportAsCsv = () => {
    const header = ['姓名', '学校', '来源', '状态', '处理人', '届次', '招聘场景', '应届/实习', '备注', '创建时间'];
    const rows = filteredResumes.map((item) => [
      item.candidateName,
      item.school || '',
      getSourceLabel(item.source),
      STATUS_LABELS[item.status],
      item.currentHandlerName || '',
      item.graduationYear || '',
      item.recruitmentScenario ? RECRUITMENT_SCENARIO_LABELS[item.recruitmentScenario] : '',
      item.candidateType ? CANDIDATE_TYPE_LABELS[item.candidateType] : '',
      item.remark || '',
      new Date(item.createdAt).toLocaleDateString(),
    ]);

    const csv = [header, ...rows]
      .map((line) => line.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `简历导出_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const columns = [
    {
      header: '候选人',
      accessor: (item: Resume) => (
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="font-medium text-slate-900">{item.candidateName}</span>
            {item.isOverdue && (
              <span className="text-red-500" title="已超期">
                <AlertCircle className="w-4 h-4" />
              </span>
            )}
          </div>
          {item.school && (
            <span className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
              <GraduationCap className="w-3 h-3" />
              {item.school}
            </span>
          )}
        </div>
      ),
    },
    { header: '来源', accessor: (item: Resume) => <span className="px-2 py-1 bg-slate-100 rounded text-xs font-medium">{getSourceLabel(item.source)}</span> },
    { header: '状态', accessor: (item: Resume) => <ResumeStatusBadge status={item.status} isOverdue={item.isOverdue} isNearSla={isNearSla(item)} overdueDays={getOverdueDays(item)} /> },
    { header: '当前处理人', accessor: (item: Resume) => <span className="text-sm text-slate-600">{item.currentHandlerName || '-'}</span> },
    { header: '届次', accessor: (item: Resume) => <span className="text-sm text-slate-600">{item.graduationYear || '-'}</span> },
    { header: '招聘场景', accessor: (item: Resume) => <span className="text-sm text-slate-600">{item.recruitmentScenario ? RECRUITMENT_SCENARIO_LABELS[item.recruitmentScenario] : '-'}</span> },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-800">全部简历</h1>
        <div className="flex gap-2">
          <button onClick={exportAsCsv} className="btn-secondary flex items-center gap-2">
            <Download className="w-4 h-4" /> 导出Excel(CSV)
          </button>
          <button onClick={() => navigate('/upload')} className="btn-primary">上传新简历</button>
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-slate-400" />
            </div>
            <input
              type="text"
              className="pl-10 input-field w-full"
              placeholder="按姓名或邮箱搜索..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </div>

          <div className="relative w-full md:w-56">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <GraduationCap className="h-4 w-4 text-slate-400" />
            </div>
            <input
              type="text"
              className="pl-9 input-field w-full"
              placeholder="搜索学校..."
              value={schoolFilter}
              onChange={(event) => setSchoolFilter(event.target.value)}
              list="school-options"
            />
            <datalist id="school-options">
              {uniqueSchools.map((school) => (
                <option key={school} value={school} />
              ))}
            </datalist>
          </div>
        </div>

        <div className="flex flex-wrap gap-4">
          <select className="input-field w-40" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            <option value="ALL">全部状态</option>
            {Object.values(ResumeStatus).map((status) => (
              <option key={status} value={status}>{STATUS_LABELS[status]}</option>
            ))}
          </select>

          <select className="input-field w-40" value={sourceFilter} onChange={(event) => setSourceFilter(event.target.value)}>
            <option value="ALL">全部来源</option>
            {Object.values(Source).map((source) => (
              <option key={source} value={source}>{getSourceLabel(source)}</option>
            ))}
          </select>

          <div className="relative w-44">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <User className="h-4 w-4 text-slate-400" />
            </div>
            <select className="pl-9 input-field w-full" value={handlerFilter} onChange={(event) => setHandlerFilter(event.target.value)}>
              <option value="">全部处理人</option>
              {uniqueHandlers.map((handler) => (
                <option key={handler} value={handler}>{handler}</option>
              ))}
            </select>
          </div>

          <select className="input-field w-32" value={yearFilter} onChange={(event) => setYearFilter(event.target.value)}>
            <option value="ALL">全部届次</option>
            {['27届', '28届', '29届', '30届', '31届', '32届', '33届', '34届', '35届'].map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>

          <select className="input-field w-44" value={scenarioFilter} onChange={(event) => setScenarioFilter(event.target.value)}>
            <option value="ALL">全部场景</option>
            {Object.entries(RECRUITMENT_SCENARIO_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>

          <select className="input-field w-36" value={candidateTypeFilter} onChange={(event) => setCandidateTypeFilter(event.target.value)}>
            <option value="ALL">应届/实习</option>
            {Object.entries(CANDIDATE_TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>

          <select className="input-field w-40" value={schoolTagFilter} onChange={(event) => setSchoolTagFilter(event.target.value)}>
            <option value="ALL">全部院校标签</option>
            {Object.entries(SCHOOL_TAG_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>

          <select className="input-field w-32" value={educationLevelFilter} onChange={(event) => setEducationLevelFilter(event.target.value)}>
            <option value="ALL">全部学历</option>
            {Object.entries(EDUCATION_LEVEL_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>

          {hasFilters && (
            <button onClick={clearFilters} className="flex items-center gap-1 px-3 py-2 text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors">
              <X className="w-4 h-4" /> 清除筛选
            </button>
          )}
        </div>

        <div className="text-sm text-slate-500 flex items-center gap-2">
          <Filter className="w-4 h-4" />
          共 {filteredResumes.length} 条结果
          {hasFilters && ` (已筛选，原始 ${resumes.length} 条)`}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
        <DataTable
          data={filteredResumes}
          columns={columns}
          isLoading={isLoading}
          onRowClick={(item) => navigate(`/resumes/${item.id}`)}
          rowClassName={(item) => (item.isOverdue ? 'bg-red-50 hover:bg-red-100' : '')}
        />
      </div>
    </div>
  );
};

export default ResumesPage;
