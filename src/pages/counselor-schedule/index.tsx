import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Input, Picker } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import { useUserStore } from '@/stores/user';
import { request } from '@/services/api';
import CustomTabBar from '@/components/TabBar';

type RuleType = 'available' | 'blocked' | 'fixed';
type RuleMode = 'recurring' | 'single';

/**
 * /api/counselor/schedule 返回的档期规则（schedule_rules 表）。
 * weekdays 为逗号分隔的周几："0,1,4"（0=周一…6=周日）。
 */
interface ScheduleRule {
  id: string;
  type: RuleType;
  weekdays?: string | null;
  startTime?: string | null;
  durationMinutes?: number | null;
  validFrom?: string | null;
  validUntil?: string | null;
  fixedClientId?: string | null;
  blockNote?: string | null;
  isSingle?: boolean | null;
  singleDate?: string | null;
  singleTime?: string | null;
}

interface RuleForm {
  mode: RuleMode;
  type: RuleType;
  weekdays: number[];
  startTime: string;
  durationMinutes: number;
  validFrom: string;
  validUntil: string;
  fixedClientId: string;
  blockNote: string;
  singleDate: string;
  singleTime: string;
}

const WEEKDAY_LABELS = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];

const TYPE_META: Record<RuleType, { label: string; cls: string }> = {
  available: { label: '可预约', cls: styles.typeAvailable },
  blocked: { label: '临时屏蔽', cls: styles.typeBlocked },
  fixed: { label: '固定档期', cls: styles.typeFixed }
};

const fmtDate = (d: Date): string =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

const TODAY = fmtDate(new Date());

const EMPTY_FORM: RuleForm = {
  mode: 'recurring',
  type: 'available',
  weekdays: [],
  startTime: '09:00',
  durationMinutes: 50,
  validFrom: TODAY,
  validUntil: '',
  fixedClientId: '',
  blockNote: '',
  singleDate: TODAY,
  singleTime: '09:00'
};

/** 规则描述文案（对齐 web rules-panel） */
const ruleMainText = (r: ScheduleRule): string => {
  if (r.isSingle) return `单次：${r.singleDate || '?'} ${r.singleTime || '?'}`;
  const wds = (r.weekdays || '')
    .split(',')
    .filter(i => i !== '' && !isNaN(Number(i)))
    .map(i => WEEKDAY_LABELS[Number(i)])
    .join('、');
  return `每${wds || '?'} · ${r.startTime || '?'}`;
};

