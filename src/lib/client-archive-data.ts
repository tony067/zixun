export const MOCK_CLIENTS: Record<string, {
  name: string; gender: string; age: number; phone: string; email: string;
  emergencyName: string; emergencyPhone: string;
  firstSession: string; totalSessions: number; completedSessions: number;
  status: "active" | "paused"; fixedTime: string;
  applicationForm: { label: string; value: string }[];
  bookings: { id: string; date: string; time: string; mode: string; status: string; price: number }[];
}> = {
  client_a: {
    name: "张小明", gender: "男", age: 28, phone: "138****5678", email: "zhang@example.com",
    emergencyName: "张父", emergencyPhone: "139****1234",
    firstSession: "2025.10.14", totalSessions: 8, completedSessions: 6,
    status: "active", fixedTime: "每周二 14:00",
    applicationForm: [
      { label: "来访原因", value: "工作压力大，近期情绪低落，难以集中注意力，对原本喜欢的事情失去兴趣。" },
      { label: "期望收获", value: "希望能够缓解焦虑，找到更好的压力管理方法，改善睡眠质量。" },
      { label: "是否有过咨询经历", value: "有，两年前曾咨询过3次，因出差中断。" },
      { label: "心理测评结果", value: "PHQ-9: 10分（中度抑郁）；GAD-7: 12分（中度焦虑）" },
      { label: "是否有紧急情况", value: "否" },
      { label: "咨询方式偏好", value: "视频咨询" },
    ],
    bookings: [
      { id: "bk_a1", date: "2025.10.14", time: "14:00–14:50", mode: "视频", status: "已完成", price: 420 },
      { id: "bk_a2", date: "2025.10.21", time: "14:00–14:50", mode: "视频", status: "已完成", price: 420 },
      { id: "bk_a3", date: "2025.10.28", time: "14:00–14:50", mode: "视频", status: "已完成", price: 420 },
      { id: "bk_a4", date: "2025.11.04", time: "14:00–14:50", mode: "视频", status: "已完成", price: 420 },
      { id: "bk_a5", date: "2025.11.11", time: "14:00–14:50", mode: "视频", status: "已完成", price: 420 },
      { id: "bk_a6", date: "2025.11.18", time: "14:00–14:50", mode: "视频", status: "已完成", price: 420 },
      { id: "bk_a7", date: "2025.11.25", time: "14:00–14:50", mode: "视频", status: "待咨询", price: 420 },
      { id: "bk_a8", date: "2025.12.02", time: "14:00–14:50", mode: "视频", status: "待确认", price: 420 },
    ],
  },
  client_b: {
    name: "李晓芸", gender: "女", age: 32, phone: "137****9012", email: "li@example.com",
    emergencyName: "李先生", emergencyPhone: "136****5678",
    firstSession: "2025.11.20", totalSessions: 3, completedSessions: 3,
    status: "active", fixedTime: "每周四 10:00",
    applicationForm: [
      { label: "来访原因", value: "长期失眠，伴有莫名焦虑感，对人际关系感到疲惫。" },
      { label: "期望收获", value: "改善睡眠，理解自己的情绪模式，学习边界设定。" },
      { label: "是否有过咨询经历", value: "无" },
      { label: "心理测评结果", value: "PHQ-9: 6分（轻度）；GAD-7: 9分（中度焦虑）" },
      { label: "是否有紧急情况", value: "否" },
      { label: "咨询方式偏好", value: "视频咨询" },
    ],
    bookings: [
      { id: "bk_b1", date: "2025.11.20", time: "10:00–10:50", mode: "视频", status: "已完成", price: 420 },
      { id: "bk_b2", date: "2025.11.27", time: "10:00–10:50", mode: "视频", status: "已完成", price: 420 },
      { id: "bk_b3", date: "2025.12.04", time: "10:00–10:50", mode: "视频", status: "已完成", price: 420 },
    ],
  },
  client_c: {
    name: "王浩然", gender: "男", age: 25, phone: "135****3456", email: "wang@example.com",
    emergencyName: "王母", emergencyPhone: "134****7890",
    firstSession: "2025.06.01", totalSessions: 12, completedSessions: 12,
    status: "paused", fixedTime: "暂无",
    applicationForm: [
      { label: "来访原因", value: "ADHD确诊后希望获得执行功能支持，改善日常生活管理能力。" },
      { label: "期望收获", value: "建立稳定的日程习惯，减少拖延，提升自我效能感。" },
      { label: "是否有过咨询经历", value: "有，曾接受过ADHD评估" },
      { label: "心理测评结果", value: "ADHD评估：注意力缺陷为主型（成人）" },
      { label: "是否有紧急情况", value: "否" },
      { label: "咨询方式偏好", value: "视频咨询" },
    ],
    bookings: Array.from({ length: 12 }, (_, i) => ({
      id: `bk_c${i+1}`,
      date: `2025.0${Math.floor(i/4)+6}.${String((i%4)*7+1).padStart(2,"0")}`,
      time: "15:00–15:50", mode: "视频", status: "已完成", price: 280,
    })),
  },
};

export const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  "已完成": { bg: "#E4F0DC", color: "#3A6228" },
  "待咨询": { bg: "#E8F0FF", color: "#3A5AB0" },
  "待确认": { bg: "#FFF3E0", color: "#B07020" },
  "已取消": { bg: "#F5F0EA", color: "#9B8E82" },
};
