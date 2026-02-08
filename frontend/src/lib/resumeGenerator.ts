/**
 * 随机简历数据生成
 */
import {
  Resume,
  ResumeStatus,
  CandidateType,
  Source,
  SchoolTag,
  ExcellenceTag,
  EducationLevel,
  SLA_HOURS,
} from '../types';
import { THIRD_LEVEL_CODES } from './data/defaultData';

const RANDOM_SURNAMES = ['张', '李', '王', '刘', '陈', '杨', '赵', '黄', '周', '吴', '徐', '孙', '胡', '朱', '高', '林', '何', '郭', '马', '罗'];
const RANDOM_NAMES = ['伟', '芳', '娜', '敏', '静', '丽', '强', '磊', '军', '洋', '勇', '艳', '杰', '娟', '涛', '明', '超', '秀英', '华', '慧', '鑫', '宇', '峰', '博', '浩', '晨', '阳', '文', '彬', '欣', '悦'];
const RANDOM_SCHOOLS = ['清华大学', '北京大学', '复旦大学', '上海交通大学', '浙江大学', '南京大学', '中国科学技术大学', '哈尔滨工业大学', '西安交通大学', '同济大学', '武汉大学', '中山大学', '华中科技大学', '北京航空航天大学', '北京理工大学', '东南大学', '天津大学', '南开大学', '厦门大学', '四川大学', 'MIT', 'Stanford', 'CMU', 'UC Berkeley', 'Harvard', 'Princeton', 'Oxford', 'Cambridge'];
const RANDOM_SKILLS = ['Python', 'Java', 'C++', 'JavaScript', 'TypeScript', 'React', 'Vue', 'Node.js', 'Go', 'Rust', '机器学习', '深度学习', '自然语言处理', '计算机视觉', '系统设计', '分布式系统', '算法', '数据结构', '云计算', 'Kubernetes', 'Docker', '前端工程化', '后端开发', '全栈开发', '数据分析', 'SQL', 'MongoDB', 'Redis'];
const GRADUATION_YEARS = ['27届', '28届', '29届', '30届', '31届', '32届', '33届', '34届', '35届'];
const SCENARIOS: Resume['recruitmentScenario'][] = ['DOMESTIC_BACHELOR_MASTER', 'DOMESTIC_PHD', 'OVERSEAS_BACHELOR_MASTER', 'OVERSEAS_PHD'];
const CANDIDATE_TYPES: CandidateType[] = ['GRADUATE', 'INTERN'];
const SOURCES: Source[] = [Source.A, Source.B, Source.C, Source.D, Source.E, Source.F, Source.G];
const ALL_STATUSES: ResumeStatus[] = [
  ResumeStatus.POOL_L2, ResumeStatus.POOL_L3, ResumeStatus.WAIT_IDENTIFY,
  ResumeStatus.WAIT_CONTACT_INFO, ResumeStatus.WAIT_CONNECTION, ResumeStatus.WAIT_FEEDBACK,
  ResumeStatus.ARCHIVED, ResumeStatus.RELEASED, ResumeStatus.REJECTED
];
const SCHOOL_TAGS: SchoolTag[] = ['C9', 'DOMESTIC_TARGET', 'DOMESTIC_GENERAL', 'DOMESTIC_SPECIAL', 'OVERSEAS_TOP50_HARVARD', 'OVERSEAS_TOP50', 'OVERSEAS_GENERAL', 'OVERSEAS_SPECIAL', 'NON_TARGET'];
const EXCELLENCE_TAGS: ExcellenceTag[] = ['TOP_CLASS', 'TOP_JOURNAL', 'TOP_CONFERENCE', 'COMPETITION'];
const EDUCATION_LEVELS: EducationLevel[] = ['PHD', 'MASTER', 'BACHELOR'];

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomItems<T>(arr: T[], count: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

const now = () => new Date().toISOString();

export function generateRandomResumes(count: number): Resume[] {
  const resumes: Resume[] = [];
  const baseTime = Date.now();
  
  for (let i = 0; i < count; i++) {
    const status = randomItem(ALL_STATUSES);
    const l3Code = randomItem(THIRD_LEVEL_CODES).toLowerCase();
    const hasL3 = ![ResumeStatus.POOL_L2].includes(status);
    const hasExpert = [
      ResumeStatus.WAIT_IDENTIFY, ResumeStatus.WAIT_CONTACT_INFO,
      ResumeStatus.WAIT_CONNECTION, ResumeStatus.WAIT_FEEDBACK,
      ResumeStatus.ARCHIVED, ResumeStatus.REJECTED
    ].includes(status);
    
    // 根据状态计算SLA截止时间
    let slaDeadline: string | undefined;
    let isOverdue = false;
    if ([ResumeStatus.WAIT_IDENTIFY, ResumeStatus.WAIT_CONNECTION, ResumeStatus.WAIT_FEEDBACK].includes(status)) {
      const slaHours = SLA_HOURS[status] || 24;
      // 随机生成：部分已超期、部分即将超期、部分正常
      const rand = Math.random();
      if (rand < 0.15) {
        // 15% 已超期（超期1-5天不等）
        slaDeadline = new Date(baseTime - (1 + Math.random() * 4) * 24 * 60 * 60 * 1000).toISOString();
        isOverdue = true;
      } else if (rand < 0.35) {
        // 20% 即将超期（剩余 ≤ 1/5）
        const threshold = (slaHours * 60 * 60 * 1000) / 5;
        slaDeadline = new Date(baseTime + Math.random() * threshold).toISOString();
      } else {
        // 65% 正常
        const remaining = (slaHours * 60 * 60 * 1000) * (0.3 + Math.random() * 0.7);
        slaDeadline = new Date(baseTime + remaining).toISOString();
      }
    }
    
    // 确定当前责任人
    let currentHandlerId: string | undefined;
    let currentHandlerName: string | undefined;
    if (status === ResumeStatus.POOL_L2 || status === ResumeStatus.WAIT_CONTACT_INFO) {
      currentHandlerId = 'user-l2-1';
      currentHandlerName = 'l2_manager_1';
    } else if (status === ResumeStatus.POOL_L3 || status === ResumeStatus.REJECTED) {
      currentHandlerId = `user-l3-${l3Code}`;
      currentHandlerName = `l3_assistant_${l3Code}`;
    } else if (hasExpert) {
      const expertNum = Math.random() > 0.5 ? 1 : 2;
      currentHandlerId = `user-exp-${l3Code}-${expertNum}`;
      currentHandlerName = `expert_${l3Code}_${expertNum}`;
    }
    
    const surname = randomItem(RANDOM_SURNAMES);
    const givenName = randomItem(RANDOM_NAMES) + (Math.random() > 0.5 ? randomItem(RANDOM_NAMES) : '');
    
    resumes.push({
      id: `resume-${i + 100}`,
      candidateName: surname + givenName,
      school: randomItem(RANDOM_SCHOOLS),
      graduationYear: randomItem(GRADUATION_YEARS),
      recruitmentScenario: randomItem(SCENARIOS),
      candidateType: randomItem(CANDIDATE_TYPES),
      schoolTag: randomItem(SCHOOL_TAGS),
      excellenceTags: Math.random() > 0.6 ? randomItems(EXCELLENCE_TAGS, 1 + Math.floor(Math.random() * 2)) : undefined,
      educationLevel: randomItem(EDUCATION_LEVELS),
      remark: '',
      skills: randomItems(RANDOM_SKILLS, 2 + Math.floor(Math.random() * 3)),
      source: randomItem(SOURCES),
      status,
      resumeUrl: '/sample-resume.pdf',
      uploaderId: 'user-hr',
      uploaderName: 'hr',
      l2DepartmentId: 'dept-l2',
      l2DepartmentName: '二层',
      l3DepartmentId: hasL3 ? `dept-l3-${l3Code}` : undefined,
      l3DepartmentName: hasL3 ? `三层部门${l3Code.toUpperCase()}` : undefined,
      expertId: hasExpert ? currentHandlerId : undefined,
      expertName: hasExpert ? currentHandlerName : undefined,
      currentHandlerId,
      currentHandlerName,
      slaDeadline,
      isOverdue,
      createdAt: new Date(baseTime - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: now(),
    });
  }
  
  return resumes;
}
