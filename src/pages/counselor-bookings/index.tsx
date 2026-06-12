import { useState, useEffect } from 'react'
import Taro from '@tarojs/taro'
import { View, Text, ScrollView } from '@tarojs/components'
import { getCounselorBookings, updateBookingStatus, type Booking } from '../../api'
import './index.scss'

const STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
  pending:   { label: '待确认', color: '#C86800', bg: '#FEF3E2' },
  confirmed: { label: '已确认', color: '#2D7A3C', bg: '#E4F5E8' },
  completed: { label: '已完成', color: '#9B8E82', bg: '#F5F1E8' },
  cancelled: { label: '已取消', color: '#B84A4A', bg: '#FDE8E8' },
}

export default function CounselorBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'pending' | 'confirmed' | 'all'>('pending')

  useEffect(() => {
    getCounselorBookings()
      .then(d => setBookings(Array.isArray(d) ? d : []))
      .catch(() => setBookings([]))
      .finally(() => setLoading(false))
  }, [])

  const displayed = bookings.filter(b => tab === 'all' ? true : b.status === tab)

  async function handleAction(id: string, status: string) {
    try {
      await updateBookingStatus(id, status)
      setBookings(prev => prev.map(b => b.id === id ? { ...b, status } : b))
      Taro.showToast({ title: status === 'confirmed' ? '已确认' : '已拒绝', icon: 'success' })
    } catch {
      Taro.showToast({ title: '操作失败', icon: 'none' })
    }
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  return (
    <View className='c-bookings-page'>
      <View className='tab-bar'>
        {(['pending', 'confirmed', 'all'] as const).map(t => {
          const labels = { pending: '待确认', confirmed: '已确认', all: '全部' }
          return (
            <View key={t} className={`tab-item ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
              <Text className='tab-text'>{labels[t]}</Text>
            </View>
          )
        })}
      </View>

      {loading ? (
        <View className='loading'><Text>加载中…</Text></View>
      ) : displayed.length === 0 ? (
        <View className='empty-state'>
          <Text className='empty-icon'>📋</Text>
          <Text className='empty-text'>暂无{tab === 'pending' ? '待确认' : tab === 'confirmed' ? '已确认' : ''}预约</Text>
        </View>
      ) : (
        <ScrollView scrollY className='booking-list'>
          {displayed.map(b => {
            const status = STATUS_MAP[b.status] || { label: b.status, color: '#9B8E82', bg: '#F5F1E8' }
            return (
              <View key={b.id} className='booking-card'>
                <View className='booking-header'>
                  <Text className='booking-id'>#{b.id.slice(-6).toUpperCase()}</Text>
                  <View className='status-badge' style={{ background: status.bg }}>
                    <Text className='status-text' style={{ color: status.color }}>{status.label}</Text>
                  </View>
                </View>
                <View className='booking-body'>
                  <Text className='info-row'>🗓️ {formatDate(b.scheduledAt)}</Text>
                  <Text className='info-row'>⏱️ {b.durationMinutes} 分钟 · {b.sessionMode}</Text>
                  <Text className='info-row'>💰 ¥{b.priceAmount}</Text>
                </View>
                {b.status === 'pending' && (
                  <View className='action-row'>
                    <View className='reject-btn' onClick={() => handleAction(b.id, 'cancelled')}>
                      <Text className='reject-text'>拒绝</Text>
                    </View>
                    <View className='confirm-btn' onClick={() => handleAction(b.id, 'confirmed')}>
                      <Text className='confirm-text'>确认预约</Text>
                    </View>
                  </View>
                )}
                {b.status === 'confirmed' && (
                  <View className='chat-btn' onClick={() => Taro.navigateTo({ url: `/pages/chat/index?counselorId=${b.clientId}` })}>
                    <Text className='chat-btn-text'>联系来访者</Text>
                  </View>
                )}
              </View>
            )
          })}
          <View style={{ height: '100px' }} />
        </ScrollView>
      )}
    </View>
  )
}
