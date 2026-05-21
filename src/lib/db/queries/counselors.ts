import { db } from "@/lib/db/client";
import { counselors } from "@/lib/db/schema";
import { eq, ilike, or, sql } from "drizzle-orm";

export async function getCounselors(filters?: {
  specialty?: string;
  sessionMode?: string;
  search?: string;
}) {
  let query = db
    .select()
    .from(counselors)
    .where(eq(counselors.reviewStatus, "approved"))
    .$dynamic();

  if (filters?.specialty) {
    query = query.where(sql`${filters.specialty} = ANY(${counselors.specialties})`);
  }
  if (filters?.search) {
    query = query.where(
      or(
        ilike(counselors.displayName, `%${filters.search}%`),
        ilike(counselors.bio, `%${filters.search}%`)
      )
    );
  }
  return query.orderBy(counselors.createdAt);
}

export async function getCounselorById(id: string) {
  const [c] = await db.select().from(counselors).where(eq(counselors.id, id));
  return c ?? null;
}

export async function getCounselorByUserId(userId: string) {
  const [c] = await db.select().from(counselors).where(eq(counselors.userId, userId));
  return c ?? null;
}

export async function seedCounselors() {
  const seed = [
    {
      id: "c_001", userId: "u_seed_001",
      displayName: "陈晓雯",
      title: "国家二级心理咨询师",
      bio: "在神经多样性领域有丰富的临床经验，尤其擅长处理焦虑、执行功能困难及感官敏感问题。咨询风格直接而温暖，致力于帮助来访找到属于自己的节奏。",
      tagline: "我相信，每个大脑的运作方式都值得被理解，而不是被矫正。如果你感到自己和世界的节奏总是对不上，也许我们可以一起找到一种属于你的方式。",
      specialties: ["ADHD", "焦虑", "感官敏感", "执行功能"],
      approaches: ["辩证行为疗法（DBT）", "叙事疗法", "以人为中心疗法", "正念认知疗法"],
      workingGroups: ["成人 ADHD", "焦虑障碍", "神经多样性人群", "高敏感人群"],
      sessionModes: ["视频咨询", "面对面咨询"],
      sessionDuration: 50, pricePerSession: 450, languages: ["普通话"],
      location: "北京（视频全国可约）", isAccepting: true,
      counselorTypes: ["心理咨询师"], isSupervisor: false, reviewStatus: "approved",
      totalHours: 1200, totalSessions: 1440, rating: 49,
    },
    {
      id: "c_002", userId: "u_seed_002",
      displayName: "林诗涵",
      title: "国家二级心理咨询师",
      bio: "擅长支持自闭症谱系（ASD）成人及青少年，关注感官敏感、社交疲劳与情绪调节。咨询空间低刺激、慢节奏，让来访可以按自己的方式表达。",
      tagline: "每个人都有属于自己的感知世界的方式，我想帮你在这个世界里找到更舒适的位置。",
      specialties: ["ASD", "感官敏感", "情绪问题", "人际关系"],
      approaches: ["以人为中心疗法", "ACT接纳承诺疗法", "正念疗法"],
      workingGroups: ["ASD成人", "高敏感人群", "青少年"],
      sessionModes: ["视频咨询"],
      sessionDuration: 60, pricePerSession: 420, languages: ["普通话"],
      location: "上海（视频全国可约）", isAccepting: true,
      counselorTypes: ["心理咨询师"], isSupervisor: false, reviewStatus: "approved",
      totalHours: 800, totalSessions: 800, rating: 48,
    },
    {
      id: "c_003", userId: "u_seed_003",
      displayName: "余晓彤",
      title: "特教老师 / 心理咨询师",
      bio: "十年特殊教育经验，专注儿童 ASD 和学习障碍的评估与支持，同时具备心理咨询背景。",
      tagline: "每个孩子都有自己的学习节奏，我们一起找到它。",
      specialties: ["ASD", "读写障碍", "儿童/青少年", "家长支持"],
      approaches: ["行为分析（ABA）", "游戏治疗", "家庭系统治疗"],
      workingGroups: ["儿童", "青少年", "家长"],
      sessionModes: ["视频咨询", "面对面咨询"],
      sessionDuration: 50, pricePerSession: 480, languages: ["普通话", "粤语"],
      location: "广州", isAccepting: true,
      counselorTypes: ["特教老师", "心理咨询师"], isSupervisor: false, reviewStatus: "approved",
      totalHours: 1500, totalSessions: 1800, rating: 49,
    },
    {
      id: "c_004", userId: "u_seed_004",
      displayName: "李明华",
      title: "心理咨询师",
      bio: "专注于神经多样性群体的心理支持已有八年，擅长 ADHD、ASD 及学习差异。相信每个人都有属于自己独特的认知方式，咨询风格温和而不评判，注重建立安全感。",
      tagline: "你不需要修复自己，只需要找到适合自己的方式。",
      specialties: ["ADHD", "ASD", "情绪调节", "家庭关系"],
      approaches: ["认知行为疗法（CBT）", "正念疗法", "家庭系统治疗"],
      workingGroups: ["成人", "青少年", "家长"],
      sessionModes: ["视频咨询", "面对面咨询"],
      sessionDuration: 50, pricePerSession: 380, languages: ["普通话"],
      location: "北京", isAccepting: true,
      counselorTypes: ["心理咨询师"], isSupervisor: true, reviewStatus: "approved",
      totalHours: 900, totalSessions: 1080, rating: 48,
    },
    {
      id: "c_005", userId: "u_seed_005",
      displayName: "冯子轩",
      title: "心理咨询师",
      bio: "关注青少年情绪与学习困难，擅长用沙盘和绘画等方式帮助孩子表达内心世界。对家长支持也有丰富经验。",
      tagline: "孩子的情绪是信使，不是问题。",
      specialties: ["儿童/青少年", "ADHD", "家长支持", "感官敏感"],
      approaches: ["沙盘游戏", "艺术治疗", "家庭系统治疗"],
      workingGroups: ["儿童", "青少年", "家长"],
      sessionModes: ["视频咨询", "面对面咨询"],
      sessionDuration: 50, pricePerSession: 420, languages: ["普通话"],
      location: "成都", isAccepting: true,
      counselorTypes: ["心理咨询师"], isSupervisor: false, reviewStatus: "approved",
      totalHours: 600, totalSessions: 720, rating: 46,
    },
    {
      id: "c_006", userId: "u_seed_006",
      displayName: "王思远",
      title: "ADHD 教练认证",
      bio: "ADHD 教练，专注执行功能训练与职场困境，帮助来访建立切实可行的日常系统。曾任特殊教育教师 8 年。",
      tagline: "混乱只是还没找到适合你的结构。",
      specialties: ["ADHD", "执行功能", "职场困境", "时间管理"],
      approaches: ["教练式引导", "行为激活", "习惯养成"],
      workingGroups: ["成人", "职场人士"],
      sessionModes: ["视频咨询", "语音咨询"],
      sessionDuration: 50, pricePerSession: 320, languages: ["普通话"],
      location: "线上", isAccepting: true,
      counselorTypes: ["ADHD教练"], isSupervisor: false, reviewStatus: "approved",
      totalHours: 800, totalSessions: 960, rating: 47,
    },
  ];

  for (const c of seed) {
    await db.insert(counselors).values(c as any).onConflictDoNothing();
  }
}
