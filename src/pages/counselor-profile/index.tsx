import React, { useState, useEffect } from 'react';
import { View, Text, Input, Textarea, Image, Picker } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import { useUserStore } from '@/stores/user';
import CustomTabBar from '@/components/TabBar';
import Icon from '@/components/Icon';
import { request, resolveAssetUrl } from '@/services/api';

// ============ 类型（字段名与 web 版 /api/counselor/profile 完全一致） ============

interface ListItem {
  id: string;
  value: string;
}

interface PricingOption {
  id: string;
  name: string;
  customName?: string;
  duration: number;
  price: number;
  sessions: number;
}

interface ProfileForm {
  reviewStatus: string;
  reviewNote: string;
  isAccepting: boolean;
  avatarUrl: string;
  displayName: string;
  counselorTypes: string[];
  isSupervisor: boolean;
  location: string;
  totalHours: string;
  bio: string;
  tagline: string;
  specialties: string[];
  customSpecialties: string[];
  workingGroups: string[];
  customWorkingGroups: string[];
  approaches: string[];
  customApproaches: string[];
  sessionDuration: number;
  pricePerSession: string;
  currency: string;
  pricingOptions: PricingOption[];
  sessionModes: string[];
  languages: string[];
  sessionSettings: string;
  qualifications: ListItem[];
  education: ListItem[];
  trainings: ListItem[];
  workExperiences: ListItem[];
  sessionDescription: string;
}

// ============ 常量（与 web 版 standalone 保持一致） ============

// 与 services/api.ts 相同的 API_BASE 逻辑（头像上传 Taro.uploadFile 需要完整地址）
const API_BASE =
  process.env.TARO_ENV === 'weapp' || process.env.NODE_ENV !== 'development'
    ? 'http://123.207.40.7:3001'
    : '';

const DRAFT_KEY = 'counselor_profile_draft';

const EMPTY_FORM: ProfileForm = {
  reviewStatus: 'draft',
  reviewNote: '',
  isAccepting: false,
  avatarUrl: '',
  displayName: '',
  counselorTypes: [],
  isSupervisor: false,
  location: '',
  totalHours: '',
  bio: '',
  tagline: '',
  specialties: [],
  customSpecialties: [],
  workingGroups: [],
  customWorkingGroups: [],
  approaches: [],
  customApproaches: [],
  sessionDuration: 50,
  pricePerSession: '',
  currency: 'CNY',
  pricingOptions: [],
  sessionModes: [],
  languages: [],
  sessionSettings: '',
  qualifications: [],
  education: [],
  trainings: [],
  workExperiences: [],
  sessionDescription: '',
};

const STATUS_LABEL: Record<string, { text: string; color: string; bg: string }> = {
  draft: { text: '草稿', color: '#9B8E82', bg: '#F0EDE8' },
  submitted: { text: '审核中', color: '#C66B2E', bg: '#FAE9DD' },
  pending: { text: '审核中', color: '#C66B2E', bg: '#FAE9DD' },
  approved: { text: '已通过', color: '#3A6228', bg: '#E4F0DC' },
  rejected: { text: '已退回', color: '#DC2626', bg: '#FEE2E2' },
};

const COUNSELOR_TYPE_OPTIONS = [
  { id: '心理咨询师', desc: '持有心理咨询师资质，提供心理咨询服务' },
  { id: 'ADHD教练', desc: '专业 ADHD 教练，侧重执行功能与行为策略' },
  { id: '特教老师', desc: '特殊教育背景，专注儿童/青少年评估与干预' },
];

const SPECIALTY_OPTIONS = [
  'ADHD', 'ASD', '情绪问题', '睡眠问题', '感官敏感', '创伤', '读写障碍',
  '女性成长', '人际关系', '职场困境', '儿童/青少年', '家长支持', '性议题',
  'ADHD教练', '特教老师',
];

const WORKING_GROUP_OPTIONS = [
  '成人ADHD', '成人ASD', '儿童/青少年ADHD', '儿童/青少年ASD',
  '高功能', '性多元人群', '孕产', '家长支持',
];

const APPROACH_OPTIONS = [
  '认知行为疗法(CBT)', '辩证行为疗法(DBT)', '接纳承诺疗法(ACT)', '精神动力学',
  '人本主义', '正念疗法', '叙事疗法', '家庭系统疗法', 'EMDR', '沙盘疗法',
  '心理教育', '行为激活', '执行功能教练', '特殊教育支持',
];

const LANGUAGE_OPTIONS = ['普通话', '粤语', '英语', '闽南语', '上海话'];

const SESSION_MODE_OPTIONS = ['视频咨询', '语音咨询', '面对面咨询', '文字咨询'];

const PRICING_NAME_OPTIONS = ['个体咨询', '团体/家庭咨询', '教练套餐', '自定义...'];
const PRICING_NAME_CUSTOM = '__custom__';

