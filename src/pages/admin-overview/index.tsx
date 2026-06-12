import { useState, useEffect } from 'react'
import Taro from '@tarojs/taro'
import { View, Text, ScrollView } from '@tarojs/components'
import { getAdminStats } from '../../api'
import './index.scss'

export default function AdminOverviewPage() {
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getAdminStats()
      .then(d => setStats(d))
      .catch(() => setStats(null))
      .finally(() => setLoading(false))
  }, [])

  const cards = [
    { label: '总预约数', value: stats?.totalBookings ?? '—', color: '#3060C0', bg: '#EAF1FF' },
    { label: '活跃咨询师', value: stats?.activeCounselors ?? '—', color: '#2D7A3C', bg: '#E4F5E8' },
    { label: '本月营收', value: stats?.monthlyRevenue ? `¥${stats.monthlyRevenue}` : '—', color: '#C86800', bg: '#FEF3E2' },
    { label: '待审核申请', value: stats?.pendingApplications ?? '—', color: '#A030A0', bg: '#FDE8F8' },
  ]

  const navItems = [
    { icon: '🛡️', label: '咨询师审核', url: '/pages/admin-counselors/index' },
    { icon: '📋', label: '订单管理', url: '/pages/admin-orders/index' },
    { icon: '👥', label: '用户管理', url: '/pages/admin-users/index' },
  ]

  return (
    <ScrollView scrollY className='admin-page'>
      <View className='admin-header'>
        <Text className='admin-title'>管理后台</Text>
        <Text className='admin-sub'>MindPace 平台数据总览</Text>
      </View>

      {loading ? (
        <View className='loading'><Text>加载中…</Text></View>
      ) : (
        <View className='stats-grid'>
          {cards.map(card => (
            <View key={card.label} className='stat-card' style={{ background: card.bg }}>
              <Text className='stat-value' style={{ color: card.color }}>{card.value}</Text>
              <Text className='stat-label'>{card.label}</Text>
            </View>
          ))}
        </View>
      )}

      <View className='nav-section'>
        <Text className='nav-title'>管理功能</Text>
        <View className='nav-list'>
          {navItems.map(item => (
            <View
              key={item.label}
              className='nav-item'
              onClick={() => Taro.navigateTo({ url: item.url })}
            >
              <Text className='nav-icon'>{item.icon}</Text>
              <Text className='nav-label'>{item.label}</Text>
              <Text className='nav-arrow'>›</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={{ height: '40px' }} />
    </ScrollView>
  )
}
