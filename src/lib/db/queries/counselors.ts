import { db } from "@/lib/db/client";
import { counselors } from "@/lib/db/schema";
import { eq, ilike, or, sql } from "drizzle-orm";

export async function getCounselors(filters?: {
  specialty?: string;
  sessionMode?: string;
  search?: string;
}) {
  let query = db.select().from(counselors)
    .where(eq(counselors.reviewStatus, "approved"))
    .$dynamic();

  if (filters?.specialty) {
    query = query.where(sql`${filters.specialty} = ANY(${counselors.specialties})`);
  }
  if (filters?.search) {
    query = query.where(
      or(
        ilike(counselors.displayName, `%${filters.search}%`),
        ilike(counselors.bio, `%${filters.search}%`),
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
      id: "c_001", userId: "u_seed_001", displayName: "陈晓雯", title: "注册心理咨询师",
      bio: "专注 ADHD 成人及青少年心理支持，擅长认知行为疗法（CBT）与正念减压。曾在北大六院实习，临床经验丰富。",
      tagline: "每一次鼓起勇气来到这里，都值得被看见。",
      specialties: ["ADHD", "焦虑", "情绪调节", "执行功能"],
      approaches: ["认知行为疗法", "正念疗法", "叙事疗法"],
      workingGroups: ["成人", "青少年"],
      sessionModes: ["视频", "语音"],
      sessionDuration: 50, pricePerSession: 450, languages: ["普通话"],
      location: "北京", isAccepting: true,
      counselorTypes: ["心理咨询师"], isSupervisor: false, reviewStatus: "approved",
      totalHours: 1200, totalSessions: 1440, rating: 49,
    },
    {
      id: "c_002", userId: "u_seed_002", displayName: "李明华", title: "国家二级心理咨询师",
      bio: "专注 ASD 相关议题、创伤与女性成长，善用沙盘游戏和正念技术，提供安全温暖的咨询空间。",
      tagline: "你不需要为自己的感受道歉。",
      specialties: ["ASD", "创伤", "女性成长", "人际关系"],
      approaches: ["沙盘游戏", "正念疗法", "ACT"],
      workingGroups: ["成人", "儿童"],
      sessionModes: ["视频", "面谈"],
      sessionDuration: 50, pricePerSession: 520, languages: ["普通话"],
      location: "上海", isAccepting: true,
      counselorTypes: ["心理咨询师"], isSupervisor: true, reviewStatus: "approved",
      totalHours: 2000, totalSessions: 2400, rating: 48,
    },
    {
      id: "c_003", userId: "u_seed_003", displayName: "王思远", title: "ADHD 教练认证",
      bio: "ADHD 教练，专注执行功能训练与职场困境，帮助来访建立切实可行的日常系统，曾任特殊教育教师 8 年。",
      tagline: "混乱只是还没找到适合你的结构。",
      specialties: ["ADHD", "执行功能", "职场困境", "时间管理"],
      approaches: ["教练式引导", "行为激活", "习惯养成"],
      workingGroups: ["成人", "职场人士"],
      sessionModes: ["视频", "语音"],
      sessionDuration: 50, pricePerSession: 320, languages: ["普通话"],
      location: "线上", isAccepting: true,
      counselorTypes: ["ADHD教练"], isSupervisor: false, reviewStatus: "approved",
      totalHours: 800, totalSessions: 960, rating: 48,
    },
    {
      id: "c_004", userId: "u_seed_004", displayName: "张佳怡", title: "特教老师 / 心理咨询师",
      bio: "特教老师兼心理咨询师，专注 ASD 与读写障碍综合干预，擅长游戏治疗与家长支持，深受儿童及其家庭信任。",
      tagline: "每个孩子都有自己的节奏，我陪你们一起找。",
      specialties: ["ASD", "读写障碍", "特殊教育", "家长支持"],
      approaches: ["游戏治疗", "感统训练", "行为分析"],
      workingGroups: ["儿童", "青少年", "家长"],
      sessionModes: ["视频", "面谈"],
      sessionDuration: 50, pricePerSession: 480, languages: ["普通话", "粤语"],
      location: "广州", isAccepting: true,
      counselorTypes: ["特教老师", "心理咨询师"], isSupervisor: false, reviewStatus: "approved",
      totalHours: 1500, totalSessions: 1800, rating: 49,
    },
    {
      id: "c_005", userId: "u_seed_005", displayName: "林诗涵", title: "心理治疗师",
      bio: "专注焦虑、睡眠与情绪调节，擅长认知行为疗法与接纳承诺疗法（ACT），对感官敏感及高敏感人群有丰富经验。",
      tagline: "敏感不是弱点，是你还没用好的天赋。",
      specialties: ["焦虑", "睡眠问题", "情绪调节", "感官敏感"],
      approaches: ["认知行为疗法", "ACT", "正念疗法"],
      workingGroups: ["成人"],
      sessionModes: ["视频", "语音"],
      sessionDuration: 50, pricePerSession: 380, languages: ["普通话"],
      location: "杭州", isAccepting: true,
      counselorTypes: ["心理咨询师"], isSupervisor: false, reviewStatus: "approved",
      totalHours: 900, totalSessions: 1080, rating: 47,
    },
    {
      id: "c_006", userId: "u_seed_006", displayName: "刘海涛", title: "注册心理咨询师",
      bio: "专注儿童和青少年心理健康，擅长游戏治疗和家长支持，致力于帮助神经多样性儿童融入学校和家庭环境。",
      tagline: "孩子的每一步探索，都是成长的样子。",
      specialties: ["儿童心理", "青少年", "ADHD", "家庭关系"],
      approaches: ["游戏治疗", "家庭系统治疗", "叙事疗法"],
      workingGroups: ["儿童", "青少年", "家长"],
      sessionModes: ["视频", "面谈"],
      sessionDuration: 50, pricePerSession: 420, languages: ["普通话"],
      location: "成都", isAccepting: true,
      counselorTypes: ["心理咨询师"], isSupervisor: false, reviewStatus: "approved",
      totalHours: 600, totalSessions: 720, rating: 46,
    },
  ];

  for (const c of seed) {
    await db.insert(counselors).values(c).onConflictDoNothing();
  }
}
