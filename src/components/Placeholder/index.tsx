import React from 'react';
import { View, Text } from '@tarojs/components';
import styles from './index.module.scss';

interface PlaceholderProps {
  title?: string;
  description?: string;
}

const Placeholder: React.FC<PlaceholderProps> = ({
  title = '功能开发中',
  description = '该功能正在开发中，敬请期待'
}) => {
  return (
    <View className={styles.container}>
      <View className={styles.icon}>🌱</View>
      <Text className={styles.title}>{title}</Text>
      <Text className={styles.description}>{description}</Text>
    </View>
  );
};

export default Placeholder;
