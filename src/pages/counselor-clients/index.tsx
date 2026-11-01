import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, Image, ScrollView } from '@tarojs/components';
import styles from './index.module.scss';
import Icon from '@/components/Icon';
import { useUserStore } from '@/stores/user';
import { request, resolveAssetUrl } from '@/services/api';
import { getBookingStatusMeta } from '@/types/booking';

/** /api/counselor/bookings（web 同源接口）中的来访摘要 */
interface ClientBrief {
  id: string;
  name?: string | null;
  email?: string | null;
  avatarUrl?: string | null;
}

/**
 * 申请单结构：小程序下单走 ApplicationForm（types/counselor），
 * web 端还有 background / emergencyContact 旧字段，这里一并兜底展示
 */
interface ApplicationFormShape {
  name?: string;
  phone?: string;
  wechat?: string;
  purposes?: string[];
  purposeOther?: string;
  hasMentalDisease?: boolean;
  onMedication?: boolean;
  hasSelfHarm?: boolean;
  hasSuicidalThought?: boolean;
  hasSuicidalBehavior?: boolean;
  additionalNote?: string;
  emergencyName?: string;
  emergencyPhone?: string;
  /** web 版字段兜底 */
  background?: string;
  emergencyContact?: string;
}

interface CounselorBooking {
  id: string;
  status: string;
  scheduledAt: string;
  durationMinutes: number;
  sessionMode: string;
  priceAmount: number;
  clientNote?: string | null;
  sessionNumber?: number | null;
  packageId?: string | null;
  applicationForm?: Record<string, unknown> | null;
  client?: ClientBrief | null;
}

/** 按 clientId 聚合后的来访档案 */
interface ClientProfile {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  total: number;
  completed: number;
  latestAt: string;
  firstAt: string;
  /** 按 scheduledAt 升序 */
  bookings: CounselorBooking[];
}

const WEEKDAY_LABELS = ['日', '一', '二', '三', '四', '五', '六'];

const fmtDateTime = (iso?: string | null): string => {
  if (!iso) return '未指定';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return `${d.getMonth() + 1}月${d.getDate()}日 周${WEEKDAY_LABELS[d.getDay()]} ${String(
    d.getHours()
  ).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

const fmtDate = (iso?: string | null): string => {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`;
};

const HEALTH_FLAGS: Array<[keyof ApplicationFormShape, string]> = [
  ['hasMentalDisease', '既往精神科诊断'],
  ['onMedication', '正在服用精神科药物'],
  ['hasSelfHarm', '自伤行为'],
  ['hasSuicidalThought', '自杀念头'],
  ['hasSuicidalBehavior', '自杀未遂']
];

