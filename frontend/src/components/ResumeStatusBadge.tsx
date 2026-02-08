import React from 'react';
import { ResumeStatus, STATUS_LABELS } from '../types';
import { clsx } from 'clsx';

interface ResumeStatusBadgeProps {
  status: ResumeStatus;
  isOverdue?: boolean;
  isNearSla?: boolean;
  overdueDays?: number | null; // 超期天数（超过1天才显示）
}

const ResumeStatusBadge: React.FC<ResumeStatusBadgeProps> = ({ status, isOverdue = false, isNearSla = false, overdueDays }) => {
  const getStatusColor = (status: ResumeStatus) => {
    switch (status) {
      // 分发阶段 - 蓝色系
      case ResumeStatus.POOL_HR:
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case ResumeStatus.POOL_L2:
        return 'bg-sky-100 text-sky-800 border-sky-200';
      case ResumeStatus.POOL_L3:
        return 'bg-cyan-100 text-cyan-800 border-cyan-200';
      
      // 识别阶段 - 黄色
      case ResumeStatus.WAIT_IDENTIFY:
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      
      // 建联阶段 - 紫色系
      case ResumeStatus.WAIT_CONTACT_INFO:
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case ResumeStatus.WAIT_CONNECTION:
        return 'bg-violet-100 text-violet-800 border-violet-200';
      case ResumeStatus.WAIT_FEEDBACK:
        return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      
      // 终态 - 绿/红/灰
      case ResumeStatus.ARCHIVED:
        return 'bg-green-100 text-green-800 border-green-200';
      case ResumeStatus.RELEASED:
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case ResumeStatus.REJECTED:
        return 'bg-red-100 text-red-800 border-red-200';
      
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <span className="inline-flex items-center gap-1.5 flex-wrap">
      <span
        className={clsx(
          'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border',
          getStatusColor(status)
        )}
      >
        {STATUS_LABELS[status] || status}
      </span>
      {isOverdue && overdueDays && overdueDays >= 1 && (
        <span 
          className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200"
          title={`已超期${overdueDays}天`}
        >
          🚨 已超期{overdueDays}天
        </span>
      )}
      {isNearSla && !isOverdue && (
        <span 
          className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 border border-amber-200"
          title="SLA剩余时间不足1/5"
        >
          ⚠️ 即将超期
        </span>
      )}
    </span>
  );
};

export default ResumeStatusBadge;
