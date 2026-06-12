import { useState } from 'react'
import Taro from '@tarojs/taro'
import { View, Text, Switch } from '@tarojs/components'
import './index.scss'

export default function SettingsPage() {
  const [notifications, setNotifications] = useState(true)
  const [marketing, setMarketing] = useState(false)

  return (
    <View className='settings-page'>
      <View className='settings-section'>
        <Text className='section-title'>通知设置</Text>
        <View className='settings-list'>
          <View className='settings-item'>
            <Text className='item-label'>预约提醒</Text>
            <Switch checked={notifications} onChange={e => setNotifications(e.detail.value)} color='#9CB48A' />
          </View>
          <View className='settings-item'>
            <Text className='item-label'>活动推送</Text>
            <Switch checked={marketing} onChange={e => setMarketing(e.detail.value)} color='#9CB48A' />
          </View>
        </View>
      </View>

      <View className='settings-section'>
        <Text className='section-title'>账号与隐私</Text>
        <View className='settings-list'>
          {[
            { label: '修改昵称', url: '' },
            { label: '隐私政策', url: '' },
            { label: '用户协议', url: '' },
            { label: '关于 MindPace', url: '' },
          ].map(item => (
            <View
              key={item.label}
              className='settings-item clickable'
              onClick={() => item.url && Taro.navigateTo({ url: item.url })}
            >
              <Text className='item-label'>{item.label}</Text>
              <Text className='item-arrow'>›</Text>
            </View>
          ))}
        </View>
      </View>

      <View className='settings-section'>
        <Text className='section-title'>支持</Text>
        <View className='settings-list'>
          <View
            className='settings-item clickable'
            onClick={() => Taro.showToast({ title: '功能开发中', icon: 'none' })}
          >
            <Text className='item-label'>联系客服</Text>
            <Text className='item-arrow'>›</Text>
          </View>
          <View
            className='settings-item clickable'
            onClick={() => Taro.showToast({ title: '功能开发中', icon: 'none' })}
          >
            <Text className='item-label'>意见反馈</Text>
            <Text className='item-arrow'>›</Text>
          </View>
        </View>
      </View>

      <View className='version-info'>
        <Text className='version-text'>MindPace v1.0.0</Text>
        <Text className='version-sub'>神经多样性友好咨询预约平台</Text>
      </View>
    </View>
  )
}
