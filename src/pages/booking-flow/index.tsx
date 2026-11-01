import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Textarea, Button, Input } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import styles from './index.module.scss';
import {
  fetchCounselorDetail,
  fetchAvailableSlots,
  createBooking,
  fetchUserPackages,
  fetchBookingDetail,
} from '@/services/api';
import type { Counselor, TimeSlot, ApplicationForm, AvailableDay } from '@/types/counselor';
import { buildTimeSlots, EMPTY_FORM, PURPOSE_OPTIONS } from '@/types/counselor';
import type { ConsultationPackage } from '@/types/service';
import Icon from '@/components/Icon';

type Step = 0 | 1 | 2;

type PaymentMethod = 'wechat' | 'alipay' | 'card' | 'offline';

const PAYMENT_METHODS: { value: PaymentMethod; label: string; desc: string }[] = [
  { value: 'wechat', label: '微信支付', desc: '推荐，即时完成支付' },
  { value: 'alipay', label: '支付宝', desc: '跳转支付宝完成付款' },
  { value: 'card', label: '银行卡支付', desc: '使用银行卡快捷支付' },
  { value: 'offline', label: '线下转账', desc: '联系客服转账，确认收款后预约生效' },
];

const MODE_MAP: Record<string, { label: string; icon: string }> = {
  '视频': { label: '视频咨询', icon: 'video' },
  '视频咨询': { label: '视频咨询', icon: 'video' },
  '语音': { label: '面对面咨询', icon: 'phone' },
  '语音咨询': { label: '面对面咨询', icon: 'phone' },
  '面谈': { label: '面对面咨询', icon: 'phone' },
  '面对面咨询': { label: '面对面咨询', icon: 'phone' },
  '面对面': { label: '面对面咨询', icon: 'phone' },
};

const AGREE_LINES = [
  'MindPace 用户服务协议',
  '',
  '欢迎使用 MindPace 心理咨询平台。在您提交预约前，请仔细阅读以下条款。提交预约即表示您已阅读、理解并同意本协议的全部内容。',
  '',
  '一、平台服务说明',
  'MindPace 作为第三方心理咨询预约平台，负责为用户提供咨询师匹配、预约管理及订单处理服务。平台对入驻咨询师进行资质审核，但咨询服务由咨询师本人独立提供，平台不对具体咨询过程及效果作出保证。',
  '',
  '二、用户信息保护',
  '您填写的个人信息（包括姓名、手机号、咨询目的等）仅用于本次预约及相关服务，平台将依据适用法律法规妥善保管，未经您同意不会向第三方披露。以下情况除外：您主动同意公开；存在伤害自身或他人的紧迫危险；法律法规要求强制披露。',
  '',
  '三、预约与取消政策',
  '预约提交后须在咨询师确认前完成取消操作，否则视为有效预约。确认后如需取消或改期，请至少提前 24 小时通知，24 小时内取消可能不予退款。具体退款规则以平台当时公示的政策为准。',
  '',
  '四、费用与支付',
  '咨询费用以预约时页面展示为准。平台负责收款，咨询完成后按约定比例结算给咨询师。',
  '',
  '五、紧急情况声明',
  '本平台提供的心理咨询服务不属于危机干预或紧急医疗服务。若您或他人处于紧急危险中，请立即拨打 110、120 或心理援助热线 400-161-9995。',
  '',
  '六、免责声明',
  '因不可抗力、咨询师个人原因或用户自身原因导致的咨询中断或效果不达预期，平台不承担连带责任，但将协助用户进行合理维权。',
  '',
  '七、协议修改',
  '平台保留在法律允许范围内修改本协议的权利，修改后将在平台显著位置公示。继续使用平台服务视为接受修改后的协议。',
];

