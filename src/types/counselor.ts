export interface PricingOption {
  id: string;
  name: string;
  customName?: string;
  duration: number;
  price: number;
  sessions: number;
}

export interface Counselor {
  id: string;
  displayName: string;
  title: string;
  bio: string;
  tagline?: string;
  specialties: string[];
  customSpecialties?: string[];
  counselorTypes: string[];
  isSupervisor: boolean;
  sessionModes: string[];
  sessionDuration: number;
  pricePerSession: number;
  currency?: string;
  pricingOptions?: PricingOption[];
  isAccepting: boolean;
  totalHours: number;
  totalSessions?: number;
  rating: number;
  reviewStatus?: string;
  reviewNote?: string;
  location: string;
  avatarUrl: string | null;
  approaches?: string[];
  customApproaches?: string[];
  workingGroups?: string[];
  customWorkingGroups?: string[];
  education?: (string | { id: string; value: string })[];
  qualifications?: (string | { id: string; value: string })[];
  trainings?: (string | { id: string; value: string })[];
  workExperiences?: (string | { id: string; value: string })[];
  languages?: string[];
  sessionSettings?: string | null;
  sessionDescription?: string | null;
}

export interface CounselorFilter {
  type?: string;
  approach?: string;
  location?: string;
  priceMin?: number;
  priceMax?: number;
}

export interface TimeSlot {
  id: string;
  start: string;
  end: string;
  period: 'morning' | 'afternoon' | 'evening';
  available: boolean;
}

export interface ApplicationForm {
  name: string;
  phone: string;
  wechat: string;
  purposes: string[];
  purposeOther?: string;
  hasMentalDisease: boolean;
  onMedication: boolean;
  hasSelfHarm: boolean;
  hasSuicidalThought: boolean;
  hasSuicidalBehavior: boolean;
  additionalNote: string;
  emergencyName: string;
  emergencyPhone: string;
  consentSigned: boolean;
}

export const EMPTY_FORM: ApplicationForm = {
  name: '',
  phone: '',
  wechat: '',
  purposes: [],
  hasMentalDisease: false,
  onMedication: false,
  hasSelfHarm: false,
  hasSuicidalThought: false,
  hasSuicidalBehavior: false,
  additionalNote: '',
  emergencyName: '',
  emergencyPhone: '',
  consentSigned: false,
};

export const PURPOSE_OPTIONS = [
  '情绪困扰（焦虑/抑郁）',
  '人际关系困难',
  'ADHD 执行功能',
  'ASD 相关支持',
  '职场/学业压力',
  '亲子/家庭问题',
  '创伤与应激',
  '自我认识与成长',
  '其他',
];

export const WEEKDAY_LABELS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
export const PERIOD_LABELS = { morning: '上午', afternoon: '下午', evening: '晚间' };

export function getNextDays(n = 14): Date[] {
  const days: Date[] = [];
  const now = new Date();
  const start = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  for (let i = 0; i < n; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    days.push(d);
  }
  return days;
}

/** 服务器 /available-slots 返回的单日档期（slots 为可约开始时间，如 "10:30"） */
export interface AvailableDay {
  date: string;
  label: string;
  weekday: string;
  starts: string[];
}

/** 由开始时间 + 时长构造展示用时间段 */
export function buildTimeSlots(dateKey: string, starts: string[], durationMinutes: number): TimeSlot[] {
  return (starts || []).map((start) => {
    const [h, m] = start.split(':').map(Number);
    const endTotal = h * 60 + m + durationMinutes;
    const end = `${String(Math.floor(endTotal / 60)).padStart(2, '0')}:${String(endTotal % 60).padStart(2, '0')}`;
    const period: TimeSlot['period'] = h < 12 ? 'morning' : h < 18 ? 'afternoon' : 'evening';
    return { id: `${dateKey}-${start}`, start, end, period, available: true };
  });
}