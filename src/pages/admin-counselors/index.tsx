import { useState, useEffect } from 'react'
import Taro from '@tarojs/taro'
import { View, Text, ScrollView } from '@tarojs/components'
import { getAdminCounselors, request } from '../../api'
import './index.scss'

export default function AdminCounselorsPage() {
  const [list, setList] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getAdminCounselors()
      .then(d => setList(Array.isArray(d) ? d : []))
      .catch(() => setList([]))
      .finally(() => setLoading(false))
  }, [])

  async function handleApprove(id: string, approved: boolean) {
    try {
      await request(`/api/admin/counselors/${id}`, {
        method: 'PATCH',
        data: { isApproved: approved },
      })
      setList(prev => prev.map(c => c.id === id ? { ...c, isApproved: approved } : c))
      Taro.showToast({ title: approved ? '已批准' : '已拒绝', icon: 'success' })
    } catch {
      Taro.showToast({ title: '操作失败', icon: 'none' })
    }
  }

  return (
    <View className='admin-list-page'>
      {loading ? (
        <View className='loading'><Text>加载中…</Text></View>
      ) : list.length === 0 ? (
        <View className='empty-state'>
          <Text className='empty-icon'>🛡️</Text>
          <Text className='empty-text'>暂无待审核申请</Text>
        </View>
      ) : (
        <ScrollView scrollY className='list-scroll'>
          {list.map(c => (
            <View key={c.id} className='list-card'>
              <View className='card-header'>
                <Text className='card-name'>{c.displayName || c.name}</Text>
                <View className={`status-dot ${c.isApproved ? 'approved' : 'pending'}`}>
                  <Text className='status-dot-text'>{c.isApproved ? '已批准' : '待审核'}</Text>
                </View>
              </View>
              <Text className='card-sub'>{c.title || c.email}</Text>
              {!c.isApproved && (
                <View className='action-row'>
                  <View className='reject-btn' onClick={() => handleApprove(c.id, false)}>
                    <Text className='reject-text'>拒绝</Text>
                  </View>
                  <View className='approve-btn' onClick={() => handleApprove(c.id, true)}>
                    <Text className='approve-text'>批准入驻</Text>
                  </View>
                </View>
              )}
            </View>
          ))}
          <View style={{ height: '40px' }} />
        </ScrollView>
      )}
    </View>
  )
}