// 省市区级联数据（与 web 版 PROVINCE_CITY_MAP 一致，location 存城市名）
const PROVINCE_CITY_MAP: Record<string, string[]> = {
  '北京': ['东城区', '西城区', '朝阳区', '丰台区', '石景山区', '海淀区', '顺义区', '通州区', '大兴区', '房山区', '门头沟区', '昌平区', '平谷区', '密云区', '怀柔区', '延庆区'],
  '天津': ['和平区', '河东区', '河西区', '南开区', '河北区', '红桥区', '东丽区', '西青区', '津南区', '北辰区', '武清区', '宝坻区', '滨海新区', '宁河区', '静海区', '蓟州区'],
  '上海': ['黄浦区', '徐汇区', '长宁区', '静安区', '普陀区', '虹口区', '杨浦区', '闵行区', '宝山区', '嘉定区', '浦东新区', '金山区', '松江区', '青浦区', '奉贤区', '崇明区'],
  '重庆': ['渝中区', '大渡口区', '江北区', '沙坪坝区', '九龙坡区', '南岸区', '北碚区', '渝北区', '巴南区', '涪陵区', '黔江区', '长寿区', '江津区', '合川区', '永川区'],
  '河北': ['石家庄', '唐山', '秦皇岛', '邯郸', '邢台', '保定', '张家口', '承德', '沧州', '廊坊', '衡水'],
  '山西': ['太原', '大同', '阳泉', '长治', '晋城', '朔州', '晋中', '运城', '忻州', '临汾', '吕梁'],
  '辽宁': ['沈阳', '大连', '鞍山', '抚顺', '本溪', '丹东', '锦州', '营口', '阜新', '辽阳', '盘锦', '铁岭', '朝阳', '葫芦岛'],
  '吉林': ['长春', '吉林', '四平', '辽源', '通化', '白山', '松原', '白城', '延边'],
  '黑龙江': ['哈尔滨', '齐齐哈尔', '牡丹江', '佳木斯', '大庆', '鸡西', '伊春', '绥化', '黑河'],
  '江苏': ['南京', '无锡', '徐州', '常州', '苏州', '南通', '连云港', '淮安', '盐城', '扬州', '镇江', '泰州', '宿迁'],
  '浙江': ['杭州', '宁波', '温州', '嘉兴', '湖州', '绍兴', '金华', '衢州', '舟山', '台州', '丽水'],
  '安徽': ['合肥', '芜湖', '蚌埠', '淮南', '马鞍山', '淮北', '铜陵', '安庆', '黄山', '滁州', '阜阳', '宿州', '六安', '亳州'],
  '福建': ['福州', '厦门', '莆田', '三明', '泉州', '漳州', '南平', '龙岩', '宁德'],
  '江西': ['南昌', '景德镇', '萍乡', '九江', '新余', '鹰潭', '赣州', '吉安', '宜春', '抚州', '上饶'],
  '山东': ['济南', '青岛', '淄博', '枣庄', '东营', '烟台', '潍坊', '济宁', '泰安', '威海', '日照', '临沂', '德州', '聊城', '菏泽'],
  '河南': ['郑州', '开封', '洛阳', '平顶山', '安阳', '鹤壁', '新乡', '焦作', '濮阳', '许昌', '漯河', '南阳', '商丘', '信阳', '驻马店'],
  '湖北': ['武汉', '黄石', '十堰', '宜昌', '襄阳', '鄂州', '荆门', '孝感', '荆州', '黄冈', '咸宁', '随州', '恩施'],
  '湖南': ['长沙', '株洲', '湘潭', '衡阳', '邵阳', '岳阳', '常德', '张家界', '益阳', '郴州', '永州', '怀化', '娄底', '湘西'],
  '广东': ['广州', '深圳', '珠海', '汕头', '佛山', '韶关', '湛江', '肇庆', '江门', '茂名', '惠州', '梅州', '汕尾', '河源', '阳江', '清远', '东莞', '中山', '潮州', '揭阳', '云浮'],
  '海南': ['海口', '三亚', '三沙', '儋州'],
  '四川': ['成都', '自贡', '攀枝花', '泸州', '德阳', '绵阳', '广元', '遂宁', '内江', '乐山', '南充', '眉山', '宜宾', '广安', '达州', '雅安'],
  '贵州': ['贵阳', '六盘水', '遵义', '安顺', '毕节', '铜仁', '黔西南', '黔东南', '黔南'],
  '云南': ['昆明', '曲靖', '玉溪', '保山', '昭通', '丽江', '普洱', '临沧', '楚雄', '红河', '文山', '西双版纳', '大理', '德宏', '怒江', '迪庆'],
  '陕西': ['西安', '铜川', '宝鸡', '咸阳', '渭南', '延安', '汉中', '榆林', '安康', '商洛'],
  '甘肃': ['兰州', '嘉峪关', '金昌', '白银', '天水', '武威', '张掖', '平凉', '酒泉', '庆阳', '定西', '陇南', '临夏', '甘南'],
  '青海': ['西宁', '海东', '海北', '黄南', '果洛', '玉树', '海西'],
  '广西': ['南宁', '柳州', '桂林', '梧州', '北海', '防城港', '钦州', '贵港', '玉林', '百色', '贺州', '河池', '来宾', '崇左'],
  '内蒙古': ['呼和浩特', '包头', '乌海', '赤峰', '通辽', '鄂尔多斯', '呼伦贝尔', '巴彦淖尔', '乌兰察布'],
  '西藏': ['拉萨', '日喀则', '昌都', '林芝', '山南', '那曲', '阿里'],
  '宁夏': ['银川', '石嘴山', '吴忠', '固原', '中卫'],
  '新疆': ['乌鲁木齐', '克拉玛依', '吐鲁番', '哈密', '昌吉', '博尔塔拉', '巴音郭楞', '阿克苏', '克孜勒苏', '喀什', '和田', '伊犁', '塔城', '阿勒泰'],
  '香港': ['香港'],
  '澳门': ['澳门'],
  '台湾': ['台北', '台中', '高雄', '台南', '新竹'],
};

