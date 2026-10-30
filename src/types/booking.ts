export type BookingStatus =
  | 'pending_confirmation'
  | 'pending_payment'
  | 'confirmed' // 历史遗留别名（=待支付）
  | 'pending' // 历史遗留别名（=待确认）
  | 'paid'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'rejected'
  | 'refunded';

export interface BookingCounselor {
  id: string;
  name: string;
  avatarUrl: string | null;
  title: string;
}

export interface Booking {
  id: string;
  counselorId: string;
  counselor: BookingCounselor;
  scheduledAt: string;
  durationMinutes: number;
  sessionMode: string;
  priceAmount: number;
  status: BookingStatus;
  clientNote?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * 订单状态统一配置 —— 三端（来访 / 咨询师 / 管理员）唯一的规范来源
 * 新增状态 / 调整文案配色只改这里，禁止在各界面里散落硬编码
 */
export interface BookingStatusMeta {
  /** 三端统一的短标签（徽章用） */
  label: string;
  /** 徽章文字色 */
  color: string;
  /** 徽章背景色 */
  bg: string;
}

export const STATUS_META: Record<string, BookingStatusMeta> = {
  pending_confirmation: { label: '待确认', color: '#D97706', bg: '#FEF3C7' },
  pending_payment: { label: '待支付', color: '#D97706', bg: '#FEF3C7' },
  confirmed: { label: '待支付', color: '#D97706', bg: '#FEF3C7' },
  pending: { label: '待确认', color: '#D97706', bg: '#FEF3C7' },
  paid: { label: '待咨询', color: '#3A6228', bg: '#E4F0DC' },
  in_progress: { label: '进行中', color: '#2563EB', bg: '#DBEAFE' },
  completed: { label: '已完成', color: '#6B7280', bg: '#F3F4F6' },
  cancelled: { label: '已取消', color: '#9CA3AF', bg: '#F9FAFB' },
  rejected: { label: '已拒绝', color: '#DC2626', bg: '#FEE2E2' },
  refunded: { label: '已退款', color: '#B07D2A', bg: '#FEF9EE' }
};

/** 未知状态兜底：中性米灰色 */
export function getBookingStatusMeta(status: string): BookingStatusMeta {
  return STATUS_META[status] || { label: status, color: '#9B8E82', bg: '#F5F0EA' };
}
