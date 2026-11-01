import React, { useState, useEffect } from 'react';
import { View, Text, Image } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import styles from './index.module.scss';
import Icon from '@/components/Icon';
import { fetchServiceDetail, createServiceOrder, resolveAssetUrl } from '@/services/api';
import type { AssessmentService } from '@/types/service';

const PAY_METHODS: { key: string; label: string; color: string }[] = [
  { key: 'wechat', label: '微信支付', color: '#3A9B5C' },
  { key: 'alipay', label: '支付宝', color: '#3A7BC0' },
  { key: 'card', label: '银行卡', color: '#C66B2E' }
];

const FLOW_STEPS = ['购买服务', '填写评估问卷', '老师撰写报告', '查看评估报告'];

const ServiceDetailPage: React.FC = () => {
  const router = useRouter();
  const [service, setService] = useState<AssessmentService | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPayModal, setShowPayModal] = useState(false);
  const [payMethod, setPayMethod] = useState('wechat');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const { id } = router.params || {};
    if (id) {
      loadService(id);
    }
  }, [router.params]);

  const loadService = async (id: string) => {
    try {
      setLoading(true);
      const data = await fetchServiceDetail(id);
      setService(data);
    } catch (err) {
      console.error('[ServiceDetail] 加载服务详情失败', err);
    } finally {
      setLoading(false);
    }
  };

  const goCounselor = () => {
    const id = service?.counselor?.id || service?.counselorId;
    if (id) {
      Taro.navigateTo({ url: `/pages/counselor-detail/index?id=${id}` });
    }
  };

  const requireLogin = () => {
    if (Taro.getStorageSync('token')) return true;
    Taro.navigateTo({ url: '/pages/login/index' });
    return false;
  };

  // 立即购买：弹出支付方式选择
  const handleBuy = () => {
    if (!service) return;
    if (!requireLogin()) return;
    setPayMethod('wechat');
    setShowPayModal(true);
  };

  // 在线支付下单：模拟支付直接 paid
  const confirmPay = async () => {
    if (!service || submitting) return;
    try {
      setSubmitting(true);
      const order = await createServiceOrder({
        serviceId: service.id,
        paymentMethod: payMethod,
        offline: false
      });
      setShowPayModal(false);
      if (order.status === 'paid') {
        Taro.showModal({
          title: '购买成功',
          content: '接下来请填写评估问卷，老师将为你撰写专属报告',
          showCancel: false,
          confirmText: '去填写问卷',
          success: () => {
            Taro.navigateTo({ url: `/pages/my-service-detail/index?id=${order.id}` });
          }
        });
      } else {
        Taro.showToast({ title: '订单已创建', icon: 'none' });
        Taro.navigateTo({ url: `/pages/my-service-detail/index?id=${order.id}` });
      }
    } catch (err) {
      Taro.showToast({
        title: err instanceof Error ? err.message : '支付失败，请稍后重试',
        icon: 'none'
      });
    } finally {
      setSubmitting(false);
    }
  };

  // 付款遇到问题：生成线下待支付单，联系客服转账开通
  const handleOffline = () => {
    if (!service || submitting) return;
    if (!requireLogin()) return;
    Taro.showModal({
      title: '付款遇到问题？',
      content: '将为你生成待支付订单，联系客服转账后由客服确认开通',
      confirmText: '确认生成',
      cancelText: '再想想',
      success: async (res) => {
        if (!res.confirm) return;
        try {
          setSubmitting(true);
          await createServiceOrder({ serviceId: service.id, offline: true });
          Taro.showToast({ title: '订单已提交，请前往消息页联系客服', icon: 'none' });
          setTimeout(() => {
            Taro.redirectTo({ url: '/pages/messages/index?toAdmin=1' });
          }, 1200);
        } catch (err) {
          Taro.showToast({
            title: err instanceof Error ? err.message : '下单失败，请稍后重试',
            icon: 'none'
          });
        } finally {
          setSubmitting(false);
        }
      }
    });
  };

  const paragraphs = (service?.description || '')
    .split('\n')
    .map((p) => p.trim())
    .filter(Boolean);

  return (
    <View className={styles.container}>
      {loading ? (
        <Text className={styles.stateText}>加载中...</Text>
      ) : !service ? (
        <View className={styles.empty}>
          <Icon name="book" size={48} color="#C2BDB7" />
          <Text className={styles.emptyText}>服务不存在或已下架</Text>
        </View>
      ) : (
        <View>
          <View className={styles.heroCard}>
            <Text className={styles.serviceName}>{service.name}</Text>
            {service.tagline ? <Text className={styles.tagline}>{service.tagline}</Text> : null}
            <Text className={styles.price}>¥{service.price}</Text>
          </View>

          <View className={styles.counselorCard} onClick={goCounselor}>
            {service.counselor?.avatarUrl ? (
              <Image
                className={styles.avatar}
                src={resolveAssetUrl(service.counselor.avatarUrl) || ''}
                mode="aspectFill"
              />
            ) : (
              <View className={styles.avatarFallback}>
                <Text className={styles.avatarFallbackText}>
                  {(service.counselor?.displayName || service.counselorName || '师').slice(0, 1)}
                </Text>
              </View>
            )}
            <View className={styles.counselorText}>
              <Text className={styles.counselorLabel}>服务老师</Text>
              <Text className={styles.counselorName}>
                {service.counselor?.displayName || service.counselorName || '心理老师'}
              </Text>
              {service.counselor?.title ? (
                <Text className={styles.counselorTitle}>{service.counselor.title}</Text>
              ) : null}
            </View>
            <Icon name="chevronRight" size={16} color="#C2BDB7" />
          </View>

          {paragraphs.length > 0 ? (
            <View className={styles.card}>
              <Text className={styles.sectionTitle}>服务介绍</Text>
              {paragraphs.map((p, i) => (
                <View key={i} className={styles.para}>
                  <Text className={styles.paraText}>{p}</Text>
                </View>
              ))}
            </View>
          ) : null}

          <View className={styles.card}>
            <Text className={styles.sectionTitle}>服务流程</Text>
            <View className={styles.flowList}>
              {FLOW_STEPS.map((step, i) => (
                <View key={step} className={styles.flowStep}>
                  <View className={styles.flowNum}>
                    <Text className={styles.flowNumText}>{i + 1}</Text>
                  </View>
                  <Text className={styles.flowText}>{step}</Text>
                  {i < FLOW_STEPS.length - 1 ? (
                    <View className={styles.flowArrow}>
                      <Icon name="arrowRight" size={12} color="#C2BDB7" />
                    </View>
                  ) : null}
                </View>
              ))}
            </View>
          </View>
        </View>
      )}

      <View className={styles.bottomBar}>
        <View className={styles.secondaryBtn} onClick={handleOffline}>
          <Text className={styles.secondaryText}>付款遇到问题？</Text>
        </View>
        <View className={styles.primaryBtn} onClick={handleBuy}>
          <Text className={styles.primaryText}>立即购买</Text>
        </View>
      </View>

      {showPayModal && service ? (
        <View className={styles.mask} onClick={() => setShowPayModal(false)}>
          <View className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <Text className={styles.modalTitle}>选择支付方式</Text>
            {PAY_METHODS.map((m) => (
              <View
                key={m.key}
                className={`${styles.payOption} ${payMethod === m.key ? styles.payOptionActive : ''}`}
                onClick={() => setPayMethod(m.key)}
              >
                <View className={styles.payBadge} style={{ background: m.color }}>
                  <Text className={styles.payBadgeText}>{m.label.slice(0, 1)}</Text>
                </View>
                <Text className={styles.payOptionLabel}>{m.label}</Text>
                {payMethod === m.key ? <Icon name="check" size={18} color="#7A9A6A" /> : null}
              </View>
            ))}
            <View className={styles.modalConfirm} onClick={confirmPay}>
              <Text className={styles.modalConfirmText}>
                {submitting ? '支付中...' : `确认支付 ¥${service.price}`}
              </Text>
            </View>
          </View>
        </View>
      ) : null}
    </View>
  );
};

export default ServiceDetailPage;
