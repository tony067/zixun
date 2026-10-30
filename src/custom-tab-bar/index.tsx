import React, { useCallback, useEffect, useState } from 'react';
import { View, Text } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import styles from './index.module.scss';
import { useUserStore } from '@/stores/user';
import { fetchUnreadCount } from '@/services/api';
import Icon from '@/components/Icon/index';
import { UNREAD_REFRESH_EVENT } from '@/constants/events';

interface TabItem {
  pagePath: string;
  text: string;
  icon: string;
}

type Role = 'client' | 'counselor' | 'admin' | 'support';

const CLIENT_TABS: TabItem[] = [
  { pagePath: '/pages/index/index', text: '首页', icon: 'home' },
  { pagePath: '/pages/messages/index', text: '消息', icon: 'message' },
];

const SUPPORT_TABS: TabItem[] = [
  { pagePath: '/pages/cs-orders/index', text: '订单', icon: 'list' },
  { pagePath: '/pages/messages/index', text: '消息', icon: 'message' },
];

const COUNSELOR_TABS: TabItem[] = [
  { pagePath: '/pages/counselor-bookings/index', text: '预约', icon: 'list' },
  { pagePath: '/pages/counselor-schedule/index', text: '档期', icon: 'calendar' },
  { pagePath: '/pages/messages/index', text: '消息', icon: 'message' },
  { pagePath: '/pages/counselor-profile/index', text: '档案', icon: 'user' },
];

const ADMIN_TABS: TabItem[] = [
  { pagePath: '/pages/admin-dashboard/index', text: '总览', icon: 'chart' },
  { pagePath: '/pages/admin-review/index', text: '审核', icon: 'check' },
  { pagePath: '/pages/admin-orders/index', text: '订单', icon: 'list' },
  { pagePath: '/pages/admin-users/index', text: '用户', icon: 'users' },
];

const ROLE_ITEMS = [
  { role: 'client' as Role, label: '来访者', sub: '浏览咨询师・预约・消息', icon: 'user' },
  { role: 'counselor' as Role, label: '咨询师', sub: '管理预约・档期・档案', icon: 'stethoscope' },
  { role: 'admin' as Role, label: '管理员', sub: '审核・数据・系统设置', icon: 'settings' },
  { role: 'support' as Role, label: '客服', sub: '订单促进・消息跟进', icon: 'headphones' },
];

const MY_ROUTE: Record<Role, string> = {
  client: '/pages/profile/index',
  counselor: '/pages/counselor-bookings/index',
  admin: '/pages/admin-dashboard/index',
  support: '/pages/cs-orders/index',
};

/** 微信 tabBar.list 上限 10 项，cs-orders 未注册在内，只能 redirectTo 到达 */
const NATIVE_TAB_PAGES = new Set([
  '/pages/index/index',
  '/pages/messages/index',
  '/pages/profile/index',
  '/pages/counselor-bookings/index',
  '/pages/counselor-schedule/index',
  '/pages/counselor-profile/index',
  '/pages/admin-dashboard/index',
  '/pages/admin-review/index',
  '/pages/admin-orders/index',
  '/pages/admin-users/index',
]);

const gotoTab = (url: string) => {
  if (NATIVE_TAB_PAGES.has(url)) {
    Taro.switchTab({ url });
  } else {
    Taro.redirectTo({ url });
  }
};

