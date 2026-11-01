import React, { useCallback, useState } from 'react';
import { View, Text, ScrollView, Input, Textarea } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import styles from './index.module.scss';
import { request } from '@/services/api';
import { useUserStore } from '@/stores/user';
import Icon from '@/components/Icon';

// 对齐 web /api/admin/counselors 契约： counselors 表全字段 + 详情接口补充 email/userName
interface CounselorRow {
  id: string;
  displayName: string;
  name?: string;
  email?: string;
  counselorTypes: string[] | null;
  location: string | null;
  bio: string | null;
  createdAt: string;
  reviewStatus?: string;
  reviewNote?: string;
}

interface ListItemField {
  id: string;
  value: string;
}

interface CounselorDetail extends CounselorRow {
  userName?: string;
  qualifications?: ListItemField[];
  education?: ListItemField[];
  trainings?: ListItemField[];
  workExperiences?: ListItemField[];
}

type ReviewTab = 'pending' | 'approved' | 'rejected';

const TABS: { key: ReviewTab; label: string }[] = [
  { key: 'pending', label: '待审核' },
  { key: 'approved', label: '已通过' },
  { key: 'rejected', label: '已拒绝' }
];

const BADGES: Record<ReviewTab, { text: string; color: string; bg: string }> = {
  pending: { text: '待审核', color: '#C66B2E', bg: '#FAE9DD' },
  approved: { text: '已上架', color: '#3A6228', bg: '#E4F0DC' },
  rejected: { text: '已驳回', color: '#B23A3A', bg: '#FBE3E3' }
};

