import React from 'react';
import { View, Text, Button } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';

const menuItems = [
  { icon: '📅', label: '我的预约', path: '/pages/bookings/index', isTab: false },
  { icon: '⭐', label: '我的收藏', path: '', isTab: false },
  { icon: '⚙️', label: '设置', path: '', isTab: false }
];

const ProfilePage: React.FC = () => {
  const handleLogin = () => {
    Taro.navigateTo({ url: '/pages/login/index' });
  };

  return (
    <View className={styles.container}>
      <View className={styles.header}>
        <View className={styles.userCard}>
          <View className={styles.avatarWrapper}>
            <Text className={styles.avatarText}>访</Text>
          </View>
          <View className={styles.userInfo}>
            <Text className={styles.userName}>来访者</Text>
            <Text className={styles.userDesc}>登录后可查看完整信息</Text>
          </View>
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
                if (item.isTab) {
                  Taro.switchTab({ url: item.path });
                } else {
                  Taro.navigateTo({ url: item.path });
                }
              }}
            >
              <View className={styles.menuLeft}>
                <Text className={styles.menuIcon}>{item.icon}</Text>
                <Text className={styles.menuText}>{item.label}</Text>
              </View>
              <Text className={styles.menuArrow}>›</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={{ padding: '48rpx 32rpx' }}>
        <Button
          style={{
            width: '100%',
            height: '80rpx',
            background: '#9CB48A',
            borderRadius: '48rpx',
            color: '#fff',
            fontSize: '28rpx',
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          onClick={handleLogin}
        >
          微信一键登录
        </Button>
      </View>
    </View>
  );
};

export default ProfilePage;