const BookingFlowPage: React.FC = () => {
  const router = useRouter();
  const [counselor, setCounselor] = useState<Counselor | null>(null);
  const [step, setStep] = useState<Step>(0);
  const [selectedPricing, setSelectedPricing] = useState(0);

  const [selectedMode, setSelectedMode] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [availableDays, setAvailableDays] = useState<AvailableDay[]>([]);
  const [showCoordinate, setShowCoordinate] = useState(false);
  const [coordMsg, setCoordMsg] = useState('');
  const [coordAccept, setCoordAccept] = useState<string | null>(null);
  const [coordSent, setCoordSent] = useState(false);

  const [form, setForm] = useState<ApplicationForm>(EMPTY_FORM);
  const [agreed, setAgreed] = useState(false);
  const [showAgreement, setShowAgreement] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // 套餐核销模式：?package=<pkgId> 时生效
  const [redeemPkg, setRedeemPkg] = useState<ConsultationPackage | null>(null);
  const [reusedForm, setReusedForm] = useState<Record<string, unknown> | null>(null);
  const [reusedAgreement, setReusedAgreement] = useState(false);
  // 支付方式（普通/套餐购买流程用，核销模式不走支付）
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('wechat');

  useEffect(() => {
    const { id, package: packageId } = router.params || {};
    if (id) {
      if (packageId) {
        // 套餐核销：校验套餐可用（active 且有剩余次数且属于当前咨询师），失败则返回上一页
        fetchUserPackages()
          .then(pkgs => {
            const pkg = pkgs.find(p => p.id === packageId);
            if (
              !pkg ||
              pkg.status !== 'active' ||
              pkg.usedSessions >= pkg.totalSessions ||
              pkg.counselorId !== id
            ) {
              Taro.showToast({ title: '套餐不可用', icon: 'none' });
              setTimeout(() => Taro.navigateBack(), 1500);
              return;
            }
            setRedeemPkg(pkg);
            setStep(1); // 核销模式跳过定价选择，直接从选时间开始
            // 复用套餐购买单的预约表单与协议勾选（宽松取原始字段，缺失则不传）
            fetchBookingDetail(pkg.orderId)
              .then(detail => {
                const raw = detail as unknown as {
                  applicationForm?: Record<string, unknown>;
                  agreementSigned?: boolean;
                } | null;
                if (raw?.applicationForm) setReusedForm(raw.applicationForm);
                if (raw?.agreementSigned) setReusedAgreement(true);
              })
              .catch(err => {
                console.error('[BookingFlow] 加载套餐购买单失败', err);
              });
          })
          .catch(err => {
            console.error('[BookingFlow] 套餐校验失败', err);
            Taro.showToast({ title: '套餐不可用', icon: 'none' });
            setTimeout(() => Taro.navigateBack(), 1500);
          });
      }

      fetchCounselorDetail(id).then(data => {
        setCounselor(data);
        if (data.sessionModes.length > 0) {
          setSelectedMode(data.sessionModes[0]);
        } else {
          setSelectedMode('视频咨询');
        }
        if (!data.pricingOptions || data.pricingOptions.length === 0) {
          setStep(1);
        }
      }).catch(err => {
        console.error('[BookingFlow] 加载咨询师失败', err);
      });

      fetchAvailableSlots(id).then(days => {
        setAvailableDays(days);
        const firstWithSlots = days.find(d => d.starts.length > 0);
        setSelectedDay((firstWithSlots || days[0])?.date ?? null);
      }).catch(err => {
        console.error('[BookingFlow] 加载可预约时段失败', err);
      });
    }
  }, [router.params]);

  const hasPricingOptions = counselor?.pricingOptions && counselor.pricingOptions.length > 0;
  const currentPricing = hasPricingOptions ? counselor?.pricingOptions?.[selectedPricing] : null;
  const durationMinutes = currentPricing?.duration ?? counselor?.sessionDuration ?? 50;
  const priceAmount = currentPricing?.price ?? counselor?.pricePerSession ?? 0;

  // 套餐核销模式：跳过定价/表单/支付
  const isRedeem = !!redeemPkg;
  // 套餐购买模式：选中 sessions>1 的方案，跳过选时间直接进表单
  const isPackagePurchase = !isRedeem && !!currentPricing && currentPricing.sessions > 1;

  const selectedDayObj = availableDays.find(d => d.date === selectedDay) || null;
  const daySlots = buildTimeSlots(selectedDay || '', selectedDayObj?.starts ?? [], durationMinutes);
  const morning = daySlots.filter(s => s.period === 'morning');
  const afternoon = daySlots.filter(s => s.period === 'afternoon');
  const evening = daySlots.filter(s => s.period === 'evening');

  const canNext = selectedMode && selectedSlot;

  const setFormField = <K extends keyof ApplicationForm>(k: K, v: ApplicationForm[K]) => {
    setForm(prev => ({ ...prev, [k]: v }));
  };

  const handleSubmitStep2 = async () => {
    setErrorMsg('');
    if (!form.name.trim()) {
      setErrorMsg('请填写真实姓名');
      return;
    }
    if (!form.phone.trim()) {
      setErrorMsg('请填写手机号');
      return;
    }
    if (form.purposes.length === 0) {
      setErrorMsg('请至少选择一项咨询目的');
      return;
    }
    if (!agreed) {
      setErrorMsg('请阅读并勾选《MindPace 用户服务协议》');
      return;
    }
    if (!counselor) {
      setErrorMsg('信息加载中，请稍后重试');
      return;
    }
    // 套餐购买不选时间；普通预约必须先选时间
    if (!isPackagePurchase && (!selectedSlot || !selectedDay)) {
      setErrorMsg('请先选择咨询时间');
      return;
    }

    setSubmitting(true);
    try {
      const isOffline = paymentMethod === 'offline';
      let scheduledIso: string | undefined;
      if (selectedSlot && selectedDay) {
        const [h, m] = selectedSlot.start.split(':').map(Number);
        const scheduled = new Date(`${selectedDay}T00:00:00`);
        scheduled.setHours(h, m, 0, 0);
        scheduledIso = scheduled.toISOString();
      }

      await createBooking({
        counselorId: counselor.id,
        // 套餐购买不传 scheduledAt，由服务端 +30 天占位，购买后逐次预约
        ...(isPackagePurchase ? {} : { scheduledAt: scheduledIso }),
        ...(isPackagePurchase ? {} : { sessionMode: selectedMode || undefined }),
        clientNote: [
          `姓名：${form.name}`,
          `手机号：${form.phone}`,
          form.wechat ? `微信号：${form.wechat}` : '',
          `咨询目的：${form.purposes.join('、')}${form.purposeOther ? `（${form.purposeOther}）` : ''}`,
          form.additionalNote ? `补充说明：${form.additionalNote}` : '',
        ].filter(Boolean).join('；'),
        ...(currentPricing?.id ? { pricingOptionId: currentPricing.id } : {}),
        durationMinutes,
        priceAmount,
        sessionNumber: currentPricing?.sessions ?? 1,
        // 线下转账：不做模拟支付，status 由服务端置 pending_payment
        ...(isOffline ? { offline: true, paymentMethod: 'offline' } : {}),
      });

      let toastTitle = '预约申请已提交';
      if (isPackagePurchase) {
        toastTitle = isOffline
          ? '订单已提交！客服确认收款后套餐即生效'
          : `购买成功！你的 ${currentPricing?.sessions ?? 1} 次套餐已生效，可在「我的预约」页使用套餐发起预约`;
      } else if (isOffline) {
        toastTitle = '订单已提交！请联系客服完成转账，客服确认后预约生效';
      }
      if (isPackagePurchase || isOffline) {
        Taro.showToast({ title: toastTitle, icon: 'none', duration: 3000 });
      } else {
        Taro.showToast({ title: toastTitle, icon: 'success' });
      }
      setTimeout(() => {
        Taro.navigateTo({ url: '/pages/bookings/index' });
      }, isPackagePurchase || isOffline ? 2000 : 1200);
    } catch (err) {
      console.error('[BookingFlow] 提交预约失败', err);
      setErrorMsg(err instanceof Error && err.message ? err.message : '提交失败，请稍后重试');
    } finally {
      setSubmitting(false);
    }
  };

  // 套餐核销提交：0 元下单，咨询师确认时扣次；跳过表单与支付
  const handleSubmitRedeem = async () => {
    if (!redeemPkg || !counselor || !selectedSlot || !selectedDay || submitting) return;

    setSubmitting(true);
    try {
      const [h, m] = selectedSlot.start.split(':').map(Number);
      const scheduled = new Date(`${selectedDay}T00:00:00`);
      scheduled.setHours(h, m, 0, 0);

      await createBooking({
        counselorId: counselor.id,
        scheduledAt: scheduled.toISOString(),
        sessionMode: selectedMode || undefined,
        durationMinutes,
        priceAmount: 0,
        sessionNumber: 1,
        ...(currentPricing?.id ? { pricingOptionId: currentPricing.id } : {}),
        paymentMethod: 'package',
        packageId: redeemPkg.id,
        ...(reusedForm ? { applicationForm: reusedForm } : {}),
        ...(reusedAgreement ? { agreementSigned: true } : {}),
      });

      Taro.showToast({
        title: '已提交预约！将由咨询师确认时扣除套餐次数',
        icon: 'none',
        duration: 3000,
      });
      setTimeout(() => {
        Taro.navigateTo({ url: '/pages/bookings/index' });
      }, 2000);
    } catch (err) {
      console.error('[BookingFlow] 套餐核销提交失败', err);
      Taro.showToast({
        title: err instanceof Error && err.message ? err.message : '提交失败，请稍后重试',
        icon: 'none',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const renderStep0 = () => {
    if (!counselor?.pricingOptions || counselor.pricingOptions.length === 0) {
      return null;
    }

    return (
      <View className={styles.step0}>
        <View className={styles.section}>
          <Text className={styles.sectionTitle}>选择咨询方案</Text>
          <Text className={styles.sectionSubtitle}>请选择您想要预约的咨询类型</Text>
          <View className={styles.pricingList}>
            {counselor.pricingOptions.map((opt, idx) => {
              const displayName = opt.name === '__custom__'
                ? (opt.customName || `方案 ${idx + 1}`)
                : (opt.name || `方案 ${idx + 1}`);
              const active = selectedPricing === idx;
              return (
                <View
                  key={opt.id}
                  className={`${styles.pricingItem} ${active ? styles.pricingActive : ''}`}
                  onClick={() => setSelectedPricing(idx)}
                >
                  <View className={styles.pricingHeader}>
                    <Text className={styles.pricingName}>{displayName}</Text>
                    <Text className={styles.pricingPrice}>¥{opt.price}</Text>
                  </View>
                  <View className={styles.pricingDetails}>
                    <Text className={styles.pricingDetail}>{opt.duration} 分钟</Text>
                    <Text className={styles.pricingDetail}>× {opt.sessions} 次</Text>
                    {opt.sessions > 1 && (
                      <Text className={styles.pricingAverage}>约 ¥{Math.round(opt.price / opt.sessions)}/次</Text>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        <View className={styles.bottomBar}>
          <Button
            className={styles.nextButton}
            onClick={() => setStep(isPackagePurchase ? 2 : 1)}
          >
            下一步
          </Button>
        </View>
      </View>
    );
  };

  const renderStep1 = () => (
    <View className={styles.step1}>
      <View className={styles.section}>
        <View className={styles.sectionCard}>
            <Text className={styles.sectionTitle}>选择咨询方式</Text>
            <View className={styles.modeList}>
              {(counselor?.sessionModes && counselor.sessionModes.length > 0 ? counselor.sessionModes : ['视频咨询']).map(m => {
                const info = MODE_MAP[m] || { label: m, icon: 'video' };
                const active = selectedMode === m;
                return (
                  <View
                    key={m}
                    className={`${styles.modeItem} ${active ? styles.modeActive : ''}`}
                    onClick={() => setSelectedMode(m)}
                  >
                    <Icon name={info.icon as any} size={24} color={active ? '#9CB48A' : '#9B8E82'} />
                    <Text className={styles.modeLabel}>{info.label}</Text>
                  </View>
                );
              })}
            </View>
            {counselor?.sessionModes && counselor.sessionModes.length > 0 && (
              <Text className={styles.modeHint}>
                该咨询师支持：{counselor.sessionModes.map(m => (MODE_MAP[m] || { label: m }).label).join('、')}
              </Text>
            )}
          </View>
      </View>

      <View className={styles.section}>
        <View className={styles.sectionCard}>
          <Text className={styles.sectionTitle}>选择时间</Text>
          <Text className={styles.sectionSubtitle}>
            最早可约24小时后 · 每次 {durationMinutes} 分钟
          </Text>
          <View className={styles.dateList}>
            {availableDays.map(d => {
              const hasFree = d.starts.length > 0;
              const active = d.date === selectedDay;
              return (
                <View
                  key={d.date}
                  className={`${styles.dateItem} ${active ? styles.dateActive : ''} ${!hasFree ? styles.dateDisabled : ''}`}
                  onClick={() => { setSelectedDay(d.date); setSelectedSlot(null); }}
                >
                  <Text className={styles.dateWeek}>{d.weekday}</Text>
                  <Text className={styles.dateDay}>{d.label}</Text>
                </View>
              );
            })}
          </View>
        </View>
      </View>

      <View className={styles.section}>
        <View className={styles.sectionCard}>
          {morning.length > 0 && (
            <View className={styles.slotGroup}>
              <Text className={styles.slotGroupLabel}>上午</Text>
              <View className={styles.slotList}>
                {morning.map(s => {
                  const active = selectedSlot?.id === s.id;
                  const booked = !s.available;
                  return (
                    <View
                      key={s.id}
                      className={`${styles.slotItem} ${active ? styles.slotActive : ''} ${booked ? styles.slotBooked : ''}`}
                      onClick={() => !booked && setSelectedSlot(s)}
                    >
                      <Text className={styles.slotText}>{s.start}–{s.end}</Text>
                    </View>
                  );
                })}
              </View>
            </View>
          )}

          {afternoon.length > 0 && (
            <View className={styles.slotGroup}>
              <Text className={styles.slotGroupLabel}>下午</Text>
              <View className={styles.slotList}>
                {afternoon.map(s => {
                  const active = selectedSlot?.id === s.id;
                  const booked = !s.available;
                  return (
                    <View
                      key={s.id}
                      className={`${styles.slotItem} ${active ? styles.slotActive : ''} ${booked ? styles.slotBooked : ''}`}
                      onClick={() => !booked && setSelectedSlot(s)}
                    >
                      <Text className={styles.slotText}>{s.start}–{s.end}</Text>
                    </View>
                  );
                })}
              </View>
            </View>
          )}

          {evening.length > 0 && (
            <View className={styles.slotGroup}>
              <Text className={styles.slotGroupLabel}>晚间</Text>
              <View className={styles.slotList}>
                {evening.map(s => {
                  const active = selectedSlot?.id === s.id;
                  const booked = !s.available;
                  return (
                    <View
                      key={s.id}
                      className={`${styles.slotItem} ${active ? styles.slotActive : ''} ${booked ? styles.slotBooked : ''}`}
                      onClick={() => !booked && setSelectedSlot(s)}
                    >
                      <Text className={styles.slotText}>{s.start}–{s.end}</Text>
                    </View>
                  );
                })}
              </View>
            </View>
          )}
        </View>
      </View>

      <View className={styles.section}>
        <View className={styles.coordButton} onClick={() => setShowCoordinate(!showCoordinate)}>
          <Text className={styles.coordIcon}>🕐</Text>
          <Text className={styles.coordText}>与咨询师协调时间</Text>
          <Text className={`${styles.coordArrow} ${showCoordinate ? styles.coordArrowUp : ''}`}>›</Text>
        </View>

        {showCoordinate && (
          <View className={styles.coordPanel}>
            {coordSent ? (
              <View className={styles.coordSent}>
                <Text className={styles.coordSentTitle}>✓ 已发送给咨询师</Text>
                <Text className={styles.coordSentDesc}>咨询师确认后会通过消息通知你</Text>
              </View>
            ) : (
              <>
                <Text className={styles.coordLabel}>你方便的时间 <Text className={styles.required}>*</Text></Text>
                <Text className={styles.coordHint}>建议申请48小时之后的时间，咨询师更可能接受</Text>
                <Textarea
                  className={styles.coordTextarea}
                  placeholder="例如：\n周一至周三 下午 14:00–18:00\n周六全天均可\n请尽量提供 2-3 个备选时间"
                  placeholderClass={styles.placeholder}
                  value={coordMsg}
                  onInput={e => setCoordMsg(e.detail.value)}
                />
                <Text className={styles.coordLabel}>如果上述时间已满，是否接受咨询师提供的其他时间？<Text className={styles.required}>*</Text></Text>
                <View className={styles.coordOptionList}>
                  <View
                    className={`${styles.coordOption} ${coordAccept === '是' ? styles.coordOptionActive : ''}`}
                    onClick={() => setCoordAccept('是')}
                  >
                    <Text className={styles.coordOptionText}>是</Text>
                  </View>
                  <View
                    className={`${styles.coordOption} ${coordAccept === '否' ? styles.coordOptionActive : ''}`}
                    onClick={() => setCoordAccept('否')}
                  >
                    <Text className={styles.coordOptionText}>否</Text>
                  </View>
                </View>
                <Button
                  className={`${styles.coordSubmit} ${!coordMsg.trim() ? styles.buttonDisabled : ''}`}
                  onClick={() => setCoordSent(true)}
                >
                  发送给咨询师
                </Button>
              </>
            )}
          </View>
        )}
      </View>

      <View className={styles.bottomBar}>
        <View className={styles.bottomBarStep1}>
          {selectedSlot && (
            <Text className={styles.selectedInfo}>
              已选：{selectedDayObj?.label} {selectedSlot.start}–{selectedSlot.end}
            </Text>
          )}
          <Button
            className={`${styles.nextButton} ${!canNext || (isRedeem && submitting) ? styles.buttonDisabled : ''}`}
            onClick={() => {
              if (!canNext) return;
              if (isRedeem) {
                handleSubmitRedeem();
              } else {
                setStep(2);
              }
            }}
          >
            {isRedeem ? '提交预约' : '下一步：填写预约信息'}
          </Button>
        </View>
      </View>
    </View>
  );

  const renderStep2 = () => {
    const dateStr = isPackagePurchase
      ? `${currentPricing?.sessions ?? 1} 次套餐 · 购买后逐次预约`
      : selectedDayObj
        ? `${selectedDayObj.label.replace('/', '月')}日 ${selectedDayObj.weekday} ${selectedSlot?.start}–${selectedSlot?.end}`
        : '';

    return (
      <View className={styles.step2}>
        <View className={styles.summaryCard}>
            <Text className={styles.summaryLabel}>预约摘要</Text>
            <Text className={styles.summaryName}>{counselor?.displayName}</Text>
            <Text className={styles.summaryInfo}>{selectedMode} · {durationMinutes} 分钟 · ￥{priceAmount}</Text>
            <Text className={styles.summaryInfo}>{dateStr}</Text>
          </View>

        <View className={styles.section}>
          <View className={styles.formCard}>
            <View className={styles.formRow}>
              <Text className={styles.formLabel}>真实姓名 <Text className={styles.required}>*</Text></Text>
              <Input
                className={styles.formInput}
                placeholder="请填写真实姓名（非昵称）"
                placeholderClass={styles.placeholder}
                value={form.name}
                onInput={e => setFormField('name', e.detail.value)}
              />
            </View>
            <View className={styles.formRow}>
              <Text className={styles.formLabel}>手机号 <Text className={styles.required}>*</Text></Text>
              <Input
                className={styles.formInput}
                placeholder="必填"
                placeholderClass={styles.placeholder}
                type="tel"
                value={form.phone}
                onInput={e => setFormField('phone', e.detail.value)}
              />
            </View>
            <View className={styles.formRow}>
              <Text className={styles.formLabel}>微信号 <Text className={styles.formOptional}>选填</Text></Text>
              <Input
                className={styles.formInput}
                placeholder="选填"
                placeholderClass={styles.placeholder}
                value={form.wechat || ''}
                onInput={e => setFormField('wechat', e.detail.value)}
              />
            </View>
          </View>
        </View>

        <View className={styles.section}>
          <View className={styles.formCard}>
            <Text className={styles.formCardTitle}>咨询目的 <Text className={styles.required}>*</Text></Text>
            <View className={styles.purposeList}>
              {PURPOSE_OPTIONS.map(opt => {
                const selected = form.purposes.includes(opt);
                return (
                  <View
                    key={opt}
                    className={`${styles.purposeItem} ${selected ? styles.purposeActive : ''}`}
                    onClick={() => {
                      const next = selected ? form.purposes.filter(p => p !== opt) : [...form.purposes, opt];
                      setFormField('purposes', next);
                    }}
                  >
                    <Text className={styles.purposeText}>{opt}</Text>
                  </View>
                );
              })}
            </View>
            {form.purposes.includes('其他') && (
              <Input
                className={styles.purposeOtherInput}
                placeholder="请简单描述（选填）"
                placeholderClass={styles.placeholder}
                value={form.purposeOther || ''}
                onInput={e => setFormField('purposeOther', e.detail.value)}
              />
            )}
          </View>
        </View>

        <View className={styles.section}>
          <View className={styles.formCard}>
            <Text className={styles.formCardSubtitle}>紧急联系人</Text>
            <View className={styles.formRow}>
              <Text className={styles.formLabel}>姓名</Text>
              <Input
                className={styles.formInput}
                placeholder="紧急联系人姓名"
                placeholderClass={styles.placeholder}
                value={form.emergencyName || ''}
                onInput={e => setFormField('emergencyName', e.detail.value)}
              />
            </View>
            <View className={styles.formRow}>
              <Text className={styles.formLabel}>电话</Text>
              <Input
                className={styles.formInput}
                placeholder="手机号码"
                placeholderClass={styles.placeholder}
                type="tel"
                value={form.emergencyPhone || ''}
                onInput={e => setFormField('emergencyPhone', e.detail.value)}
              />
            </View>
          </View>
        </View>

        <View className={styles.section}>
          <View className={styles.formCard}>
            <Text className={styles.formCardSubtitle}>安全评估（帮助咨询师提前了解您的状况）</Text>
            <View className={styles.safetyRow}>
              <Text className={styles.safetyLabel}>是否有精神类疾病诊断</Text>
              <View className={styles.safetyOptions}>
                <View
                  className={`${styles.safetyOption} ${form.hasMentalDisease === false ? styles.safetyOptionActive : ''}`}
                  onClick={() => setFormField('hasMentalDisease', false)}
                >
                  <View className={`${styles.safetyDot} ${form.hasMentalDisease === false ? styles.safetyDotActive : ''}`} />
                  <Text className={styles.safetyText}>否</Text>
                </View>
                <View
                  className={`${styles.safetyOption} ${form.hasMentalDisease === true ? styles.safetyOptionActive : ''}`}
                  onClick={() => setFormField('hasMentalDisease', true)}
                >
                  <View className={`${styles.safetyDot} ${form.hasMentalDisease === true ? styles.safetyDotActive : ''}`} />
                  <Text className={styles.safetyText}>是</Text>
                </View>
              </View>
            </View>
            <View className={styles.safetyRow}>
              <Text className={styles.safetyLabel}>是否正在服用精神类药物</Text>
              <View className={styles.safetyOptions}>
                <View
                  className={`${styles.safetyOption} ${form.onMedication === false ? styles.safetyOptionActive : ''}`}
                  onClick={() => setFormField('onMedication', false)}
                >
                  <View className={`${styles.safetyDot} ${form.onMedication === false ? styles.safetyDotActive : ''}`} />
                  <Text className={styles.safetyText}>否</Text>
                </View>
                <View
                  className={`${styles.safetyOption} ${form.onMedication === true ? styles.safetyOptionActive : ''}`}
                  onClick={() => setFormField('onMedication', true)}
                >
                  <View className={`${styles.safetyDot} ${form.onMedication === true ? styles.safetyDotActive : ''}`} />
                  <Text className={styles.safetyText}>是</Text>
                </View>
              </View>
            </View>
            <View className={styles.safetyRow}>
              <Text className={styles.safetyLabel}>三个月内是否有自伤行为</Text>
              <View className={styles.safetyOptions}>
                <View
                  className={`${styles.safetyOption} ${form.hasSelfHarm === false ? styles.safetyOptionActive : ''}`}
                  onClick={() => setFormField('hasSelfHarm', false)}
                >
                  <View className={`${styles.safetyDot} ${form.hasSelfHarm === false ? styles.safetyDotActive : ''}`} />
                  <Text className={styles.safetyText}>否</Text>
                </View>
                <View
                  className={`${styles.safetyOption} ${form.hasSelfHarm === true ? styles.safetyOptionActive : ''}`}
                  onClick={() => setFormField('hasSelfHarm', true)}
                >
                  <View className={`${styles.safetyDot} ${form.hasSelfHarm === true ? styles.safetyDotActive : ''}`} />
                  <Text className={styles.safetyText}>是</Text>
                </View>
              </View>
            </View>
            <View className={styles.safetyRow}>
              <Text className={styles.safetyLabel}>三个月内是否有自杀想法</Text>
              <View className={styles.safetyOptions}>
                <View
                  className={`${styles.safetyOption} ${form.hasSuicidalThought === false ? styles.safetyOptionActive : ''}`}
                  onClick={() => setFormField('hasSuicidalThought', false)}
                >
                  <View className={`${styles.safetyDot} ${form.hasSuicidalThought === false ? styles.safetyDotActive : ''}`} />
                  <Text className={styles.safetyText}>否</Text>
                </View>
                <View
                  className={`${styles.safetyOption} ${form.hasSuicidalThought === true ? styles.safetyOptionActive : ''}`}
                  onClick={() => setFormField('hasSuicidalThought', true)}
                >
                  <View className={`${styles.safetyDot} ${form.hasSuicidalThought === true ? styles.safetyDotActive : ''}`} />
                  <Text className={styles.safetyText}>是</Text>
                </View>
              </View>
            </View>
            <View className={styles.safetyRow}>
              <Text className={styles.safetyLabel}>三个月内是否有自杀行为</Text>
              <View className={styles.safetyOptions}>
                <View
                  className={`${styles.safetyOption} ${form.hasSuicidalBehavior === false ? styles.safetyOptionActive : ''}`}
                  onClick={() => setFormField('hasSuicidalBehavior', false)}
                >
                  <View className={`${styles.safetyDot} ${form.hasSuicidalBehavior === false ? styles.safetyDotActive : ''}`} />
                  <Text className={styles.safetyText}>否</Text>
                </View>
                <View
                  className={`${styles.safetyOption} ${form.hasSuicidalBehavior === true ? styles.safetyOptionActive : ''}`}
                  onClick={() => setFormField('hasSuicidalBehavior', true)}
                >
                  <View className={`${styles.safetyDot} ${form.hasSuicidalBehavior === true ? styles.safetyDotActive : ''}`} />
                  <Text className={styles.safetyText}>是</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        <View className={styles.section}>
          <View className={styles.formCard}>
            <Textarea
              className={styles.noteTextarea}
              placeholder="补充说明（选填）——您可以简要描述您目前的困扰或对本次咨询的期望"
              placeholderClass={styles.placeholder}
              value={form.additionalNote || ''}
              onInput={e => setFormField('additionalNote', e.detail.value)}
            />
          </View>
        </View>

        <View className={styles.section}>
          <View className={styles.agreementCard}>
            <View className={styles.agreementHeader} onClick={() => setShowAgreement(!showAgreement)}>
              <Text className={styles.agreementTitle}>MindPace 用户服务协议</Text>
              <Text className={`${styles.agreementArrow} ${showAgreement ? styles.agreementArrowUp : ''}`}>›</Text>
            </View>
            {showAgreement && (
              <ScrollView scrollY className={styles.agreementContent}>
                {AGREE_LINES.map((line, i) => (
                  line === '' ? (
                    <View key={i} className={styles.agreementLine}></View>
                  ) : (
                    <Text key={i} className={`${styles.agreementLine} ${i === 0 || line.match(/^[一二三四五六七]/) ? styles.agreementLineBold : ''}`}>
                      {line}
                    </Text>
                  )
                ))}
              </ScrollView>
            )}
          </View>

          <View className={styles.agreementCheck} onClick={() => { setAgreed(!agreed); setFormField('consentSigned', !agreed); }}>
            <View className={`${styles.checkBox} ${agreed ? styles.checkBoxActive : ''}`}>
              {agreed && <Text className={styles.checkIcon}>✓</Text>}
            </View>
            <Text className={styles.agreementText}>我已阅读并同意上述《MindPace 用户服务协议》</Text>
          </View>

          {errorMsg && (
            <Text className={styles.errorMsg}>{errorMsg}</Text>
          )}
        </View>

        <View className={styles.section}>
          <View className={styles.formCard}>
            <View className={styles.paymentHeader}>
              <Text className={styles.paymentTitle}>支付方式</Text>
              {isPackagePurchase && <Text className={styles.paymentBadge}>套餐购买</Text>}
            </View>
            <View className={styles.paymentList}>
              {PAYMENT_METHODS.map(m => {
                const active = paymentMethod === m.value;
                return (
                  <View
                    key={m.value}
                    className={`${styles.paymentOption} ${active ? styles.paymentOptionActive : ''}`}
                    onClick={() => setPaymentMethod(m.value)}
                  >
                    <View className={styles.paymentInfo}>
                      <Text className={styles.paymentLabel}>{m.label}</Text>
                      <Text className={styles.paymentDesc}>{m.desc}</Text>
                    </View>
                    <View className={`${styles.paymentRadio} ${active ? styles.paymentRadioActive : ''}`} />
                  </View>
                );
              })}
            </View>
          </View>
        </View>

        <View className={styles.bottomBar}>
          <Button className={styles.backButton} onClick={() => setStep(hasPricingOptions ? 0 : 1)}>
            上一步
          </Button>
          <Button
            className={styles.submitButton}
            loading={submitting}
            disabled={submitting}
            onClick={handleSubmitStep2}
          >
            提交预约 · ￥{priceAmount || 0}
          </Button>
        </View>
      </View>
    );
  };

  // 套餐购买模式：表单步骤返回键回到定价选择，而非退出页面
  const handleHeaderBack = () => {
    if (isPackagePurchase && step === 2) {
      setStep(0);
      return;
    }
    Taro.navigateBack();
  };

  return (
    <View className={styles.container}>
      <View className={styles.header}>
        <View className={styles.backButton} onClick={handleHeaderBack}>
          <Text className={styles.backIcon}>‹</Text>
        </View>
        <Text className={styles.headerTitle}>预约咨询</Text>
        {step > 0 && (
          <View className={styles.stepIndicator}>
            <View className={`${styles.step} ${step >= 1 ? styles.stepActive : ''}`}>
              <Text className={styles.stepText}>1</Text>
            </View>
            <View className={`${styles.stepLine} ${step >= 2 ? styles.stepLineActive : ''}`} />
            <View className={`${styles.step} ${step >= 2 ? styles.stepActive : ''}`}>
              <Text className={styles.stepText}>2</Text>
            </View>
          </View>
        )}
      </View>

      <ScrollView scrollY className={styles.scrollContent}>
        {isRedeem && redeemPkg && (
          <View className={styles.packageBanner}>
            <Text className={styles.packageBannerText}>
              套餐核销模式 · 剩余 {redeemPkg.totalSessions - redeemPkg.usedSessions} 次 · 提交后由咨询师确认时扣除
            </Text>
          </View>
        )}
        {step === 0 && renderStep0()}
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
      </ScrollView>
    </View>
  );
};

export default BookingFlowPage;