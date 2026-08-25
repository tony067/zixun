export type BookingStatus =
  | 'pending_confirmation'
  | 'confirmed'
  | 'pending_payment'
  | 'paid'
  | 'completed'
  | 'cancelled'
  | 'rejected';

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

export const bookingStatusText: Record<BookingStatus, string> = {
  pending_confirmation: '待确认',
  confirmed: '已确认',
  pending_payment: '待支付',
  paid: '已支付',
  completed: '已完成',
  cancelled: '已取消',
  rejected: '已拒绝'
};