import React, { useState } from 'react';
import { View, Text } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import styles from './index.module.scss';
import { useUserStore } from '@/stores/user';
import { fetchAdminStats } from '@/services/api';
import type { AdminStats } from '@/services/api';
import CustomTabBar from '@/components/TabBar';
import Icon from '@/components/Icon';

/** 新接口字段全部可选：取不到时回退 0 */
const num = (v?: number): number => (typeof v === 'number' && Number.isFinite(v) ? v : 0);

/** 金额显示：¥1200 或 ¥1.2k */
function fmtAmount(v?: number): string {
  const n = num(v);
  if (n >= 10000) {
    const k = n / 1000;
    return `¥${Number.isInteger(k) ? k.toFixed(0) : k.toFixed(1)}k`;
  }
  return `¥${Math.round(n)}`;
}

const AdminDashboardPage: React.FC = () => {
  const { currentRole } = useUserStore();
  const [stats, setStats] = useState<AdminStats | null>(null);

  useDidShow(() => {
    // 统计失败时保持现状（回退 0），不阻塞页面
    fetchAdminStats()
      .then((data) => setStats(data || {}))
      .catch(() => {});
  });

  const s = stats || {};
  const newOrders = num(s.newOrders);

  const statCards = [
    {
      icon: 'calendar',
      label: '本月订单',
      value: String(num(s.monthOrders)),
      sub: `咨询 ${num(s.bkMonthOrders)} · 评估 ${num(s.svcMonthOrders)}`,
    },
    {
      icon: 'chart',
      label: '本月收入',
      value: fmtAmount(s.monthRevenue),
      sub: `咨询 ${fmtAmount(s.bkMonthRevenue)} · 评估 ${fmtAmount(s.svcMonthRevenue)}`,
    },
    {
      icon: 'clock',
      label: '待处理',
      value: String(num(s.pendingOrders)),
      sub: `咨询 ${num(s.pendingBookingOrders)} · 评估 ${num(s.pendingSvcOrders)}`,
    },
    {
      icon: 'users',
      label: '用户 / 咨询师',
      value: String(num(s.totalUsers)),
      sub: `咨询师 ${num(s.activeCounselors)} 位 · 本月新增 ${num(s.monthUsers)}`,
    },
  ];

  const quickActions = [
    { label: '审核咨询师', path: '/pages/admin-review/index', icon: 'check' },
    { label: '管理订单', path: '/pages/admin-orders/index', icon: 'list' },
    { label: '用户管理', path: '/pages/admin-users/index', icon: 'user' },
    { label: '系统设置', icon: 'settings' },
  ];

  if (currentRole !== 'admin') {
    return (
      <View className={styles.container}>
        <View className={styles.unauthorized}>
          <Text className={styles.unauthorizedText}>请切换到管理员角色查看此页面</Text>
        </View>
      </View>
    );
  }

  const handleNavigate = (path?: string) => {
    if (path) {
      Taro.navigateTo({ url: path });
    } else {
      Taro.showToast({ title: '功能开发中', icon: 'none' });
    }
  };

  // 新订单红点提示条 → 订单管理（tabBar 页需 switchTab）
  const handleNewOrdersTap = () => {
    Taro.switchTab({ url: '/pages/admin-orders/index' });
  };

  return (
    <View className={styles.container}>
      <View className={styles.header}>
        <Text className={styles.title}>管理后台</Text>
      </View>

      <View className={styles.content}>
        {newOrders > 0 && (
          <View className={styles.newOrderBar} onClick={handleNewOrdersTap}>
            <View className={styles.newOrderDot} />
            <Text className={styles.newOrderText}>有 {newOrders} 笔新订单待查看</Text>
            <Text className={styles.newOrderBadge}>{newOrders > 99 ? '99+' : newOrders}</Text>
          </View>
        )}

        <View className={styles.statsGrid}>
          {statCards.map((stat, index) => (
            <View key={index} className={styles.statCard}>
              <Icon name={stat.icon as any} size={32} color="#9CB48A" />
              <Text className={styles.statValue}>{stat.value}</Text>
              <Text className={styles.statLabel}>{stat.label}</Text>
              <Text className={styles.statSub}>{stat.sub}</Text>
            </View>
          ))}
        </View>

        <View className={styles.section}>
          <Text className={styles.sectionTitle}>快捷操作</Text>
          <View className={styles.actionGrid}>
            {quickActions.map((action, index) => {
              const isOrdersEntry = action.label === '管理订单';
              return (
                <View
                  key={index}
                  className={styles.actionCard}
                  onClick={() => handleNavigate(action.path)}
                >
                  {isOrdersEntry && newOrders > 0 && (
                    <View className={styles.actionBadge}>
                      <Text className={styles.actionBadgeText}>{newOrders > 99 ? '99+' : newOrders}</Text>
                    </View>
                  )}
                  <Icon name={action.icon as any} size={32} color="#9B8E82" />
                  <Text className={styles.actionLabel}>{action.label}</Text>
                </View>
              );
            })}
          </View>
        </View>

        <View className={styles.section}>
          <Text className={styles.sectionTitle}>最近活动</Text>
          <View className={styles.activityList}>
            <View className={styles.activityItem}>
              <Text className={styles.activityTime}>10分钟前</Text>
              <Text className={styles.activityText}>新用户注册：张三</Text>
            </View>
            <View className={styles.activityItem}>
              <Text className={styles.activityTime}>30分钟前</Text>
              <Text className={styles.activityText}>新预约提交：李四 → 王咨询师</Text>
            </View>
            <View className={styles.activityItem}>
              <Text className={styles.activityTime}>1小时前</Text>
              <Text className={styles.activityText}>咨询师申请：赵六</Text>
            </View>
            <View className={styles.activityItem}>
              <Text className={styles.activityTime}>2小时前</Text>
              <Text className={styles.activityText}>预约完成：王五 → 李咨询师</Text>
            </View>
          </View>
        </View>
      </View>
      <CustomTabBar />
    </View>
  );
};

export default AdminDashboardPage;
