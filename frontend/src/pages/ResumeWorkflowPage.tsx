import React, { useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../hooks/useAuth';
import {
  CANDIDATE_TYPE_LABELS,
  RECRUITMENT_SCENARIO_LABELS,
  Resume,
  ResumeStatus,
  SLA_HOURS,
  Source,
} from '../types';
import LoadingSpinner from '../components/LoadingSpinner';
import ResumeStatusBadge from '../components/ResumeStatusBadge';
import { ArrowLeft, Clock, User as UserIcon, Calendar, FileText } from 'lucide-react';
import {
  assignResumeToExpert,
  expertIdentifyResult,
  getResumeById,
  getSourceLabel,
  getUsers,
  getOverdueDays,
  markResumeUnfit,
  releaseResume,
  reportRejectedToL2,
  submitExpertFeedback,
  updateResumeProgress,
} from '../lib/mockData';

const fetchResume = async (id: string): Promise<Resume | null> => {
  await new Promise((resolve) => setTimeout(resolve, 120));
  return getResumeById(id);
};

const ResumeWorkflowPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const [feedback, setFeedback] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [selectedExpertId, setSelectedExpertId] = useState('');

  const { data: resume, isLoading } = useQuery({
    queryKey: ['resume', id],
    queryFn: () => fetchResume(id || ''),
    enabled: Boolean(id),
  });

  const mutation = useMutation({
    mutationFn: async (action: () => { ok: boolean; message: string }) => action(),
    onSuccess: (result) => {
      alert(result.message);
      void queryClient.invalidateQueries({ queryKey: ['resume', id] });
      void queryClient.invalidateQueries({ queryKey: ['resumes'] });
      void queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });

  const expertsOfCurrentDept = useMemo(() => {
    if (!resume?.l3DepartmentId) return [];
    return getUsers().filter((item) => item.role === 'EXPERT' && item.departmentId === resume.l3DepartmentId);
  }, [resume?.l3DepartmentId]);

  const slaHours = resume ? SLA_HOURS[resume.status] : undefined;
  const overdueDays = resume ? getOverdueDays(resume) : null;
  const isNearSla = useMemo(() => {
    if (!resume?.slaDeadline || resume.isOverdue) return false;
    const diff = new Date(resume.slaDeadline).getTime() - Date.now();
    return diff > 0 && diff <= 24 * 60 * 60 * 1000;
  }, [resume]);

  if (isLoading) return <LoadingSpinner />;
  if (!resume || !user || !id) return <div>简历未找到</div>;

  const canMarkUnfit =
    user.role === 'EXPERT' &&
    [ResumeStatus.WAIT_IDENTIFY, ResumeStatus.WAIT_CONNECTION, ResumeStatus.WAIT_FEEDBACK].includes(resume.status);

  const renderActions = () => {
    // 二层经理可以释放简历
    if (user.role === 'L2_MANAGER') {
      if (resume.status === ResumeStatus.POOL_L2) {
        return (
          <div className="space-y-3">
            <h3 className="font-medium text-slate-800">二层操作</h3>
            <p className="text-sm text-slate-500">可将简历释放到资源池（只有一层可见）</p>
            <button
              className="btn-secondary w-full text-amber-600 border-amber-200 hover:bg-amber-50"
              type="button"
              disabled={mutation.isPending}
              onClick={() => mutation.mutate(() => releaseResume({ resumeId: id, operator: user }))}
            >
              释放到资源池
            </button>
          </div>
        );
      }
      return <div className="text-sm text-slate-500">当前状态无可执行动作。</div>;
    }

    if (user.role === 'L3_ASSISTANT') {
      if (resume.status === ResumeStatus.POOL_L3) {
        return (
          <div className="space-y-3">
            <h3 className="font-medium text-slate-800">指派专家</h3>
            <select
              className="input-field"
              value={selectedExpertId}
              onChange={(event) => setSelectedExpertId(event.target.value)}
            >
              <option value="">请选择专家</option>
              {expertsOfCurrentDept.map((item) => (
                <option key={item.id} value={item.id}>{item.username}</option>
              ))}
            </select>
            <button
              className="btn-primary w-full"
              type="button"
              disabled={!selectedExpertId || mutation.isPending}
              onClick={() => mutation.mutate(() => assignResumeToExpert({ resumeId: id, expertId: selectedExpertId, operator: user }))}
            >
              指派并进入待识别
            </button>
          </div>
        );
      }

      if (resume.status === ResumeStatus.REJECTED) {
        return (
          <div className="space-y-3">
            <h3 className="font-medium text-slate-800">上报二层</h3>
            <p className="text-sm text-slate-500">专家已标记该候选人不合适，可上报二层继续处理。</p>
            <button
              className="btn-primary w-full"
              type="button"
              disabled={mutation.isPending}
              onClick={() => mutation.mutate(() => reportRejectedToL2({ resumeId: id, operator: user }))}
            >
              上报至二层经理
            </button>
          </div>
        );
      }
    }

    if (user.role === 'EXPERT') {
      return (
        <div className="space-y-3">
          <textarea
            className="input-field h-24"
            placeholder="填写交流进展..."
            value={feedback}
            onChange={(event) => setFeedback(event.target.value)}
          />
          <button
            className="btn-secondary w-full"
            type="button"
            disabled={!feedback || mutation.isPending}
            onClick={() => mutation.mutate(() => updateResumeProgress({ resumeId: id, progress: feedback, operator: user }))}
          >
            保存交流进展
          </button>

          {resume.status === ResumeStatus.WAIT_IDENTIFY && (
            <div className="grid grid-cols-2 gap-2">
              <button
                className="btn-primary bg-green-600 hover:bg-green-700"
                type="button"
                disabled={mutation.isPending}
                onClick={() => mutation.mutate(() => expertIdentifyResult({ resumeId: id, operator: user, accepted: true, comment: feedback }))}
              >
                识别通过
              </button>
              <button
                className="btn-secondary text-red-600 border-red-200 hover:bg-red-50"
                type="button"
                disabled={mutation.isPending}
                onClick={() => mutation.mutate(() => expertIdentifyResult({ resumeId: id, operator: user, accepted: false, comment: rejectReason || feedback || '专家识别不通过' }))}
              >
                识别不通过
              </button>
            </div>
          )}

          {resume.status === ResumeStatus.WAIT_FEEDBACK && (
            <button
              className="btn-primary w-full"
              type="button"
              disabled={!feedback || mutation.isPending}
              onClick={() => mutation.mutate(() => submitExpertFeedback({ resumeId: id, operator: user, feedback }))}
            >
              提交反馈并归档
            </button>
          )}

          {canMarkUnfit && (
            <>
              <textarea
                className="input-field h-20"
                placeholder="任意阶段可标记不合适，填写原因..."
                value={rejectReason}
                onChange={(event) => setRejectReason(event.target.value)}
              />
              <button
                className="btn-secondary w-full text-red-600 border-red-200 hover:bg-red-50"
                type="button"
                disabled={!rejectReason || mutation.isPending}
                onClick={() => mutation.mutate(() => markResumeUnfit({ resumeId: id, operator: user, reason: rejectReason }))}
              >
                标记不合适并回流三层助理
              </button>
            </>
          )}
        </div>
      );
    }

    return <div className="text-sm text-slate-500">当前角色无可执行动作。</div>;
  };

  return (
    <div className="space-y-4">
      <button onClick={() => navigate(-1)} className="flex items-center text-slate-500 hover:text-slate-700">
        <ArrowLeft className="h-4 w-4 mr-1" /> 返回列表
      </button>

      <div className="h-[calc(100vh-9rem)] flex gap-6">
        <div className="flex-1 rounded-lg border border-slate-200 overflow-hidden bg-slate-200/40">
          <div className="px-5 py-3 bg-white border-b border-slate-200 flex justify-between items-center">
            <h2 className="font-semibold text-slate-700 flex items-center gap-2">
              <FileText className="w-4 h-4" /> 简历预览
            </h2>
            <a href={resume.resumeUrl} target="_blank" rel="noreferrer" className="text-blue-600 text-sm hover:underline">新标签页打开</a>
          </div>
          <div className="h-full p-8 bg-gradient-to-b from-slate-100 to-slate-200">
            <div className="h-full max-w-4xl mx-auto bg-white shadow-2xl rounded-sm overflow-hidden border border-slate-300">
              <iframe src={resume.resumeUrl} className="w-full h-full" title="简历PDF" />
            </div>
          </div>
        </div>

        <div className="w-[420px] flex flex-col gap-4 overflow-y-auto pr-1">
          <div className={`bg-white p-5 rounded-lg shadow-sm border ${resume.isOverdue ? 'border-red-500 bg-red-50' : 'border-slate-200'}`}>
            <div className="flex justify-between items-start mb-3">
              <div>
                <h1 className="text-xl font-bold text-slate-900">{resume.candidateName}</h1>
                <div className="text-xs text-slate-500 mt-1">{getSourceLabel(resume.source as Source)} · {new Date(resume.createdAt).toLocaleDateString()}</div>
              </div>
              <ResumeStatusBadge status={resume.status} isOverdue={resume.isOverdue} isNearSla={isNearSla} overdueDays={overdueDays} />
            </div>

            <div className="space-y-2 text-sm text-slate-700">
              <p><span className="text-slate-500">学校：</span>{resume.school || '-'}</p>
              <p><span className="text-slate-500">届次：</span>{resume.graduationYear || '-'}</p>
              <p><span className="text-slate-500">招聘场景：</span>{resume.recruitmentScenario ? RECRUITMENT_SCENARIO_LABELS[resume.recruitmentScenario] : '-'}</p>
              <p><span className="text-slate-500">类型：</span>{resume.candidateType ? CANDIDATE_TYPE_LABELS[resume.candidateType] : '-'}</p>
              <p><span className="text-slate-500">备注：</span>{resume.remark || '-'}</p>
              <div className="flex items-center gap-2 text-slate-600 pt-1">
                <UserIcon className="w-4 h-4" /> 当前处理人：{resume.currentHandlerName || '未分配'}
              </div>
              {slaHours && (
                <div className={`flex items-center gap-2 ${resume.isOverdue ? 'text-red-600' : isNearSla ? 'text-amber-600' : 'text-slate-600'}`}>
                  <Clock className="w-4 h-4" />
                  SLA: {slaHours}小时 {resume.isOverdue ? '(已超期)' : isNearSla ? '(24小时内到期)' : ''}
                </div>
              )}
            </div>
          </div>

          <div className="bg-white p-5 rounded-lg shadow-sm border border-slate-200">
            <h2 className="text-lg font-bold text-slate-800 mb-3">处理动作</h2>
            {renderActions()}
          </div>

          <div className="bg-white p-5 rounded-lg shadow-sm border border-slate-200">
            <h2 className="text-lg font-bold text-slate-800 mb-3 flex items-center gap-2">
              <Calendar className="w-5 h-5" /> 时间线
            </h2>
            <div className="text-sm text-slate-600">最近更新时间：{new Date(resume.updatedAt).toLocaleString()}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResumeWorkflowPage;
