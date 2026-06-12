// 后端接口基础地址
// 等 AppID 配好后，确认域名可以加入微信合法域名白名单
export const API_BASE = 'https://mindpace-9fd897a7.eazo.dev'

// 微信登录：后续接入真实 wx.login 后替换这里
// 目前用 localStorage 模拟 session（仅 h5 开发调试用）
import Taro from '@tarojs/taro'

let _session: string | null = null

export function setSession(token: string) {
  _session = token
  try { Taro.setStorageSync('mp_session', token) } catch {}
}

export function getSession(): string | null {
  if (_session) return _session
  try { _session = Taro.getStorageSync('mp_session') || null } catch {}
  return _session
}

export function clearSession() {
  _session = null
  try { Taro.removeStorageSync('mp_session') } catch {}
}

/**
 * 统一请求函数：自动带上 x-eazo-session header
 */
export async function request<T = any>(
  path: string,
  options: {
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
    data?: any
    headers?: Record<string, string>
  } = {}
): Promise<T> {
  const session = getSession()
  const url = path.startsWith('http') ? path : `${API_BASE}${path}`

  return new Promise((resolve, reject) => {
    Taro.request({
      url,
      method: options.method || 'GET',
      data: options.data,
      header: {
        'Content-Type': 'application/json',
        ...(session ? { 'x-eazo-session': session } : {}),
        ...(options.headers || {}),
      },
      success: (res) => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(res.data as T)
        } else if (res.statusCode === 401) {
          clearSession()
          reject(new Error('未登录，请重新登录'))
        } else {
          reject(new Error((res.data as any)?.error || `请求失败 ${res.statusCode}`))
        }
      },
      fail: (err) => reject(new Error(err.errMsg || '网络请求失败')),
    })
  })
}
