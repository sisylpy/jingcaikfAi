const globalData = getApp().globalData;
var load = require('../../../lib/load.js');

import apiUrl from '../../../config.js'

const tabBarHeight = 50; // 根据实际情况调整
const viewBarHeight = 60;

import {
  stockerGetWaitStockGoodsDeps,
  supplierGetWaitStockGoodsDeps
} from '../../../lib/apiDistributer.js'

import {
  weighterLoginKf
} from '../../../lib/apiDistributer'

Page({
  data: {
    firstLoading: true,
    onPurchaseRefresh: false,
    update: false,
    changeIds: false,
    printOk: false,
    paperSize: 1, // 默认小尺寸：4*3cm
    showSideBar: false // 是否显示左侧边栏（供货商客户列表）
  },

  onLoad(options) {
    // 如果 options 传了参数，先缓存起来
    if (options.disId || options.supplierId) {
      const cachedSupplierCustomer = {
        disId: options.disId,
        supplierId: options.supplierId,
        userId: options.userId,
        userType: options.userType
      };
      wx.setStorageSync('supplierCustomer', cachedSupplierCustomer);
    }

    this.setData({
      userId: options.userId,
      disId: options.disId,
      supplierId: options.supplierId,
      userType: options.userType
    });
  },

  onShow() {
    //tabBar
    if (typeof this.getTabBar === 'function' &&
      this.getTabBar()) {
      this.getTabBar().setData({
        selected: 0
      })
    }

  
    this._login();
  },

  // 页面级别的下拉刷新处理函数
  onPullDownRefresh() {
    this.onPurchaseRefresh();
  },

  // Purchase页面刷新
  onPurchaseRefresh() {
    console.log("onPurchaseRefreshonPurchaseRefresh")
    load.showLoading("获取今日订单");
    var that = this;
    disGetTodayOrderCustomer(this.data.disId).then(res => {
      load.hideLoading();
      console.log(res.result.data)
      if (res.result.code == 0) {
        this.setData({
          nxDepArr: res.result.data.deps.nxDep,
          gbDisArr: res.result.data.deps.gbDisArr,
          gbDisArrApp: res.result.data.deps.gbDisArrApp,
          unPayCount: res.result.data.unPayCount,
          disInfo: res.result.data.disInfo,
          returnList: res.result.data.returnList,
          unPayGbBills: res.result.data.unPayGbBills,
          firstLoading: false
        })
        wx.stopPullDownRefresh()
        wx.setStorageSync('disInfo', res.result.data.disInfo);
        wx.setStorageSync('numberBooks', res.result.data.books)
        if (res.result.data.disInfo.nxDistributerBuyQuantity < 1) {
          wx.navigateTo({
            url: '../../../subPackage/pages/management/payPage/payPage?type=0',
          })
        }

        // 更新 tabBar 数据
        if (that.getTabBar()) {
        that.getTabBar().setData({
          stockCount: res.result.data.stockCount,
          stockCountOk: res.result.data.stockCountOk,
          wxCount: res.result.data.wxCount,
          wxCountOk: res.result.data.wxCountOk,
          prepareCount: res.result.data.preOrders,
          buyOrders: res.result.data.buyOrders,
          buyOrdersOk: res.result.data.buyOrdersOk,
          });
          
          // 更新 tabBar 列表（disInfo 可能已更新）
          if (typeof that.getTabBar().updateTabBarList === 'function') {
            that.getTabBar().updateTabBarList();
          }
        }
      } else {
        wx.showToast({
          title: res.result.msg,
          icon: 'none'
        })
        wx.stopPullDownRefresh()
      }
    })
  },


  _login() {
    var that = this;
    wx.login({
      success: (res) => {
        load.hideLoading();

        var disUser = {
          nxWuLoginCode: res.code,
        }
        load.showLoading("登录中")
        weighterLoginKf(disUser)
          .then((res) => {
            load.hideLoading();
            console.log(res.result.data);
            if (res.result.code !== -1) { //登陆成功（内部员工）
              // 登录成功后存储缓存
              wx.setStorageSync('userInfo', res.result.data.userInfo);
              if(res.result.data.userType == 1){
               
                wx.setStorageSync('disInfo', res.result.data.disInfo);
                this.setData({
                  userType : res.result.data.userType,
                  userInfo: res.result.data.userInfo,
                  supplierId: -1,
                  disInfo: res.result.data.disInfo
                })
                that._initPage(res.result.data.userInfo, res.result.data.disInfo);

              }else{                
                // 检查缓存中是否有供应商客户信息
                const cachedSupplierCustomer = wx.getStorageSync('supplierCustomer');
                const customerArr = res.result.data.customerArr || [];
                
                let selectedSupplierId, selectedDisId, selectedCustomerDisInfo;
                
                if (cachedSupplierCustomer && cachedSupplierCustomer.disId && cachedSupplierCustomer.supplierId) {
                  // 使用缓存的参数，从 customerArr 中找到对应的客户
                  const matchedCustomer = customerArr.find(customer => 
                    customer.nxJrdhSupplierId == cachedSupplierCustomer.supplierId &&
                    customer.nxJrdhsNxDistributerId == cachedSupplierCustomer.disId
                  );
                  
                  if (matchedCustomer) {
                    // 找到匹配的客户，使用缓存的
                    selectedSupplierId = matchedCustomer.nxJrdhSupplierId;
                    selectedDisId = matchedCustomer.nxJrdhsNxDistributerId;
                    selectedCustomerDisInfo = matchedCustomer.nxDistributerEntity;
                  } else {
                    // 缓存中的客户不在列表中，使用第一个默认的
                    if (customerArr.length > 0) {
                      selectedSupplierId = customerArr[0].nxJrdhSupplierId;
                      selectedDisId = customerArr[0].nxJrdhsNxDistributerId;
                      selectedCustomerDisInfo = customerArr[0].nxDistributerEntity;
                      
                      // 更新缓存
                      const cachedSupplierCustomer = {
                        disId: selectedDisId,
                        supplierId: selectedSupplierId,
                        userId: that.data.userId,
                        userType: res.result.data.userType
                      };
                      wx.setStorageSync('supplierCustomer', cachedSupplierCustomer);
                    }
                  }
                } else {
                  // 没有缓存，使用第一个默认的
                  if (customerArr.length > 0) {
                    selectedSupplierId = customerArr[0].nxJrdhSupplierId;
                    selectedDisId = customerArr[0].nxJrdhsNxDistributerId;
                    selectedCustomerDisInfo = customerArr[0].nxDistributerEntity;
                    
                    // 添加缓存
                    const cachedSupplierCustomer = {
                      disId: selectedDisId,
                      supplierId: selectedSupplierId,
                      userId: that.data.userId,
                      userType: res.result.data.userType
                    };
                    wx.setStorageSync('supplierCustomer', cachedSupplierCustomer);
                  }
                }
                
                this.setData({
                  userType : res.result.data.userType,
                  userInfo: res.result.data.userInfo,
                  customerArr: customerArr,
                  supplierId: selectedSupplierId,
                  disId: selectedDisId,
                  customerDisInfo: selectedCustomerDisInfo,
                  disInfo: null
                });
                

                that._initSupplierPage();
              }
          
            } else { // 登录失败

              wx.redirectTo({
                url: '../../inviteAdmin/inviteAdmin?disId=' + this.data.disId +
                 '&supplierId=' + this.data.supplierId + '&userType=' + this.data.userType + '&userId='
                  + this.data.userId,
              })
            }
          })
      },
      
      fail: (res => {
        load.hideLoading();
        wx.showModal({
          title: res.result.msg,
          showCancel: false,
          confirmText: "知道了",
        })
      })
    })


  },


  _supplierGetTodayCustomer() {
    var data = {
      disId: this.data.disId,
      supplierId: this.data.supplierId
    }
    load.showLoading("获取数据中");
    supplierGetWaitStockGoodsDeps(data).then(res => {
      load.hideLoading();
      console.log(res.result.data)
      if (res.result.code == 0) {
        this.setData({
          nxDepArr: res.result.data.nxDep,
          gbDepArr: res.result.data.gbDep
        })
        
        // 检查是否有部门被选中
        var hasSelectedDep = this._checkHasSelectedDep();
        this.setData({
          changeIds: hasSelectedDep
        })
        
        this.getTabBar().setData({
          stockCount: res.result.data.depOrdersWait,
          depCount: Number(res.result.data.nxDep.length)  + Number(res.result.data.gbDep.length) +  Number(res.result.data.requestArr.length),
          
        })
      
      } else {
        wx.showToast({
          title: res.result.msg,
          icon: 'none'
        })
      }
    })
  },

  _initSupplierPage(){

     // 主动更新 tabBar 列表（确保程序刚打开时也能正确显示）
     if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      if (typeof this.getTabBar().updateTabBarList === 'function') {
        this.getTabBar().updateTabBarList();
      }
    }

    // 供货商获取客户订单
    this._supplierGetTodayCustomer();
    
    // 检查是否有缓存的打印机设备ID，如果有则自动连接
    this.checkAndConnectPrinter();
    
    // 读取缓存的标签尺寸
    var cachedPaperSize = wx.getStorageSync('paperSize');
    if (cachedPaperSize) {
      this.setData({
        paperSize: cachedPaperSize
      });
    }

    // 设置页面尺寸
    const app = getApp();
    const navBarHeight = app.globalData.navBarHeight;
    const screenHeight = app.globalData.screenHeight;
    const screenWidth = app.globalData.screenWidth;
    const rpxRatio = 750 / screenWidth;
    const navBarHeightRpx = navBarHeight * rpxRatio;
    const viewBarHeightRpx = viewBarHeight * rpxRatio;
    const tabBarHeightRpx = 100;
    const contentHeight = (screenHeight - navBarHeight - tabBarHeight - viewBarHeight) * rpxRatio;
    console.log("godosoososso", globalData);
    // 计算侧边栏高度（屏幕高度 - 导航栏 - tabBar）
    const sidebarHeight = (screenHeight - navBarHeight - tabBarHeight) * rpxRatio;
    
    this.setData({
      contentHeight: contentHeight,
      navBarHeight: navBarHeightRpx,
      tabBarHeight: tabBarHeightRpx,
      viewBarHeight: viewBarHeightRpx,
      leftMenuWidth: 150, // 左侧菜单宽度，单位 rpx
      windowWidth: globalData.windowWidth * globalData.rpxR,
      windowHeight: globalData.windowHeight * globalData.rpxR,
      statusBarHeight: globalData.statusBarHeight * globalData.rpxR,
      navBarHeight: globalData.navBarHeight * globalData.rpxR,
      sidebarHeight: sidebarHeight, // 侧边栏高度
      url: apiUrl.server, // 设置服务器地址，用于图片路径拼接（合并到一次 setData）
    })

  },


  // 初始化页面逻辑
  _initPage(userInfo, disInfo) {
    // 设置用户信息
    this.setData({
      userInfo: userInfo,
      disId: disInfo.nxDistributerId,
      disInfo: disInfo,
      disBusinessType: disInfo.nxDistributerBusinessTypeId 
    })

    // 立即存储 disInfo 到缓存，确保 tabBar 能获取到
    if (disInfo) {
      wx.setStorageSync('disInfo', disInfo);
    }

    // 主动更新 tabBar 列表（确保程序刚打开时也能正确显示）
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      if (typeof this.getTabBar().updateTabBarList === 'function') {
        this.getTabBar().updateTabBarList();
      }
    }

    // 获取客户订单
    this._getTodayCustomer();
    
    // 检查是否有缓存的打印机设备ID，如果有则自动连接
    this.checkAndConnectPrinter();
    
    // 读取缓存的标签尺寸
    var cachedPaperSize = wx.getStorageSync('paperSize');
    if (cachedPaperSize) {
      this.setData({
        paperSize: cachedPaperSize
      });
    }

    // 设置页面尺寸
    const app = getApp();
    const navBarHeight = app.globalData.navBarHeight;
    const screenHeight = app.globalData.screenHeight;
    const screenWidth = app.globalData.screenWidth;
    const rpxRatio = 750 / screenWidth;
    const navBarHeightRpx = navBarHeight * rpxRatio;
    const viewBarHeightRpx = viewBarHeight * rpxRatio;
    const tabBarHeightRpx = 100;
    const contentHeight = (screenHeight - navBarHeight - tabBarHeight - viewBarHeight) * rpxRatio;
    console.log("godosoososso", globalData);
    // 计算侧边栏高度（屏幕高度 - 导航栏 - tabBar）
    const sidebarHeight = (screenHeight - navBarHeight - tabBarHeight) * rpxRatio;
    
    this.setData({
      contentHeight: contentHeight,
      navBarHeight: navBarHeightRpx,
      tabBarHeight: tabBarHeightRpx,
      viewBarHeight: viewBarHeightRpx,
      leftMenuWidth: 150, // 左侧菜单宽度，单位 rpx
      windowWidth: globalData.windowWidth * globalData.rpxR,
      windowHeight: globalData.windowHeight * globalData.rpxR,
      statusBarHeight: globalData.statusBarHeight * globalData.rpxR,
      navBarHeight: globalData.navBarHeight * globalData.rpxR,
      sidebarHeight: sidebarHeight, // 侧边栏高度
      url: apiUrl.server, // 设置服务器地址，用于图片路径拼接（合并到一次 setData）
    })
  },


  /**
   * 获取客户订单
   */
  _getTodayCustomer() {
    var data = {
      disId: this.data.disId,
    }
    load.showLoading("获取数据中");
    stockerGetWaitStockGoodsDeps(data).then(res => {
      load.hideLoading();
      console.log(res.result.data)
      if (res.result.code == 0) {
        this.setData({
          nxDepArr: res.result.data.nxDep,
          gbDepArr: res.result.data.gbDep,
          requestArr: res.result.data.requestArr,
        })
        
        // 检查是否有部门被选中
        var hasSelectedDep = this._checkHasSelectedDep();
        this.setData({
          changeIds: hasSelectedDep
        })
        
        this.getTabBar().setData({
          stockCount: res.result.data.depOrdersWait,
          depCount: Number(res.result.data.nxDep.length)  + Number(res.result.data.gbDep.length)  +  Number(res.result.data.requestArr.length),
          
        })
      
      } else {
        wx.showToast({
          title: res.result.msg,
          icon: 'none'
        })
      }
    })
  },

  
  toStock(){
    this.setData({
      changeIds: false
    })

  
      var nxLeg = this.data.nxDepArr.length;
      var nxIds = [];
      var nxDepName = [];
      if (nxLeg > 0) {
        var nxDepArr = this.data.nxDepArr;
        var nxUn = 0;
        for (var i = 0; i < nxDepArr.length; i++) {
          if (nxDepArr[i].isSelected) {
            nxIds.push(nxDepArr[i].nxDepartmentId);
            nxDepName.push(nxDepArr[i].nxDepartmentAttrName);
          }else{
            nxUn = Number(nxUn) + Number(1);
          }
        }
      }

      var gbLeg = this.data.gbDepArr.length;
      var gbIds = [];
      var gbDepName = [];
      if (gbLeg > 0) {
        var gbDepArr = this.data.gbDepArr;
        var gbUn = 0 ;
        for (var i = 0; i < gbDepArr.length; i++) {
          if (gbDepArr[i].isSelected) {
            gbIds.push(gbDepArr[i].gbDepartmentId);
            gbDepName.push(gbDepArr[i].gbDepartmentName);
          }else{
            gbUn = Number(gbUn) + Number(1);
          }
        }
      }

    console.log("ddd")
    console.log("gbun===", gbUn + "gblend====", gbLeg , "nxun====", nxUn, "nxlieng===", nxLeg);
    if(gbUn !== gbLeg || nxUn !== nxLeg){
      var idsChangeStock = {
        haveIds: true,
        outNxDepIds: nxIds,
        outNxDepNames: nxDepName,
        outGbDepIds: gbIds,
        outGbDepNamews: gbDepName,
      }
      wx.setStorageSync('idsChangeStock', idsChangeStock);
    }
    
    if(this.data.supplierId != -1){
      wx.navigateTo({
        url: '../catagray/catagray?supplierId='  + this.data.supplierId 
        + '&disId=' + this.data.disId,
      })
    }else{
      if(this.data.disInfo.nxDistributerBusinessTypeId < 2 ){
        wx.navigateTo({
          url: '../catagray/catagray?supplierId='  + this.data.supplierId + '&disId=' + this.data.disId,
        })
      }else{
        wx.navigateTo({
          url: '../shelf/shelf',
        })
      }
     
    }
   

  },  

  toNxDisOrders(e){
    var requestDisId = e.currentTarget.dataset.id;
    
    if(this.data.disInfo.nxDistributerBusinessTypeId < 2 ){
      wx.navigateTo({
        url: '../catagrayColl/catagrayColl?requestDisId='  + requestDisId + '&disId=' + this.data.disId
        +'&collNxDisName=' + e.currentTarget.dataset.name,
      })
    }else{
      wx.navigateTo({
        url: '../shelfColl/shelfColl?requestDisId='+ requestDisId + '&disId=' + this.data.disId  +'&collNxDisName=' + e.currentTarget.dataset.name,
      })
    }

  },


  toWaitDep(e) {
    this.setData({
      changeIds: false
    })
    wx.navigateTo({
      url: '../../../subPackage/pages/prepare/orderDepList/orderDepList?disId=' + this.data.disId 
       + '&supplierId=' + this.data.supplierId,
    })
  },


  _updateGbDep(res){
    var idsChangeStock = wx.getStorageSync('idsChangeStock');
    var depTempArr = [];
    var outGbDepIds = idsChangeStock.outGbDepIds;
    if(outGbDepIds.length > 0){
      for(var i = 0; i < outGbDepIds.length;i++){
        var id = outGbDepIds[i];
        var depArr = res.result.data.gbDep;
        if(depArr.length > 0){
          for(var j = 0; j < depArr.length; j++){
            var item  = depArr[j];
            var depId = item.gbDepartmentId;
            if(id == depId){
               item.isSelected = true;
            }
            depTempArr.push(depArr[i]);
          }
        }
        this.setData({
          gbDepArr: depTempArr
        })
      }
    }else{
      var depArr = res.result.data.gbDep;
      var depTempArrNx = [];
      if(depArr.length > 0){
        for(var j = 0; j < depArr.length; j++){
          var item  = depArr[j];
           item.isSelected = false;
           depTempArrNx.push(item);
        }
      }
      this.setData({
        gbDepArr: depTempArrNx
      })
    }

    // 检查是否有部门被选中
    var hasSelectedDep = this._checkHasSelectedDep();
    this.setData({
      changeIds: hasSelectedDep
    })
  },

  _updateNxDep(res){
    var idsChangeStock = wx.getStorageSync('idsChangeStock');
    var depTempArr = [];
    var outNxDepIds = idsChangeStock.outNxDepIds;
    console.log(idsChangeStock.outNxDepIds);
    if(outNxDepIds.length > 0){
        var depArr = res.result.data.nxDep;
        if(depArr.length > 0){
          for(var j = 0; j < depArr.length; j++){
            var item  = depArr[j];
            var depId = item.nxDepartmentId;
            for(var i = 0; i < outNxDepIds.length;i++){
              var id = outNxDepIds[i];
              if(id == depId){
                item.isSelected = true;
             }
            }
            depTempArr.push(item);
          }
        }
      
      this.setData({
        nxDepArr: depTempArr
      })
    }else{
      var depArr = res.result.data.nxDep;
      var depTempArrNx = [];
      if(depArr.length > 0){
        for(var j = 0; j < depArr.length; j++){
          var item  = depArr[j];
           item.isSelected = false;
           depTempArrNx.push(item);
        }
      }
      this.setData({
        nxDepArr: depTempArrNx
      })
    
    }

    // 检查是否有部门被选中
    var hasSelectedDep = this._checkHasSelectedDep();
    this.setData({
      changeIds: hasSelectedDep
    })

  },


  choiceDep(e) {
    var index = e.currentTarget.dataset.index;
    var type = e.currentTarget.dataset.type;
    console.log("choiceDepchoiceDep", index);
    if (type == 'nx') {
      var depData = "nxDepArr[" + index + "].isSelected";
      var sel = this.data.nxDepArr[index].isSelected;
      if (sel) {
        this.setData({
          [depData]: false
        })
      } else {
        this.setData({
          [depData]: true
        })
      }
    }

    if (type == 'gb') {
      var depData = "gbDepArr[" + index + "].isSelected";
      var sel = this.data.gbDepArr[index].isSelected;
      if (sel) {
        this.setData({
          [depData]: false
        })
      } else {
        this.setData({
          [depData]: true
        })
      }
    }

    // 检查是否有部门被选中
    var hasSelectedDep = this._checkHasSelectedDep();
    this.setData({
      changeIds: hasSelectedDep
    })
  },

  // 检查是否有部门被选中的辅助方法
  _checkHasSelectedDep() {
    var nxDepArr = this.data.nxDepArr || [];
    var gbDepArr = this.data.gbDepArr || [];
    
    // 检查nx部门是否有选中的
    for (var i = 0; i < nxDepArr.length; i++) {
      if (nxDepArr[i].isSelected) {
        return true;
      }
    }
    
    // 检查gb部门是否有选中的
    for (var i = 0; i < gbDepArr.length; i++) {
      if (gbDepArr[i].isSelected) {
        return true;
      }
    }
    
    return false;
  },

  // 已拣货客户详细
  toCarDep(e) {
    console.log("toCarDeptoCarDep");
    if(e.currentTarget.dataset.type == 'nx'){
      var depId = e.currentTarget.dataset.id;
      var name = e.currentTarget.dataset.name;
      wx.navigateTo({
        url: '../depOutOrder/depOutOrder?depFatherId=' + depId
         + '&gbDepFatherId=-1&resFatherId=-1' + '&depName=' + name,
      }) 
    }else{
      var depId = e.currentTarget.dataset.id;
      var name = e.currentTarget.dataset.name;
      wx.navigateTo({
        url: '../depOutOrder/depOutOrder?depFatherId==1&gbDepFatherId='+ depId + '&resFatherId=-1'+'&depName=' + name,
      }) 
    }
      
  },


  onNavButtonTap(){
    if(this.data.userType == 1){
      wx.navigateTo({
        url: '../../disUserEdit/disUserEdit',
      })
    }else{
      // 供货商员工，显示客户列表侧边栏
      this.setData({
        showSideBar: true,
      })
    }
  },

  // 关闭侧边栏
  closeSideBar(){
    this.setData({
      showSideBar: false
    });
  },

  // 计算侧边栏高度（减去导航栏和 tabBar）
  getSidebarHeight(){
    const navBarHeight = this.data.navBarHeight || 88;
    const tabBarHeight = 120; // tabBar 高度固定为 120rpx
    const screenHeight = getApp().globalData.screenHeight;
    const rpxRatio = 750 / getApp().globalData.screenWidth;
    const screenHeightRpx = screenHeight * rpxRatio;
    return screenHeightRpx - navBarHeight - tabBarHeight;
  },

  // 阻止事件冒泡（防止点击侧边栏内容时关闭）
  stopPropagation(){
    // 空方法，仅用于阻止事件冒泡
  },

  // 选择客户
  selectCustomer(e){
    const index = e.currentTarget.dataset.index;
    const customerArr = this.data.customerArr;
    
    if (!customerArr || index >= customerArr.length) {
      wx.showToast({
        title: '客户信息错误',
        icon: 'none'
      });
      return;
    }
    
    const selectedCustomer = customerArr[index];
    
    // 更新缓存
    const cachedSupplierCustomer = {
      disId: selectedCustomer.nxJrdhsNxDistributerId,
      supplierId: selectedCustomer.nxJrdhSupplierId,
      userId: this.data.userId,
      userType: this.data.userType
    };
    wx.setStorageSync('supplierCustomer', cachedSupplierCustomer);
    
    // 更新选中的客户信息
    this.setData({
      supplierId: selectedCustomer.nxJrdhSupplierId,
      disId: selectedCustomer.nxJrdhsNxDistributerId,
      customerDisInfo: selectedCustomer.nxDistributerEntity,
      showSideBar: false // 隐藏侧边栏
    });
    
    // 重新获取客户订单数据
    this._supplierGetTodayCustomer();
  },

  // 检查并连接打印机
  checkAndConnectPrinter() {
    var that = this;
    var app = getApp();
    
    // 先检查缓存中是否有设备信息
    var cachedDeviceInfo = wx.getStorageSync('bleDeviceInfo');
    
    // 如果没有缓存，设置为未连接
    if (!cachedDeviceInfo || !cachedDeviceInfo.deviceId) {
      that.setData({
        printOk: false
      });
      return;
    }
    
    // 恢复全局数据
    app.globalData.BLEInformation = cachedDeviceInfo;
    
    // 如果已经连接且是同一个设备，直接返回
    if (app.globalData.BLEInformation.isConnected && 
        app.globalData.BLEInformation.deviceId === cachedDeviceInfo.deviceId) {
      console.log('打印机已连接');
      that.setData({
        printOk: true
      });
      return;
    }
    
    // 尝试连接打印机
    wx.openBluetoothAdapter({
      success: function(res) {
        console.log('蓝牙适配器初始化成功');
        setTimeout(() => {
          wx.createBLEConnection({
            deviceId: cachedDeviceInfo.deviceId,
            success: function(res) {
              console.log('打印机连接成功');
              app.globalData.BLEInformation.isConnected = true;
              that.setData({
                printOk: true
              });
            },
            fail: function(err) {
              // 如果是已连接错误，认为连接成功
              if (err.errCode === 1509007 || err.errMsg.indexOf('already connect') !== -1) {
                console.log('打印机已连接（之前已连接）');
                app.globalData.BLEInformation.isConnected = true;
                that.setData({
                  printOk: true
                });
              } else {
                console.log('打印机连接失败，需要重新设置', err);
                that.setData({
                  printOk: false
                });
              }
            }
          });
        }, 500);
      },
      fail: function(err) {
        console.log('蓝牙适配器初始化失败');
        that.setData({
          printOk: false
        });
      }
    });
  },
  
  // 设置打印机
  setPrint() {
    console.log('=== setPrint 方法被调用 ===');
    var that = this;
    var app = getApp();
    
    console.log('当前 printOk 状态:', this.data.printOk);
    console.log('BLE 信息:', app.globalData.BLEInformation);
    console.log('设备ID:', app.globalData.BLEInformation && app.globalData.BLEInformation.deviceId);
    
    // 检查缓存中是否有打印机设置
    var cachedDeviceInfo = wx.getStorageSync('bleDeviceInfo');
    var cachedPaperSize = wx.getStorageSync('paperSize');
    
    if (cachedDeviceInfo && cachedDeviceInfo.deviceId) {
      console.log('缓存中有打印机设置，显示操作选择');
      // 有缓存，显示操作选择
      wx.showActionSheet({
        itemList: ['删除打印机和标签的设置', '测试打印机'],
        success: function(res) {
          console.log('用户选择了第', res.tapIndex, '个选项');
          if (res.tapIndex === 0) {
            // 删除打印机和标签的设置
            console.log('用户选择删除设置');
            wx.showModal({
              title: '确认删除',
              content: '确定要删除打印机和标签的设置吗？',
              success: function(modalRes) {
                if (modalRes.confirm) {
                  // 先获取当前连接的设备ID（优先使用全局数据中的设备ID）
                  var deviceIdToDisconnect = null;
                  if (app.globalData && app.globalData.BLEInformation && app.globalData.BLEInformation.deviceId) {
                    deviceIdToDisconnect = app.globalData.BLEInformation.deviceId;
                  } else if (cachedDeviceInfo && cachedDeviceInfo.deviceId) {
                    deviceIdToDisconnect = cachedDeviceInfo.deviceId;
                  }
                  
                  // 如果蓝牙连接已建立，先断开连接
                  if (deviceIdToDisconnect) {
                    console.log('准备断开蓝牙连接，deviceId:', deviceIdToDisconnect);
                    wx.closeBLEConnection({
                      deviceId: deviceIdToDisconnect,
                      success: function() {
                        console.log('✅ 已断开蓝牙连接');
                        // 断开连接成功后再清除缓存和重置数据
                        that._clearPrinterSettings();
                      },
                      fail: function(err) {
                        console.log('⚠️ 断开蓝牙连接失败:', err);
                        // 即使断开失败，也清除缓存和重置数据
                        that._clearPrinterSettings();
                      }
                    });
                  } else {
                    // 如果没有设备ID，直接清除缓存和重置数据
                    that._clearPrinterSettings();
                  }
                }
              }
            });
          } else if (res.tapIndex === 1) {
            // 测试打印机
            console.log('用户选择测试打印机');
            // 确保全局数据已恢复
            if (!app.globalData.BLEInformation || !app.globalData.BLEInformation.deviceId) {
              app.globalData.BLEInformation = cachedDeviceInfo;
            }
            that.setData({
              printOk: true
            });
            that.testPrint();
          }
        },
        fail: function(err) {
          console.log('用户取消选择', err);
        }
      });
    } else {
      console.log('缓存中没有打印机设置，跳转到设置页面');
      // 没有缓存，跳转到连接页面
      wx.navigateTo({
        url: '../../printer/printer',
      });
    }
  },
  
  // 清除打印机设置（内部方法）
  _clearPrinterSettings() {
    var that = this;
    var app = getApp();
    
    // 清除缓存
    wx.removeStorageSync('bleDeviceInfo');
    wx.removeStorageSync('paperSize');
    
    // 重置全局数据
    if (app.globalData && app.globalData.BLEInformation) {
      app.globalData.BLEInformation = {
        platform: "",
        deviceId: "",
        deviceName: "",
        writeCharaterId: "",
        writeServiceId: "",
        notifyCharaterId: "",
        notifyServiceId: "",
        readCharaterId: "",
        readServiceId: "",
        isConnected: false
      };
    }
    
    // 重置页面数据
    that.setData({
      printOk: false,
      paperSize: 1
    });
    
    wx.showToast({
      title: '设置已删除',
      icon: 'success'
    });
    
    console.log('✅ 打印机和标签设置已清除');
  },
  
  // 发现并缓存可写特征
  discoverAndCacheWritableChar(deviceId) {
    var that = this;
    return new Promise(function(resolve, reject) {
      console.log('开始发现服务和特征...');
      
      wx.getBLEDeviceServices({
        deviceId: deviceId,
        success: function(res) {
          console.log('获取服务列表成功:', res);
          var services = res.services || [];
          
          // 优先找含 FFF0、FFF2、180F 的服务
          var targetServices = services.filter(function(s) {
            return /fff0/i.test(s.uuid) || /ffe0/i.test(s.uuid) || /180f/i.test(s.uuid) || /fff2/i.test(s.uuid);
          });
          
          var service = targetServices[0] || services[0];
          
          if (!service) {
            reject(new Error('未发现可用服务'));
            return;
          }
          
          console.log('选择服务:', service.uuid);
          
          wx.getBLEDeviceCharacteristics({
            deviceId: deviceId,
            serviceId: service.uuid,
            success: function(chrRes) {
              console.log('获取特征列表成功:', chrRes);
              var chs = chrRes.characteristics || [];
              
              // 优先选择 writeNoResponse，其次 write
              var writable = null;
              for (var i = 0; i < chs.length; i++) {
                if (chs[i].properties.writeNoResponse) {
                  writable = chs[i];
                  console.log('找到 writeNoResponse 特征:', writable.uuid);
                  break;
                }
              }
              
              if (!writable) {
                for (var i = 0; i < chs.length; i++) {
                  if (chs[i].properties.write) {
                    writable = chs[i];
                    console.log('找到 write 特征:', writable.uuid);
                    break;
                  }
                }
              }
              
              if (!writable) {
                reject(new Error('未发现可写特征'));
                return;
              }
              
              // 找一个 notify 特征备用
              var notifyChar = null;
              for (var i = 0; i < chs.length; i++) {
                if (chs[i].properties.notify) {
                  notifyChar = chs[i];
                  console.log('找到 notify 特征:', notifyChar.uuid);
                  break;
                }
              }
              
              // 更新全局数据
              var app = getApp();
              app.globalData.BLEInformation.writeServiceId = service.uuid;
              app.globalData.BLEInformation.writeCharaterId = writable.uuid;
              
              if (notifyChar) {
                app.globalData.BLEInformation.notifyCharaterId = notifyChar.uuid;
                app.globalData.BLEInformation.notifyServiceId = service.uuid;
              }
              
              // 更新缓存
              wx.setStorageSync('bleDeviceInfo', app.globalData.BLEInformation);
              
              console.log('特征发现完成，可写特征ID:', writable.uuid);
              
              resolve({
                serviceId: service.uuid,
                writeCharId: writable.uuid,
                notifyCharId: notifyChar ? notifyChar.uuid : null
              });
            },
            fail: reject
          });
        },
        fail: reject
      });
    });
  },
  
  // 确保 notify 已开启
  ensureNotifyEnabled(deviceId, serviceId, notifyCharId) {
    if (!notifyCharId) {
      console.log('没有 notify 特征，跳过开启');
      return Promise.resolve();
    }
    
    return new Promise(function(resolve, reject) {
      console.log('尝试开启 notify...');
      wx.notifyBLECharacteristicValueChange({
        deviceId: deviceId,
        serviceId: serviceId,
        characteristicId: notifyCharId,
        state: true,
        success: function() {
          console.log('notify 开启成功');
          resolve();
        },
        fail: function(e) {
          console.log('notify 开启失败，继续:', e);
          resolve(); // 即使失败也继续
        }
      });
    });
  },
  
  // 测试打印
  testPrint() {
    console.log('=== testPrint 方法开始执行 ===');
    var that = this;
    var app = getApp();
    
    console.log('检查蓝牙连接状态...');
    
    // 先确保蓝牙连接
    wx.showLoading({
      title: '连接打印机...',
    });
    
    wx.openBluetoothAdapter({
      success: function(res) {
        console.log('蓝牙适配器初始化成功');
        setTimeout(() => {
          wx.createBLEConnection({
            deviceId: app.globalData.BLEInformation.deviceId,
            success: function(res) {
              console.log('重新连接打印机成功');
              
              // 发现并缓存可写特征
              that.discoverAndCacheWritableChar(app.globalData.BLEInformation.deviceId)
                .then(function(result) {
                  console.log('特征发现成功:', result);
                  
                  // 开启 notify（如果存在）
                  return that.ensureNotifyEnabled(
                    app.globalData.BLEInformation.deviceId,
                    result.serviceId,
                    result.notifyCharId
                  );
                })
                .then(function() {
                  console.log('准备开始打印');
                  wx.hideLoading();
                  that.doTSCPrint();
                })
                .catch(function(e) {
                  console.error('发现特征/开启notify失败:', e);
                  wx.hideLoading();
                  wx.showToast({
                    title: '打印机特征发现失败，请重试',
                    icon: 'none'
                  });
                });
            },
            fail: function(err) {
              console.error('重新连接打印机失败:', err);
              wx.hideLoading();
              wx.showToast({
                title: '打印机连接失败，请重新设置',
                icon: 'none'
              });
            }
          });
        }, 500);
      },
      fail: function(err) {
        console.error('蓝牙适配器初始化失败:', err);
        wx.hideLoading();
        wx.showToast({
          title: '请打开蓝牙',
          icon: 'none'
        });
      }
    });
  },
  
  // 执行TSC打印
  doTSCPrint() {
    console.log('=== doTSCPrint 方法开始执行 ===');
    var that = this;
    var app = getApp();
    
    // 获取分销商信息
    var disInfo = this.data.disInfo;
    var printContent = disInfo && disInfo.nxDistributerName 
      ? disInfo.nxDistributerName 
      : '打印机连接成功';
    
    console.log('分销商信息:', disInfo);
    console.log('打印内容:', printContent);
    
    // 使用TSC命令打印（标签打印机）
    console.log('加载 TSC 模块');
    var tsc = require("../../../utils/GPutils/tsc.js").jpPrinter;
    var command = tsc.createNew();
    console.log('创建 TSC 命令对象成功');
    
    // 获取标签尺寸
    var paperSizeMM = that.getPaperSizeMM();
    console.log('使用标签尺寸:', paperSizeMM.width, 'x', paperSizeMM.height, 'mm');
    
    // 设置标签大小
    command.setSize(paperSizeMM.width, paperSizeMM.height);
    // 设置间隙
    command.setGap(0);
    // 清除
    command.setCls();
    // 设置文本 - 打印分销商名称
    command.setText(0, 30, "TSS24.BF2", 0, 1, 1, printContent);
    // 打印
    command.setPagePrint();
    console.log('TSC 命令配置完成');
    
    // 获取打印数据
    var buff = command.getData();
    console.log('打印数据生成成功，长度:', buff.length);
    
    // 发送打印数据
    console.log('调用 sendPrintData 发送数据');
    this.sendPrintData(buff);
  },
  
      // 延迟函数
      delay(ms) {
        return new Promise(function(resolve) {
          setTimeout(resolve, ms);
        });
      },
      
      // 发送打印数据（改进版）
      async reliableSendPrintData(buff) {
        console.log('=== reliableSendPrintData 方法开始执行 ===');
        console.log('数据长度:', buff.length);
        
        var that = this;
        var app = getApp();
        var deviceId = app.globalData.BLEInformation.deviceId;
        var writeServiceId = app.globalData.BLEInformation.writeServiceId;
        var writeCharaterId = app.globalData.BLEInformation.writeCharaterId;
        
        // 校验
        if (!deviceId || !writeServiceId || !writeCharaterId) {
          console.error('缺少必要的特征信息');
          wx.showToast({
            title: '未找到可写特征，请重连打印机',
            icon: 'none'
          });
          return;
        }
        
        console.log('设备ID:', deviceId);
        console.log('写入特征ID:', writeCharaterId);
        
        var oneTime = 20;
        var total = Math.ceil(buff.length / oneTime);
        console.log('分包数量:', total);
        
        for (var i = 0; i < total; i++) {
          var start = i * oneTime;
          var end = Math.min(start + oneTime, buff.length);
          var size = end - start;
          
          if (size <= 0) {
            console.log('跳过空包');
            continue;
          }
          
          console.log('发送第', i + 1, '包，大小:', size);
          
          // 创建数据包
          var buf = new ArrayBuffer(size);
          var view = new DataView(buf);
          for (var j = 0; j < size; j++) {
            view.setUint8(j, buff[start + j]);
          }
          
          // 发送数据包
          try {
            await new Promise(function(resolve, reject) {
              wx.writeBLECharacteristicValue({
                deviceId: deviceId,
                serviceId: writeServiceId,
                characteristicId: writeCharaterId,
                value: buf,
                success: function(res) {
                  console.log('数据包发送成功');
                  resolve(res);
                },
                fail: reject
              });
            });
          } catch (e) {
            console.error('发送失败:', e);
            throw e;
          }
          
          // 每包延时 15ms（iOS 更稳）
          if (i < total - 1) {
            await that.delay(15);
          }
        }
        
        console.log('所有数据发送完成');
        wx.showToast({
          title: '打印完成',
          icon: 'success'
        });
      },
      
      // 发送打印数据（旧版兼容）
      sendPrintData(buff) {
        console.log('调用 reliableSendPrintData');
        this.reliableSendPrintData(buff);
      },
      
      // 设置标签尺寸
      setPaperSize() {
        var that = this;
        wx.showActionSheet({
          itemList: ['4*3cm（横）', '4*6cm（竖）', '5*8cm（竖）', '5*8cm（横）'],
          success: function(res) {
            var selectedSize = res.tapIndex + 1;
            that.setData({
              paperSize: selectedSize
            });
            wx.setStorageSync('paperSize', selectedSize);
            console.log('标签尺寸设置为:', selectedSize);
          }
        });
      },
      
      // 获取标签尺寸（宽，高，单位mm）
      getPaperSizeMM() {
        var size = this.data.paperSize;
        var sizes = {
          1: { width: 40, height: 32 },  // 4*3cm
          2: { width: 40, height: 62 },  // 4*6cm
          3: { width: 50, height: 82 },  // 5*8cm 竖
          4: { width: 80, height: 52 }   // 5*8cm 横
        };
        return sizes[size] || sizes[1];
      }

})
