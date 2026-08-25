import React, { useState } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import { useUserStore } from '@/stores/user';
import CustomTabBar from '@/custom-tab-bar';

const AdminUsersPage: React.FC = () => {
  const { currentRole } = useUserStore();
  const [activeTab, setActiveTab] = useState<'all' | 'client' | 'counselor'>('all');

  const users = [
    { id: '1', name: '张三', email: 'zhangsan@example.com', role: 'client', createdAt: '2024-01-10' },
    { id: '2', name: '李四', email: 'lisi@example.com', role: 'client', createdAt: '2024-01-12' },
    { id: '3', name: '王咨询师', email: 'wang@example.com', role: 'counselor', createdAt: '2024-01-05' },
    { id: '4', name: '李咨询师', email: 'li@example.com', role: 'counselor', createdAt: '2024-01-08' },
    { id: '5', name: '王五', email: 'wangwu@example.com', role: 'client', createdAt: '2024-01-14' },
    { id: '6', name: '赵六', email: 'zhaoliu@example.com', role: 'counselor', createdAt: '2024-01-15' },
  ];

  const filteredUsers = activeTab === 'all' 
    ? users 
    : users.filter(u => u.role === activeTab);

  const getRoleText = (role: string) => {
    const map: Record<string, string> = {
      client: '来访者',
      counselor: '咨询师'
    };
    return map[role] || role;
  };

  const getRoleColor = (role: string) => {
    const map: Record<string, string> = {
      client: '#7A9A6A',
      counselor: '#E6A23C'
    };
    return map[role] || '#909399';
  };

  if (currentRole !== 'admin') {
    return (
      <View className={styles.container}>
        <View className={styles.unauthorized}>
          <Text className={styles.unauthorizedText}>请切换到管理员角色查看此页面</Text>
        </View>
      </View>
    );
  }

  return (
    <View className={styles.container}>
      <View className={styles.header}>
        <Text className={styles.title}>用户管理</Text>
      </View>
      
      <View className={styles.tabBar}>
        <View
          className={`${styles.tabItem} ${activeTab === 'all' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('all')}
        >
          <Text className={styles.tabText}>全部</Text>
        </View>
        <View
          className={`${styles.tabItem} ${activeTab === 'client' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('client')}
        >
          <Text className={styles.tabText}>来访者</Text>
        </View>
        <View
          className={`${styles.tabItem} ${activeTab === 'counselor' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('counselor')}
        >
          <Text className={styles.tabText}>咨询师</Text>
        </View>
      </View>
      
      <ScrollView className={styles.scrollContent} scrollY>
        {filteredUsers.length === 0 ? (
          <View className={styles.empty}>
            <Text className={styles.emptyText}>暂无用户</Text>
          </View>
        ) : (
          <View className={styles.userList}>
            {filteredUsers.map(user => (
              <View key={user.id} className={styles.userCard}>
                <View className={styles.userHeader}>
                  <View className={styles.avatar}>
                    <Text className={styles.avatarText}>{user.name.charAt(0)}</Text>
                  </View>
                  <View className={styles.userInfo}>
                    <Text className={styles.userName}>{user.name}</Text>
                    <Text className={styles.userEmail}>{user.email}</Text>
                  </View>
                  <Text className={styles.userRole} style={{ color: getRoleColor(user.role), background: `${getRoleColor(user.role)}20` }}>
                    {getRoleText(user.role)}
                  </Text>
                </View>
                <View className={styles.userFooter}>
                  <Text className={styles.userDate}>注册时间: {user.createdAt}</Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
      <CustomTabBar />
    </View>
  );
};

export default AdminUsersPage;