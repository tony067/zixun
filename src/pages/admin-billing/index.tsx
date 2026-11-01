import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, ScrollView, Picker } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import styles from './index.module.scss';
import { request } from '@/services/api';
import { useUserStore } from '@/stores/user';
import Icon from '@/components/Icon';

// 对齐 web /api/admin/billing 契约
interface BillItem {
  id: string;
  type: 'booking' | 'service';
  scheduledDate: string;
  scheduledTime: string;
  priceAmount: number;
  counselorId: string;
  counselorName: string;
  clientId: string;
  clientName: string;
  note: string;
}

interface CounselorOption {
  id: string;
  name: string;
}

const COUNSELOR_ALL = 'all';

/** CSV 导出（表头/行/合计与 web 版一致，带 \uFEFF BOM 防止 Excel 乱码） */
function buildCSV(items: BillItem[], total: number): string {
  const header = ['订单编号', '类型', '日期', '时间', '老师', '来访者', '金额(元)', '备注'].join(',');
  const rows = items.map((r) =>
    [
      r.id,
      r.type === 'service' ? '个性服务' : '咨询',
      r.scheduledDate,
      r.scheduledTime ?? '',
      `"${r.counselorName}"`,
      `"${r.clientName}"`,
      r.priceAmount,
      `"${(r.note || '').replace(/"/g, '""')}"`
    ].join(',')
  );
  const footer = `,,,,合计,${total},`;
  return ['\uFEFF' + header, ...rows, footer].join('\n');
}

