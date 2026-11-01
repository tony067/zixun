import React, { useState, useEffect } from 'react';
import { View, Text, Image } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import styles from './index.module.scss';
import Icon from '@/components/Icon';
import { request, resolveAssetUrl } from '@/services/api';
import { getBookingStatusMeta } from '@/types/booking';

/**
 * 预约详情（对齐 web 版 src/app/my-bookings/[id]/page.tsx）
 * api.ts 的 fetchBookingDetail 会 normalize 丢掉 applicationForm/meetingLink 等字段，
 * 因此这里直接用 request 拿 GET /api/bookings/[id] 的完整原始返回。
 */
interface BookingDetail {
  id: string;
  status: string;
  scheduledAt: string;
  durationMinutes: number;
  sessionMode: string;
  priceAmount: number;
  sessionNumber?: number;
  packageId?: string | null;
  applicationForm?: Record<string, unknown> | null;
  agreementSigned?: boolean;
  createdAt?: string;
  paidAt?: string;
  paymentMethod?: string;
  clientNote?: string;
  counselorNote?: string;
  meetingLink?: string;
  adjustRequest?: { message?: string; acceptOther?: string } | null;
  counselor: {
    id: string;
    displayName: string;
    avatarUrl?: string | null;
    counselorTypes?: string[];
  } | null;
}

// 与 web 版 STATUS_DESC 一致的详情页长描述
const STATUS_DESC: Record<string, string> = {
  pending_confirmation: '已支付成功。咨询师确认后会通知您，并在此页发送咨询设置与链接。',
  pending_payment: '请在24小时内完成支付，逾期将自动取消。',
  paid: '咨询师已确认。请在咨询时间前查看咨询设置与链接，准时参加。',
  in_progress: '咨询正在进行，请通过咨询链接进入。',
  completed: '本次咨询已完成。如已约定下次咨询时间，请记得续约。',
  cancelled: '本次预约已取消，已支付费用将原路退回（模拟支付未实际扣款）。',
  rejected: '咨询师未能承接本次预约，费用已原路退回（模拟支付未实际扣款）。',
  refunded: '本次订单已退款，费用将原路退回（模拟支付未实际扣款）。如有疑问请联系客服。'
};

const AGREEMENT_TEXT = `MindPace 咨询服务协议

一、服务说明
本平台提供神经多样性友好的心理咨询服务，咨询师均经联盟认证。

二、保密原则
咨询内容严格保密，以下情况除外：
1. 来访者有伤害自己或他人的危险；
2. 法律要求披露。

三、取消与改期政策
• 咨询开始前24小时可免费取消或改期；
• 24小时内取消将扣除50%费用；
• 未出席将扣除全部费用。

四、来访者权利与责任
来访者有权了解咨询方法，有责任如实告知个人情况，并遵守预约时间。

五、紧急情况
如遇紧急心理危机，请拨打心理援助热线 400-161-9995。

本协议由来访者在首次预约时确认签署，签署后视为同意以上条款。`;

const FIELD_LABELS: Record<string, string> = {
  name: '真实姓名',
  phone: '手机号',
  wechat: '微信号',
  purposes: '咨询目的',
  purposeOther: '其他目的',
  additionalNote: '补充说明',
  emergencyName: '紧急联系人姓名',
  emergencyPhone: '紧急联系人电话',
  background: '背景说明',
  hasMentalDisease: '有精神科诊断',
  onMedication: '正在服药',
  hasSelfHarm: '三个月内有自伤行为',
  hasSuicidalThought: '三个月内有自杀想法',
  hasSuicidalBehavior: '三个月内有自杀行为',
  consentSigned: '已签署咨询协议'
};

const PAY_METHODS = [
  { id: 'wechat', label: '微信支付', color: '#07C160' },
  { id: 'alipay', label: '支付宝', color: '#1677FF' }
];

const pad = (n: number) => String(n).padStart(2, '0');

