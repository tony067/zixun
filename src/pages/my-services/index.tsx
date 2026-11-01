import React, { useState, useEffect } from 'react';
import { View, Text } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import Icon from '@/components/Icon';
import { fetchServiceOrders } from '@/services/api';
import { getServiceStatusMeta, getServiceStatusDesc } from '@/types/service';
import type { ServiceOrder } from '@/types/service';

// 各状态对应的行动按钮文案（其余状态不显示按钮）
const ACTION_LABELS: Record<string, string> = {
  pending_payment: '去支付',
  paid: '去填写问卷',
  submitted: '查看进度',
  completed: '查看报告'
};

function formatDate(s?: string): string {
  if (!s) return '';
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return '';
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mm}-${dd}`;
}

const MyServicesPage: React.FC = () => {
  const [orders, setOrders] = useState<ServiceOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!Taro.getStorageSync('token')) {
      Taro.redirectTo({ url: '/pages/login/index' });
      return;
    }
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      setLoading(true);
      setErrorMsg('');
      const data = await fetchServiceOrders();
      setOrders(data);
    } catch (err) {
      console.error('[MyServices] 加载评估订单失败', err);
      setErrorMsg(err instanceof Error ? err.message : '加载失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const goDetail = (id: string) => {
    Taro.navigateTo({ url: `/pages/my-service-detail/index?id=${id}` });
  };

  const goServices = () => {
    Taro.navigateTo({ url: '/pages/services/index' });
  };

  return (
    <View className={styles.container}>
      {loading ? (
        <Text className={styles.stateText}>加载中...</Text>
      ) : errorMsg ? (
        <View className={styles.errorWrap}>
          <Text className={styles.stateText}>{errorMsg}</Text>
          <View className={styles.retryBtn} onClick={loadOrders}>
            <Text className={styles.retryText}>重新加载</Text>
          </View>
        </View>
      ) : orders.length === 0 ? (
        <View className={styles.empty}>
          <Icon name="list" size={48} color="#C2BDB7" />
          <Text className={styles.emptyText}>暂无评估订单</Text>
          <View className={styles.browseBtn} onClick={goServices}>
            <Text className={styles.browseText}>去逛逛服务</Text>
          </View>
        </View>
      ) : (
        orders.map((o) => {
          const meta = getServiceStatusMeta(o.status);
          const action = ACTION_LABELS[o.status] || '';
          return (
            <View key={o.id} className={styles.orderCard} onClick={() => goDetail(o.id)}>
              <View className={styles.cardTop}>
                <Text className={styles.serviceName}>{o.serviceName || '个性服务评估'}</Text>
                <View className={styles.badge} style={{ background: meta.bg }}>
                  <Text className={styles.badgeText} style={{ color: meta.color }}>
                    {meta.label}
                  </Text>
                </View>
              </View>
              <View className={styles.cardMeta}>
                <Text className={styles.date}>{formatDate(o.createdAt)}</Text>
                <Text className={styles.price}>¥{o.price}</Text>
              </View>
              <Text className={styles.statusDesc}>{getServiceStatusDesc(o.status)}</Text>
              {action ? (
                <View
                  className={styles.actionBtn}
                  onClick={(e) => {
                    e.stopPropagation();
                    goDetail(o.id);
                  }}
                >
                  <Text className={styles.actionText}>{action}</Text>
                </View>
              ) : null}
            </View>
          );
        })
      )}
    </View>
  );
};

export default MyServicesPage;
