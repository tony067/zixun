import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import styles from './index.module.scss';
import BookingCard from '@/components/BookingCard';
import { fetchMyBookings } from '@/services/api';
import type { Booking, BookingStatus } from '@/types/booking';

const tabs: { key: BookingStatus | 'all'; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'confirmed', label: '待咨询' },
  { key: 'pending_confirmation', label: '待确认' },
  { key: 'completed', label: '已完成' }
];

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

  return (
    <View className={styles.container}>
      <View className={styles.header}>
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
            <BookingCard key={booking.id} booking={booking} />
          ))
        ) : (
          <View className={styles.empty}>
            <Text className={styles.emptyIcon}>📅</Text>
            <Text className={styles.emptyText}>暂无{activeTab === 'all' ? '' : tabs.find(t => t.key === activeTab)?.label}预约</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

export default BookingsPage;
