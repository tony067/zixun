import React, { useState, useEffect } from 'react';
import { View, Text, Switch } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import Icon from '@/components/Icon';

const APP_VERSION = 'v1.0.0';
const NOTIF_STORAGE_KEY = 'settings_notifications';

/** 与 web 版 settings-screen 一致的默认开关与条目 */
const DEFAULT_NOTIF: Record<string, boolean> = {
  booking: true,
  reminder: true,
  message: true,
  reschedule: true,
  news: false
};

const NOTIF_ITEMS: { k: string; l: string; s: string }[] = [
  { k: 'booking', l: '预约状态通知', s: '确认、支付、取消等' },
  { k: 'reminder', l: '咨询提醒', s: '咨询前24小时和1小时提醒' },
  { k: 'message', l: '新消息通知', s: '来自咨询师的私信' },
  { k: 'reschedule', l: '改期通知', s: '改期申请和确认结果' },
  { k: 'news', l: '平台动态', s: '新咨询师、活动和资讯' }
];

/** web 版隐私分区：三项暂无实际跳转，静态展示 */
const PRIVACY_ITEMS: { l: string; s: string }[] = [
  { l: '修改密码', s: '定期更换密码保护安全' },
  { l: '绑定手机号', s: '用于账号验证和找回密码' },
  { l: '隐私设置', s: '控制谁能看到你的信息' }
];

const SettingsPage: React.FC = () => {
  const [notif, setNotif] = useState<Record<string, boolean>>(DEFAULT_NOTIF);

  useEffect(() => {
    try {
      const saved = Taro.getStorageSync(NOTIF_STORAGE_KEY);
      if (saved && typeof saved === 'object') {
        setNotif({ ...DEFAULT_NOTIF, ...saved });
      }
    } catch (e) {
      console.error('[Settings] 读取通知设置失败', e);
    }
  }, []);

  const toggleNotif = (key: string) => {
    setNotif(prev => {
      const next = { ...prev, [key]: !prev[key] };
      try {
        Taro.setStorageSync(NOTIF_STORAGE_KEY, next);
      } catch (e) {
        console.error('[Settings] 保存通知设置失败', e);
      }
      return next;
    });
  };

  const goProfile = () => {
    Taro.navigateTo({ url: '/pages/settings-profile/index' });
  };

  const goHelp = () => {
    Taro.navigateTo({ url: '/pages/settings-help/index' });
  };

  return (
    <View className={styles.container}>
      {/* 账号与资料 */}
      <View className={styles.rowCard} onClick={goProfile}>
        <View className={styles.rowIcon}>
          <Icon name="user" size={20} color="#9CB48A" />
        </View>
        <View className={styles.rowInfo}>
          <Text className={styles.rowTitle}>账号与资料</Text>
          <Text className={styles.rowDesc}>头像、昵称等个人信息</Text>
        </View>
        <Icon name="chevronRight" size={16} color="#C4BDB5" />
      </View>

      {/* 通知设置：行内开关，纯本地存储 */}
      <View className={styles.groupCard}>
        <View className={styles.groupHeader}>
          <View className={styles.rowIcon}>
            <Icon name="bell" size={20} color="#9CB48A" />
          </View>
          <Text className={styles.groupTitle}>通知设置</Text>
        </View>
        {NOTIF_ITEMS.map((item, i) => (
          <View
            key={item.k}
            className={`${styles.notifRow}${i < NOTIF_ITEMS.length - 1 ? ` ${styles.notifRowBorder}` : ''}`}
          >
            <View className={styles.notifInfo}>
              <Text className={styles.notifLabel}>{item.l}</Text>
              <Text className={styles.notifDesc}>{item.s}</Text>
            </View>
            <Switch
              checked={!!notif[item.k]}
              color="#9CB48A"
              onChange={() => toggleNotif(item.k)}
            />
          </View>
        ))}
      </View>

      {/* 隐私与安全：web 版为静态展示 */}
      <View className={styles.groupCard}>
        <View className={styles.groupHeader}>
          <View className={styles.rowIcon}>
            <Icon name="shield" size={20} color="#9CB48A" />
          </View>
          <Text className={styles.groupTitle}>隐私与安全</Text>
        </View>
        {PRIVACY_ITEMS.map((item, i) => (
          <View
            key={item.l}
            className={`${styles.notifRow}${i < PRIVACY_ITEMS.length ? ` ${styles.notifRowBorder}` : ''}`}
          >
            <View className={styles.notifInfo}>
              <Text className={styles.notifLabel}>{item.l}</Text>
              <Text className={styles.notifDesc}>{item.s}</Text>
            </View>
            <Text className={styles.pendingText}>暂未开放</Text>
          </View>
        ))}
        <View className={styles.notifRow}>
          <View className={styles.notifInfo}>
            <Text className={styles.dangerLabel}>注销账号</Text>
            <Text className={styles.notifDesc}>永久删除账号和数据</Text>
          </View>
          <Text className={styles.pendingText}>暂未开放</Text>
        </View>
        <Text className={styles.privacyNote}>
          你的个人信息受《MindPace 隐私政策》保护，我们不会将你的数据出售给任何第三方。
        </Text>
      </View>

      {/* 帮助与反馈 */}
      <View className={styles.rowCard} onClick={goHelp}>
        <View className={styles.rowIcon}>
          <Icon name="headphones" size={20} color="#9CB48A" />
        </View>
        <View className={styles.rowInfo}>
          <Text className={styles.rowTitle}>帮助与反馈</Text>
          <Text className={styles.rowDesc}>常见问题和联系客服</Text>
        </View>
        <Icon name="chevronRight" size={16} color="#C4BDB5" />
      </View>

      {/* 关于 MindPace */}
      <View className={styles.rowCard}>
        <View className={styles.rowIcon}>
          <Icon name="heart" size={20} color="#9CB48A" />
        </View>
        <View className={styles.rowInfo}>
          <Text className={styles.rowTitle}>关于 MindPace</Text>
          <Text className={styles.rowDesc}>版本号</Text>
        </View>
        <Text className={styles.versionText}>{APP_VERSION}</Text>
      </View>
    </View>
  );
};

export default SettingsPage;
