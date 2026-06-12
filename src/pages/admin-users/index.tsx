import { useState, useEffect } from 'react'
import { View, Text, ScrollView } from '@tarojs/components'
import { getAdminUsers } from '../../api'
import './index.scss'

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getAdminUsers()
      .then(d => setUsers(Array.isArray(d) ? d : []))
      .catch(() => setUsers([]))
      .finally(() => setLoading(false))
  }, [])

  return (
    <View className='admin-list-page'>
      {loading ? (
        <View className='loading'><Text>加载中…</Text></View>
      ) : users.length === 0 ? (
        <View className='empty-state'>
          <Text className='empty-icon'>👥</Text>
          <Text className='empty-text'>暂无用户数据</Text>
        </View>
      ) : (
        <ScrollView scrollY className='list-scroll'>
          {users.map((u, i) => (
            <View key={u.id || i} className='list-card'>
              <View className='user-row'>
                <View className='user-avatar'>
                  <Text className='user-initial'>{(u.name || u.email || '?')[0].toUpperCase()}</Text>
                </View>
                <View className='user-info'>
                  <Text className='user-name'>{u.name || '—'}</Text>
                  <Text className='user-email'>{u.email}</Text>
                </View>
                <View className='user-role-badge'>
                  <Text className='user-role-text'>{u.role || 'client'}</Text>
                </View>
              </View>
            </View>
          ))}
          <View style={{ height: '40px' }} />
        </ScrollView>
      )}
    </View>
  )
}
