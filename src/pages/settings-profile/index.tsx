import React, { useState, useEffect } from 'react';
import { View, Text, Input } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import Icon from '@/components/Icon';
import { fetchCurrentUser, updateUserProfile, resolveAssetUrl } from '@/services/api';

// 与 services/api.ts 相同的 API_BASE 逻辑（头像上传 Taro.uploadFile 需要完整地址）
const API_BASE =
  process.env.TARO_ENV === 'weapp' || process.env.NODE_ENV !== 'development'
    ? 'http://123.207.40.7:3001'
    : '';

/** web 版契约：POST /api/upload/avatar（FormData file）→ { url }，再 PATCH 资料 avatarUrl */
const ProfileSettingsPage: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!Taro.getStorageSync('token')) {
      Taro.redirectTo({ url: '/pages/login/index' });
      return;
    }
    (async () => {
      const user = await fetchCurrentUser();
      if (user) {
        setName(user.name || '');
        setEmail(user.email || '');
        setAvatarUrl(resolveAssetUrl(user.avatarUrl) || '');
      }
    })();
  }, []);

  // 更换头像：chooseImage → 上传 → 立即写入资料
  const handleChooseAvatar = () => {
    Taro.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      success: (res) => {
        const filePath = res.tempFilePaths?.[0];
        if (!filePath) return;
        Taro.showLoading({ title: '上传中…' });
        const token = Taro.getStorageSync('token');
        Taro.uploadFile({
          url: `${API_BASE}/api/upload/avatar`,
          filePath,
          name: 'file',
          header: token ? { Authorization: `Bearer ${token}` } : {}
        })
          .then((uploadRes) => {
            if (uploadRes.statusCode >= 200 && uploadRes.statusCode < 300) {
              const body = JSON.parse(uploadRes.data) as { url?: string };
              if (body?.url) {
                setAvatarUrl(resolveAssetUrl(body.url) || body.url);
                return updateUserProfile({ avatarUrl: body.url });
              }
            }
            throw new Error(`上传失败: ${uploadRes.statusCode}`);
          })
          .then(() => {
            Taro.showToast({ title: '头像已更新', icon: 'none' });
          })
          .catch((e) => {
            console.error('[SettingsProfile] 头像上传失败', e);
            Taro.showToast({ title: '头像上传失败', icon: 'none' });
          })
          .finally(() => Taro.hideLoading());
      }
    });
  };

  const handleSave = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      Taro.showToast({ title: '请输入昵称', icon: 'none' });
      return;
    }
    if (saving) return;
    setSaving(true);
    try {
      await updateUserProfile({ name: trimmed });
      Taro.showToast({ title: '已保存', icon: 'success' });
      setTimeout(() => Taro.navigateBack(), 800);
    } catch (err) {
      console.error('[SettingsProfile] 保存资料失败', err);
      Taro.showToast({
        title: err instanceof Error ? err.message : '保存失败，请重试',
        icon: 'none'
      });
    } finally {
      setSaving(false);
    }
  };

  const avatarChar = (name || email || '？').charAt(0);

  return (
    <View className={styles.container}>
      {/* 头像 */}
      <View className={styles.avatarSection} onClick={handleChooseAvatar}>
        <View className={styles.avatarWrapper}>
          {avatarUrl ? (
            <View
              className={styles.avatar}
              style={{ backgroundImage: `url(${avatarUrl})` }}
            />
          ) : (
            <Text className={styles.avatarText}>{avatarChar}</Text>
          )}
          <View className={styles.cameraBadge}>
            <Icon name="camera" size={14} color="#FFFFFF" />
          </View>
        </View>
        <Text className={styles.avatarTip}>点击更换头像</Text>
      </View>

      {/* 表单 */}
      <View className={styles.formCard}>
        <View className={styles.formRowBorder}>
          <View className={styles.formIcon}>
            <Icon name="user" size={16} color="#9CB48A" />
          </View>
          <View className={styles.formInfo}>
            <Text className={styles.formLabel}>昵称</Text>
            <Input
              className={styles.formInput}
              value={name}
              placeholder="设置你的昵称"
              placeholderClass={styles.formPlaceholder}
              maxlength={20}
              onInput={(e) => setName(e.detail.value)}
            />
          </View>
        </View>
        <View className={styles.formRowBorder}>
          <View className={styles.formIcon}>
            <Icon name="send" size={16} color="#9CB48A" />
          </View>
          <View className={styles.formInfo}>
            <Text className={styles.formLabel}>邮箱</Text>
            <Text className={styles.formStatic}>{email || '—'}</Text>
          </View>
        </View>
        <View className={styles.formRow}>
          <View className={styles.formIcon}>
            <Icon name="phone" size={16} color="#9CB48A" />
          </View>
          <View className={styles.formInfo}>
            <Text className={styles.formLabel}>手机号</Text>
            <Input
              className={styles.formInput}
              type="number"
              value={phone}
              placeholder="绑定手机号"
              placeholderClass={styles.formPlaceholder}
              maxlength={11}
              onInput={(e) => setPhone(e.detail.value)}
            />
          </View>
        </View>
      </View>

      {/* 保存 */}
      <View
        className={`${styles.saveButton}${saving ? ` ${styles.saveButtonDisabled}` : ''}`}
        onClick={handleSave}
      >
        <Text className={styles.saveButtonText}>{saving ? '保存中…' : '保存修改'}</Text>
      </View>
    </View>
  );
};

export default ProfileSettingsPage;