const PROVINCE_OPTIONS = Object.keys(PROVINCE_CITY_MAP);

function findProvinceByCity(city: string): string {
  for (const [prov, cities] of Object.entries(PROVINCE_CITY_MAP)) {
    if (cities.some((c) => city.includes(c) || c.includes(city))) return prov;
  }
  return '';
}

// ============ 工具函数 ============

const genId = (prefix: string) => `${prefix}_${Date.now()}_${Math.floor(Math.random() * 10000)}`;

const numStr = (n: number) => (n ? String(n) : '');

const toStrArray = (v: unknown): string[] => (Array.isArray(v) ? (v as string[]).filter((x) => typeof x === 'string') : []);

const normalizeListItems = (v: unknown): ListItem[] => {
  if (!Array.isArray(v)) return [];
  return v
    .map((x, i): ListItem => {
      if (typeof x === 'string') return { id: genId('li'), value: x };
      const obj = x as { id?: string; value?: string };
      return { id: obj.id ?? `li_${i}`, value: typeof obj.value === 'string' ? obj.value : '' };
    })
    .filter((x) => x.value);
};

const normalizePricing = (v: unknown): PricingOption[] => {
  let arr: unknown = v;
  if (typeof arr === 'string') {
    try {
      arr = JSON.parse(arr);
    } catch {
      arr = [];
    }
  }
  if (!Array.isArray(arr)) return [];
  return (arr as Record<string, unknown>[]).map((o, i) => ({
    id: typeof o.id === 'string' ? o.id : `po_${i}`,
    name: typeof o.name === 'string' ? o.name : '',
    customName: typeof o.customName === 'string' ? o.customName : '',
    duration: Number(o.duration) || 0,
    price: Number(o.price) || 0,
    sessions: Number(o.sessions) || 0,
  }));
};

const normalizeProfile = (p: Record<string, unknown>): ProfileForm => ({
  ...EMPTY_FORM,
  reviewStatus: typeof p.reviewStatus === 'string' ? p.reviewStatus : 'draft',
  reviewNote: typeof p.reviewNote === 'string' ? p.reviewNote : '',
  isAccepting: p.isAccepting === true || p.isAccepting === 'true',
  avatarUrl: typeof p.avatarUrl === 'string' ? p.avatarUrl : '',
  displayName: typeof p.displayName === 'string' ? p.displayName : '',
  counselorTypes: toStrArray(p.counselorTypes),
  isSupervisor: p.isSupervisor === true,
  location: typeof p.location === 'string' ? p.location : '',
  totalHours: p.totalHours ? String(p.totalHours) : '',
  bio: typeof p.bio === 'string' ? p.bio : '',
  tagline: typeof p.tagline === 'string' ? p.tagline : '',
  specialties: toStrArray(p.specialties),
  customSpecialties: toStrArray(p.customSpecialties),
  workingGroups: toStrArray(p.workingGroups),
  customWorkingGroups: toStrArray(p.customWorkingGroups),
  approaches: toStrArray(p.approaches),
  customApproaches: toStrArray(p.customApproaches),
  sessionDuration: Number(p.sessionDuration) || 50,
  pricePerSession: p.pricePerSession ? String(p.pricePerSession) : '',
  currency: typeof p.currency === 'string' ? p.currency : 'CNY',
  pricingOptions: normalizePricing(p.pricingOptions),
  sessionModes: toStrArray(p.sessionModes),
  languages: toStrArray(p.languages),
  sessionSettings: typeof p.sessionSettings === 'string' ? p.sessionSettings : '',
  qualifications: normalizeListItems(p.qualifications),
  education: normalizeListItems(p.education),
  trainings: normalizeListItems(p.trainings),
  workExperiences: normalizeListItems(p.workExperiences),
  sessionDescription: typeof p.sessionDescription === 'string' ? p.sessionDescription : '',
});

// 各分组是否已填写完成（与 web 版 sectionDone 一致）
function sectionDone(key: string, f: ProfileForm): boolean {
  switch (key) {
    case 'basic':
      return !!(f.displayName && f.counselorTypes.length > 0);
    case 'tagline':
      return !!f.tagline;
    case 'specialties':
      return f.specialties.length > 0;
    case 'workingGroups':
      return f.workingGroups.length > 0;
    case 'approaches':
      return f.approaches.length > 0;
    case 'settings':
      return f.sessionModes.length > 0 && f.pricingOptions.some((o) => Number(o.price) > 0);
    case 'background':
      return f.qualifications.length > 0 || f.education.length > 0;
    case 'process':
      return !!f.sessionDescription;
    default:
      return false;
  }
}

// ============ 小组件 ============

// pill 多选（无自定义项）
const renderPillGroup = (
  options: string[],
  selected: string[],
  onChange: (v: string[]) => void
) => (
  <View className={styles.pillWrap}>
    {options.map((t) => {
      const on = selected.includes(t);
      return (
        <View
          key={t}
          className={`${styles.pill} ${on ? styles.pillOn : ''}`}
          onClick={() => onChange(on ? selected.filter((x) => x !== t) : [...selected, t])}
        >
          <Text className={`${styles.pillText} ${on ? styles.pillTextOn : ''}`}>{t}</Text>
        </View>
      );
    })}
  </View>
);

