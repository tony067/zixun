import { useState, useEffect } from 'react'
import Taro from '@tarojs/taro'
import { View, Text, ScrollView } from '@tarojs/components'
import { getMyBookings, type Booking } from '../../api'
import './index.scss'

const STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
  pending:   { label: '等待确认', color: '#C86800', bg: '#FEF3E2' },
  confirmed: { label: '已确认',   color: '#2D7A3C', bg: '#E4F5E8' },
  completed: { label: '已完成',   color: '#9B8E82', bg: '#F5F1E8' },
  cancelled: { label: '已取消',   color: '#B84A4A', bg: '#FDE8E8' },
  paid:      { label: '已支付',   color: '#3060C0', bg: '#EAF1FF' },
}

export default function MyBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'upcoming' | 'past'>('upcoming')

  useEffect(() => {
    getMyBookings()
      .then(d => setBookings(Array.isArray(d) ? d : []))
      .catch(() => setBookings([]))
      .finally(() => setLoading(false))
  }, [])

  const now = new Date()
  const upcoming = bookings.filter(b => new Date(b.scheduledAt) >= now)
  const past = bookings.filter(b => new Date(b.scheduledAt) < now)
  const displayed = tab === 'upcoming' ? upcoming : past

  function formatDate(iso: string) {
    const d = new Date(iso)
    return d.toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  return (
    <View className='bookings-page'>
      {/* Tab */}
      <View className='tab-bar'>
        <View className={`tab-item ${tab === 'upcoming' ? 'active' : ''}`} onClick={() => setTab('upcoming')}>
          <Text className='tab-text'>即将到来</Text>
          {upcoming.length > 0 && <View className='tab-badge'><Text className='tab-badge-text'>{upcoming.length}</Text></View>}
        </View>
        <View className={`tab-item ${tab === 'past' ? 'active' : ''}`} onClick={() => setTab('past')}>
          <Text className='tab-text'>历史预约</Text>
        </View>
      </View>

      {loading ? (
        <View className='loading'><Text>加载中…</Text></View>
      ) : displayed.length === 0 ? (
        <View className='empty-state'>
          <Text className='empty-icon'>{tab === 'upcoming' ? '📅' : '📖'}</Text>
          <Text className='empty-text'>{tab === 'upcoming' ? '暂无即将到来的预约' : '暂无历史预约'}</Text>
          {tab === 'upcoming' && (
            <View className='cta-btn' onClick={() => Taro.switchTab({ url: '/pages/index/index' })}>
              <Text className='cta-text'>去预约咨询师</Text>
            </View>
          )}
        </View>
      ) : (
        <ScrollView scrollY className='booking-list'>
          {displayed.map(b => {
            const status = STATUS_MAP[b.status] || { label: b.status, color: '#9B8E82', bg: '#F5F1E8' }
            return (
              <View key={b.id} className='booking-card'>
                <View className='booking-top'>
                  <View className='booking-id-wrap'>
                    <Text className='booking-id'>预约 #{b.id.slice(-6).toUpperCase()}</Text>
                  </View>
                  <View className='status-badge' style={{ background: status.bg }}>
                    <Text className='status-text' style={{ color: status.color }}>{status.label}</Text>
                  </View>
                </View>

                <View className='booking-info'>
                  <Text className='info-row'>🗓️ {formatDate(b.scheduledAt)}</Text>
                  <Text className='info-row'>⏱️ {b.durationMinutes} 分钟 · {b.sessionMode}</Text>
                  <Text className='info-row'>💰 ¥{b.priceAmount}</Text>
                </View>

                {b.status === 'confirmed' && new Date(b.scheduledAt) >= now && (
                  <View
                    className='chat-btn'
                    onClick={() => Taro.navigateTo({ url: `/pages/chat/index?counselorId=${b.counselorId}` })}
                  >
                    <Text className='chat-btn-text'>联系咨询师</Text>
                  </View>
                )}
              </View>
            )
          })}
          <View className='list-bottom' />
        </ScrollView>
      )}
    </View>
  )
}
