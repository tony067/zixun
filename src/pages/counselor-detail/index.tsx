import React, { useState, useEffect } from 'react';
import { View, Text, Image, Button, ScrollView } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import styles from './index.module.scss';
import { fetchCounselorDetail, addFavorite, removeFavorite, fetchFavorites } from '@/services/api';
import { useUserStore } from '@/stores/user';
import type { Counselor, PricingOption } from '@/types/counselor';
import { getNextDays, generateMockSlots, WEEKDAY_LABELS } from '@/types/counselor';
import Icon from '@/components/Icon';

const TAG_COLORS = [
  { bg: '#EAF5E4', text: '#4A7A36' },
  { bg: '#FEF3E2', text: '#C86800' },
  { bg: '#EAF1FF', text: '#3060C0' },
  { bg: '#FDE8F8', text: '#A030A0' },
  { bg: '#F0EBF8', text: '#7030B8' },
  { bg: '#E5F7F0', text: '#207860' }
];

function toStrings(arr?: (string | { id: string; value: string })[] | null): string[] {
  if (!arr) return [];
  return arr.map((x) => {
    if (typeof x !== 'string') return x.value;
    try {
      const parsed = JSON.parse(x);
      if (parsed && typeof parsed === 'object' && 'value' in parsed) return String(parsed.value);
    } catch {
    }
    return x;
  }).filter(Boolean);
}

