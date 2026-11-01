import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Input, Textarea } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import { useUserStore } from '@/stores/user';
import { request, fetchMyBookings } from '@/services/api';
import { getBookingStatusMeta } from '@/types/booking';
import CustomTabBar from '@/components/TabBar';

/** 时间调剂申请（来访无可约时段时随单提交）：{ message, acceptOther } */
interface AdjustRequest {
  message?: string;
  acceptOther?: string | boolean;
}

/**
 * /api/counselor/bookings（web 同源接口）返回的咨询师视角订单。
 * 兜底走 fetchMyBookings（/api/bookings/my）时仅含 counselor 字段，
 * 两种结构在此统一映射。
 */
interface CounselorBooking {
  id: string;
  status: string;
  scheduledAt: string;
  durationMinutes: number;
  sessionMode: string;
  priceAmount: number;
  clientNote?: string | null;
  meetingLink?: string | null;
  adjustRequest?: AdjustRequest | null;
  applicationForm?: Record<string, unknown> | null;
  packageId?: string | null;
  rescheduleStatus?: string | null;
  rescheduleNewTime?: string | null;
  rescheduleReason?: string | null;
  client?: { id: string; name?: string | null; email?: string | null } | null;
  counselor?: { name?: string };
}

function mapBooking(raw: any): CounselorBooking {
  return {
    id: raw.id,
    status: raw.status,
    scheduledAt: raw.scheduledAt,
    durationMinutes: raw.durationMinutes || 50,
    sessionMode: raw.sessionMode || '视频',
    priceAmount: raw.priceAmount || 0,
    clientNote: raw.clientNote ?? '',
    meetingLink: raw.meetingLink ?? null,
    adjustRequest: raw.adjustRequest ?? null,
    applicationForm: raw.applicationForm ?? null,
    packageId: raw.packageId ?? null,
    rescheduleStatus: raw.rescheduleStatus ?? null,
    rescheduleNewTime: raw.rescheduleNewTime ?? null,
    rescheduleReason: raw.rescheduleReason ?? null,
    client: raw.client ?? null,
    counselor: raw.counselor ?? null
  };
}

const WEEKDAY_LABELS = ['日', '一', '二', '三', '四', '五', '六'];
// 与 web 确认弹窗一致的固定时段
const TIME_SLOTS = ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '19:00', '20:00'];

const fmtDate = (d: Date): string =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

/** 未来 14 天（不含今天）日期选项 */
const DAY_OPTIONS = Array.from({ length: 14 }, (_, i) => {
  const d = new Date();
  d.setDate(d.getDate() + i + 1);
  return { iso: fmtDate(d), weekday: `周${WEEKDAY_LABELS[d.getDay()]}`, label: `${d.getMonth() + 1}/${d.getDate()}` };
});

