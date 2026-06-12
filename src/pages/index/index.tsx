import { useState, useEffect } from 'react'
import Taro from '@tarojs/taro'
import { View, Text, Input, ScrollView, Image } from '@tarojs/components'
import { getCounselors, type Counselor } from '../../api'
import './index.scss'

const CATEGORY_GRID = [
  { id: '心理咨询师', label: '心理\n咨询师', bg: '#EAF5E4', color: '#4A7A36' },
  { id: 'ADHD',       label: 'ADHD',        bg: '#FEF3E2', color: '#C86800' },
  { id: 'ASD',        label: 'ASD',         bg: '#EAF1FF', color: '#3060C0' },
  { id: '2天内',      label: '2天内\n可约',  bg: '#F8F6F0', color: '#999'   },
  { id: 'ADHD教练',   label: 'ADHD\n教练',   bg: '#FDE8F8', color: '#A030A0' },
  { id: '特教老师',   label: '特教\n老师',   bg: '#E8F5FF', color: '#206080' },
  { id: '本周',       label: '本周\n可约',   bg: '#F8F6F0', color: '#999'   },
  { id: '督导',       label: '督导',         bg: '#FFF3EA', color: '#B84A00' },
]

const SORT_OPTIONS = [
  { id: 'rating', label: '综合评分' },
  { id: 'price_asc', label: '价格从低' },
  { id: 'price_desc', label: '价格从高' },
  { id: 'hours', label: '经验最丰富' },
]

function CounselorCard({ item }: { item: Counselor }) {
  return (
    <View
      className='counselor-card'
      onClick={() => Taro.navigateTo({ url: `/pages/counselor-detail/index?id=${item.id}` })}
    >
      <View className='card-header'>
        <View className='avatar-wrap'>
          {item.avatarUrl
            ? <Image src={item.avatarUrl} className='avatar' mode='aspectFill' />
            : <View className='avatar-placeholder'><Text className='avatar-initial'>{item.displayName?.[0] || '咨'}</Text></View>
          }
          {item.isAccepting && <View className='accepting-dot' />}
        </View>
        <View className='card-info'>
          <View className='name-row'>
            <Text className='name'>{item.displayName}</Text>
            {item.isSupervisor && <View className='supervisor-badge'><Text className='supervisor-text'>督导</Text></View>}
          </View>
          <Text className='title'>{item.title}</Text>
          <Text className='location'>{item.location}</Text>
        </View>
        <View className='price-col'>
          <Text className='price'>¥{item.pricePerSession}</Text>
          <Text className='price-sub'>/{item.sessionDuration}分钟</Text>
        </View>
      </View>

      <Text className='bio' numberOfLines={2}>{item.bio}</Text>

      <View className='tags-row'>
        {(item.specialties || []).slice(0, 3).map(s => (
          <View key={s} className='tag'><Text className='tag-text'>{s}</Text></View>
        ))}
      </View>

      <View className='card-footer'>
        <View className='stats-row'>
          <Text className='stat-text'>⭐ {item.rating?.toFixed(1) || '—'}</Text>
          <Text className='stat-sep'>·</Text>
          <Text className='stat-text'>{item.totalHours || 0}小时</Text>
        </View>
        <View className='session-modes'>
          {(item.sessionModes || []).map(m => (
            <Text key={m} className='mode-tag'>{m}</Text>
          ))}
        </View>
      </View>
    </View>
  )
}

function SkeletonCard() {
  return (
    <View className='skeleton-card'>
      <View className='skeleton-row'>
        <View className='skeleton-avatar' />
        <View className='skeleton-lines'>
          <View className='skeleton-line w60' />
          <View className='skeleton-line w40' />
          <View className='skeleton-line w30' />
        </View>
      </View>
      <View className='skeleton-line w100' />
      <View className='skeleton-line w80' />
    </View>
  )
}

