import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, Input, Textarea, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import Icon from '@/components/Icon';
import styles from './index.module.scss';
import { useUserStore } from '@/stores/user';
import {
  fetchCounselorServices,
  createCounselorService,
  updateCounselorService,
  fetchServiceOrders
} from '@/services/api';
import { getServiceStatusMeta } from '@/types/service';
import type {
  AssessmentService,
  ServiceOrder,
  ServiceQuestion,
  ServiceQuestionType
} from '@/types/service';

// ============================================
// 常量
// ============================================

const QUESTION_TYPE_META: Record<ServiceQuestionType, { label: string; color: string; bg: string }> = {
  single: { label: '单选', color: '#3A9B8E', bg: '#E4F2F0' },
  multi: { label: '多选', color: '#C66B2E', bg: '#FAE9DD' },
  text: { label: '问答', color: '#7A9A6A', bg: '#EAF1E2' },
  scale: { label: '打分', color: '#9B8E82', bg: '#EBE7DF' }
};

// ============================================
// parseQuestions：粘贴文本 → 题目数组（宽容解析）
// 规则：
//  - 题型关键词（行首 / 括号内，可带序号前缀）：
//    单选/选择→single；多选→multi；问答/简答/填空→text；打分/评分/量表/判断→scale
//  - 仅含关键词的行视为模块标题（如「一、单选题」），对后续无题型行生效
//  - 字母开头（A./A、/A)）为选项；数字开头行：内容>20 视为题干，
//    序号连续（1,2,3）为选项，序号重新从 1 开始则视为新题
//  - single/multi 解析完无选项 → 降级为 text；判断题自动补 ['对','错']
// ============================================

const NUM_PREFIX =
  '(?:第?\\s*[（(【\\[]?\\s*[0-9０-９一二三四五六七八九十百千]+\\s*[）)】\\]、.．,，:：]\\s*)?';

const TYPE_LINE_RULES: Array<{ re: RegExp; type: ServiceQuestionType; judge?: boolean }> = [
  { re: new RegExp(`^${NUM_PREFIX}[（(【\\[]?\\s*多选\\s*题?\\s*[）)】\\]]?\\s*[、:：,，.．]?\\s*(.*)$`), type: 'multi' },
  { re: new RegExp(`^${NUM_PREFIX}[（(【\\[]?\\s*(?:单选|选择)\\s*题?\\s*[）)】\\]]?\\s*[、:：,，.．]?\\s*(.*)$`), type: 'single' },
  { re: new RegExp(`^${NUM_PREFIX}[（(【\\[]?\\s*(?:问答|简答|填空)\\s*题?\\s*[）)】\\]]?\\s*[、:：,，.．]?\\s*(.*)$`), type: 'text' },
  { re: new RegExp(`^${NUM_PREFIX}[（(【\\[]?\\s*判断\\s*题?\\s*[）)】\\]]?\\s*[、:：,，.．]?\\s*(.*)$`), type: 'scale', judge: true },
  { re: new RegExp(`^${NUM_PREFIX}[（(【\\[]?\\s*(?:打分|评分|量表)\\s*题?\\s*[）)】\\]]?\\s*[、:：,，.．]?\\s*(.*)$`), type: 'scale' }
];

function detectTypeLine(line: string): { type: ServiceQuestionType; title: string; judge: boolean } | null {
  for (const rule of TYPE_LINE_RULES) {
    const m = line.match(rule.re);
    if (m) return { type: rule.type, title: (m[1] || '').trim(), judge: !!rule.judge };
  }
  return null;
}