const fmtTime = (iso?: string | null): string => {
  if (!iso) return '未指定';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${d.getMonth() + 1}月${d.getDate()}日 周${WEEKDAY_LABELS[d.getDay()]} ${hh}:${mm}`;
};

const CounselorBookingsPage: React.FC = () => {
  const { currentRole } = useUserStore();
  const [bookings, setBookings] = useState<CounselorBooking[]>([]);
  const [loading, setLoading] = useState(true);

  // 拒绝弹窗
  const [rejectTarget, setRejectTarget] = useState<CounselorBooking | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [rejecting, setRejecting] = useState(false);

  // 确认预约弹窗（可改时间 / 咨询说明 / 咨询链接，与 web 一致）
  const [confirmTarget, setConfirmTarget] = useState<CounselorBooking | null>(null);
  const [cDay, setCDay] = useState('');
  const [cTime, setCTime] = useState('');
  const [cNote, setCNote] = useState('');
  const [cLink, setCLink] = useState('');
  const [confirming, setConfirming] = useState(false);
  const [confirmError, setConfirmError] = useState('');

  // 来访改期申请处理
  const [rescheduleTarget, setRescheduleTarget] = useState<CounselorBooking | null>(null);
  const [rescheduleNote, setRescheduleNote] = useState('');
  const [rescheduling, setRescheduling] = useState(false);

  useEffect(() => {
    loadBookings();
  }, []);

  const loadBookings = async () => {
    try {
      setLoading(true);
      // 与 web 一致：咨询师视角订单列表（含来访/调剂/改期字段）
      const data = await request<any[]>('/api/counselor/bookings');
      setBookings((Array.isArray(data) ? data : []).map(mapBooking));
    } catch (err) {
      console.error('[Counselor] 咨询师订单接口不可用，回退通用订单接口', err);
      try {
        const fallback = await fetchMyBookings();
        setBookings(fallback.map(mapBooking));
      } catch (err2) {
        console.error('[Counselor] 加载预约失败', err2);
        setBookings([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const toastError = (err: unknown) => {
    Taro.showToast({
      title: err instanceof Error ? err.message : '操作失败，请稍后重试',
      icon: 'none'
    });
  };

  const clientName = (b: CounselorBooking): string => {
    const af = b.applicationForm as { name?: string } | null | undefined;
    return (
      b.client?.name ||
      af?.name ||
      b.counselor?.name ||
      b.client?.email?.split('@')[0] ||
      '来访者'
    );
  };

  // —— 确认预约：确认即核销套餐/生效（→ paid），body 与 web 对齐 ——
  const openConfirm = (b: CounselorBooking) => {
    setConfirmTarget(b);
    setCDay('');
    setCTime('');
    setCNote('');
    setCLink('');
    setConfirmError('');
  };

  const submitConfirm = async () => {
    if (!confirmTarget || confirming) return;
    if (confirmTarget.adjustRequest && (!cDay || !cTime)) {
      setConfirmError('该订单为时间调剂申请，请先选择确认的咨询时间');
      return;
    }
    setConfirming(true);
    setConfirmError('');
    try {
      const data: Record<string, unknown> = { status: 'paid' };
      if (cDay && cTime) data.scheduledAt = `${cDay}T${cTime}:00`;
      if (cNote.trim()) data.counselorNote = cNote.trim();
      if (cLink.trim()) data.meetingLink = cLink.trim();
      await request(`/api/bookings/${confirmTarget.id}`, {
        // Taro.request.Option 类型要求 url 字段；request() 实际以第一个参数 path 为准
        url: `/api/bookings/${confirmTarget.id}`,
        method: 'PATCH',
        data
      });
      Taro.showToast({ title: '已确认预约', icon: 'success' });
      setConfirmTarget(null);
      loadBookings();
    } catch (err) {
      setConfirmError(err instanceof Error ? err.message : '确认失败，请稍后重试');
    } finally {
      setConfirming(false);
    }
  };

  // —— 线下转账单：确认收到转账（→ paid，服务端保留 offline 支付方式）——
  const handleConfirmPaid = (b: CounselorBooking) => {
    Taro.showModal({
      title: '确认收到转账',
      content: '确认已收到该订单的线下转账？确认后订单将变为「待咨询」。',
      confirmText: '确认收款',
      cancelText: '再想想',
      success: async (res) => {
        if (!res.confirm) return;
        try {
          await request(`/api/bookings/${b.id}`, {
            // Taro.request.Option 类型要求 url 字段；request() 实际以第一个参数 path 为准
            url: `/api/bookings/${b.id}`,
            method: 'PATCH',
            data: { status: 'paid' }
          });
          Taro.showToast({ title: '操作成功', icon: 'success' });
          loadBookings();
        } catch (err) {
          toastError(err);
        }
      }
    });
  };

  // —— 拒绝并退款（→ rejected，服务端模拟退款）——
  const submitReject = async () => {
    if (!rejectTarget || rejecting) return;
    setRejecting(true);
    try {
      await request(`/api/bookings/${rejectTarget.id}`, {
        // Taro.request.Option 类型要求 url 字段；request() 实际以第一个参数 path 为准
        url: `/api/bookings/${rejectTarget.id}`,
        method: 'PATCH',
        data: { status: 'rejected' }
      });
      Taro.showToast({ title: '已拒绝并退款', icon: 'success' });
      setRejectTarget(null);
      setRejectReason('');
      loadBookings();
    } catch (err) {
      toastError(err);
    } finally {
      setRejecting(false);
    }
  };

  // —— 退款（paid → refunded，仅未开始可退）——
  const handleRefund = (b: CounselorBooking) => {
    Taro.showModal({
      title: '退款',
      content: '确认退款吗？退款后订单将变为「已退款」，费用将退回来访（模拟支付未实际扣款）。',
      confirmText: '退款',
      cancelText: '再想想',
      success: async (res) => {
        if (!res.confirm) return;
        try {
          await request(`/api/bookings/${b.id}`, {
            // Taro.request.Option 类型要求 url 字段；request() 实际以第一个参数 path 为准
            url: `/api/bookings/${b.id}`,
            method: 'PATCH',
            data: { status: 'refunded' }
          });
          Taro.showToast({ title: '操作成功', icon: 'success' });
          loadBookings();
        } catch (err) {
          toastError(err);
        }
      }
    });
  };

  // —— 来访改期申请：同意 / 拒绝 ——
  const submitReschedule = async (action: 'approve' | 'reject') => {
    if (!rescheduleTarget || rescheduling) return;
    setRescheduling(true);
    try {
      await request(`/api/bookings/${rescheduleTarget.id}/reschedule`, {
        // Taro.request.Option 类型要求 url 字段；request() 实际以第一个参数 path 为准
        url: `/api/bookings/${rescheduleTarget.id}/reschedule`,
        method: 'PATCH',
        data: { action, note: rescheduleNote }
      });
      Taro.showToast({ title: action === 'approve' ? '已确认改期' : '已拒绝改期', icon: 'success' });
      setRescheduleTarget(null);
      setRescheduleNote('');
      loadBookings();
    } catch (err) {
      toastError(err);
    } finally {
      setRescheduling(false);
    }
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

  const needTime = !!confirmTarget?.adjustRequest;
  const canConfirm = confirming ? false : needTime ? !!(cDay && cTime) : true;

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
              const isPending = booking.status === 'pending_confirmation' || booking.status === 'pending_payment';
              const showReschedule = booking.status === 'paid' && booking.rescheduleStatus === 'pending';
              return (
                <View key={booking.id} className={styles.bookingCard}>
                  <View className={styles.bookingHeader}>
                    <Text
                      className={styles.bookingStatus}
                      style={{ color: statusMeta.color, backgroundColor: statusMeta.bg }}
                    >
                      {statusMeta.label}
                    </Text>
                    <Text className={styles.bookingDate}>
                      {fmtTime(booking.scheduledAt)} · {booking.durationMinutes}分钟
                    </Text>
                  </View>
                  <View className={styles.bookingInfo}>
                    <Text className={styles.clientName}>{clientName(booking)}</Text>
                    <Text className={styles.sessionMode}>{booking.sessionMode}</Text>
                  </View>
                  {booking.clientNote ? (
                    <Text className={styles.clientNote}>来访备注：{booking.clientNote}</Text>
                  ) : null}

                  {/* 时间调剂申请（来访已支付，确认时必须指定时间） */}
                  {booking.adjustRequest && isPending && (
                    <View className={styles.adjustBlock}>
                      <Text className={styles.adjustTitle}>时间调剂申请（来访已支付）</Text>
                      <Text className={styles.adjustText}>{booking.adjustRequest.message}</Text>
                    </View>
                  )}

                  {/* 来访改期申请提示 */}
                  {showReschedule && (
                    <View className={styles.adjustBlock}>
                      <Text className={styles.adjustTitle}>来访改期申请</Text>
                      <Text className={styles.adjustText}>
                        申请改到 {fmtTime(booking.rescheduleNewTime)}
                        {booking.rescheduleReason ? `，原因：${booking.rescheduleReason}` : ''}
                      </Text>
                    </View>
                  )}

                  <View className={styles.bookingPrice}>
                    {booking.packageId ? (
                      <Text className={styles.packageBadge}>套餐核销 · 不另收费</Text>
                    ) : (
                      <Text className={styles.priceText}>¥{booking.priceAmount}</Text>
                    )}
                  </View>

                  {(isPending || booking.status === 'paid') && (
                    <View className={styles.bookingActions}>
                      {isPending && (
                        <View
                          className={`${styles.actionButton} ${styles.refundButton}`}
                          onClick={() => {
                            setRejectTarget(booking);
                            setRejectReason('');
                          }}
                        >
                          <Text className={styles.refundButtonText}>拒绝并退款</Text>
                        </View>
                      )}
                      {isPending && booking.status === 'pending_confirmation' && (
                        <View className={styles.actionButton} onClick={() => openConfirm(booking)}>
                          <Text className={styles.actionButtonText}>确认预约</Text>
                        </View>
                      )}
                      {isPending && booking.status === 'pending_payment' && (
                        <View className={styles.actionButton} onClick={() => handleConfirmPaid(booking)}>
                          <Text className={styles.actionButtonText}>确认收到转账</Text>
                        </View>
                      )}
                      {showReschedule && (
                        <View
                          className={styles.rescheduleButton}
                          onClick={() => {
                            setRescheduleTarget(booking);
                            setRescheduleNote('');
                          }}
                        >
                          <Text className={styles.rescheduleButtonText}>改期申请</Text>
                        </View>
                      )}
                      {booking.status === 'paid' && (
                        <View
                          className={`${styles.actionButton} ${styles.refundButton}`}
                          onClick={() => handleRefund(booking)}
                        >
                          <Text className={styles.refundButtonText}>退款</Text>
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

      {/* 确认预约弹窗：可改时间 + 咨询说明 + 咨询链接（调剂申请必须选时间） */}
      {confirmTarget && (
        <View className={styles.sheetMask}>
          <View className={styles.sheet}>
            <View className={styles.sheetHeader}>
              <Text className={styles.sheetTitle}>确认预约</Text>
              <View className={styles.sheetClose} onClick={() => !confirming && setConfirmTarget(null)}>
                <Text className={styles.sheetCloseText}>×</Text>
              </View>
            </View>

            <View className={styles.summaryCard}>
              <View className={styles.summaryRow}>
                <Text className={styles.summaryLabel}>来访者</Text>
                <Text className={styles.summaryValue}>{clientName(confirmTarget)}</Text>
              </View>
              <View className={styles.summaryRow}>
                <Text className={styles.summaryLabel}>费用（已支付）</Text>
                <Text className={styles.summaryValue}>¥{confirmTarget.priceAmount}</Text>
              </View>
              {confirmTarget.adjustRequest ? (
                <View className={styles.summaryAdjust}>
                  <Text className={styles.adjustTitle}>时间调剂申请</Text>
                  <Text className={styles.adjustText}>{confirmTarget.adjustRequest.message}</Text>
                  <Text className={styles.adjustHint}>需在下方为本次咨询指定时间</Text>
                </View>
              ) : (
                <View className={styles.summaryRow}>
                  <Text className={styles.summaryLabel}>预约时间</Text>
                  <Text className={styles.summaryValue}>{fmtTime(confirmTarget.scheduledAt)}</Text>
                </View>
              )}
            </View>

            <Text className={styles.sheetLabel}>
              咨询时间{needTime ? '（必选）' : '（不选则按预约时间）'}
            </Text>
            <ScrollView className={styles.dayStrip} scrollX>
              {DAY_OPTIONS.map(d => (
                <View
                  key={d.iso}
                  className={`${styles.dayItem} ${cDay === d.iso ? styles.dayActive : ''}`}
                  onClick={() => {
                    setCDay(d.iso);
                    setCTime('');
                  }}
                >
                  <Text className={styles.dayWeek}>{d.weekday}</Text>
                  <Text className={styles.dayLabel}>{d.label}</Text>
                </View>
              ))}
            </ScrollView>
            {cDay ? (
              <View className={styles.timeGrid}>
                {TIME_SLOTS.map(t => (
                  <View
                    key={t}
                    className={`${styles.timeSlot} ${cTime === t ? styles.timeSlotActive : ''}`}
                    onClick={() => setCTime(t)}
                  >
                    <Text className={styles.timeSlotText}>{t}</Text>
                  </View>
                ))}
              </View>
            ) : null}

            <Text className={styles.sheetLabel}>告知来访者咨询设置</Text>
            <Textarea
              className={styles.sheetTextarea}
              value={cNote}
              onInput={e => setCNote(e.detail.value)}
              placeholder='例如：咨询将使用腾讯会议，请提前 5 分钟进入…'
            />
            <Text className={styles.sheetLabel}>咨询链接（选填）</Text>
            <Input
              className={styles.sheetInput}
              value={cLink}
              onInput={e => setCLink(e.detail.value)}
              placeholder='https://meeting.tencent.com/...'
            />

            {confirmError ? <Text className={styles.sheetError}>{confirmError}</Text> : null}

            <View
              className={`${styles.primaryButton} ${canConfirm ? '' : styles.buttonDisabled}`}
              onClick={canConfirm ? submitConfirm : undefined}
            >
              <Text className={styles.primaryButtonText}>
                {confirming ? '确认中…' : '确认预约并通知来访者'}
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* 拒绝并退款弹窗：填写拒绝原因 */}
      {rejectTarget && (
        <View className={styles.sheetMask}>
          <View className={styles.sheet}>
            <View className={styles.sheetHeader}>
              <Text className={styles.sheetTitle}>拒绝并退款</Text>
              <View className={styles.sheetClose} onClick={() => !rejecting && setRejectTarget(null)}>
                <Text className={styles.sheetCloseText}>×</Text>
              </View>
            </View>
            <Text className={styles.sheetHint}>
              拒绝后订单将变为「已拒绝」，费用将退回来访（模拟支付未实际扣款）。
            </Text>
            <Text className={styles.sheetLabel}>拒绝原因（选填）</Text>
            <Textarea
              className={styles.sheetTextarea}
              value={rejectReason}
              onInput={e => setRejectReason(e.detail.value)}
              placeholder='请填写拒绝原因，便于来访者了解情况…'
            />
            <View className={styles.sheetActions}>
              <View
                className={`${styles.ghostButton} ${rejecting ? styles.buttonDisabled : ''}`}
                onClick={() => !rejecting && setRejectTarget(null)}
              >
                <Text className={styles.ghostButtonText}>取消</Text>
              </View>
              <View
                className={`${styles.dangerButton} ${rejecting ? styles.buttonDisabled : ''}`}
                onClick={rejecting ? undefined : submitReject}
              >
                <Text className={styles.primaryButtonText}>{rejecting ? '提交中…' : '拒绝并退款'}</Text>
              </View>
            </View>
          </View>
        </View>
      )}

      {/* 来访改期申请处理弹窗 */}
      {rescheduleTarget && (
        <View className={styles.sheetMask}>
          <View className={styles.sheet}>
            <View className={styles.sheetHeader}>
              <Text className={styles.sheetTitle}>来访改期申请</Text>
              <View className={styles.sheetClose} onClick={() => !rescheduling && setRescheduleTarget(null)}>
                <Text className={styles.sheetCloseText}>×</Text>
              </View>
            </View>
            <View className={styles.summaryCard}>
              <Text className={styles.summaryLabel}>申请改到</Text>
              <Text className={styles.summaryValue}>{fmtTime(rescheduleTarget.rescheduleNewTime)}</Text>
              {rescheduleTarget.rescheduleReason ? (
                <Text className={styles.adjustText}>原因：{rescheduleTarget.rescheduleReason}</Text>
              ) : null}
            </View>
            <Text className={styles.sheetLabel}>回复（可选）</Text>
            <Textarea
              className={styles.sheetTextarea}
              value={rescheduleNote}
              onInput={e => setRescheduleNote(e.detail.value)}
              placeholder='可附上确认说明或说明无法接受的原因…'
            />
            <View className={styles.sheetActions}>
              <View
                className={`${styles.dangerPlainButton} ${rescheduling ? styles.buttonDisabled : ''}`}
                onClick={rescheduling ? undefined : () => submitReschedule('reject')}
              >
                <Text className={styles.dangerPlainText}>拒绝改期</Text>
              </View>
              <View
                className={`${styles.primaryButton} ${rescheduling ? styles.buttonDisabled : ''}`}
                onClick={rescheduling ? undefined : () => submitReschedule('approve')}
              >
                <Text className={styles.primaryButtonText}>确认改期</Text>
              </View>
            </View>
          </View>
        </View>
      )}

      <CustomTabBar />
    </View>
  );
};

export default CounselorBookingsPage;