const CounselorSchedulePage: React.FC = () => {
  const { currentRole } = useUserStore();
  const [rules, setRules] = useState<ScheduleRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<RuleForm>({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadRules();
  }, []);

  const loadRules = async () => {
    try {
      setLoading(true);
      const data = await request<ScheduleRule[]>('/api/counselor/schedule');
      setRules(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('[Counselor] 加载档期失败', err);
      setRules([]);
    } finally {
      setLoading(false);
    }
  };

  const set = <K extends keyof RuleForm>(key: K, value: RuleForm[K]) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const toggleWeekday = (i: number) => {
    setForm(prev => ({
      ...prev,
      weekdays: prev.weekdays.includes(i)
        ? prev.weekdays.filter(d => d !== i)
        : [...prev.weekdays, i].sort((a, b) => a - b)
    }));
  };

  const canSubmit =
    form.mode === 'recurring'
      ? form.weekdays.length > 0 && !!form.startTime
      : !!form.singleDate && !!form.singleTime;

  // 新增规则：body 与 web 契约对齐（循环=weekdays 数组；单次=singleDate/singleTime）
  const submitRule = async () => {
    if (!canSubmit || saving) return;
    setSaving(true);
    try {
      const body: Record<string, unknown> = {
        mode: form.mode,
        type: form.type,
        durationMinutes: form.durationMinutes,
        validFrom: form.validFrom || null,
        validUntil: form.validUntil || null,
        fixedClientId: form.type === 'fixed' ? form.fixedClientId.trim() || null : null,
        blockNote: form.type === 'blocked' ? form.blockNote.trim() || null : null
      };
      if (form.mode === 'recurring') {
        body.weekdays = form.weekdays;
        body.startTime = form.startTime;
      } else {
        body.singleDate = form.singleDate;
        body.singleTime = form.singleTime;
        body.date = form.singleDate;
        body.startTime = form.singleTime;
      }
      // 409 重叠冲突时服务端返回中文 message，request 会原样抛出
      await request('/api/counselor/schedule', {
        // Taro.request.Option 类型要求 url 字段；request() 实际以第一个参数 path 为准
        url: '/api/counselor/schedule',
        method: 'POST',
        data: body
      });
      Taro.showToast({ title: '档期已更新', icon: 'success' });
      setForm({ ...EMPTY_FORM });
      setShowForm(false);
      loadRules();
    } catch (err) {
      Taro.showToast({
        title: err instanceof Error ? err.message : '保存失败，请稍后重试',
        icon: 'none'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (rule: ScheduleRule) => {
    Taro.showModal({
      title: '删除档期规则',
      content: '确定删除该规则吗？删除后对应时段将不再可约。',
      confirmText: '删除',
      cancelText: '再想想',
      success: async (res) => {
        if (!res.confirm) return;
        try {
          await request('/api/counselor/schedule', {
            // Taro.request.Option 类型要求 url 字段；request() 实际以第一个参数 path 为准
            url: '/api/counselor/schedule',
            method: 'DELETE',
            data: { id: rule.id }
          });
          Taro.showToast({ title: '已删除', icon: 'success' });
          loadRules();
        } catch (err) {
          Taro.showToast({
            title: err instanceof Error ? err.message : '删除失败，请稍后重试',
            icon: 'none'
          });
        }
      }
    });
  };

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
        <Text className={styles.title}>档期管理</Text>
        <Text className={styles.subtitle}>共 {rules.length} 条规则 · 来访端将按此展示可约时段</Text>
      </View>

      <ScrollView className={styles.scrollContent} scrollY>
        {loading ? (
          <View className={styles.loading}>
            <Text className={styles.loadingText}>加载中...</Text>
          </View>
        ) : (
          <View className={styles.ruleList}>
            {rules.length === 0 && !showForm && (
              <View className={styles.empty}>
                <Text className={styles.emptyText}>还没有档期规则</Text>
                <Text className={styles.emptyHint}>新增时间规则后，来访端即可预约对应时段</Text>
              </View>
            )}

            {rules.map(rule => {
              const meta = TYPE_META[rule.type] || TYPE_META.available;
              return (
                <View key={rule.id} className={styles.ruleCard}>
                  <View className={styles.ruleHead}>
                    <Text className={`${styles.ruleType} ${meta.cls}`}>{meta.label}</Text>
                    <View className={styles.deleteButton} onClick={() => handleDelete(rule)}>
                      <Text className={styles.deleteText}>删除</Text>
                    </View>
                  </View>
                  <Text className={styles.ruleMain}>
                    {ruleMainText(rule)}
                    <Text className={styles.ruleDuration}>（{rule.durationMinutes || 50} 分钟）</Text>
                  </Text>
                  {rule.validFrom ? (
                    <Text className={styles.ruleMeta}>
                      {rule.validFrom} 起{rule.validUntil ? ` · 至 ${rule.validUntil}` : '（长期）'}
                    </Text>
                  ) : null}
                  {rule.blockNote ? <Text className={styles.ruleMeta}>备注：{rule.blockNote}</Text> : null}
                  {rule.fixedClientId ? (
                    <Text className={styles.ruleFixed}>固定来访：{rule.fixedClientId}</Text>
                  ) : null}
                </View>
              );
            })}

            {/* 新增规则表单 */}
            {showForm ? (
              <View className={styles.ruleForm}>
                <View className={styles.segRow}>
                  {(['recurring', 'single'] as RuleMode[]).map(m => (
                    <View
                      key={m}
                      className={`${styles.segItem} ${form.mode === m ? styles.segActive : ''}`}
                      onClick={() => set('mode', m)}
                    >
                      <Text className={styles.segText}>{m === 'recurring' ? '循环重复' : '单次时间'}</Text>
                    </View>
                  ))}
                </View>

                <Text className={styles.formLabel}>类型</Text>
                <View className={styles.segRow}>
                  {(['available', 'blocked', 'fixed'] as RuleType[]).map(t => (
                    <View
                      key={t}
                      className={`${styles.segItem} ${form.type === t ? styles.segActive : ''}`}
                      onClick={() => set('type', t)}
                    >
                      <Text className={styles.segText}>{TYPE_META[t].label}</Text>
                    </View>
                  ))}
                </View>

                {form.mode === 'recurring' ? (
                  <>
                    <Text className={styles.formLabel}>重复星期</Text>
                    <View className={styles.weekRow}>
                      {WEEKDAY_LABELS.map((label, i) => (
                        <View
                          key={label}
                          className={`${styles.weekChip} ${form.weekdays.includes(i) ? styles.weekActive : ''}`}
                          onClick={() => toggleWeekday(i)}
                        >
                          <Text className={styles.weekText}>{label.slice(1)}</Text>
                        </View>
                      ))}
                    </View>

                    <Text className={styles.formLabel}>开始时间</Text>
                    <Picker
                      mode='time'
                      value={form.startTime}
                      onChange={e => set('startTime', e.detail.value)}
                    >
                      <View className={styles.pickerBox}>
                        <Text className={styles.pickerText}>{form.startTime}</Text>
                      </View>
                    </Picker>

                    <View className={styles.fieldRow}>
                      <View className={styles.fieldCol}>
                        <Text className={styles.formLabel}>生效日期</Text>
                        <Picker
                          mode='date'
                          value={form.validFrom}
                          onChange={e => set('validFrom', e.detail.value)}
                        >
                          <View className={styles.pickerBox}>
                            <Text className={styles.pickerText}>{form.validFrom || '选择日期'}</Text>
                          </View>
                        </Picker>
                      </View>
                      <View className={styles.fieldCol}>
                        <Text className={styles.formLabel}>截止（空=长期）</Text>
                        <Picker
                          mode='date'
                          value={form.validUntil}
                          onChange={e => set('validUntil', e.detail.value)}
                        >
                          <View className={styles.pickerBox}>
                            <Text className={styles.pickerText}>{form.validUntil || '长期有效'}</Text>
                          </View>
                        </Picker>
                      </View>
                    </View>
                  </>
                ) : (
                  <>
                    <Text className={styles.formLabel}>日期</Text>
                    <Picker
                      mode='date'
                      value={form.singleDate}
                      onChange={e => set('singleDate', e.detail.value)}
                    >
                      <View className={styles.pickerBox}>
                        <Text className={styles.pickerText}>{form.singleDate}</Text>
                      </View>
                    </Picker>
                    <Text className={styles.formLabel}>时间</Text>
                    <Picker
                      mode='time'
                      value={form.singleTime}
                      onChange={e => set('singleTime', e.detail.value)}
                    >
                      <View className={styles.pickerBox}>
                        <Text className={styles.pickerText}>{form.singleTime}</Text>
                      </View>
                    </Picker>
                  </>
                )}

                <Text className={styles.formLabel}>时长（分钟）</Text>
                <View className={styles.segRow}>
                  {[50, 90].map(d => (
                    <View
                      key={d}
                      className={`${styles.segItem} ${form.durationMinutes === d ? styles.segActive : ''}`}
                      onClick={() => set('durationMinutes', d)}
                    >
                      <Text className={styles.segText}>{d}</Text>
                    </View>
                  ))}
                </View>

                {form.type === 'fixed' ? (
                  <>
                    <Text className={styles.formLabel}>绑定来访（可选，留空=预留但不指定）</Text>
                    <Input
                      className={styles.formInput}
                      value={form.fixedClientId}
                      onInput={e => set('fixedClientId', e.detail.value)}
                      placeholder='来访姓名或 ID'
                    />
                  </>
                ) : null}
                {form.type === 'blocked' ? (
                  <>
                    <Text className={styles.formLabel}>屏蔽原因（可选）</Text>
                    <Input
                      className={styles.formInput}
                      value={form.blockNote}
                      onInput={e => set('blockNote', e.detail.value)}
                      placeholder='如：出差、培训、假期'
                    />
                  </>
                ) : null}

                <View className={styles.formActions}>
                  <View className={styles.ghostButton} onClick={() => setShowForm(false)}>
                    <Text className={styles.ghostButtonText}>取消</Text>
                  </View>
                  <View
                    className={`${styles.primaryButton} ${canSubmit && !saving ? '' : styles.buttonDisabled}`}
                    onClick={canSubmit && !saving ? submitRule : undefined}
                  >
                    <Text className={styles.primaryButtonText}>{saving ? '保存中…' : '保存规则'}</Text>
                  </View>
                </View>
              </View>
            ) : (
              <View className={styles.addToggle} onClick={() => setShowForm(true)}>
                <Text className={styles.addToggleText}>＋ 新增时间规则</Text>
              </View>
            )}

            <View className={styles.tips}>
              <Text className={styles.tipsText}>
                规则说明：可预约=对外开放的咨询时段；临时屏蔽=休假、出差等暂停时段；固定档期=预留给固定来访的时段。
              </Text>
            </View>
          </View>
        )}
      </ScrollView>
      <CustomTabBar />
    </View>
  );
};

export default CounselorSchedulePage;
