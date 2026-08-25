import React from 'react';
import { View, Text } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import { useUserStore } from '@/stores/user';
import CustomTabBar from '@/custom-tab-bar';
import Icon from '@/components/Icon';

const AdminDashboardPage: React.FC = () => {
  const { currentRole } = useUserStore();

  const stats = [
    { label: '咨询师总数', value: '12', icon: 'stethoscope' },
    { label: '预约总数', value: '156', icon: 'calendar' },
    { label: '待审核', value: '3', icon: 'clock' },
    { label: '活跃用户', value: '248', icon: 'users' },
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

  return (
    <View className={styles.container}>
      <View className={styles.header}>
        <Text className={styles.title}>管理后台</Text>
      </View>
      
      <View className={styles.content}>
        <View className={styles.statsGrid}>
          {stats.map((stat, index) => (
            <View key={index} className={styles.statCard}>
              <Icon name={stat.icon as any} size={32} color="#9CB48A" />
              <Text className={styles.statValue}>{stat.value}</Text>
              <Text className={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>
        
        <View className={styles.section}>
          <Text className={styles.sectionTitle}>快捷操作</Text>
          <View className={styles.actionGrid}>
            {quickActions.map((action, index) => (
              <View
                key={index}
                className={styles.actionCard}
                onClick={() => handleNavigate(action.path)}
              >
                <Icon name={action.icon as any} size={32} color="#9B8E82" />
                <Text className={styles.actionLabel}>{action.label}</Text>
              </View>
            ))}
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