// 预约流程共用类型和数据

export type BookingStep = 1 | 2 | 3 | 4;

export interface TimeSlot {
  id: string;
  start: string; // "HH:MM"
  end: string;
  period: "morning" | "afternoon" | "evening";
  available: boolean;
}

export interface ApplicationForm {
  name: string;
  phone: string;       // 手机号（必填）
  wechat: string;      // 微信号（选填）
  purposes: string[];  // 咨询目的（多选）
  purposeOther?: string; // 其他目的补充说明
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
  name: "",
  phone: "",
  wechat: "",
  purposes: [],
  hasMentalDisease: false,
  onMedication: false,
  hasSelfHarm: false,
  hasSuicidalThought: false,
  hasSuicidalBehavior: false,
  additionalNote: "",
  emergencyName: "",
  emergencyPhone: "",
  consentSigned: false,
};

export const PURPOSE_OPTIONS = [
  "情绪困扰（焦虑/抑郁）",
  "人际关系困难",
  "ADHD 执行功能",
  "ASD 相关支持",
  "职场/学业压力",
  "亲子/家庭问题",
  "创伤与应激",
  "自我认识与成长",
  "其他",
];

export const STEPS = [
  { num: 1, label: "选择时间" },
  { num: 2, label: "填写信息" },
  { num: 3, label: "支付" },
];

/**
 * 已废弃：原 generateMockSlots（假数据）已删除
 * 真实档期数据请通过 /api/counselors/[id]/available-slots 拉取
 */

export function getNextDays(n = 14): Date[] {
  const days: Date[] = [];
  const now = new Date();
  // 最早24小时后
  const start = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  for (let i = 0; i < n; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    days.push(d);
  }
  return days;
}

export const WEEKDAY_LABELS = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
export const PERIOD_LABELS = { morning: "上午", afternoon: "下午", evening: "晚间" };
