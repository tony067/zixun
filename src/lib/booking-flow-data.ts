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
  { num: 3, label: "等待确认" },
  { num: 4, label: "支付" },
];

/** 根据咨询师档期规则，生成未来14天的可约时段（模拟） */
export function generateMockSlots(days: Date[]): Record<string, TimeSlot[]> {
  const result: Record<string, TimeSlot[]> = {};
  const morning = [{ start: "09:00", end: "09:50" }, { start: "10:00", end: "10:50" }, { start: "11:00", end: "11:50" }];
  const afternoon = [{ start: "14:00", end: "14:50" }, { start: "15:00", end: "15:50" }, { start: "16:00", end: "16:50" }];
  const evening = [{ start: "19:00", end: "19:50" }, { start: "20:00", end: "20:50" }];

  days.forEach((d, i) => {
    const key = d.toISOString().slice(0, 10);
    const all = [
      ...morning.map((t, j) => ({ id: `${key}-m${j}`, ...t, period: "morning" as const, available: Math.random() > 0.3 })),
      ...afternoon.map((t, j) => ({ id: `${key}-a${j}`, ...t, period: "afternoon" as const, available: Math.random() > 0.3 })),
      ...evening.map((t, j) => ({ id: `${key}-e${j}`, ...t, period: "evening" as const, available: i % 3 !== 0 })),
    ];
    result[key] = all;
  });
  return result;
}

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
