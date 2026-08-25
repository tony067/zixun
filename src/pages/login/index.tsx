import React, { useState } from 'react';
import { View, Text, Button, Input } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import { useUserStore } from '@/stores/user';
import { login as apiLogin, register as apiRegister } from '@/services/api';
import Icon from '@/components/Icon';

type FormMode = 'login' | 'register';

const LoginPage: React.FC = () => {
  const [mode, setMode] = useState<FormMode>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { login } = useUserStore();

  const validateEmail = (value: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value);
  };

  const validatePassword = (value: string): boolean => {
    return value.length >= 6;
  };

  const handleWechatLogin = () => {
    Taro.showToast({ title: '微信登录功能开发中', icon: 'none' });
  };

  const handleSubmit = async () => {
    setError('');

    if (!email || !password) {
      setError('请填写完整信息');
      return;
    }

    if (!validateEmail(email)) {
      setError('请输入有效的邮箱地址');
      return;
    }

    if (!validatePassword(password)) {
      setError('密码至少需要6位');
      return;
    }

    setLoading(true);

    try {
      let response;

      if (mode === 'login') {
        response = await apiLogin({ email, password });
      } else {
        response = await apiRegister({ name: name || email.split('@')[0], email, password });
      }

      if (response && response.user) {
        console.log('[Login] 服务器返回的完整用户信息:', response.user);
        login({
          id: response.user.id,
          name: response.user.name,
          email: response.user.email,
          isAdmin: response.user.isAdmin,
          isTester: response.user.isTester,
          role: response.user.role,
          userType: response.user.userType,
          type: response.user.type
        });

        if (response.token) {
          Taro.setStorageSync('token', response.token);
        }

        Taro.showToast({ title: mode === 'login' ? '登录成功' : '注册成功', icon: 'success' });

        setTimeout(() => {
          Taro.navigateBack();
        }, 1500);
      }
    } catch (err) {
      console.error('[Login] 登录/注册失败', err);
      const errMsg = err instanceof Error ? err.message : '操作失败，请重试';
      if (errMsg.includes('401')) {
        setError('邮箱或密码错误');
      } else if (errMsg.includes('409')) {
        setError('该邮箱已注册，请直接登录');
      } else {
        setError(errMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className={styles.container}>
      <View className={styles.logoBox}>
        <View className={styles.logo}>
          <Icon name="user" size={48} color="#9CB48A" />
        </View>
        <Text className={styles.appName}>MindPace</Text>
        <Text className={styles.appDesc}>神经多样性友好咨询预约平台</Text>
      </View>

      <View className={styles.card}>
        <View className={styles.tabBar}>
          <View
            className={`${styles.tabItem} ${mode === 'login' ? styles.tabActive : ''}`}
            onClick={() => {
              setMode('login');
              setError('');
            }}
          >
            <Text className={styles.tabText}>登录</Text>
          </View>
          <View
            className={`${styles.tabItem} ${mode === 'register' ? styles.tabActive : ''}`}
            onClick={() => {
              setMode('register');
              setError('');
            }}
          >
            <Text className={styles.tabText}>注册</Text>
          </View>
        </View>

        {error && (
          <View className={styles.errorBox}>
            <Text className={styles.errorText}>{error}</Text>
          </View>
        )}

        {mode === 'register' && (
          <View className={styles.formItem}>
            <Text className={styles.formLabel}>昵称（选填）</Text>
            <Input
              className={styles.formInput}
              placeholder="你的名字"
              placeholderClass={styles.formPlaceholder}
              value={name}
              onInput={e => setName(e.detail.value)}
            />
          </View>
        )}

        <View className={styles.formItem}>
          <Text className={styles.formLabel}>邮箱</Text>
          <Input
            className={styles.formInput}
            placeholder="your@email.com"
            placeholderClass={styles.formPlaceholder}
            value={email}
            onInput={e => setEmail(e.detail.value)}
            type="email"
          />
        </View>

        <View className={styles.formItem}>
          <Text className={styles.formLabel}>密码</Text>
          <Input
            className={styles.formInput}
            placeholder={mode === 'login' ? '输入密码' : '至少6位'}
            placeholderClass={styles.formPlaceholder}
            value={password}
            onInput={e => setPassword(e.detail.value)}
            password
          />
        </View>

        <Button className={styles.submitButton} onClick={handleSubmit} loading={loading}>
          <Text className={styles.submitButtonText}>
            {loading ? '处理中...' : mode === 'login' ? '登录' : '注册并登录'}
          </Text>
        </Button>

        <View className={styles.divider}>
          <View className={styles.dividerLine} />
          <Text className={styles.dividerText}>其他登录方式</Text>
          <View className={styles.dividerLine} />
        </View>

        <Button className={styles.wechatButton} onClick={handleWechatLogin}>
          <Icon name="message" size={24} color="#07C160" />
          <Text className={styles.wechatText}>微信一键登录</Text>
        </Button>
      </View>

      <Text className={styles.footer}>MindPace · 心理咨询预约平台</Text>
    </View>
  );
};

export default LoginPage;