export function parseQuestions(text: string): ServiceQuestion[] {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const out: ServiceQuestion[] = [];
  const now = Date.now();
  let sectionType: ServiceQuestionType | null = null;
  let sectionJudge = false;
  let cur: ServiceQuestion | null = null;
  let lastOptNum = 0;

  const flush = () => {
    if (cur) {
      let q = cur;
      // single/multi 无选项 → 降级为 text
      if ((q.type === 'single' || q.type === 'multi') && (!q.options || q.options.length === 0)) {
        q = { ...q, type: 'text' as ServiceQuestionType, options: undefined };
      }
      out.push(q);
    }
    cur = null;
    lastOptNum = 0;
  };

  const newQuestion = (title: string, type: ServiceQuestionType, judge = false): ServiceQuestion => {
    const q: ServiceQuestion = { id: `q_${now}_${out.length}`, type, title, required: true };
    if (type === 'single' || type === 'multi') q.options = [];
    else if (type === 'scale' && judge) q.options = ['对', '错'];
    return q;
  };

  for (const line of lines) {
    // 1) 题型关键词行：题干或模块标题
    const detected = detectTypeLine(line);
    if (detected) {
      flush();
      if (!detected.title) {
        sectionType = detected.type;
        sectionJudge = detected.judge;
        continue;
      }
      cur = newQuestion(detected.title, detected.type, detected.judge);
      continue;
    }

    // 2) 字母选项行：A. / A、 / A)
    const letterM = line.match(/^([A-Za-z])[.、)）]\s*(.+)$/);
    if (letterM) {
      if (cur && (cur.type === 'single' || cur.type === 'multi')) {
        cur.options = [...(cur.options || []), letterM[2].trim()];
        lastOptNum = 0;
      }
      continue;
    }

    // 3) 数字开头行：启发式区分题干 / 选项
    const numM = line.match(/^(\d{1,3})[.、)）]\s*(.+)$/);
    if (numM) {
      const num = parseInt(numM[1], 10);
      const content = numM[2].trim();
      if (content.length > 20) {
        flush();
        cur = newQuestion(content, sectionType || 'text', sectionJudge);
        continue;
      }
      if (cur && (cur.type === 'single' || cur.type === 'multi')) {
        const opts = cur.options || [];
        const expected = opts.length === 0 ? 1 : lastOptNum + 1;
        if (num === expected) {
          cur.options = [...opts, content];
          lastOptNum = num;
          continue;
        }
      }
      flush();
      cur = newQuestion(content, sectionType || 'text', sectionJudge);
      continue;
    }

    // 4) 普通行 → 题干
    flush();
    cur = newQuestion(line, sectionType || 'text', sectionJudge);
  }
  flush();
  return out;
}

// ============================================
// 工具函数
// ============================================

const fmtMoney = (n: number): string => String(Math.round(n * 100) / 100);

const formatDate = (s?: string | null): string => {
  if (!s) return '';
  const d = new Date(s);
  return isNaN(d.getTime()) ? '' : d.toLocaleDateString('zh-CN');
};

/** 宽松获取当前用户 id：优先 zustand store，其次本地缓存（userInfo / mindpace_user） */
function getMyUserId(): string {
  try {
    const storeUser = useUserStore.getState().user;
    if (storeUser?.id) return String(storeUser.id);
    const raw = Taro.getStorageSync('userInfo') || Taro.getStorageSync('mindpace_user');
    if (raw) {
      const obj = typeof raw === 'string' ? JSON.parse(raw) : raw;
      return String(obj?.id || obj?.userId || '');
    }
  } catch (e) {
    console.error('[CounselorServices] 读取用户信息失败', e);
  }
  return '';
}

const getOrderAction = (status: string): string | null => {
  if (status === 'pending_payment') return '确认收款';
  if (status === 'paid') return '查看答卷';
  if (status === 'submitted') return '查看进度';
  return null;
};

// ============================================
// 子组件：单题编辑器
// ============================================

