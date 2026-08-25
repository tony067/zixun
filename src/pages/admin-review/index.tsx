import React, { useState } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import { useUserStore } from '@/stores/user';
import CustomTabBar from '@/custom-tab-bar';

const AdminReviewPage: React.FC = () => {
  const { currentRole } = useUserStore();
  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'rejected'>('pending');

  const pendingApplications = [
    { id: '1', name: '赵六', title: '心理咨询师', specialties: ['焦虑症', '抑郁症'], status: 'pending' },
    { id: '2', name: '钱七', title: '心理治疗师', specialties: ['亲子关系', '婚姻家庭'], status: 'pending' },
    { id: '3', name: '孙八', title: '心理咨询师', specialties: ['青少年心理', '学校心理咨询'], status: 'pending' },
  ];

  const approvedApplications = [
    { id: '4', name: '周九', title: '心理咨询师', specialties: ['焦虑症', '职场压力'], status: 'approved' },
    { id: '5', name: '吴十', title: '心理治疗师', specialties: ['创伤修复', 'PTSD'], status: 'approved' },
  ];

  const rejectedApplications = [
    { id: '6', name: '郑十一', title: '心理咨询师', specialties: ['人际关系'], status: 'rejected' },
  ];

  const getApplications = () => {
    switch (activeTab) {
      case 'pending': return pendingApplications;
      case 'approved': return approvedApplications;
      case 'rejected': return rejectedApplications;
    }
  };

  const handleApprove = (id: string) => {
    Taro.showToast({ title: '审核通过', icon: 'success' });
  };

  const handleReject = (id: string) => {
    Taro.showToast({ title: '审核拒绝', icon: 'none' });
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

  const applications = getApplications();

  return (
    <View className={styles.container}>
      <View className={styles.header}>
        <Text className={styles.title}>审核管理</Text>
      </View>
      
      <View className={styles.tabBar}>
        <View
          className={`${styles.tabItem} ${activeTab === 'pending' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('pending')}
        >
          <Text className={styles.tabText}>待审核</Text>
          <Text className={styles.tabBadge}>{pendingApplications.length}</Text>
        </View>
        <View
          className={`${styles.tabItem} ${activeTab === 'approved' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('approved')}
        >
          <Text className={styles.tabText}>已通过</Text>
        </View>
        <View
          className={`${styles.tabItem} ${activeTab === 'rejected' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('rejected')}
        >
          <Text className={styles.tabText}>已拒绝</Text>
        </View>
      </View>
      
      <ScrollView className={styles.scrollContent} scrollY>
        {applications.length === 0 ? (
          <View className={styles.empty}>
            <Text className={styles.emptyText}>暂无数据</Text>
          </View>
        ) : (
          <View className={styles.applicationList}>
            {applications.map(app => (
              <View key={app.id} className={styles.applicationCard}>
                <View className={styles.applicationHeader}>
                  <View className={styles.avatar}>
                    <Text className={styles.avatarText}>{app.name.charAt(0)}</Text>
                  </View>
                  <View className={styles.applicationInfo}>
                    <Text className={styles.applicationName}>{app.name}</Text>
                    <Text className={styles.applicationTitle}>{app.title}</Text>
                  </View>
                </View>
                <View className={styles.applicationTags}>
                  {app.specialties.map((tag, idx) => (
                    <Text key={idx} className={styles.tag}>{tag}</Text>
                  ))}
                </View>
                {activeTab === 'pending' && (
                  <View className={styles.applicationActions}>
                    <View className={styles.rejectButton} onClick={() => handleReject(app.id)}>
                      <Text className={styles.buttonText}>拒绝</Text>
                    </View>
                    <View className={styles.approveButton} onClick={() => handleApprove(app.id)}>
                      <Text className={styles.buttonText}>通过</Text>
                    </View>
                  </View>
                )}
                {activeTab === 'approved' && (
                  <Text className={`${styles.statusText} ${styles.approved}`}>已通过</Text>
                )}
                {activeTab === 'rejected' && (
                  <Text className={`${styles.statusText} ${styles.rejected}`}>已拒绝</Text>
                )}
              </View>
            ))}
          </View>
        )}
      </ScrollView>
      <CustomTabBar />
    </View>
  );
};

export default AdminReviewPage;