const CounselorDetailPage: React.FC = () => {
  const router = useRouter();
  const { isLoggedIn, user } = useUserStore();
  const [counselor, setCounselor] = useState<Counselor | null>(null);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [savingFavorite, setSavingFavorite] = useState(false);

  useEffect(() => {
    const { id } = router.params || {};
    if (id) {
      loadCounselor(id);
    }
  }, [router.params]);

  useEffect(() => {
    const { id } = router.params || {};
    if (id) {
      loadFavoriteStatus(id);
    }
  }, [router.params, isLoggedIn]);

  const loadCounselor = async (id: string) => {
    try {
      setLoading(true);
      const data = await fetchCounselorDetail(id);
      setCounselor(data);
    } catch (err) {
      console.error('[CounselorDetail] 加载失败', err);
    } finally {
      setLoading(false);
    }
  };

  const loadFavoriteStatus = async (id: string) => {
    if (!isLoggedIn) {
      const ids: string[] = JSON.parse(Taro.getStorageSync('favorite_counselors') || '[]');
      setSaved(ids.includes(id));
      return;
    }

    try {
      const favs = await fetchFavorites();
      setSaved(favs.some(c => c.id === id));
    } catch {
      const ids: string[] = JSON.parse(Taro.getStorageSync('favorite_counselors') || '[]');
      setSaved(ids.includes(id));
    }
  };

  const handleBook = () => {
    if (!counselor || !counselor.isAccepting) return;
    Taro.navigateTo({
      url: `/pages/booking-flow/index?id=${counselor.id}`
    });
  };

  const handleSave = async () => {
    const { id } = router.params || {};
    if (!id || !counselor) return;

    if (!isLoggedIn) {
      Taro.navigateTo({ url: '/pages/login/index' });
      return;
    }

    if (savingFavorite) return;

    const nextSaved = !saved;
    setSavingFavorite(true);
    setSaved(nextSaved);

    try {
      if (nextSaved) {
        await addFavorite(id);
      } else {
        await removeFavorite(id);
      }

      const ids: string[] = JSON.parse(Taro.getStorageSync('favorite_counselors') || '[]');
      const nextIds = nextSaved
        ? Array.from(new Set([...ids, id]))
        : ids.filter(i => i !== id);
      Taro.setStorageSync('favorite_counselors', JSON.stringify(nextIds));

      Taro.showToast({
        title: nextSaved ? '已收藏' : '已取消收藏',
        icon: 'none'
      });
    } catch (err) {
      console.error('[CounselorDetail] 收藏操作失败', err);
      setSaved(!nextSaved);
      Taro.showToast({ title: '操作失败，请重试', icon: 'none' });
    } finally {
      setSavingFavorite(false);
    }
  };

  const handleShare = () => {
    Taro.showToast({ title: '分享功能开发中', icon: 'none' });
  };

  const handleMessage = () => {
    if (!isLoggedIn) {
      Taro.navigateTo({ url: '/pages/login/index' });
      return;
    }
    Taro.navigateTo({ url: '/pages/messages/index' });
  };

  const getPricingDisplayName = (opt: PricingOption, index: number) => {
    if (opt.name === '__custom__') {
      return opt.customName || `方案 ${index + 1}`;
    }
    return opt.name || `方案 ${index + 1}`;
  };

  if (loading) {
    return (
      <View className={styles.container}>
        <Text style={{ textAlign: 'center', paddingTop: '100rpx', color: '#9B8E82' }}>加载中...</Text>
      </View>
    );
  }

  if (!counselor) {
    return (
      <View className={styles.container}>
        <Text style={{ textAlign: 'center', paddingTop: '100rpx', color: '#9B8E82' }}>咨询师不存在</Text>
      </View>
    );
  }

  const roleTags = [...counselor.counselorTypes];
  if (counselor.isSupervisor && !roleTags.includes('督导')) {
    roleTags.push('督导');
  }

  const ql = toStrings(counselor.qualifications);
  const ed = toStrings(counselor.education);
  const tr = toStrings(counselor.trainings);
  const we = toStrings(counselor.workExperiences);
  const hasBackground = ql.length || ed.length || tr.length || we.length;

  const days7 = getNextDays(7);
  const slots = generateMockSlots(days7);

  const availableDays = days7.filter(d => {
    const key = d.toISOString().slice(0, 10);
    return (slots[key] || []).some(s => s.available);
  });

  return (
    <View className={styles.container}>
      <View className={styles.header}>
        <View className={styles.backButton} onClick={() => Taro.navigateBack()}>
          <Text className={styles.backIcon}>‹</Text>
        </View>
      </View>

      <ScrollView scrollY className={styles.scrollContent}>
        <View className={styles.profileSection}>
          <View className={styles.avatarWrapper}>
            {counselor.avatarUrl ? (
              <Image className={styles.avatar} src={counselor.avatarUrl} mode="aspectFill" />
            ) : (
              <Text className={styles.avatarText}>{counselor.displayName.charAt(0)}</Text>
            )}
          </View>

          <Text className={styles.name}>{counselor.displayName}</Text>

          {roleTags.length > 0 && (
            <View className={styles.tagRow}>
              {roleTags.map((tag, idx) => {
                const colors = TAG_COLORS[idx % TAG_COLORS.length];
                return (
                  <Text
                    key={tag}
                    className={styles.tag}
                    style={{ backgroundColor: colors.bg, color: colors.text }}
                  >
                    {tag}
                  </Text>
                );
              })}
            </View>
          )}

          {(counselor.totalHours > 0 || counselor.location) && (
            <View className={styles.metaInfo}>
              {counselor.totalHours > 0 && (
                <Text className={styles.metaItem}>累计咨询 {counselor.totalHours}+ 小时</Text>
              )}
              {counselor.location && (
                <Text className={styles.metaItem}>📍 {counselor.location}</Text>
              )}
            </View>
          )}
        </View>

        {counselor.tagline && (
          <View className={styles.taglineCard}>
            <Text className={styles.taglineQuote}>“</Text>
            <Text className={styles.taglineText}>{counselor.tagline}</Text>
            <Text className={styles.taglineQuoteRight}>”</Text>
          </View>
        )}

        {counselor.bio && (
          <View className={styles.section}>
            <Text className={styles.sectionTitle}>关于我</Text>
            <View className={styles.sectionContent}>
              {counselor.bio.split(/\n+/).filter(Boolean).map((paragraph, idx) => (
                <Text key={idx} className={styles.sectionParagraph}>{paragraph}</Text>
              ))}
            </View>
          </View>
        )}

        {counselor.specialties?.length > 0 && (
          <View className={styles.section}>
            <Text className={styles.sectionTitle}>擅长领域</Text>
            <View className={styles.tagGrid}>
              {counselor.specialties.map(specialty => (
                <Text key={specialty} className={styles.specialtyTag}>{specialty}</Text>
              ))}
            </View>
          </View>
        )}

        {counselor.workingGroups?.length > 0 && (
          <View className={styles.section}>
            <Text className={styles.sectionTitle}>工作人群</Text>
            <View className={styles.tagGrid}>
              {counselor.workingGroups.map(group => (
                <Text key={group} className={styles.specialtyTag}>{group}</Text>
              ))}
            </View>
          </View>
        )}

        {counselor.approaches?.length > 0 && (
          <View className={styles.section}>
            <Text className={styles.sectionTitle}>咨询取向</Text>
            <View className={styles.tagGrid}>
              {counselor.approaches.map(approach => (
                <Text key={approach} className={styles.specialtyTag}>{approach}</Text>
              ))}
            </View>
          </View>
        )}

        <View className={styles.section}>
          <Text className={styles.sectionTitle}>咨询设置</Text>
          
          {counselor.pricingOptions && counselor.pricingOptions.length > 0 ? (
            <View className={styles.pricingSection}>
              {counselor.pricingOptions.map((opt, idx) => (
                <View key={opt.id} className={styles.pricingOption}>
                  <View className={styles.pricingHeader}>
                    <Text className={styles.pricingName}>{getPricingDisplayName(opt, idx)}</Text>
                    <Text className={styles.pricingPrice}>¥{opt.price}</Text>
                  </View>
                  <View className={styles.pricingDetails}>
                    <Text className={styles.pricingDetail}>{opt.duration} 分钟</Text>
                    <Text className={styles.pricingDetail}>× {opt.sessions} 次</Text>
                    {opt.sessions > 1 && (
                      <Text className={styles.pricingAverage}>约 ¥{Math.round(opt.price / opt.sessions)}/次</Text>
                    )}
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <View className={styles.infoGrid}>
              <View className={styles.infoCard}>
                <Text className={styles.infoIcon}>⏱</Text>
                <Text className={styles.infoValue}>{counselor.sessionDuration}</Text>
                <Text className={styles.infoLabel}>分钟 / 次</Text>
              </View>
              <View className={styles.infoCard}>
                <Text className={styles.infoIcon}>¥</Text>
                <Text className={styles.infoValue}>{counselor.pricePerSession}</Text>
                <Text className={styles.infoLabel}>每次费用</Text>
              </View>
              <View className={styles.infoCard}>
                <Text className={styles.infoIcon}>📹</Text>
                <Text className={styles.infoValue}>{counselor.sessionModes.map(m => m.replace('咨询', '')).join('/')}</Text>
                <Text className={styles.infoLabel}>咨询方式</Text>
              </View>
            </View>
          )}

          {counselor.languages?.length > 0 && (
            <Text className={styles.languageText}>接待语言：{counselor.languages.join('、')}</Text>
          )}
          {counselor.sessionSettings && (
            <View className={styles.sectionContent}>
              {counselor.sessionSettings.split(/\n+/).filter(Boolean).map((paragraph, idx) => (
                <Text key={idx} className={styles.sectionParagraph}>{paragraph}</Text>
              ))}
            </View>
          )}

          {!counselor.isAccepting && (
            <View className={styles.unavailableCard}>
              <Text className={styles.unavailableTitle}>已约满</Text>
              <Text className={styles.unavailableDesc}>咨询师当前暂停接受新的预约，暂不显示可预约时间。</Text>
            </View>
          )}

          {counselor.isAccepting && availableDays.length > 0 && (
            <View className={styles.timesList}>
              {availableDays.map(d => {
                const key = d.toISOString().slice(0, 10);
                const daySlots = (slots[key] || []).filter(s => s.available);
                return (
                  <View key={key} className={styles.timeDay}>
                    <Text className={styles.timeDayLabel}>
                      周{WEEKDAY_LABELS[d.getDay()]} {d.getMonth() + 1}/{d.getDate()}
                    </Text>
                    <View className={styles.timeSlots}>
                      {daySlots.map(slot => (
                        <View
                          key={slot.id}
                          className={styles.timeSlot}
                          onClick={handleBook}
                        >
                          <Text className={styles.timeSlotText}>{slot.start}–{slot.end}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                );
              })}
              <Button className={styles.quickBookButton} onClick={handleBook}>
                立即预约
              </Button>
            </View>
          )}

          {counselor.isAccepting && availableDays.length === 0 && (
            <View className={styles.noTimesCard}>
              <Text className={styles.noTimesText}>暂无可预约时段，可与咨询师协调时间</Text>
            </View>
          )}
        </View>

        {hasBackground && (
          <View className={styles.section}>
            <Text className={styles.sectionTitle}>从业背景</Text>
            {ql.length > 0 && (
              <>
                <Text className={styles.subTitle}>从业资质</Text>
                <View className={styles.bulletList}>
                  {ql.map((item, idx) => (
                    <View key={idx} className={styles.bulletItem}>
                      <View className={styles.bulletDot} />
                      <Text className={styles.bulletText}>{item}</Text>
                    </View>
                  ))}
                </View>
              </>
            )}
            {ed.length > 0 && (
              <>
                <Text className={styles.subTitle}>教育背景</Text>
                <View className={styles.bulletList}>
                  {ed.map((item, idx) => (
                    <View key={idx} className={styles.bulletItem}>
                      <View className={styles.bulletDot} />
                      <Text className={styles.bulletText}>{item}</Text>
                    </View>
                  ))}
                </View>
              </>
            )}
            {tr.length > 0 && (
              <>
                <Text className={styles.subTitle}>受训经历</Text>
                <View className={styles.bulletList}>
                  {tr.map((item, idx) => (
                    <View key={idx} className={styles.bulletItem}>
                      <View className={styles.bulletDot} />
                      <Text className={styles.bulletText}>{item}</Text>
                    </View>
                  ))}
                </View>
              </>
            )}
            {we.length > 0 && (
              <>
                <Text className={styles.subTitle}>工作经验</Text>
                <View className={styles.bulletList}>
                  {we.map((item, idx) => (
                    <View key={idx} className={styles.bulletItem}>
                      <View className={styles.bulletDot} />
                      <Text className={styles.bulletText}>{item}</Text>
                    </View>
                  ))}
                </View>
              </>
            )}
          </View>
        )}

        {counselor.sessionDescription && (
          <View className={styles.section}>
            <Text className={styles.sectionTitle}>咨询过程与方式</Text>
            <Text className={styles.sectionContent}>{counselor.sessionDescription}</Text>
          </View>
        )}
      </ScrollView>

      <View className={styles.bottomBar}>
        <View className={styles.actionButton} onClick={handleShare}>
          <Icon name="share" size={24} color="#9B8E82" />
          <Text className={styles.actionText}>分享</Text>
        </View>
        <View className={styles.actionButton} onClick={handleMessage}>
          <Icon name="message" size={24} color="#9B8E82" />
          <Text className={styles.actionText}>私信</Text>
        </View>
        <View 
          className={styles.actionButton} 
          onClick={handleSave}
          style={{ opacity: savingFavorite ? 0.7 : 1 }}
        >
          <Icon name="heart" size={24} color={saved ? '#FF6B6B' : '#9B8E82'} />
          <Text className={styles.actionText}>{saved ? '已收藏' : '收藏'}</Text>
        </View>
        <Button
          className={`${styles.bookButton} ${!counselor.isAccepting ? styles.bookButtonDisabled : ''}`}
          onClick={handleBook}
        >
          {counselor.isAccepting ? '预约咨询' : '已约满'}
        </Button>
      </View>
    </View>
  );
};

export default CounselorDetailPage;