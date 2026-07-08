import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Textarea, Button } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import styles from './index.module.scss';
import { fetchCounselorDetail } from '@/services/api';
import type { Counselor } from '@/types/counselor';

const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
const timeSlots = ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '19:00', '20:00'];

const BookingFlowPage: React.FC = () => {
  const router = useRouter();
  const [counselor, setCounselor] = useState<Counselor | null>(null);
  const [dates, setDates] = useState<Date[]>([]);
  const [selectedDateIndex, setSelectedDateIndex] = useState(0);
  const [selectedTime, setSelectedTime] = useState('');
  const [note, setNote] = useState('');

  useEffect(() => {
    const { id } = router.params || {};
    if (id) {
      fetchCounselorDetail(id).then(data => {
        setCounselor(data);
      }).catch(err => {
        console.error('[BookingFlow] 加载咨询师失败', err);
      });
    }

    const nextDates: Date[] = [];
    const today = new Date();
    for (let i = 0; i < 7; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      nextDates.push(d);
    }
    setDates(nextDates);
  }, [router.params]);

  const handleSubmit = () => {
    if (!selectedTime || !counselor) {
      Taro.showToast({ title: '请选择时间', icon: 'none' });
      return;
    }
    Taro.showToast({ title: '预约申请已提交', icon: 'success' });
    setTimeout(() => {
      Taro.redirectTo({ url: '/pages/bookings/index' });
    }, 1200);
  };

  return (
    <View className={styles.container}>
      <View className={styles.header}>
        <View className={styles.stepIndicator}>
          <View className={`${styles.step} ${styles.stepActive}`}>
            <Text className={styles.stepText}>1</Text>
          </View>
          <View className={styles.stepLine} />
          <View className={`${styles.step} ${styles.stepActive}`}>
            <Text className={styles.stepText}>2</Text>
          </View>
          <View className={styles.stepLine} />
          <View className={styles.step}>
            <Text className={styles.stepText}>3</Text>
          </View>
        </View>
      </View>

      <View className={styles.section}>
        <View className={styles.sectionCard}>
          <Text className={styles.sectionTitle}>选择日期</Text>
          <ScrollView scrollX className={styles.dateList}>
            {dates.map((date, idx) => (
              <View
                key={idx}
                className={`${styles.dateItem} ${selectedDateIndex === idx ? styles.dateActive : ''}`}
                onClick={() => setSelectedDateIndex(idx)}
              >
                <Text className={styles.dateWeek}>{weekDays[date.getDay()]}</Text>
                <Text className={styles.dateDay}>{date.getDate()}</Text>
              </View>
            ))}
          </ScrollView>
        </View>
      </View>

      <View className={styles.section}>
        <View className={styles.sectionCard}>
          <Text className={styles.sectionTitle}>选择时间</Text>
          <View className={styles.timeGrid}>
            {timeSlots.map(time => (
              <View
                key={time}
                className={`${styles.timeItem} ${selectedTime === time ? styles.timeActive : ''}`}
                onClick={() => setSelectedTime(time)}
              >
                <Text className={styles.timeText}>{time}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      <View className={styles.section}>
        <View className={styles.sectionCard}>
          <Text className={styles.sectionTitle}>预约备注</Text>
          <Textarea
            className={styles.textarea}
            placeholder="简单描述你想咨询的内容，方便咨询师提前了解"
            placeholderClass={styles.placeholder}
            value={note}
            onInput={e => setNote(e.detail.value)}
          />
        </View>
      </View>

      <View className={styles.bottomBar}>
        <View className={styles.priceInfo}>
          <Text className={styles.price}>¥{counselor?.pricePerSession || '--'}</Text>
          <Text className={styles.priceUnit}>/次</Text>
        </View>
        <Button
          className={`${styles.submitButton} ${!selectedTime ? styles.submitButtonDisabled : ''}`}
          onClick={handleSubmit}
        >
          提交预约
        </Button>
      </View>
    </View>
  );
};

export default BookingFlowPage;
