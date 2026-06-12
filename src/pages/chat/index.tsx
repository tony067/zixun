import { useState, useEffect, useRef } from 'react'
import Taro, { useRouter } from '@tarojs/taro'
import { View, Text, ScrollView, Input, Image } from '@tarojs/components'
import { getConversations, getMessages, sendMessage, type Conversation, type Message } from '../../api'
import { useAuthStore } from '../../store/authStore'
import './index.scss'

// 会话列表页
function ConversationList() {
  const [list, setList] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getConversations()
      .then(d => setList(Array.isArray(d) ? d : []))
      .catch(() => setList([]))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <View className='loading'><Text>加载中…</Text></View>

  if (list.length === 0) {
    return (
      <View className='empty-state'>
        <Text className='empty-icon'>💬</Text>
        <Text className='empty-text'>暂无消息</Text>
        <Text className='empty-sub'>与咨询师预约后可在此私信沟通</Text>
      </View>
    )
  }

  return (
    <ScrollView scrollY className='conv-list'>
      {list.map(conv => (
        <View
          key={conv.id}
          className='conv-item'
          onClick={() => Taro.navigateTo({ url: `/pages/chat/index?convId=${conv.id}` })}
        >
          <View className='conv-avatar'>
            {conv.otherUser.avatarUrl
              ? <Image src={conv.otherUser.avatarUrl} className='avatar-img' mode='aspectFill' />
              : (
                <View className='avatar-placeholder'>
                  <Text className='avatar-initial'>{conv.otherUser.displayName?.[0] || '咨'}</Text>
                </View>
              )
            }
            {conv.unreadCount > 0 && (
              <View className='unread-badge'>
                <Text className='unread-num'>{conv.unreadCount > 99 ? '99+' : conv.unreadCount}</Text>
              </View>
            )}
          </View>
          <View className='conv-info'>
            <View className='conv-top'>
              <Text className='conv-name'>{conv.otherUser.displayName}</Text>
              {conv.lastMessage && (
                <Text className='conv-time'>
                  {new Date(conv.lastMessage.createdAt).toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' })}
                </Text>
              )}
            </View>
            <Text className='conv-preview' numberOfLines={1}>
              {conv.lastMessage?.content || '暂无消息'}
            </Text>
          </View>
        </View>
      ))}
    </ScrollView>
  )
}

// 聊天详情页
function ChatDetail({ convId }: { convId: string }) {
  const user = useAuthStore(s => s.user)
  const [msgs, setMsgs] = useState<Message[]>([])
  const [text, setText] = useState('')
  const [otherName, setOtherName] = useState('咨询师')
  const [sending, setSending] = useState(false)
  const scrollRef = useRef<any>(null)

  async function load() {
    try {
      const data = await getMessages(convId)
      setMsgs(Array.isArray(data) ? data : [])
    } catch {}
  }

  useEffect(() => { load() }, [convId])

  async function handleSend() {
    if (!text.trim() || sending) return
    setSending(true)
    const content = text.trim()
    setText('')
    try {
      const msg = await sendMessage(convId, content)
      setMsgs(prev => [...prev, msg])
    } catch {
      Taro.showToast({ title: '发送失败', icon: 'none' })
      setText(content)
    } finally {
      setSending(false)
    }
  }

  const myId = user?.id

  return (
    <View className='chat-detail'>
      <ScrollView scrollY className='msg-list' scrollWithAnimation>
        {msgs.map(msg => {
          const isMine = msg.senderId === myId
          return (
            <View key={msg.id} className={`msg-row ${isMine ? 'mine' : 'theirs'}`}>
              {!isMine && (
                <View className='msg-avatar'>
                  <Text className='msg-initial'>{otherName?.[0] || '咨'}</Text>
                </View>
              )}
              <View className={`bubble ${isMine ? 'bubble-mine' : 'bubble-theirs'}`}>
                <Text className='bubble-text'>{msg.content}</Text>
              </View>
            </View>
          )
        })}
        <View className='msg-bottom' />
      </ScrollView>

      <View className='input-bar'>
        <Input
          className='chat-input'
          placeholder='输入消息…'
          placeholderStyle='color:#C2BDB7'
          value={text}
          onInput={e => setText(e.detail.value)}
          onConfirm={handleSend}
          confirmType='send'
          adjustPosition
        />
        <View
          className={`send-btn ${text.trim() ? 'active' : ''}`}
          onClick={handleSend}
        >
          <Text className='send-icon'>➤</Text>
        </View>
      </View>
    </View>
  )
}

export default function ChatPage() {
  const router = useRouter()
  const { convId } = router.params

  if (convId) {
    return <ChatDetail convId={convId} />
  }
  return <ConversationList />
}
