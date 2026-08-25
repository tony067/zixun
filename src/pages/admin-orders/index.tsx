import React, { useState } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import { useUserStore } from '@/stores/user';
import CustomTabBar from '@/custom-tab-bar';

const AdminOrdersPage: React.FC = () => {
  const { currentRole } = useUserStore();
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'confirmed' | 'completed'>('all');

  const orders = [
    { id: 'ORD001', client: '张三', counselor: '王咨询师', mode: '视频咨询', date: '2024-01-15 10:00', price: 300, status: 'pending' },
    { id: 'ORD002', client: '李四', counselor: '李咨询师', mode: '面对面咨询', date: '2024-01-15 14:00', price: 400, status: 'confirmed' },
    { id: 'ORD003', client: '王五', counselor: '王咨询师', mode: '视频咨询', date: '2024-01-14 19:00', price: 300, status: 'completed' },
    { id: 'ORD004', client: '赵六', counselor: '张咨询师', mode: '语音咨询', date: '2024-01-16 11:00', price: 250, status: 'pending' },
    { id: 'ORD005', client: '钱七', counselor: '李咨询师', mode: '视频咨询', date: '2024-01-16 15:00', price: 300, status: 'confirmed' },
  ];

  const filteredOrders = activeTab === 'all' 
    ? orders 
    : orders.filter(o => o.status === activeTab);

  const getStatusText = (status: string) => {
    const map: Record<string, string> = {
      pending: '待确认',
      confirmed: '待咨询',
      completed: '已完成'
    };
    return map[status] || status;
  };

  const getStatusColor = (status: string) => {
    const map: Record<string, string> = {
      pending: '#E6A23C',
      confirmed: '#7A9A6A',
      completed: '#909399'
    };
    return map[status] || '#909399';
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
          <Text className={styles.tabText}>待咨询</Text>
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
            <Text className={styles.emptyText}>暂无订单</Text>
          </View>
        ) : (
          <View className={styles.orderList}>
            {filteredOrders.map(order => (
              <View key={order.id} className={styles.orderCard}>
                <View className={styles.orderHeader}>
                  <Text className={styles.orderId}>订单号: {order.id}</Text>
                  <Text className={styles.orderStatus} style={{ color: getStatusColor(order.status) }}>
                    {getStatusText(order.status)}
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
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
      <CustomTabBar />
    </View>
  );
};

export default AdminOrdersPage;