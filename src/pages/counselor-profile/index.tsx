import { useState, useEffect } from 'react'
import Taro from '@tarojs/taro'
import { View, Text, ScrollView, Input, Textarea } from '@tarojs/components'
import { getMyProfile, updateMyProfile } from '../../api'
import './index.scss'

export default function CounselorProfilePage() {
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [bio, setBio] = useState('')
  const [tagline, setTagline] = useState('')

  useEffect(() => {
    getMyProfile()
      .then(p => {
        setProfile(p)
        setBio((p as any).bio || '')
        setTagline((p as any).tagline || '')
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  async function handleSave() {
    setSaving(true)
    try {
      await updateMyProfile({ ...profile, bio, tagline } as any)
      Taro.showToast({ title: '保存成功', icon: 'success' })
    } catch {
      Taro.showToast({ title: '保存失败', icon: 'none' })
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <View className='loading'><Text>加载中…</Text></View>

  return (
    <ScrollView scrollY className='c-profile-page'>
      <View className='profile-card'>
        <View className='avatar-section'>
          <View className='c-avatar-placeholder'>
            <Text className='c-avatar-initial'>{profile?.name?.[0] || '咨'}</Text>
          </View>
          <Text className='change-avatar-text'>更换头像</Text>
        </View>

        <View className='field-group'>
          <Text className='field-label'>显示名称</Text>
          <View className='field-display'><Text className='field-value'>{profile?.name || '—'}</Text></View>
        </View>

        <View className='field-group'>
          <Text className='field-label'>个人简介</Text>
          <Textarea
            className='field-textarea'
            value={bio}
            onInput={e => setBio(e.detail.value)}
            placeholder='介绍一下你自己…'
            placeholderStyle='color:#C2BDB7'
            maxlength={500}
            autoHeight
          />
        </View>

        <View className='field-group'>
          <Text className='field-label'>金句（展示在详情页）</Text>
          <Input
            className='field-input'
            value={tagline}
            onInput={e => setTagline(e.detail.value)}
            placeholder='一句话描述你的咨询风格…'
            placeholderStyle='color:#C2BDB7'
          />
        </View>
      </View>

      <View className='save-btn' onClick={handleSave}>
        <Text className='save-btn-text'>{saving ? '保存中…' : '保存更改'}</Text>
      </View>

      <View style={{ height: '40px' }} />
    </ScrollView>
  )
}