const QuestionEditor: React.FC<{
  question: ServiceQuestion;
  index: number;
  expanded: boolean;
  onToggle: () => void;
  onChange: (patch: Partial<ServiceQuestion>) => void;
  onDelete: () => void;
}> = ({ question, index, expanded, onToggle, onChange, onDelete }) => {
  const meta = QUESTION_TYPE_META[question.type];
  const hasOptions = question.type === 'single' || question.type === 'multi';

  const setOptions = (opts: string[]) => onChange({ options: opts });
  const changeOption = (i: number, v: string) =>
    setOptions((question.options || []).map((o, idx) => (idx === i ? v : o)));
  const removeOption = (i: number) =>
    setOptions((question.options || []).filter((_, idx) => idx !== i));
  const addOption = () => setOptions([...(question.options || []), '']);

  return (
    <View className={styles.qItem}>
      <View className={styles.qRow} onClick={onToggle}>
        <Text className={styles.qType} style={{ color: meta.color, backgroundColor: meta.bg }}>
          {meta.label}
        </Text>
        <View className={styles.qMain}>
          <Text className={`${styles.qTitle} ${!question.title ? styles.qTitlePlaceholder : ''}`}>
            {question.title || `第 ${index + 1} 题（未填写题干）`}
          </Text>
          <Text className={styles.qSub}>
            {hasOptions && question.options
              ? `${question.options.length} 个选项`
              : question.type === 'scale'
                ? '量表打分'
                : '开放作答'}
            {question.required ? ' · 必填' : ' · 选填'}
          </Text>
        </View>
        <View
          className={styles.qDelete}
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
        >
          <Icon name="close" size={28} color="#BDB5AC" />
        </View>
      </View>
      {expanded && (
        <View className={styles.qEdit}>
          <Input
            className={styles.qTitleInput}
            value={question.title}
            placeholder="请输入题干"
            placeholderClass={styles.qTitlePlaceholder}
            onInput={(e) => onChange({ title: e.detail.value })}
          />
          <View className={styles.qReqRow} onClick={() => onChange({ required: !question.required })}>
            <View className={`${styles.reqSwitch} ${question.required ? styles.reqSwitchOn : ''}`}>
              <View className={`${styles.reqKnob} ${question.required ? styles.reqKnobOn : ''}`} />
            </View>
            <Text className={styles.reqLabel}>必答题</Text>
          </View>
          {hasOptions && (
            <View className={styles.optList}>
              {(question.options || []).map((opt, oi) => (
                <View key={oi} className={styles.optRow}>
                  <Text className={styles.optMark}>{String.fromCharCode(65 + oi)}.</Text>
                  <Input
                    className={styles.optInput}
                    value={opt}
                    placeholder={`选项 ${oi + 1}`}
                    onInput={(e) => changeOption(oi, e.detail.value)}
                  />
                  <View className={styles.optDel} onClick={() => removeOption(oi)}>
                    <Icon name="close" size={24} color="#BDB5AC" />
                  </View>
                </View>
              ))}
              <View className={styles.addOption} onClick={addOption}>
                <Text className={styles.addOptionText}>+ 添加选项</Text>
              </View>
            </View>
          )}
          {question.type === 'scale' && (
            <Text className={styles.qHint}>打分题由来访者按分值作答，无需配置选项</Text>
          )}
          {question.type === 'text' && (
            <Text className={styles.qHint}>问答题由来访者自由填写，无需配置选项</Text>
          )}
        </View>
      )}
    </View>
  );
};

// ============================================
// 主页面
// ============================================

