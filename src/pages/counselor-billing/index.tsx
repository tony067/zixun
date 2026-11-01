import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import Icon from '@/components/Icon';
import { useUserStore } from '@/stores/user';
import { request } from '@/services/api';

/** GET /api/counselor/stats（web 同源接口）实际字段 */
interface StatsData {
  totalBookings: number;
  completedSessions: number;
  pendingCount: number;
  uniqueClients: number;
}

interface CounselorBooking {
  id: string;
  status: string;
  scheduledAt: string;
  sessionMode: string;
  priceAmount: number;
  client?: { id: string; name?: string | null; email?: string | null } | null;
  applicationForm?: Record<string, unknown> | null;
}

/** 月度账单明细行 */
interface BillingItem {
  id: string;
  /** YYYY-MM-DD */
  date: string;
  clientName: string;
  mode: string;
  amount: number;
}

interface MonthGroup {
  /** YYYY-MM */
  month: string;
  /** YYYY年M月 */
  label: string;
  count: number;
  total: number;
  items: BillingItem[];
}

const pad2 = (n: number): string => String(n).padStart(2, '0');

const EMPTY_STATS: StatsData = { totalBookings: 0, completedSessions: 0, pendingCount: 0, uniqueClients: 0 };

/** stats 接口不可用时按 web 口径前端聚合 */
function aggregateStats(list: CounselorBooking[]): StatsData {
  const clientIds = new Set<string>();
  let completed = 0;
  let pending = 0;
  list.forEach(b => {
    if (b.client?.id) clientIds.add(b.client.id);
    if (b.status === 'completed') completed += 1;
    if (b.status === 'pending_confirmation') pending += 1;
  });
  return {
    totalBookings: list.length,
    completedSessions: completed,
    pendingCount: pending,
    uniqueClients: clientIds.size
  };
}

const clientNameOf = (b: CounselorBooking): string => {
  const af = b.applicationForm as { name?: string } | null | undefined;
  return b.client?.name || af?.name || b.client?.email?.split('@')[0] || '来访者';
};

/** 已完成订单按月分组（近月在前） */
function groupByMonth(list: CounselorBooking[]): MonthGroup[] {
  const map = new Map<string, BillingItem[]>();
  list.forEach(b => {
    if (b.status !== 'completed' || !b.scheduledAt) return;
    const d = new Date(b.scheduledAt);
    if (isNaN(d.getTime())) return;
    const month = `${d.getFullYear()}-${pad2(d.getMonth() + 1)}`;
    const item: BillingItem = {
      id: b.id,
      date: `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`,
      clientName: clientNameOf(b),
      mode: b.sessionMode || '视频',
      amount: b.priceAmount || 0
    };
    const bucket = map.get(month);
    if (bucket) bucket.push(item);
    else map.set(month, [item]);
  });
  return Array.from(map.entries())
    .sort((a, b) => (a[0] < b[0] ? 1 : -1))
    .map(([month, items]) => {
      const [y, m] = month.split('-');
      return {
        month,
        label: `${y}年${Number(m)}月`,
        count: items.length,
        total: items.reduce((s, it) => s + it.amount, 0),
        items: items.sort((a, b) => (a.date < b.date ? 1 : -1))
      };
    });
}

