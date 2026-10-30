import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import { useUserStore } from '@/stores/user';
import { fetchMyBookings, updateBookingStatus } from '@/services/api';
import { getBookingStatusMeta } from '@/types/booking';
import type { Booking, BookingStatus } from '@/types/booking';
import CustomTabBar from '@/components/TabBar';

// 退款按钮文案与目标状态：待确认单 → 拒绝并退款(rejected)；待支付/待咨询单 → 退款(refunded)；
// 其余状态（已开始/已结束）咨询师不可退款
const getRefundAction = (status: BookingStatus): { label: string; target: string } | null => {
  if (status === 'pending_confirmation') return { label: '拒绝并退款', target: 'rejected' };
  if (status === 'pending_payment' || status === 'paid') return { label: '退款', target: 'refunded' };
  return null;
};

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

  const handleConfirm = async (bookingId: string) => {
    Taro.showToast({ title: '确认预约功能开发中', icon: 'none' });
  };

  // 退款 / 拒绝并退款：二次确认后变更状态，失败时 toast 服务端 message（含 409 非法流转）
  const handleRefund = (booking: Booking) => {
    const action = getRefundAction(booking.status);
    if (!action) return;
    const content = action.target === 'rejected'
      ? '确定拒绝该预约并退款吗？订单将变为「已拒绝」，费用将退回来访（模拟支付未实际扣款）。'
      : '确认退款吗？退款后订单将变为「已退款」，费用将退回来访（模拟支付未实际扣款）。';
    Taro.showModal({
      title: action.label,
      content,
      confirmText: action.label,
      cancelText: '再想想',
      success: async (res) => {
        if (!res.confirm) return;
        try {
          await updateBookingStatus(booking.id, action.target);
          Taro.showToast({ title: '操作成功', icon: 'success' });
          loadBookings();
        } catch (err) {
          Taro.showToast({
            title: err instanceof Error ? err.message : '操作失败，请稍后重试',
            icon: 'none'
          });
        }
      }
    });
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
            {bookings.map(booking => {
              const statusMeta = getBookingStatusMeta(booking.status);
              const refundAction = getRefundAction(booking.status);
              return (
                <View key={booking.id} className={styles.bookingCard}>
                  <View className={styles.bookingHeader}>
                    <Text
                      className={styles.bookingStatus}
                      style={{ color: statusMeta.color, backgroundColor: statusMeta.bg }}
                    >
                      {statusMeta.label}
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
                  {(booking.status === 'pending_confirmation' || refundAction) && (
                    <View className={styles.bookingActions}>
                      {booking.status === 'pending_confirmation' && (
                        <View className={styles.actionButton} onClick={() => handleConfirm(booking.id)}>
                          <Text className={styles.actionButtonText}>确认预约</Text>
                        </View>
                      )}
                      {refundAction && (
                        <View
                          className={`${styles.actionButton} ${styles.refundButton}`}
                          onClick={() => handleRefund(booking)}
                        >
                          <Text className={styles.refundButtonText}>{refundAction.label}</Text>
                        </View>
                      )}
                    </View>
                  )}
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

export default CounselorBookingsPage;