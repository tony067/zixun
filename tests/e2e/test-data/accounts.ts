export interface TestAccount {
  label: string;
  email: string;
  password: string;
  expectedRole: 'visitor' | 'counselor' | 'admin' | 'support';
}

export const ACCOUNTS = {
  admin: {
    label: '管理员',
    email: '511099828@qq.com',
    password: 'Fangle23543',
    expectedRole: 'admin' as const,
  },
  counselor: {
    label: '咨询师',
    email: process.env.COUNSELOR_EMAIL || 'counselor@example.com',
    password: process.env.COUNSELOR_PASSWORD || 'counselor123',
    expectedRole: 'counselor' as const,
  },
  visitor: {
    label: '来访者',
    email: process.env.VISITOR_EMAIL || 'visitor@example.com',
    password: process.env.VISITOR_PASSWORD || 'visitor123',
    expectedRole: 'visitor' as const,
  },
} as const;

export const NEW_USER = {
  email: `test_${Date.now()}@example.com`,
  password: 'test123456',
  name: `测试用户_${Date.now().toString().slice(-6)}`,
};

export const API_ENDPOINTS = {
  counselors: '/api/counselors',
  counselorDetail: (id: string) => `/api/counselors/${id}`,
  login: '/api/auth/login',
  register: '/api/auth/register',
  me: '/api/auth/me',
  profile: '/api/user/profile',
  favorites: '/api/user/favorites',
  bookingsMy: '/api/bookings/my',
  createBooking: '/api/bookings',
  messages: '/api/messages',
};
