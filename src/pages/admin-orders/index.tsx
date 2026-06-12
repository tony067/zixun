import { useState, useEffect } from 'react'
import { View, Text, ScrollView } from '@tarojs/components'
import { getAdminOrders } from '../../api'
import './index.scss'

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getAdminOrders()
      .then(d => setOrders(Array.isArray(d) ? d : []))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false))
  }, [])

  return (
    <View className='admin-list-page'>
      {loading ? (
        <View className='loading'><Text>加载中…</Text></View>
      ) : orders.length === 0 ? (
        <View className='empty-state'>
          <Text className='empty-icon'>📋</Text>
          <Text className='empty-text'>暂无订单记录</Text>
        </View>
      ) : (
        <ScrollView scrollY className='list-scroll'>
          {orders.map((o, i) => (
            <View key={o.id || i} className='list-card'>
              <View className='card-header'>
                <Text className='card-name'>订单 #{(o.id || String(i)).slice(-6).toUpperCase()}</Text>
                <Text className='order-amount'>¥{o.priceAmount || o.amount || 0}</Text>
              </View>
              <Text className='card-sub'>
                {o.scheduledAt ? new Date(o.scheduledAt).toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''}
                {o.status ? ` · ${o.status}` : ''}
              </Text>
            </View>
          ))}
          <View style={{ height: '40px' }} />
        </ScrollView>
      )}
    </View>
  )
}
