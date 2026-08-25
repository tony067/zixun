import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, ScrollView, Textarea, Button, Input } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import styles from './index.module.scss';
import { fetchCounselorDetail } from '@/services/api';
import type { Counselor, TimeSlot, ApplicationForm } from '@/types/counselor';
import { getNextDays, generateMockSlots, WEEKDAY_LABELS, PERIOD_LABELS, EMPTY_FORM, PURPOSE_OPTIONS } from '@/types/counselor';
import Icon from '@/components/Icon';

type Step = 0 | 1 | 2;

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
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [showCoordinate, setShowCoordinate] = useState(false);
  const [coordMsg, setCoordMsg] = useState('');
  const [coordAccept, setCoordAccept] = useState<string | null>(null);
  const [coordSent, setCoordSent] = useState(false);

  const [form, setForm] = useState<ApplicationForm>(EMPTY_FORM);
  const [agreed, setAgreed] = useState(false);
  const [showAgreement, setShowAgreement] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const days = useMemo(() => getNextDays(14), []);
  const slots = useMemo(() => generateMockSlots(days), [days]);

  useEffect(() => {
    const { id } = router.params || {};
    if (id) {
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
    }
    if (days.length > 0) {
      setSelectedDay(days[0]);
    }
  }, [router.params, days]);

  const dayKey = selectedDay?.toISOString().slice(0, 10) || '';
  const daySlots = slots[dayKey] ?? [];
  const morning = daySlots.filter(s => s.period === 'morning');
  const afternoon = daySlots.filter(s => s.period === 'afternoon');
  const evening = daySlots.filter(s => s.period === 'evening');

  const canNext = selectedMode && selectedSlot;

  const hasPricingOptions = counselor?.pricingOptions && counselor.pricingOptions.length > 0;
  const currentPricing = hasPricingOptions ? counselor.pricingOptions[selectedPricing] : null;
  const durationMinutes = currentPricing?.duration ?? counselor?.sessionDuration ?? 50;
  const priceAmount = currentPricing?.price ?? counselor?.pricePerSession ?? 0;

  const setFormField = <K extends keyof ApplicationForm>(k: K, v: ApplicationForm[K]) => {
    setForm(prev => ({ ...prev, [k]: v }));
  };

  const handleSubmitStep2 = () => {
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
    Taro.showToast({ title: '预约申请已提交', icon: 'success' });
    setTimeout(() => {
      Taro.navigateTo({ url: '/pages/bookings/index' });
    }, 1200);
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
          <Button className={styles.nextButton} onClick={() => setStep(1)}>
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
            {days.map(d => {
              const k = d.toISOString().slice(0, 10);
              const hasFree = (slots[k] || []).some(s => s.available);
              const active = k === dayKey;
              return (
                <View
                  key={k}
                  className={`${styles.dateItem} ${active ? styles.dateActive : ''} ${!hasFree ? styles.dateDisabled : ''}`}
                  onClick={() => { setSelectedDay(d); setSelectedSlot(null); }}
                >
                  <Text className={styles.dateWeek}>{WEEKDAY_LABELS[d.getDay()]}</Text>
                  <Text className={styles.dateDay}>{d.getMonth() + 1}.{d.getDate()}</Text>
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
              已选：{selectedDay?.getMonth() + 1}/{selectedDay?.getDate()} {selectedSlot.start}–{selectedSlot.end}
            </Text>
          )}
          <Button
            className={`${styles.nextButton} ${!canNext ? styles.buttonDisabled : ''}`}
            onClick={() => canNext && setStep(2)}
          >
            下一步：填写预约信息
          </Button>
        </View>
      </View>
    </View>
  );

  const renderStep2 = () => {
    const WEEKDAY = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    const dateStr = selectedDay
      ? `${selectedDay.getMonth() + 1}月${selectedDay.getDate()}日 ${WEEKDAY[selectedDay.getDay()]} ${selectedSlot?.start}–${selectedSlot?.end}`
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

        <View className={styles.bottomBar}>
          <Button className={styles.backButton} onClick={() => setStep(hasPricingOptions ? 0 : 1)}>
            上一步
          </Button>
          <Button className={styles.submitButton} onClick={handleSubmitStep2}>
            提交预约 · ￥{priceAmount || 0}
          </Button>
        </View>
      </View>
    );
  };

  return (
    <View className={styles.container}>
      <View className={styles.header}>
        <View className={styles.backButton} onClick={() => Taro.navigateBack()}>
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
        {step === 0 && renderStep0()}
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
      </ScrollView>
    </View>
  );
};

export default BookingFlowPage;