export default function ExplorePage() {
  const [counselors, setCounselors] = useState<Counselor[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState('rating')
  const [showSort, setShowSort] = useState(false)

  useEffect(() => {
    loadCounselors()
  }, [search])

  async function loadCounselors() {
    setLoading(true)
    try {
      const data = await getCounselors(search ? { search } : undefined)
      setCounselors(Array.isArray(data) ? data : [])
    } catch {
      setCounselors([])
    } finally {
      setLoading(false)
    }
  }

  const displayed = counselors.filter(c => {
    if (!activeCategory) return true
    if (activeCategory === '2天内' || activeCategory === '本周') return c.isAccepting
    if (activeCategory === 'ADHD教练') return c.counselorTypes?.includes('ADHD教练')
    if (activeCategory === '特教老师') return c.counselorTypes?.includes('特教老师')
    if (activeCategory === '督导') return c.isSupervisor
    return c.counselorTypes?.includes(activeCategory) || c.specialties?.includes(activeCategory)
  }).sort((a, b) => {
    if (sortBy === 'price_asc') return a.pricePerSession - b.pricePerSession
    if (sortBy === 'price_desc') return b.pricePerSession - a.pricePerSession
    if (sortBy === 'hours') return (b.totalHours || 0) - (a.totalHours || 0)
    return (b.rating || 0) - (a.rating || 0)
  })

  return (
    <View className='explore-page'>
      {/* 顶部搜索栏 */}
      <View className='search-bar'>
        <View className='search-inner'>
          <Text className='search-icon'>🔍</Text>
          <Input
            className='search-input'
            placeholder='搜索咨询师、擅长方向…'
            placeholderStyle='color:#C2BDB7'
            value={search}
            onInput={e => setSearch(e.detail.value)}
          />
          {search ? (
            <Text className='clear-btn' onClick={() => setSearch('')}>✕</Text>
          ) : null}
        </View>
      </View>

      {/* 分类 Grid */}
      <View className='category-grid'>
        {CATEGORY_GRID.map(cat => (
          <View
            key={cat.id}
            className={`category-cell ${activeCategory === cat.id ? 'active' : ''}`}
            style={{ background: activeCategory === cat.id ? cat.color : cat.bg }}
            onClick={() => setActiveCategory(activeCategory === cat.id ? null : cat.id)}
          >
            <Text
              className='category-label'
              style={{ color: activeCategory === cat.id ? '#fff' : cat.color }}
            >
              {cat.label}
            </Text>
          </View>
        ))}
      </View>

      {/* 筛选栏 */}
      <View className='filter-bar'>
        <Text className='result-count'>{loading ? '加载中…' : `${displayed.length} 位咨询师`}</Text>
        <View className='sort-btn' onClick={() => setShowSort(!showSort)}>
          <Text className='sort-label'>{SORT_OPTIONS.find(s => s.id === sortBy)?.label || '排序'}</Text>
          <Text className='sort-arrow'>{showSort ? '▲' : '▼'}</Text>
        </View>
      </View>

      {/* 排序下拉 */}
      {showSort && (
        <View className='sort-dropdown'>
          {SORT_OPTIONS.map(opt => (
            <View
              key={opt.id}
              className={`sort-option ${sortBy === opt.id ? 'selected' : ''}`}
              onClick={() => { setSortBy(opt.id); setShowSort(false) }}
            >
              <Text className='sort-option-text'>{opt.label}</Text>
              {sortBy === opt.id && <Text className='sort-check'>✓</Text>}
            </View>
          ))}
        </View>
      )}

      {/* 咨询师列表 */}
      <ScrollView scrollY className='counselor-list' enableFlex>
        {loading
          ? [1, 2, 3].map(i => <SkeletonCard key={i} />)
          : displayed.length === 0
            ? (
              <View className='empty-state'>
                <Text className='empty-icon'>🌿</Text>
                <Text className='empty-text'>暂无符合条件的咨询师</Text>
                <Text className='empty-sub'>试试调整筛选条件</Text>
              </View>
            )
            : displayed.map(c => <CounselorCard key={c.id} item={c} />)
        }
        <View className='list-bottom' />
      </ScrollView>
    </View>
  )
}
