// 咨询师档案数据结构 + 常量

export type SectionKey =
  | "basic" | "tagline" | "specialties" | "workingGroups"
  | "approaches" | "settings" | "background" | "process";

export type ListItem = { id: string; value: string };

export type PricingOption = {
  id: string;
  name: string;
  customName?: string;
  duration: number;
  price: number;
  sessions: number;
};

export interface ProfileForm {
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

export const EMPTY_PROFILE: ProfileForm = {
  reviewStatus: "draft", reviewNote: "",
  isAccepting: false,
  avatarUrl: "", displayName: "",
  counselorTypes: [], isSupervisor: false,
  location: "", totalHours: "",
  bio: "", tagline: "",
  specialties: [], customSpecialties: [],
  workingGroups: [], customWorkingGroups: [],
  approaches: [], customApproaches: [],
  sessionDuration: 50, pricePerSession: "", currency: "CNY",
  pricingOptions: [],
  sessionModes: [], languages: [],
  sessionSettings: "",
  qualifications: [], education: [], trainings: [], workExperiences: [],
  sessionDescription: "",
};

export const SPECIALTY_OPTIONS = [
  "ADHD","ASD","情绪问题","睡眠问题","感官敏感","创伤","读写障碍",
  "女性成长","人际关系","职场困境","儿童/青少年","家长支持","性议题",
  "ADHD教练","特教老师",
];

export const WORKING_GROUP_OPTIONS = [
  "成人ADHD","成人ASD","儿童/青少年ADHD","儿童/青少年ASD",
  "高功能","性多元人群","孕产","家长支持",
];

export const APPROACH_OPTIONS = [
  "认知行为疗法(CBT)","辩证行为疗法(DBT)","接纳承诺疗法(ACT)","精神动力学",
  "人本主义","正念疗法","叙事疗法","家庭系统疗法","EMDR","沙盘疗法",
  "心理教育","行为激活","执行功能教练","特殊教育支持",
];

export const LANGUAGE_OPTIONS = ["普通话","粤语","英语","闽南语","上海话"];

export const SESSION_MODE_OPTIONS = ["视频咨询","语音咨询","面对面咨询","文字咨询"];

export const SECTION_META: { key: SectionKey; label: string; icon: string }[] = [
  { key: "tagline",      label: "给来访者的话",      icon: "quote" },
  { key: "specialties",  label: "擅长领域",          icon: "sparkle" },
  { key: "workingGroups",label: "工作人群",          icon: "users" },
  { key: "approaches",   label: "咨询取向",          icon: "brain" },
  { key: "settings",     label: "咨询设置",          icon: "gear" },
  { key: "background",   label: "从业背景",          icon: "file" },
  { key: "process",      label: "咨询过程与方式",    icon: "chat" },
];

/* ── 省市区级联数据 ── */
export const PROVINCE_CITY_MAP: Record<string, string[]> = {
  "北京": ["东城区","西城区","朝阳区","丰台区","石景山区","海淀区","顺义区","通州区","大兴区","房山区","门头沟区","昌平区","平谷区","密云区","怀柔区","延庆区"],
  "天津": ["和平区","河东区","河西区","南开区","河北区","红桥区","东丽区","西青区","津南区","北辰区","武清区","宝坻区","滨海新区","宁河区","静海区","蓟州区"],
  "上海": ["黄浦区","徐汇区","长宁区","静安区","普陀区","虹口区","杨浦区","闵行区","宝山区","嘉定区","浦东新区","金山区","松江区","青浦区","奉贤区","崇明区"],
  "重庆": ["渝中区","大渡口区","江北区","沙坪坝区","九龙坡区","南岸区","北碚区","渝北区","巴南区","涪陵区","万州区","黔江区","长寿区","江津区","合川区","永川区"],
  "河北": ["石家庄","唐山","秦皇岛","邯郸","邢台","保定","张家口","承德","沧州","廊坊","衡水"],
  "山西": ["太原","大同","阳泉","长治","晋城","朔州","晋中","运城","忻州","临汾","吕梁"],
  "辽宁": ["沈阳","大连","鞍山","抚顺","本溪","丹东","锦州","营口","阜新","辽阳","盘锦","铁岭","朝阳","葫芦岛"],
  "吉林": ["长春","吉林","四平","辽源","通化","白山","松原","白城","延边"],
  "黑龙江": ["哈尔滨","齐齐哈尔","牡丹江","佳木斯","大庆","鸡西","双鸭山","伊春","七台河","鹤岗","绥化","黑河","大兴安岭"],
  "江苏": ["南京","无锡","徐州","常州","苏州","南通","连云港","淮安","盐城","扬州","镇江","泰州","宿迁"],
  "浙江": ["杭州","宁波","温州","嘉兴","湖州","绍兴","金华","衢州","舟山","台州","丽水"],
  "安徽": ["合肥","芜湖","蚌埠","淮南","马鞍山","淮北","铜陵","安庆","黄山","滁州","阜阳","宿州","六安","亳州","池州","宣城"],
  "福建": ["福州","厦门","莆田","三明","泉州","漳州","南平","龙岩","宁德"],
  "江西": ["南昌","景德镇","萍乡","九江","新余","鹰潭","赣州","吉安","宜春","抚州","上饶"],
  "山东": ["济南","青岛","淄博","枣庄","东营","烟台","潍坊","济宁","泰安","威海","日照","临沂","德州","聊城","滨州","菏泽"],
  "河南": ["郑州","开封","洛阳","平顶山","安阳","鹤壁","新乡","焦作","濮阳","许昌","漯河","三门峡","南阳","商丘","信阳","周口","驻马店"],
  "湖北": ["武汉","黄石","十堰","宜昌","襄阳","鄂州","荆门","孝感","荆州","黄冈","咸宁","随州","恩施"],
  "湖南": ["长沙","株洲","湘潭","衡阳","邵阳","岳阳","常德","张家界","益阳","郴州","永州","怀化","娄底","湘西"],
  "广东": ["广州","深圳","珠海","汕头","佛山","韶关","湛江","肇庆","江门","茂名","惠州","梅州","汕尾","河源","阳江","清远","东莞","中山","潮州","揭阳","云浮"],
  "海南": ["海口","三亚","三沙","儋州"],
  "四川": ["成都","自贡","攀枝花","泸州","德阳","绵阳","广元","遂宁","内江","乐山","南充","眉山","宜宾","广安","达州","雅安","巴中","资阳","阿坝","甘孜","凉山"],
  "贵州": ["贵阳","六盘水","遵义","安顺","毕节","铜仁","黔西南","黔东南","黔南"],
  "云南": ["昆明","曲靖","玉溪","保山","昭通","丽江","普洱","临沧","楚雄","红河","文山","西双版纳","大理","德宏","怒江","迪庆"],
  "陕西": ["西安","铜川","宝鸡","咸阳","渭南","延安","汉中","榆林","安康","商洛"],
  "甘肃": ["兰州","嘉峪关","金昌","白银","天水","武威","张掖","平凉","酒泉","庆阳","定西","陇南","临夏","甘南"],
  "青海": ["西宁","海东","海北","黄南","海南","果洛","玉树","海西"],
  "广西": ["南宁","柳州","桂林","梧州","北海","防城港","钦州","贵港","玉林","百色","贺州","河池","来宾","崇左"],
  "内蒙古": ["呼和浩特","包头","乌海","赤峰","通辽","鄂尔多斯","呼伦贝尔","巴彦淖尔","乌兰察布","兴安盟","锡林郭勒盟","阿拉善盟"],
  "西藏": ["拉萨","日喀则","昌都","林芝","山南","那曲","阿里"],
  "宁夏": ["银川","石嘴山","吴忠","固原","中卫"],
  "新疆": ["乌鲁木齐","克拉玛依","吐鲁番","哈密","昌吉","博尔塔拉","巴音郭楞","阿克苏","克孜勒苏","喀什","和田","伊犁","塔城","阿勒泰"],
  "香港": ["香港"],
  "澳门": ["澳门"],
  "台湾": ["台北","台中","高雄","台南","新竹","基隆"],
};

export const PROVINCE_OPTIONS = Object.keys(PROVINCE_CITY_MAP);

/** 根据城市名反查省份 */
export function findProvinceByCity(city: string): string | null {
  for (const [prov, cities] of Object.entries(PROVINCE_CITY_MAP)) {
    if (cities.some(c => city.includes(c) || c.includes(city))) return prov;
  }
  return null;
}

/** 根据省份获取该省所有城市名（含省份名本身） */
export function getCitiesForProvince(province: string): string[] {
  const cities = PROVINCE_CITY_MAP[province];
  if (!cities) return [province];
  return [province, ...cities];
}
