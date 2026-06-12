import { useState, useEffect } from 'react'
import Taro from '@tarojs/taro'
import { View, Text, ScrollView, Image } from '@tarojs/components'
import { getFavorites, toggleFavorite, type Counselor } from '../../api'
import './index.scss'

export default function FavoritesPage() {
  const [list, setList] = useState<Counselor[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getFavorites()
      .then(d => setList(Array.isArray(d) ? d : []))
      .catch(() => setList([]))
      .finally(() => setLoading(false))
  }, [])

  async function handleRemove(id: string) {
    await toggleFavorite(id)
    setList(prev => prev.filter(c => c.id !== id))
    Taro.showToast({ title: '已取消收藏', icon: 'none' })
  }

  if (loading) return <View className='loading'><Text>加载中…</Text></View>

  return (
    <View className='fav-page'>
      {list.length === 0 ? (
        <View className='empty-state'>
          <Text className='empty-icon'>❤️</Text>
          <Text className='empty-text'>还没有收藏的咨询师</Text>
          <View className='cta-btn' onClick={() => Taro.switchTab({ url: '/pages/index/index' })}>
            <Text className='cta-text'>去发现咨询师</Text>
          </View>
        </View>
      ) : (
        <ScrollView scrollY className='fav-list'>
          {list.map(c => (
            <View
              key={c.id}
              className='fav-card'
              onClick={() => Taro.navigateTo({ url: `/pages/counselor-detail/index?id=${c.id}` })}
            >
              <View className='fav-left'>
                {c.avatarUrl
                  ? <Image src={c.avatarUrl} className='fav-avatar' mode='aspectFill' />
                  : (
                    <View className='fav-avatar-placeholder'>
                      <Text className='fav-initial'>{c.displayName?.[0]}</Text>
                    </View>
                  )
                }
                <View className='fav-info'>
                  <Text className='fav-name'>{c.displayName}</Text>
                  <Text className='fav-title'>{c.title}</Text>
                  <Text className='fav-price'>¥{c.pricePerSession}/{c.sessionDuration}分钟</Text>
                </View>
              </View>
              <View
                className='remove-btn'
                onClick={(e) => { e.stopPropagation?.(); handleRemove(c.id) }}
              >
                <Text className='remove-icon'>♥</Text>
              </View>
            </View>
          ))}
          <View className='list-bottom' />
        </ScrollView>
      )}
    </View>
  )
}
