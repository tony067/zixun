import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import BookingCard from '@/components/BookingCard';
import { fetchMyBookings, updateBookingStatus, fetchUserPackages } from '@/services/api';
import type { Booking, BookingStatus } from '@/types/booking';
import type { ConsultationPackage } from '@/types/service';
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
  // 咨询套餐（仅展示 active）
  const [packages, setPackages] = useState<ConsultationPackage[]>([]);
  const [packagesExpanded, setPackagesExpanded] = useState(true);

  useEffect(() => {
    loadBookings();
    loadPackages();
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

  const loadPackages = async () => {
    try {
      const data = await fetchUserPackages();
      setPackages((data || []).filter(p => p.status === 'active'));
    } catch (err) {
      console.error('[Bookings] 加载套餐失败', err);
    }
  };

  // 用套餐发起核销预约
  const handleUsePackage = (pkg: ConsultationPackage) => {
    Taro.navigateTo({
      url: `/pages/booking-flow/index?id=${pkg.counselorId}&package=${pkg.id}`,
    });
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
        {packages.length > 0 && (
          <View className={styles.packageSection}>
            <View
              className={styles.packageHeader}
              onClick={() => setPackagesExpanded(!packagesExpanded)}
            >
              <Text className={styles.packageTitle}>咨询套餐</Text>
              <Text className={styles.packageCount}>{packages.length} 个可用</Text>
              <Icon
                name={packagesExpanded ? 'chevronDown' : 'chevronRight'}
                size={16}
                color="#9B8E82"
              />
            </View>
            {packagesExpanded && packages.map(pkg => {
              const remaining = pkg.totalSessions - pkg.usedSessions;
              const exhausted = remaining <= 0;
              return (
                <View key={pkg.id} className={styles.packageCard}>
                  <View className={styles.packageInfo}>
                    <Text className={styles.packageName}>{pkg.planName}</Text>
                    <Text className={styles.packageCounselor}>{pkg.counselorName || '咨询师'}</Text>
                    <Text className={styles.packageUsage}>已用 {pkg.usedSessions}/{pkg.totalSessions} 次</Text>
                  </View>
                  <View className={styles.packageRight}>
                    <Text className={`${styles.packageBadge} ${exhausted ? styles.packageBadgeDone : ''}`}>
                      {exhausted ? '已用完' : `剩 ${remaining} 次`}
                    </Text>
                    <View
                      className={`${styles.packageUseButton} ${exhausted ? styles.packageUseButtonDisabled : ''}`}
                      onClick={() => !exhausted && handleUsePackage(pkg)}
                    >
                      <Text className={styles.packageUseButtonText}>去预约</Text>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        )}

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
