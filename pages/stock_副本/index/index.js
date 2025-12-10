const globalData = getApp().globalData;
var load = require('../../../lib/load.js');
let scrollDdirection = 0; // 用来计算滚动的方向

const tabBarHeight = 50; // 根据实际情况调整
const viewBarHeight = 60;

import apiUrl from '../../../config.js'

import {
 
  stockerGetStockGoods,
  stokerGetToStockGoodsWithDepIds, 
  stockerGetStockGoodsKf,
  stockerGetShelfList,
  stockerGetStockGoodsKfPage,
  stockerGetToStockGoodsWithDepIdsKf,
  giveOrderWeightListForStockAndFinish,
  giveOrderWeightListForStockShelfGoods
} from '../../../lib/apiDepOrder'

import {
  disLoginKf
} from '../../../lib/apiDistributer'

Component({
  data:{
      // 左侧：所有货架
  shelfArr: [],         // List<NxDistributerGoodsShelfEntity>
  // 右侧：当前货架页商品
  shelfGoodsArr: [],    // List<NxRetailerGoodsShelfGoodsEntity>
  // 分页参数
  currentPage: 1,
  limit: 15,            // 或者你喜欢的每页条数
  totalPages: 1,
  isLoading: false,
  selectedShelfId: '',  // 当前选中的货架ID
  positionId: '',       // 右侧滚动定位ID
  hasSelectedCustomer: false, // 是否有选择客户
  printOk: false,      // 打印机是否已连接
  },

  pageLifetimes: {

    show() {
     

      const app = getApp();
      const navBarHeight = app.globalData.navBarHeight;
      const screenHeight = app.globalData.screenHeight;
      const screenWidth = app.globalData.screenWidth;
      const rpxRatio = 750 / screenWidth;
      const navBarHeightRpx = navBarHeight * rpxRatio;
      const contentHeight = (screenHeight - navBarHeight  ) * rpxRatio;

      this.setData({ 
        contentHeight: contentHeight,
        navBarHeight: navBarHeightRpx,
        leftMenuWidth: 150, // 左侧菜单宽度，单位 rpx
      });

      // 检查蓝牙连接状态
      var printOk = false;
      if (app && app.BLEInformation) {
        printOk = app.BLEInformation.deviceId ? true : false;
      }

      this.setData({
        windowWidth: globalData.windowWidth * globalData.rpxR,
        windowHeight: globalData.windowHeight * globalData.rpxR,
        statusBarHeight: globalData.statusBarHeight * globalData.rpxR,
        url: apiUrl.server,
        scrollViewTop: 0,
        selectedSub: 0, // 选中的分类
        scrollHeight: 0, // 滚动视图的高度
        toView: 'position0', // 滚动视图跳转的位置
        scrollTopLeft: 0, //  左边滚动位置随着右边分类而滚动
        outNxDepIds: [],
        outNxDepNames: [],
        outGbDepIds: [],
        outGbDepNames: [],
        hasSelectedCustomer: false, // 初始化客户选择状态
        printOk: printOk // 打印机连接状态
      })

      var value = wx.getStorageSync('userInfo');
      if (value) {
        this.setData({
          userInfo: value,
          disId: value.nxDistributerEntity.nxDistributerId,
        })
        var disValue = wx.getStorageSync('disInfo');
        if (disValue) {
          this.setData({
            disInfo: disValue,
          })
        }

        var idsChangeStock = wx.getStorageSync('idsChangeStock');

        if (idsChangeStock) {
          const hasNxDepIds = idsChangeStock.outNxDepIds && idsChangeStock.outNxDepIds.length > 0;
          const hasGbDepIds = idsChangeStock.outGbDepIds && idsChangeStock.outGbDepIds.length > 0;
          const hasSelectedCustomer = hasNxDepIds || hasGbDepIds;
          
          this.setData({
            outNxDepIds: idsChangeStock.outNxDepIds || [],
            outGbDepIds: idsChangeStock.outGbDepIds || [],
            outNxDepNames: idsChangeStock.outNxDepNames || [],
            outGbDepNames: idsChangeStock.outGbDepNames || [],
            hasSelectedCustomer: hasSelectedCustomer
          })
          this._initNxDataKf();
         
        } else {
          // 确保没有客户选择时状态正确
          this.setData({
            hasSelectedCustomer: false
          })
        }
      }
    },
  },


  methods: {

    changeShowType(){
      if(this.data.showType == 'shelf'){
        this.setData({
        showType: 'type'
        })
      
      }else{
        this.setData({
          showType: 'shelf'
        })
      }

      if (this.data.outNxDepIds.length > 0 || this.data.outGbDepIds.length > 0) {
        this._initNxDataKf();
       
      } 
    },


  
    _initData() {
      console.log("aa")
      var that = this;
      load.showLoading("获取数据")
      var data = {
        disId: this.data.disId,
      }
      stockerGetStockGoods(data).then(res => {
        load.hideLoading();
        console.log("stock", res.result.data);
        if (res.result.code == 0) {
          this.setData({
            grandList: res.result.data.grandArr,
            waitDepNx: res.result.data.waitDepNx,         
            depOrdersWait: res.result.data.depOrdersWait,
            stockCountOk: res.result.data.stockCountOk,
          })

          that.getTabBar().setData({
            stockCount: res.result.data.stockCount,
            stockCountOk: res.result.data.stockCountOk,
            
          })

         
          that.lisenerScroll();

        } else {
          this.setData({
            goodsList: [],
            grandList: [],
            outNxDepIds: [],
            outNxDepNames: [],
            outGbDepIds: [],
            outGbDepNames: [],
          })
          wx.removeStorageSync('idsChangeStock');
          wx.showToast({
            title: res.result.msg,
            icon: 'none'
          })
        }
      })
    },
    
    _initShelf() {
      // 1. 先拉左侧所有货架
      stockerGetShelfList(this.data.disInfo.nxDistributerId).then(res => {
        if (res.result.code === 0) {
          const shelfList = res.result.data || [];
          if (shelfList.length > 0) {
            this.setData({
              shelfArr: shelfList,
              selectedShelfId: shelfList[0].nxDistributerGoodsShelfId,
              currentPage: 1,
              shelfGoodsArr: []
            }, () => {
              // 2. 拉第一个货架的商品
              this._loadShelfGoodsPage(true);
            });
          }
        }
      });
    },
    
    _loadShelfGoodsPage(isRefresh = false, callback) {
      if (this.data.isLoading) return;
      this.setData({ isLoading: true });
      load.showLoading("获取货架商品…");
    
      // 拿到当前选中的 shelfId
      const shelfId = this.data.selectedShelfId;
    
      const params = {
        disId: this.data.disInfo.nxDistributerId,
        shelfId: shelfId,
        page: this.data.currentPage,
        limit: this.data.limit
      };
    
      stockerGetStockGoodsKfPage(params).then(res => {
        load.hideLoading();
        this.setData({ isLoading: false });
    
        if (res.result.code !== 0) {
          return wx.showToast({ title: res.result.msg, icon: 'none' });
        }
    
        const pageData = res.result.page || {};
        const list = pageData.list || [];
        const total = pageData.totalCount || 0;
        const pages = pageData.totalPage || 1;

        // 生成 viewId
        const base = isRefresh ? 0 : this.data.shelfGoodsArr.length;
        list.forEach((item, idx) => {
          item.viewId = 'shelf_' + (base + idx);
        });
    
        // 如果是刷新，直接替换；否则追加
        const merged = isRefresh ? list : this.data.shelfGoodsArr.concat(list);
    
        this.setData({
          shelfGoodsArr: merged,
          totalPages: pages
        }, () => {
          // 确保商品列表中的商品与当前选中的货架对应
          const target = merged.find(g => g.nxDgsgShelfId === shelfId);
          if (target) {
            this.setData({
              positionId: target.viewId
            });
          }
          
          if (typeof callback === 'function') {
            setTimeout(callback, 50);
          }
        });
      });
    },
    
    
    _resetAllShelfData() {
      this.setData({
        shelfArr: [],
        depOrdersWait: [],
        stockCountOk: [],
        outNxDepIds: [],
        outNxDepNames: [],
        outGbDepIds: [],
        outGbDepNames: []
      });
      wx.removeStorageSync('idsChangeStock');
    },

    loadMoreShelf() {
      if (this.data.isLoading) return;
      if (this.data.currentPage >= this.data.totalPages) {
        return wx.showToast({ title: '没有更多架子了', icon: 'none' });
      }
    
      const nextPage = this.data.currentPage + 1;
      this.setData({ isLoading: true, currentPage: nextPage });
      load.showLoading("加载更多中…");
      
      const params = {
        disId: this.data.disInfo.nxDistributerId,
        page: nextPage,
        limit: this.data.limit
      };
    
      stockerGetStockGoodsKfPage(params).then(res => {
        load.hideLoading();
        this.setData({ isLoading: false });
    
        if (res.result.code === 0) {
          const list = res.result.page.list || [];
          // 追加到已渲染列表
          this.setData({
            shelfGoodsArr: this.data.shelfGoodsArr.concat(list)
          });
          // 追加后可重新计算滚动或渲染
          // this.lisenerScrollShelf();
        } else {
          wx.showToast({ title: res.result.msg, icon: 'none' });
        }
      });
    },
    
    _initNxDataKf() {
      var that = this;
      var nxL = this.data.outNxDepIds.length;
      var nxids = 0;
      if (nxL > 0) {
        nxids = this.data.outNxDepIds;
      }
      var gbL = this.data.outGbDepIds.length;
      var gbids = 0;
      if (gbL > 0) {
        gbids = this.data.outGbDepIds;
      }
      var data = {
        nxDepIds: nxids,
        gbDepIds: gbids,
        nxDisId: this.data.disId,
      }
      console.log("nxnxnxnnxnxnxnxnnxnxnaaaa");
      load.showLoading("获取数据中");
      stockerGetToStockGoodsWithDepIdsKf(data).then(res => {
        load.hideLoading();
        console.log("stockerGetToStockGoodsWithDepIdsKf",res.result.data);
        if (res.result.code == 0) {
          this.setData({    
            shelfArr: res.result.data.shelfArr,
          })
          if(res.result.data.shelfArr.length == 0){
            
            wx.removeStorageSync('idsChangeStock');
            wx.navigateBack({delta: 1})
          }
        
        } else {
          this.setData({
            goodsList: [],
            shelfArr: [],
            outNxDepIds: [],
            outNxDepNames: [],
            outGbDepIds: [],
            outGbDepNames: [],
          })
        }
      })
    },
   

    _initNxData() {
      var that = this;
      var nxL = this.data.outNxDepIds.length;
      var nxids = 0;
      if (nxL > 0) {
        nxids = this.data.outNxDepIds;
      }
      var gbL = this.data.outGbDepIds.length;
      var gbids = 0;
      if (gbL > 0) {
        gbids = this.data.outGbDepIds;
      }
      var data = {
        nxDepIds: nxids,
        gbDepIds: gbids,
        nxDisId: this.data.disId,
      }

      load.showLoading("获取数据中");
      stokerGetToStockGoodsWithDepIds(data).then(res => {
        load.hideLoading();
        if (res.result.code == 0) {
          console.log(res.result.data)
          this.setData({
            grandList: res.result.data.grandArr,
            waitDepNx: res.result.data.waitDepNx,
            waitDepGb: res.result.data.waitDepGb,
            depOrdersWait: res.result.data.depOrdersWait,
            idDepOrdersWait: res.result.data.idDepOrdersWait,
            stockCountOk: res.result.data.stockCountOk,
              
          })
          if(res.result.data.grandArr.length == 0){
            console.log("resgrandarrr", res.result.data.grandArr.length);
            that.setData({
              outNxDepNames: [],
              outNxDepIds: [],
              outGbDepIds:[],
              outGbDepNames: [],
            })
            wx.removeStorageSync('idsChangeStock');
            that._initData();
          }

          that.getTabBar().setData({
            stockCount: res.result.data.stockCount,
            stockCountOk: res.result.data.stockCountOk,
            })

          that.lisenerScroll();
        
        } else {
          this.setData({
            goodsList: [],
            grandList: [],
            outNxDepIds: [],
            outNxDepNames: [],
            outGbDepIds: [],
            outGbDepNames: [],
          })
        }
      })
    },

    

    toBack(){
      wx.navigateBack({delta: 1});
    },

    toStock(){
      // 跳转到出库页面
      wx.navigateTo({
        url: '../stock/stock?disId=' + this.data.disId
      });
    },
    
    /**
     * 获取右边每个分类的头部偏移量
     */
    lisenerScroll() {
      // 获取各分类容器距离顶部的距离
      new Promise(resolve => {
        let query = wx.createSelectorQuery();
        for (let i in this.data.grandList) {
          query.select(`#position${i}`).boundingClientRect();
        }
        query.exec(function (res) {
          resolve(res);
        });
      }).then(res => {
        this.data.grandList.forEach((item, index) => {
          item.offsetTop = res[index].top
        })
        this.setData({
          scrollInfo: res,
          grandList: this.data.grandList
        })
      });
    },


    /**
     * 跳转滚动条位置
     */
    toScrollView(e) {
      // const {
      //   selectedSub
      // } = this.data
      const {
        index
      } = e.currentTarget.dataset
      console.log(index);
      console.log("toScoroviewwwww");
      let left_ = 0
      if (index > 3) {
        left_ = (index - 3) * 50 // 左边侧栏item高度为50，可以根据自己的item高度设置
      }
      this.setData({
        selectedSub: index,
        toView: `position${index}`,
        scrollTopLeft: left_
      })
    },

    toScrollViewShelf(e) {
      const { index } = e.currentTarget.dataset;
      const shelfId = this.data.shelfArr[index].nxDistributerGoodsShelfId;
      
      // 先检查当前货架的商品是否已加载
      const existingGoods = this.data.shelfGoodsArr.filter(g => g.nxDgsgShelfId === shelfId);
      
      if (existingGoods.length > 0) {
        // 如果商品已加载，直接滚动到对应位置
        const target = existingGoods[0];
        this.setData({ 
          selectedShelfId: shelfId,
          positionId: target.viewId
        });
      } else {
        // 如果商品未加载，才需要请求网络
        this.setData({ 
          selectedShelfId: shelfId,
          currentPage: 1,
          shelfGoodsArr: []
        });

        const tryScroll = () => {
          const target = this.data.shelfGoodsArr.find(g => 
            g.nxDgsgShelfId === shelfId
          );
          
          if (target) {
            this.setData({ 
              positionId: target.viewId
            });
          }
          else if (this.data.currentPage < this.data.totalPages) {
            // 补页再试
            this.setData({ currentPage: this.data.currentPage + 1 }, () => {
              this._loadShelfGoodsPage(false, tryScroll);
            });
          }
          else {
            wx.showToast({ title: '该货架暂无商品', icon: 'none' });
          }
        };

        // 加载第一页
        this._loadShelfGoodsPage(true, tryScroll);
      }
    },

    
    showIsOutShelf(e){
      console.log("showIsOutshowIsOut");
      var item = e.currentTarget.dataset.item.nxDistributerGoodsEntity;
      var arr = item.nxDepartmentOrdersEntities;
      var temp = [];
      for(var i = 0; i < arr.length; i++){
        var order = arr[i];
        order.hasChoice = true;
        temp.push(order);
      }
      item.nxDepartmentOrdersEntities = temp;

      // 找到对应的货架索引
      const shelfId = item.nxDgsgShelfId;
      const shelfIndex = this.data.shelfArr.findIndex(shelf => shelf.nxDistributerGoodsShelfId === shelfId);
      
      if (shelfIndex !== -1) {
        // 计算左侧滚动位置
        let left_ = 0;
        if (shelfIndex > 3) {
          left_ = (shelfIndex - 3) * 50;
        }
        
        // 更新选中状态和滚动位置
        this.setData({
          selectedSub: shelfIndex,
          scrollTopLeft: left_
        });
      }

      this.setData({
        showDisOutGoods: true,
        item: item,
      })
    },

    showIsOut(e) {
      var item = e.currentTarget.dataset.item;
      var arr = item.nxDepartmentOrdersEntities;
      var temp = [];
      for(var i = 0; i < arr.length; i++){
        var order = arr[i];
        order.hasChoice = true;
        temp.push(order);
      }
      item.nxDepartmentOrdersEntities = temp;
      this.setData({
        showDisOutGoods: true,
        item: item,
      })
    },


    confirm(e) {
      var that = this;
      var arrNeed = e.detail.item.nxDepartmentOrdersEntities;
      var arr = [];
      
      // 收集客户名称用于打印
      var customerNames = [];
      
      if (arrNeed.length > 0) {
        for (var i = 0; i < arrNeed.length; i++) {
          var weightValue = arrNeed[i].nxDoWeight;
          var choice = arrNeed[i].hasChoice;
          if (weightValue !== null && weightValue > 0 && choice) {
            arrNeed[i].nxDoPickUserId = this.data.userInfo.nxDistributerUserId;
            console.log("useriid", arrNeed[i].nxDoPickerUserId)
            arr.push(arrNeed[i]);
            
            // 收集客户名称
            if (arrNeed[i].gbDepartmentEntity !== null) {
              var gbName = arrNeed[i].gbDepartmentEntity.gbDepartmentAttrName;
              if (gbName && customerNames.indexOf(gbName) === -1) {
                customerNames.push(gbName);
              }
            } else if (arrNeed[i].nxDepartmentEntity !== null) {
              var nxName = arrNeed[i].nxDepartmentEntity.nxDepartmentAttrName;
              if (nxName && customerNames.indexOf(nxName) === -1) {
                customerNames.push(nxName);
              }
            } else if (arrNeed[i].nxRestrauntEntity !== null) {
              var restName = arrNeed[i].nxRestrauntEntity.nxRestrauntAttrName;
              if (restName && customerNames.indexOf(restName) === -1) {
                customerNames.push(restName);
              }
            }
          }
        }
      }

      if (arr.length > 0) {
        load.showLoading("保存数据中");
        giveOrderWeightListForStockShelfGoods(arr).then(res => {
          load.hideLoading();
          if (res.result.code == 0) { 
            console.log("zoahsuishsissiisiisisisiisi");
            console.log(that.data.outNxDepIds, " a" , that.data.showType);
            
            // 打印订单信息
            if (customerNames.length > 0) {
              that.printCustomers(arr);  // 传入完整的订单数组
            }
            
            that._initNxDataKf();
          }else{
            wx.showToast({
              title: 'res.result.msg',
              icon: 'none'
            })
          }
        })
      }
    },


    toWaitDep(e) {
      console.log("ddd")
      wx.setStorageSync('showType', this.data.showType);
      wx.navigateTo({
        url: '../../../subPackage/pages/prepare/orderDepList/orderDepList?disId=' + this.data.disId ,
      })
    },


    toEditHome() {
      wx.setStorageSync('showType', this.data.showType);
      if(this.data.userInfo.nxDiuAdmin == 0){
        wx.navigateTo({
          url: '../../../subPackage/pages/mangement/homePage/homePage',
        })
      }
     
    },

    toLand() {
      wx.setStorageSync('showType', this.data.showType);
      wx.navigateTo({
        url: '../../../subPackage/pages/prepare/land/land',
      })

    },



    toPrint() {
      console.log("toproiint");
      wx.setStorageSync('showType', this.data.showType);
      wx.navigateTo({
        url: '../../../subPackage/pages/prepare/preparePrint/preparePrint?disId=' + this.data.disId ,
      })
    },


    toWeightPage() {
      wx.setStorageSync('showType', this.data.showType);
      wx.navigateTo({
        url: '../../../subPackage/pages/prepare/weightPage/weightPage?disId=' + this.data.disId 
      })
    },

    onNavButtonTap() {
      console.log("ddd")
      wx.navigateTo({
        url: '../../../subPackage/pages/management/homePage/homePage',
      })
     },

    // 设置打印机
    setPrint() {
      // 检查是否有缓存的客户信息
      var cachedCustomers = wx.getStorageSync('cachedCustomers') || [];
      
      if (cachedCustomers.length > 0) {
        // 如果有缓存的客户，打印测试
        wx.showToast({
          title: '正在测试打印...',
          icon: 'loading',
          duration: 1000
        });
        
        // 延迟一下再打印
        setTimeout(() => {
          this.printCustomers(cachedCustomers);
        }, 1000);
      } else {
        wx.showToast({
          title: '暂无客户信息',
          icon: 'none'
        });
      }
      
      // 跳转到打印机连接页面
      wx.navigateTo({
        url: '../../printer/printer',
      });
    },

    // 打印订单信息
    printCustomers(orderArray) {
      console.log('printCustomers 被调用，订单数量:', orderArray.length, '订单数据:', orderArray);
      var that = this;
      
      // 检查蓝牙是否已连接
      var app = getApp();
      console.log('检查蓝牙信息，BLEInformation:', app.globalData.BLEInformation);
      if (!app.globalData.BLEInformation || !app.globalData.BLEInformation.deviceId) {
        console.error('蓝牙未连接或设备ID不存在');
        wx.showToast({
          title: '请先连接打印机',
          icon: 'none'
        });
        return;
      }
      
      console.log('=== 打印流程开始 ===');
      console.log('订单信息:', orderArray);
      console.log('当前 BLE 信息:', app.globalData.BLEInformation);
      
      // 先初始化蓝牙适配器
      console.log('步骤1: 显示加载提示');
      wx.showLoading({
        title: '连接打印机...',
      });
      
      console.log('步骤2: 初始化蓝牙适配器');
      wx.openBluetoothAdapter({
        success: function(res) {
          console.log('步骤3: 蓝牙适配器初始化成功');
          // 等待一下再连接
          setTimeout(() => {
            console.log('步骤4: 开始创建蓝牙连接，设备ID:', app.globalData.BLEInformation.deviceId);
            wx.createBLEConnection({
              deviceId: app.globalData.BLEInformation.deviceId,
              success: function(res) {
                console.log('步骤5: 蓝牙连接成功');
                console.log('步骤6: 开始发现服务和特征值');
                // 发现服务和特征值
                that.discoverAndCacheWritableChar(orderArray);
              },
              fail: function(err) {
                // 如果是已连接错误，直接使用现有连接
                if (err.errCode === 1509007 || err.errMsg.indexOf('already connect') !== -1) {
                  console.log('步骤5: 设备已连接，直接使用现有连接');
                  console.log('步骤6: 开始发现服务和特征值');
                  app.globalData.BLEInformation.isConnected = true;
                  // 发现服务和特征值
                  that.discoverAndCacheWritableChar(orderArray);
                } else {
                  console.error('步骤5失败: 蓝牙连接失败:', err);
                  wx.hideLoading();
                  wx.showModal({
                    title: '提示',
                    content: '打印机连接失败，请重新设置打印机',
                    confirmText: '去设置',
                    success: function(res) {
                      if (res.confirm) {
                        wx.navigateTo({
                          url: '../../printer/printer',
                        });
                      }
                    }
                  });
                }
              }
            });
          }, 500);
        },
        fail: function(err) {
          console.error('步骤3失败: 蓝牙适配器初始化失败:', err);
          wx.hideLoading();
          wx.showToast({
            title: '请打开蓝牙',
            icon: 'none'
          });
        }
      });
    },
    
    // 执行打印
    doPrint(orderArray) {
      console.log('doPrint 开始执行，订单数量:', orderArray.length);
      var that = this;
      var app = getApp();
      
      // 检查特征值
      console.log('设备信息:', app.globalData.BLEInformation);
      if (!app.globalData.BLEInformation.writeCharaterId || !app.globalData.BLEInformation.writeServiceId) {
        console.error('缺少特征值信息');
        console.log('writeCharaterId:', app.globalData.BLEInformation.writeCharaterId);
        console.log('writeServiceId:', app.globalData.BLEInformation.writeServiceId);
        wx.showToast({
          title: '打印机特征值缺失，请重新设置',
          icon: 'none'
        });
        return;
      }

      // 使用TSC命令打印（标签打印机）
      var tsc = require("../../../utils/GPutils/tsc.js").jpPrinter;
      var command = tsc.createNew();
      
      // 获取标签尺寸（高度已减去2mm间隙）
      var cachedPaperSize = wx.getStorageSync('paperSize') || 1;
      var sizes = {
        1: { width: 40, height: 30 },  // 32-2=30
        2: { width: 40, height: 60 },  // 62-2=60
        3: { width: 50, height: 80 }   // 82-2=80
      };
      var paperSizeMM = sizes[cachedPaperSize] || sizes[1];
      console.log('使用标签尺寸:', paperSizeMM.width, 'x', paperSizeMM.height, 'mm');
      
      // 根据标签尺寸调整参数
      var isVertical = (paperSizeMM.height >= 60);
      
      // 设置标签大小
      command.setSize(paperSizeMM.width, paperSizeMM.height);
      
      // 设置间隙（大多数间隙纸需要 >=2mm）
      command.setGap(2);
      
      // 设置方向
      command.setDirection(0);  // 使用方向0
      
      // 设置参考点
      command.setReference(0, 0);
      // 清除
      command.setCls();
      
      // 根据标签尺寸设置字体和位置
      var fontName = "TSS24.BF2";
      var scale = 2;  // 默认中尺寸和大尺寸
      var rotation = 0;  // 默认不旋转
      var startX = 0;
      var startY = 0;
      var lineHeight = 30;
      
      // DPI计算（203dpi标签机）
      var DPI = 203;
      var DPMM = DPI / 25.4;  // 点/mm
      var FONT_BASE = 24;
      var LINE_SP = 1.10;  // 行间距倍数
      
      // 根据标签尺寸调整 scale 和 startY
      if (paperSizeMM.height <= 30) {
        // 小标签 4*3cm
        scale = 3;
        rotation = 0;
        startX = Math.floor(2 * DPMM);  // 左边距2mm
        startY = Math.floor(2 * DPMM);  // 上边距2mm
        lineHeight = 80;
      } else if (isVertical) {
        // 竖版标签（4*6cm 和 5*8cm）- 使用rotation=270（参考安卓代码）
        scale = 2;
        rotation = 270;  // 旋转270度（Android用ROTATION_270）
        // 竖版布局：x改变（水平三列），y固定（垂直方向）
        // 根据高度设置y坐标
        if (paperSizeMM.height === 60) {
          // 4*6cm 竖版
          startY = 440;  // 参考安卓代码
        } else if (paperSizeMM.height === 80) {
          // 5*8cm 竖版
          startY = 550;  // 调整y坐标
        }
        startX = 40;   // 第一列x坐标（客户名称）
        lineHeight = 0;  // 不需要lineHeight
      }
      
      console.log('标签尺寸:', paperSizeMM.width, 'x', paperSizeMM.height, 'mm');
      console.log('订单数据:', orderArray);
      console.log('字体:', fontName, '放大倍数:', scale);
      console.log('起始位置:', startX, ',', startY);
      console.log('行高:', lineHeight);
      
      // 根据标签尺寸决定打印内容
      // 1号（4*3cm）：只打印客户名称
      // 2号和3号（4*6cm 和 5*8cm）：打印客户名称、商品名称、数量（3号还有备注）
      var printLines = [];
      
      if (paperSizeMM.height === 30) {
        // 1号小尺寸：只收集客户名称（每个订单一张标签）
        for (var i = 0; i < orderArray.length; i++) {
          var order = orderArray[i];
          console.log('处理第', i + 1, '个订单:', order);
          
          // 获取客户名称
          var customerName = '';
          if (order.gbDepartmentEntity && order.gbDepartmentEntity.gbDepartmentAttrName) {
            customerName = order.gbDepartmentEntity.gbDepartmentAttrName;
          } else if (order.nxDepartmentEntity && order.nxDepartmentEntity.nxDepartmentAttrName) {
            customerName = order.nxDepartmentEntity.nxDepartmentAttrName;
          } else if (order.nxRestrauntEntity && order.nxRestrauntEntity.nxRestrauntAttrName) {
            customerName = order.nxRestrauntEntity.nxRestrauntAttrName;
          }
          console.log('客户名称:', customerName);
          
          // 小尺寸只打印客户名称
          printLines.push(customerName);
        }
      }
      // 中尺寸和大尺寸的printLines不需要填充，因为会在竖版逻辑中单独处理每个订单
      
      console.log('实际打印行数:', printLines.length);
      console.log('打印内容:', printLines);
      
      // 打印每一行
      if (isVertical) {
        // 竖版（rotation=270）：每个订单单独打印一行标签
        // 注意：orderArray 中每个订单会打印一张标签
        for (var orderIdx = 0; orderIdx < orderArray.length; orderIdx++) {
          var order = orderArray[orderIdx];
          
          // 获取当前订单的打印内容
          var customerName = '';
          if (order.gbDepartmentEntity && order.gbDepartmentEntity.gbDepartmentAttrName) {
            customerName = order.gbDepartmentEntity.gbDepartmentAttrName;
          } else if (order.nxDepartmentEntity && order.nxDepartmentEntity.nxDepartmentAttrName) {
            customerName = order.nxDepartmentEntity.nxDepartmentAttrName;
          } else if (order.nxRestrauntEntity && order.nxRestrauntEntity.nxRestrauntAttrName) {
            customerName = order.nxRestrauntEntity.nxRestrauntAttrName;
          }
          
          var goodsName = '';
          if (order.nxDistributerGoodsEntity) {
            goodsName = order.nxDistributerGoodsEntity.nxDgGoodsName || '';
          }
          
          var quantity = order.nxDoWeight || 0;
          var remark = order.nxDoRemark || '';
          
          // 根据高度设置列间距
          var x1, x2, x3, x4;
          if (paperSizeMM.height === 60) {
            // 4*6cm 竖版
            x1 = 40;   // 第一列（客户名称）
            x2 = 120;  // 第二列（商品名称）
            x3 = 200;  // 第三列（数量）
          } else if (paperSizeMM.height === 80) {
            // 5*8cm 竖版
            x1 = 40;   // 第一列（客户名称）
            x2 = 120;  // 第二列（商品名称）
            x3 = 200;  // 第三列（数量）
            x4 = 280;  // 第四列（备注）
          }
          
          var y = startY;  // y坐标固定
          
          // 第一列：客户名称
          console.log('竖版 - 第一列（客户）:', customerName, '位置 (x=', x1, ', y=', y, ')');
          command.setText(x1, y, fontName, rotation, scale, scale, customerName);
          
          // 第二列：商品名称
          console.log('竖版 - 第二列（商品）:', goodsName, '位置 (x=', x2, ', y=', y, ')');
          command.setText(x2, y, fontName, rotation, scale, scale, goodsName);
          
          // 第三列：数量
          console.log('竖版 - 第三列（数量）:', '数量：' + quantity, '位置 (x=', x3, ', y=', y, ')');
          command.setText(x3, y, fontName, rotation, scale, scale, '数量：' + quantity);
          
          // 第四列：备注（仅大尺寸且备注存在时）
          if (paperSizeMM.height === 80 && remark) {
            console.log('竖版 - 第四列（备注）:', '备注：' + remark, '位置 (x=', x4, ', y=', y, ')');
            command.setText(x4, y, fontName, rotation, scale, scale, '备注：' + remark);
          }
        }
      } else {
        // 横版
        for (var i = 0; i < printLines.length; i++) {
          var content = printLines[i];
          var printY = startY + i * lineHeight;
          console.log('横版 - 添加文本:', content, '位置 (', startX, ',', printY, ')');
          console.log('setText 参数:', startX, printY, fontName, rotation, scale, scale, content);
          command.setText(startX, printY, fontName, rotation, scale, scale, content);
        }
      }
      
      console.log('调用 setPagePrint 生成打印数据');
      console.log('旋转角度 rotation =', rotation);
      // 打印
      command.setPagePrint();
      
      // 获取打印数据
      var buff = command.getData();
      console.log('打印数据生成成功，长度:', buff.length);
      console.log('打印数据前20字节:', Array.from(buff.slice(0, 20)));
      
      // 发送打印数据
      this.sendPrintData(buff);
    },

    // 发送打印数据（使用 async/await 可靠发送）
    sendPrintData(buff) {
      console.log('=== sendPrintData 方法开始执行 ===');
      console.log('数据长度:', buff.length);
      
      var that = this;
      
      // 调用内部可靠发送方法
      that.reliableSendPrintData(buff);
    },
    
    // 延迟函数
    delay(ms) {
      return new Promise(function(resolve) {
        setTimeout(resolve, ms);
      });
    },
    
    // 可靠的发送方法（使用 async/await）
    async reliableSendPrintData(buff) {
      var that = this;
      var app = getApp();
      var oneTimeData = 20;
      var totalChunks = Math.ceil(buff.length / oneTimeData);
      
      console.log('总数据长度:', buff.length, '分包数量:', totalChunks);
      console.log('写入特征ID:', app.globalData.BLEInformation.writeCharaterId);
      console.log('设备ID:', app.globalData.BLEInformation.deviceId);
      
      try {
        for (var i = 0; i < totalChunks; i++) {
          console.log('发送第', i + 1, '包，共', totalChunks, '包');
          
          // 计算本包数据大小
          var chunkStart = i * oneTimeData;
          var chunkEnd = Math.min(chunkStart + oneTimeData, buff.length);
          var chunkSize = chunkEnd - chunkStart;
          
          // 跳过空包
          if (chunkSize === 0) {
            console.log('跳过空包');
            continue;
          }
          
          console.log('步骤A: 准备创建数据包');
          var buf = new ArrayBuffer(chunkSize);
          var dataView = new DataView(buf);
          console.log('步骤B: 创建完整数据包，大小:', chunkSize);
          
          console.log('步骤C: 填充数据到 ArrayBuffer');
          for (var j = 0; j < chunkSize; j++) {
            dataView.setUint8(j, buff[chunkStart + j]);
          }
          console.log('步骤D: 数据包填充完成');
          
          // 发送数据包
          await that.sendSingleChunk(buf);
          
          // 延迟15ms（iOS需要）
          if (i < totalChunks - 1) {
            await that.delay(15);
          }
        }
        
        console.log('所有数据发送完成');
        wx.showToast({
          title: '打印完成',
          icon: 'success'
        });
      } catch (error) {
        console.error('发送数据失败:', error);
        wx.showToast({
          title: '打印失败',
          icon: 'none'
        });
      }
    },
    
    // 发送单个数据包
    sendSingleChunk(buf) {
      var that = this;
      var app = getApp();
      
      return new Promise(function(resolve, reject) {
        console.log('步骤E: 准备发送数据包，大小:', buf.byteLength);
        console.log('步骤F: 调用 wx.writeBLECharacteristicValue');
        console.log('设备ID:', app.globalData.BLEInformation.deviceId);
        console.log('服务ID:', app.globalData.BLEInformation.writeServiceId);
        console.log('特征值ID:', app.globalData.BLEInformation.writeCharaterId);
        
        wx.writeBLECharacteristicValue({
          deviceId: app.globalData.BLEInformation.deviceId,
          serviceId: app.globalData.BLEInformation.writeServiceId,
          characteristicId: app.globalData.BLEInformation.writeCharaterId,
          value: buf,
          success: function(res) {
            console.log('步骤G: 数据包发送成功');
            resolve(res);
          },
          fail: function(e) {
            console.log('步骤G失败: 打印失败');
            console.error('错误码:', e.errCode);
            console.error('错误信息:', e.errMsg);
            console.error('完整错误对象:', e);
            reject(e);
          }
        });
      });
    },

    onRightScroll(e) {
      const query = wx.createSelectorQuery();
      query.selectAll('.shelf-section').boundingClientRect();
      query.selectViewport().scrollOffset();

      query.exec(res => {
        const items = res[0];
        const scrollTop = res[1].scrollTop;
        
        // 计算顶部内容的高度（导航栏 + 按钮栏 + 其他顶部内容）
        const topContentHeight = this.data.navBarHeight + this.data.viewBarHeight;
        
        // 找到第一个完全进入视图的商品
        let currentIndex = -1;
        for (let i = 0; i < items.length; i++) {
          const item = items[i];
          // 考虑顶部内容的高度，调整判断条件
          if (item.top >= topContentHeight && item.top < (topContentHeight + 200) && item.bottom > topContentHeight) {
            currentIndex = i;
            break;
          }
        }

        if (currentIndex !== -1) {
          const currentShelfId = this.data.shelfGoodsArr[currentIndex].nxDgsgShelfId;
          const shelfIndex = this.data.shelfArr.findIndex(
            s => s.nxDistributerGoodsShelfId === currentShelfId
          );
          
          if (shelfIndex !== -1 && currentShelfId !== this.data.selectedShelfId) {
            this.setData({
              selectedSub: shelfIndex,
              selectedShelfId: currentShelfId,
              scrollTopLeft: shelfIndex > 3 ? (shelfIndex - 3) * 50 : 0
            });
          }
        }
      });
    },

    scrollToShelf(e) {
      const scrollTop = e.detail.scrollTop; // 获取滚动位置
      const { shelfArr, selectedSub } = this.data;
      
      console.log('滚动位置:', scrollTop);
      console.log('当前选中项:', selectedSub);
      console.log('货架数组:', shelfArr);
      
      // 获取所有货架区域的位置信息
      const query = wx.createSelectorQuery();
      // 修改选择器,使用id="position0"这样的格式
      const selectors = shelfArr.map((_, index) => `#position${index}`);
      console.log('使用的选择器:', selectors);
      
      selectors.forEach(selector => {
        query.select(selector).boundingClientRect();
      });
      query.selectViewport().scrollOffset();
      
      query.exec(res => {
        const items = res.slice(0, -1); // 最后一个元素是视口信息
        const viewportScrollTop = res[res.length - 1].scrollTop;
        
        console.log('获取到的元素位置信息:', items);
        console.log('视口滚动位置:', viewportScrollTop);
        
        // 找到当前视口中第一个可见的货架
        let currentIndex = -1;
        for (let i = 0; i < items.length; i++) {
          const item = items[i];
          if (!item) continue;
          console.log(`第${i}个元素位置:`, item.top);
          // 判断货架是否在视口中可见
          if (item.top >= 0 && item.top < 200) {
            currentIndex = i;
            console.log('找到可见元素,索引:', i);
            break;
          }
        }
        
        // 如果找到了可见的货架且与当前选中的不同,则更新选中状态
        if (currentIndex !== -1 && currentIndex !== selectedSub) {
          console.log('需要更新选中状态:', currentIndex);
          // 计算左侧滚动位置,保持选中项在合适的位置
          let left_ = 0;
          if (currentIndex > 3) {
            left_ = (currentIndex - 3) * 50; // 50是每个货架项的高度
          }
          
          console.log('计算得到的左侧滚动位置:', left_);
          
          // 更新选中状态和滚动位置
          this.setData({
            selectedSub: currentIndex,
            scrollTopLeft: left_,
            toView: `position${currentIndex}`
          }, () => {
            console.log('更新后的状态:', {
              selectedSub: currentIndex,
              scrollTopLeft: left_,
              toView: `position${currentIndex}`
            });
          });
        }
      });
    },

    // 发现并缓存可写特征值
    discoverAndCacheWritableChar(customerNames) {
      var that = this;
      var app = getApp();
      
      return new Promise(function(resolve, reject) {
        console.log('开始发现服务和特征...');
        
        wx.getBLEDeviceServices({
          deviceId: app.globalData.BLEInformation.deviceId,
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
              deviceId: app.globalData.BLEInformation.deviceId,
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
                app.globalData.BLEInformation.writeServiceId = service.uuid;
                app.globalData.BLEInformation.writeCharaterId = writable.uuid;
                
                if (notifyChar) {
                  app.globalData.BLEInformation.notifyCharaterId = notifyChar.uuid;
                  app.globalData.BLEInformation.notifyServiceId = service.uuid;
                }
                
                // 更新缓存
                wx.setStorageSync('bleDeviceInfo', app.globalData.BLEInformation);
                
                console.log('特征发现完成，可写特征ID:', writable.uuid);
                
                // 开启 notify（如果存在）
                that.ensureNotifyEnabled(app.globalData.BLEInformation.deviceId, service.uuid, notifyChar ? notifyChar.uuid : null)
                  .then(function() {
                    console.log('准备开始打印');
                    wx.hideLoading();
                    that.doPrint(customerNames);
                  })
                  .catch(function(e) {
                    console.error('开启 notify 失败，继续打印:', e);
                    wx.hideLoading();
                    that.doPrint(customerNames);
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

    // methods
  },






})