const CustomTabBar: React.FC = () => {
  const { isLoggedIn, user, currentRole, setRole } = useUserStore();
  const [current, setCurrent] = useState('');
  const [showRolePicker, setShowRolePicker] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const userDbRole = user?.role || user?.userType || user?.type || 'visitor';

  const visibleRoleItems = ROLE_ITEMS.filter(item => {
    if (item.role === 'client') return true;
    if (item.role === 'counselor') return userDbRole === 'counselor' || userDbRole === 'admin';
    if (item.role === 'admin') return userDbRole === 'admin';
    if (item.role === 'support') return userDbRole === 'admin' || userDbRole === 'support';
    return false;
  });

  const getTabs = (): TabItem[] => {
    if (!isLoggedIn) {
      return [
        { pagePath: '/pages/index/index', text: '首页', icon: 'home' },
        { pagePath: '/pages/login/index', text: '我的', icon: 'user' }
      ];
    }

    if (userDbRole === 'counselor') {
      return COUNSELOR_TABS;
    }

    if (userDbRole === 'admin') {
      switch (currentRole) {
        case 'counselor': return COUNSELOR_TABS;
        case 'admin': return ADMIN_TABS;
        case 'support': return SUPPORT_TABS;
        default: return CLIENT_TABS;
      }
    }

    if (userDbRole === 'support') {
      switch (currentRole) {
        case 'support': return SUPPORT_TABS;
        default: return CLIENT_TABS;
      }
    }

    switch (currentRole) {
      case 'counselor': return COUNSELOR_TABS;
      case 'admin': return ADMIN_TABS;
      case 'support': return SUPPORT_TABS;
      default: return CLIENT_TABS;
    }
  };

  const tabs = getTabs();

  const refreshUnread = useCallback(async () => {
    if (!isLoggedIn) {
      setUnreadCount(0);
      return;
    }
    const n = await fetchUnreadCount();
    setUnreadCount(n);
  }, [isLoggedIn]);

  // 登录后立即拉取并每 15 秒轮询未读数；登出清零并停止轮询
  useEffect(() => {
    if (!isLoggedIn) {
      setUnreadCount(0);
      return;
    }
    refreshUnread();
    const timer = setInterval(refreshUnread, 15000);
    Taro.eventCenter.on(UNREAD_REFRESH_EVENT, refreshUnread);
    return () => {
      clearInterval(timer);
      Taro.eventCenter.off(UNREAD_REFRESH_EVENT, refreshUnread);
    };
  }, [isLoggedIn, refreshUnread]);

  useEffect(() => {
    const pages = Taro.getCurrentPages();
    const currentPage = pages[pages.length - 1];
    if (currentPage) {
      setCurrent('/' + currentPage.route);
    }
  }, [isLoggedIn, currentRole]);

  useDidShow(() => {
    const pages = Taro.getCurrentPages();
    const currentPage = pages[pages.length - 1];
    if (currentPage) {
      setCurrent('/' + currentPage.route);
    }
    // 页面 onShow 时立即刷新未读数
    refreshUnread();
  });

  const handleClick = (item: TabItem) => {
    if (current === item.pagePath) return;

    if (!isLoggedIn && item.pagePath === '/pages/login/index') {
      Taro.navigateTo({ url: '/pages/login/index' });
      return;
    }

    gotoTab(item.pagePath);
  };

  const handleRoleSwitch = (targetRole: Role) => {
    setShowRolePicker(false);
    if (!user) {
      Taro.navigateTo({ url: '/pages/login/index' });
      return;
    }
    setRole(targetRole);
    gotoTab(MY_ROUTE[targetRole]);
  };

  const needsRoleSwitch = isLoggedIn && (userDbRole === 'admin' || userDbRole === 'counselor' || userDbRole === 'support');

  return (
    <>
      <View className={styles.tabBar}>
        <View className={styles.tabBarContent}>
          {tabs.map((item, index) => (
            <View
              key={index}
              className={`${styles.tabItem} ${current === item.pagePath ? styles.active : ''}`}
              onClick={() => handleClick(item)}
            >
              <View className={styles.tabIcon}>
                <Icon name={item.icon as any} size={22} color={current === item.pagePath ? '#9CB48A' : '#9B8E82'} />
                {item.pagePath === '/pages/messages/index' && unreadCount > 0 && (
                  <View className={styles.tabBadge}>
                    <Text className={styles.tabBadgeText}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
                  </View>
                )}
              </View>
              <Text className={`${styles.tabText} ${current === item.pagePath ? styles.tabTextActive : ''}`}>
                {item.text}
              </Text>
            </View>
          ))}
          {needsRoleSwitch && (
            <View className={styles.roleSwitch} onClick={() => setShowRolePicker(true)}>
              <Icon name="chevronDown" size={18} color="#9B8E82" />
              <Text className={styles.roleSwitchText}>切换</Text>
            </View>
          )}
          {isLoggedIn && !needsRoleSwitch && tabs.length === 2 && (
            <View className={styles.tabItem} onClick={() => handleClick({ pagePath: '/pages/profile/index', text: '我的', icon: 'user' })}>
              <View className={styles.tabIcon}>
                <Icon name="user" size={22} color={current === '/pages/profile/index' ? '#9CB48A' : '#9B8E82'} />
              </View>
              <Text className={`${styles.tabText} ${current === '/pages/profile/index' ? styles.tabTextActive : ''}`}>
                我的
              </Text>
            </View>
          )}
        </View>
      </View>

      {showRolePicker && (
        <>
          <View className={styles.modalMask} onClick={() => setShowRolePicker(false)} />
          <View className={styles.rolePicker}>
            <View className={styles.rolePickerHeader}>
              <Text className={styles.rolePickerTitle}>切换端口</Text>
              <Icon name="close" size={24} color="#9B8E82" onClick={() => setShowRolePicker(false)} />
            </View>
            <View className={styles.rolePickerContent}>
              {visibleRoleItems.map(item => {
                const isActive = item.role === currentRole;
                return (
                  <View
                    key={item.role}
                    className={`${styles.roleItem} ${isActive ? styles.roleItemActive : ''}`}
                    onClick={() => handleRoleSwitch(item.role)}
                  >
                    <Icon name={item.icon as any} size={32} color={isActive ? '#9CB48A' : '#2C2420'} />
                    <View className={styles.roleItemInfo}>
                      <Text className={styles.roleItemLabel}>{item.label}</Text>
                      <Text className={styles.roleItemSub}>{item.sub}</Text>
                    </View>
                    {isActive ? (
                      <Text className={styles.roleItemCurrent}>当前</Text>
                    ) : (
                      <Icon name="chevronRight" size={24} color="#C2BDB7" />
                    )}
                  </View>
                );
              })}
            </View>
            <View className={styles.rolePickerFooter}>
              <View className={styles.rolePickerCancel} onClick={() => setShowRolePicker(false)}>
                <Text className={styles.rolePickerCancelText}>取消</Text>
              </View>
            </View>
          </View>
        </>
      )}
    </>
  );
};

export default CustomTabBar;