import React from 'react';
import { View, Text, Image } from '@tarojs/components';
import styles from './index.module.scss';
import type { Booking } from '@/types/booking';
import { bookingStatusText } from '@/types/booking';
import { formatDateTime } from '@/utils/date';

interface BookingCardProps {
  booking: Booking;
  onClick?: (booking: Booking) => void;
}

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  pending_confirmation: { bg: '#FFF7E6', text: '#D46B08' },
  confirmed: { bg: '#F6FFED', text: '#389E0D' },
  pending_payment: { bg: '#FFF2E8', text: '#FA541C' },
  paid: { bg: '#E6FFFB', text: '#08979C' },
  completed: { bg: '#F0F0F0', text: '#595959' },
  cancelled: { bg: '#F5F5F5', text: '#8C8C8C' },
  rejected: { bg: '#FFF1F0', text: '#CF1322' }
};

const BookingCard: React.FC<BookingCardProps> = ({ booking, onClick }) => {
  const statusColor = STATUS_COLORS[booking.status] || STATUS_COLORS.pending_confirmation;

  return (
    <View className={styles.card} onClick={() => onClick?.(booking)}>
      <View className={styles.header}>
        <View className={styles.counselorInfo}>
          <View className={styles.avatarWrapper}>
            {booking.counselor.avatarUrl ? (
              <Image className={styles.avatar} src={booking.counselor.avatarUrl} mode="aspectFill" />
            ) : (
              <Text className={styles.avatarText}>{booking.counselor.name.charAt(0)}</Text>
            )}
          </View>
          <View className={styles.meta}>
            <Text className={styles.name}>{booking.counselor.name}</Text>
            <Text className={styles.mode}>{booking.sessionMode} · {booking.durationMinutes}分钟</Text>
          </View>
        </View>
        <Text
          className={styles.statusTag}
          style={{ backgroundColor: statusColor.bg, color: statusColor.text }}
        >
          {bookingStatusText[booking.status]}
        </Text>
      </View>

      <View className={styles.body}>
        <View className={styles.infoRow}>
          <Text className={styles.infoLabel}>预约时间</Text>
          <Text className={styles.infoValue}>{formatDateTime(booking.scheduledAt)}</Text>
        </View>
        <View className={styles.infoRow}>
          <Text className={styles.infoLabel}>费用</Text>
          <Text className={styles.price}>¥{booking.priceAmount}</Text>
        </View>
        {booking.clientNote && (
          <View className={styles.infoRow}>
            <Text className={styles.infoLabel}>备注</Text>
            <Text className={styles.note}>{booking.clientNote}</Text>
          </View>
        )}
      </View>
    </View>
  );
};

export default BookingCard;
