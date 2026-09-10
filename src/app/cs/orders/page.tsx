import AdminOrdersScreen from "@/components/screens/admin-orders-screen";

/**
 * 客服 · 订单工作台
 * 复用管理员订单屏（variant="support"）：只开放 标记已支付 + 退款 操作
 * 消息走 /messages（底部导航「消息」tab）
 */
export default function SupportOrdersPage() {
  return <AdminOrdersScreen variant="support" />;
}
