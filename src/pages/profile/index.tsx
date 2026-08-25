import React, { useState, useEffect } from 'react';
import { View, Text, Button, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import CustomTabBar from '@/custom-tab-bar';
import { useUserStore } from '@/stores/user';
import { fetchFavorites, removeFavorite, fetchUserProfile } from '@/services/api';
import type { Counselor, UserProfile } from '@/services/api';
import Icon from '@/components/Icon';

const menuItems = [
  { icon: 'calendar', label: '我的预约', path: '/pages/bookings/index', isTab: false },
  { icon: 'heart', label: '我的收藏', path: '/pages/profile/favorites', isTab: false },
  { icon: 'settings', label: '设置', path: '', isTab: false }
];

const ProfilePage: React.FC = () => {
  const { isLoggedIn, user, logout } = useUserStore();
  const [favoriteCounselors, setFavoriteCounselors] = useState<Counselor[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [isLoggedIn]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (isLoggedIn) {
        const [favs, prof] = await Promise.all([
          fetchFavorites(),
          fetchUserProfile()
        ]);
        setFavoriteCounselors(favs);
        setProfile(prof);
      }
    } catch (err) {
      console.error('[Profile] 加载数据失败', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = () => {
    Taro.navigateTo({ url: '/pages/login/index' });
  };

  const handleLogout = () => {
    Taro.showModal({
      title: '确认退出',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          logout();
          setFavoriteCounselors([]);
          setProfile(null);
          Taro.showToast({ title: '已退出登录', icon: 'none' });
        }
      }
    });
  };

  const handleViewGuide = () => {
    Taro.navigateTo({ url: '/pages/guide/index' });
  };

  const handleRemoveFavorite = async (id: string) => {
    try {
      await removeFavorite(id);
      setFavoriteCounselors(prev => prev.filter(c => c.id !== id));
      Taro.showToast({ title: '已取消收藏', icon: 'none' });
    } catch (err) {
      console.error('[Profile] 取消收藏失败', err);
      Taro.showToast({ title: '取消收藏失败', icon: 'none' });
    }
  };

  const handleViewCounselor = (id: string) => {
    Taro.navigateTo({ url: `/pages/counselor-detail/index?id=${id}` });
  };

  return (
    <View className={styles.container}>
      <ScrollView scrollY className={styles.scrollContent}>
        <View className={styles.header}>
          <View className={styles.userCard}>
            <View className={styles.avatarWrapper}>
              {profile?.avatarUrl ? (
                <View className={styles.avatar} style={{ backgroundImage: `url(${profile.avatarUrl})` }} />
              ) : (
                <Text className={styles.avatarText}>
                  {profile?.name?.charAt(0) || user?.name?.charAt(0) || '访'}
                </Text>
              )}
            </View>
            <View className={styles.userInfo}>
              <Text className={styles.userName}>
                {profile?.name || user?.name || '来访者'}
              </Text>
              <Text className={styles.userDesc}>
                {isLoggedIn ? '已登录' : '登录后可查看完整信息'}
              </Text>
            </View>
            {isLoggedIn && (
              <View className={styles.logoutButton} onClick={handleLogout}>
                <Text className={styles.logoutText}>退出</Text>
              </View>
            )}
          </View>
        </View>

        <View className={styles.menuSection}>
          <View className={styles.menuCard}>
            {menuItems.map(item => (
              <View
                key={item.label}
                className={styles.menuItem}
                onClick={() => {
                  if (!item.path) return;
                  Taro.navigateTo({ url: item.path });
                }}
              >
                <View className={styles.menuLeft}>
                  <Icon name={item.icon as any} size={24} color="#9B8E82" />
                  <Text className={styles.menuText}>{item.label}</Text>
                </View>
                <Icon name="chevronRight" size={20} color="#C2BDB7" />
              </View>
            ))}
          </View>
        </View>

        <View className={styles.guideCard} onClick={handleViewGuide}>
          <View className={styles.guideLeft}>
            <Icon name="book" size={28} color="#9CB48A" />
            <View className={styles.guideInfo}>
              <Text className={styles.guideTitle}>新手必读</Text>
              <Text className={styles.guideDesc}>了解心理咨询，找到适合自己的支持</Text>
            </View>
          </View>
          <Icon name="chevronRight" size={20} color="#C2BDB7" />
        </View>

        {isLoggedIn && favoriteCounselors.length > 0 && (
          <View className={styles.favoritesSection}>
            <View className={styles.sectionHeader}>
              <Text className={styles.sectionTitle}>我的收藏</Text>
              <Text className={styles.sectionCount}>{favoriteCounselors.length}位咨询师</Text>
            </View>
            <View className={styles.favoritesList}>
              {favoriteCounselors.map(counselor => (
                <View key={counselor.id} className={styles.favoriteItem}>
                  <View className={styles.favoriteAvatarWrapper} onClick={() => handleViewCounselor(counselor.id)}>
                    {counselor.avatarUrl ? (
                      <View className={styles.favoriteAvatar} style={{ backgroundImage: `url(${counselor.avatarUrl})` }} />
                    ) : (
                      <Text className={styles.favoriteAvatarText}>{counselor.displayName.charAt(0)}</Text>
                    )}
                  </View>
                  <View className={styles.favoriteInfo} onClick={() => handleViewCounselor(counselor.id)}>
                    <Text className={styles.favoriteName}>{counselor.displayName}</Text>
                    <Text className={styles.favoriteTitle}>{counselor.title}</Text>
                    <View className={styles.favoriteTags}>
                      {counselor.specialties.slice(0, 2).map(tag => (
                        <Text key={tag} className={styles.favoriteTag}>{tag}</Text>
                      ))}
                    </View>
                  </View>
                  <View className={styles.favoritePrice}>
                    <Text className={styles.favoritePriceValue}>¥{counselor.pricePerSession}</Text>
                    <Text className={styles.favoritePriceUnit}>/次</Text>
                  </View>
                  <View className={styles.favoriteRemove} onClick={() => handleRemoveFavorite(counselor.id)}>
                    <Text className={styles.removeIcon}>×</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {isLoggedIn && favoriteCounselors.length === 0 && !loading && (
          <View className={styles.emptySection}>
            <Text className={styles.emptyIcon}>⭐</Text>
            <Text className={styles.emptyText}>暂无收藏的咨询师</Text>
            <Text className={styles.emptyHint}>在咨询师详情页点击收藏即可添加</Text>
          </View>
        )}
      </ScrollView>

      {!isLoggedIn && (
        <View className={styles.bottomBar}>
          <Button className={styles.loginButton} onClick={handleLogin}>
            微信一键登录
          </Button>
        </View>
      )}
      <CustomTabBar />
    </View>
  );
};

export default ProfilePage;