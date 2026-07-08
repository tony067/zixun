import React from 'react';
import { View, Text, Button } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';

const LoginPage: React.FC = () => {
  const handleLogin = () => {
    Taro.showToast({ title: '登录功能开发中', icon: 'none' });
  };

  return (
    <View className={styles.container}>
      <View className={styles.logoBox}>
        <View className={styles.logo}>🌿</View>
        <Text className={styles.appName}>MindPace</Text>
        <Text className={styles.appDesc}>温暖、专业、神经多样性友好的\n心理咨询预约平台</Text>
      </View>

      <View className={styles.card}>
        <Text className={styles.title}>欢迎来到 MindPace</Text>
        <Text className={styles.desc}>登录后可以进行预约、管理咨询记录、与咨询师沟通</Text>
        <Button className={styles.loginButton} onClick={handleLogin}>
          微信一键登录
        </Button>
        <Text className={styles.tip}>点击登录即表示同意《用户协议》和《隐私政策》</Text>
      </View>
    </View>
  );
};

export default LoginPage;
