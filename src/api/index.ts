import { request } from './request'

// ─── 咨询师列表 ───
export interface Counselor {
  id: string
  displayName: string
  title: string
  bio: string
  tagline?: string
  specialties: string[]
  counselorTypes: string[]
  isSupervisor: boolean
  sessionModes: string[]
  sessionDuration: number
  pricePerSession: number
  isAccepting: boolean
  totalHours: number
  rating: number
  location: string
  avatarUrl: string | null
  approaches?: string[]
  workingGroups?: string[]
}

export function getCounselors(params?: {
  type?: string
  specialty?: string
  search?: string
  sort?: string
  available?: boolean
}) {
  const qs = params ? '?' + new URLSearchParams(
    Object.entries(params)
      .filter(([, v]) => v !== undefined && v !== '')
      .map(([k, v]) => [k, String(v)])
  ).toString() : ''
  return request<Counselor[]>(`/api/counselors${qs}`)
}

export function getCounselorById(id: string) {
  return request<Counselor>(`/api/counselors/${id}`)
}

// ─── 预约 ───
export interface Booking {
  id: string
  clientId: string
  counselorId: string
  scheduledAt: string
  durationMinutes: number
  sessionMode: string
  priceAmount: number
  status: string
  clientNote?: string
  sessionNumber?: number
}

export function getMyBookings() {
  return request<Booking[]>('/api/bookings/my')
}

export function createBooking(data: {
  counselorId: string
  scheduledAt: string
  sessionMode: string
  clientNote?: string
  applicationForm?: any
  agreementSigned?: boolean
  sessionNumber?: number
}) {
  return request<Booking>('/api/bookings', { method: 'POST', data })
}

export function getBookingById(id: string) {
  return request<Booking>(`/api/bookings/${id}`)
}

// ─── 消息 ───
export interface Conversation {
  id: string
  otherUser: { id: string; displayName: string; avatarUrl: string | null }
  lastMessage?: { content: string; createdAt: string }
  unreadCount: number
}

export interface Message {
  id: string
  senderId: string
  content: string
  createdAt: string
}

export function getConversations() {
  return request<Conversation[]>('/api/messages/conversations')
}

export function getMessages(conversationId: string) {
  return request<Message[]>(`/api/messages/${conversationId}`)
}

export function sendMessage(conversationId: string, content: string) {
  return request<Message>(`/api/messages/${conversationId}`, {
    method: 'POST',
    data: { content },
  })
}

// ─── 用户资料 ───
export interface UserProfile {
  id: string
  name: string
  email: string
  avatarUrl: string | null
  role?: string
}

export function getMyProfile() {
  return request<UserProfile>('/api/user/profile')
}

export function updateMyProfile(data: Partial<UserProfile>) {
  return request<UserProfile>('/api/user/profile', { method: 'PUT', data })
}

// ─── 收藏 ───
export function getFavorites() {
  return request<Counselor[]>('/api/favorites')
}

export function toggleFavorite(counselorId: string) {
  return request<{ favorited: boolean }>(`/api/favorites/${counselorId}`, { method: 'POST' })
}

// ─── 咨询师端 ───
export function getCounselorBookings() {
  return request<Booking[]>('/api/counselor/bookings')
}

export function updateBookingStatus(id: string, status: string) {
  return request<Booking>(`/api/bookings/${id}`, {
    method: 'PATCH',
    data: { status },
  })
}

// ─── 管理员 ───
export function getAdminStats() {
  return request<any>('/api/admin/stats')
}

export function getAdminCounselors() {
  return request<any[]>('/api/admin/counselors')
}

export function getAdminOrders() {
  return request<any[]>('/api/admin/orders')
}

export function getAdminUsers() {
  return request<any[]>('/api/admin/users')
}
