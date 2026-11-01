import React, { useState } from 'react';
import { View, Text, Textarea } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import Icon from '@/components/Icon';
import { request } from '@/services/api';

/** 与消息页约定：待打开的客服会话 id，消息页 onShow 时消费 */
const PENDING_OPEN_CONV_KEY = 'mindpace_pending_open_conv';

const SUPPORT_EMAIL = 'support@mindpace.app';

/** 与 web 版 settings/help/page.tsx 一致的联系方式与 FAQ（FAQ 取自 web lib/settings-data） */
const CONTACTS: { icon: 'headphones' | 'send' | 'phone' | 'book'; label: string; sub: string; action: string }[] = [
  { icon: 'headphones', label: '在线客服', sub: '工作日 9:00-18:00', action: 'chat' },
  { icon: 'send', label: '邮件联系', sub: SUPPORT_EMAIL, action: 'mail' },
  { icon: 'phone', label: '服务热线', sub: '400-xxx-xxxx（工作日）', action: 'phone' },
  { icon: 'book', label: '使用指南', sub: '新手必读·功能说明', action: 'guide' }
];

const FAQS: { q: string; a: string }[] = [
  { q: '如何预约咨询师？', a: '在首页浏览咨询师，点击「预约咨询」，选择时间和方式，填写预约信息后提交。等待咨询师24小时内确认后即可支付。' },
  { q: '预约确认后如何支付？', a: '咨询师确认后你会收到通知，在「我的预约」中找到订单，点「立即支付」即可。' },
  { q: '如何取消预约？', a: '在「我的预约」找到订单，咨询前48小时内可申请取消。详细规则见退款政策。' },
  { q: '视频咨询如何进行？', a: '约定时间前你会收到提醒。点订单中的视频链接即可加入，建议提前5分钟测试设备。' },
  { q: '咨询内容保密吗？', a: '是的。所有咨询内容受保密协议保护，除危及生命安全的情况外，咨询师不会向第三方透露你的信息。' },
  { q: '如何申请退款？', a: '联系客服发起退款申请，3个工作日内处理。根据取消时间不同，退款比例会有所不同。' }
];

const FEEDBACK_CATEGORIES = ['建议', '问题', '投诉', '其他'];

const HelpPage: React.FC = () => {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [category, setCategory] = useState('建议');
  const [feedback, setFeedback] = useState('');
  const [contacting, setContacting] = useState(false);

  // 联系客服：与「我的」页一致——创建/复用官方客服会话后跳消息页
  const handleContactService = async () => {
    if (contacting) return;
    if (!Taro.getStorageSync('token')) {
      Taro.redirectTo({ url: '/pages/login/index' });
      return;
    }
    setContacting(true);
    try {
      // Taro.request.Option 类型要求 url 字段；request() 实际以第一个参数 path 为准
      const data = await request<{ conversationId?: string; id?: string }>('/api/messages', {
        url: '/api/messages',
        method: 'POST',
        data: { toAdmin: true }
      });
      const convId = data?.conversationId || data?.id;
      if (!convId) throw new Error('未返回会话');
      Taro.setStorageSync(PENDING_OPEN_CONV_KEY, convId);
      Taro.switchTab({ url: '/pages/messages/index' });
    } catch (err) {
      console.error('[SettingsHelp] 联系客服失败', err);
      Taro.showToast({ title: '客服暂不可用，请稍后再试', icon: 'none' });
    } finally {
      setContacting(false);
    }
  };

  const handleContact = (action: string) => {
    if (action === 'chat') {
      handleContactService();
    } else if (action === 'guide') {
      Taro.navigateTo({ url: '/pages/guide/index' });
    } else if (action === 'mail') {
      Taro.setClipboardData({
        data: SUPPORT_EMAIL,
        success: () => {
          Taro.showToast({ title: '邮箱已复制', icon: 'none' });
        }
      });
    }
    // phone：占位号码，不做拨号处理
  };

  const handleSubmitFeedback = () => {
    if (!feedback.trim()) return;
    setFeedback('');
    Taro.showToast({ title: '感谢反馈', icon: 'success' });
  };

  return (
    <View className={styles.container}>
      {/* 联系我们 */}
      <View className={styles.card}>
        <Text className={styles.cardTitle}>联系我们</Text>
        {CONTACTS.map((c, i) => (
          <View
            key={c.action}
            className={`${styles.contactRow}${i < CONTACTS.length - 1 ? ` ${styles.rowBorder}` : ''}`}
            onClick={() => handleContact(c.action)}
          >
            <View className={styles.contactIcon}>
              <Icon name={c.icon} size={16} color="#7A9A6A" />
            </View>
            <View className={styles.contactInfo}>
              <Text className={styles.contactLabel}>{c.label}</Text>
              <Text className={styles.contactSub}>{c.sub}</Text>
            </View>
            <Icon name="chevronRight" size={14} color="#C4B8AC" />
          </View>
        ))}
      </View>

      {/* 常见问题 */}
      <View className={styles.card}>
        <Text className={styles.cardTitle}>常见问题</Text>
        {FAQS.map((item, i) => (
          <View key={i} className={i < FAQS.length - 1 ? styles.rowBorder : undefined}>
            <View className={styles.faqRow} onClick={() => setOpenFaq(openFaq === i ? null : i)}>
              <Text className={styles.faqQuestion}>{item.q}</Text>
              <View
                className={styles.faqChevron}
                style={{ transform: openFaq === i ? 'rotate(180deg)' : 'none' }}
              >
                <Icon name="chevronDown" size={16} color="#9B8E82" />
              </View>
            </View>
            {openFaq === i && (
              <Text className={styles.faqAnswer}>{item.a}</Text>
            )}
          </View>
        ))}
      </View>

      {/* 意见反馈 */}
      <View className={styles.card}>
        <Text className={styles.cardTitle}>意见反馈</Text>
        <View className={styles.categoryRow}>
          {FEEDBACK_CATEGORIES.map(cat => (
            <View
              key={cat}
              className={`${styles.categoryTag}${category === cat ? ` ${styles.categoryTagActive}` : ''}`}
              onClick={() => setCategory(cat)}
            >
              <Text
                className={`${styles.categoryText}${category === cat ? ` ${styles.categoryTextActive}` : ''}`}
              >
                {cat}
              </Text>
            </View>
          ))}
        </View>
        <Textarea
          className={styles.feedbackInput}
          value={feedback}
          placeholder="请描述你遇到的问题或建议，我们会认真阅读每一条反馈…"
          placeholderClass={styles.feedbackPlaceholder}
          maxlength={500}
          onInput={(e) => setFeedback(e.detail.value)}
        />
        <View
          className={`${styles.submitButton}${feedback.trim() ? '' : ` ${styles.submitButtonDisabled}`}`}
          onClick={handleSubmitFeedback}
        >
          <Text className={styles.submitButtonText}>提交反馈</Text>
        </View>
      </View>

      {/* 底部联系客服 */}
      <View className={styles.contactButton} onClick={handleContactService}>
        <Icon name="headphones" size={16} color="#7A9A6A" />
        <Text className={styles.contactButtonText}>联系在线客服</Text>
      </View>
    </View>
  );
};

export default HelpPage;
