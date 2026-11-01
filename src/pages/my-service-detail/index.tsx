import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, Image, Textarea } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import styles from './index.module.scss';
import Icon from '@/components/Icon';
import {
  fetchServiceOrderDetail,
  patchServiceOrder,
  resolveAssetUrl,
  request
} from '@/services/api';
import { getServiceStatusMeta, getServiceStatusDesc } from '@/types/service';
import type { ServiceOrder, ServiceAnswer, ServiceQuestion } from '@/types/service';

const PAY_METHODS: { key: string; label: string; color: string }[] = [
  { key: 'wechat', label: '微信支付', color: '#3A9B5C' },
  { key: 'alipay', label: '支付宝', color: '#3A7BC0' },
  { key: 'card', label: '银行卡', color: '#C66B2E' }
];

type AnswerValue = string | string[] | number;

function formatDate(s?: string | null): string {
  if (!s) return '';
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return '';
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mm}-${dd}`;
}

const MyServiceDetailPage: React.FC = () => {
  const router = useRouter();
  const [order, setOrder] = useState<ServiceOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [answers, setAnswers] = useState<Record<string, AnswerValue>>({});
  const [showPayModal, setShowPayModal] = useState(false);
  const [payMethod, setPayMethod] = useState('wechat');
  const [submitting, setSubmitting] = useState(false);
  const [contacting, setContacting] = useState(false);

  // counselor/staff 打开时：问卷只读、隐藏来访端操作
  const isStaffView = useMemo(() => {
    try {
      const info = Taro.getStorageSync('userInfo');
      const role = info && typeof info === 'object' ? String(info.role || '') : '';
      return role === 'counselor' || role === 'staff';
    } catch {
      return false;
    }
  }, []);

  useEffect(() => {
    const { id } = router.params || {};
    if (id) {
      loadOrder(id);
    }
  }, [router.params]);

  const loadOrder = async (id: string) => {
    try {
      setLoading(true);
      setLoadError('');
      const data = await fetchServiceOrderDetail(id);
      setOrder(data);
      if (!data) {
        setLoadError('订单不存在或已被删除');
      }
    } catch (err) {
      console.error('[MyServiceDetail] 加载订单失败', err);
      setLoadError(err instanceof Error ? err.message : '加载失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const refresh = () => {
    const { id } = router.params || {};
    if (id) {
      loadOrder(id);
    }
  };

  // questionId → answer 映射（只读回填用）
  const answerMap = useMemo(() => {
    const map: Record<string, ServiceAnswer> = {};
    (order?.answers || []).forEach((a) => {
      map[a.questionId] = a;
    });
    return map;
  }, [order]);

  const questions = order?.questions || [];
  const canFill = order?.status === 'paid' && !isStaffView && questions.length > 0;
  const showBottomBar = order?.status === 'pending_payment' && !isStaffView;

  // ===== 表单交互 =====
  const setSingle = (qid: string, opt: string) => {
    setAnswers((prev) => ({ ...prev, [qid]: opt }));
  };

  const toggleMulti = (qid: string, opt: string) => {
    setAnswers((prev) => {
      const cur = Array.isArray(prev[qid]) ? [...(prev[qid] as string[])] : [];
      const idx = cur.indexOf(opt);
      if (idx >= 0) {
        cur.splice(idx, 1);
      } else {
        cur.push(opt);
      }
      return { ...prev, [qid]: cur };
    });
  };

  const setText = (qid: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [qid]: value }));
  };

  const setScale = (qid: string, n: number) => {
    setAnswers((prev) => ({ ...prev, [qid]: n }));
  };

  // ===== 联系老师：创建会话后跳消息页 =====
  const handleContact = async () => {
    if (!order?.counselor?.userId || contacting) return;
    try {
      setContacting(true);
      await request('/api/conversations', {
        method: 'POST',
        data: { otherUserId: order.counselor.userId }
      } as Taro.request.Option);
      Taro.redirectTo({ url: '/pages/messages/index' });
    } catch (err) {
      Taro.showToast({
        title: err instanceof Error ? err.message : '联系老师失败，请稍后重试',
        icon: 'none'
      });
    } finally {
      setContacting(false);
    }
  };

  // ===== 链接处理：小程序复制到剪贴板，H5 直接打开 =====
  const openOrCopyLink = (url: string) => {
    const full = resolveAssetUrl(url) || url;
    if (process.env.TARO_ENV === 'h5') {
      window.open(full, '_blank');
      return;
    }
    Taro.setClipboardData({
      data: full,
      success: () => {
        Taro.showToast({ title: '链接已复制，请在浏览器打开', icon: 'none' });
      }
    });
  };

  // ===== 外链问卷：占位答案满足服务端非空校验 =====
  const handleExternalSubmit = () => {
    if (!order || submitting) return;
    Taro.showModal({
      title: '确认填写完毕',
      content: '确认你已在外部问卷链接完成填写？提交后老师将开始撰写报告。',
      confirmText: '确认提交',
      cancelText: '再想想',
      success: async (res) => {
        if (!res.confirm) return;
        try {
          setSubmitting(true);
          await patchServiceOrder(order.id, {
            action: 'submit',
            answers: [{ questionId: 'external', value: '已通过外链问卷提交' }]
          });
          Taro.showToast({ title: '已提交，老师将开始撰写报告', icon: 'none' });
          refresh();
        } catch (err) {
          Taro.showToast({
            title: err instanceof Error ? err.message : '提交失败，请稍后重试',
            icon: 'none'
          });
        } finally {
          setSubmitting(false);
        }
      }
    });
  };

  // ===== 内置问卷提交 =====
  const handleSubmit = () => {
    if (!order || submitting) return;
    // required 校验：未答提示题号
    const missingIdx = questions.findIndex((q) => {
      if (!q.required) return false;
      const v = answers[q.id];
      if (Array.isArray(v)) return v.length === 0;
      if (typeof v === 'string') return v.trim() === '';
      return v === undefined;
    });
    if (missingIdx >= 0) {
      Taro.showToast({ title: `请完成第 ${missingIdx + 1} 题`, icon: 'none' });
      return;
    }
    // 收集非空答案
    const payload: ServiceAnswer[] = [];
    questions.forEach((q) => {
      const v = answers[q.id];
      if (v === undefined) return;
      if (Array.isArray(v)) {
        if (v.length > 0) payload.push({ questionId: q.id, value: v });
        return;
      }
      if (typeof v === 'string') {
        if (v.trim() !== '') payload.push({ questionId: q.id, value: v });
        return;
      }
      payload.push({ questionId: q.id, value: v });
    });
    Taro.showModal({
      title: '提交确认',
      content: '提交后不可修改，确定提交问卷吗？',
      confirmText: '提交',
      cancelText: '再想想',
      success: async (res) => {
        if (!res.confirm) return;
        try {
          setSubmitting(true);
          await patchServiceOrder(order.id, { action: 'submit', answers: payload });
          Taro.showToast({ title: '已提交，老师将开始撰写报告', icon: 'none' });
          refresh();
        } catch (err) {
          Taro.showToast({
            title: err instanceof Error ? err.message : '提交失败，请稍后重试',
            icon: 'none'
          });
        } finally {
          setSubmitting(false);
        }
      }
    });
  };

  // ===== 待支付：取消订单 =====
  const handleCancel = () => {
    if (!order || submitting) return;
    Taro.showModal({
      title: '取消订单',
      content: '确定要取消这条待支付订单吗？',
      confirmText: '取消订单',
      cancelText: '再想想',
      success: async (res) => {
        if (!res.confirm) return;
        try {
          setSubmitting(true);
          await patchServiceOrder(order.id, { action: 'cancel' });
          Taro.showToast({ title: '订单已取消', icon: 'none' });
          refresh();
        } catch (err) {
          Taro.showToast({
            title: err instanceof Error ? err.message : '取消失败，请稍后重试',
            icon: 'none'
          });
        } finally {
          setSubmitting(false);
        }
      }
    });
  };

  // ===== 待支付：立即支付 =====
  const confirmPay = async () => {
    if (!order || submitting) return;
    try {
      setSubmitting(true);
      await patchServiceOrder(order.id, { action: 'pay', paymentMethod: payMethod });
      setShowPayModal(false);
      Taro.showToast({ title: '支付成功', icon: 'success' });
      refresh();
    } catch (err) {
      Taro.showToast({
        title: err instanceof Error ? err.message : '支付失败，请稍后重试',
        icon: 'none'
      });
    } finally {
      setSubmitting(false);
    }
  };

  // 只读答案展示文案
  const formatAnswer = (q: ServiceQuestion, a?: ServiceAnswer): string => {
    if (!a) return '未作答';
    const v = a.value;
    if (Array.isArray(v)) return v.length > 0 ? v.join('、') : '未作答';
    if (typeof v === 'number') return q.type === 'scale' ? `${v} 分` : String(v);
    const s = (v || '').trim();
    return s ? s : '未作答';
  };

  const renderForm = () => (
    <View>
      {questions.map((q, idx) => (
        <View key={q.id} className={styles.questionItem}>
          <Text className={styles.questionTitle}>
            {idx + 1}. {q.title}
            {q.required ? <Text className={styles.required}> *</Text> : null}
          </Text>

          {q.type === 'single' ? (
            <View className={styles.options}>
              {(q.options || []).map((opt) => (
                <View
                  key={opt}
                  className={`${styles.option} ${answers[q.id] === opt ? styles.optionActive : ''}`}
                  onClick={() => setSingle(q.id, opt)}
                >
                  <Text
                    className={`${styles.optionText} ${answers[q.id] === opt ? styles.optionTextActive : ''}`}
                  >
                    {opt}
                  </Text>
                </View>
              ))}
            </View>
          ) : null}

          {q.type === 'multi' ? (
            <View className={styles.options}>
              {(q.options || []).map((opt) => {
                const selected =
                  Array.isArray(answers[q.id]) && (answers[q.id] as string[]).includes(opt);
                return (
                  <View
                    key={opt}
                    className={`${styles.option} ${selected ? styles.optionActive : ''}`}
                    onClick={() => toggleMulti(q.id, opt)}
                  >
                    <Text
                      className={`${styles.optionText} ${selected ? styles.optionTextActive : ''}`}
                    >
                      {opt}
                    </Text>
                  </View>
                );
              })}
            </View>
          ) : null}

          {q.type === 'text' ? (
            <Textarea
              className={styles.textarea}
              value={typeof answers[q.id] === 'string' ? (answers[q.id] as string) : ''}
              placeholder="请输入你的想法"
              maxlength={500}
              onInput={(e) => setText(q.id, e.detail.value)}
            />
          ) : null}

          {q.type === 'scale' ? (
            <View className={styles.scaleRow}>
              {[1, 2, 3, 4, 5].map((n) => (
                <View
                  key={n}
                  className={`${styles.scaleItem} ${answers[q.id] === n ? styles.scaleItemActive : ''}`}
                  onClick={() => setScale(q.id, n)}
                >
                  <Text
                    className={`${styles.scaleText} ${answers[q.id] === n ? styles.scaleTextActive : ''}`}
                  >
                    {n}
                  </Text>
                </View>
              ))}
            </View>
          ) : null}
        </View>
      ))}
      <View className={styles.submitBtn} onClick={handleSubmit}>
        <Text className={styles.submitBtnText}>{submitting ? '提交中...' : '提交问卷'}</Text>
      </View>
    </View>
  );

  const renderReadonly = () => (
    <View>
      {questions.map((q, idx) => (
        <View key={q.id} className={styles.questionItem}>
          <Text className={styles.questionTitle}>
            {idx + 1}. {q.title}
          </Text>
          <View className={styles.readonlyValue}>
            <Text className={styles.readonlyText}>{formatAnswer(q, answerMap[q.id])}</Text>
          </View>
        </View>
      ))}
    </View>
  );

  const meta = getServiceStatusMeta(order?.status || '');

  return (
    <View className={`${styles.container} ${showBottomBar ? styles.withBar : ''}`}>
      {loading ? (
        <Text className={styles.stateText}>加载中...</Text>
      ) : !order ? (
        <View className={styles.empty}>
          <Icon name="list" size={48} color="#C2BDB7" />
          <Text className={styles.emptyText}>{loadError || '订单不存在'}</Text>
        </View>
      ) : (
        <View>
          {/* 顶部状态卡 */}
          <View className={styles.statusCard}>
            <View className={styles.badge} style={{ background: meta.bg }}>
              <Text className={styles.badgeText} style={{ color: meta.color }}>
                {meta.label}
              </Text>
            </View>
            <Text className={styles.statusDesc}>{getServiceStatusDesc(order.status)}</Text>
            <View className={styles.orderMeta}>
              <Text className={styles.orderName}>
                {order.serviceName || '个性服务评估'}
                {formatDate(order.createdAt) ? ` · ${formatDate(order.createdAt)}` : ''}
              </Text>
              <Text className={styles.orderPrice}>¥{order.price}</Text>
            </View>
          </View>

          {/* 老师卡 */}
          {order.counselor ? (
            <View className={styles.card}>
              <View className={styles.counselorRow}>
                {order.counselor.avatarUrl ? (
                  <Image
                    className={styles.avatar}
                    src={resolveAssetUrl(order.counselor.avatarUrl) || ''}
                    mode="aspectFill"
                  />
                ) : (
                  <View className={styles.avatarFallback}>
                    <Text className={styles.avatarFallbackText}>
                      {(order.counselor.displayName || '师').slice(0, 1)}
                    </Text>
                  </View>
                )}
                <View className={styles.counselorText}>
                  <Text className={styles.counselorLabel}>服务老师</Text>
                  <Text className={styles.counselorName}>
                    {order.counselor.displayName || order.counselorName || '心理老师'}
                  </Text>
                  {order.counselor.title ? (
                    <Text className={styles.counselorTitle}>{order.counselor.title}</Text>
                  ) : null}
                </View>
                {!isStaffView && order.counselor.userId ? (
                  <View className={styles.contactBtn} onClick={handleContact}>
                    <Icon name="message" size={14} color="#C66B2E" />
                    <Text className={styles.contactBtnText}>
                      {contacting ? '跳转中...' : '联系老师'}
                    </Text>
                  </View>
                ) : null}
              </View>
            </View>
          ) : null}

          {/* 外链问卷（paid 状态且有外链） */}
          {order.status === 'paid' && order.questionnaireLink ? (
            <View className={styles.card}>
              <Text className={styles.sectionTitle}>外部评估问卷</Text>
              <Text className={styles.sectionDesc}>
                请复制链接到浏览器完成问卷，完成后回来点击「我已填写完毕」，老师将开始撰写报告。
              </Text>
              <View className={styles.linkBox}>
                <Text className={styles.linkText}>{order.questionnaireLink}</Text>
              </View>
              <View className={styles.btnRow}>
                <View className={styles.secondaryBtn} onClick={() => openOrCopyLink(order.questionnaireLink!)}>
                  <Text className={styles.secondaryText}>复制链接</Text>
                </View>
                {!isStaffView ? (
                  <View className={styles.primaryBtn} onClick={handleExternalSubmit}>
                    <Text className={styles.primaryText}>我已填写完毕</Text>
                  </View>
                ) : null}
              </View>
            </View>
          ) : null}

          {/* 内置问卷 */}
          {questions.length > 0 ? (
            <View className={styles.card}>
              <Text className={styles.sectionTitle}>评估问卷</Text>
              {canFill ? renderForm() : renderReadonly()}
            </View>
          ) : order.status === 'submitted' || order.status === 'completed' ? (
            order.questionnaireLink || (order.answers || []).some((a) => a.questionId === 'external') ? (
              <View className={styles.card}>
                <Text className={styles.sectionTitle}>评估问卷</Text>
                <Text className={styles.readonlyHint}>
                  已通过外部问卷链接完成填写
                  {order.submittedAt ? `（${formatDate(order.submittedAt)}）` : ''}
                </Text>
              </View>
            ) : null
          ) : null}

          {/* 报告（completed 后接口才返回报告字段） */}
          {order.status === 'completed' &&
          (order.report || order.reportLink || order.reportFileUrl) ? (
            <View className={styles.card}>
              <Text className={styles.sectionTitle}>评估报告</Text>
              {(order.report || '')
                .split('\n')
                .map((p) => p.trim())
                .filter(Boolean)
                .map((p, i) => (
                  <View key={i} className={styles.para}>
                    <Text className={styles.paraText}>{p}</Text>
                  </View>
                ))}
              {order.reportFileUrl ? (
                <View className={styles.reportBtn} onClick={() => openOrCopyLink(order.reportFileUrl!)}>
                  <Icon name="book" size={16} color="#3A9B8E" />
                  <Text className={styles.reportBtnText}>查看报告文件</Text>
                </View>
              ) : null}
              {order.reportLink ? (
                <View className={styles.reportBtn} onClick={() => openOrCopyLink(order.reportLink!)}>
                  <Icon name="share" size={16} color="#3A9B8E" />
                  <Text className={styles.reportBtnText}>打开报告链接</Text>
                </View>
              ) : null}
            </View>
          ) : null}
        </View>
      )}

      {/* 待支付底部操作条 */}
      {showBottomBar && order ? (
        <View className={styles.bottomBar}>
          <View className={styles.cancelBtn} onClick={handleCancel}>
            <Text className={styles.cancelBtnText}>取消订单</Text>
          </View>
          <View
            className={styles.payNowBtn}
            onClick={() => {
              setPayMethod('wechat');
              setShowPayModal(true);
            }}
          >
            <Text className={styles.payNowText}>立即支付 ¥{order.price}</Text>
          </View>
        </View>
      ) : null}

      {/* 支付方式弹窗 */}
      {showPayModal && order ? (
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
                {submitting ? '支付中...' : `确认支付 ¥${order.price}`}
              </Text>
            </View>
          </View>
        </View>
      ) : null}
    </View>
  );
};

export default MyServiceDetailPage;