const CounselorServicesPage: React.FC = () => {
  const { currentRole } = useUserStore();
  const [tab, setTab] = useState<'services' | 'orders'>('services');
  const [services, setServices] = useState<AssessmentService[]>([]);
  const [orders, setOrders] = useState<ServiceOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  // 编辑弹窗
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', tagline: '', description: '', price: '', questionnaireLink: '' });
  const [questions, setQuestions] = useState<ServiceQuestion[]>([]);
  const [editingQId, setEditingQId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // 批量导入
  const [importStage, setImportStage] = useState<'paste' | 'preview' | null>(null);
  const [importText, setImportText] = useState('');
  const [parsedPreview, setParsedPreview] = useState<ServiceQuestion[]>([]);

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      setServices(await fetchCounselorServices());
    } catch (err) {
      console.error('[CounselorServices] 加载服务失败', err);
    }
    try {
      setOrders(await fetchServiceOrders());
    } catch (err) {
      console.error('[CounselorServices] 加载订单失败', err);
    }
    setLoading(false);
  };

  const loadServices = async () => {
    try {
      setServices(await fetchCounselorServices());
    } catch (err) {
      console.error('[CounselorServices] 刷新服务失败', err);
    }
  };

  // ---------- 上架 / 下架 ----------
  const handleToggle = (s: AssessmentService) => {
    const next: 'active' | 'inactive' = s.status === 'inactive' ? 'active' : 'inactive';
    setTogglingId(s.id);
    updateCounselorService(s.id, { status: next })
      .then(() => {
        Taro.showToast({ title: next === 'active' ? '已上架' : '已下架', icon: 'success' });
        loadServices();
      })
      .catch((err) => {
        Taro.showToast({
          title: err instanceof Error ? err.message : '操作失败，请稍后重试',
          icon: 'none'
        });
      })
      .finally(() => setTogglingId(null));
  };

  // ---------- 编辑 / 新建弹窗 ----------
  const openEditor = (s?: AssessmentService) => {
    if (s) {
      setEditingId(s.id);
      setForm({
        name: s.name,
        tagline: s.tagline || '',
        description: s.description || '',
        price: String(s.price),
        questionnaireLink: s.questionnaireLink || ''
      });
      setQuestions((s.questions || []).map((q) => ({ ...q })));
    } else {
      setEditingId(null);
      setForm({ name: '', tagline: '', description: '', price: '', questionnaireLink: '' });
      setQuestions([]);
    }
    setEditingQId(null);
    setEditorOpen(true);
  };

  const closeEditor = () => {
    setEditorOpen(false);
    setImportStage(null);
  };

  const addQuestion = (type: ServiceQuestionType) => {
    const q: ServiceQuestion = {
      id: `q_${Date.now()}_${questions.length}`,
      type,
      title: '',
      required: true,
      ...(type === 'single' || type === 'multi' ? { options: [''] } : {})
    };
    setQuestions((prev) => [...prev, q]);
    setEditingQId(q.id);
  };

  const updateQuestion = (id: string, patch: Partial<ServiceQuestion>) => {
    setQuestions((prev) => prev.map((q) => (q.id === id ? { ...q, ...patch } : q)));
  };

  const removeQuestion = (id: string) => {
    setQuestions((prev) => prev.filter((q) => q.id !== id));
    if (editingQId === id) setEditingQId(null);
  };

  const handleSave = async () => {
    const name = form.name.trim();
    const priceNum = Number(form.price);
    if (!name) {
      Taro.showToast({ title: '请填写服务名称', icon: 'none' });
      return;
    }
    if (!form.price.trim() || !isFinite(priceNum) || priceNum <= 0) {
      Taro.showToast({ title: '请填写有效的价格（大于 0）', icon: 'none' });
      return;
    }
    const cleanedQuestions = questions.map((q) => {
      if ((q.type === 'single' || q.type === 'multi') && q.options) {
        return { ...q, options: q.options.map((o) => o.trim()).filter(Boolean) };
      }
      return q;
    });
    const payload = {
      name,
      tagline: form.tagline.trim(),
      description: form.description.trim(),
      price: priceNum,
      questions: cleanedQuestions,
      questionnaireLink: form.questionnaireLink.trim()
    };
    try {
      setSaving(true);
      if (editingId) {
        await updateCounselorService(editingId, payload);
      } else {
        await createCounselorService(payload);
      }
      Taro.showToast({ title: '保存成功', icon: 'success' });
      setEditorOpen(false);
      loadServices();
    } catch (err) {
      Taro.showToast({
        title: err instanceof Error ? err.message : '保存失败，请稍后重试',
        icon: 'none'
      });
    } finally {
      setSaving(false);
    }
  };

  // ---------- 批量导入 ----------
  const openImport = () => {
    setImportText('');
    setParsedPreview([]);
    setImportStage('paste');
  };

  const handleParse = () => {
    if (!importText.trim()) {
      Taro.showToast({ title: '请先粘贴题目文本', icon: 'none' });
      return;
    }
    const parsed = parseQuestions(importText);
    if (parsed.length === 0) {
      Taro.showToast({ title: '未识别到题目，请检查格式', icon: 'none' });
      return;
    }
    setParsedPreview(parsed);
    setImportStage('preview');
  };

  const confirmImport = () => {
    const stamp = Date.now();
    setQuestions((prev) => [...prev, ...parsedPreview.map((q, i) => ({ ...q, id: `q_${stamp}_${i}` }))]);
    setImportStage(null);
    Taro.showToast({ title: `已追加 ${parsedPreview.length} 道题`, icon: 'none' });
  };

  // ---------- 评估订单 ----------
  const myUserId = useMemo(() => getMyUserId(), []);

  const myOrders = useMemo(() => {
    if (!myUserId) return orders;
    return orders.filter(
      (o) =>
        String(o.counselor?.userId ?? '') === myUserId ||
        String(o.counselorId ?? '') === myUserId
    );
  }, [orders, myUserId]);

  const orderStats = useMemo(() => {
    let income = 0;
    let pending = 0;
    let done = 0;
    myOrders.forEach((o) => {
      if (o.status === 'completed') {
        income += o.price;
        done += 1;
      }
      if (o.status === 'pending_payment' || o.status === 'submitted') pending += 1;
    });
    return { income, pending, done };
  }, [myOrders]);

  const goOrderDetail = (o: ServiceOrder) => {
    Taro.navigateTo({ url: `/pages/my-service-detail/index?id=${o.id}` });
  };

  // ---------- 渲染 ----------
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
        <Text className={styles.title}>评估服务</Text>
        <Text className={styles.subtitle}>管理你的个性化评估服务与问卷订单</Text>
      </View>

      <View className={styles.tabs}>
        <View
          className={`${styles.tabItem} ${tab === 'services' ? styles.tabActive : ''}`}
          onClick={() => setTab('services')}
        >
          <Text className={`${styles.tabText} ${tab === 'services' ? styles.tabActiveText : ''}`}>
            我的服务
          </Text>
        </View>
        <View
          className={`${styles.tabItem} ${tab === 'orders' ? styles.tabActive : ''}`}
          onClick={() => setTab('orders')}
        >
          <Text className={`${styles.tabText} ${tab === 'orders' ? styles.tabActiveText : ''}`}>
            评估订单
          </Text>
        </View>
      </View>

      <ScrollView className={styles.scrollContent} scrollY>
        {loading ? (
          <View className={styles.loading}>
            <Text className={styles.loadingText}>加载中...</Text>
          </View>
        ) : tab === 'services' ? (
          services.length === 0 ? (
            <View className={styles.empty}>
              <Text className={styles.emptyText}>暂无服务，点击下方按钮创建第一个评估服务</Text>
            </View>
          ) : (
            <View>
              {services.map((s) => (
                <View key={s.id} className={styles.serviceCard}>
                  <View className={styles.serviceTop}>
                    <View
                      className={`${styles.statusDot} ${s.status === 'inactive' ? styles.dotInactive : ''}`}
                    />
                    <Text className={styles.serviceName}>{s.name}</Text>
                    <Text className={styles.statusText}>
                      {s.status === 'inactive' ? '已下架' : '已上架'}
                    </Text>
                  </View>
                  {!!s.tagline && <Text className={styles.serviceTagline}>{s.tagline}</Text>}
                  <View className={styles.serviceMeta}>
                    <Text className={styles.servicePrice}>¥{fmtMoney(s.price)}</Text>
                    <Text className={styles.serviceQuestions}>{s.questions.length} 道题</Text>
                  </View>
                  <View className={styles.serviceActions}>
                    <View className={styles.toggleButton} onClick={() => handleToggle(s)}>
                      <Text className={styles.toggleText}>
                        {togglingId === s.id ? '处理中...' : s.status === 'inactive' ? '上架' : '下架'}
                      </Text>
                    </View>
                    <View className={styles.editButton} onClick={() => openEditor(s)}>
                      <Icon name="edit" size={26} color="#7A9A6A" />
                      <Text className={styles.editText}>编辑</Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )
        ) : (
          <View>
            <View className={styles.statsGrid}>
              <View className={styles.statCard}>
                <Text className={styles.statValue}>¥{fmtMoney(orderStats.income)}</Text>
                <Text className={styles.statLabel}>累计收入</Text>
              </View>
              <View className={styles.statCard}>
                <Text className={`${styles.statValue} ${styles.statValueOrange}`}>
                  {orderStats.pending}
                </Text>
                <Text className={styles.statLabel}>待处理</Text>
              </View>
              <View className={styles.statCard}>
                <Text className={styles.statValue}>{orderStats.done}</Text>
                <Text className={styles.statLabel}>已完成</Text>
              </View>
            </View>
            {myOrders.length === 0 ? (
              <View className={styles.empty}>
                <Text className={styles.emptyText}>暂无评估订单</Text>
              </View>
            ) : (
              myOrders.map((o) => {
                const meta = getServiceStatusMeta(o.status);
                const actionLabel = getOrderAction(o.status);
                return (
                  <View key={o.id} className={styles.orderCard} onClick={() => goOrderDetail(o)}>
                    <View className={styles.orderTop}>
                      <Text className={styles.orderService}>{o.serviceName || '评估服务'}</Text>
                      <Text
                        className={styles.orderBadge}
                        style={{ color: meta.color, backgroundColor: meta.bg }}
                      >
                        {meta.label}
                      </Text>
                    </View>
                    <View className={styles.orderInfo}>
                      <Text className={styles.orderClient}>{o.clientName || o.clientId || '来访者'}</Text>
                      <Text className={styles.orderDate}>{formatDate(o.createdAt)}</Text>
                    </View>
                    <View className={styles.orderBottom}>
                      <Text className={styles.orderPrice}>¥{fmtMoney(o.price)}</Text>
                      {actionLabel && (
                        <View
                          className={styles.orderAction}
                          onClick={(e) => {
                            e.stopPropagation();
                            goOrderDetail(o);
                          }}
                        >
                          <Text className={styles.orderActionText}>{actionLabel}</Text>
                          <Icon name="chevronRight" size={24} color="#FFFFFF" />
                        </View>
                      )}
                    </View>
                  </View>
                );
              })
            )}
          </View>
        )}
      </ScrollView>

      {/* 新建 / 编辑服务：底部面板 */}
      {editorOpen && (
        <View className={styles.overlay}>
          <View className={styles.panel}>
            <View className={styles.panelHeader}>
              <Text className={styles.panelTitle}>{editingId ? '编辑服务' : '新建服务'}</Text>
              <View className={styles.panelClose} onClick={closeEditor}>
                <Icon name="close" size={32} color="#9B8E82" />
              </View>
            </View>
            <ScrollView className={styles.panelBody} scrollY>
              <View className={styles.field}>
                <Text className={styles.fieldLabel}>
                  名称 <Text className={styles.required}>*</Text>
                </Text>
                <Input
                  className={styles.fieldInput}
                  value={form.name}
                  placeholder="例如：情绪状态自评量表"
                  onInput={(e) => setForm((f) => ({ ...f, name: e.detail.value }))}
                />
              </View>
              <View className={styles.field}>
                <Text className={styles.fieldLabel}>一句话简介</Text>
                <Input
                  className={styles.fieldInput}
                  value={form.tagline}
                  placeholder="用一句话介绍这个服务"
                  onInput={(e) => setForm((f) => ({ ...f, tagline: e.detail.value }))}
                />
              </View>
              <View className={styles.field}>
                <Text className={styles.fieldLabel}>详情介绍</Text>
                <Textarea
                  className={styles.fieldTextarea}
                  value={form.description}
                  placeholder="适合人群、评估维度、交付内容等"
                  maxlength={-1}
                  onInput={(e) => setForm((f) => ({ ...f, description: e.detail.value }))}
                />
              </View>
              <View className={styles.field}>
                <Text className={styles.fieldLabel}>
                  价格（元） <Text className={styles.required}>*</Text>
                </Text>
                <View className={styles.priceRow}>
                  <Text className={styles.priceSymbol}>¥</Text>
                  <Input
                    className={styles.priceInput}
                    type="digit"
                    value={form.price}
                    placeholder="0.00"
                    onInput={(e) => setForm((f) => ({ ...f, price: e.detail.value }))}
                  />
                </View>
              </View>
              <View className={styles.field}>
                <Text className={styles.fieldLabel}>外链问卷（选填）</Text>
                <Input
                  className={styles.fieldInput}
                  value={form.questionnaireLink}
                  placeholder="https://..."
                  onInput={(e) => setForm((f) => ({ ...f, questionnaireLink: e.detail.value }))}
                />
              </View>

              <View className={styles.qSectionHead}>
                <Text className={styles.qSectionTitle}>问卷题目（{questions.length}）</Text>
                <Text className={styles.qSectionTip}>点击题目展开编辑</Text>
              </View>
              {questions.map((q, idx) => (
                <QuestionEditor
                  key={q.id}
                  question={q}
                  index={idx}
                  expanded={editingQId === q.id}
                  onToggle={() => setEditingQId(editingQId === q.id ? null : q.id)}
                  onChange={(patch) => updateQuestion(q.id, patch)}
                  onDelete={() => removeQuestion(q.id)}
                />
              ))}
              <View className={styles.addTypeRow}>
                {(['single', 'multi', 'text', 'scale'] as ServiceQuestionType[]).map((t) => (
                  <View key={t} className={styles.addTypeBtn} onClick={() => addQuestion(t)}>
                    <Text className={styles.addTypeText}>+ {QUESTION_TYPE_META[t].label}题</Text>
                  </View>
                ))}
              </View>
              <View className={styles.importButton} onClick={openImport}>
                <Icon name="list" size={28} color="#C66B2E" />
                <Text className={styles.importButtonText}>批量导入题目</Text>
              </View>
              <View className={styles.panelFooterSpace} />
            </ScrollView>
            <View className={styles.panelFooter}>
              <View className={styles.footerCancel} onClick={closeEditor}>
                <Text className={styles.footerCancelText}>取消</Text>
              </View>
              <View className={styles.footerSave} onClick={handleSave}>
                <Text className={styles.footerSaveText}>{saving ? '保存中...' : '保存'}</Text>
              </View>
            </View>
          </View>
        </View>
      )}

      {/* 批量导入：粘贴 → 解析预览 */}
      {editorOpen && importStage && (
        <View className={styles.overlayInner}>
          <View className={styles.importPanel}>
            <View className={styles.panelHeader}>
              <Text className={styles.panelTitle}>批量导入题目</Text>
              <View className={styles.panelClose} onClick={() => setImportStage(null)}>
                <Icon name="close" size={32} color="#9B8E82" />
              </View>
            </View>
            {importStage === 'paste' ? (
              <View className={styles.importBody}>
                <Text className={styles.importHint}>
                  每行一题或一个选项，支持「单选：」「（多选）」「【判断题】」等题型标注；可用「一、单选题」等标题分组。示例：{'\n'}
                  一、单选题{'\n'}
                  1. 你最近的睡眠状况如何？{'\n'}
                  A. 很好{'\n'}
                  B. 一般{'\n'}
                  三、问答题{'\n'}
                  请描述你最近一周的情绪变化。
                </Text>
                <Textarea
                  className={styles.importTextarea}
                  value={importText}
                  placeholder="将题目文本粘贴到此处..."
                  maxlength={-1}
                  onInput={(e) => setImportText(e.detail.value)}
                />
                <View className={styles.importActions}>
                  <View className={styles.importBtnSecondary} onClick={() => setImportStage(null)}>
                    <Text className={styles.importBtnSecondaryText}>取消</Text>
                  </View>
                  <View className={styles.importBtnPrimary} onClick={handleParse}>
                    <Text className={styles.importBtnPrimaryText}>解析预览</Text>
                  </View>
                </View>
              </View>
            ) : (
              <View className={styles.importBody}>
                <Text className={styles.parseCount}>识别到 {parsedPreview.length} 道题</Text>
                <ScrollView className={styles.previewList} scrollY>
                  {parsedPreview.map((q, i) => (
                    <View key={q.id} className={styles.previewItem}>
                      <Text
                        className={styles.qType}
                        style={{
                          color: QUESTION_TYPE_META[q.type].color,
                          backgroundColor: QUESTION_TYPE_META[q.type].bg
                        }}
                      >
                        {QUESTION_TYPE_META[q.type].label}
                      </Text>
                      <Text className={styles.previewTitle}>
                        {i + 1}. {q.title || '（未填写题干）'}
                      </Text>
                      {!!q.options?.length && (
                        <Text className={styles.previewOpt}>{q.options.length} 个选项</Text>
                      )}
                    </View>
                  ))}
                </ScrollView>
                <View className={styles.importActions}>
                  <View
                    className={styles.importBtnSecondary}
                    onClick={() => setImportStage('paste')}
                  >
                    <Text className={styles.importBtnSecondaryText}>重新编辑</Text>
                  </View>
                  <View className={styles.importBtnPrimary} onClick={confirmImport}>
                    <Text className={styles.importBtnPrimaryText}>确认追加</Text>
                  </View>
                </View>
              </View>
            )}
          </View>
        </View>
      )}
    </View>
  );
};

export default CounselorServicesPage;
