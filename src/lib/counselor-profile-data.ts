// 咨询师档案数据结构 + 常量

export type SectionKey =
  | "basic" | "tagline" | "specialties" | "workingGroups"
  | "approaches" | "settings" | "background" | "process";

export type ListItem = { id: string; value: string };

export interface ProfileForm {
  reviewStatus: string;
  reviewNote: string;
  isAccepting: boolean;
  avatarUrl: string;
  displayName: string;
  counselorTypes: string[];
  isSupervisor: boolean;
  location: string;
  totalHours: string;
  bio: string;
  tagline: string;
  specialties: string[];
  customSpecialties: string[];
  workingGroups: string[];
  customWorkingGroups: string[];
  approaches: string[];
  customApproaches: string[];
  sessionDuration: number;
  pricePerSession: string;
  currency: string;
  sessionModes: string[];
  languages: string[];
  sessionSettings: string;
  qualifications: ListItem[];
  education: ListItem[];
  trainings: ListItem[];
  workExperiences: ListItem[];
  sessionDescription: string;
}

export const EMPTY_PROFILE: ProfileForm = {
  reviewStatus: "draft", reviewNote: "",
  isAccepting: false,
  avatarUrl: "", displayName: "",
  counselorTypes: [], isSupervisor: false,
  location: "", totalHours: "",
  bio: "", tagline: "",
  specialties: [], customSpecialties: [],
  workingGroups: [], customWorkingGroups: [],
  approaches: [], customApproaches: [],
  sessionDuration: 50, pricePerSession: "", currency: "CNY",
  sessionModes: [], languages: [],
  sessionSettings: "",
  qualifications: [], education: [], trainings: [], workExperiences: [],
  sessionDescription: "",
};

export const SPECIALTY_OPTIONS = [
  "ADHD","ASD","情绪问题","睡眠问题","感官敏感","创伤","读写障碍",
  "女性成长","人际关系","职场困境","儿童/青少年","家长支持","性议题",
  "ADHD教练","特教老师",
];

export const WORKING_GROUP_OPTIONS = [
  "成人ADHD","成人ASD","儿童/青少年ADHD","儿童/青少年ASD",
  "高功能","性多元人群","孕产","家长支持",
];

export const APPROACH_OPTIONS = [
  "认知行为疗法(CBT)","辩证行为疗法(DBT)","接纳承诺疗法(ACT)","精神动力学",
  "人本主义","正念疗法","叙事疗法","家庭系统疗法","EMDR","沙盘疗法",
  "心理教育","行为激活","执行功能教练","特殊教育支持",
];

export const LANGUAGE_OPTIONS = ["普通话","粤语","英语","闽南语","上海话"];

export const SESSION_MODE_OPTIONS = ["视频咨询","语音咨询","面对面咨询","文字咨询"];

export const SECTION_META: { key: SectionKey; label: string; icon: string }[] = [
  { key: "tagline",      label: "给来访者的话",      icon: "quote" },
  { key: "specialties",  label: "擅长领域",          icon: "sparkle" },
  { key: "workingGroups",label: "工作人群",          icon: "users" },
  { key: "approaches",   label: "咨询取向",          icon: "brain" },
  { key: "settings",     label: "咨询设置",          icon: "gear" },
  { key: "background",   label: "从业背景",          icon: "file" },
  { key: "process",      label: "咨询过程与方式",    icon: "chat" },
];
