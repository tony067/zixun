import Taro from '@tarojs/taro';
import { mockCounselors } from '@/data/counselors';
import { mockBookings } from '@/data/bookings';
import type { Counselor } from '@/types/counselor';
import type { Booking } from '@/types/booking';

const API_BASE = 'https://mindpace-9fd897a7.eazo.dev';

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

    if (res.statusCode >= 200 && res.statusCode < 300) {
      return res.data as T;
    }

    console.error(`[API] ${path} 请求失败`, res.statusCode, res.data);
    throw new Error(`请求失败: ${res.statusCode}`);
  } catch (err) {
    console.error(`[API] ${path} 异常`, err);
    throw err;
  }
}

// 咨询师列表（当前使用 mock，后续切换为真实接口）
export async function fetchCounselors(): Promise<Counselor[]> {
  try {
    // return await request<Counselor[]>('/api/counselors');
    return Promise.resolve(mockCounselors);
  } catch (err) {
    console.error('[Counselor] 获取咨询师列表失败，使用 mock 数据', err);
    return mockCounselors;
  }
}

export async function fetchCounselorDetail(id: string): Promise<Counselor | null> {
  try {
    // return await request<Counselor>(`/api/counselors/${id}`);
    const counselor = mockCounselors.find(c => c.id === id) || null;
    return Promise.resolve(counselor);
  } catch (err) {
    console.error(`[Counselor] 获取咨询师 ${id} 详情失败`, err);
    return null;
  }
}

// 我的预约
export async function fetchMyBookings(): Promise<Booking[]> {
  try {
    // return await request<Booking[]>('/api/bookings/my');
    return Promise.resolve(mockBookings);
  } catch (err) {
    console.error('[Booking] 获取预约列表失败，使用 mock 数据', err);
    return mockBookings;
  }
}
