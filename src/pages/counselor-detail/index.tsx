import { useState, useEffect } from 'react'
import Taro, { useRouter } from '@tarojs/taro'
import { View, Text, Image, ScrollView } from '@tarojs/components'
import { getCounselorById, type Counselor } from '../../api'
import './index.scss'

const WEEKDAY = ['日','一','二','三','四','五','六']

function getAvailableDays() {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() + i + 1)
    const label = `周${WEEKDAY[d.getDay()]} ${d.getMonth()+1}/${d.getDate()}`
    const slots = i % 3 === 2 ? [] : i % 2 === 0 ? ['09:00','14:00','16:00'] : ['10:00','15:00']
    return { label, slots }
  }).filter(d => d.slots.length > 0)
}

function SectionTitle({ title }: { title: string }) {
  return (
    <View className='section-title-wrap'>
      <View className='section-dot' />
      <Text className='section-title-text'>{title}</Text>
    </View>
  )
}

function TagList({ tags, color = '#3A6228', bg = '#F0F7EC', borderColor = '#D8ECCC' }: {
  tags: string[]; color?: string; bg?: string; borderColor?: string
}) {
  if (!tags?.length) return null
  return (
    <View className='tag-list'>
      {tags.map(t => (
        <View key={t} className='tag-item' style={{ background: bg, borderColor }}>
          <Text className='tag-item-text' style={{ color }}>{t}</Text>
        </View>
      ))}
    </View>
  )
}

export default function CounselorDetailPage() {
  const router = useRouter()
  const { id } = router.params
  const [counselor, setCounselor] = useState<Counselor | null>(null)
  const [loading, setLoading] = useState(true)
  const [showTimes, setShowTimes] = useState(false)
  const availableDays = getAvailableDays()

  useEffect(() => {
    if (!id) return
    getCounselorById(id)
      .then(d => setCounselor(d))
      .catch(() => setCounselor(null))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <View className='detail-page loading-page'>
        <View className='loading-text'><Text>加载中…</Text></View>
      </View>
    )
  }

  if (!counselor) {
    return (
      <View className='detail-page'>
        <View className='error-state'><Text>咨询师信息不存在</Text></View>
      </View>
    )
  }

  const c = counselor as any

  return (
    <ScrollView scrollY className='detail-page'>
      {/* 顶部信息卡 */}
      <View className='hero-card'>
        <View className='hero-header'>
          <View className='hero-avatar-wrap'>
            {c.avatarUrl
              ? <Image src={c.avatarUrl} className='hero-avatar' mode='aspectFill' />
              : (
                <View className='hero-avatar-placeholder'>
                  <Text className='hero-initial'>{c.displayName?.[0] || '咨'}</Text>
                </View>
              )
            }
            {c.isAccepting && <View className='hero-accepting'><Text className='hero-accepting-text'>接受预约</Text></View>}
          </View>

          <View className='hero-info'>
            <View className='hero-name-row'>
              <Text className='hero-name'>{c.displayName}</Text>
              {c.isSupervisor && (
                <View className='supervisor-badge'>
                  <Text className='supervisor-text'>督导</Text>
                </View>
              )}
            </View>
            <Text className='hero-title'>{c.title}</Text>
            <Text className='hero-location'>📍 {c.location}</Text>
          </View>
        </View>

        {/* 数据统计 */}
        <View className='stats-row'>
          <View className='stat-item'>
            <Text className='stat-num'>⭐ {c.rating?.toFixed(1) || '—'}</Text>
            <Text className='stat-label'>评分</Text>
          </View>
          <View className='stat-divider' />
          <View className='stat-item'>
            <Text className='stat-num'>{c.totalHours || 0}</Text>
            <Text className='stat-label'>咨询小时</Text>
          </View>
          <View className='stat-divider' />
          <View className='stat-item'>
            <Text className='stat-num'>¥{c.pricePerSession}</Text>
            <Text className='stat-label'>/{c.sessionDuration}分钟</Text>
          </View>
        </View>

        {/* 标签行 */}
        <TagList tags={c.counselorTypes || []} />
      </View>

      {/* 金句 */}
      {c.tagline && (
        <View className='tagline-card'>
          <Text className='tagline-quote'>"</Text>
          <Text className='tagline-text'>{c.tagline}</Text>
        </View>
      )}

      {/* 内容区 */}
      <View className='content-sections'>

        {/* 关于我 */}
        {c.bio && (
          <View className='section-block'>
            <SectionTitle title='关于我' />
            <Text className='section-body'>{c.bio}</Text>
          </View>
        )}

        {/* 擅长领域 */}
        {c.specialties?.length > 0 && (
          <View className='section-block'>
            <SectionTitle title='擅长领域' />
            <TagList tags={c.specialties} />
          </View>
        )}

        {/* 咨询方向 */}
        {c.approaches?.length > 0 && (
          <View className='section-block'>
            <SectionTitle title='咨询取向' />
            <TagList tags={c.approaches} color='#3060C0' bg='#EAF1FF' borderColor='#C4D8FF' />
          </View>
        )}

        {/* 服务人群 */}
        {c.workingGroups?.length > 0 && (
          <View className='section-block'>
            <SectionTitle title='服务人群' />
            <TagList tags={c.workingGroups} color='#A030A0' bg='#FDE8F8' borderColor='#F0C4F0' />
          </View>
        )}

        {/* 咨询方式 */}
        {c.sessionModes?.length > 0 && (
          <View className='section-block'>
            <SectionTitle title='咨询方式' />
            <TagList tags={c.sessionModes} color='#C86800' bg='#FEF3E2' borderColor='#FFD9A0' />
          </View>
        )}

        {/* 可预约时间 */}
        <View className='section-block'>
          <View className='times-toggle' onClick={() => setShowTimes(!showTimes)}>
            <SectionTitle title='可预约时间' />
            <Text className='times-arrow'>{showTimes ? '▲' : '▼'}</Text>
          </View>
          {showTimes && (
            <View className='times-content'>
              {availableDays.length === 0
                ? <Text className='no-times'>暂无可预约时段</Text>
                : availableDays.map(day => (
                  <View key={day.label} className='day-block'>
                    <Text className='day-label'>{day.label}</Text>
                    <View className='slots-row'>
                      {day.slots.map(slot => (
                        <View
                          key={slot}
                          className='slot-btn'
                          onClick={() => Taro.navigateTo({ url: `/pages/booking/index?id=${id}` })}
                        >
                          <Text className='slot-text'>{slot}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                ))
              }
            </View>
          )}
        </View>

      </View>

      {/* 底部操作栏 */}
      <View className='bottom-bar'>
        <View
          className='msg-btn'
          onClick={() => Taro.navigateTo({ url: `/pages/chat/index?counselorId=${id}` })}
        >
          <Text className='msg-btn-text'>💬 私信</Text>
        </View>
        <View
          className='book-btn'
          onClick={() => Taro.navigateTo({ url: `/pages/booking/index?id=${id}` })}
        >
          <Text className='book-btn-text'>立即预约</Text>
        </View>
      </View>

      <View className='page-bottom' />
    </ScrollView>
  )
}