const formatDateTime = (iso?: string): string => {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const modeIcon = (mode: string): 'video' | 'phone' | 'headphones' => {
  if (mode?.includes('视频')) return 'video';
  if (mode?.includes('语音') || mode?.includes('电话')) return 'phone';
  return 'headphones';
};

type ModalType = 'form' | 'agreement' | 'pay' | null;

const BookingDetailPage: React.FC = () => {
  const router = useRouter();
  const id = router.params.id || '';

  const [bk, setBk] = useState<BookingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<ModalType>(null);
  const [payMethod, setPayMethod] = useState('wechat');
  const [paying, setPaying] = useState(false);

  const loadDetail = () => {
    if (!id) {
      setLoading(false);
      return;
    }
    request<BookingDetail>(`/api/bookings/${id}`)
      .then((data) => setBk(data))
      .catch((err) => {
        console.error('[BookingDetail] 加载预约详情失败', err);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadDetail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const copyText = (text: string) => {
    Taro.setClipboardData({ data: text });
  };

  // 待支付 → 已支付（模拟支付，web 版同款 PATCH：{status:'paid', paymentMethod}）
  const handlePay = () => {
    if (paying) return;
    setPaying(true);
    request<any>(`/api/bookings/${id}`, {
      // Taro.request.Option 类型要求 url 字段；request() 实际以第一个参数 path 为准
      url: `/api/bookings/${id}`,
      method: 'PATCH',
      data: { status: 'paid', paymentMethod: payMethod }
    })
      .then(() => {
        setModal(null);
        Taro.showToast({ title: '支付成功', icon: 'success' });
        loadDetail();
      })
      .catch((err) => {
        Taro.showToast({
          title: err instanceof Error ? err.message : '支付失败，请稍后重试',
          icon: 'none'
        });
      })
      .finally(() => setPaying(false));
  };

  const handleCancel = () => {
    Taro.showModal({
      title: '取消预约',
      content: '确定取消这条预约吗？已支付费用将原路退回（模拟支付未实际扣款）。',
      confirmText: '取消预约',
      cancelText: '再想想',
      success: async (res) => {
        if (!res.confirm) return;
        try {
          await request<any>(`/api/bookings/${id}`, {
            url: `/api/bookings/${id}`,
            method: 'PATCH',
            data: { status: 'cancelled' }
          });
          Taro.showToast({ title: '已取消预约', icon: 'success' });
          loadDetail();
        } catch (err) {
          Taro.showToast({
            title: err instanceof Error ? err.message : '取消失败，请稍后重试',
            icon: 'none'
          });
        }
      }
    });
  };

  const goReschedule = () => {
    Taro.navigateTo({ url: `/pages/booking-reschedule/index?id=${id}` });
  };

  if (loading) {
    return (
      <View className={styles.container}>
        <Text className={styles.loadingText}>加载中...</Text>
      </View>
    );
  }

  if (!bk) {
    return (
      <View className={styles.container}>
        <View className={styles.empty}>
          <Icon name="calendar" size={48} color="#C2BDB7" />
          <Text className={styles.emptyText}>订单不存在或加载失败</Text>
        </View>
      </View>
    );
  }

  const statusMeta = getBookingStatusMeta(bk.status);
  const statusDesc = STATUS_DESC[bk.status] || '';
  const counselor = bk.counselor;
  const avatarUrl = resolveAssetUrl(counselor?.avatarUrl);

  const dt = bk.scheduledAt ? new Date(bk.scheduledAt) : null;
  const endDt = dt && bk.durationMinutes ? new Date(dt.getTime() + bk.durationMinutes * 60000) : null;
  const scheduleLabel = dt
    ? `${formatDateTime(bk.scheduledAt)}${endDt ? `–${pad(endDt.getHours())}:${pad(endDt.getMinutes())}` : ''}`
    : '—';

  // 套餐核销子预约：packageId 存在即套餐单
  const isPackage = !!bk.packageId;
  const packageBadgeText = bk.sessionNumber ? `套餐核销 · 第 ${bk.sessionNumber} 次` : '套餐预约';

  const showMeetingLink = !!bk.meetingLink && ['paid', 'in_progress'].includes(bk.status);
  const formEntries = Object.entries(bk.applicationForm || {}).filter(
    ([, v]) => v !== null && v !== undefined && v !== ''
  );

  const canReschedule = ['pending_confirmation', 'pending_payment', 'paid'].includes(bk.status);

  return (
    <View className={styles.container}>
      {/* 状态卡 */}
      <View className={styles.card}>
        <View className={styles.statusRow}>
          <Text
            className={styles.statusBadge}
            style={{ backgroundColor: statusMeta.bg, color: statusMeta.color }}
          >
            {statusMeta.label}
          </Text>
          {isPackage && <Text className={styles.packageBadge}>{packageBadgeText}</Text>}
        </View>
        {statusDesc && <Text className={styles.statusDesc}>{statusDesc}</Text>}
        <View className={styles.divider} />
        <View className={styles.infoRow}>
          <View className={styles.infoLabelWrap}>
            <Icon name="calendar" size={14} color="#9B8E82" />
            <Text className={styles.infoLabel}>预约时间</Text>
          </View>
          <Text className={styles.infoValue}>{scheduleLabel}</Text>
        </View>
        <View className={styles.infoRow}>
          <View className={styles.infoLabelWrap}>
            <Icon name={modeIcon(bk.sessionMode)} size={14} color="#9B8E82" />
            <Text className={styles.infoLabel}>咨询方式</Text>
          </View>
          <Text className={styles.infoValue}>
            {bk.sessionMode || '视频'} · {bk.durationMinutes || 50} 分钟
          </Text>
        </View>
      </View>

      {/* 咨询师卡 */}
      <View className={styles.card}>
        <View
          className={styles.counselorRow}
          onClick={() =>
            counselor?.id && Taro.navigateTo({ url: `/pages/counselor-detail/index?id=${counselor.id}` })
          }
        >
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
          <Icon name="chevronRight" size={16} color="#C4BDB5" />
        </View>

        <View className={styles.divider} />

        {bk.adjustRequest?.message ? (
          <View className={styles.sectionBlock}>
            <Text className={styles.infoLabel}>时间调剂申请</Text>
            <Text className={styles.noteText}>{bk.adjustRequest.message}</Text>
            <Text className={styles.hintText}>最终时间以咨询师确认为准，确认后将在此页通知您</Text>
          </View>
        ) : (
          <View className={styles.sectionBlock}>
            <Text className={styles.infoLabel}>咨询次数及方式</Text>
            <Text className={styles.infoValue}>
              第 {bk.sessionNumber || 1} 次 · {bk.sessionMode || '视频'}咨询
            </Text>
          </View>
        )}

        {bk.counselorNote && (
          <View className={styles.sectionBlock}>
            <Text className={styles.infoLabel}>咨询设置说明</Text>
            <Text className={styles.noteText}>{bk.counselorNote}</Text>
          </View>
        )}

        {bk.sessionMode?.includes('视频') && !showMeetingLink && (
          <View className={styles.sectionBlock}>
            <Text className={styles.infoLabel}>视频账号</Text>
            <Text className={styles.noteText}>
              {['paid', 'in_progress'].includes(bk.status)
                ? '咨询师将通过私信发送咨询设置与链接，请注意查收消息'
                : '咨询师确认后可见'}
            </Text>
          </View>
        )}
      </View>

      {/* 咨询链接（paid/in_progress 且咨询师已发链接） */}
      {showMeetingLink && (
        <View className={styles.meetingCard}>
          <Text className={styles.meetingTitle}>咨询链接</Text>
          <Text className={styles.meetingLink}>{bk.meetingLink}</Text>
          <View className={styles.meetingActions}>
            <View className={styles.meetingCopyBtn} onClick={() => copyText(bk.meetingLink!)}>
              <Text className={styles.meetingCopyText}>复制链接</Text>
            </View>
          </View>
        </View>
      )}

      {/* 申请单 / 协议入口 */}
      <View className={styles.card}>
        {formEntries.length > 0 && (
          <View className={styles.entryRow} onClick={() => setModal('form')}>
            <Text className={styles.entryText}>我的申请单</Text>
            <Icon name="chevronRight" size={16} color="#C4BDB5" />
          </View>
        )}
        <View className={styles.entryRow} onClick={() => setModal('agreement')}>
          <Text className={styles.entryText}>我的咨询协议</Text>
          {bk.agreementSigned ? (
            <View className={styles.signedBadge}>
              <Icon name="check" size={12} color="#3A6228" />
              <Text className={styles.signedText}>已签署知情同意</Text>
            </View>
          ) : (
            <Text className={styles.unsignedText}>未签署</Text>
          )}
          <Icon name="chevronRight" size={16} color="#C4BDB5" />
        </View>
      </View>

      {/* 订单信息 */}
      <View className={styles.card}>
        <View className={styles.orderRow}>
          <Text className={styles.orderLabel}>咨询费用</Text>
          <Text className={styles.orderPrice}>¥{bk.priceAmount}</Text>
        </View>
        <View className={styles.orderRow}>
          <Text className={styles.orderLabel}>订单编号</Text>
          <View className={styles.orderNoWrap}>
            <Text className={styles.orderNo}>{bk.id.toUpperCase()}</Text>
            <View className={styles.copyBtn} onClick={() => copyText(bk.id.toUpperCase())}>
              <Text className={styles.copyText}>复制</Text>
            </View>
          </View>
        </View>
        <View className={styles.orderRow}>
          <Text className={styles.orderLabel}>创建时间</Text>
          <Text className={styles.orderValue}>{formatDateTime(bk.createdAt)}</Text>
        </View>
        <View className={styles.orderRow}>
          <Text className={styles.orderLabel}>付款时间</Text>
          <Text className={styles.orderValue}>{bk.paidAt ? formatDateTime(bk.paidAt) : '未支付'}</Text>
        </View>
        <View className={styles.orderRow}>
          <Text className={styles.orderLabel}>支付方式</Text>
          <Text className={styles.orderValue}>{bk.paymentMethod || '—'}</Text>
        </View>
      </View>

      {/* 底部操作条（cancelled/rejected/refunded 等只读态不渲染） */}
      {bk.status === 'pending_payment' && (
        <View className={styles.bottomBar}>
          <View className={styles.bottomBtnGhost} onClick={handleCancel}>
            <Text className={styles.bottomBtnGhostText}>取消订单</Text>
          </View>
          {canReschedule && (
            <View className={styles.bottomBtnGhost} onClick={goReschedule}>
              <Text className={styles.bottomBtnGhostText}>申请改期</Text>
            </View>
          )}
          <View className={styles.bottomBtnPrimary} onClick={() => setModal('pay')}>
            <Text className={styles.bottomBtnPrimaryText}>立即支付 ¥{bk.priceAmount}</Text>
          </View>
        </View>
      )}
      {bk.status === 'pending_confirmation' && (
        <View className={styles.bottomBar}>
          <View className={styles.bottomBtnGhost} onClick={goReschedule}>
            <Text className={styles.bottomBtnGhostText}>申请改期</Text>
          </View>
          <View className={styles.bottomBtnDanger} onClick={handleCancel}>
            <Text className={styles.bottomBtnDangerText}>取消预约</Text>
          </View>
        </View>
      )}
      {bk.status === 'paid' && (
        <View className={styles.bottomBar}>
          <View className={styles.bottomBtnPrimary} onClick={goReschedule}>
            <Text className={styles.bottomBtnPrimaryText}>申请改期</Text>
          </View>
        </View>
      )}
      {bk.status === 'completed' && counselor?.id && (
        <View className={styles.bottomBar}>
          <View
            className={styles.bottomBtnPrimary}
            onClick={() => Taro.navigateTo({ url: `/pages/booking-flow/index?id=${counselor.id}` })}
          >
            <Text className={styles.bottomBtnPrimaryText}>再次预约</Text>
          </View>
        </View>
      )}

      {/* 底部弹层：我的申请单 */}
      {modal === 'form' && (
        <View className={styles.modalMask} onClick={() => setModal(null)}>
          <View className={styles.modalBody} onClick={(e) => e.stopPropagation()}>
            <View className={styles.modalHeader}>
              <Text className={styles.modalTitle}>我的申请单</Text>
              <View className={styles.modalClose} onClick={() => setModal(null)}>
                <Icon name="close" size={16} color="#9B8E82" />
              </View>
            </View>
            <View className={styles.modalContent}>
              {formEntries.length > 0 ? (
                formEntries.map(([key, value]) => {
                  const text = Array.isArray(value)
                    ? value.join('、')
                    : typeof value === 'boolean'
                      ? value
                        ? '是'
                        : '否'
                      : String(value);
                  return (
                    <View key={key} className={styles.formRow}>
                      <Text className={styles.formLabel}>{FIELD_LABELS[key] || key}</Text>
                      <Text className={styles.formValue}>{text}</Text>
                    </View>
                  );
                })
              ) : (
                <Text className={styles.modalEmpty}>暂无申请单信息</Text>
              )}
            </View>
          </View>
        </View>
      )}

      {/* 底部弹层：咨询协议 */}
      {modal === 'agreement' && (
        <View className={styles.modalMask} onClick={() => setModal(null)}>
          <View className={styles.modalBody} onClick={(e) => e.stopPropagation()}>
            <View className={styles.modalHeader}>
              <Text className={styles.modalTitle}>咨询服务协议</Text>
              <View className={styles.modalClose} onClick={() => setModal(null)}>
                <Icon name="close" size={16} color="#9B8E82" />
              </View>
            </View>
            <View className={styles.modalContent}>
              <Text className={styles.agreementText}>{AGREEMENT_TEXT}</Text>
              <View className={styles.agreementFooter}>
                <Text className={bk.agreementSigned ? styles.agreementSigned : styles.agreementUnsigned}>
                  {bk.agreementSigned ? '已于预约时签署同意' : '未签署'}
                </Text>
              </View>
            </View>
          </View>
        </View>
      )}

      {/* 底部弹层：模拟支付（对齐 web：PATCH {status:'paid', paymentMethod}） */}
      {modal === 'pay' && (
        <View className={styles.modalMask} onClick={() => !paying && setModal(null)}>
          <View className={styles.modalBody} onClick={(e) => e.stopPropagation()}>
            <View className={styles.modalHeader}>
              <Text className={styles.modalTitle}>确认支付</Text>
              <View className={styles.modalClose} onClick={() => !paying && setModal(null)}>
                <Icon name="close" size={16} color="#9B8E82" />
              </View>
            </View>
            <View className={styles.modalContent}>
              <View className={styles.payAmountCard}>
                <Text className={styles.payAmountLabel}>咨询费用</Text>
                <Text className={styles.payAmount}>¥{bk.priceAmount}</Text>
                <Text className={styles.payAmountHint}>
                  {counselor?.displayName || '咨询师'}
                  {bk.scheduledAt ? ` · ${formatDateTime(bk.scheduledAt)}` : ''}
                </Text>
              </View>
              <View className={styles.payMethodList}>
                {PAY_METHODS.map((m) => (
                  <View
                    key={m.id}
                    className={styles.payMethodItem}
                    style={{ borderColor: payMethod === m.id ? m.color : '#EBE7DF' }}
                    onClick={() => setPayMethod(m.id)}
                  >
                    <View className={styles.payMethodLeft}>
                      <View className={styles.payMethodDot} style={{ backgroundColor: m.color }} />
                      <Text className={styles.payMethodLabel}>{m.label}</Text>
                    </View>
                    {payMethod === m.id && <Icon name="check" size={16} color={m.color} />}
                  </View>
                ))}
              </View>
              <View
                className={`${styles.bottomBtnPrimary} ${styles.payConfirmBtn} ${paying ? styles.btnDisabled : ''}`}
                onClick={handlePay}
              >
                <Text className={styles.bottomBtnPrimaryText}>{paying ? '支付中…' : `确认支付 ¥${bk.priceAmount}`}</Text>
              </View>
              <Text className={styles.payNote}>小程序端为模拟支付，正式支付能力将在后续版本提供</Text>
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

export default BookingDetailPage;