// CSV 内含逗号/引号/换行的字段需加引号转义
const escCSV = (v: string): string => (/[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);

function buildCSV(months: MonthGroup[]): string {
  const header = ['月份', '日期', '来访', '方式', '金额'].join(',');
  const rows = months.flatMap(m =>
    m.items.map(it =>
      [m.month, it.date, it.clientName, it.mode, String(it.amount)].map(escCSV).join(',')
    )
  );
  // \uFEFF BOM 便于 Excel 识别 UTF-8（与 web 导出一致）
  return ['\uFEFF' + header, ...rows].join('\n');
}

const BillingPage: React.FC = () => {
  const { currentRole } = useUserStore();
  const [stats, setStats] = useState<StatsData>(EMPTY_STATS);
  const [months, setMonths] = useState<MonthGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedMonth, setExpandedMonth] = useState<string | null>(null);

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    try {
      setLoading(true);
      // 订单列表：stats 失败时兜底聚合，也用于按月生成账单
      const data = await request<any[]>('/api/counselor/bookings');
      const list: CounselorBooking[] = (Array.isArray(data) ? data : []).map(raw => ({
        id: raw.id,
        status: raw.status,
        scheduledAt: raw.scheduledAt,
        sessionMode: raw.sessionMode || '视频',
        priceAmount: raw.priceAmount || 0,
        client: raw.client ?? null,
        applicationForm: raw.applicationForm ?? null
      }));
      setMonths(groupByMonth(list));

      try {
        const s = await request<StatsData>('/api/counselor/stats');
        if (s && typeof s.totalBookings === 'number') {
          setStats({
            totalBookings: s.totalBookings || 0,
            completedSessions: s.completedSessions || 0,
            pendingCount: s.pendingCount || 0,
            uniqueClients: s.uniqueClients || 0
          });
          return;
        }
      } catch (err) {
        console.error('[Billing] stats 接口不可用，改为前端聚合', err);
      }
      setStats(aggregateStats(list));
    } catch (err) {
      console.error('[Billing] 加载咨询师订单失败', err);
      setMonths([]);
      setStats(EMPTY_STATS);
    } finally {
      setLoading(false);
    }
  };

  const statCards = useMemo(
    () => [
      { icon: 'calendar' as const, label: '总预约', value: stats.totalBookings, color: '#7A9A6A' },
      { icon: 'check' as const, label: '已完成', value: stats.completedSessions, color: '#3A6228' },
      { icon: 'clock' as const, label: '待确认', value: stats.pendingCount, color: '#C66B2E' },
      { icon: 'users' as const, label: '来访人数', value: stats.uniqueClients, color: '#7A9AC0' }
    ],
    [stats]
  );

  const totalRevenue = useMemo(() => months.reduce((s, m) => s + m.total, 0), [months]);

  /** 导出账单：weapp 复制到剪贴板；H5 Blob 下载 */
  const handleExport = () => {
    if (totalRevenue === 0 && months.length === 0) {
      Taro.showToast({ title: '暂无账单数据可导出', icon: 'none' });
      return;
    }
    const csv = buildCSV(months);
    if (process.env.TARO_ENV === 'weapp') {
      Taro.setClipboardData({
        data: csv,
        success: () => {
          Taro.showToast({ title: '已复制，可粘贴到电脑表格', icon: 'none' });
        }
      });
      return;
    }
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const now = new Date();
    a.download = `我的账单_${now.getFullYear()}年${now.getMonth() + 1}月.csv`;
    a.href = url;
    a.click();
    URL.revokeObjectURL(url);
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
        <Text className={styles.title}>统计账单</Text>
        <View className={styles.exportButton} onClick={handleExport}>
          <Icon name='share' size={14} color='#FFFFFF' />
          <Text className={styles.exportButtonText}>导出账单</Text>
        </View>
      </View>

      <ScrollView className={styles.scrollContent} scrollY>
        {loading ? (
          <View className={styles.loading}>
            <Text className={styles.loadingText}>加载中...</Text>
          </View>
        ) : (
          <View className={styles.body}>
            {/* 顶部统计卡 4 格（口径与 web /api/counselor/stats 一致） */}
            <View className={styles.statGrid}>
              {statCards.map(card => (
                <View key={card.label} className={styles.statCard}>
                  <Icon name={card.icon} size={22} color={card.color} />
                  <Text className={styles.statValue}>{card.value}</Text>
                  <Text className={styles.statLabel}>{card.label}</Text>
                </View>
              ))}
            </View>

            {/* 累计收入概览 */}
            <View className={styles.revenueCard}>
              <Text className={styles.revenueLabel}>累计咨询收入（已完成订单）</Text>
              <Text className={styles.revenueValue}>¥{totalRevenue.toLocaleString()}</Text>
              <Text className={styles.revenueHint}>
                共 {months.reduce((s, m) => s + m.count, 0)} 笔已完成订单 · {months.length} 个月
              </Text>
            </View>

            {/* 月度账单列表 */}
            <Text className={styles.sectionTitle}>月度账单</Text>
            {months.length === 0 ? (
              <View className={styles.empty}>
                <Icon name='chart' size={40} color='#C4BDB5' />
                <Text className={styles.emptyText}>暂无已完成订单，账单将在这里生成</Text>
              </View>
            ) : (
              months.map(m => {
                const expanded = expandedMonth === m.month;
                return (
                  <View key={m.month} className={styles.monthCard}>
                    <View
                      className={styles.monthHeader}
                      onClick={() => setExpandedMonth(expanded ? null : m.month)}
                    >
                      <View className={styles.monthTitleWrap}>
                        <Text className={styles.monthLabel}>{m.label}</Text>
                        <Text className={styles.monthCount}>共 {m.count} 笔</Text>
                      </View>
                      <View className={styles.monthRight}>
                        <Text className={styles.monthTotal}>¥{m.total.toLocaleString()}</Text>
                        <Icon
                          name={expanded ? 'chevronDown' : 'chevronRight'}
                          size={14}
                          color='#9B8E82'
                        />
                      </View>
                    </View>

                    {expanded && (
                      <View className={styles.monthDetail}>
                        {m.items.map(it => (
                          <View key={it.id} className={styles.detailRow}>
                            <View className={styles.detailLeft}>
                              <Text className={styles.detailName}>{it.clientName}</Text>
                              <Text className={styles.detailMeta}>
                                {it.date} · {it.mode}
                              </Text>
                            </View>
                            <Text className={styles.detailAmount}>¥{it.amount}</Text>
                          </View>
                        ))}
                      </View>
                    )}
                  </View>
                );
              })
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

export default BillingPage;
