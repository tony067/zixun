import React, { useState, useEffect } from 'react';
import { View, Text, Image, Textarea, ScrollView } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import styles from './index.module.scss';
import Icon from '@/components/Icon';
import { request, resolveAssetUrl, fetchAvailableSlots } from '@/services/api';
import type { AvailableDay } from '@/types/counselor';

/**
 * 申请改期（对齐 web 版 src/app/my-bookings/[id]/reschedule/page.tsx）
 * 提交接口：POST /api/bookings/[id]/reschedule，body { newTime: "YYYY-MM-DDTHH:mm:ss", reason }
 * 档期来源：GET /api/counselors/[id]/available-slots（fetchAvailableSlots 已封装）
 */
interface RescheduleBooking {
  status: string;
  scheduledAt: string;
  durationMinutes?: number;
  sessionMode: string;
  sessionNumber?: number;
  counselor: {
    id: string;
    displayName: string;
    avatarUrl?: string | null;
    counselorTypes?: string[];
  } | null;
}

const pad = (n: number) => String(n).padStart(2, '0');

const formatSchedule = (iso?: string): string => {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const BookingReschedulePage: React.FC = () => {
  const router = useRouter();
  const id = router.params.id || '';

  const [booking, setBooking] = useState<RescheduleBooking | null>(null);
  const [days, setDays] = useState<AvailableDay[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(true);
  const [selDay, setSelDay] = useState('');
  const [selTime, setSelTime] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!id) return;
    // 当前预约信息（含 counselor.id，用于拉档期）
    request<RescheduleBooking>(`/api/bookings/${id}`)
      .then((data) => {
        setBooking(data);
        const counselorId = data?.counselor?.id;
        if (counselorId) {
          return fetchAvailableSlots(counselorId).then((list) => {
            setDays(list.filter((d) => d.starts && d.starts.length > 0));
          });
        }
        return undefined;
      })
      .catch((err) => {
        console.error('[Reschedule] 加载预约/档期失败', err);
      })
      .finally(() => setSlotsLoading(false));
  }, [id]);

  const selectedDay = days.find((d) => d.date === selDay);
  const selectedLabel = selectedDay && selTime ? `${selectedDay.weekday} ${selectedDay.label} ${selTime}` : '';
  const canSubmit = !!(selDay && selTime && reason.trim()) && !submitting;

  const handleSubmit = () => {
    if (!canSubmit) return;
    Taro.showModal({
      title: '申请改期',
      content: '改期申请将通知咨询师确认，确认前原时间暂不释放。确定提交吗？',
      confirmText: '提交申请',
      cancelText: '再想想',
      success: async (res) => {
        if (!res.confirm) return;
        setSubmitting(true);
        try {
          // 与 web 版一致：newTime 为本地时间字符串 "YYYY-MM-DDTHH:mm:ss"
          await request<{ ok: boolean }>(`/api/bookings/${id}/reschedule`, {
            url: `/api/bookings/${id}/reschedule`,
            method: 'POST',
            data: { newTime: `${selDay}T${selTime}:00`, reason: reason.trim() }
          });
          Taro.showToast({ title: '改期申请已提交', icon: 'success' });
          setTimeout(() => Taro.navigateBack(), 1200);
        } catch (err) {
          Taro.showToast({
            title: err instanceof Error ? err.message : '提交失败，请稍后重试',
            icon: 'none'
          });
          setSubmitting(false);
        }
      }
    });
  };

  const counselor = booking?.counselor;
  const avatarUrl = resolveAssetUrl(counselor?.avatarUrl);

  return (
    <View className={styles.container}>
      {/* 当前预约卡 */}
      {booking && (
        <View className={styles.card}>
          <View className={styles.counselorRow}>
            <View className={styles.avatar}>
              {avatarUrl ? (
                <Image className={styles.avatarImg} src={avatarUrl} mode="aspectFill" />
              ) : (
                <Text className={styles.avatarText}>{counselor?.displayName?.charAt(0) || '?'}</Text>
              )}
            </View>
            <View className={styles.counselorMeta}>
              <Text className={styles.counselorType}>{counselor?.counselorTypes?.[0] || '心理咨询师'}</Text>
              <Text className={styles.counselorName}>{counselor?.displayName || '咨询师'}</Text>
            </View>
          </View>
          <View className={styles.divider} />
          <View className={styles.infoRow}>
            <Text className={styles.infoLabel}>当前咨询时间</Text>
            <Text className={styles.infoValue}>{formatSchedule(booking.scheduledAt)}</Text>
          </View>
          <View className={styles.infoRow}>
            <Text className={styles.infoLabel}>咨询次数及方式</Text>
            <Text className={styles.infoValue}>
              第 {booking.sessionNumber || 1} 次 · {booking.sessionMode || '视频'}咨询
            </Text>
          </View>
        </View>
      )}

      {/* 温馨提示 */}
      <View className={styles.tipCard}>
        <Text className={styles.tipTitle}>申请改期前，请先和咨询师沟通好时间</Text>
        <Text className={styles.tipText}>
          建议在私信中与咨询师确认好新时间后，再提交申请。改期申请提交后，需等待咨询师确认，原时间暂不释放。
        </Text>
      </View>

      {/* 选择新时间 */}
      <View className={styles.card}>
        <View className={styles.sectionHeader}>
          <Text className={styles.sectionTitle}>
            希望改到的时间 <Text className={styles.required}>*</Text>
          </Text>
          {selectedLabel && <Text className={styles.selectedLabel}>{selectedLabel}</Text>}
        </View>

        {slotsLoading ? (
          <Text className={styles.slotsLoading}>档期加载中...</Text>
        ) : days.length === 0 ? (
          <Text className={styles.slotsLoading}>暂无可约档期，请联系咨询师或稍后再试</Text>
        ) : (
          <>
            <Text className={styles.pickLabel}>选择日期</Text>
            <ScrollView scrollX className={styles.dayScroll} showScrollbar={false} enhanced>
              <View className={styles.dayList}>
                {days.map((d) => (
                  <View
                    key={d.date}
                    className={`${styles.dayPill} ${selDay === d.date ? styles.dayPillActive : ''}`}
                    onClick={() => {
                      setSelDay(d.date);
                      setSelTime('');
                    }}
                  >
                    <Text className={`${styles.dayWeekday} ${selDay === d.date ? styles.dayTextActive : ''}`}>
                      {d.weekday}
                    </Text>
                    <Text className={`${styles.dayLabel} ${selDay === d.date ? styles.dayTextActive : ''}`}>
                      {d.label}
                    </Text>
                  </View>
                ))}
              </View>
            </ScrollView>

            {selectedDay && (
              <>
                <Text className={styles.pickLabel}>选择时段</Text>
                <View className={styles.slotGrid}>
                  {selectedDay.starts.map((t) => (
                    <View
                      key={t}
                      className={`${styles.slotItem} ${selTime === t ? styles.slotItemActive : ''}`}
                      onClick={() => setSelTime(t)}
                    >
                      <Text className={`${styles.slotText} ${selTime === t ? styles.slotTextActive : ''}`}>{t}</Text>
                    </View>
                  ))}
                </View>
              </>
            )}
          </>
        )}
      </View>

      {/* 改期原因 */}
      <View className={styles.card}>
        <Text className={styles.sectionTitle}>
          改期原因 <Text className={styles.required}>*</Text>
        </Text>
        <View className={styles.textareaWrap}>
          <Textarea
            className={styles.textarea}
            value={reason}
            onInput={(e) => setReason(e.detail.value)}
            placeholder='请填写改期原因（如"临时有事，需要调整"）'
            placeholderClass={styles.textareaPlaceholder}
            maxlength={200}
          />
          <Text className={styles.textareaCount}>{reason.length}/200</Text>
        </View>
      </View>

      {/* 提交 */}
      <View className={styles.footerHint}>
        <Icon name="clock" size={12} color="#9B8E82" />
        <Text className={styles.footerHintText}>咨询师确认后，订单时间将自动更新；若咨询师拒绝，原时间保持不变</Text>
      </View>
      <View
        className={`${styles.submitBtn} ${canSubmit ? '' : styles.submitBtnDisabled}`}
        onClick={handleSubmit}
      >
        <Text className={styles.submitBtnText}>{submitting ? '发送中…' : '发送改期申请'}</Text>
      </View>
    </View>
  );
};

export default BookingReschedulePage;
