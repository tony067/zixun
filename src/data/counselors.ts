import type { Counselor } from '@/types/counselor';

export const mockCounselors: Counselor[] = [
  {
    id: 'c1',
    displayName: '林晓然',
    title: '国家二级心理咨询师',
    bio: '专注 ADHD 成人咨询与家庭教育支持，8 年临床经验，擅长认知行为疗法与正念训练。',
    specialties: ['ADHD', '情绪问题', '家长支持'],
    counselorTypes: ['心理咨询师'],
    isSupervisor: false,
    sessionModes: ['视频', '面谈'],
    sessionDuration: 50,
    pricePerSession: 500,
    isAccepting: true,
    totalHours: 1200,
    rating: 4.9,
    location: '北京',
    avatarUrl: 'https://picsum.photos/id/64/200/200',
    approaches: ['认知行为', '正念'],
    workingGroups: ['成人', '儿童青少年']
  },
  {
    id: 'c2',
    displayName: '陈牧之',
    title: 'ADHD 认证教练',
    bio: 'ICF 认证教练，专注 ADHD 青少年与成人的执行功能训练、时间管理和生活技能提升。',
    specialties: ['ADHD', '职场困境', '时间管理'],
    counselorTypes: ['ADHD教练'],
    isSupervisor: false,
    sessionModes: ['视频'],
    sessionDuration: 50,
    pricePerSession: 450,
    isAccepting: true,
    totalHours: 800,
    rating: 4.8,
    location: '上海',
    avatarUrl: 'https://picsum.photos/id/91/200/200',
    approaches: ['教练技术', '执行功能训练'],
    workingGroups: ['青少年', '成人']
  },
  {
    id: 'c3',
    displayName: '王静宜',
    title: '特殊教育老师',
    bio: '12 年特教经验，擅长 ASD 儿童早期干预、感觉统合训练和家庭融合支持。',
    specialties: ['ASD', '感官敏感', '儿童青少年'],
    counselorTypes: ['特教老师'],
    isSupervisor: false,
    sessionModes: ['面谈'],
    sessionDuration: 60,
    pricePerSession: 380,
    isAccepting: true,
    totalHours: 1500,
    rating: 4.9,
    location: '广州',
    avatarUrl: 'https://picsum.photos/id/177/200/200',
    approaches: ['应用行为分析', '感觉统合'],
    workingGroups: ['儿童青少年']
  },
  {
    id: 'c4',
    displayName: '张维宁',
    title: '注册心理师 / 督导师',
    bio: '20 年心理咨询临床经验，擅长创伤疗愈、情绪障碍与复杂家庭关系处理。',
    specialties: ['创伤', '情绪问题', '人际关系'],
    counselorTypes: ['心理咨询师'],
    isSupervisor: true,
    sessionModes: ['视频', '面谈'],
    sessionDuration: 50,
    pricePerSession: 800,
    isAccepting: true,
    totalHours: 3000,
    rating: 5.0,
    location: '深圳',
    avatarUrl: 'https://picsum.photos/id/338/200/200',
    approaches: ['心理动力学', 'EMDR'],
    workingGroups: ['成人']
  },
  {
    id: 'c5',
    displayName: '李悦心',
    title: '儿童青少年心理咨询师',
    bio: '专注儿童青少年情绪与行为问题，擅长游戏治疗、家庭治疗与学校适应支持。',
    specialties: ['儿童青少年', '情绪问题', '学校适应'],
    counselorTypes: ['心理咨询师'],
    isSupervisor: false,
    sessionModes: ['视频', '面谈'],
    sessionDuration: 50,
    pricePerSession: 420,
    isAccepting: true,
    totalHours: 900,
    rating: 4.7,
    location: '杭州',
    avatarUrl: 'https://picsum.photos/id/1027/200/200',
    approaches: ['游戏治疗', '家庭治疗'],
    workingGroups: ['儿童青少年']
  },
  {
    id: 'c6',
    displayName: '赵知行',
    title: 'ADHD 教练 / 职业咨询师',
    bio: '帮助 ADHD 成人探索职业方向、改善职场表现，提供简历优化与面试辅导。',
    specialties: ['ADHD', '职场困境', '职业规划'],
    counselorTypes: ['ADHD教练'],
    isSupervisor: false,
    sessionModes: ['视频'],
    sessionDuration: 50,
    pricePerSession: 400,
    isAccepting: true,
    totalHours: 600,
    rating: 4.8,
    location: '成都',
    avatarUrl: 'https://picsum.photos/id/1/200/200',
    approaches: ['教练技术', '职业咨询'],
    workingGroups: ['成人']
  },
  {
    id: 'c7',
    displayName: '孙暖阳',
    title: '心理咨询师',
    bio: '温暖抱持的咨询风格，擅长女性成长、性议题与亲密关系议题。',
    specialties: ['女性成长', '性议题', '人际关系'],
    counselorTypes: ['心理咨询师'],
    isSupervisor: false,
    sessionModes: ['视频', '面谈'],
    sessionDuration: 50,
    pricePerSession: 480,
    isAccepting: true,
    totalHours: 1100,
    rating: 4.9,
    location: '南京',
    avatarUrl: 'https://picsum.photos/id/177/200/200',
    approaches: ['人本主义', '情绪聚焦'],
    workingGroups: ['成人']
  },
  {
    id: 'c8',
    displayName: '周安和',
    title: '睡眠与情绪专科咨询师',
    bio: '专注睡眠问题、焦虑抑郁情绪调节，结合正念与认知行为技术改善睡眠质量。',
    specialties: ['睡眠问题', '情绪问题', '焦虑'],
    counselorTypes: ['心理咨询师'],
    isSupervisor: false,
    sessionModes: ['视频'],
    sessionDuration: 50,
    pricePerSession: 360,
    isAccepting: true,
    totalHours: 700,
    rating: 4.6,
    location: '武汉',
    avatarUrl: 'https://picsum.photos/id/64/200/200',
    approaches: ['认知行为', '正念'],
    workingGroups: ['成人']
  }
];

export const categoryOptions = [
  { id: '心理咨询师', label: '心理咨询师', bg: '#EAF5E4', color: '#4A7A36' },
  { id: 'ADHD', label: 'ADHD', bg: '#FEF3E2', color: '#C86800' },
  { id: 'ASD', label: 'ASD', bg: '#EAF1FF', color: '#3060C0' },
  { id: '2天内', label: '2天内可约', bg: '#F8F6F0', color: '#9B8E82' },
  { id: 'ADHD教练', label: 'ADHD教练', bg: '#FDE8F8', color: '#A030A0' },
  { id: '特教老师', label: '特教老师', bg: '#F0EBF8', color: '#7030B8' },
  { id: '儿童青少年', label: '儿童青少年', bg: '#E5F7F0', color: '#207860' },
  { id: '本周', label: '本周可约', bg: '#F8F6F0', color: '#9B8E82' }
];

export const provinceOptions = [
  '全国/线上', '北京', '上海', '广州', '深圳', '杭州', '成都', '南京', '武汉'
];

export const priceOptions = ['不限', '300 以下', '300－500', '500 以上'];

export const directionOptions = [
  'ADHD', 'ASD', '情绪问题', '睡眠问题', '感官敏感', '创伤',
  '读写障碍', '女性成长', '人际关系', '职场困境', '儿童青少年',
  '家长支持', '性议题', 'ADHD教练', '特教老师'
];
