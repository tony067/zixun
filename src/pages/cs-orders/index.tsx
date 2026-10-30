import React, { useCallback, useState } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import styles from './index.module.scss';
import { useUserStore } from '@/stores/user';
import { request, updateBookingStatus } from '@/services/api';
import { getBookingStatusMeta } from '@/types/booking';
import CustomTabBar from '@/components/TabBar';

interface CsOrder {
  id: string;
  status: string;
  scheduledAt: string;
  sessionMode: string;
  priceAmount: number;
  clientName: string;
  counselorName: string;
}

type StatusTab = 'all' | 'pending' | 'payment' | 'paid';

const STATUS_TABS: { key: StatusTab; label: string; statuses: string[] }[] = [
  { key: 'all', label: '全部', statuses: [] },
  { key: 'pending', label: '待确认', statuses: ['pending_confirmation', 'pending'] },
  { key: 'payment', label: '待支付', statuses: ['pending_payment', 'confirmed'] },
  { key: 'paid', label: '已支付', statuses: ['paid'] },
];

// 客服可执行的操作范围（与服务端 PATCH /api/bookings/{id} 校验一致）
const CAN_MARK_PAID = ['pending_payment', 'confirmed'];
const CAN_REFUND = ['pending_confirmation', 'pending_payment', 'paid', 'in_progress', 'completed'];

function fmtDateTime(iso: string): string {
  if (!iso) return '-';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function normalizeOrder(raw: any): CsOrder {
  return {
    id: raw?.id || '',
    status: raw?.status || '',
    scheduledAt: raw?.scheduledAt || '',
    sessionMode: raw?.sessionMode || '-',
    priceAmount: Number(raw?.priceAmount) || 0,
    clientName: raw?.client?.name || '未知来访者',
    counselorName: raw?.counselor?.displayName || raw?.counselor?.name || '未知咨询师',
  };
}

const CsOrdersPage: React.FC = () => {
  const { currentRole } = useUserStore();
  const [activeTab, setActiveTab] = useState<StatusTab>('all');
  const [orders, setOrders] = useState<CsOrder[]>([]);
  const [loading, setLoading] = useState(true);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    try {
      const data = await request<any[]>('/api/admin/orders');
      setOrders(Array.isArray(data) ? data.map(normalizeOrder) : []);
    } catch (err) {
      Taro.showToast({
        title: err instanceof Error ? err.message : '加载订单失败，请稍后重试',
        icon: 'none'
      });
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useDidShow(() => {
    loadOrders();
  });

  const filteredOrders = activeTab === 'all'
    ? orders
    : orders.filter(o => {
        const tab = STATUS_TABS.find(t => t.key === activeTab);
        return tab ? tab.statuses.includes(o.status) : true;
      });

  const handleAction = (order: CsOrder, action: 'paid' | 'refunded') => {
    const isPaid = action === 'paid';
    Taro.showModal({
      title: isPaid ? '标记已支付' : '退款',
      content: isPaid
        ? `确认将订单 ${order.id} 标记为已支付吗？`
        : `确认对订单 ${order.id} 退款吗？退款后订单将变为「已退款」，费用将退回来访（模拟支付未实际扣款）。`,
      confirmText: isPaid ? '确认' : '退款',
      cancelText: '再想想',
      success: async (res) => {
        if (!res.confirm) return;
        try {
          await updateBookingStatus(order.id, action);
          Taro.showToast({ title: isPaid ? '已标记支付' : '退款成功', icon: 'success' });
          loadOrders();
        } catch (err) {
          Taro.showToast({
            title: err instanceof Error ? err.message : (isPaid ? '操作失败，请稍后重试' : '退款失败，请稍后重试'),
            icon: 'none'
          });
        }
      }
    });
  };

  if (currentRole !== 'support') {
    return (
      <View className={styles.container}>
        <View className={styles.unauthorized}>
          <Text className={styles.unauthorizedText}>请切换到客服角色查看此页面</Text>
        </View>
      </View>
    );
  }

  return (
    <View className={styles.container}>
      <View className={styles.header}>
        <Text className={styles.title}>客服工作台</Text>
        <Text className={styles.subtitle}>共 {orders.length} 笔订单</Text>
        <View className={styles.roleBadge}>
          <Text className={styles.roleBadgeText}>客服 · 订单促进</Text>
        </View>
      </View>

      <View className={styles.tabBar}>
        {STATUS_TABS.map(tab => (
          <View
            key={tab.key}
            className={`${styles.tabItem} ${activeTab === tab.key ? styles.tabActive : ''}`}
            onClick={() => setActiveTab(tab.key)}
          >
            <Text className={styles.tabText}>{tab.label}</Text>
          </View>
        ))}
      </View>

      <ScrollView className={styles.scrollContent} scrollY>
        {filteredOrders.length === 0 ? (
          <View className={styles.empty}>
            <Text className={styles.emptyText}>{loading ? '加载中…' : '暂无订单'}</Text>
          </View>
        ) : (
          <View className={styles.orderList}>
            {filteredOrders.map(order => {
              const statusMeta = getBookingStatusMeta(order.status);
              return (
                <View key={order.id} className={styles.orderCard}>
                  <View className={styles.orderHeader}>
                    <Text className={styles.orderId}>订单号: {order.id}</Text>
                    <Text
                      className={styles.orderStatus}
                      style={{ color: statusMeta.color, backgroundColor: statusMeta.bg }}
                    >
                      {statusMeta.label}
                    </Text>
                  </View>
                  <View className={styles.orderInfo}>
                    <View className={styles.infoRow}>
                      <Text className={styles.infoLabel}>来访者</Text>
                      <Text className={styles.infoValue}>{order.clientName}</Text>
                    </View>
                    <View className={styles.infoRow}>
                      <Text className={styles.infoLabel}>咨询师</Text>
                      <Text className={styles.infoValue}>{order.counselorName}</Text>
                    </View>
                    <View className={styles.infoRow}>
                      <Text className={styles.infoLabel}>咨询方式</Text>
                      <Text className={styles.infoValue}>{order.sessionMode}</Text>
                    </View>
                    <View className={styles.infoRow}>
                      <Text className={styles.infoLabel}>预约时间</Text>
                      <Text className={styles.infoValue}>{fmtDateTime(order.scheduledAt)}</Text>
                    </View>
                  </View>
                  <View className={styles.orderFooter}>
                    <Text className={styles.orderPrice}>¥{order.priceAmount}</Text>
                    <View className={styles.actions}>
                      {CAN_MARK_PAID.includes(order.status) && (
                        <View className={styles.payButton} onClick={() => handleAction(order, 'paid')}>
                          <Text className={styles.payButtonText}>标记已支付</Text>
                        </View>
                      )}
                      {CAN_REFUND.includes(order.status) && (
                        <View className={styles.refundButton} onClick={() => handleAction(order, 'refunded')}>
                          <Text className={styles.refundButtonText}>退款</Text>
                        </View>
                      )}
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
      <CustomTabBar />
    </View>
  );
};

export default CsOrdersPage;
