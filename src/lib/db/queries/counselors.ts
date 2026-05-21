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
      id: "c_001", userId: "u_seed_001",
      displayName: "陈晓雯",
      title: "国家二级心理咨询师",
      bio: "在神经多样性领域有丰富的临床经验，尤其擅长处理焦虑、执行功能困难及感官敏感问题。咨询风格直接而温暖，致力于帮助来访找到属于自己的节奏。",
      tagline: "我相信，每个大脑的运作方式都值得被理解，而不是被「矫正」。如果你感到自己和世界的节奏总是对不上，也许我们可以一起找到一种属于你的方式。",
      specialties: ["ADHD", "焦虑", "感官敏感", "执行功能"],
      approaches: ["辩证行为疗法（DBT）", "叙事疗法", "以人为中心疗法", "正念认知疗法"],
      workingGroups: ["成人 ADHD", "焦虑障碍", "神经多样性人群", "高敏感人群"],
      sessionModes: ["视频咨询", "面对面咨询"],
      sessionDuration: 50, pricePerSession: 450, languages: ["普通话"],
      location: "北京（视频全国可约）", isAccepting: true,
      counselorTypes: ["心理咨询师"], isSupervisor: false, reviewStatus: "approved",
      totalHours: 1200, totalSessions: 1440, rating: 49,
      qualifications: ["中级社工师", "简单心理咨询师长程培训项目结业"],
      education: ["湖南师范大学 教育学学位", "湖南师范大学 语言学硕士"],
      trainings: [
        "2020.03 ~ 2020.09 简单心理seed培训",
        "2021.03 ~ 2022.08 简单心理咨询师计划中高阶培训",
        "2022.06 ~ 2022.12 小悟生性多元友善心理咨询师培训",
        "2025.11 ~ 2026.05 DBT辩证行为疗法入门",
        "2025.11 ~ 2026.08 北大六院ADHD执行功能培训（长程）",
        "2025.12 ~ 2026.03 MEID八周情绪困扰正念干预",
        "2026.04 ~ 2028.05 ACT初中高阶训练营（长程）",
        "2025.12 BCBA执行功能/情绪工作坊",
      ],
      workExperiences: [
        "2020.11~ 2021.05 简单心理热线实习",
        "2022.05~ 2023.03 付费个案实习",
        "2023.10 至今 ADHD儿童非药物干预",
        "2025.11 至今 学校心理助教",
        "2023.03 至今 一对一付费个案时长700+",
        "接受个督及团督时长150+",
        "接受个人体验100+",
      ],
      sessionDescription: "我的咨询风格是温暖、真诚和支持性的。我认为，咨询室是我们共同工作的空间，而非单向的指导。\n\n咨询方式：我的工作以人本主义的"真诚"和"积极关注"为底色，这意味着我会全然地尊重和接纳你的感受与经历。在此基础上，我会根据我们共同确定的咨询目标，灵活地融入不同的技术：\n\nACT接纳承诺疗法：帮助你与痛苦的情绪和想法和平共处，减少内耗，将精力集中于按照你的价值去过上更富有、有意义的生活。\n\n叙事疗法：协助你将"问题"与自己分开，重写被问题占据的人生故事，发现那些被忽略的"例外时刻"和内在力量，重塑自我认同。\n\n正念：通过温和的觉察练习，帮助你提升对当下想法、情绪的觉察力，而不是被它们裹挟，从而增加情绪调节和专注能力。",
    },
    {
      id: "c_002", userId: "u_seed_002",
      displayName: "林诗涵",
      title: "心理咨询师",
      bio: "擅长支持自闭症谱系（ASD）成人及青少年，关注感官敏感、社交疲劳与情绪调节。咨询空间低刺激、慢节奏，让来访可以按自己的方式表达。",
      tagline: "你不需要「正常」才能得到支持。我的咨询室欢迎所有的神经类型。",
      specialties: ["ASD", "感官敏感", "情绪问题", "人际关系"],
      approaches: ["以人为中心疗法", "正念疗法", "接纳承诺疗法"],
      workingGroups: ["ASD成人", "青少年", "神经多样性人群"],
      sessionModes: ["视频咨询", "语音咨询"],
      sessionDuration: 60, pricePerSession: 420, languages: ["普通话"],
      location: "上海（视频全国可约）", isAccepting: true,
      counselorTypes: ["心理咨询师"], isSupervisor: false, reviewStatus: "approved",
      totalHours: 800, totalSessions: 800, rating: 48,
      qualifications: ["国家二级心理咨询师", "ASD专业支持培训结业"],
      education: ["华东师范大学 应用心理学硕士"],
      trainings: ["2021.06 ~ 2022.06 ASD成人支持专项培训", "2023.06 ~ 2024.06 接纳承诺疗法初阶培训"],
      workExperiences: ["2021.03 至今 一对一付费个案时长800+", "2022.06 至今 ASD青少年支持小组带领"],
      sessionDescription: "我的咨询以慢节奏、低刺激为核心理念。我会充分尊重来访的沟通方式，不强迫眼神接触，不催促表达，让你感到足够安全后自然流露。",
    },
    {
      id: "c_003", userId: "u_seed_003",
      displayName: "余晓彤",
      title: "心理咨询师 / 特殊教育老师",
      bio: "十年特殊教育经验，专注儿童 ASD 和学习障碍的评估与支持，同时具备心理咨询背景。",
      tagline: "每一个孩子都有自己独特的学习节奏，我帮你找到属于他的那把钥匙。",
      specialties: ["ASD", "读写障碍", "儿童/青少年", "家长支持"],
      approaches: ["行为分析（ABA）", "游戏治疗", "家庭系统治疗"],
      workingGroups: ["儿童ASD", "学习障碍儿童", "家长"],
      sessionModes: ["视频咨询", "面对面咨询"],
      sessionDuration: 50, pricePerSession: 480, languages: ["普通话", "粤语"],
      location: "广州（视频全国可约）", isAccepting: true,
      counselorTypes: ["心理咨询师", "特教老师"], isSupervisor: false, reviewStatus: "approved",
      totalHours: 1500, totalSessions: 1800, rating: 49,
      qualifications: ["国家三级心理咨询师", "特殊教育教师资格证"],
      education: ["华南师范大学 特殊教育专业本科", "华南师范大学 发展与教育心理学硕士"],
      trainings: ["2016.09 ~ 2018.06 ABA行为分析基础培训", "2019.03 ~ 2020.06 游戏治疗初阶认证"],
      workExperiences: ["2014.09 ~ 2024.09 特殊教育学校教师（十年）", "2020.03 至今 一对一儿童咨询时长1500+"],
      sessionDescription: "我的工作结合了特殊教育和心理咨询两个维度，帮助儿童和家庭找到最适合的支持方式。",
    },
    {
      id: "c_004", userId: "u_seed_004",
      displayName: "李明华",
      title: "心理咨询师",
      bio: "专注于神经多样性群体的心理支持已有八年，擅长ADHD、ASD 及学习差异。相信每个人都有属于自己独特的认知方式，咨询风格温和而不评判，注重建立安全感。",
      tagline: "在这里，你不需要解释自己为什么和别人不一样。",
      specialties: ["ADHD", "ASD", "情绪调节", "家庭关系"],
      approaches: ["认知行为疗法（CBT）", "正念认知疗法", "接纳承诺疗法"],
      workingGroups: ["成人ADHD", "ASD成人", "家庭"],
      sessionModes: ["视频咨询", "面对面咨询"],
      sessionDuration: 50, pricePerSession: 380, languages: ["普通话"],
      location: "成都（视频全国可约）", isAccepting: false,
      counselorTypes: ["心理咨询师"], isSupervisor: true, reviewStatus: "approved",
      totalHours: 2000, totalSessions: 2400, rating: 48,
      qualifications: ["国家二级心理咨询师", "认知行为治疗师培训结业"],
      education: ["西南大学 心理学学士", "四川大学 应用心理学硕士"],
      trainings: ["2018.09 ~ 2019.09 CBT认知行为疗法基础培训", "2023.06 ~ 2024.06 督导师培训项目"],
      workExperiences: ["2017.09 至今 一对一付费个案时长2000+", "2023.09 至今 实习咨询师督导"],
      sessionDescription: "我认为咨询关系本身就是疗愈的重要部分。在安全、不评判的空间里，我们可以一起探索你的内心世界。",
    },
    {
      id: "c_005", userId: "u_seed_005",
      displayName: "冯子轩",
      title: "心理咨询师",
      bio: "关注青少年情绪与学习困难，擅长用沙盘和绘画等方式帮助孩子表达内心世界。对家长支持也有丰富经验。",
      tagline: "孩子的问题往往是家庭系统的语言，我们一起来倾听。",
      specialties: ["儿童/青少年", "ADHD", "家长支持", "感官敏感"],
      approaches: ["沙盘游戏治疗", "绘画治疗", "家庭系统治疗"],
      workingGroups: ["青少年", "儿童", "家长"],
      sessionModes: ["视频咨询", "面对面咨询"],
      sessionDuration: 50, pricePerSession: 420, languages: ["普通话"],
      location: "北京（视频全国可约）", isAccepting: true,
      counselorTypes: ["心理咨询师"], isSupervisor: false, reviewStatus: "approved",
      totalHours: 600, totalSessions: 720, rating: 46,
      qualifications: ["国家三级心理咨询师", "沙盘游戏治疗师初阶认证"],
      education: ["北京师范大学 心理学本科"],
      trainings: ["2022.03 ~ 2023.03 沙盘游戏治疗初阶认证培训", "2024.03 ~ 2025.03 家庭系统治疗入门"],
      workExperiences: ["2022.06 至今 一对一儿童青少年咨询时长600+", "2023.09 至今 学校心理咨询师（兼职）"],
      sessionDescription: "我的咨询擅长用非言语的方式帮助儿童和青少年表达自己，沙盘和绘画都是很好的媒介。",
    },
    {
      id: "c_006", userId: "u_seed_006",
      displayName: "王思远",
      title: "ADHD教练认证 / 心理咨询师",
      bio: "ADHD教练，专注执行功能训练与职场困境，帮助来访建立切实可行的日常系统，曾任特殊教育教师8年。",
      tagline: "ADHD不是懒惰，是大脑需要不同的运作系统。我帮你找到你的系统。",
      specialties: ["ADHD", "执行功能", "职场困境", "时间管理"],
      approaches: ["教练式引导", "行为激活", "习惯养成方法"],
      workingGroups: ["成人ADHD", "职场人士"],
      sessionModes: ["视频咨询", "语音咨询"],
      sessionDuration: 50, pricePerSession: 320, languages: ["普通话"],
      location: "线上（视频全国可约）", isAccepting: true,
      counselorTypes: ["ADHD教练", "心理咨询师"], isSupervisor: false, reviewStatus: "approved",
      totalHours: 900, totalSessions: 1080, rating: 48,
      qualifications: ["ICF认证ADHD教练", "国家三级心理咨询师"],
      education: ["华中师范大学 特殊教育专业本科"],
      trainings: ["2019.09 ~ 2020.09 ADHD教练国际认证培训（ICF）", "2021.03 ~ 2022.03 执行功能训练专项培训"],
      workExperiences: ["2014.09 ~ 2022.09 特殊教育学校教师（八年）", "2020.06 至今 ADHD成人教练时长900+"],
      sessionDescription: "ADHD教练咨询不同于传统心理咨询，更注重实用性和行动导向。我们会一起分析你的困境，制定具体可执行的策略。",
    },
  ];

  for (const c of seed) {
    await db.insert(counselors).values(c).onConflictDoUpdate({
      target: counselors.id,
      set: {
        displayName: c.displayName, title: c.title, bio: c.bio, tagline: c.tagline,
        specialties: c.specialties, approaches: c.approaches, workingGroups: c.workingGroups,
        sessionModes: c.sessionModes, sessionDuration: c.sessionDuration,
        pricePerSession: c.pricePerSession, location: c.location, isAccepting: c.isAccepting,
        counselorTypes: c.counselorTypes, isSupervisor: c.isSupervisor,
        totalHours: c.totalHours, totalSessions: c.totalSessions, rating: c.rating,
        qualifications: c.qualifications, education: c.education,
        trainings: c.trainings, workExperiences: c.workExperiences,
        sessionDescription: c.sessionDescription,
      },
    });
  }
}
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
