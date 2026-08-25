import Taro from '@tarojs/taro';
import type { Counselor } from '@/types/counselor';
import type { Booking, BookingStatus } from '@/types/booking';

const API_BASE = process.env.NODE_ENV === 'development' ? '' : 'http://123.207.40.7:3001';

function getToken(): string | null {
  try {
    return Taro.getStorageSync('token') || null;
  } catch (e) {
    console.error('[Auth] 读取 token 失败', e);
    return null;
  }
}

export async function request<T>(path: string, options: Taro.request.Option = {}): Promise<T> {
  const token = getToken();
  const url = `${API_BASE}${path}`;

  console.log(`[API] 请求: ${url}, method: ${options.method || 'GET'}`);

  try {
    const res = await Taro.request({
      url,
      method: options.method || 'GET',
      header: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.header
      },
      data: options.data,
      timeout: 15000
    });

    console.log(`[API] 响应: ${url}, status: ${res.statusCode}, data:`, res.data);

    if (res.statusCode >= 200 && res.statusCode < 300) {
      const responseData = res.data;
      if (responseData && typeof responseData === 'object' && 'data' in responseData) {
        return responseData.data as T;
      }
      return responseData as T;
    }

    console.error(`[API] ${path} 请求失败`, res.statusCode, res.data);
    const errMsg = res.data?.error || res.data?.message || res.data?.msg || `请求失败: ${res.statusCode}`;
    throw new Error(errMsg);
  } catch (err) {
    console.error(`[API] ${path} 异常`, err);
    throw err;
  }
}

function normalizeCounselor(raw: any): Counselor {
  return {
    id: raw.id,
    displayName: raw.displayName || raw.name || '',
    title: raw.title || '',
    bio: raw.bio || '',
    tagline: raw.tagline || '',
    specialties: raw.specialties || [],
    customSpecialties: raw.customSpecialties || [],
    counselorTypes: raw.counselorTypes || [],
    isSupervisor: raw.isSupervisor || false,
    sessionModes: raw.sessionModes || [],
    sessionDuration: raw.sessionDuration || 50,
    pricePerSession: raw.pricePerSession || 0,
    currency: raw.currency || 'CNY',
    pricingOptions: raw.pricingOptions || [],
    isAccepting: raw.isAccepting ?? true,
    totalHours: raw.totalHours || 0,
    totalSessions: raw.totalSessions || 0,
    rating: raw.rating ? raw.rating / 10 : 0,
    reviewStatus: raw.reviewStatus || 'approved',
    reviewNote: raw.reviewNote || '',
    location: raw.location || '',
    avatarUrl: raw.avatarUrl || null,
    approaches: raw.approaches || [],
    customApproaches: raw.customApproaches || [],
    workingGroups: raw.workingGroups || [],
    customWorkingGroups: raw.customWorkingGroups || [],
    education: raw.education || [],
    qualifications: raw.qualifications || [],
    trainings: raw.trainings || [],
    workExperiences: raw.workExperiences || [],
    languages: raw.languages || [],
    sessionSettings: raw.sessionSettings || null,
    sessionDescription: raw.sessionDescription || null,
  };
}

function normalizeBooking(raw: any): Booking {
  const counselor = raw.counselor || {};
  return {
    id: raw.id,
    counselorId: raw.counselorId || counselor.id || '',
    counselor: {
      id: counselor.id || '',
      name: counselor.displayName || counselor.name || '',
      avatarUrl: counselor.avatarUrl || null,
      title: counselor.title || '',
    },
    scheduledAt: raw.scheduledAt,
    durationMinutes: raw.durationMinutes || 50,
    sessionMode: raw.sessionMode || '视频',
    priceAmount: raw.priceAmount || 0,
    status: raw.status as BookingStatus,
    clientNote: raw.clientNote || '',
    createdAt: raw.createdAt || '',
    updatedAt: raw.updatedAt || '',
  };
}

// 咨询师列表
export async function fetchCounselors(params?: {
  specialty?: string;
  q?: string;
}): Promise<Counselor[]> {
  const query: string[] = [];
  if (params?.specialty) query.push(`specialty=${encodeURIComponent(params.specialty)}`);
  if (params?.q) query.push(`q=${encodeURIComponent(params.q)}`);
  const queryStr = query.length > 0 ? `?${query.join('&')}` : '';

  const data = await request<any[]>(`/api/counselors${queryStr}`);
  return (data || []).map(normalizeCounselor);
}

