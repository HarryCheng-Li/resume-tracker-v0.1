/**
 * 工具函数 - 标签转换、SLA计算等
 */
import { Resume, Source, CandidateType, SLA_HOURS, RECRUITMENT_SCENARIO_LABELS } from '../types';

export function getSourceLabel(source: Source): string {
  const sourceLabels: Record<Source, string> = {
    [Source.A]: '内部推荐',
    [Source.B]: '领英',
    [Source.C]: '招聘网站',
    [Source.D]: '猎头',
    [Source.E]: '招聘会',
    [Source.F]: '直接投递',
    [Source.G]: '其他',
  };
  return sourceLabels[source];
}

export function getRecruitmentScenarioLabel(value?: Resume['recruitmentScenario']): string {
  if (!value) return '-';
  return RECRUITMENT_SCENARIO_LABELS[value];
}

export function getCandidateTypeLabel(value?: CandidateType): string {
  if (!value) return '-';
  return value === 'GRADUATE' ? '应届生' : '实习生';
}

export function isSlaDueIn24Hours(resume: Resume): boolean {
  if (!resume.slaDeadline || resume.isOverdue) return false;
  const deadline = new Date(resume.slaDeadline).getTime();
  const diff = deadline - Date.now();
  return diff > 0 && diff <= 24 * 60 * 60 * 1000;
}

// 判断是否即将超期（SLA剩余时间 ≤ 1/5）
export function isNearSla(resume: Resume): boolean {
  if (!resume.slaDeadline || resume.isOverdue) return false;
  const slaHours = SLA_HOURS[resume.status];
  if (!slaHours) return false;
  
  const deadline = new Date(resume.slaDeadline).getTime();
  const remaining = deadline - Date.now();
  if (remaining <= 0) return false; // 已超期
  
  const threshold = (slaHours * 60 * 60 * 1000) / 5; // SLA的1/5
  return remaining <= threshold;
}

// 计算超期天数（向下取整，超过1天才返回数值，否则返回null）
export function getOverdueDays(resume: Resume): number | null {
  if (!resume.isOverdue || !resume.slaDeadline) return null;
  
  const deadline = new Date(resume.slaDeadline).getTime();
  const overdueMs = Date.now() - deadline;
  const overdueDays = Math.floor(overdueMs / (24 * 60 * 60 * 1000));
  
  // 超过1天才显示
  return overdueDays >= 1 ? overdueDays : null;
}
