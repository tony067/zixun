import React, { useCallback, useRef, useState } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import styles from './index.module.scss';
import { useUserStore } from '@/stores/user';
import {
  request,
  updateBookingStatus,
  markAdminOrdersSeen,
  fetchServiceOrders,
  patchServiceOrder
} from '@/services/api';
import { getBookingStatusMeta } from '@/types/booking';
import { getServiceStatusMeta } from '@/types/service';
import type { ServiceOrder, ServiceOrderStatus } from '@/types/service';
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

type BizTab = 'booking' | 'service';
type StatusTabKey = 'all' | 'pending' | 'confirmed' | 'completed';

const STATUS_TABS: { key: StatusTabKey; label: string; statuses: string[] }[] = [
  { key: 'all', label: '全部', statuses: [] },
  { key: 'pending', label: '待确认', statuses: ['pending_confirmation', 'pending'] },
  { key: 'confirmed', label: '待支付', statuses: ['pending_payment', 'confirmed'] },
  { key: 'completed', label: '已完成', statuses: ['completed'] },
];

// 评估订单子筛选（横向滚动 pill）
const SVC_STATUS_TABS: { key: 'all' | ServiceOrderStatus; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'pending_payment', label: '待支付' },
  { key: 'paid', label: '待作答' },
  { key: 'submitted', label: '待写报告' },
  { key: 'completed', label: '已完成' },
  { key: 'refunded', label: '已退款' },
  { key: 'cancelled', label: '已取消' },
];