// 咨询师详情
export async function fetchCounselorDetail(id: string): Promise<Counselor | null> {
  try {
    const data = await request<any>(`/api/counselors/${id}`);
    return normalizeCounselor(data);
  } catch (err) {
    console.error(`[Counselor] 获取咨询师 ${id} 详情失败`, err);
    return null;
  }
}

// 认证相关
export interface LoginResponse {
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
    avatarUrl?: string;
    isAdmin?: boolean;
    isTester?: boolean;
  };
}

export interface LoginParams {
  email: string;
  password: string;
}

export interface RegisterParams {
  name?: string;
  email: string;
  password: string;
}

export async function login(params: LoginParams): Promise<LoginResponse> {
  return await request<LoginResponse>('/api/auth/login', {
    method: 'POST',
    data: params
  });
}

export async function register(params: RegisterParams): Promise<LoginResponse> {
  return await request<LoginResponse>('/api/auth/register', {
    method: 'POST',
    data: params
  });
}

export async function fetchCurrentUser(): Promise<LoginResponse['user'] | null> {
  try {
    const data = await request<{ user: LoginResponse['user'] }>('/api/auth/me');
    return data.user;
  } catch (err) {
    console.error('[Auth] 获取当前用户信息失败', err);
    return null;
  }
}

// 用户资料
export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
}

export async function fetchUserProfile(): Promise<UserProfile | null> {
  try {
    return await request<UserProfile>('/api/user/profile');
  } catch (err) {
    console.error('[User] 获取用户资料失败', err);
    return null;
  }
}

export async function updateUserProfile(data: Partial<UserProfile>): Promise<UserProfile> {
  return await request<UserProfile>('/api/user/profile', {
    method: 'PATCH',
    data
  });
}

// 收藏相关
export interface FavoriteResponse {
  counselorId: string;
  counselor?: Counselor;
}

export async function fetchFavorites(): Promise<Counselor[]> {
  try {
    const data = await request<FavoriteResponse[]>('/api/user/favorites');
    return (data || []).map(item => normalizeCounselor(item.counselor || item));
  } catch (err) {
    console.error('[Favorite] 获取收藏列表失败', err);
    return [];
  }
}

export async function addFavorite(counselorId: string): Promise<void> {
  await request<void>('/api/user/favorites', {
    method: 'POST',
    data: { counselorId }
  });
}

export async function removeFavorite(counselorId: string): Promise<void> {
  await request<void>('/api/user/favorites', {
    method: 'DELETE',
    data: { counselorId }
  });
}

// 预约相关
export interface CreateBookingParams {
  counselorId: string;
  scheduledAt: string;
  sessionMode?: string;
  clientNote?: string;
}

export async function fetchMyBookings(): Promise<Booking[]> {
  const data = await request<any[]>('/api/bookings/my');
  return (data || []).map(normalizeBooking);
}

export async function fetchBookingDetail(id: string): Promise<Booking | null> {
  try {
    const data = await request<any>(`/api/bookings/${id}`);
    return normalizeBooking(data);
  } catch (err) {
    console.error(`[Booking] 获取预约 ${id} 详情失败`, err);
    return null;
  }
}

export async function createBooking(params: CreateBookingParams): Promise<Booking> {
  const data = await request<any>('/api/bookings', {
    method: 'POST',
    data: params
  });
  return normalizeBooking(data);
}

// 消息相关
export interface Message {
  id: string;
  senderId: string;
  senderName?: string;
  senderAvatar?: string;
  content: string;
  type: 'text' | 'system';
  createdAt: string;
  unread: boolean;
}

export async function fetchMessages(): Promise<Message[]> {
  const data = await request<Message[]>('/api/messages');
  return data || [];
}

export async function sendMessage(data: {
  recipientId: string;
  content: string;
}): Promise<Message> {
  return await request<Message>('/api/messages', {
    method: 'POST',
    data
  });
}

export async function fetchMessageDetail(id: string): Promise<Message | null> {
  try {
    return await request<Message>(`/api/messages/${id}`);
  } catch (err) {
    console.error(`[Message] 获取消息 ${id} 详情失败`, err);
    return null;
  }
}