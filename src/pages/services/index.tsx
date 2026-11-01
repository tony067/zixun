import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, Image } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import Icon from '@/components/Icon';
import { fetchServices, resolveAssetUrl } from '@/services/api';
import type { AssessmentService, ServiceCounselorBrief } from '@/types/service';

interface CounselorGroup {
  key: string;
  counselor: ServiceCounselorBrief | null;
  services: AssessmentService[];
}

const ServicesPage: React.FC = () => {
  const [services, setServices] = useState<AssessmentService[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    loadServices();
  }, []);

  const loadServices = async () => {
    try {
      setLoading(true);
      setErrorMsg('');
      const data = await fetchServices();
      setServices(data);
    } catch (err) {
      console.error('[Services] 加载服务列表失败', err);
      setErrorMsg(err instanceof Error ? err.message : '加载失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  // 按老师分组：同一老师的全部服务收进一张老师卡
  const groups = useMemo<CounselorGroup[]>(() => {
    const map = new Map<string, CounselorGroup>();
    services.forEach((s) => {
      const key = s.counselor?.id || s.counselorId || '_unknown';
      const group = map.get(key);
      if (group) {
        group.services.push(s);
      } else {
        map.set(key, { key, counselor: s.counselor || null, services: [s] });
      }
    });
    return Array.from(map.values());
  }, [services]);

  const goOrderList = () => {
    if (!Taro.getStorageSync('token')) {
      Taro.navigateTo({ url: '/pages/login/index' });
      return;
    }
    Taro.navigateTo({ url: '/pages/my-services/index' });
  };

  const goServiceDetail = (id: string) => {
    Taro.navigateTo({ url: `/pages/service-detail/index?id=${id}` });
  };

  const goCounselor = (id?: string) => {
    if (!id) return;
    Taro.navigateTo({ url: `/pages/counselor-detail/index?id=${id}` });
  };

  return (
    <View className={styles.container}>
      <View className={styles.header}>
        <View>
          <Text className={styles.headerTitle}>个性服务评估</Text>
          <Text className={styles.headerSub}>专业心理评估，更懂你自己</Text>
        </View>
        <View className={styles.orderEntry} onClick={goOrderList}>
          <Icon name="list" size={16} color="#7A9A6A" />
          <Text className={styles.orderEntryText}>我的订单</Text>
        </View>
      </View>

      {loading ? (
        <Text className={styles.stateText}>加载中...</Text>
      ) : errorMsg ? (
        <View className={styles.errorWrap}>
          <Text className={styles.stateText}>{errorMsg}</Text>
          <View className={styles.retryBtn} onClick={loadServices}>
            <Text className={styles.retryText}>重新加载</Text>
          </View>
        </View>
      ) : groups.length === 0 ? (
        <View className={styles.empty}>
          <Icon name="book" size={48} color="#C2BDB7" />
          <Text className={styles.emptyText}>暂无上架服务</Text>
        </View>
      ) : (
        groups.map((group) => (
          <View key={group.key} className={styles.groupCard}>
            <View className={styles.counselorRow} onClick={() => goCounselor(group.counselor?.id)}>
              {group.counselor?.avatarUrl ? (
                <Image
                  className={styles.avatar}
                  src={resolveAssetUrl(group.counselor.avatarUrl) || ''}
                  mode="aspectFill"
                />
              ) : (
                <View className={styles.avatarFallback}>
                  <Text className={styles.avatarFallbackText}>
                    {(group.counselor?.displayName || '师').slice(0, 1)}
                  </Text>
                </View>
              )}
              <View className={styles.counselorText}>
                <Text className={styles.counselorName}>
                  {group.counselor?.displayName || '心理老师'}
                </Text>
                {group.counselor?.title ? (
                  <Text className={styles.counselorTitle}>{group.counselor.title}</Text>
                ) : null}
                {group.counselor?.bio ? (
                  <Text className={styles.counselorBio}>{group.counselor.bio}</Text>
                ) : null}
              </View>
            </View>

            <View>
              {group.services.map((s) => (
                <View key={s.id} className={styles.serviceRow} onClick={() => goServiceDetail(s.id)}>
                  <View className={styles.serviceInfo}>
                    <Text className={styles.serviceName}>{s.name}</Text>
                    {s.tagline ? <Text className={styles.serviceTagline}>{s.tagline}</Text> : null}
                  </View>
                  <View className={styles.serviceRight}>
                    <Text className={styles.servicePrice}>¥{s.price}</Text>
                    <Icon name="chevronRight" size={14} color="#C2BDB7" />
                  </View>
                </View>
              ))}
            </View>
          </View>
        ))
      )}
    </View>
  );
};

export default ServicesPage;
