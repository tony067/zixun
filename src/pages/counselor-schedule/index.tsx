import React, { useState } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import { useUserStore } from '@/stores/user';
import CustomTabBar from '@/custom-tab-bar';

const CounselorSchedulePage: React.FC = () => {
  const { currentRole } = useUserStore();
  const [selectedDay, setSelectedDay] = useState(0);
  
  const days = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
  
  const schedule: Record<string, Array<{ time: string; available: boolean }>> = {
    '周一': [
      { time: '09:00-09:50', available: true },
      { time: '10:00-10:50', available: false },
      { time: '14:00-14:50', available: true },
      { time: '15:00-15:50', available: true },
      { time: '16:00-16:50', available: false },
      { time: '19:00-19:50', available: true },
    ],
    '周二': [
      { time: '10:00-10:50', available: true },
      { time: '11:00-11:50', available: true },
      { time: '14:00-14:50', available: false },
      { time: '15:00-15:50', available: true },
      { time: '19:00-19:50', available: true },
      { time: '20:00-20:50', available: false },
    ],
    '周三': [
      { time: '09:00-09:50', available: false },
      { time: '10:00-10:50', available: true },
      { time: '14:00-14:50', available: true },
      { time: '15:00-15:50', available: false },
      { time: '16:00-16:50', available: true },
    ],
    '周四': [
      { time: '10:00-10:50', available: true },
      { time: '11:00-11:50', available: false },
      { time: '14:00-14:50', available: true },
      { time: '15:00-15:50', available: true },
      { time: '19:00-19:50', available: false },
    ],
    '周五': [
      { time: '09:00-09:50', available: true },
      { time: '10:00-10:50', available: true },
      { time: '14:00-14:50', available: false },
      { time: '15:00-15:50', available: true },
      { time: '16:00-16:50', available: true },
      { time: '19:00-19:50', available: true },
    ],
    '周六': [
      { time: '10:00-10:50', available: true },
      { time: '11:00-11:50', available: true },
      { time: '14:00-14:50', available: true },
      { time: '15:00-15:50', available: false },
      { time: '16:00-16:50', available: true },
    ],
    '周日': [
      { time: '10:00-10:50', available: false },
      { time: '14:00-14:50', available: true },
      { time: '15:00-15:50', available: true },
    ],
  };

  const handleTimeToggle = (day: string, time: string) => {
    Taro.showToast({ title: '档期管理功能开发中', icon: 'none' });
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

  const currentDaySchedule = schedule[days[selectedDay]] || [];

  return (
    <View className={styles.container}>
      <View className={styles.header}>
        <Text className={styles.title}>档期管理</Text>
      </View>
      
      <View className={styles.daySelector}>
        {days.map((day, index) => (
          <View
            key={day}
            className={`${styles.dayItem} ${selectedDay === index ? styles.dayActive : ''}`}
            onClick={() => setSelectedDay(index)}
          >
            <Text className={styles.dayText}>{day}</Text>
          </View>
        ))}
      </View>
      
      <ScrollView className={styles.scrollContent} scrollY>
        <View className={styles.timeList}>
          {currentDaySchedule.map((slot, index) => (
            <View
              key={index}
              className={`${styles.timeItem} ${slot.available ? styles.timeAvailable : styles.timeUnavailable}`}
              onClick={() => handleTimeToggle(days[selectedDay], slot.time)}
            >
              <Text className={styles.timeText}>{slot.time}</Text>
              <Text className={styles.timeStatus}>
                {slot.available ? '可预约' : '已预约'}
              </Text>
            </View>
          ))}
        </View>
        
        <View className={styles.tips}>
          <Text className={styles.tipsText}>点击时间段可切换预约状态</Text>
        </View>
      </ScrollView>
      <CustomTabBar />
    </View>
  );
};

export default CounselorSchedulePage;