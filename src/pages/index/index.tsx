import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, Input, ScrollView, Swiper, SwiperItem } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import CategoryGrid, { type Category } from '@/components/CategoryGrid';
import FilterBar, { type FilterOption } from '@/components/FilterBar';
import CounselorCard from '@/components/CounselorCard';
import { fetchCounselors } from '@/services/api';
import { getGreeting } from '@/utils/date';
import {
  mockCounselors,
  categoryOptions,
  provinceOptions,
  priceOptions,
  directionOptions
} from '@/data/counselors';
import type { Counselor } from '@/types/counselor';

const filters: FilterOption[] = [
  { key: 'province', label: '地区', options: provinceOptions },
  { key: 'price', label: '价格', options: priceOptions },
  { key: 'direction', label: '咨询方向', options: directionOptions }
];

const bannerList = [
  {
    badge: '联盟认证平台',
    title: '神经多样性友好',
    subtitle: '咨询师联盟',
    tags: ['专业培训认证', '按你的节奏', '安全支持空间']
  },
  {
    badge: 'ADHD 专项支持',
    title: '找到懂你的',
    subtitle: 'ADHD 咨询师',
    tags: ['成人 ADHD', '青少年 ADHD', '家长支持']
  },
  {
    badge: 'ASD 家庭支持',
    title: '温暖陪伴',
    subtitle: '每一个特别的孩子',
    tags: ['早期干预', '感觉统合', '融合教育']
  }
];

const IndexPage: React.FC = () => {
  const [counselors, setCounselors] = useState<Counselor[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [filterValues, setFilterValues] = useState<Record<string, string>>({
    province: provinceOptions[0],
    direction: directionOptions[0],
    price: priceOptions[0]
  });
  const [searchKeyword, setSearchKeyword] = useState('');

  useEffect(() => {
    loadCounselors();
  }, []);

  const loadCounselors = async () => {
    try {
      setLoading(true);
      const data = await fetchCounselors();
      setCounselors(data);
    } catch (err) {
      console.error('[Index] 加载咨询师失败', err);
      setCounselors(mockCounselors);
    } finally {
      setLoading(false);
    }
  };

  const filteredCounselors = useMemo(() => {
    return counselors.filter(item => {
      if (searchKeyword && !item.displayName.includes(searchKeyword) && !item.bio.includes(searchKeyword)) {
        return false;
      }

      if (selectedCategory) {
        if (selectedCategory === '2天内' || selectedCategory === '本周') {
          return item.isAccepting;
        }
        const matchType = item.counselorTypes.includes(selectedCategory);
        const matchSpecialty = item.specialties.includes(selectedCategory);
        const matchGroup = item.workingGroups?.includes(selectedCategory.replace('儿童青少年', '儿童/青少年'));
        if (!matchType && !matchSpecialty && !matchGroup) {
          return false;
        }
      }

      if (filterValues.province && filterValues.province !== '全国/线上') {
        if (!item.location.includes(filterValues.province)) {
          return false;
        }
      }

      if (filterValues.direction && filterValues.direction !== directionOptions[0]) {
        if (!item.specialties.includes(filterValues.direction) && !item.counselorTypes.includes(filterValues.direction)) {
          return false;
        }
      }

      if (filterValues.price && filterValues.price !== '不限') {
        if (filterValues.price === '300 以下' && item.pricePerSession >= 300) return false;
        if (filterValues.price === '300－500' && (item.pricePerSession < 300 || item.pricePerSession > 500)) return false;
        if (filterValues.price === '500 以上' && item.pricePerSession <= 500) return false;
      }

      return true;
    });
  }, [counselors, searchKeyword, selectedCategory, filterValues]);

  const handleCounselorClick = (counselor: Counselor) => {
    Taro.navigateTo({
      url: `/pages/counselor-detail/index?id=${counselor.id}`
    });
  };

  const handleBookClick = (counselor: Counselor, e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    Taro.navigateTo({
      url: `/pages/booking-flow/index?id=${counselor.id}`
    });
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilterValues(prev => ({ ...prev, [key]: value }));
  };

  return (
    <View className={styles.container}>
      <ScrollView scrollY className={styles.scrollView}>
        {/* 顶部登录信息 */}
        <View className={styles.topBar}>
          <View className={styles.userInfo}>
            <Text className={styles.greeting}>{getGreeting()} 511099828</Text>
            <Text className={styles.brand}>MindPace</Text>
          </View>
          <View className={styles.topActions}>
            <View className={styles.guideButton}>
              <Text className={styles.guideIcon}>📖</Text>
              <Text className={styles.guideText}>新手必读</Text>
            </View>
            <View className={styles.noticeButton}>
              <Text className={styles.noticeIcon}>🔔</Text>
              <View className={styles.noticeBadge}>
                <Text className={styles.noticeBadgeText}>5</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Banner */}
        <View className={styles.bannerSection}>
          <Swiper
            className={styles.bannerSwiper}
            indicatorColor="rgba(255,255,255,0.4)"
            indicatorActiveColor="#ffffff"
            circular
            autoplay
            indicatorDots
          >
            {bannerList.map((banner, idx) => (
              <SwiperItem key={idx}>
                <View className={styles.bannerCard}>
                  <View className={styles.bannerBadge}>
                    <Text className={styles.bannerBadgeDot} />
                    <Text className={styles.bannerBadgeText}>{banner.badge}</Text>
                  </View>
                  <View className={styles.bannerTitleGroup}>
                    <Text className={styles.bannerTitle}>{banner.title}</Text>
                    <Text className={styles.bannerTitle}>{banner.subtitle}</Text>
                  </View>
                  <View className={styles.bannerTags}>
                    {banner.tags.map(tag => (
                      <Text key={tag} className={styles.bannerTag}>{tag}</Text>
                    ))}
                  </View>
                </View>
              </SwiperItem>
            ))}
          </Swiper>
        </View>

        {/* 搜索框 */}
        <View className={styles.searchSection}>
          <View className={styles.searchBox}>
            <Text className={styles.searchIcon}>🔍</Text>
            <Input
              className={styles.searchInput}
              placeholder="搜索名字、擅长..."
              placeholderClass={styles.searchPlaceholder}
              value={searchKeyword}
              onInput={e => setSearchKeyword(e.detail.value)}
            />
          </View>
          <View className={styles.supervisorButton}>
            <Text className={styles.supervisorText}>预约督导</Text>
          </View>
        </View>

        {/* 快速分类 */}
        <View className={styles.categorySection}>
          <CategoryGrid
            categories={categoryOptions as Category[]}
            selectedId={selectedCategory}
            onSelect={id => setSelectedCategory(selectedCategory === id ? '' : id)}
          />
        </View>

        {/* 筛选栏 */}
        <FilterBar filters={filters} values={filterValues} onChange={handleFilterChange} />

        {/* 咨询师列表 */}
        <View className={styles.listSection}>
          {loading ? (
            <Text className={styles.loading}>正在加载...</Text>
          ) : (
            filteredCounselors.map((counselor, idx) => (
              <CounselorCard
                key={counselor.id}
                counselor={counselor}
                index={idx}
                onClick={handleCounselorClick}
                onBook={handleBookClick}
              />
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
};

export default IndexPage;