// pill 多选 + 自定义标签（与 web 版 TagSelect 一致）
const TagSelect: React.FC<{
  options: string[];
  selected: string[];
  custom: string[];
  onChange: (v: string[]) => void;
  onCustomChange: (v: string[]) => void;
}> = ({ options, selected, custom, onChange, onCustomChange }) => {
  const [input, setInput] = useState('');
  const addCustom = () => {
    const v = input.trim();
    if (v && !custom.includes(v)) {
      onCustomChange([...custom, v]);
      setInput('');
    }
  };
  return (
    <View>
      {renderPillGroup(options, selected, onChange)}
      {custom.length > 0 && (
        <View className={styles.pillWrap}>
          {custom.map((t) => (
            <View key={t} className={styles.pillCustom}>
              <Text className={styles.pillCustomText}>{t}</Text>
              <View onClick={() => onCustomChange(custom.filter((x) => x !== t))}>
                <Icon name="close" size={12} color="#B07A2A" />
              </View>
            </View>
          ))}
        </View>
      )}
      <View className={styles.customBox}>
        <Text className={styles.fieldHint}>没找到合适的标签？添加自定义标签，经管理员审核后加入选项</Text>
        <View className={styles.customRow}>
          <Input
            className={styles.customInput}
            value={input}
            placeholder="输入标签名称"
            placeholderClass={styles.inputPlaceholder}
            onInput={(e) => setInput(e.detail.value)}
          />
          <View className={styles.customAdd} onClick={addCustom}>
            <Text className={styles.customAddText}>添加</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

// 列表项编辑（资质/教育/受训/经验，与 web 版 ListItems 一致）
const ListItemsEditor: React.FC<{
  items: ListItem[];
  onChange: (v: ListItem[]) => void;
  placeholder: string;
}> = ({ items, onChange, placeholder }) => {
  const [input, setInput] = useState('');
  const add = () => {
    const v = input.trim();
    if (!v) return;
    onChange([...items, { id: genId('li'), value: v }]);
    setInput('');
  };
  return (
    <View>
      <View className={styles.listRow}>
        <Input
          className={styles.listInput}
          value={input}
          placeholder={placeholder}
          placeholderClass={styles.inputPlaceholder}
          onInput={(e) => setInput(e.detail.value)}
        />
        <View className={styles.listAdd} onClick={add}>
          <Text className={styles.listAddText}>+</Text>
        </View>
      </View>
      {items.map((it) => (
        <View key={it.id} className={styles.listItem}>
          <Text className={styles.listItemText}>{it.value}</Text>
          <View onClick={() => onChange(items.filter((x) => x.id !== it.id))}>
            <Icon name="close" size={14} color="#9B8E82" />
          </View>
        </View>
      ))}
    </View>
  );
};

// 多定价方案编辑（与 web 版 pricingOptions 结构一致）
const PricingEditor: React.FC<{
  options: PricingOption[];
  onChange: (v: PricingOption[]) => void;
}> = ({ options, onChange }) => {
  const update = (idx: number, patch: Partial<PricingOption>) => {
    onChange(options.map((o, i) => (i === idx ? { ...o, ...patch } : o)));
  };
  return (
    <View>
      {options.map((opt, idx) => {
        const isCustom = opt.name === PRICING_NAME_CUSTOM;
        const baseIdx = PRICING_NAME_OPTIONS.indexOf(opt.name);
        const pickedIndex = !isCustom && baseIdx >= 0 ? baseIdx : 3;
        const displayName = isCustom ? opt.customName || '自定义' : opt.name || '请选择方案类型';
        return (
          <View key={opt.id} className={styles.pricingCard}>
            <View className={styles.pricingNameRow}>
              <Picker
                mode="selector"
                range={PRICING_NAME_OPTIONS}
                value={pickedIndex}
                onChange={(e) => {
                  const i = Number(e.detail.value);
                  if (i <= 2) update(idx, { name: PRICING_NAME_OPTIONS[i], customName: '' });
                  else update(idx, { name: PRICING_NAME_CUSTOM });
                }}
              >
                <View className={styles.pricingName}>
                  <Text className={styles.pricingNameText}>{displayName}</Text>
                  <Icon name="chevronDown" size={12} color="#9B8E82" />
                </View>
              </Picker>
              {isCustom && (
                <Input
                  className={styles.pricingCustomName}
                  value={opt.customName ?? ''}
                  placeholder="自定义名称"
                  placeholderClass={styles.inputPlaceholder}
                  onInput={(e) => update(idx, { customName: e.detail.value })}
                />
              )}
              <View onClick={() => onChange(options.filter((_, i) => i !== idx))}>
                <Icon name="close" size={14} color="#9B8E82" />
              </View>
            </View>
            <View className={styles.pricingGrid}>
              <View className={styles.pricingCol}>
                <Text className={styles.pricingFieldLabel}>时长（分钟）</Text>
                <Input
                  className={styles.pricingInput}
                  type="number"
                  value={numStr(opt.duration)}
                  placeholder="50"
                  placeholderClass={styles.inputPlaceholder}
                  onInput={(e) => update(idx, { duration: e.detail.value === '' ? 0 : parseInt(e.detail.value, 10) || 0 })}
                />
              </View>
              <View className={styles.pricingCol}>
                <Text className={styles.pricingFieldLabel}>次数</Text>
                <Input
                  className={styles.pricingInput}
                  type="number"
                  value={numStr(opt.sessions)}
                  placeholder="1"
                  placeholderClass={styles.inputPlaceholder}
                  onInput={(e) => update(idx, { sessions: e.detail.value === '' ? 0 : parseInt(e.detail.value, 10) || 0 })}
                />
              </View>
              <View className={styles.pricingCol}>
                <Text className={styles.pricingFieldLabel}>价格（元）</Text>
                <Input
                  className={styles.pricingInput}
                  type="number"
                  value={numStr(opt.price)}
                  placeholder="400"
                  placeholderClass={styles.inputPlaceholder}
                  onInput={(e) => update(idx, { price: e.detail.value === '' ? 0 : parseInt(e.detail.value, 10) || 0 })}
                />
              </View>
            </View>
            <Text className={styles.pricingSummary}>
              ¥{opt.price} / {opt.sessions}次 × {opt.duration}分钟
            </Text>
          </View>
        );
      })}
      <View
        className={styles.pricingAdd}
        onClick={() => onChange([...options, { id: genId('po'), name: '', duration: 50, price: 0, sessions: 1 }])}
      >
        <Text className={styles.pricingAddText}>+ 添加定价方案</Text>
      </View>
    </View>
  );
};

// ============ 页面 ============

const CounselorProfilePage: React.FC = () => {
  const { currentRole, user, logout } = useUserStore();
  const [form, setForm] = useState<ProfileForm>({ ...EMPTY_FORM });
  const [openKey, setOpenKey] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [hasLocalDraft, setHasLocalDraft] = useState(false);

  const setField = function <K extends keyof ProfileForm>(k: K, v: ProfileForm[K]) {
    setForm((prev) => ({ ...prev, [k]: v }));
  };

  const loadProfile = async (first = false) => {
    try {
      const res = await request<{ exists: boolean; profile: Record<string, unknown> | null }>('/api/counselor/profile');
      const serverForm = res?.exists && res.profile ? normalizeProfile(res.profile) : { ...EMPTY_FORM };
      setForm(serverForm);
      if (first) {
        try {
          const raw = Taro.getStorageSync(DRAFT_KEY);
          if (raw) {
            const draft = JSON.parse(raw) as { form?: ProfileForm; savedAt?: number };
            if (draft?.form) {
              const differs = JSON.stringify(draft.form) !== JSON.stringify(serverForm);
              if (differs) {
                setHasLocalDraft(true);
                Taro.showModal({
                  title: '发现本地草稿',
                  content: '检测到未提交的草稿，是否恢复？',
                  confirmText: '恢复',
                  cancelText: '放弃',
                  success: (r) => {
                    if (r.confirm) {
                      setForm({ ...EMPTY_FORM, ...draft.form });
                    } else {
                      Taro.removeStorageSync(DRAFT_KEY);
                      setHasLocalDraft(false);
                    }
                  },
                });
              } else {
                setHasLocalDraft(true);
              }
            }
          }
        } catch {
          // 本地草稿解析失败，忽略
        }
      }
    } catch (e) {
      console.error('[counselor-profile] 档案加载失败', e);
      Taro.showToast({ title: '档案加载失败', icon: 'none' });
    }
  };

  useEffect(() => {
    loadProfile(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 保存草稿：整表单存本地
  const handleSaveDraft = () => {
    try {
      Taro.setStorageSync(DRAFT_KEY, JSON.stringify({ form, savedAt: Date.now() }));
      setHasLocalDraft(true);
      Taro.showToast({ title: '草稿已保存', icon: 'none' });
    } catch (e) {
      console.error('[counselor-profile] 草稿保存失败', e);
      Taro.showToast({ title: '草稿保存失败', icon: 'none' });
    }
  };

  // 提交审核：校验 → 确认 → PUT action=submit
  const handleSubmit = () => {
    if (submitting) return;
    if (!form.displayName.trim()) {
      Taro.showToast({ title: '请填写姓名', icon: 'none' });
      return;
    }
    if (!form.bio.trim()) {
      Taro.showToast({ title: '请填写简介', icon: 'none' });
      return;
    }
    if (form.counselorTypes.length === 0) {
      Taro.showToast({ title: '请至少选择一个咨询师类别', icon: 'none' });
      return;
    }
    if (!form.pricingOptions.some((o) => Number(o.price) > 0)) {
      Taro.showToast({ title: '请先在「咨询设置」中添加至少一个收费方案（价格需大于 0）', icon: 'none' });
      return;
    }
    Taro.showModal({
      title: '提交审核',
      content: '提交后将进入平台审核，确认提交？',
      success: (r) => {
        if (!r.confirm) return;
        setSubmitting(true);
        request<{ profile?: { reviewStatus?: string } }>('/api/counselor/profile', {
          url: '/api/counselor/profile',
          method: 'PUT',
          data: { ...form, action: 'submit' },
        })
          .then(() => {
            Taro.removeStorageSync(DRAFT_KEY);
            setHasLocalDraft(false);
            Taro.showToast({ title: '已提交审核', icon: 'none' });
            return loadProfile();
          })
          .catch((e) => {
            console.error('[counselor-profile] 提交失败', e);
            Taro.showToast({ title: '提交失败，请重试', icon: 'none' });
          })
          .finally(() => setSubmitting(false));
      },
    });
  };

  // 更换头像：chooseImage → uploadFile → 写入表单
  const handleChooseAvatar = () => {
    Taro.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      success: (res) => {
        const filePath = res.tempFilePaths?.[0];
        if (!filePath) return;
        Taro.showLoading({ title: '上传中…' });
        const token = Taro.getStorageSync('token');
        Taro.uploadFile({
          url: `${API_BASE}/api/counselor/avatar-upload`,
          filePath,
          name: 'file',
          header: token ? { Authorization: `Bearer ${token}` } : {},
        })
          .then((uploadRes) => {
            if (uploadRes.statusCode >= 200 && uploadRes.statusCode < 300) {
              const body = JSON.parse(uploadRes.data) as { url?: string };
              if (body?.url) {
                setField('avatarUrl', body.url);
                Taro.showToast({ title: '头像已更新', icon: 'none' });
                return;
              }
            }
            throw new Error(`上传失败: ${uploadRes.statusCode}`);
          })
          .catch((e) => {
            console.error('[counselor-profile] 头像上传失败', e);
            Taro.showToast({ title: '头像上传失败', icon: 'none' });
          })
          .finally(() => Taro.hideLoading());
      },
    });
  };

  const handleLogout = () => {
    Taro.showModal({
      title: '确认退出',
      content: '确定要退出登录吗？',
      success: (r) => {
        if (r.confirm) {
          logout();
          Taro.showToast({ title: '已退出登录', icon: 'none' });
        }
      },
    });
  };

  const handleBack = () => {
    Taro.navigateBack({ delta: 1 }).catch(() => {});
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

  const status = STATUS_LABEL[form.reviewStatus] ?? STATUS_LABEL.draft;
  const province = findProvinceByCity(form.location);
  const cityOptions = province ? PROVINCE_CITY_MAP[province] : [];

  const renderSection = (
    key: string,
    label: string,
    icon: 'user' | 'edit' | 'filter' | 'users' | 'shield' | 'settings' | 'book' | 'video',
    content: React.ReactNode
  ) => {
    const open = openKey === key;
    return (
      <View className={styles.card} key={key}>
        <View className={styles.sectionHeader} onClick={() => setOpenKey(open ? null : key)}>
          <View className={styles.sectionIcon}>
            <Icon name={icon} size={18} color="#9CB48A" />
          </View>
          <Text className={styles.sectionTitle}>{label}</Text>
          {sectionDone(key, form) && <Icon name="check" size={16} color="#9CB48A" />}
          <View className={`${styles.chevron} ${open ? styles.chevronOpen : ''}`}>
            <Icon name="chevronDown" size={16} color="#9B8E82" />
          </View>
        </View>
        {open && <View className={styles.sectionBody}>{content}</View>}
      </View>
    );
  };

  const avatarUrl = resolveAssetUrl(form.avatarUrl);

  return (
    <View className={styles.container}>
      {/* 顶部标题区 */}
      <View className={styles.header}>
        <View className={styles.backBtn} onClick={handleBack}>
          <Icon name="chevronLeft" size={20} color="#6B5E52" />
        </View>
        <View className={styles.headerCenter}>
          <Text className={styles.headerTitle}>编辑档案</Text>
          <Text className={styles.headerSubtitle}>填写完整后提交，等待平台审核</Text>
        </View>
        {form.reviewStatus === 'draft' || hasLocalDraft ? (
          <View className={styles.draftBadge}>
            <Text className={styles.draftBadgeText}>草稿</Text>
          </View>
        ) : (
          <View className={styles.statusBadge} style={{ background: status.bg }}>
            <Text className={styles.statusBadgeText} style={{ color: status.color }}>
              {status.text}
            </Text>
          </View>
        )}
      </View>

      <View className={styles.content}>
        {/* 1. 基本信息 */}
        {renderSection(
          'basic',
          '基本信息',
          'user',
          <View>
            <View className={styles.avatarRow}>
              {avatarUrl ? (
                <Image className={styles.avatarImg} src={avatarUrl} mode="aspectFill" />
              ) : (
                <View className={styles.avatarPlaceholder}>
                  <Text className={styles.avatarPlaceholderText}>{user?.name?.charAt(0) || '?'}</Text>
                </View>
              )}
              <View className={styles.avatarChangeBtn} onClick={handleChooseAvatar}>
                <Icon name="camera" size={14} color="#6B5E52" />
                <Text className={styles.avatarChangeText}>更换头像</Text>
              </View>
            </View>
            <View className={styles.field}>
              <Text className={styles.fieldLabel}>姓名 *</Text>
              <Input
                className={styles.input}
                value={form.displayName}
                placeholder="你的全名"
                placeholderClass={styles.inputPlaceholder}
                onInput={(e) => setField('displayName', e.detail.value)}
              />
            </View>
            <View className={styles.field}>
              <Text className={styles.fieldLabel}>咨询师类别 *</Text>
              <Text className={styles.fieldHint}>决定首页角色标签，可多选</Text>
              {COUNSELOR_TYPE_OPTIONS.map((opt) => {
                const on = form.counselorTypes.includes(opt.id);
                return (
                  <View
                    key={opt.id}
                    className={`${styles.typeCard} ${on ? styles.typeCardOn : ''}`}
                    onClick={() =>
                      setField(
                        'counselorTypes',
                        on ? form.counselorTypes.filter((x) => x !== opt.id) : [...form.counselorTypes, opt.id]
                      )
                    }
                  >
                    <View className={`${styles.typeDot} ${on ? styles.typeDotOn : ''}`}>
                      {on && <Icon name="check" size={12} color="#FFFFFF" />}
                    </View>
                    <View className={styles.typeInfo}>
                      <Text className={styles.typeName}>{opt.id}</Text>
                      <Text className={styles.typeDesc}>{opt.desc}</Text>
                    </View>
                  </View>
                );
              })}
            </View>
            <View className={styles.field}>
              <Text className={styles.fieldLabel}>是否为督导</Text>
              <Text className={styles.fieldHint}>督导标签会显示在你的咨询师卡片上</Text>
              <View className={styles.pairRow}>
                {[{ v: true, label: '是，我是督导' }, { v: false, label: '否' }].map((opt) => (
                  <View
                    key={String(opt.v)}
                    className={`${styles.pairBtn} ${form.isSupervisor === opt.v ? styles.pairBtnOn : ''}`}
                    onClick={() => setField('isSupervisor', opt.v)}
                  >
                    <Text className={`${styles.pairBtnText} ${form.isSupervisor === opt.v ? styles.pairBtnTextOn : ''}`}>
                      {opt.label}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
            <View className={styles.field}>
              <Text className={styles.fieldLabel}>所在地 *</Text>
              <Text className={styles.fieldHint}>选择省份和城市，便于来访按地区筛选找到你</Text>
              <View className={styles.pairRow}>
                <Picker
                  mode="selector"
                  range={PROVINCE_OPTIONS}
                  value={Math.max(0, PROVINCE_OPTIONS.indexOf(province))}
                  onChange={(e) => {
                    const prov = PROVINCE_OPTIONS[Number(e.detail.value)];
                    const cities = PROVINCE_CITY_MAP[prov];
                    setField('location', cities && cities.length > 0 ? cities[0] : prov);
                  }}
                >
                  <View className={styles.pickerBox}>
                    <Text className={province ? styles.pickerText : styles.pickerPlaceholder}>
                      {province || '选择省份'}
                    </Text>
                    <Icon name="chevronDown" size={12} color="#9B8E82" />
                  </View>
                </Picker>
                {cityOptions.length > 1 && (
                  <Picker
                    mode="selector"
                    range={cityOptions}
                    value={Math.max(0, cityOptions.indexOf(form.location))}
                    onChange={(e) => setField('location', cityOptions[Number(e.detail.value)])}
                  >
                    <View className={styles.pickerBox}>
                      <Text className={form.location ? styles.pickerText : styles.pickerPlaceholder}>
                        {form.location || '选择城市'}
                      </Text>
                      <Icon name="chevronDown" size={12} color="#9B8E82" />
                    </View>
                  </Picker>
                )}
              </View>
            </View>
            <View className={styles.field}>
              <Text className={styles.fieldLabel}>累计咨询小时数</Text>
              <Input
                className={styles.input}
                type="number"
                value={form.totalHours}
                placeholder="0"
                placeholderClass={styles.inputPlaceholder}
                onInput={(e) => setField('totalHours', e.detail.value)}
              />
            </View>
            <View className={styles.field}>
              <Text className={styles.fieldLabel}>简介 *</Text>
              <Text className={styles.fieldHint}>你的简介将完整地展示在个人主页，列表卡片上只显示前 300 字</Text>
              <Textarea
                className={styles.textarea}
                value={form.bio}
                maxlength={2000}
                placeholder="介绍你自己和你的工作方式……"
                placeholderClass={styles.inputPlaceholder}
                onInput={(e) => setField('bio', e.detail.value)}
              />
            </View>
          </View>
        )}

        {/* 2. 给来访者的话 */}
        {renderSection(
          'tagline',
          '给来访者的话',
          'edit',
          <View>
            <Text className={styles.fieldHint}>
              咨询师寄语：一段真诚的话，会在主页以大字引语形式呈现（50-200 字）
            </Text>
            <Textarea
              className={styles.textarea}
              value={form.tagline}
              maxlength={500}
              placeholder="你想对来访说的话……"
              placeholderClass={styles.inputPlaceholder}
              onInput={(e) => setField('tagline', e.detail.value)}
            />
          </View>
        )}

        {/* 3. 擅长领域 */}
        {renderSection(
          'specialties',
          '擅长领域',
          'filter',
          <View>
            <Text className={styles.fieldHint}>选择你擅长的方向（可多选）</Text>
            <TagSelect
              options={SPECIALTY_OPTIONS}
              selected={form.specialties}
              custom={form.customSpecialties}
              onChange={(v) => setField('specialties', v)}
              onCustomChange={(v) => setField('customSpecialties', v)}
            />
          </View>
        )}

        {/* 4. 工作人群 */}
        {renderSection(
          'workingGroups',
          '工作人群',
          'users',
          <View>
            <Text className={styles.fieldHint}>你主要服务哪些群体？（可多选）</Text>
            <TagSelect
              options={WORKING_GROUP_OPTIONS}
              selected={form.workingGroups}
              custom={form.customWorkingGroups}
              onChange={(v) => setField('workingGroups', v)}
              onCustomChange={(v) => setField('customWorkingGroups', v)}
            />
          </View>
        )}

        {/* 5. 咨询取向 */}
        {renderSection(
          'approaches',
          '咨询取向',
          'shield',
          <View>
            <Text className={styles.fieldHint}>你使用哪些理论取向？（可多选）</Text>
            <TagSelect
              options={APPROACH_OPTIONS}
              selected={form.approaches}
              custom={form.customApproaches}
              onChange={(v) => setField('approaches', v)}
              onCustomChange={(v) => setField('customApproaches', v)}
            />
          </View>
        )}

        {/* 6. 咨询设置 */}
        {renderSection(
          'settings',
          '咨询设置',
          'settings',
          <View>
            <View className={styles.field}>
              <Text className={styles.fieldLabel}>咨询方式 *</Text>
              {renderPillGroup(SESSION_MODE_OPTIONS, form.sessionModes, (v) => setField('sessionModes', v))}
            </View>
            <View className={styles.field}>
              <Text className={styles.fieldLabel}>定价方案</Text>
              <Text className={styles.fieldHint}>
                添加不同类型的咨询服务及其价格，如个体咨询、家庭咨询、套餐等
              </Text>
              <PricingEditor options={form.pricingOptions} onChange={(v) => setField('pricingOptions', v)} />
            </View>
            <View className={styles.field}>
              <Text className={styles.fieldLabel}>接待语言</Text>
              {renderPillGroup(LANGUAGE_OPTIONS, form.languages, (v) => setField('languages', v))}
            </View>
            <View className={styles.field}>
              <Text className={styles.fieldLabel}>咨询设置说明</Text>
              <Text className={styles.fieldHint}>频率、首次流程、是否接受滑动尺度收费等</Text>
              <Textarea
                className={styles.textarea}
                value={form.sessionSettings}
                maxlength={1000}
                placeholder="例：每次50分钟，建议每周一次。首次为初始访谈……"
                placeholderClass={styles.inputPlaceholder}
                onInput={(e) => setField('sessionSettings', e.detail.value)}
              />
            </View>
          </View>
        )}

        {/* 7. 从业背景 */}
        {renderSection(
          'background',
          '从业背景',
          'book',
          <View>
            <View className={styles.field}>
              <Text className={styles.fieldLabel}>从业资质</Text>
              <ListItemsEditor
                items={form.qualifications}
                onChange={(v) => setField('qualifications', v)}
                placeholder="例：国家二级心理咨询师证书"
              />
            </View>
            <View className={styles.field}>
              <Text className={styles.fieldLabel}>教育背景</Text>
              <ListItemsEditor
                items={form.education}
                onChange={(v) => setField('education', v)}
                placeholder="例：北京大学 心理学硕士"
              />
            </View>
            <View className={styles.field}>
              <Text className={styles.fieldLabel}>受训经历</Text>
              <ListItemsEditor
                items={form.trainings}
                onChange={(v) => setField('trainings', v)}
                placeholder="例：DBT 辩证行为疗法培训（120小时）"
              />
            </View>
            <View className={styles.field}>
              <Text className={styles.fieldLabel}>工作经验</Text>
              <ListItemsEditor
                items={form.workExperiences}
                onChange={(v) => setField('workExperiences', v)}
                placeholder="例：某三甲医院心理科（3年）"
              />
            </View>
          </View>
        )}

        {/* 8. 咨询过程与方式 */}
        {renderSection(
          'process',
          '咨询过程与方式',
          'video',
          <View>
            <Text className={styles.fieldHint}>
              描述你的咨询风格和流程（帮助来访了解和你工作会是什么感受，可分段书写）
            </Text>
            <Textarea
              className={`${styles.textarea} ${styles.textareaTall}`}
              value={form.sessionDescription}
              maxlength={2000}
              placeholder="我的咨询风格是……"
              placeholderClass={styles.inputPlaceholder}
              onInput={(e) => setField('sessionDescription', e.detail.value)}
            />
          </View>
        )}

        {/* 退出登录 */}
        <View className={styles.logoutBtn} onClick={handleLogout}>
          <Icon name="logOut" size={16} color="#EF4444" />
          <Text className={styles.logoutText}>退出登录</Text>
        </View>
      </View>

      {/* 底部固定操作条 */}
      <View className={styles.footerBar}>
        <View className={styles.footerSave} onClick={handleSaveDraft}>
          <Icon name="share" size={16} color="#6B5E52" />
          <Text className={styles.footerSaveText}>保存草稿</Text>
        </View>
        <View
          className={`${styles.footerSubmit} ${submitting ? styles.footerSubmitDisabled : ''}`}
          onClick={handleSubmit}
        >
          <Icon name="send" size={16} color="#FFFFFF" />
          <Text className={styles.footerSubmitText}>
            {submitting
              ? '提交中…'
              : form.reviewStatus === 'pending' || form.reviewStatus === 'approved'
                ? '重新提交审核'
                : '提交审核'}
          </Text>
        </View>
      </View>

      <CustomTabBar />
    </View>
  );
};

export default CounselorProfilePage;
