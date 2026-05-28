// 咨询师档案表单 — 数据类型与常量

export type ProfileForm = {
  avatarUrl: string;
  displayName: string;
  counselorTypes: string[];
  isSupervisor: boolean;
  location: string;
  totalHours: string;
  bio: string;
  tagline: string;
  specialties: string[];
  workingGroups: string[];
  approaches: string[];
  sessionModes: string[];
  sessionDuration: string;
  pricePerSession: string;
  languages: string[];
  sessionDescription: string;
  qualifications: string[];
  education: string[];
  trainings: string[];
  workExperiences: string[];
  reviewStatus: string;
};

export const EMPTY_PROFILE: ProfileForm = {
  avatarUrl: "", displayName: "", counselorTypes: [], isSupervisor: false,
  location: "", totalHours: "", bio: "", tagline: "",
  specialties: [], workingGroups: [], approaches: [],
  sessionModes: [], sessionDuration: "50", pricePerSession: "",
  languages: [], sessionDescription: "",
  qualifications: [], education: [], trainings: [], workExperiences: [],
  reviewStatus: "draft",
};

export const COUNSELOR_TYPE_OPTIONS = [
  { id: "心理咨询师", label: "心理咨询师", desc: "持有心理咨询师资质，提供心理咨询服务" },
  { id: "ADHD教练",  label: "ADHD 教练",  desc: "专业 ADHD 教练，侧重执行功能与行为策略" },
  { id: "特教老师",  label: "特教老师",   desc: "特殊教育背景，专注儿童/青少年评估与干预" },
];

export const SPECIALTY_OPTIONS = [
  "ADHD","ASD","情绪问题","睡眠问题","感官敏感","创伤","读写障碍",
  "女性成长","人际关系","职场困境","儿童/青少年","家长支持","性议题","ADHD教练","特教老师",
];

export const WORKING_GROUP_OPTIONS = [
  "成人 ADHD","成人 ASD","儿童/青少年 ADHD","儿童/青少年 ASD",
  "高功能","性多元人群","孕产","家长支持",
];

export const APPROACH_OPTIONS = [
  "认知行为疗法（CBT）","接纳与承诺疗法（ACT）","辩证行为疗法（DBT）","叙事疗法",
  "以人为中心疗法","正念","家庭系统疗法","游戏治疗","优势视角疗法",
  "方案焦点疗法（SFBT）","身体感知疗法","动机访谈",
];

export const SESSION_MODE_OPTIONS = ["视频咨询","语音咨询","面对面咨询"];
export const LANGUAGE_OPTIONS = ["普通话","粤语","英语","闽南语","客家话"];
export const DURATION_OPTIONS = ["50","60","90"];

export const SECTIONS = [
  { key: "basic",    label: "基本信息",   icon: "person"   },
  { key: "tagline",  label: "给来访者的话", icon: "quote"   },
  { key: "specialty",label: "擅长领域",   icon: "gauge"    },
  { key: "working",  label: "工作人群",   icon: "users"    },
  { key: "approach", label: "咨询取向",   icon: "clock"    },
  { key: "settings", label: "咨询设置",   icon: "settings" },
  { key: "background",label: "从业背景",  icon: "file"     },
  { key: "process",  label: "咨询过程与方式", icon: "lines" },
] as const;

export type SectionKey = typeof SECTIONS[number]["key"];
