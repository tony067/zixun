import React, { useState, useEffect } from 'react';
import { View, Text, Button, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import CustomTabBar from '@/components/TabBar';
import { useUserStore } from '@/stores/user';
import { fetchUserProfile, fetchMyBookings, request } from '@/services/api';
import type { UserProfile } from '@/services/api';
import type { Booking } from '@/types/booking';
import Icon from '@/components/Icon';

const UPCOMING_STATUSES = ['pending_confirmation', 'confirmed', 'pending_payment', 'paid'];

/** 与消息页约定：待打开的客服会话 id，消息页 onShow 时消费 */
const PENDING_OPEN_CONV_KEY = 'mindpace_pending_open_conv';

const gridItems = [
  { icon: 'heart', title: '我的收藏', desc: '收藏的咨询师', key: 'favorites' },
  { icon: 'book', title: '新手必读', desc: '了解咨询', key: 'guide' },
  { icon: 'headphones', title: '联系客服', desc: '在线帮助', key: 'service' },
  { icon: 'settings', title: '更多设置', desc: '账号·通知', key: 'settings' }
] as const;

function formatBookingTime(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getMonth() + 1}月${d.getDate()}日 ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

const ProfilePage: React.FC = () => {
  const { isLoggedIn, user, logout } = useUserStore();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [upcomingBooking, setUpcomingBooking] = useState<Booking | null>(null);
  const [upcomingCount, setUpcomingCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [isLoggedIn]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (isLoggedIn) {
        const [prof, bookings] = await Promise.all([
          fetchUserProfile(),
          fetchMyBookings().catch(() => [])
        ]);
        setProfile(prof);

        const now = Date.now();
        const upcoming = bookings
          .filter(b => UPCOMING_STATUSES.includes(b.status) && new Date(b.scheduledAt).getTime() >= now)
          .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());
        setUpcomingCount(upcoming.length);
        setUpcomingBooking(upcoming[0] || null);
      } else {
        setProfile(null);
        setUpcomingBooking(null);
        setUpcomingCount(0);
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
          setProfile(null);
          setUpcomingBooking(null);
          setUpcomingCount(0);
          Taro.showToast({ title: '已退出登录', icon: 'none' });
        }
      }
    });
  };

  const handleEditProfile = () => {
    Taro.showToast({ title: '资料编辑即将上线', icon: 'none' });
  };

  // 联系客服：创建/复用与官方客服的会话，然后跳到消息页打开聊天视图
  const handleContactService = async () => {
    if (!isLoggedIn) {
      handleLogin();
      return;
    }
    try {
      // Taro.request.Option 类型要求 url 字段；request() 实际以第一个参数 path 为准
      const data = await request<{ conversationId?: string; id?: string }>('/api/messages', {
        url: '/api/messages',
        method: 'POST',
        data: { toAdmin: true }
      });
      const convId = data?.conversationId || data?.id;
      if (!convId) throw new Error('未返回会话');
      Taro.setStorageSync(PENDING_OPEN_CONV_KEY, convId);
      Taro.switchTab({ url: '/pages/messages/index' });
    } catch (err) {
      console.error('[Profile] 联系客服失败', err);
      Taro.showToast({ title: '客服暂不可用，请稍后再试', icon: 'none' });
    }
  };

  const handleGridItem = (key: string) => {
    switch (key) {
      case 'guide':
        Taro.navigateTo({ url: '/pages/guide/index' });
        break;
      case 'favorites':
        Taro.showToast({ title: '收藏功能即将上线', icon: 'none' });
        break;
      case 'service':
        handleContactService();
        break;
      case 'settings':
        Taro.showToast({ title: '更多设置即将上线', icon: 'none' });
        break;
    }
  };

  const handleViewBookings = () => {
    if (!isLoggedIn) {
      handleLogin();
      return;
    }
    Taro.navigateTo({ url: '/pages/bookings/index' });
  };

  const handleViewBooking = (booking: Booking) => {
    if (booking.counselorId) {
      Taro.navigateTo({ url: `/pages/counselor-detail/index?id=${booking.counselorId}` });
    }
  };

  const displayName = profile?.name || user?.name || (isLoggedIn ? '来访者' : '未登录');
  const displayEmail = profile?.email || user?.email || '';
  const avatarChar = (displayName || '访').charAt(0);

  return (
    <View className={styles.container}>
      <ScrollView scrollY className={styles.scrollContent}>
        {/* 头部：头像 + 用户名/邮箱 */}
        <View className={styles.header}>
          <View className={styles.avatarWrapper}>
            {profile?.avatarUrl ? (
              <View className={styles.avatar} style={{ backgroundImage: `url(${profile.avatarUrl})` }} />
            ) : (
              <Text className={styles.avatarText}>{avatarChar}</Text>
            )}
            {isLoggedIn && (
              <View className={styles.cameraBadge} onClick={handleEditProfile}>
                <Icon name="camera" size={14} color="#8A8580" />
              </View>
            )}
          </View>
          <View className={styles.userInfo}>
            <View className={styles.userNameRow}>
              <Text className={styles.userName}>{isLoggedIn ? (displayEmail || displayName) : displayName}</Text>
              {isLoggedIn && (
                <View className={styles.editButton} onClick={handleEditProfile}>
                  <Icon name="edit" size={16} color="#B0AAA3" />
                </View>
              )}
            </View>
            {isLoggedIn && displayEmail && displayName !== displayEmail && (
              <Text className={styles.userDesc}>{displayName}</Text>
            )}
            {!isLoggedIn && (
              <Text className={styles.userDesc}>登录后享受完整服务</Text>
            )}
          </View>
        </View>

        {/* 我的预约卡片 */}
        {isLoggedIn && (
          <View className={styles.bookingCard}>
            <View className={styles.bookingHeader} onClick={handleViewBookings}>
              <View className={styles.bookingHeaderLeft}>
                <Icon name="calendar" size={18} color="#6B7B5E" />
                <Text className={styles.bookingTitle}>我的预约</Text>
                {upcomingCount > 0 && (
                  <View className={styles.bookingCountBadge}>
                    <Text className={styles.bookingCountText}>{upcomingCount}</Text>
                  </View>
                )}
              </View>
              <View className={styles.bookingHeaderRight}>
                <Text className={styles.bookingAllText}>全部预约</Text>
                <Icon name="chevronRight" size={14} color="#A8A29A" />
              </View>
            </View>

            {upcomingBooking ? (
              <View className={styles.bookingItem} onClick={() => handleViewBooking(upcomingBooking)}>
                <View className={styles.bookingAvatarWrapper}>
                  {upcomingBooking.counselor.avatarUrl ? (
                    <View
                      className={styles.bookingAvatar}
                      style={{ backgroundImage: `url(${upcomingBooking.counselor.avatarUrl})` }}
                    />
                  ) : (
                    <Text className={styles.bookingAvatarText}>
                      {(upcomingBooking.counselor.name || '咨').charAt(0)}
                    </Text>
                  )}
                </View>
                <View className={styles.bookingInfo}>
                  <Text className={styles.bookingName}>{upcomingBooking.counselor.name || '咨询师'}</Text>
                  <Text className={styles.bookingTime}>
                    {formatBookingTime(upcomingBooking.scheduledAt)}
                    {upcomingBooking.sessionMode ? ` · ${upcomingBooking.sessionMode.replace(/咨询$/, '')}咨询` : ''}
                  </Text>
                </View>
                <View className={styles.upcomingPill}>
                  <Text className={styles.upcomingPillText}>即将咨询</Text>
                </View>
              </View>
            ) : (
              !loading && (
                <View className={styles.bookingEmpty}>
                  <Text className={styles.bookingEmptyText}>暂无预约</Text>
                </View>
              )
            )}
          </View>
        )}

        {/* 宫格菜单 */}
        <View className={styles.gridSection}>
          {gridItems.map(item => (
            <View key={item.key} className={styles.gridCard} onClick={() => handleGridItem(item.key)}>
              <View className={styles.gridIconWrapper}>
                <Icon name={item.icon} size={20} color="#7A9A6A" />
              </View>
              <View className={styles.gridInfo}>
                <Text className={styles.gridTitle}>{item.title}</Text>
                <Text className={styles.gridDesc}>{item.desc}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* 退出登录 */}
        {isLoggedIn && (
          <View className={styles.logoutCard} onClick={handleLogout}>
            <Icon name="logOut" size={18} color="#D9534F" />
            <Text className={styles.logoutText}>退出登录</Text>
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
