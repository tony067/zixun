import React from 'react';
import { View, Text, Image, Button } from '@tarojs/components';
import styles from './index.module.scss';
import type { Counselor } from '@/types/counselor';

interface CounselorCardProps {
  counselor: Counselor;
  index?: number;
  onClick?: (counselor: Counselor) => void;
  onBook?: (counselor: Counselor, e: { stopPropagation: () => void }) => void;
}

const SPECIALTY_COLORS = [
  { bg: '#F5F5F0', text: '#7D736A' },
  { bg: '#F5F5F0', text: '#7D736A' },
  { bg: '#F5F5F0', text: '#7D736A' },
  { bg: '#F5F5F0', text: '#7D736A' },
  { bg: '#F5F5F0', text: '#7D736A' }
];

const TYPE_COLORS: Record<string, { bg: string; text: string }> = {
  '心理咨询师': { bg: '#EAF5E4', text: '#4A7A36' },
  'ADHD教练': { bg: '#FDE8F8', text: '#A030A0' },
  '特教老师': { bg: '#F0EBF8', text: '#7030B8' }
};

const AVATAR_BG = ['#E8C8C0', '#C8DEB8', '#C0D8E8', '#E8DECE', '#DDD0E8', '#F0E0C8'];

const CounselorCard: React.FC<CounselorCardProps> = ({ counselor, index = 0, onClick, onBook }) => {
  const getAvail = () => {
    if (!counselor.isAccepting) return null;
    const h = counselor.rating % 3;
    if (h === 0) return { label: '2 天内可约', color: '#4A7A36' };
    if (h === 1) return { label: '本周可约', color: '#C86800' };
    return { label: '可预约', color: '#9B8E82' };
  };

  const avail = getAvail();
  const avatarBg = AVATAR_BG[index % AVATAR_BG.length];
  const typeTag = counselor.counselorTypes[0] || '心理咨询师';
  const typeColor = TYPE_COLORS[typeTag] || { bg: '#F5F5F0', text: '#7D736A' };

  const handleBook = (e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    onBook?.(counselor, e);
  };

  return (
    <View className={styles.card} onClick={() => onClick?.(counselor)}>
      <View className={styles.mainRow}>
        <View className={styles.avatarWrapper} style={{ backgroundColor: avatarBg }}>
          {counselor.avatarUrl ? (
            <Image className={styles.avatar} src={counselor.avatarUrl} mode="aspectFill" />
          ) : (
            <Text className={styles.avatarText}>{counselor.displayName.charAt(0)}</Text>
          )}
        </View>
        <View className={styles.info}>
          <View className={styles.nameRow}>
            <Text className={styles.name}>{counselor.displayName}</Text>
            {avail && (
              <View className={styles.availRow}>
                <Text className={styles.availDot} style={{ backgroundColor: avail.color }} />
                <Text className={styles.avail} style={{ color: avail.color }}>
                  {avail.label}
                </Text>
              </View>
            )}
          </View>
          <View className={styles.metaRow}>
            <Text
              className={styles.typeTag}
              style={{ backgroundColor: typeColor.bg, color: typeColor.text }}
            >
              {typeTag}
            </Text>
            <Text className={styles.duration}>⏱ {counselor.sessionDuration} 分钟 / 次</Text>
          </View>
        </View>
      </View>

      <Text className={styles.bio}>{counselor.bio}</Text>

      <View className={styles.specialtyRow}>
        {counselor.specialties.slice(0, 5).map((specialty, idx) => {
          const colors = SPECIALTY_COLORS[idx % SPECIALTY_COLORS.length];
          return (
            <Text
              key={specialty}
              className={styles.specialtyTag}
              style={{ backgroundColor: colors.bg, color: colors.text }}
            >
              {specialty}
            </Text>
          );
        })}
      </View>

      <View className={styles.footer}>
        <View className={styles.priceRow}>
          <Text className={styles.price}>¥{counselor.pricePerSession}</Text>
          <Text className={styles.priceUnit}>/ 次</Text>
        </View>
        <Button className={styles.bookButton} onClick={handleBook}>
          预约咨询
        </Button>
      </View>
    </View>
  );
};

export default CounselorCard;
