export default defineAppConfig({
  pages: [
    'pages/self-check/index',
    'pages/material-check/index',
    'pages/photo-organize/index',
    'pages/submit-list/index',
    'pages/progress/index'
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#2563eb',
    navigationBarTitleText: '教资认定助手',
    navigationBarTextStyle: 'white',
    backgroundColor: '#f8fafc'
  },
  tabBar: {
    color: '#94a3b8',
    selectedColor: '#2563eb',
    backgroundColor: '#ffffff',
    borderStyle: 'white',
    list: [
      {
        pagePath: 'pages/self-check/index',
        text: '资格自查'
      },
      {
        pagePath: 'pages/material-check/index',
        text: '材料预检'
      },
      {
        pagePath: 'pages/photo-organize/index',
        text: '拍照整理'
      },
      {
        pagePath: 'pages/submit-list/index',
        text: '提交清单'
      },
      {
        pagePath: 'pages/progress/index',
        text: '进度提醒'
      }
    ]
  }
})
