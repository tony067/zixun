import { useState, useEffect } from 'react'
import Taro, { useRouter } from '@tarojs/taro'
import { View, Text, ScrollView, Input, Textarea, Picker } from '@tarojs/components'
import { getCounselorById, createBooking, type Counselor } from '../../api'
import './index.scss'

const WEEKDAY = ['日','一','二','三','四','五','六']
const STEP_LABELS = ['选时间', '填信息', '等待确认', '完成支付']

function StepBar({ current }: { current: number }) {
  return (
    <View className='step-bar'>
      {STEP_LABELS.map((label, i) => (
        <View key={i} className='step-item'>
          <View className={`step-circle ${i <= current ? 'active' : ''} ${i < current ? 'done' : ''}`}>
            {i < current
              ? <Text className='step-check'>✓</Text>
              : <Text className='step-num'>{i + 1}</Text>
            }
          </View>
          <Text className={`step-label ${i <= current ? 'active' : ''}`}>{label}</Text>
          {i < STEP_LABELS.length - 1 && <View className={`step-line ${i < current ? 'done' : ''}`} />}
        </View>
      ))}
    </View>
  )
}

// 步骤1：选时间
function Step1({ counselor, onNext }: {
  counselor: Counselor
  onNext: (data: { slot: Date; mode: string }) => void
}) {
  const [selectedSlot, setSelectedSlot] = useState<{ date: Date; time: string } | null>(null)
  const [mode, setMode] = useState(counselor.sessionModes?.[0] || 'video')

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() + i + 1)
    const label = `周${WEEKDAY[d.getDay()]} ${d.getMonth()+1}/${d.getDate()}`
    const slots = i % 3 === 2 ? [] : i % 2 === 0 ? ['09:00','14:00','16:00'] : ['10:00','15:00']
    return { date: d, label, slots }
  }).filter(d => d.slots.length > 0)

  return (
    <ScrollView scrollY className='step-content'>
      <Text className='step-tip'>选择咨询时间</Text>
      {days.map(day => (
        <View key={day.label} className='day-block'>
          <Text className='day-label'>{day.label}</Text>
          <View className='slots-row'>
            {day.slots.map(slot => {
              const isSelected = selectedSlot?.time === `${day.label} ${slot}`
              return (
                <View
                  key={slot}
                  className={`slot-btn ${isSelected ? 'selected' : ''}`}
                  onClick={() => {
                    const d = new Date(day.date)
                    const [h, m] = slot.split(':')
                    d.setHours(+h, +m)
                    setSelectedSlot({ date: d, time: `${day.label} ${slot}` })
                  }}
                >
                  <Text className='slot-text'>{slot}</Text>
                </View>
              )
            })}
          </View>
        </View>
      ))}

      <Text className='step-tip' style={{ marginTop: '24px' }}>咨询方式</Text>
      <View className='mode-row'>
        {(counselor.sessionModes || ['视频','语音','文字']).map(m => (
          <View
            key={m}
            className={`mode-btn ${mode === m ? 'selected' : ''}`}
            onClick={() => setMode(m)}
          >
            <Text className='mode-text'>{m}</Text>
          </View>
        ))}
      </View>

      <View
        className={`next-btn ${selectedSlot ? '' : 'disabled'}`}
        onClick={() => selectedSlot && onNext({ slot: selectedSlot.date, mode })}
      >
        <Text className='next-btn-text'>下一步</Text>
      </View>
    </ScrollView>
  )
}

// 步骤2：填信息
function Step2({ counselor, onNext, onBack }: {
  counselor: Counselor
  onNext: (form: any, agreed: boolean) => void
  onBack: () => void
}) {
  const [note, setNote] = useState('')
  const [agreed, setAgreed] = useState(false)
  const [concern, setConcern] = useState('')

  return (
    <ScrollView scrollY className='step-content'>
      <Text className='field-label'>主要困扰</Text>
      <Input
        className='field-input'
        placeholder='简单描述你希望解决的问题'
        placeholderStyle='color:#C2BDB7'
        value={concern}
        onInput={e => setConcern(e.detail.value)}
      />

      <Text className='field-label'>备注（选填）</Text>
      <Textarea
        className='field-textarea'
        placeholder='有什么想提前告知咨询师的…'
        placeholderStyle='color:#C2BDB7'
        value={note}
        onInput={e => setNote(e.detail.value)}
        maxlength={500}
        autoHeight
      />

      <View className='price-summary'>
        <Text className='price-label'>本次费用</Text>
        <Text className='price-value'>¥{counselor.pricePerSession} / {counselor.sessionDuration}分钟</Text>
      </View>

      <View className='agreement-row' onClick={() => setAgreed(!agreed)}>
        <View className={`checkbox ${agreed ? 'checked' : ''}`}>
          {agreed && <Text className='checkbox-check'>✓</Text>}
        </View>
        <Text className='agreement-text'>我已阅读并同意咨询服务协议</Text>
      </View>

      <View className='btn-row'>
        <View className='back-btn' onClick={onBack}><Text className='back-btn-text'>上一步</Text></View>
        <View
          className={`next-btn flex-1 ${agreed ? '' : 'disabled'}`}
          onClick={() => agreed && onNext({ concern, note }, agreed)}
        >
          <Text className='next-btn-text'>提交预约</Text>
        </View>
      </View>
    </ScrollView>
  )
}