function fmtDate(iso: string): string {
  if (!iso) return '-';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

// 列表字段可能是 JSON 字符串数组或 {id,value} 数组，统一转为字符串
function toStrings(arr?: (string | ListItemField)[] | null): string[] {
  if (!arr || !arr.length) return [];
  return arr
    .map((x) => {
      if (typeof x !== 'string') return x.value;
      try {
        const parsed = JSON.parse(x);
        if (parsed && typeof parsed === 'object' && 'value' in parsed) return String(parsed.value);
      } catch {
      }
      return x;
    })
    .filter(Boolean);
}

const AdminCounselorsPage: React.FC = () => {
  const { currentRole } = useUserStore();
  const [tab, setTab] = useState<ReviewTab>('pending');
  const [rows, setRows] = useState<CounselorRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState('');

  // 详情弹层
  const [detail, setDetail] = useState<CounselorDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [showReject, setShowReject] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadCounselors = useCallback(async (status: ReviewTab) => {
    setLoading(true);
    try {
      const data = await request<any[]>(`/api/admin/counselors?status=${status}&t=${Date.now()}`);
      setRows(Array.isArray(data) ? data : []);
    } catch (err) {
      Taro.showToast({
        title: err instanceof Error ? err.message : '加载咨询师失败，请稍后重试',
        icon: 'none'
      });
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useDidShow(() => {
    loadCounselors(tab);
  });

  const handleTab = (key: ReviewTab) => {
    if (tab === key) return;
    setTab(key);
    loadCounselors(key);
  };

  const filteredRows = keyword.trim()
    ? rows.filter((c) => {
        const kw = keyword.trim().toLowerCase();
        const name = (c.displayName || c.name || '').toLowerCase();
        const email = (c.email || '').toLowerCase();
        const types = (c.counselorTypes || []).join(',').toLowerCase();
        return name.includes(kw) || email.includes(kw) || types.includes(kw);
      })
    : rows;

  // 点卡片 → 拉详情（bio/资质/教育/受训/经验/邮箱），底部弹层展示
  const openDetail = async (id: string) => {
    setDetail(null);
    setShowReject(false);
    setRejectReason('');
    setDetailLoading(true);
    try {
      const data = await request<any>(`/api/admin/counselors/${id}`);
      setDetail((data && data.counselor) || data || null);
    } catch (err) {
      Taro.showToast({
        title: err instanceof Error ? err.message : '获取详情失败',
        icon: 'none'
      });
    } finally {
      setDetailLoading(false);
    }
  };

  const closeDetail = () => {
    setDetail(null);
    setShowReject(false);
    setRejectReason('');
  };

  // 审核：PATCH /api/admin/counselors/[id] { action: 'approve' | 'reject', reason }
  const patchReview = async (id: string, action: 'approve' | 'reject', reason?: string) => {
    setSubmitting(true);
    try {
      await request(`/api/admin/counselors/${id}`, {
        url: `/api/admin/counselors/${id}`,
        method: 'PATCH',
        data: { action, reason: reason || '' }
      });
      return true;
    } catch (err) {
      Taro.showToast({
        title: err instanceof Error ? err.message : '操作失败，请稍后重试',
        icon: 'none'
      });
      return false;
    } finally {
      setSubmitting(false);
    }
  };

  const handleApprove = (c: CounselorDetail) => {
    const name = c.displayName || c.name || '该咨询师';
    Taro.showModal({
      title: '审核通过',
      content: `确认通过「${name}」的入驻申请吗？通过后咨询师将上架展示。`,
      confirmText: '通过',
      cancelText: '取消',
      success: async (res) => {
        if (!res.confirm) return;
        const ok = await patchReview(c.id, 'approve');
        if (ok) {
          Taro.showToast({ title: '已通过审核', icon: 'success' });
          closeDetail();
          loadCounselors(tab);
        }
      }
    });
  };

  const handleReject = (c: CounselorDetail) => {
    const reason = rejectReason.trim();
    if (!reason) {
      Taro.showToast({ title: '请填写驳回原因', icon: 'none' });
      return;
    }
    const name = c.displayName || c.name || '该咨询师';
    Taro.showModal({
      title: '确认驳回',
      content: `确认驳回「${name}」的申请吗？驳回原因将通知到咨询师。`,
      confirmText: '确认驳回',
      cancelText: '取消',
      success: async (res) => {
        if (!res.confirm) return;
        const ok = await patchReview(c.id, 'reject', reason);
        if (ok) {
          Taro.showToast({ title: '已驳回', icon: 'success' });
          closeDetail();
          loadCounselors(tab);
        }
      }
    });
  };

  // 已通过列表：下架（服务端同样走 PATCH reject）
  const handleOffline = (c: CounselorDetail) => {
    const name = c.displayName || c.name || '该咨询师';
    Taro.showModal({
      title: '下架咨询师',
      content: `确认下架「${name}」吗？下架后其将不再对外展示，需重新审核上架。`,
      confirmText: '下架',
      cancelText: '取消',
      success: async (res) => {
        if (!res.confirm) return;
        const ok = await patchReview(c.id, 'reject', '管理员下架');
        if (ok) {
          Taro.showToast({ title: '已下架', icon: 'success' });
          closeDetail();
          loadCounselors(tab);
        }
      }
    });
  };

  if (currentRole !== 'admin') {
    return (
      <View className={styles.container}>
        <View className={styles.unauthorized}>
          <Icon name="lock" size={48} color="#9B8E82" />
          <Text className={styles.unauthorizedText}>仅管理员可访问</Text>
        </View>
      </View>
    );
  }

  const badge = BADGES[tab];
  const detailName = detail ? detail.displayName || detail.name || '咨询师' : '';
  const ql = toStrings(detail?.qualifications);
  const ed = toStrings(detail?.education);
  const tr = toStrings(detail?.trainings);
  const we = toStrings(detail?.workExperiences);

  return (
    <View className={styles.container}>
      <View className={styles.header}>
        <Text className={styles.title}>专业人员审核（咨询师 / 评估师）</Text>
      </View>

      {/* Tab */}
      <View className={styles.tabBar}>
        {TABS.map((t) => (
          <View
            key={t.key}
            className={`${styles.tabItem} ${tab === t.key ? styles.tabActive : ''}`}
            onClick={() => handleTab(t.key)}
          >
            <Text className={styles.tabText}>{t.label}</Text>
          </View>
        ))}
      </View>

      {/* 搜索框 */}
      <View className={styles.searchBar}>
        <Icon name="search" size={16} color="#9B8E82" />
        <Input
          className={styles.searchInput}
          value={keyword}
          placeholder="搜索姓名 / 邮箱 / 类别"
          placeholderClass={styles.searchPlaceholder}
          onInput={(e) => setKeyword(e.detail.value)}
        />
        {keyword ? (
          <View className={styles.searchClear} onClick={() => setKeyword('')}>
            <Icon name="close" size={12} color="#9B8E82" />
          </View>
        ) : null}
      </View>

      <ScrollView className={styles.scrollContent} scrollY>
        {loading ? (
          <View className={styles.empty}>
            <Text className={styles.emptyText}>加载中…</Text>
          </View>
        ) : filteredRows.length === 0 ? (
          <View className={styles.empty}>
            <Text className={styles.emptyText}>{keyword ? '未找到匹配的咨询师' : '暂无记录'}</Text>
          </View>
        ) : (
          <View className={styles.list}>
            {filteredRows.map((c) => (
              <View key={c.id} className={styles.card} onClick={() => openDetail(c.id)}>
                <View className={styles.avatar}>
                  <Text className={styles.avatarText}>{(c.displayName || c.name || '?').charAt(0)}</Text>
                </View>
                <View className={styles.cardInfo}>
                  <View className={styles.nameRow}>
                    <Text className={styles.name}>{c.displayName || c.name || '未填写'}</Text>
                    <Text className={styles.badge} style={{ color: badge.color, background: badge.bg }}>
                      {c.reviewStatus === 'pending'
                        ? '待审核'
                        : c.reviewStatus === 'approved'
                        ? '已上架'
                        : c.reviewStatus === 'rejected'
                        ? '已驳回'
                        : badge.text}
                    </Text>
                  </View>
                  <Text className={styles.meta}>
                    {(c.counselorTypes || []).join(' · ') || '未填写类别'}
                    {c.location ? ` · ${c.location}` : ''}
                  </Text>
                  <Text className={styles.date}>申请时间：{fmtDate(c.createdAt)}</Text>
                </View>
                <View className={styles.arrow}>
                  <Icon name="chevronRight" size={16} color="#C4BDB5" />
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* 详情底部弹层 */}
      {(detailLoading || detail) && (
        <View className={styles.mask} onClick={closeDetail}>
          <View className={styles.sheet} onClick={(e) => e.stopPropagation()}>
            {detailLoading ? (
              <View className={styles.sheetLoading}>
                <Text className={styles.emptyText}>加载详情中…</Text>
              </View>
            ) : detail ? (
              <>
                <View className={styles.sheetHeader}>
                  <Text className={styles.sheetTitle}>{detailName}</Text>
                  <View className={styles.sheetClose} onClick={closeDetail}>
                    <Icon name="close" size={14} color="#5A4E44" />
                  </View>
                </View>

                <View className={styles.sectionList}>
                  <View className={styles.sectionCard}>
                    <Text className={styles.sectionLabel}>咨询师类别</Text>
                    <Text className={styles.sectionValue}>
                      {(detail.counselorTypes || []).join('、') || '未填写'}
                    </Text>
                  </View>
                  <View className={styles.sectionCard}>
                    <Text className={styles.sectionLabel}>账号</Text>
                    <Text className={styles.sectionValue}>
                      {detail.userName ? `${detail.userName} · ` : ''}
                      {detail.email || '未填写'}
                    </Text>
                  </View>
                  <View className={styles.sectionCard}>
                    <Text className={styles.sectionLabel}>个人简介</Text>
                    <Text className={styles.sectionValue}>{detail.bio || '未填写'}</Text>
                  </View>
                  <View className={styles.sectionCard}>
                    <Text className={styles.sectionLabel}>从业资质</Text>
                    {ql.length > 0 ? (
                      ql.map((q, i) => (
                        <Text key={i} className={styles.sectionValue}>
                          • {q}
                        </Text>
                      ))
                    ) : (
                      <Text className={styles.sectionValueMuted}>未填写</Text>
                    )}
                  </View>
                  {ed.length > 0 && (
                    <View className={styles.sectionCard}>
                      <Text className={styles.sectionLabel}>教育背景</Text>
                      {ed.map((v, i) => (
                        <Text key={i} className={styles.sectionValue}>
                          • {v}
                        </Text>
                      ))}
                    </View>
                  )}
                  {tr.length > 0 && (
                    <View className={styles.sectionCard}>
                      <Text className={styles.sectionLabel}>受训经历</Text>
                      {tr.map((v, i) => (
                        <Text key={i} className={styles.sectionValue}>
                          • {v}
                        </Text>
                      ))}
                    </View>
                  )}
                  {we.length > 0 && (
                    <View className={styles.sectionCard}>
                      <Text className={styles.sectionLabel}>工作经验</Text>
                      {we.map((v, i) => (
                        <Text key={i} className={styles.sectionValue}>
                          • {v}
                        </Text>
                      ))}
                    </View>
                  )}
                  {tab === 'rejected' && detail.reviewNote ? (
                    <View className={styles.sectionCard}>
                      <Text className={styles.sectionLabel}>驳回原因</Text>
                      <Text className={styles.sectionValue}>{detail.reviewNote}</Text>
                    </View>
                  ) : null}
                </View>

                {/* 操作区 */}
                {tab === 'pending' && !showReject && (
                  <View className={styles.actionRow}>
                    <View
                      className={`${styles.actionBtn} ${styles.actionBtnDangerSoft}`}
                      onClick={() => setShowReject(true)}
                    >
                      <Text className={styles.actionBtnDangerText}>驳回</Text>
                    </View>
                    <View
                      className={`${styles.actionBtn} ${styles.actionBtnPrimary} ${submitting ? styles.actionBtnDisabled : ''}`}
                      onClick={() => handleApprove(detail)}
                    >
                      <Text className={styles.actionBtnPrimaryText}>通过</Text>
                    </View>
                  </View>
                )}

                {tab === 'pending' && showReject && (
                  <View className={styles.rejectWrap}>
                    <Text className={styles.rejectLabel}>驳回原因</Text>
                    <Textarea
                      className={styles.rejectTextarea}
                      value={rejectReason}
                      maxlength={200}
                      placeholder="请填写驳回原因，将通知到咨询师…"
                      onInput={(e) => setRejectReason(e.detail.value)}
                    />
                    <View className={styles.actionRow}>
                      <View
                        className={`${styles.actionBtn} ${styles.actionBtnMuted}`}
                        onClick={() => setShowReject(false)}
                      >
                        <Text className={styles.actionBtnMutedText}>取消</Text>
                      </View>
                      <View
                        className={`${styles.actionBtn} ${styles.actionBtnDanger} ${submitting || !rejectReason.trim() ? styles.actionBtnDisabled : ''}`}
                        onClick={() => handleReject(detail)}
                      >
                        <Text className={styles.actionBtnDangerSolidText}>确认驳回</Text>
                      </View>
                    </View>
                  </View>
                )}

                {tab === 'approved' && (
                  <View className={styles.actionRow}>
                    <View
                      className={`${styles.actionBtn} ${styles.actionBtnDanger} ${submitting ? styles.actionBtnDisabled : ''}`}
                      onClick={() => handleOffline(detail)}
                    >
                      <Text className={styles.actionBtnDangerSolidText}>下架该咨询师</Text>
                    </View>
                  </View>
                )}
              </>
            ) : null}
          </View>
        </View>
      )}
    </View>
  );
};

export default AdminCounselorsPage;
