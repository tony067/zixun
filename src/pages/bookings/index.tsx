import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import BookingCard from '@/components/BookingCard';
import { fetchMyBookings, updateBookingStatus } from '@/services/api';
import type { Booking, BookingStatus } from '@/types/booking';
import Icon from '@/components/Icon';

const tabs: { key: BookingStatus | 'all'; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'pending_confirmation', label: '待确认' },
  { key: 'paid', label: '待咨询' },
  { key: 'completed', label: '已完成' }
];

// 来访端可取消的订单状态（不可退款）
const CANCELLABLE_STATUSES: BookingStatus[] = ['pending_confirmation', 'pending_payment', 'paid'];

const BookingsPage: React.FC = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [activeTab, setActiveTab] = useState<BookingStatus | 'all'>('all');
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
      console.error('[Bookings] 加载预约失败', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredBookings = activeTab === 'all'
    ? bookings
    : bookings.filter(b => b.status === activeTab);

  // 取消预约：二次确认后 status → cancelled，失败时 toast 服务端 message
  const handleCancel = (booking: Booking) => {
    Taro.showModal({
      title: '取消预约',
      content: '确定要取消这条预约吗？',
      confirmText: '取消预约',
      cancelText: '再想想',
      success: async (res) => {
        if (!res.confirm) return;
        try {
          await updateBookingStatus(booking.id, 'cancelled');
          Taro.showToast({ title: '已取消预约', icon: 'success' });
          loadBookings();
        } catch (err) {
          Taro.showToast({
            title: err instanceof Error ? err.message : '取消失败，请稍后重试',
            icon: 'none'
          });
        }
      }
    });
  };

  return (
    <View className={styles.container}>
      <View className={styles.header}>
        <View className={styles.backButton} onClick={() => Taro.navigateBack()}>
          <Text className={styles.backIcon}>‹</Text>
        </View>
        <Text className={styles.title}>我的预约</Text>
      </View>

      <View className={styles.tabs}>
        {tabs.map(tab => (
          <View
            key={tab.key}
            className={`${styles.tab} ${activeTab === tab.key ? styles.tabActive : ''}`}
            onClick={() => setActiveTab(tab.key)}
          >
            <Text className={styles.tabText}>{tab.label}</Text>
          </View>
        ))}
      </View>

      <ScrollView scrollY className={styles.listContainer}>
        {loading ? (
          <Text style={{ textAlign: 'center', paddingTop: '80rpx', color: '#9B8E82' }}>加载中...</Text>
        ) : filteredBookings.length > 0 ? (
          filteredBookings.map(booking => (
            <View key={booking.id}>
              <BookingCard booking={booking} />
              {CANCELLABLE_STATUSES.includes(booking.status) && (
                <View className={styles.cancelButton} onClick={() => handleCancel(booking)}>
                  <Text className={styles.cancelButtonText}>取消预约</Text>
                </View>
              )}
            </View>
          ))
        ) : (
          <View className={styles.empty}>
            <Icon name="calendar" size={48} color="#C2BDB7" />
            <Text className={styles.emptyText}>暂无{activeTab === 'all' ? '' : tabs.find(t => t.key === activeTab)?.label}预约</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

export default BookingsPage;
