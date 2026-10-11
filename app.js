
// app.js
var ownerSession = require('./lib/ownerSession.js');

App({
  onLaunch() {
    // 先安装会话凭证携带，再发起任何业务请求。
    ownerSession.install();

  	const windowInfo = wx.getWindowInfo();

  var device = wx.getDeviceInfo();
    const isIOS = device.system.indexOf('iOS') > -1;
    const navBarContentHeight = isIOS ? 44 : 48; 
    const statusBarHeight = windowInfo.statusBarHeight; // 状态栏高度
    // const navBarHeight = statusBarHeight + navBarContentHeight; // 总的导航栏高度
    const menuButtonInfo = wx.getMenuButtonBoundingClientRect();
    console.log(menuButtonInfo);
    const navBarHeight = menuButtonInfo.bottom + menuButtonInfo.top - statusBarHeight;

    // 存储到 globalData
    this.globalData = {
      windowWidth: windowInfo.windowWidth,
      windowHeight: windowInfo.windowHeight,
      screenHeight: windowInfo.screenHeight,
      screenWidth: windowInfo.screenWidth,
      statusBarHeight: windowInfo.statusBarHeight,
      rpxR: 750 / windowInfo.windowWidth,
      statusBarHeight: statusBarHeight,
      navBarContentHeight: navBarContentHeight,
      navBarHeight: navBarHeight,
      userInfo: null,
      menuButtonInfo: menuButtonInfo,
      // 蓝牙打印机信息
      BLEInformation: {
        platform: "",
        deviceId: "",
        deviceName: "",
        writeCharaterId: "",
        writeServiceId: "",
        notifyCharaterId: "",
        notifyServiceId: "",
        readCharaterId: "",
        readServiceId: "",
        isConnected: false  // 是否已连接
      }
    };
  },
  globalData: {
    statusBarHeight: 20,
    navBarContentHeight: 44,
    navBarHeight: 64,
    userInfo: null,
    tabBar: [],
    menuButtonInfo: null
  }
});


