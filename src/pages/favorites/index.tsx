import React, { useState, useEffect } from 'react';
import { View, Text, Image } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import Icon from '@/components/Icon';
import { fetchFavorites, removeFavorite } from '@/services/api';
import type { Counselor } from '@/types/counselor';

const FavoritesPage: React.FC = () => {
  const [favorites, setFavorites] = useState<Counselor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!Taro.getStorageSync('token')) {
      Taro.redirectTo({ url: '/pages/login/index' });
      return;
    }
    loadFavorites();
  }, []);

  const loadFavorites = async () => {
    try {
      setLoading(true);
      const data = await fetchFavorites();
      setFavorites(data);
    } catch (err) {
      console.error('[Favorites] 加载收藏失败', err);
      setFavorites([]);
    } finally {
      setLoading(false);
    }
  };

  // 取消收藏：乐观移除，失败回滚
  const handleRemove = (id: string) => {
    const prev = favorites;
    setFavorites(list => list.filter(c => c.id !== id));
    removeFavorite(id).catch((err) => {
      console.error('[Favorites] 取消收藏失败', err);
      setFavorites(prev);
      Taro.showToast({ title: '取消收藏失败，请重试', icon: 'none' });
    });
  };

  const goCounselor = (id: string) => {
    Taro.navigateTo({ url: `/pages/counselor-detail/index?id=${id}` });
  };

  const goBooking = (id: string, e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    Taro.navigateTo({ url: `/pages/booking-flow/index?id=${id}` });
  };

  const goHome = () => {
    Taro.switchTab({ url: '/pages/index/index' });
  };

  return (
    <View className={styles.container}>
      {loading ? (
        <View className={styles.empty}>
          <Text className={styles.emptyText}>加载中…</Text>
        </View>
      ) : favorites.length === 0 ? (
        <View className={styles.empty}>
          <View className={styles.emptyIcon}>
            <Icon name="heart" size={40} color="#DDD8D0" />
          </View>
          <Text className={styles.emptyText}>还没有收藏的咨询师</Text>
          <View className={styles.emptyButton} onClick={goHome}>
            <Text className={styles.emptyButtonText}>去逛逛</Text>
          </View>
        </View>
      ) : (
        <View className={styles.list}>
          {favorites.map(c => (
            <View key={c.id} className={styles.card} onClick={() => goCounselor(c.id)}>
              <View className={styles.avatarWrapper}>
                {c.avatarUrl ? (
                  <Image className={styles.avatar} src={c.avatarUrl} mode="aspectFill" />
                ) : (
                  <Text className={styles.avatarText}>{(c.displayName || '咨').charAt(0)}</Text>
                )}
              </View>
              <View className={styles.info}>
                <Text className={styles.name}>{c.displayName}</Text>
                <Text className={styles.meta}>
                  {[c.title, c.pricePerSession > 0 ? `¥${c.pricePerSession}/次` : '']
                    .filter(Boolean)
                    .join(' · ') || '心理咨询师'}
                </Text>
                {(c.specialties || []).length > 0 && (
                  <View className={styles.tagRow}>
                    {c.specialties.slice(0, 3).map(tag => (
                      <Text key={tag} className={styles.tag}>{tag}</Text>
                    ))}
                  </View>
                )}
              </View>
              <View className={styles.actions}>
                <View
                  className={styles.heartButton}
                  onClick={(e) => { e.stopPropagation(); handleRemove(c.id); }}
                >
                  <Icon name="heart" size={20} color="#D66D6D" />
                </View>
                <View
                  className={styles.bookButton}
                  onClick={(e) => goBooking(c.id, e)}
                >
                  <Text className={styles.bookButtonText}>立即预约</Text>
                </View>
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

export default FavoritesPage;