function fmtDateTime(iso: string): string {
  if (!iso) return '-';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fmtDate(iso: string): string {
  if (!iso) return '-';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
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

function svcClientLabel(o: ServiceOrder): string {
  if (o.clientName) return o.clientName;
  return o.clientId ? `客户${o.clientId.slice(0, 10)}` : '客户';
}

function svcCounselorLabel(o: ServiceOrder): string {
  return o.counselorName || o.counselor?.displayName || '老师';
}

const AdminOrdersPage: React.FC = () => {
  const { currentRole } = useUserStore();
  const [bizTab, setBizTab] = useState<BizTab>('booking');
  const [activeTab, setActiveTab] = useState<StatusTabKey>('all');
  const [svcTab, setSvcTab] = useState<'all' | ServiceOrderStatus>('all');
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [svcOrders, setSvcOrders] = useState<ServiceOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [svcLoading, setSvcLoading] = useState(false);
  const bizTabRef = useRef(bizTab);
  bizTabRef.current = bizTab;

  const loadOrders = useCallback(async () => {
    setLoading(true);
    try {
      const data = await request<any[]>('/api/admin/orders');
      setOrders(Array.isArray(data) ? data.map(normalizeOrder) : []);
      // 页面加载成功后清除"新订单"红点（静默失败不阻塞）
      markAdminOrdersSeen().catch(() => {});
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

  const loadServiceOrders = useCallback(async () => {
    setSvcLoading(true);
    try {
      const data = await fetchServiceOrders();
      setSvcOrders(Array.isArray(data) ? data : []);
    } catch (err) {
      Taro.showToast({
        title: err instanceof Error ? err.message : '加载评估订单失败，请稍后重试',
        icon: 'none'
      });
    } finally {
      setSvcLoading(false);
    }
  }, []);

  useDidShow(() => {
    loadOrders();
    if (bizTabRef.current === 'service') loadServiceOrders();
  });

  const handleBizTab = (tab: BizTab) => {
    if (bizTab === tab) return;
    setBizTab(tab);
    if (tab === 'service') loadServiceOrders();
  };

  const filteredOrders = activeTab === 'all'
    ? orders
    : orders.filter(o => {
        const tab = STATUS_TABS.find(t => t.key === activeTab);
        return tab ? tab.statuses.includes(o.status) : true;
      });

  const filteredSvc = svcTab === 'all'
    ? svcOrders
    : svcOrders.filter(o => o.status === svcTab);

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

  // 咨询待支付订单（线下转账）：点击卡片确认收款（小程序端无独立订单详情页，直接弹窗确认）
  const handleBookingCardClick = (order: AdminOrder) => {
    if (order.status !== 'pending_payment') return;
    Taro.showModal({
      title: '确认收款',
      content: `订单 ${order.id} 为客户线下转账，确认已收到转账吗？确认后订单将变为「待咨询」。`,
      confirmText: '确认收款',
      cancelText: '再想想',
      success: async (res) => {
        if (!res.confirm) return;
        try {
          await updateBookingStatus(order.id, 'paid');
          Taro.showToast({ title: '已确认收款', icon: 'success' });
          loadOrders();
        } catch (err) {
          Taro.showToast({
            title: err instanceof Error ? err.message : '确认收款失败，请稍后重试',
            icon: 'none'
          });
        }
      }
    });
  };

  // 评估订单卡：点击进入评估订单详情（答卷/报告/退款）
  const handleSvcCardClick = (order: ServiceOrder) => {
    Taro.navigateTo({ url: `/pages/my-service-detail/index?id=${order.id}` });
  };

  // 评估待支付订单：确认收款（confirm_paid → 待作答）
  const handleSvcConfirmPaid = (order: ServiceOrder) => {
    Taro.showModal({
      title: '确认收款',
      content: `确认已收到「${order.serviceName || '评估服务'}」订单的客户线下转账吗？确认后订单将变为「待作答」。`,
      confirmText: '确认收款',
      cancelText: '再想想',
      success: async (res) => {
        if (!res.confirm) return;
        try {
          await patchServiceOrder(order.id, { action: 'confirm_paid' });
          Taro.showToast({ title: '已确认收款', icon: 'success' });
          loadServiceOrders();
        } catch (err) {
          Taro.showToast({
            title: err instanceof Error ? err.message : '确认收款失败，请稍后重试',
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

      {/* 业务类型一级 tab（下划线式） */}
      <View className={styles.bizTabBar}>
        <View
          className={`${styles.bizTab} ${bizTab === 'booking' ? styles.bizTabActive : ''}`}
          onClick={() => handleBizTab('booking')}
        >
          <Text className={styles.bizTabText}>咨询订单</Text>
          <View className={styles.bizTabLine} />
        </View>
        <View
          className={`${styles.bizTab} ${bizTab === 'service' ? styles.bizTabActive : ''}`}
          onClick={() => handleBizTab('service')}
        >
          <Text className={styles.bizTabText}>评估订单</Text>
          <View className={styles.bizTabLine} />
        </View>
      </View>

      {bizTab === 'booking' ? (
        <>
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
                  const isOfflinePay = order.status === 'pending_payment';
                  return (
                    <View
                      key={order.id}
                      className={`${styles.orderCard} ${isOfflinePay ? styles.orderCardPending : ''}`}
                      onClick={() => handleBookingCardClick(order)}
                    >
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
                      {isOfflinePay && (
                        <View className={styles.offlineHint}>
                          <Text className={styles.offlineHintText}>客户线下转账，请进入详情确认收款</Text>
                        </View>
                      )}
                      <View className={styles.orderFooter}>
                        <Text className={styles.orderPrice}>¥{order.price}</Text>
                        {canRefund(order.status) && (
                          <View
                            className={styles.refundButton}
                            onClick={(e) => { e.stopPropagation(); handleRefund(order); }}
                          >
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
        </>
      ) : (
        <>
          <ScrollView className={styles.svcPillBar} scrollX>
            {SVC_STATUS_TABS.map(tab => (
              <View
                key={tab.key}
                className={`${styles.svcPill} ${svcTab === tab.key ? styles.svcPillActive : ''}`}
                onClick={() => setSvcTab(tab.key)}
              >
                <Text className={styles.svcPillText}>{tab.label}</Text>
              </View>
            ))}
          </ScrollView>

          <ScrollView className={styles.scrollContent} scrollY>
            {filteredSvc.length === 0 ? (
              <View className={styles.empty}>
                <Text className={styles.emptyText}>{svcLoading ? '加载中…' : '暂无订单'}</Text>
              </View>
            ) : (
              <View className={styles.orderList}>
                {filteredSvc.map(order => {
                  const statusMeta = getServiceStatusMeta(order.status);
                  const isOfflinePay = order.status === 'pending_payment';
                  return (
                    <View
                      key={order.id}
                      className={`${styles.svcCard} ${isOfflinePay ? styles.svcCardPending : ''}`}
                      onClick={() => handleSvcCardClick(order)}
                    >
                      <View className={styles.orderHeader}>
                        <Text className={styles.svcName}>{order.serviceName || '评估服务'}</Text>
                        <Text
                          className={styles.orderStatus}
                          style={{ color: statusMeta.color, backgroundColor: statusMeta.bg }}
                        >
                          {statusMeta.label}
                        </Text>
                      </View>
                      <Text className={styles.svcMeta}>
                        {svcClientLabel(order)} → {svcCounselorLabel(order)} · {fmtDate(order.createdAt)}
                      </Text>
                      <View className={styles.orderFooter}>
                        {isOfflinePay && (
                          <View
                            className={styles.confirmButton}
                            onClick={(e) => { e.stopPropagation(); handleSvcConfirmPaid(order); }}
                          >
                            <Text className={styles.confirmButtonText}>确认收款</Text>
                          </View>
                        )}
                        <Text className={styles.svcPrice}>¥{order.price}</Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </ScrollView>
        </>
      )}
      <CustomTabBar />
    </View>
  );
};

export default AdminOrdersPage;
