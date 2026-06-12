import { View, Text, ScrollView } from '@tarojs/components'
import './index.scss'

const WEEKDAY = ['一', '二', '三', '四', '五', '六', '日']
const HOURS = Array.from({ length: 11 }, (_, i) => i + 8) // 8-18点

// 模拟档期规则展示
const MOCK_RULES = [
  { day: '周一', slots: ['09:00', '14:00', '16:00'] },
  { day: '周三', slots: ['10:00', '15:00'] },
  { day: '周五', slots: ['09:00', '11:00', '14:00'] },
]

export default function CounselorSchedulePage() {
  return (
    <ScrollView scrollY className='schedule-page'>
      <View className='section-card'>
        <Text className='section-title'>本周可用时段</Text>
        <Text className='section-sub'>来访者可在这些时段预约你</Text>

        {MOCK_RULES.map(rule => (
          <View key={rule.day} className='rule-row'>
            <Text className='rule-day'>{rule.day}</Text>
            <View className='rule-slots'>
              {rule.slots.map(slot => (
                <View key={slot} className='rule-slot'>
                  <Text className='slot-text'>{slot}</Text>
                </View>
              ))}
            </View>
          </View>
        ))}

        <View className='add-rule-btn'>
          <Text className='add-rule-text'>+ 添加时段规则</Text>
        </View>
      </View>

      <View className='section-card'>
        <Text className='section-title'>循环规则</Text>
        <Text className='section-sub'>每周固定重复，无需手动更新</Text>
        <View className='rule-tags'>
          {WEEKDAY.map((d, i) => (
            <View key={d} className={`day-chip ${i < 5 ? 'active' : ''}`}>
              <Text className='day-chip-text'>{d}</Text>
            </View>
          ))}
        </View>
      </View>

      <View className='tip-card'>
        <Text className='tip-text'>💡 完整档期管理功能可在电脑端或 Eazo 版本中设置</Text>
      </View>
    </ScrollView>
  )
}
