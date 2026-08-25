import React from 'react';
import { View, Text } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import { useUserStore } from '@/stores/user';
import CustomTabBar from '@/custom-tab-bar';
import Icon from '@/components/Icon';

const CounselorProfilePage: React.FC = () => {
  const { currentRole, user } = useUserStore();

  if (currentRole !== 'counselor') {
    return (
      <View className={styles.container}>
        <View className={styles.unauthorized}>
          <Text className={styles.unauthorizedText}>请切换到咨询师角色查看此页面</Text>
        </View>
      </View>
    );
  }

  return (
    <View className={styles.container}>
      <View className={styles.header}>
        <Text className={styles.title}>档案编辑</Text>
      </View>
      
      <View className={styles.content}>
        <View className={styles.profileCard}>
          <View className={styles.avatarSection}>
            <View className={styles.avatar}>
              <Text className={styles.avatarText}>{user?.name?.charAt(0) || '?'}</Text>
            </View>
            <Text className={styles.userName}>{user?.name}</Text>
            <Text className={styles.userEmail}>{user?.email}</Text>
          </View>
          
          <View className={styles.section}>
            <Text className={styles.sectionTitle}>个人信息</Text>
            <View className={styles.sectionContent}>
              <View className={styles.infoItem}>
                <Text className={styles.infoLabel}>姓名</Text>
                <Text className={styles.infoValue}>{user?.name}</Text>
              </View>
              <View className={styles.infoItem}>
                <Text className={styles.infoLabel}>邮箱</Text>
                <Text className={styles.infoValue}>{user?.email}</Text>
              </View>
            </View>
          </View>
          
          <View className={styles.section}>
            <Text className={styles.sectionTitle}>资质认证</Text>
            <View className={styles.sectionContent}>
              <View className={styles.certItem}>
                <Text className={styles.certText}>心理咨询师资格证</Text>
                <Text className={styles.certStatus}>已认证</Text>
              </View>
              <View className={styles.certItem}>
                <Text className={styles.certText}>学历证明</Text>
                <Text className={styles.certStatus}>已认证</Text>
              </View>
              <View className={styles.certItem}>
                <Text className={styles.certText}>执业经验</Text>
                <Text className={styles.certStatus}>已认证</Text>
              </View>
            </View>
          </View>
        </View>
        
        <View className={styles.actionCard}>
          <View className={styles.actionItem} onClick={() => Taro.showToast({ title: '编辑资料功能开发中', icon: 'none' })}>
            <Icon name="edit" size={24} color="#9B8E82" />
            <Text className={styles.actionText}>编辑资料</Text>
            <Icon name="chevronRight" size={20} color="#C2BDB7" />
          </View>
          <View className={styles.actionItem} onClick={() => Taro.showToast({ title: '修改密码功能开发中', icon: 'none' })}>
            <Icon name="lock" size={24} color="#9B8E82" />
            <Text className={styles.actionText}>修改密码</Text>
            <Icon name="chevronRight" size={20} color="#C2BDB7" />
          </View>
        </View>
      </View>
      <CustomTabBar />
    </View>
  );
};

export default CounselorProfilePage;