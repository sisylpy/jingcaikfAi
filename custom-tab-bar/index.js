Component({
  data: {
    selected: 0,
    showTabBar: true,
    stockCount: 0,
    wxCount: 0,
    stockCountOk: 0,
    wxCountOk: 0,
   
    list: []
  },
  
  lifetimes: {
    attached() {
      // 组件初始化时设置 tab bar 列表
      this.updateTabBarList();
    }
  },
  
  pageLifetimes: {
    show() {
      // 页面显示时更新 tab bar 列表（防止 disInfo 更新后需要刷新）
      this.updateTabBarList();
    }
  },
  
  methods: {
    // 更新 tab bar 列表
    updateTabBarList() {
      // 获取 disInfo 和 userInfo
      var disInfo = wx.getStorageSync('disInfo');
      var userInfo = wx.getStorageSync('userInfo');
      
      // 尝试从多个位置获取 disBusinessType
      var disBusinessType = null;
      
      if (disInfo && disInfo.nxDistributerBusinessTypeId !== undefined) {
        disBusinessType = disInfo.nxDistributerBusinessTypeId;
      } else if (userInfo && userInfo.nxDistributerBusinessTypeId !== undefined) {
        disBusinessType = userInfo.nxDistributerBusinessTypeId;
      } else if (userInfo && userInfo.nxDistributerEntity && userInfo.nxDistributerEntity.nxDistributerBusinessTypeId !== undefined) {
        disBusinessType = userInfo.nxDistributerEntity.nxDistributerBusinessTypeId;
      }
      
      // 转换为数字类型（确保比较正确）
      if (disBusinessType !== null && disBusinessType !== undefined) {
        disBusinessType = Number(disBusinessType);
      }
      console.log("nxDistributerBusinessTypeIdnxDistributerBusinessTypeId",disBusinessType)
      // 基础列表（前 2 个页面）
      var baseList = [
        {
          "pagePath": "pages/order/index/index",
          "text": "客户",
          "iconPath": "/images/icons/icon_stock.png",
          "selectedIconPath": "/images/icons/icon_stock_active.png"
        },
        {
          "pagePath": "pages/total/goods/goods",
          "text": "批量出库",
          "iconPath": "/images/icons/icon_purchase.png",
          "selectedIconPath": "/images/icons/icon_purchase_active.png"
        }
      ];
      
      // 如果 disBusinessType > 2(专业货架批发商)，添加货架页面
      if (disBusinessType !== null && disBusinessType !== undefined && disBusinessType  > 2) {
        baseList.push({
          "pagePath": "pages/shelf/index/index",
          "text": "货架",
          "iconPath": "/images/icons/icon_goods.png",
          "selectedIconPath": "/images/icons/icon_goods_active.png"
        });
      }
      
      this.setData({
        list: baseList
      });
      
      console.log('Tab bar 列表已更新，disBusinessType:', disBusinessType, '列表数量:', baseList.length);
    },
    switchTab(e) {
     
      
      const data = e.currentTarget.dataset;
      const url = '/' + data.path;
      wx.switchTab({ url });
      this.setData({
        selected: data.index
      });
    }
  }
});
