import { useState, useEffect } from 'react'
import Taro from '@tarojs/taro'
import { View, Text, Image, ScrollView } from '@tarojs/components'
import { getMyProfile, type UserProfile } from '../../api'
import { useAuthStore } from '../../store/authStore'
import './index.scss'

const MENU_ITEMS = [
  { icon: '📅', label: '我的预约', url: '/pages/my-bookings/index' },
  { icon: '❤️', label: '收藏的咨询师', url: '/pages/favorites/index' },
  { icon: '💬', label: '我的消息', url: '/pages/chat/index' },
  { icon: '⚙️', label: '账号设置', url: '/pages/settings/index' },
]

const ROLE_SWITCH = [
  { icon: '🌿', label: '切换为咨询师端', url: '/pages/counselor-bookings/index' },
  { icon: '🛡️', label: '切换为管理后台', url: '/pages/admin-overview/index' },
]

export default function ProfilePage() {
  const { user, isLoggedIn, logout } = useAuthStore()
  const [profile, setProfile] = useState<UserProfile | null>(null)

  useEffect(() => {
    if (isLoggedIn) {
      getMyProfile().then(p => setProfile(p)).catch(() => {})
    }
  }, [isLoggedIn])

  const displayUser = profile || user

  function handleLogin() {
    Taro.showToast({ title: '请先登录', icon: 'none' })
    // TODO: 接入微信登录
  }

  function handleLogout() {
    Taro.showModal({
      title: '退出登录',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) { logout() }
      }
    })
  }

  return (
    <ScrollView scrollY className='profile-page'>
      {/* 用户卡片 */}
      <View className='user-card'>
        {displayUser?.avatarUrl
          ? <Image src={displayUser.avatarUrl} className='user-avatar' mode='aspectFill' />
          : (
            <View className='user-avatar-placeholder'>
              <Text className='user-initial'>{displayUser?.name?.[0] || '我'}</Text>
            </View>
          )
        }
        <View className='user-info'>
          <Text className='user-name'>{displayUser?.name || '未登录'}</Text>
          <Text className='user-email'>{displayUser?.email || '点击登录 / 注册'}</Text>
        </View>
        {!isLoggedIn && (
          <View className='login-btn' onClick={handleLogin}>
            <Text className='login-btn-text'>登录</Text>
          </View>
        )}
      </View>

      {/* 菜单 */}
      <View className='menu-section'>
        <Text className='menu-section-title'>我的服务</Text>
        <View className='menu-list'>
          {MENU_ITEMS.map(item => (
            <View
              key={item.label}
              className='menu-item'
              onClick={() => Taro.navigateTo({ url: item.url })}
            >
              <Text className='menu-icon'>{item.icon}</Text>
              <Text className='menu-label'>{item.label}</Text>
              <Text className='menu-arrow'>›</Text>
            </View>
          ))}
        </View>
      </View>

      {/* 角色切换 */}
      {isLoggedIn && (
        <View className='menu-section'>
          <Text className='menu-section-title'>其他端口</Text>
          <View className='menu-list'>
            {ROLE_SWITCH.map(item => (
              <View
                key={item.label}
                className='menu-item'
                onClick={() => Taro.navigateTo({ url: item.url })}
              >
                <Text className='menu-icon'>{item.icon}</Text>
                <Text className='menu-label'>{item.label}</Text>
                <Text className='menu-arrow'>›</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* 退出登录 */}
      {isLoggedIn && (
        <View className='logout-wrap'>
          <View className='logout-btn' onClick={handleLogout}>
            <Text className='logout-text'>退出登录</Text>
          </View>
        </View>
      )}

      <View className='page-bottom' />
    </ScrollView>
  )
}
