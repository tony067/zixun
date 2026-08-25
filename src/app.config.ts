export default defineAppConfig({
  pages: [
    'pages/index/index',
    'pages/messages/index',
    'pages/profile/index',
    'pages/counselor-detail/index',
    'pages/booking-flow/index',
    'pages/bookings/index',
    'pages/login/index',
    'pages/guide/index',
    'pages/counselor-bookings/index',
    'pages/counselor-schedule/index',
    'pages/counselor-profile/index',
    'pages/admin-dashboard/index',
    'pages/admin-review/index',
    'pages/admin-orders/index',
    'pages/admin-users/index'
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#F5F0E8',
    navigationBarTitleText: 'MindPace',
    navigationBarTextStyle: 'black',
    backgroundColor: '#F5F0E8'
  },
  tabBar: {
    custom: true,
    color: '#9B8E82',
    selectedColor: '#7A9A6A',
    backgroundColor: '#FFFFFF',
    borderStyle: 'white',
    list: [
      {
        pagePath: 'pages/index/index',
        text: '首页'
      },
      {
        pagePath: 'pages/messages/index',
        text: '消息'
      },
      {
        pagePath: 'pages/profile/index',
        text: '我的'
      },
      {
        pagePath: 'pages/counselor-bookings/index',
        text: '预约管理'
      },
      {
        pagePath: 'pages/counselor-schedule/index',
        text: '档期管理'
      },
      {
        pagePath: 'pages/counselor-profile/index',
        text: '档案'
      },
      {
        pagePath: 'pages/admin-dashboard/index',
        text: '总览'
      },
      {
        pagePath: 'pages/admin-review/index',
        text: '审核'
      },
      {
        pagePath: 'pages/admin-orders/index',
        text: '订单'
      },
      {
        pagePath: 'pages/admin-users/index',
        text: '用户'
      }
    ]
  }
})
