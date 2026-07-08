export type BookingStatus =
  | 'pending_confirmation'
  | 'confirmed'
  | 'pending_payment'
  | 'paid'
  | 'completed'
  | 'cancelled'
  | 'rejected';

export interface Booking {
  id: string;
  clientId: string;
  counselorId: string;
  counselorName: string;
  counselorAvatar: string | null;
  scheduledAt: string;
  durationMinutes: number;
  sessionMode: string;
  priceAmount: number;
  status: BookingStatus;
  clientNote?: string;
  rescheduleStatus?: 'none' | 'pending' | 'approved' | 'rejected';
  rescheduleNewTime?: string;
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