// 步骤3：等待确认
function Step3({ bookingId, onNext }: { bookingId: string; onNext: () => void }) {
  return (
    <View className='step-center'>
      <Text className='waiting-icon'>⏳</Text>
      <Text className='waiting-title'>预约已提交</Text>
      <Text className='waiting-sub'>等待咨询师确认，通常在24小时内回复</Text>
      <Text className='booking-id'>预约编号：{bookingId}</Text>
      <View className='next-btn' onClick={onNext}>
        <Text className='next-btn-text'>继续去支付</Text>
      </View>
      <View className='skip-btn' onClick={() => Taro.navigateTo({ url: '/pages/my-bookings/index' })}>
        <Text className='skip-text'>稍后再付，去我的预约</Text>
      </View>
    </View>
  )
}

// 步骤4：支付
function Step4({ counselor, onDone }: { counselor: Counselor; onDone: () => void }) {
  const [paid, setPaid] = useState(false)

  function handlePay() {
    Taro.showLoading({ title: '支付中…' })
    setTimeout(() => {
      Taro.hideLoading()
      setPaid(true)
      onDone()
    }, 1500)
  }

  return (
    <View className='step-center'>
      {paid ? (
        <>
          <Text className='success-icon'>✅</Text>
          <Text className='success-title'>支付成功！</Text>
          <Text className='success-sub'>咨询预约已确认，期待与你的会面</Text>
          <View className='next-btn' onClick={() => Taro.navigateTo({ url: '/pages/my-bookings/index' })}>
            <Text className='next-btn-text'>查看我的预约</Text>
          </View>
        </>
      ) : (
        <>
          <Text className='pay-title'>确认支付</Text>
          <View className='pay-card'>
            <Text className='pay-name'>{counselor.displayName}</Text>
            <View className='pay-divider' />
            <View className='pay-row'>
              <Text className='pay-key'>咨询时长</Text>
              <Text className='pay-val'>{counselor.sessionDuration} 分钟</Text>
            </View>
            <View className='pay-row'>
              <Text className='pay-key'>咨询费用</Text>
              <Text className='pay-val total'>¥{counselor.pricePerSession}</Text>
            </View>
          </View>
          <View className='next-btn' onClick={handlePay}>
            <Text className='next-btn-text'>微信支付 ¥{counselor.pricePerSession}</Text>
          </View>
        </>
      )}
    </View>
  )
}

export default function BookingPage() {
  const router = useRouter()
  const { id } = router.params
  const [counselor, setCounselor] = useState<Counselor | null>(null)
  const [loading, setLoading] = useState(true)
  const [step, setStep] = useState(0)
  const [step1Data, setStep1Data] = useState<{ slot: Date; mode: string } | null>(null)
  const [bookingId, setBookingId] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!id) return
    getCounselorById(id).then(c => setCounselor(c)).finally(() => setLoading(false))
  }, [id])

  async function handleStep2(form: any, agreed: boolean) {
    if (!counselor || !step1Data) return
    setSubmitting(true)
    try {
      const booking = await createBooking({
        counselorId: id!,
        scheduledAt: step1Data.slot.toISOString(),
        sessionMode: step1Data.mode,
        clientNote: form.note,
        applicationForm: form,
        agreementSigned: agreed,
        sessionNumber: 1,
      })
      setBookingId(booking.id)
      setStep(2)
    } catch (e: any) {
      Taro.showToast({ title: e.message || '提交失败', icon: 'none' })
    } finally {
      setSubmitting(false)
    }
  }

  if (loading || !counselor) {
    return <View className='booking-page'><View className='loading'><Text>加载中…</Text></View></View>
  }

  return (
    <View className='booking-page'>
      <StepBar current={step} />
      {step === 0 && <Step1 counselor={counselor} onNext={d => { setStep1Data(d); setStep(1) }} />}
      {step === 1 && <Step2 counselor={counselor} onNext={handleStep2} onBack={() => setStep(0)} />}
      {step === 2 && <Step3 bookingId={bookingId} onNext={() => setStep(3)} />}
      {step === 3 && <Step4 counselor={counselor} onDone={() => {}} />}
    </View>
  )
}
