import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import { useUserStore } from '@/stores/user';
import { fetchMyBookings } from '@/services/api';
import type { Booking } from '@/types/booking';
import CustomTabBar from '@/custom-tab-bar';

const CounselorBookingsPage: React.FC = () => {
  const { currentRole } = useUserStore();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBookings();
  }, []);

  const loadBookings = async () => {
    try {
      setLoading(true);
      const data = await fetchMyBookings();
      setBookings(data);
    } catch (err) {
      console.error('[Counselor] 加载预约失败', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusText = (status: string) => {
    const map: Record<string, string> = {
      pending_confirmation: '待确认',
      confirmed: '待咨询',
      completed: '已完成',
      cancelled: '已取消'
    };
    return map[status] || status;
  };

  const getStatusColor = (status: string) => {
    const map: Record<string, string> = {
      pending_confirmation: '#E6A23C',
      confirmed: '#7A9A6A',
      completed: '#909399',
      cancelled: '#F56C6C'
    };
    return map[status] || '#909399';
  };

  const handleConfirm = async (bookingId: string) => {
    Taro.showToast({ title: '确认预约功能开发中', icon: 'none' });
  };

  if (currentRole !== 'counselor') {
    return (
      <View className={styles.container}>
        <View className={styles.unauthorized}>
          <Text className={styles.unauthorizedText}>请切换到咨询师角色查看此页面</Text>
        </View>
      </View>
    );
  }

  return (
    <View className={styles.container}>
      <View className={styles.header}>
        <Text className={styles.title}>预约管理</Text>
      </View>
      
      <ScrollView className={styles.scrollContent} scrollY>
        {loading ? (
          <View className={styles.loading}>
            <Text className={styles.loadingText}>加载中...</Text>
          </View>
        ) : bookings.length === 0 ? (
          <View className={styles.empty}>
            <Text className={styles.emptyText}>暂无预约</Text>
          </View>
        ) : (
          <View className={styles.bookingList}>
            {bookings.map(booking => (
              <View key={booking.id} className={styles.bookingCard}>
                <View className={styles.bookingHeader}>
                  <Text className={styles.bookingStatus} style={{ color: getStatusColor(booking.status) }}>
                    {getStatusText(booking.status)}
                  </Text>
                  <Text className={styles.bookingDate}>{booking.scheduledAt}</Text>
                </View>
                <View className={styles.bookingInfo}>
                  <Text className={styles.clientName}>{booking.counselor.name}</Text>
                  <Text className={styles.sessionMode}>{booking.sessionMode}</Text>
                </View>
                <View className={styles.bookingPrice}>
                  <Text className={styles.priceText}>¥{booking.priceAmount}</Text>
                </View>
                {booking.status === 'pending_confirmation' && (
                  <View className={styles.bookingActions}>
                    <View className={styles.actionButton} onClick={() => handleConfirm(booking.id)}>
                      <Text className={styles.actionButtonText}>确认预约</Text>
                    </View>
                  </View>
                )}
              </View>
            ))}
          </View>
        )}
      </ScrollView>
      <CustomTabBar />
    </View>
  );
};

export default CounselorBookingsPage;