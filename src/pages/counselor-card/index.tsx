import React, { useState, useEffect } from 'react';
import { View, Text, Image, Button, ScrollView } from '@tarojs/components';
import Taro, { useRouter, useShareAppMessage } from '@tarojs/taro';
import styles from './index.module.scss';
import { fetchCounselorDetail } from '@/services/api';
import Icon from '@/components/Icon';
import type { Counselor } from '@/types/counselor';

// 角色 pill 配色（对齐 web 名片页 ROLE_COLOR）
const ROLE_COLOR: Record<string, { bg: string; text: string; border: string }> = {
  '心理咨询师': { bg: '#E4F0DC', text: '#3A6228', border: '#CCE0C0' },
  'ADHD教练': { bg: '#FFF0E0', text: '#A05A20', border: '#F0CFA0' },
  '特教老师': { bg: '#E8E0F8', text: '#5030A0', border: '#C8B8F0' },
  '督导': { bg: '#FEF3E2', text: '#B07D2A', border: '#F0E0C0' },
  default: { bg: '#E8DFCC', text: '#5A7A3A', border: '#D4C8B0' }
};

const getRoleColor = (role: string) => ROLE_COLOR[role] || ROLE_COLOR.default;

const CounselorCardPage: React.FC = () => {
  const router = useRouter();
  const id = router.params?.id || '';
  const [counselor, setCounselor] = useState<Counselor | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }
    fetchCounselorDetail(id)
      .then(setCounselor)
      .catch((err) => console.error('[CounselorCard] 加载失败', err))
      .finally(() => setLoading(false));
  }, [id]);

  // 微信好友转发：标题 + 本名片页路径
  useShareAppMessage(() => ({
    title: counselor
      ? `推荐心理咨询师：${counselor.displayName}`
      : 'MindPace 咨询师名片',
    path: `/pages/counselor-card/index?id=${id}`
  }));

  const buildShareUrl = (): string => {
    if (process.env.TARO_ENV === 'h5' && typeof window !== 'undefined') {
      const base = window.location.href.split('#')[0];
      return `${base}#/pages/counselor-card/index?id=${id}`;
    }
    return `/pages/counselor-card/index?id=${id}`;
  };

  const handleCopyLink = () => {
    const url = buildShareUrl();
    if (process.env.TARO_ENV === 'h5' && navigator.clipboard) {
      navigator.clipboard.writeText(url);
    } else {
      Taro.setClipboardData({ data: url });
    }
    setCopied(true);
    Taro.showToast({ title: '链接已复制', icon: 'none' });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleBook = () => {
    if (!id) return;
    Taro.navigateTo({ url: `/pages/booking-flow/index?id=${id}` });
  };

  if (loading) {
    return (
      <View className={styles.container}>
        <View className={styles.loadingWrap}>
          <Text className={styles.loadingText}>加载中…</Text>
        </View>
      </View>
    );
  }

  if (!counselor) {
    return (
      <View className={styles.container}>
        <View className={styles.loadingWrap}>
          <Text className={styles.loadingText}>咨询师不存在</Text>
        </View>
      </View>
    );
  }

  const roleTags = [...counselor.counselorTypes];
  if (counselor.isSupervisor && !roleTags.includes('督导')) {
    roleTags.push('督导');
  }
  const specialties = (counselor.specialties || []).slice(0, 6);
  const groups = (counselor.workingGroups || []).slice(0, 6);
  const initials = counselor.displayName?.charAt(0) || '咨';
  const modeText = (counselor.sessionModes || [])
    .map((m) => m.replace('咨询', ''))
    .filter(Boolean)
    .join('/');

  return (
    <View className={styles.container}>
      <ScrollView scrollY className={styles.scrollContent} enhanced showScrollbar={false}>
        {/* 名片大卡 */}
        <View className={styles.card}>
          {/* Banner */}
          <View className={styles.banner}>
            <View className={styles.decoCircleLarge} />
            <View className={styles.decoCircleSmall} />
            <View className={styles.decoCircleBottom} />
            <View className={styles.certBadge}>
              <View className={styles.certDot} />
              <Text className={styles.certText}>联盟认证咨询师</Text>
            </View>
            <View className={styles.avatarWrap}>
              {counselor.avatarUrl ? (
                <Image className={styles.avatar} src={counselor.avatarUrl} mode="aspectFill" />
              ) : (
                <Text className={styles.avatarText}>{initials}</Text>
              )}
            </View>
          </View>

          {/* 主体 */}
          <View className={styles.cardBody}>
            <Text className={styles.name}>{counselor.displayName}</Text>
            {counselor.title ? (
              <Text className={styles.title}>{counselor.title}</Text>
            ) : null}

            {roleTags.length > 0 && (
              <View className={styles.pillRow}>
                {roleTags.map((tag) => {
                  const c = getRoleColor(tag);
                  return (
                    <Text
                      key={tag}
                      className={styles.pill}
                      style={{ background: c.bg, color: c.text, border: `1rpx solid ${c.border}` }}
                    >
                      {tag}
                    </Text>
                  );
                })}
              </View>
            )}

            <View className={styles.divider} />

            {counselor.tagline ? (
              <View className={styles.taglineWrap}>
                <Text className={styles.taglineQuote}>“</Text>
                <Text className={styles.taglineText}>{counselor.tagline}</Text>
                <Text className={styles.taglineQuoteRight}>”</Text>
              </View>
            ) : null}

            {specialties.length > 0 && (
              <View className={styles.pillRow}>
                {specialties.map((s) => (
                  <Text key={s} className={styles.groupPill}>
                    {s}
                  </Text>
                ))}
              </View>
            )}

            {groups.length > 0 && (
              <View className={styles.pillRow}>
                {groups.map((g) => (
                  <Text key={g} className={styles.groupPill}>
                    {g}
                  </Text>
                ))}
              </View>
            )}

            {counselor.bio ? (
              <View className={styles.bioWrap}>
                {counselor.bio
                  .split(/\n+/)
                  .filter(Boolean)
                  .map((p, idx) => (
                    <Text key={idx} className={styles.bioText}>
                      {p}
                    </Text>
                  ))}
              </View>
            ) : null}

            <View className={styles.divider} />

            {/* 咨询方式 / 价格 */}
            <View className={styles.infoGrid}>
              <View className={styles.infoItem}>
                <Text className={styles.infoLabel}>咨询方式</Text>
                <Text className={styles.infoValue}>{modeText || '视频/语音'}</Text>
              </View>
              <View className={styles.infoItem}>
                <Text className={styles.infoLabel}>单次时长</Text>
                <Text className={styles.infoValue}>{counselor.sessionDuration || 50} 分钟</Text>
              </View>
              <View className={styles.infoItem}>
                <Text className={styles.infoLabel}>单次费用</Text>
                <Text className={styles.infoValue}>
                  ¥{counselor.pricePerSession || 0}
                </Text>
              </View>
            </View>

            {/* 品牌 + 分享提示（web 版此处为二维码，小程序以分享承载） */}
            <View className={styles.brandRow}>
              <View>
                <Text className={styles.brandName}>MINDPACE</Text>
                <Text className={styles.brandDesc}>神经多样性友好咨询平台</Text>
              </View>
              <View className={styles.shareTipWrap}>
                <Icon name="share" size={18} color="#3A6228" />
                <Text className={styles.shareTipText}>点下方分享 · 预约咨询</Text>
              </View>
            </View>
          </View>
        </View>

        {/* 底部操作 */}
        <View className={styles.actions}>
          {process.env.TARO_ENV === 'weapp' ? (
            <Button className={styles.shareButton} openType="share">
              <Icon name="share" size={16} color="#3A6228" />
              <Text className={styles.shareButtonText}>{copied ? '已复制' : '分享名片'}</Text>
            </Button>
          ) : (
            <View className={styles.shareButton} onClick={handleCopyLink}>
              <Icon name="share" size={16} color="#3A6228" />
              <Text className={styles.shareButtonText}>{copied ? '已复制' : '复制链接'}</Text>
            </View>
          )}
          <View className={styles.bookButton} onClick={handleBook}>
            <Text className={styles.bookButtonText}>预约咨询</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

export default CounselorCardPage;
