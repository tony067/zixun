import React, { useState } from 'react';
import { View, Text, Button, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import Icon from '@/components/Icon';

const SECTIONS = [
  { icon: 'book', title: '什么是心理咨询？', short: '一个安全、保密的空间，帮助你了解自己。', content: `心理咨询是一个安全、保密的空间，由经过专业训练的咨询师陪伴你探索内心、处理困扰。

它不是「聊天」，也不是「被教导」，而是帮助你更了解自己、找到属于自己的方式。

咨询关系是平等的——你始终是自己生命的专家，咨询师的作用是陪伴和引导，而不是替你做决定。` },
  { icon: 'users', title: '神经多样性是什么？', short: 'ADHD、ASD 等不是「病」，而是不同的大脑方式。', content: `神经多样性（Neurodiversity）指的是人类大脑和神经系统的自然多样性，包括 ADHD、ASD（自闭症谱系）、读写障碍等。

这些不是「病」，而是不同的认知和感知方式。神经多样性人群往往有独特的优势——专注力、创造力、模式识别能力——同时在某些环境中也面临额外的挑战。

MindPace 专注于为神经多样性人群提供真正「懂你大脑」的支持。` },
  { icon: 'user', title: '如何选择适合的咨询师？', short: '关注擅长领域、咨询方式和「合不合得来」。', content: `选择咨询师时，你可以关注这几点：

① 擅长领域：咨询师的专长是否和你的困扰匹配？
② 咨询方式：视频还是面对面？哪种让你感觉更舒适？
③ 价格：是否在你的预算范围内？
④ 「感觉对了」：第一次咨询结束后，你有没有感觉被听见？` },
  { icon: 'heart', title: '第一次咨询会发生什么？', short: '初始访谈，不需要准备太多，放松就好。', content: `第一次通常是「初始访谈」——咨询师会了解你来访的原因、背景和期望。

你不需要准备很多，放松地说说自己的情况就好——哪怕只是「我也不知道从哪里说起」，这本身就是一个很好的开始。` },
  { icon: 'clock', title: '咨询的频率和周期？', short: '通常每1-2周一次，没有固定标准。', content: `大多数咨询每 1-2 周进行一次，每次 50-60 分钟。

短期目标性咨询通常 6-12 次；长期深度工作可能持续一年以上。没有「应该做多久」的标准——完全由你和咨询师共同决定。` },
  { icon: 'shield', title: '关于保密原则', short: '咨询内容受保密保护，有限例外请了解。', content: `咨询内容受严格保密保护。除以下有限情形外，咨询师不会向任何第三方透露：

• 你有伤害自己或他人的紧迫风险
• 涉及未成年人保护的法定报告义务
• 法院要求披露` },
  { icon: 'list', title: '预约和取消政策', short: '请提前 24 小时取消，避免产生费用。', content: `请至少提前 24 小时取消或改期，否则可能按全额或部分收费。

具体政策以各咨询师的说明为准，可在其主页「咨询设置」板块查看。` },
];

const GuidePage: React.FC = () => {
  const [open, setOpen] = useState<number | null>(null);

  const toggleSection = (index: number) => {
    setOpen(open === index ? null : index);
  };

  return (
    <View className={styles.container}>
      <View className={styles.header}>
        <View className={styles.backButton} onClick={() => Taro.navigateBack()}>
          <Text className={styles.backIcon}>‹</Text>
        </View>
        <Text className={styles.headerTitle}>新手必读</Text>
      </View>

      <ScrollView scrollY className={styles.scrollContent}>
        <View className={styles.banner}>
          <Text className={styles.bannerTitle}>在这里，你的节奏就是对的节奏</Text>
          <Text className={styles.bannerDesc}>了解咨询流程，找到适合自己的支持。</Text>
        </View>

        <View className={styles.sectionList}>
          {SECTIONS.map((s, i) => (
            <View key={i} className={styles.sectionItem}>
              <View className={styles.sectionHeader} onClick={() => toggleSection(i)}>
                <View className={styles.sectionLeft}>
                  <Icon name={s.icon as any} size={24} color="#9CB48A" />
                  <Text className={styles.sectionTitle}>{s.title}</Text>
                  {open !== i && <Text className={styles.sectionShort}>{s.short}</Text>}
                </View>
                <Icon name={open === i ? 'chevronDown' : 'chevronRight'} size={20} color="#C2BDB7" />
              </View>
              {open === i && (
                <View className={styles.sectionContent}>
                  <Text className={styles.sectionText}>{s.content}</Text>
                </View>
              )}
            </View>
          ))}
        </View>

        <View className={styles.actionSection}>
          <Button className={styles.actionButton} onClick={() => Taro.navigateTo({ url: '/pages/index/index' })}>
            浏览咨询师
          </Button>
          <Text className={styles.hintText}>有更多问题？可以在预约时直接向咨询师提问。</Text>
        </View>
      </ScrollView>
    </View>
  );
};

export default GuidePage;