const ClientsPage: React.FC = () => {
  const { currentRole } = useUserStore();
  const [bookings, setBookings] = useState<CounselorBooking[]>([]);
  const [loading, setLoading] = useState(true);
  // 页内详情：选中来访的 clientId（null = 列表视图）
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  // 申请单底部弹层
  const [formTarget, setFormTarget] = useState<CounselorBooking | null>(null);

  useEffect(() => {
    loadBookings();
  }, []);

  const loadBookings = async () => {
    try {
      setLoading(true);
      // 与 web 来访档案一致：咨询师订单列表（含 client / applicationForm / sessionNumber）
      const data = await request<any[]>('/api/counselor/bookings');
      const list: CounselorBooking[] = (Array.isArray(data) ? data : []).map(raw => ({
        id: raw.id,
        status: raw.status,
        scheduledAt: raw.scheduledAt,
        durationMinutes: raw.durationMinutes || 50,
        sessionMode: raw.sessionMode || '视频',
        priceAmount: raw.priceAmount || 0,
        clientNote: raw.clientNote ?? '',
        sessionNumber: raw.sessionNumber ?? null,
        packageId: raw.packageId ?? null,
        applicationForm: raw.applicationForm ?? null,
        client: raw.client ?? null
      }));
      setBookings(list);
    } catch (err) {
      console.error('[Clients] 加载咨询师订单失败', err);
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  /** 按 clientId 聚合：昵称 / 头像 / 累计次数 / 首末预约时间 */
  const clients = useMemo<ClientProfile[]>(() => {
    const map = new Map<string, ClientProfile>();
    bookings.forEach(b => {
      const af = b.applicationForm as ApplicationFormShape | null | undefined;
      const id = b.client?.id || 'unknown';
      const name =
        b.client?.name || af?.name || b.client?.email?.split('@')[0] || '未署名来访';
      let profile = map.get(id);
      if (!profile) {
        profile = {
          id,
          name,
          email: b.client?.email || '',
          avatarUrl: resolveAssetUrl(b.client?.avatarUrl),
          total: 0,
          completed: 0,
          latestAt: '',
          firstAt: '',
          bookings: []
        };
        map.set(id, profile);
      }
      profile.total += 1;
      if (b.status === 'completed') profile.completed += 1;
      const t = b.scheduledAt ? new Date(b.scheduledAt).getTime() : NaN;
      if (!isNaN(t)) {
        if (!profile.latestAt || t > new Date(profile.latestAt).getTime()) profile.latestAt = b.scheduledAt;
        if (!profile.firstAt || t < new Date(profile.firstAt).getTime()) profile.firstAt = b.scheduledAt;
      }
      profile.bookings.push(b);
    });
    const profiles = Array.from(map.values());
    profiles.forEach(p => {
      p.bookings.sort(
        (a, b) => new Date(a.scheduledAt || 0).getTime() - new Date(b.scheduledAt || 0).getTime()
      );
    });
    // 最近有预约的来访排前面
    profiles.sort(
      (a, b) => new Date(b.latestAt || 0).getTime() - new Date(a.latestAt || 0).getTime()
    );
    return profiles;
  }, [bookings]);

  const selected = useMemo(
    () => clients.find(c => c.id === selectedClientId) || null,
    [clients, selectedClientId]
  );

  const sessionNumberOf = (b: CounselorBooking, profile: ClientProfile): number =>
    b.sessionNumber ?? profile.bookings.findIndex(x => x.id === b.id) + 1;

  const renderAvatar = (profile: ClientProfile, cls: string, fallbackCls: string) =>
    profile.avatarUrl ? (
      <Image className={cls} src={profile.avatarUrl} mode='aspectFill' />
    ) : (
      <View className={fallbackCls}>
        <Text>{profile.name.slice(0, 1)}</Text>
      </View>
    );

  if (currentRole !== 'counselor') {
    return (
      <View className={styles.container}>
        <View className={styles.unauthorized}>
          <Text className={styles.unauthorizedText}>请切换到咨询师角色查看此页面</Text>
        </View>
      </View>
    );
  }

  // ============ 详情视图 ============
  if (selected) {
    const af = (formTarget?.applicationForm || {}) as ApplicationFormShape;
    const hasFormSection =
      (af.purposes && af.purposes.length > 0) ||
      af.background ||
      af.additionalNote ||
      af.phone ||
      af.wechat ||
      af.emergencyName ||
      af.emergencyContact ||
      af.emergencyPhone ||
      HEALTH_FLAGS.some(([k]) => af[k] !== undefined);

    return (
      <View className={styles.container}>
        <View className={styles.header}>
          <View className={styles.backBtn} onClick={() => setSelectedClientId(null)}>
            <Icon name='chevronLeft' size={18} color='#5A4E44' />
          </View>
          <Text className={styles.title}>来访档案</Text>
        </View>

        <ScrollView className={styles.scrollContent} scrollY>
          {/* 来访头部：大头像 / 昵称 / 累计 N 次咨询 */}
          <View className={styles.profileCard}>
            <View className={styles.profileTop}>
              {renderAvatar(selected, styles.profileAvatar, styles.profileAvatarFallback)}
              <View className={styles.profileInfo}>
                <Text className={styles.profileName}>{selected.name}</Text>
                {selected.email ? (
                  <Text className={styles.profileEmail}>{selected.email}</Text>
                ) : null}
                <Text className={styles.profileTotal}>累计 {selected.total} 次咨询</Text>
              </View>
            </View>
            <View className={styles.statsRow}>
              <View className={styles.statItem}>
                <Text className={styles.statValue}>{fmtDate(selected.firstAt)}</Text>
                <Text className={styles.statLabel}>首次咨询</Text>
              </View>
              <View className={styles.statItem}>
                <Text className={styles.statValue}>{selected.completed} 次</Text>
                <Text className={styles.statLabel}>已完成</Text>
              </View>
              <View className={styles.statItem}>
                <Text className={styles.statValue}>{fmtDate(selected.latestAt)}</Text>
                <Text className={styles.statLabel}>最近预约</Text>
              </View>
            </View>
          </View>

          {/* 全部预约历史（最近在前） */}
          <Text className={styles.sectionTitle}>咨询记录</Text>
          {[...selected.bookings].reverse().map(b => {
            const meta = getBookingStatusMeta(b.status);
            return (
              <View key={b.id} className={styles.historyCard}>
                <View className={styles.historyHeader}>
                  <View className={styles.sessionNo}>
                    <Text>{sessionNumberOf(b, selected)}</Text>
                  </View>
                  <View className={styles.historyInfo}>
                    <Text className={styles.historyMode}>
                      第 {sessionNumberOf(b, selected)} 次 · {b.sessionMode}
                    </Text>
                    <Text className={styles.historyTime}>
                      {fmtDateTime(b.scheduledAt)} · {b.durationMinutes}分钟
                    </Text>
                  </View>
                  <Text className={styles.badge} style={{ color: meta.color, backgroundColor: meta.bg }}>
                    {meta.label}
                  </Text>
                </View>
                <View className={styles.historyFooter}>
                  {b.packageId ? (
                    <Text className={styles.packageBadge}>套餐核销 · 不另收费</Text>
                  ) : (
                    <Text className={styles.priceText}>¥{b.priceAmount}</Text>
                  )}
                  {b.applicationForm ? (
                    <View className={styles.formButton} onClick={() => setFormTarget(b)}>
                      <Icon name='book' size={14} color='#C66B2E' />
                      <Text className={styles.formButtonText}>查看申请单</Text>
                      <Icon name='chevronRight' size={12} color='#C66B2E' />
                    </View>
                  ) : null}
                </View>
              </View>
            );
          })}
        </ScrollView>

        {/* 申请单底部弹层：展示下单时填写的字段值 */}
        {formTarget && (
          <View className={styles.sheetMask} onClick={() => setFormTarget(null)}>
            <View className={styles.sheet} onClick={e => e.stopPropagation()}>
              <View className={styles.sheetHeader}>
                <Text className={styles.sheetTitle}>预约申请单</Text>
                <View className={styles.sheetClose} onClick={() => setFormTarget(null)}>
                  <Icon name='close' size={16} color='#7D736A' />
                </View>
              </View>

              {hasFormSection ? (
                <View>
                  {af.name ? (
                    <View className={styles.formSection}>
                      <Text className={styles.formLabel}>姓名</Text>
                      <Text className={styles.formValue}>{af.name}</Text>
                    </View>
                  ) : null}

                  {af.purposes && af.purposes.length > 0 ? (
                    <View className={styles.formSection}>
                      <Text className={styles.formLabel}>咨询目的</Text>
                      <View className={styles.chips}>
                        {af.purposes.map(p => (
                          <Text key={p} className={styles.chip}>
                            {p}
                          </Text>
                        ))}
                        {af.purposeOther ? (
                          <Text className={styles.chip}>{af.purposeOther}</Text>
                        ) : null}
                      </View>
                    </View>
                  ) : null}

                  {af.background || af.additionalNote ? (
                    <View className={styles.formSection}>
                      <Text className={styles.formLabel}>背景描述</Text>
                      <Text className={styles.formValue}>{af.background || af.additionalNote}</Text>
                    </View>
                  ) : null}

                  {HEALTH_FLAGS.some(([k]) => af[k] !== undefined) ? (
                    <View className={styles.formSection}>
                      <Text className={styles.formLabel}>健康状况</Text>
                      {HEALTH_FLAGS.filter(([k]) => af[k] !== undefined).map(([k, label]) => (
                        <View key={k} className={styles.formRow}>
                          <Text className={styles.formRowLabel}>{label}</Text>
                          <Text className={styles.formRowValue}>{af[k] ? '是' : '否'}</Text>
                        </View>
                      ))}
                    </View>
                  ) : null}

                  {af.phone || af.wechat ? (
                    <View className={styles.formSection}>
                      <Text className={styles.formLabel}>联系方式</Text>
                      {af.phone ? (
                        <View className={styles.formRow}>
                          <Text className={styles.formRowLabel}>手机号</Text>
                          <Text className={styles.formRowValue}>{af.phone}</Text>
                        </View>
                      ) : null}
                      {af.wechat ? (
                        <View className={styles.formRow}>
                          <Text className={styles.formRowLabel}>微信号</Text>
                          <Text className={styles.formRowValue}>{af.wechat}</Text>
                        </View>
                      ) : null}
                    </View>
                  ) : null}

                  {af.emergencyName || af.emergencyContact || af.emergencyPhone ? (
                    <View className={styles.formSection}>
                      <Text className={styles.formLabel}>紧急联系人</Text>
                      {af.emergencyName || af.emergencyContact ? (
                        <View className={styles.formRow}>
                          <Text className={styles.formRowLabel}>联系人</Text>
                          <Text className={styles.formRowValue}>
                            {af.emergencyName || af.emergencyContact}
                          </Text>
                        </View>
                      ) : null}
                      {af.emergencyPhone ? (
                        <View className={styles.formRow}>
                          <Text className={styles.formRowLabel}>电话</Text>
                          <Text className={styles.formRowValue}>{af.emergencyPhone}</Text>
                        </View>
                      ) : null}
                    </View>
                  ) : null}
                </View>
              ) : (
                <Text className={styles.formEmpty}>该申请单暂无可展示的内容</Text>
              )}
            </View>
          </View>
        )}
      </View>
    );
  }

  // ============ 列表视图 ============
  return (
    <View className={styles.container}>
      <View className={styles.header}>
        <Text className={styles.title}>来访管理</Text>
      </View>

      <ScrollView className={styles.scrollContent} scrollY>
        {loading ? (
          <View className={styles.loading}>
            <Text className={styles.loadingText}>加载中...</Text>
          </View>
        ) : clients.length === 0 ? (
          <View className={styles.empty}>
            <Icon name='users' size={40} color='#C4BDB5' />
            <Text className={styles.emptyText}>暂无来访，接到来访预约后将在这里建立档案</Text>
          </View>
        ) : (
          <View className={styles.clientList}>
            {clients.map(c => (
              <View
                key={c.id}
                className={styles.clientCard}
                onClick={() => setSelectedClientId(c.id)}
              >
                {renderAvatar(c, styles.avatar, styles.avatarFallback)}
                <View className={styles.clientInfo}>
                  <Text className={styles.clientName}>{c.name}</Text>
                  <Text className={styles.clientMeta}>
                    累计 {c.total} 次预约 · 最近 {fmtDateTime(c.latestAt)}
                  </Text>
                </View>
                <Icon name='chevronRight' size={16} color='#C4BDB5' />
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

export default ClientsPage;
