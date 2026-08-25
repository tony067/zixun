import React from 'react';
import { View } from '@tarojs/components';
import styles from './index.module.scss';
import Placeholder from '@/components/Placeholder';
import CustomTabBar from '@/custom-tab-bar';

const MessagesPage: React.FC = () => {
  return (
    <View className={styles.container}>
      <Placeholder title="消息中心" description="与咨询师的沟通记录将在这里显示" />
      <CustomTabBar />
    </View>
  );
};

export default MessagesPage;
