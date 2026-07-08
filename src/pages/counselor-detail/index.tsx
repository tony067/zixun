import React, { useState, useEffect } from 'react';
import { View, Text, Image, Button } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import styles from './index.module.scss';
import { fetchCounselorDetail } from '@/services/api';
import type { Counselor } from '@/types/counselor';

const TAG_COLORS = [
  { bg: '#EAF5E4', text: '#4A7A36' },
  { bg: '#FEF3E2', text: '#C86800' },
  { bg: '#EAF1FF', text: '#3060C0' },
  { bg: '#FDE8F8', text: '#A030A0' },
  { bg: '#F0EBF8', text: '#7030B8' },
  { bg: '#E5F7F0', text: '#207860' }
];

const CounselorDetailPage: React.FC = () => {
  const router = useRouter();
  const [counselor, setCounselor] = useState<Counselor | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { id } = router.params || {};
    if (id) {
      loadCounselor(id);
    }
  }, [router.params]);

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

  const handleBook = () => {
    if (!counselor) return;
    Taro.navigateTo({
      url: `/pages/booking-flow/index?id=${counselor.id}`
    });
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

  return (
    <View className={styles.container}>
      <View className={styles.header}>
        <View className={styles.profileCard}>
          <View className={styles.profileHeader}>
            <View className={styles.avatarWrapper}>
              {counselor.avatarUrl ? (
                <Image className={styles.avatar} src={counselor.avatarUrl} mode="aspectFill" />
              ) : (
                <Text className={styles.avatarText}>{counselor.displayName.charAt(0)}</Text>
              )}
            </View>
            <View className={styles.profileMeta}>
              <Text className={styles.name}>{counselor.displayName}</Text>
              <Text className={styles.title}>{counselor.title}</Text>
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
            </View>
          </View>

          <Text className={styles.bio}>{counselor.bio}</Text>

          <View className={styles.infoGrid}>
            <View className={styles.infoItem}>
              <Text className={styles.infoValue}>¥{counselor.pricePerSession}</Text>
              <Text className={styles.infoLabel}>每次/{counselor.sessionDuration}分钟</Text>
            </View>
            <View className={styles.infoItem}>
              <Text className={styles.infoValue}>{counselor.totalHours}</Text>
              <Text className={styles.infoLabel}>咨询小时</Text>
            </View>
            <View className={styles.infoItem}>
              <Text className={styles.infoValue}>{counselor.rating}</Text>
              <Text className={styles.infoLabel}>评分</Text>
            </View>
          </View>
        </View>
      </View>

      <View className={styles.section}>
        <View className={styles.sectionCard}>
          <Text className={styles.sectionTitle}>擅长领域</Text>
          <View className={styles.specialtyGrid}>
            {counselor.specialties.map(specialty => (
              <Text key={specialty} className={styles.specialtyTag}>{specialty}</Text>
            ))}
          </View>
        </View>
      </View>

      <View className={styles.section}>
        <View className={styles.sectionCard}>
          <Text className={styles.sectionTitle}>服务信息</Text>
          <View className={styles.detailRow}>
            <Text className={styles.detailLabel}>咨询方式</Text>
            <Text className={styles.detailValue}>{counselor.sessionModes.join('、')}</Text>
          </View>
          <View className={styles.detailRow}>
            <Text className={styles.detailLabel}>所在地区</Text>
            <Text className={styles.detailValue}>{counselor.location}</Text>
          </View>
          <View className={styles.detailRow}>
            <Text className={styles.detailLabel}>工作人群</Text>
            <Text className={styles.detailValue}>{counselor.workingGroups?.join('、') || '成人、青少年'}</Text>
          </View>
          <View className={styles.detailRow}>
            <Text className={styles.detailLabel}>咨询取向</Text>
            <Text className={styles.detailValue}>{counselor.approaches?.join('、') || '综合取向'}</Text>
          </View>
        </View>
      </View>

      <View className={styles.bottomBar}>
        <View className={styles.priceInfo}>
          <Text className={styles.price}>¥{counselor.pricePerSession}</Text>
          <Text className={styles.priceUnit}>/次</Text>
        </View>
        <Button className={styles.bookButton} onClick={handleBook}>
          立即预约
        </Button>
      </View>
    </View>
  );
};

export default CounselorDetailPage;