const AdminBillingPage: React.FC = () => {
  const { currentRole } = useUserStore();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [counselorFilter, setCounselorFilter] = useState<string>(COUNSELOR_ALL);
  const [counselorList, setCounselorList] = useState<CounselorOption[]>([]);
  const [items, setItems] = useState<BillItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const tabRef = useRef({ year, month, counselorFilter });
  tabRef.current = { year, month, counselorFilter };

  // 咨询师筛选项（对齐 web：/api/admin/counselors?status=approved）
  const loadCounselorOptions = useCallback(async () => {
    try {
      const data = await request<any[]>('/api/admin/counselors?status=approved');
      if (Array.isArray(data)) {
        setCounselorList(
          data.map((c) => ({ id: c?.id || '', name: c?.displayName ?? c?.name ?? c?.id ?? '' }))
        );
      }
    } catch {
      // 筛选项加载失败不阻塞账单展示
    }
  }, []);

  const loadBilling = useCallback(async (y: number, m: number, counselorId: string) => {
    setLoading(true);
    try {
      const qs = counselorId !== COUNSELOR_ALL ? `&counselorId=${counselorId}` : '';
      const data = await request<any>(`/api/admin/billing?year=${y}&month=${m}${qs}`);
      setItems(Array.isArray(data?.items) ? data.items : []);
      setTotal(Number(data?.total) || 0);
    } catch (err) {
      Taro.showToast({
        title: err instanceof Error ? err.message : '加载账单失败，请稍后重试',
        icon: 'none'
      });
      setItems([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, []);

  useDidShow(() => {
    const cur = tabRef.current;
    loadBilling(cur.year, cur.month, cur.counselorFilter);
    if (counselorList.length === 0) loadCounselorOptions();
  });

  useEffect(() => {
    loadBilling(year, month, counselorFilter);
  }, [year, month, counselorFilter, loadBilling]);

  const prevMonth = () => {
    if (month === 1) {
      setYear(year - 1);
      setMonth(12);
    } else {
      setMonth(month - 1);
    }
  };

  const nextMonth = () => {
    const nm = month === 12 ? 1 : month + 1;
    const ny = month === 12 ? year + 1 : year;
    if (ny > now.getFullYear() || (ny === now.getFullYear() && nm > now.getMonth() + 1)) return;
    setYear(ny);
    setMonth(nm);
  };

  const canNext = !(year === now.getFullYear() && month === now.getMonth() + 1);

  const handleMonthChange = (e: any) => {
    // fields='month' 返回 'YYYY-MM'
    const value = String(e?.detail?.value || '');
    const [y, m] = value.split('-').map(Number);
    if (y && m) {
      setYear(y);
      setMonth(m);
    }
  };

  const handleCounselorChange = (e: any) => {
    const idx = Number(e?.detail?.value ?? 0);
    if (idx <= 0) {
      setCounselorFilter(COUNSELOR_ALL);
    } else {
      const opt = counselorList[idx - 1];
      if (opt?.id) setCounselorFilter(opt.id);
    }
  };

  // 导出 CSV：weapp 复制到剪贴板，H5 Blob 下载
  const handleExport = () => {
    if (items.length === 0) {
      Taro.showToast({ title: '本月暂无账单可导出', icon: 'none' });
      return;
    }
    const csv = buildCSV(items, total);
    if (process.env.TARO_ENV === 'h5') {
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `MindPace账单_${year}年${month}月.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } else {
      Taro.setClipboardData({
        data: csv,
        success: () => {
          Taro.showToast({ title: '已复制', icon: 'success' });
        }
      });
    }
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

  const counselorRange = ['全部咨询师', ...counselorList.map((c) => c.name)];

  return (
    <View className={styles.container}>
      <View className={styles.header}>
        <Text className={styles.title}>平台账单</Text>
        <View className={styles.exportButton} onClick={handleExport}>
          <Icon name="arrowRight" size={14} color="#FFFFFF" />
          <Text className={styles.exportButtonText}>导出 CSV</Text>
        </View>
      </View>

      {/* 月份切换 + 快捷选择 */}
      <View className={styles.monthBar}>
        <View className={styles.monthArrow} onClick={prevMonth}>
          <Icon name="chevronLeft" size={16} color="#5A4E44" />
        </View>
        <Picker mode="date" fields="month" value={`${year}-${String(month).padStart(2, '0')}`} onChange={handleMonthChange}>
          <View className={styles.monthValue}>
            <Text className={styles.monthText}>
              {year} 年 {month} 月
            </Text>
            <Icon name="chevronDown" size={14} color="#7D736A" />
          </View>
        </Picker>
        <View className={styles.monthArrow} onClick={canNext ? nextMonth : undefined} style={{ opacity: canNext ? 1 : 0.3 }}>
          <Icon name="chevronRight" size={16} color="#5A4E44" />
        </View>
      </View>

      {/* 咨询师筛选下拉 */}
      <View className={styles.filterBar}>
        <Icon name="filter" size={14} color="#7D736A" />
        <Picker mode="selector" range={counselorRange} onChange={handleCounselorChange}>
          <View className={styles.filterValue}>
            <Text className={styles.filterText}>
              {counselorFilter === COUNSELOR_ALL
                ? '全部咨询师'
                : counselorList.find((c) => c.id === counselorFilter)?.name || '已选咨询师'}
            </Text>
            <Icon name="chevronDown" size={12} color="#9B8E82" />
          </View>
        </Picker>
      </View>

      {/* 汇总卡 */}
      <View className={styles.summaryCard}>
        <Text className={styles.summaryLabel}>
          {year}年{month}月完成订单总额（咨询 + 个性服务）
        </Text>
        <Text className={styles.summaryTotal}>¥{total.toLocaleString()}</Text>
        <Text className={styles.summaryCount}>共 {items.length} 笔已付款订单</Text>
      </View>

      {/* 明细列表 */}
      <ScrollView className={styles.scrollContent} scrollY>
        {loading ? (
          <View className={styles.empty}>
            <Text className={styles.emptyText}>加载中…</Text>
          </View>
        ) : items.length === 0 ? (
          <View className={styles.empty}>
            <Text className={styles.emptyText}>本月暂无已完成订单</Text>
          </View>
        ) : (
          <View className={styles.list}>
            <Text className={styles.listLabel}>订单明细</Text>
            {items.map((item) => (
              <View key={item.id} className={styles.billCard}>
                <View className={styles.billMain}>
                  <View className={styles.billTopRow}>
                    <Text
                      className={styles.typePill}
                      style={
                        item.type === 'service'
                          ? { background: '#FEF9EE', color: '#B07D2A' }
                          : { background: '#E4F0DC', color: '#3A6228' }
                      }
                    >
                      {item.type === 'service' ? '个性服务' : '咨询'}
                    </Text>
                    <Text className={styles.billNames}>
                      {item.counselorName} → {item.clientName}
                    </Text>
                  </View>
                  <Text className={styles.billDate}>
                    {item.scheduledDate}
                    {item.scheduledTime ? ` · ${item.scheduledTime}` : ''}
                  </Text>
                  {item.note ? (
                    <Text className={styles.billNote}>{item.note}</Text>
                  ) : null}
                </View>
                <Text className={styles.billPrice}>¥{item.priceAmount}</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

export default AdminBillingPage;
