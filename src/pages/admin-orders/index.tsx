import React, { useCallback, useState } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import styles from './index.module.scss';
import { useUserStore } from '@/stores/user';
import { request, updateBookingStatus } from '@/services/api';
import { getBookingStatusMeta } from '@/types/booking';
import CustomTabBar from '@/components/TabBar';

interface AdminOrder {
  id: string;
  client: string;
  counselor: string;
  mode: string;
  date: string;
  price: number;
  status: string;
}

const STATUS_TABS: { key: 'all' | 'pending' | 'confirmed' | 'completed'; label: string; statuses: string[] }[] = [
  { key: 'all', label: '全部', statuses: [] },
  { key: 'pending', label: '待确认', statuses: ['pending_confirmation', 'pending'] },
  { key: 'confirmed', label: '待支付', statuses: ['pending_payment', 'confirmed'] },
  { key: 'completed', label: '已完成', statuses: ['completed'] },
];

function fmtDateTime(iso: string): string {
  if (!iso) return '-';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function normalizeOrder(raw: any): AdminOrder {
  return {
    id: raw?.id || '',
    client: raw?.client?.name || '未知来访者',
    counselor: raw?.counselor?.displayName || raw?.counselor?.name || '未知咨询师',
    mode: raw?.sessionMode || '-',
    date: fmtDateTime(raw?.scheduledAt || ''),
    price: Number(raw?.priceAmount) || 0,
    status: raw?.status || '',
  };
}

const AdminOrdersPage: React.FC = () => {
  const { currentRole } = useUserStore();
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'confirmed' | 'completed'>('all');
  const [orders, setOrders] = useState<AdminOrder[]>([]);
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

  // admin 全场可退：任意非 refunded/cancelled 状态显示退款按钮
  const canRefund = (status: string) => status !== 'refunded' && status !== 'cancelled';

  // 退款：二次确认后 status → refunded，失败时 toast 服务端 message（含 409 非法流转）
  const handleRefund = (order: AdminOrder) => {
    Taro.showModal({
      title: '退款',
      content: `确认对订单 ${order.id} 退款吗？退款后订单将变为「已退款」，费用将退回来访（模拟支付未实际扣款）。`,
      confirmText: '退款',
      cancelText: '再想想',
      success: async (res) => {
        if (!res.confirm) return;
        try {
          await updateBookingStatus(order.id, 'refunded');
          Taro.showToast({ title: '退款成功', icon: 'success' });
          loadOrders();
        } catch (err) {
          Taro.showToast({
            title: err instanceof Error ? err.message : '退款失败，请稍后重试',
            icon: 'none'
          });
        }
      }
    });
  };

  if (currentRole !== 'admin') {
    return (
      <View className={styles.container}>
        <View className={styles.unauthorized}>
          <Text className={styles.unauthorizedText}>请切换到管理员角色查看此页面</Text>
        </View>
      </View>
    );
  }

  return (
    <View className={styles.container}>
      <View className={styles.header}>
        <Text className={styles.title}>订单管理</Text>
      </View>
      
      <View className={styles.tabBar}>
        <View
          className={`${styles.tabItem} ${activeTab === 'all' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('all')}
        >
          <Text className={styles.tabText}>全部</Text>
        </View>
        <View
          className={`${styles.tabItem} ${activeTab === 'pending' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('pending')}
        >
          <Text className={styles.tabText}>待确认</Text>
        </View>
        <View
          className={`${styles.tabItem} ${activeTab === 'confirmed' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('confirmed')}
        >
          <Text className={styles.tabText}>待支付</Text>
        </View>
        <View
          className={`${styles.tabItem} ${activeTab === 'completed' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('completed')}
        >
          <Text className={styles.tabText}>已完成</Text>
        </View>
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
                      <Text className={styles.infoValue}>{order.client}</Text>
                    </View>
                    <View className={styles.infoRow}>
                      <Text className={styles.infoLabel}>咨询师</Text>
                      <Text className={styles.infoValue}>{order.counselor}</Text>
                    </View>
                    <View className={styles.infoRow}>
                      <Text className={styles.infoLabel}>咨询方式</Text>
                      <Text className={styles.infoValue}>{order.mode}</Text>
                    </View>
                    <View className={styles.infoRow}>
                      <Text className={styles.infoLabel}>预约时间</Text>
                      <Text className={styles.infoValue}>{order.date}</Text>
                    </View>
                  </View>
                  <View className={styles.orderFooter}>
                    <Text className={styles.orderPrice}>¥{order.price}</Text>
                    {canRefund(order.status) && (
                      <View className={styles.refundButton} onClick={() => handleRefund(order)}>
                        <Text className={styles.refundButtonText}>退款</Text>
                      </View>
                    )}
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

export default AdminOrdersPage;