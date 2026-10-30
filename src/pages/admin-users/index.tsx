import React, { useCallback, useState } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import styles from './index.module.scss';
import { useUserStore } from '@/stores/user';
import { request } from '@/services/api';
import CustomTabBar from '@/components/TabBar';

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
}

type UserTab = 'all' | 'client' | 'counselor';

// 非咨询师的普通用户（可授予/撤销客服）
const ORDINARY_ROLES = ['visitor', 'client', 'tester'];

const ROLE_TEXT: Record<string, string> = {
  visitor: '来访者',
  client: '来访者',
  tester: '测试',
  counselor: '咨询师',
  admin: '管理员',
  support: '客服'
};

const ROLE_COLOR: Record<string, string> = {
  visitor: '#7A9A6A',
  client: '#7A9A6A',
  tester: '#9B8E82',
  counselor: '#E6A23C',
  admin: '#2563EB',
  support: '#B07D2A'
};

function fmtDate(iso: string): string {
  if (!iso) return '-';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

const AdminUsersPage: React.FC = () => {
  const { currentRole } = useUserStore();
  const [activeTab, setActiveTab] = useState<UserTab>('all');
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await request<any[]>('/api/admin/users');
      setUsers(
        Array.isArray(data)
          ? data.map(u => ({
              id: u?.id || '',
              name: u?.name || u?.email || '未设置昵称',
              email: u?.email || '',
              role: u?.role || 'visitor',
              createdAt: u?.createdAt || ''
            }))
          : []
      );
    } catch (err) {
      Taro.showToast({
        title: err instanceof Error ? err.message : '加载用户失败，请稍后重试',
        icon: 'none'
      });
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useDidShow(() => {
    loadUsers();
  });

  const filteredUsers = activeTab === 'all'
    ? users
    : users.filter(u => (activeTab === 'counselor' ? u.role === 'counselor' : ORDINARY_ROLES.includes(u.role)));

  const getRoleText = (role: string) => ROLE_TEXT[role] || role;
  const getRoleColor = (role: string) => ROLE_COLOR[role] || '#909399';

  // 授予/撤销客服权限（客服仅开放：消息收件箱 + 订单促进[标记已支付/退款]）
  const handleToggleSupport = (user: AdminUser) => {
    const toSupport = user.role !== 'support';
    const label = toSupport ? '设为客服' : '移回来访者';
    Taro.showModal({
      title: label,
      content: `确认将用户「${user.name}」${label}吗？`,
      confirmText: '确认',
      cancelText: '取消',
      success: async (res) => {
        if (!res.confirm) return;
        try {
          // Taro.request.Option 类型要求 url 字段；request() 实际以第一个参数 path 为准
          await request(`/api/admin/users/${user.id}`, {
            url: `/api/admin/users/${user.id}`,
            method: 'PATCH',
            data: { role: toSupport ? 'support' : 'visitor' }
          });
          Taro.showToast({ title: `${label}成功`, icon: 'success' });
          loadUsers();
        } catch (err) {
          Taro.showToast({
            title: err instanceof Error ? err.message : '操作失败，请稍后重试',
            icon: 'none'
          });
        }
      }
    });
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
            <Text className={styles.emptyText}>{loading ? '加载中…' : '暂无用户'}</Text>
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
                  <Text className={styles.userDate}>注册时间: {fmtDate(user.createdAt)}</Text>
                  {(ORDINARY_ROLES.includes(user.role) || user.role === 'support') && (
                    <View
                      className={`${styles.actionButton} ${user.role === 'support' ? styles.actionButtonMuted : styles.actionButtonPrimary}`}
                      onClick={() => handleToggleSupport(user)}
                    >
                      <Text className={styles.actionButtonText}>
                        {user.role === 'support' ? '移回来访' : '设为客服'}
                      </Text>
                    </View>
                  )}
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
