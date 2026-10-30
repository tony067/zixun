import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, Input, ScrollView } from '@tarojs/components';
import Taro, { useDidShow, useDidHide } from '@tarojs/taro';
import styles from './index.module.scss';
import CustomTabBar from '@/components/TabBar';
import { UNREAD_REFRESH_EVENT } from '@/constants/events';
import { useUserStore } from '@/stores/user';
import { request, markConversationRead } from '@/services/api';
import Icon from '@/components/Icon';

/** 跨页待打开会话：联系客服等入口写入，消息页 onShow 时消费并打开聊天视图 */
export const PENDING_OPEN_CONV_KEY = 'mindpace_pending_open_conv';

interface Conversation {
  conv: { id: string; lastMessageAt: string };
  otherUser: { id: string; name: string | null; email: string | null } | null;
  unreadCount?: number;
}

interface ChatMsg {
  msg: { id: string; content: string; senderId: string; createdAt: string };
  sender: { id: string; name: string | null; email: string | null };
}

const AVATAR_COLORS = ['#9CB48A', '#C4A882', '#89B4C8', '#B8A86E', '#A89BC8', '#C8A889'];

function avatarColor(name: string): string {
  return AVATAR_COLORS[(name.charCodeAt(0) || 0) % AVATAR_COLORS.length];
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return '刚刚';
  if (min < 60) return `${min} 分钟前`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} 小时前`;
  const d = Math.floor(hr / 24);
  if (d < 7) return `${d} 天前`;
  const date = new Date(dateStr);
  return `${date.getMonth() + 1}月${date.getDate()}日`;
}

function fmtTime(s: string): string {
  const d = new Date(s);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function fmtDate(s: string): string {
  const d = new Date(s);
  const t = new Date();
  if (d.toDateString() === t.toDateString()) return '今天';
  const y = new Date(t);
  y.setDate(t.getDate() - 1);
  if (d.toDateString() === y.toDateString()) return '昨天';
  return `${d.getMonth() + 1}月${d.getDate()}日`;
}

function displayNameOf(u: { name?: string | null; email?: string | null } | null): string {
  return u?.name || u?.email?.split('@')[0] || '用户';
}

const MessagesPage: React.FC = () => {
  const { isLoggedIn, user } = useUserStore();
  // staff（admin/support）视角：服务端 GET /api/messages 已返回官方客服名下的共享会话
  const userDbRole = user?.role || user?.userType || user?.type || '';
  const isStaff = userDbRole === 'admin' || userDbRole === 'support';
  const pageTitle = userDbRole === 'support' ? '客户消息' : userDbRole === 'admin' ? '官方消息' : '消息';

  const [convs, setConvs] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeConv, setActiveConv] = useState<Conversation | null>(null);
  const [msgs, setMsgs] = useState<ChatMsg[]>([]);
  const [selfId, setSelfId] = useState('');
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [pageVisible, setPageVisible] = useState(true);

  const lastIncomingIdRef = useRef<string | null>(null);
  const initialLoadedRef = useRef(false);

  // 拉取会话列表（每项含 unreadCount，服务端已按角色返回可见会话）
  const loadConvs = useCallback(async () => {
    if (!isLoggedIn) {
      setConvs([]);
      setLoading(false);
      return;
    }
    try {
      const data = await request<Conversation[]>('/api/messages');
      setConvs(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('[Messages] 加载会话列表失败', err);
    } finally {
      setLoading(false);
    }
  }, [isLoggedIn]);

  // 拉取聊天记录；轮询发现新消息时自动标记已读并刷新底部红点
  const loadChat = useCallback(async (convId: string) => {
    if (!isLoggedIn) return;
    try {
      const data = await request<any>(`/api/messages/${convId}`);
      const msgList: ChatMsg[] = Array.isArray(data) ? data : data?.msgs || [];
      const mySelfId: string = data?.selfId || user?.id || '';
      setSelfId(mySelfId);
      if (data?.otherUser) {
        setActiveConv(prev => (prev && prev.conv.id === convId ? { ...prev, otherUser: data.otherUser } : prev));
      }
      const incoming = msgList.filter(m => m.msg.senderId !== mySelfId);
      const latest = incoming[incoming.length - 1];
      if (latest) {
        if (initialLoadedRef.current && latest.msg.id !== lastIncomingIdRef.current) {
          await markConversationRead(convId);
          Taro.eventCenter.trigger(UNREAD_REFRESH_EVENT);
        }
        lastIncomingIdRef.current = latest.msg.id;
      }
      initialLoadedRef.current = true;
      setMsgs(msgList);
    } catch (err) {
      console.error('[Messages] 加载聊天记录失败', err);
    }
  }, [isLoggedIn, user?.id]);

  // 打开会话：本地清零徽标 + 服务端标记已读 + 刷新底部红点 + 加载聊天记录
  const openConversation = useCallback(async (convId: string) => {
    setConvs(prev => prev.map(c => (c.conv.id === convId ? { ...c, unreadCount: 0 } : c)));
    setActiveConv({ conv: { id: convId, lastMessageAt: '' }, otherUser: null });
    setMsgs([]);
    setSelfId(user?.id || '');
    lastIncomingIdRef.current = null;
    initialLoadedRef.current = false;
    await markConversationRead(convId);
    Taro.eventCenter.trigger(UNREAD_REFRESH_EVENT);
    loadChat(convId);
  }, [loadChat, user?.id]);

  const closeChat = useCallback(() => {
    setActiveConv(null);
    setMsgs([]);
    lastIncomingIdRef.current = null;
    initialLoadedRef.current = false;
    Taro.setNavigationBarTitle({ title: pageTitle });
    loadConvs();
  }, [loadConvs, pageTitle]);

  useDidShow(() => {
    setPageVisible(true);
    loadConvs();
    // 消费其他页面（如联系客服）写入的待打开会话
    try {
      const pending = Taro.getStorageSync(PENDING_OPEN_CONV_KEY);
      if (pending) {
        Taro.removeStorageSync(PENDING_OPEN_CONV_KEY);
        openConversation(String(pending));
      }
    } catch (err) {
      console.error('[Messages] 读取待打开会话失败', err);
    }
  });

  // 页面隐藏（切到其他 tab）时暂停聊天轮询
  useDidHide(() => {
    setPageVisible(false);
  });

  // 登出时退出聊天视图
  useEffect(() => {
    if (!isLoggedIn && activeConv) {
      setActiveConv(null);
      setMsgs([]);
    }
  }, [isLoggedIn, activeConv]);

  // 聊天视图打开且页面可见时轮询新消息（5 秒，与 web 版一致）
  useEffect(() => {
    if (!activeConv || !pageVisible) return;
    const convId = activeConv.conv.id;
    const timer = setInterval(() => loadChat(convId), 5000);
    return () => clearInterval(timer);
  }, [activeConv, pageVisible, loadChat]);

  // 进入聊天视图时将导航栏标题设为对方名称
  const chatOther = activeConv?.otherUser
    ?? msgs.find(m => m.msg.senderId !== selfId)?.sender
    ?? null;
  const otherName = chatOther ? displayNameOf(chatOther) : '对话';

  useEffect(() => {
    if (activeConv && otherName !== '对话') {
      Taro.setNavigationBarTitle({ title: otherName });
    }
  }, [activeConv, otherName]);

  const handleSend = async () => {
    const content = input.trim();
    if (!content || sending || !activeConv) return;
    const convId = activeConv.conv.id;
    const myId = selfId || user?.id || '';
    const optId = `opt_${Date.now()}`;
    setInput('');
    setSending(true);
    // 乐观插入
    setMsgs(prev => [...prev, {
      msg: { id: optId, content, senderId: myId, createdAt: new Date().toISOString() },
      sender: { id: myId, name: user?.name ?? null, email: user?.email ?? null },
    }]);
    try {
      // 统一会话级发送（staff 非参与者时同样可用）
      // Taro.request.Option 类型要求 url 字段；request() 实际以第一个参数 path 为准
      const data = await request<ChatMsg>(`/api/messages/${convId}`, {
        url: `/api/messages/${convId}`,
        method: 'POST',
        data: { content }
      });
      if (data?.msg?.id) {
        setMsgs(prev => prev.map(m => (m.msg.id === optId ? data : m)));
      } else {
        loadChat(convId);
      }
    } catch (err) {
      console.error('[Messages] 发送消息失败', err);
      setMsgs(prev => prev.filter(m => m.msg.id !== optId));
      Taro.showToast({ title: '发送失败，请重试', icon: 'none' });
    } finally {
      setSending(false);
    }
  };

  // 聊天记录按日期分组
  const grouped: { date: string; items: ChatMsg[] }[] = [];
  msgs.forEach(m => {
    const d = fmtDate(m.msg.createdAt);
    const last = grouped[grouped.length - 1];
    if (!last || last.date !== d) grouped.push({ date: d, items: [m] });
    else last.items.push(m);
  });

  const renderEmpty = (title: string, desc: string, showLogin: boolean) => (
    <View className={styles.emptyWrap}>
      <View className={styles.emptyIcon}>
        <Icon name="message" size={36} color="#C4BDB5" />
      </View>
      <Text className={styles.emptyTitle}>{title}</Text>
      <Text className={styles.emptyDesc}>{desc}</Text>
      {showLogin && (
        <View
          className={styles.loginBtn}
          onClick={() => Taro.navigateTo({ url: '/pages/login/index' })}
        >
          <Text className={styles.loginBtnText}>去登录</Text>
        </View>
      )}
    </View>
  );

  const renderListView = () => (
    <>
      <View className={styles.header}>
        <Text className={styles.headerTitle}>{pageTitle}</Text>
        {isStaff && <Text className={styles.headerSub}>官方客服会话（团队共享）</Text>}
      </View>

      {loading ? (
        <View className={styles.loadingWrap}>
          <Text className={styles.loadingText}>加载中…</Text>
        </View>
      ) : convs.length === 0 ? (
        renderEmpty('暂无消息', '完成预约后可与咨询师沟通', false)
      ) : (
        <View className={styles.convList}>
          {convs.map(c => {
            if (!c.otherUser) return null;
            const name = displayNameOf(c.otherUser);
            const unread = c.unreadCount || 0;
            return (
              <View key={c.conv.id} className={styles.convItem} onClick={() => openConversation(c.conv.id)}>
                <View className={styles.convAvatar} style={{ background: avatarColor(name) }}>
                  <Text className={styles.convAvatarText}>{name.slice(0, 1)}</Text>
                </View>
                <View className={styles.convInfo}>
                  <View className={styles.convTopRow}>
                    <Text className={styles.convName}>{name}</Text>
                    <Text className={styles.convTime}>{timeAgo(c.conv.lastMessageAt)}</Text>
                  </View>
                  <Text className={styles.convPreview}>点击查看对话</Text>
                </View>
                {unread > 0 ? (
                  <View className={styles.convBadge}>
                    <Text className={styles.convBadgeText}>{unread > 99 ? '99+' : unread}</Text>
                  </View>
                ) : (
                  <Icon name="chevronRight" size={14} color="#C4BDB5" />
                )}
              </View>
            );
          })}
        </View>
      )}
    </>
  );

  const renderChatView = () => (
    <View className={styles.chatWrap}>
      {/* 聊天顶栏 */}
      <View className={styles.chatHeader}>
        <View className={styles.chatBack} onClick={closeChat}>
          <Icon name="chevronLeft" size={20} color="#5A4E44" />
        </View>
        <View className={styles.chatAvatar} style={{ background: avatarColor(otherName) }}>
          <Text className={styles.chatAvatarText}>{otherName.slice(0, 1)}</Text>
        </View>
        <View className={styles.chatHeaderInfo}>
          <Text className={styles.chatName}>{otherName}</Text>
          <Text className={styles.chatSub}>{isStaff ? '官方客服会话' : '私信对话'}</Text>
        </View>
      </View>

      {/* 消息列表 */}
      <ScrollView scrollY className={styles.chatScroll} scrollIntoView={`anchor-${msgs.length}`}>
        {msgs.length === 0 && (
          <View className={styles.chatEmpty}>
            <Text className={styles.chatEmptyText}>开始你们的第一条消息吧</Text>
          </View>
        )}
        {grouped.map(g => (
          <View key={g.date}>
            <View className={styles.dateDivider}>
              <View className={styles.dateLine} />
              <Text className={styles.dateText}>{g.date}</Text>
              <View className={styles.dateLine} />
            </View>
            {g.items.map(m => {
              const mine = m.msg.senderId === selfId;
              const name = displayNameOf(m.sender);
              return (
                <View key={m.msg.id} className={`${styles.msgRow} ${mine ? styles.msgRowMine : ''}`}>
                  {!mine && (
                    <View className={styles.msgAvatar} style={{ background: avatarColor(name) }}>
                      <Text className={styles.msgAvatarText}>{name.slice(0, 1)}</Text>
                    </View>
                  )}
                  <View className={styles.msgCol}>
                    <View className={`${styles.msgBubble} ${mine ? styles.msgBubbleMine : ''}`}>
                      <Text className={`${styles.msgContent} ${mine ? styles.msgContentMine : ''}`}>{m.msg.content}</Text>
                    </View>
                    <Text className={styles.msgTime}>{fmtTime(m.msg.createdAt)}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        ))}
        <View id={`anchor-${msgs.length}`} />
      </ScrollView>

      {/* 输入栏 */}
      <View className={styles.chatInputBar}>
        <Input
          className={styles.chatInput}
          value={input}
          placeholder="说点什么…"
          placeholderClass={styles.chatInputPlaceholder}
          onInput={e => setInput(e.detail.value)}
          confirmType="send"
          onConfirm={handleSend}
        />
        <View
          className={`${styles.sendBtn} ${input.trim() ? styles.sendBtnActive : ''}`}
          onClick={handleSend}
        >
          <Icon name="send" size={18} color="#FFFFFF" />
        </View>
      </View>
    </View>
  );

  return (
    <View className={styles.container}>
      {!isLoggedIn ? (
        renderEmpty('请先登录查看消息', '登录后可与咨询师沟通', true)
      ) : activeConv ? (
        renderChatView()
      ) : (
        renderListView()
      )}
      <CustomTabBar />
    </View>
  );
};

export default MessagesPage;
