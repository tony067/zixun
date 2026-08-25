import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, Input, ScrollView, Swiper, SwiperItem } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import CategoryGrid, { type Category } from '@/components/CategoryGrid';
import CounselorCard from '@/components/CounselorCard';
import CustomTabBar from '@/custom-tab-bar';
import { fetchCounselors } from '@/services/api';
import { getGreeting } from '@/utils/date';
import { useUserStore } from '@/stores/user';
import {
  categoryOptions,
  provinceOptions,
  priceOptions,
  directionOptions,
  GUIDE_SECTIONS
} from '@/data/counselors';
import type { Counselor } from '@/types/counselor';
import Icon from '@/components/Icon';

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

const timeOptions = ['上午（9-12时）', '下午（12-18时）', '晚上（18时以后）'];
const genderOptions = ['不限', '女性咨询师', '男性咨询师'];
const modeOptions = ['视频', '语音', '面谈'];

const IndexPage: React.FC = () => {
  const { user, isLoggedIn } = useUserStore();
  const [counselors, setCounselors] = useState<Counselor[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [filterCity, setFilterCity] = useState('');
  const [filterPrice, setFilterPrice] = useState('');
  const [filterDir, setFilterDir] = useState<string[]>([]);
  const [filterTime, setFilterTime] = useState('');
  const [filterGender, setFilterGender] = useState('');
  const [filterMode, setFilterMode] = useState<string[]>([]);
  const [searchKeyword, setSearchKeyword] = useState('');

  const [showFilter, setShowFilter] = useState(false);
  const [filterTab, setFilterTab] = useState<string | null>(null);
  const [showMoreProvinces, setShowMoreProvinces] = useState(false);
  const [openModal, setOpenModal] = useState<'guide' | null>(null);

  const handleLoginClick = () => {
    Taro.navigateTo({ url: '/pages/login/index' });
  };

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
      setCounselors([]);
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

      if (filterCity && filterCity !== '全国/线上') {
        if (!item.location.includes(filterCity)) {
          return false;
        }
      }

      if (filterDir.length > 0) {
        const hasDir = filterDir.some(d => item.specialties.includes(d) || item.counselorTypes.includes(d));
        if (!hasDir) return false;
      }

      if (filterPrice && filterPrice !== '不限') {
        if (filterPrice === '300 以下' && item.pricePerSession >= 300) return false;
        if (filterPrice === '300－500' && (item.pricePerSession < 300 || item.pricePerSession > 500)) return false;
        if (filterPrice === '500 以上' && item.pricePerSession <= 500) return false;
      }

      if (filterTime) {
        if (!item.isAccepting) return false;
      }

      if (filterGender && filterGender !== '不限') {
        const gender = (item.gender || '').toLowerCase();
        if (filterGender === '女性咨询师' && gender !== 'female' && gender !== '女') return false;
        if (filterGender === '男性咨询师' && gender !== 'male' && gender !== '男') return false;
      }

      if (filterMode.length > 0) {
        const hasMode = filterMode.some(m => item.sessionModes.includes(m));
        if (!hasMode) return false;
      }

      return true;
    });
  }, [counselors, searchKeyword, selectedCategory, filterCity, filterPrice, filterDir, filterTime, filterGender, filterMode]);

  const activeFilterCount = (filterCity && filterCity !== '全国/线上' ? 1 : 0)
    + (filterPrice && filterPrice !== '不限' ? 1 : 0)
    + (filterTime ? 1 : 0)
    + (filterGender && filterGender !== '不限' ? 1 : 0)
    + filterDir.length
    + filterMode.length;

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

  const handleClearFilters = () => {
    setSelectedCategory('');
    setSearchKeyword('');
    setFilterCity('');
    setFilterPrice('');
    setFilterDir([]);
    setFilterTime('');
    setFilterGender('');
    setFilterMode([]);
    setShowFilter(false);
    setShowMoreProvinces(false);
  };

  const applyFilters = () => {
    setShowFilter(false);
  };

  return (
    <View className={styles.container}>
      <ScrollView scrollY className={styles.scrollView}>
        <View className={styles.topBar}>
          <View className={styles.userInfo}>
            <Text className={styles.greeting}>
              {getGreeting()}{isLoggedIn && user?.name ? ` ${user.name}` : ''}
            </Text>
            <Text className={styles.brand}>MindPace</Text>
          </View>
          <View className={styles.topActions}>
            <View className={styles.guideButton} onClick={() => setOpenModal('guide')}>
              <Icon name="book" size={20} color="#9B8E82" />
              <Text className={styles.guideText}>新手必读</Text>
            </View>
            {isLoggedIn ? (
              <View className={styles.noticeButton}>
                <Icon name="bell" size={20} color="#9B8E82" />
                <View className={styles.noticeBadge}>
                  <Text className={styles.noticeBadgeText}>5</Text>
                </View>
              </View>
            ) : (
              <View className={styles.loginButton} onClick={handleLoginClick}>
                <Text className={styles.loginButtonText}>登录</Text>
              </View>
            )}
          </View>
        </View>

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

        <View className={styles.searchSection}>
          <View className={styles.searchBox}>
            <Icon name="search" size={20} color="#9B8E82" />
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

        <View className={styles.categorySection}>
          <CategoryGrid
            categories={categoryOptions as Category[]}
            selectedId={selectedCategory}
            onSelect={id => setSelectedCategory(selectedCategory === id ? '' : id)}
          />
        </View>

        <View className={styles.filterBar}>
          {[
            { key: 'city', label: filterCity || '地区', active: !!filterCity },
            { key: 'price', label: filterPrice || '价格', active: !!filterPrice },
            { key: 'direction', label: filterDir.length ? `方向(${filterDir.length})` : '咨询方向', active: filterDir.length > 0 },
          ].map(f => (
            <View
              key={f.key}
              className={`${styles.filterItem} ${f.active ? styles.filterActive : ''}`}
              onClick={() => {
                setFilterTab(f.key);
                setShowFilter(true);
              }}
            >
              <Text className={styles.filterText}>{f.label}</Text>
              <Text className={styles.filterArrow}>›</Text>
            </View>
          ))}
          {(selectedCategory || activeFilterCount > 0 || searchKeyword) && (
            <View className={styles.filterClear} onClick={handleClearFilters}>
              <Text className={styles.filterClearText}>清除</Text>
            </View>
          )}
          <View
            className={`${styles.filterFunnel} ${activeFilterCount > 0 ? styles.filterActive : ''}`}
            onClick={() => {
              setFilterTab(null);
              setShowFilter(true);
            }}
          >
            <Icon name="filter" size={20} color={activeFilterCount > 0 ? '#9CB48A' : '#9B8E82'} />
          </View>
        </View>

        <View className={styles.listSection}>
          {loading ? (
            <Text className={styles.loading}>正在加载...</Text>
          ) : filteredCounselors.length === 0 ? (
            <View className={styles.emptyState}>
              <Text className={styles.emptyText}>暂无匹配的咨询师</Text>
              <Text className={styles.emptyAction} onClick={handleClearFilters}>清除筛选</Text>
            </View>
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

      {openModal === 'guide' && (
        <View className={styles.modalOverlay} onClick={() => setOpenModal(null)}>
          <View className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <View className={styles.modalHeader}>
              <View className={styles.modalHandle} />
              <Text className={styles.modalTitle}>新手必读</Text>
              <View className={styles.modalClose} onClick={() => setOpenModal(null)}>
                <Text className={styles.modalCloseText}>×</Text>
              </View>
            </View>
            <ScrollView scrollY className={styles.modalBody}>
              <View className={styles.guideContent}>
                {GUIDE_SECTIONS.map((section, idx) => (
                  <View key={idx} className={styles.guideItem}>
                    <View className={styles.guideNumber}>{idx + 1}</View>
                    <View className={styles.guideInfo}>
                      <Text className={styles.guideTitle}>{section.title}</Text>
                      <Text className={styles.guideDesc}>{section.content}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </ScrollView>
          </View>
        </View>
      )}

      {showFilter && (
        <View className={styles.modalOverlay} onClick={() => setShowFilter(false)}>
          <View className={styles.filterPanel} onClick={e => e.stopPropagation()}>
            <View className={styles.modalHandle} />
            <View className={styles.filterPanelHeader}>
              <Text className={styles.filterPanelTitle}>筛选</Text>
              <View className={styles.modalClose} onClick={() => setShowFilter(false)}>
                <Text className={styles.modalCloseText}>×</Text>
              </View>
            </View>
            <ScrollView scrollY className={styles.filterPanelBody}>
              {(filterTab === null || filterTab === 'city') && (
                <View className={styles.filterSection}>
                  <Text className={styles.filterSectionTitle}>地区</Text>
                  <View className={styles.optionWrap}>
                    {provinceOptions.slice(0, showMoreProvinces ? provinceOptions.length : 8).map(p => (
                      <View
                        key={p}
                        className={`${styles.optionItem} ${filterCity === p ? styles.optionActive : ''}`}
                        onClick={() => {
                          setFilterCity(filterCity === p ? '' : p);
                        }}
                      >
                        <Text className={styles.optionText}>{p}</Text>
                      </View>
                    ))}
                  </View>
                  {provinceOptions.length > 8 && (
                    <View className={styles.filterMore} onClick={() => setShowMoreProvinces(!showMoreProvinces)}>
                      <Text className={styles.filterMoreText}>{showMoreProvinces ? '收起' : '更多'}</Text>
                      <Text className={styles.filterMoreArrow}>›</Text>
                    </View>
                  )}
                </View>
              )}

              {(filterTab === null || filterTab === 'price') && (
                <View className={styles.filterSection}>
                  <Text className={styles.filterSectionTitle}>费用</Text>
                  <View className={styles.optionWrap}>
                    {priceOptions.map(p => (
                      <View
                        key={p}
                        className={`${styles.optionItem} ${filterPrice === p ? styles.optionActive : ''}`}
                        onClick={() => {
                          setFilterPrice(filterPrice === p ? '' : p);
                        }}
                      >
                        <Text className={styles.optionText}>{p}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {filterTab === null && (
                <>
                  <View className={styles.filterSection}>
                    <Text className={styles.filterSectionTitle}>可选时间</Text>
                    <View className={styles.optionWrap}>
                      {timeOptions.map(t => (
                        <View
                          key={t}
                          className={`${styles.optionItem} ${filterTime === t ? styles.optionActive : ''}`}
                          onClick={() => {
                            setFilterTime(filterTime === t ? '' : t);
                          }}
                        >
                          <Text className={styles.optionText}>{t}</Text>
                        </View>
                      ))}
                    </View>
                  </View>

                  <View className={styles.filterSection}>
                    <Text className={styles.filterSectionTitle}>性别偏好</Text>
                    <View className={styles.optionWrap}>
                      {genderOptions.map(g => (
                        <View
                          key={g}
                          className={`${styles.optionItem} ${filterGender === g ? styles.optionActive : ''}`}
                          onClick={() => {
                            setFilterGender(filterGender === g ? '' : g);
                          }}
                        >
                          <Text className={styles.optionText}>{g}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                </>
              )}

              {(filterTab === null || filterTab === 'direction') && (
                <View className={styles.filterSection}>
                  <Text className={styles.filterSectionTitle}>咨询方向</Text>
                  <View className={styles.optionWrap}>
                    {directionOptions.map(d => (
                      <View
                        key={d}
                        className={`${styles.optionItem} ${filterDir.includes(d) ? styles.optionActive : ''}`}
                        onClick={() => {
                          setFilterDir(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d]);
                        }}
                      >
                        <Text className={styles.optionText}>{d}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {filterTab === null && (
                <View className={styles.filterSection}>
                  <Text className={styles.filterSectionTitle}>咨询方式</Text>
                  <View className={styles.optionWrap}>
                    {modeOptions.map(m => (
                      <View
                        key={m}
                        className={`${styles.optionItem} ${filterMode.includes(m) ? styles.optionActive : ''}`}
                        onClick={() => {
                          setFilterMode(prev => prev.includes(m) ? prev.filter(x => x !== m) : [...prev, m]);
                        }}
                      >
                        <Text className={styles.optionText}>{m}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
            </ScrollView>
            <View className={styles.filterPanelFooter}>
              <View className={styles.filterPanelButton} onClick={handleClearFilters}>
                <Text className={styles.filterPanelButtonText}>清除全部</Text>
              </View>
              <View className={styles.filterPanelButtonPrimary} onClick={applyFilters}>
                <Text className={styles.filterPanelButtonPrimaryText}>应用筛选</Text>
              </View>
            </View>
          </View>
        </View>
      )}
      <CustomTabBar />
    </View>
  );
};

export default IndexPage;