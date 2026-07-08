import type { Booking } from '@/types/booking';

export const mockBookings: Booking[] = [
  {
    id: 'b1',
    clientId: 'u1',
    counselorId: 'c1',
    counselorName: '林晓然',
    counselorAvatar: 'https://picsum.photos/id/64/200/200',
    scheduledAt: '2026-07-02T10:00:00.000Z',
    durationMinutes: 50,
    sessionMode: '视频',
    priceAmount: 500,
    status: 'confirmed',
    clientNote: '希望讨论工作压力和注意力管理'
  },
  {
    id: 'b2',
    clientId: 'u1',
    counselorId: 'c2',
    counselorName: '陈牧之',
    counselorAvatar: 'https://picsum.photos/id/91/200/200',
    scheduledAt: '2026-07-05T14:00:00.000Z',
    durationMinutes: 50,
    sessionMode: '视频',
    priceAmount: 450,
    status: 'pending_confirmation',
    clientNote: '想了解 ADHD 教练服务'
  },
  {
    id: 'b3',
    clientId: 'u1',
    counselorId: 'c3',
    counselorName: '王静宜',
    counselorAvatar: 'https://picsum.photos/id/177/200/200',
    scheduledAt: '2026-06-20T09:00:00.000Z',
    durationMinutes: 60,
    sessionMode: '面谈',
    priceAmount: 380,
    status: 'completed',
    clientNote: '孩子学校适应问题'
  },
  {
    id: 'b4',
    clientId: 'u1',
    counselorId: 'c5',
    counselorName: '李悦心',
    counselorAvatar: 'https://picsum.photos/id/1027/200/200',
    scheduledAt: '2026-06-28T16:00:00.000Z',
    durationMinutes: 50,
    sessionMode: '视频',
    priceAmount: 420,
    status: 'cancelled',
    clientNote: '临时有事需要改期'
  }
];
