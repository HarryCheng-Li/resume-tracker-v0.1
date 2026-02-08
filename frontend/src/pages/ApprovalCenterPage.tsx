import React, { useMemo, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import {
  getAccountApprovalRequests,
  reviewAccountRequest,
} from '../lib/mockData';

const ApprovalCenterPage: React.FC = () => {
  const { user } = useAuth();
  const [refreshToken, setRefreshToken] = useState(0);
  const [reviewComment, setReviewComment] = useState<Record<string, string>>({});

  const requests = useMemo(() => {
    void refreshToken;
    return getAccountApprovalRequests();
  }, [refreshToken]);

  if (!user || !['HR', 'ADMIN'].includes(user.role)) {
    return <div className="text-slate-500">您没有审批权限。</div>;
  }

  const pendingRequests = requests.filter((item) => item.status === 'PENDING');
  const historyRequests = requests.filter((item) => item.status !== 'PENDING');

  const handleReview = (requestId: string, approve: boolean) => {
    const result = reviewAccountRequest({
      requestId,
      approve,
      reviewer: user,
      reviewComment: reviewComment[requestId],
    });
    if (!result.ok) {
      alert(result.message);
      return;
    }
    alert(result.message);
    setRefreshToken((prev) => prev + 1);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">审批中心</h1>

      <section className="bg-white rounded-lg border border-slate-200 shadow-sm">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <h2 className="font-semibold text-slate-800">待审批</h2>
          <span className="text-sm text-slate-500">{pendingRequests.length} 条</span>
        </div>
        <div className="p-6 space-y-4">
          {pendingRequests.length === 0 ? (
            <p className="text-sm text-slate-500">暂无待审批申请</p>
          ) : (
            pendingRequests.map((request) => (
              <div key={request.id} className="border border-slate-200 rounded-lg p-4 space-y-3">
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <p className="font-medium text-slate-900">{request.targetUsername} ({request.targetEmail})</p>
                    <p className="text-sm text-slate-600">
                      申请人：{request.applicantName}（{request.applicantRole}）
                    </p>
                    <p className="text-sm text-slate-600">
                      目标角色：{request.targetRole} | 部门：{request.targetDepartmentName}
                    </p>
                    {request.reason && <p className="text-sm text-slate-600">申请理由：{request.reason}</p>}
                  </div>
                  <span className="text-xs text-slate-400">{new Date(request.createdAt).toLocaleString()}</span>
                </div>
                <textarea
                  className="input-field h-20"
                  placeholder="审批备注（可选）"
                  value={reviewComment[request.id] || ''}
                  onChange={(event) =>
                    setReviewComment((prev) => ({
                      ...prev,
                      [request.id]: event.target.value,
                    }))
                  }
                />
                <div className="flex gap-3">
                  <button className="btn-primary bg-green-600 hover:bg-green-700" onClick={() => handleReview(request.id, true)}>
                    通过并激活
                  </button>
                  <button className="btn-secondary text-red-600 border-red-200 hover:bg-red-50" onClick={() => handleReview(request.id, false)}>
                    驳回
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      <section className="bg-white rounded-lg border border-slate-200 shadow-sm">
        <div className="px-6 py-4 border-b border-slate-200">
          <h2 className="font-semibold text-slate-800">审批记录</h2>
        </div>
        <div className="p-6 space-y-3">
          {historyRequests.length === 0 ? (
            <p className="text-sm text-slate-500">暂无记录</p>
          ) : (
            historyRequests.map((request) => (
              <div key={request.id} className="text-sm text-slate-700 border-b border-slate-100 pb-3 last:border-b-0">
                <span className="font-medium">{request.targetUsername}</span>
                <span className="mx-2">-</span>
                <span>{request.status === 'APPROVED' ? '已通过' : '已驳回'}</span>
                <span className="mx-2">-</span>
                <span>审批人：{request.reviewedByName || '未知'}</span>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
};

export default ApprovalCenterPage;
