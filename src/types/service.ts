/** 个性服务（评估系统）与服务订单 —— 与 standalone 分支契约对齐 */

export type ServiceQuestionType = 'single' | 'multi' | 'text' | 'scale';

export interface ServiceQuestion {
  id: string;
  type: ServiceQuestionType;
  title: string;
  options?: string[];
  required?: boolean;
}

export interface ServiceCounselorBrief {
  id: string;
  userId: string;
  displayName: string;
  title?: string;
  avatarUrl?: string | null;
  bio?: string;
  counselorTypes?: string[];
  specialties?: string[];
  customSpecialties?: string[];
}

/** 评估服务（上架商品） */
export interface AssessmentService {
  id: string;
  counselorId: string;
  type?: string;
  name: string;
  tagline?: string | null;
  description?: string | null;
  price: number;
  questions: ServiceQuestion[];
  questionnaireLink?: string | null;
  status?: 'active' | 'inactive';
  createdAt?: string;
  counselorName?: string;
  counselor?: ServiceCounselorBrief;
}

/** 答案项：value 为 string | string[] | number */
export interface ServiceAnswer {
  questionId: string;
  value: string | string[] | number;
}

export type ServiceOrderStatus =
  | 'pending_payment'
  | 'paid'
  | 'submitted'
  | 'completed'
  | 'refunded'
  | 'cancelled';

/** 服务订单状态徽章（来访端 + 管理端统一规范，配色跟随纸叠色板） */
export const SERVICE_STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
  pending_payment: { label: '待支付', color: '#C66B2E', bg: '#FAE9DD' },
  paid: { label: '待作答', color: '#3A6228', bg: '#E4F0DC' },
  submitted: { label: '待写报告', color: '#3A9B8E', bg: '#E4F2F0' },
  completed: { label: '已完成', color: '#FFFFFF', bg: '#9CB48A' },
  refunded: { label: '已退款', color: '#B07D2A', bg: '#FEF9EE' },
  cancelled: { label: '已取消', color: '#9B8E82', bg: '#EBE7DF' }
};

export function getServiceStatusMeta(status: string) {
  return (
    SERVICE_STATUS_META[status] || { label: status, color: '#9B8E82', bg: '#F5F0EA' }
  );
}

/** 来访端状态提示语（我的订单列表/详情用） */
export function getServiceStatusDesc(status: string): string {
  switch (status) {
    case 'pending_payment':
      return '订单待支付，支付完成后即可填写评估问卷';
    case 'paid':
      return '请填写评估问卷，提交后老师将为你撰写报告';
    case 'submitted':
      return '问卷已提交，老师正在撰写评估报告';
    case 'completed':
      return '评估报告已完成，可查看报告内容';
    case 'refunded':
      return '订单已退款';
    case 'cancelled':
      return '订单已取消';
    default:
      return '';
  }
}

export interface ServiceOrder {
  id: string;
  serviceId: string;
  counselorId: string;
  clientId?: string;
  serviceName?: string;
  price: number;
  status: ServiceOrderStatus;
  paymentMethod?: string;
  paidAt?: string | null;
  answers?: ServiceAnswer[] | null;
  submittedAt?: string | null;
  report?: string | null;
  reportAt?: string | null;
  reportLink?: string | null;
  reportFileUrl?: string | null;
  questionnaireLink?: string | null;
  questions?: ServiceQuestion[];
  clientName?: string;
  counselorName?: string;
  counselor?: ServiceCounselorBrief;
  createdAt: string;
}

/** 咨询套餐账户 */
export interface ConsultationPackage {
  id: string;
  orderId: string;
  counselorId: string;
  counselorName?: string;
  planName: string;
  totalSessions: number;
  usedSessions: number;
  status: 'active' | 'refunded';
  createdAt: string;
}
