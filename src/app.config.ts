export default defineAppConfig({
  pages: [
    'pages/index/index',
    'pages/messages/index',
    'pages/profile/index',
    'pages/counselor-detail/index',
    'pages/booking-flow/index',
    'pages/bookings/index',
    'pages/login/index'
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#F5F0E8',
    navigationBarTitleText: 'MindPace',
    navigationBarTextStyle: 'black',
    backgroundColor: '#F5F0E8'
  },
  tabBar: {
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
      }
    ]
  }
})
