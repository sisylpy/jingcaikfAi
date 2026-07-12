const globalData = getApp().globalData;
var load = require('../../../lib/load.js');
import apiUrl from '../../../config.js'

import {
  stockerGetShelfList,
  stockerGetStockGoodsKfPage,
  stockerGetToStockGoodsWithDepIdsKf,
  giveOrderWeightListForStockShelfGoods
} from '../../../lib/apiDepOrder'

Component({
  data:{
   
  shelfArr: [],         // List<NxDistributerGoodsShelfEntity>
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
        printOk: printOk // 打印机连接状态
      })

      var value = wx.getStorageSync('userInfo');
      if (value) {
        this.setData({
          userInfo: value,
        })
        var disValue = wx.getStorageSync('disInfo');
        if (disValue) {
          this.setData({
            disInfo: disValue,
            disId: disValue.nxDistributerId,
          })
        }

        var idsChangeStock = wx.getStorageSync('idsChangeStock');

        if (idsChangeStock) {
          
          this.setData({
            outNxDepIds: idsChangeStock.outNxDepIds || [],
            outGbDepIds: idsChangeStock.outGbDepIds || [],
            outNxDepNames: idsChangeStock.outNxDepNames || [],
            outGbDepNames: idsChangeStock.outGbDepNames || [],
          })
          this._initNxDataKf();
         
        } 
       
      }
    },
  },


  methods: {

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
        console.log("res.resltdatta", res.result.data)
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
   

    

    toBack(){
      wx.navigateBack({delta: 1});
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

    
    showIsOutShelf(e){
      console.log("showIsOutshowIsOut");
      var shelfGoodsItem = e.currentTarget.dataset.item; // 货架商品对象，包含 nxDgsgShelfId
      var item = shelfGoodsItem.nxDistributerGoodsEntity; // 商品实体
       // 检查是否允许点击（必须点击左侧菜单后才能点击右侧商品）
       if (item.nxDgGoodsName == '') {
        wx.showToast({
          title: '订单未成功',
          icon: 'none',
          duration: 1500
        });
        return;
      }
      var arr = item.nxDepartmentOrdersEntities;
      var temp = [];
      for(var i = 0; i < arr.length; i++){
        var order = arr[i];
        order.hasChoice = true;
        // order.nxDoWeight = "";
        temp.push(order);
      }
      item.nxDepartmentOrdersEntities = temp;

      // 从货架商品对象获取货架ID
      const shelfId = shelfGoodsItem.nxDgsgShelfId;
      // 将货架ID保存到商品实体上，方便后续使用
      item.nxDgsgShelfId = shelfId;
      
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


    confirm(e) {
      var that = this;
      var arrNeed = e.detail.item.nxDepartmentOrdersEntities;
      var arr = [];
      
      // 获取货架 id - 尝试从多个地方获取
      let shelfId = e.detail.item.nxDgsgShelfId;
      if (!shelfId && this.data.item && this.data.item.nxDgsgShelfId) {
        shelfId = this.data.item.nxDgsgShelfId;
      }
      if (!shelfId && this.data.selectedShelfId) {
        shelfId = this.data.selectedShelfId;
      }
      // 如果还是没有，尝试从订单关联的商品实体中获取
      if (!shelfId && arrNeed.length > 0 && arrNeed[0].nxDistributerGoodsEntity) {
        shelfId = arrNeed[0].nxDistributerGoodsEntity.nxDgsgShelfId;
      }
      
      console.log('[indexShelf] confirm: 货架ID=', shelfId, 'e.detail.item=', e.detail.item);
      
      // 收集客户名称用于打印
      var customerNames = [];
      
      console.log('[indexShelf] confirm: 接收到订单数量=', arrNeed.length);
      const requestedIndex = typeof e.detail.index === 'number' ? e.detail.index : -1;
      let processedIndex = -1;
      if (arrNeed.length > 0) {
        for (var i = 0; i < arrNeed.length; i++) {
          var weightValue = arrNeed[i].nxDoWeight;
          var choice = arrNeed[i].hasChoice;
          console.log('[indexShelf] confirm: order index=', i, 'weight=', weightValue, 'choice=', choice);
          if (processedIndex === -1 && (requestedIndex === -1 || requestedIndex === i)) {
            if (weightValue !== null && weightValue > 0 && choice) {
              processedIndex = i;
              const currentOrder = { ...arrNeed[i] };
              currentOrder.nxDoPickUserId = this.data.userInfo.nxWeightUserId;
              if (shelfId) {
                currentOrder.outShelfId = shelfId;
                console.log('[indexShelf] confirm: 添加outShelfId=', shelfId);
              } else {
                console.warn('[indexShelf] confirm: 无法获取货架ID');
              }
              console.log("useriid", currentOrder.nxDoPickerUserId)
              arr.push(currentOrder);
              
              // 收集客户名称
              if (currentOrder.gbDepartmentEntity !== null) {
                var gbName = currentOrder.gbDepartmentEntity.gbDepartmentAttrName;
                if (gbName && customerNames.indexOf(gbName) === -1) {
                  customerNames.push(gbName);
                }
              } else if (currentOrder.nxDepartmentEntity !== null) {
                var nxName = currentOrder.nxDepartmentEntity.nxDepartmentAttrName;
                if (nxName && customerNames.indexOf(nxName) === -1) {
                  customerNames.push(nxName);
                }
              
              }
            }
          }
          if (processedIndex !== -1) break;
        }
      }

      if (arr.length > 0 && processedIndex !== -1) {
        console.log('[indexShelf] confirm: 本次提交处理的订单索引=', processedIndex);
        load.showLoading("保存数据中");
        giveOrderWeightListForStockShelfGoods(arr).then(res => {
          load.hideLoading();
          if (res.result.code == 0) { 
            console.log("zoahsuishsissiisiisisisiisi");
            console.log(that.data.outNxDepIds, " a" , that.data.showType);
            
            // 打印订单信息
            if (arr.length > 0) {
              if (customerNames.length === 0) {
                const fallbackOrder = arr[0];
                const fallbackNameParts = [];

                if (fallbackOrder.gbDepartmentEntity) {
                  const gb = fallbackOrder.gbDepartmentEntity;
                  if (gb.fatherGbDepartmentEntity && gb.fatherGbDepartmentEntity.gbDepartmentName) {
                    fallbackNameParts.push(gb.fatherGbDepartmentEntity.gbDepartmentName);
                  }
                  fallbackNameParts.push(gb.gbDepartmentAttrName || gb.gbDepartmentName);
                } else if (fallbackOrder.nxDepartmentEntity) {
                  const nx = fallbackOrder.nxDepartmentEntity;
                  if (nx.fatherDepartmentEntity && nx.fatherDepartmentEntity.nxDepartmentName) {
                    fallbackNameParts.push(nx.fatherDepartmentEntity.nxDepartmentName);
                  }
                  fallbackNameParts.push(nx.nxDepartmentAttrName || nx.nxDepartmentName);
                } 
                if (fallbackNameParts.length === 0) {
                  if (fallbackOrder.nxDoDepartmentName) {
                    fallbackNameParts.push(fallbackOrder.nxDoDepartmentName);
                  } else if (fallbackOrder.nxDoBuyer) {
                    fallbackNameParts.push(fallbackOrder.nxDoBuyer);
                  } else {
                    fallbackNameParts.push('订单' + (fallbackOrder.nxDepartmentOrdersId || fallbackOrder.nxDepartmentOrdersId || ''));
                  }
                }

                const fallbackName = fallbackNameParts.filter(Boolean).join('.');
                customerNames.push(fallbackName);
                console.log('[indexShelf] confirm: 打印客户名称缺失，使用兜底名称:', fallbackName);
              }
              that.printCustomers(arr);  // 传入完整的订单数组
            }

            // 过滤掉已完成的订单，保留仍需填写的订单
            const remainingOrders = arrNeed
              .map((order, idx) => {
                if (idx === processedIndex) {
                  return null; // 标记为已处理
                }
                return order;
              })
              .filter(order => {
                if (!order) return false;
                const weightNum = parseFloat(order.nxDoWeight);
                return !(order.hasChoice && !isNaN(weightNum) && weightNum > 0);
              })
              .map(order => {
                const clone = { ...order };
                // clone.nxDoWeight = "";
                clone.hasChoice = order.hasChoice !== undefined ? order.hasChoice : true;
                return clone;
              });

            const popup = that.selectComponent('#stockOutGoodsPopup');

            if (remainingOrders.length > 0) {
              that.setData({
                'item.nxDepartmentOrdersEntities': remainingOrders,
                showDisOutGoods: true
              }, () => {
                if (popup && popup.resetAfterSave) {
                  popup.resetAfterSave(remainingOrders);
                }
              });
            } else {
              that.setData({
                showDisOutGoods: false,
                item: {}
              }, () => {
                if (popup && popup.resetAfterSave) {
                  popup.resetAfterSave([]);
                }
              });
            }
            
            that._initNxDataKf();
          }else{
            wx.showToast({
              title: 'res.result.msg',
              icon: 'none'
            })
          }
        })
      } else {
        wx.showToast({
          title: '请至少填写一个出货数量',
          icon: 'none'
        })
      }
    },

    cancle() {
      console.log('[indexShelf] cancle: 关闭出货弹窗');
      this.setData({
        showDisOutGoods: false
      });
    },




    // 打印订单信息
    printCustomers(orderArray) {
      var that = this;
      
      var app = getApp();
      
      // 初始化全局数据（如果不存在）
      if (!app.globalData) {
        app.globalData = {};
      }
      if (!app.globalData.BLEInformation) {
        app.globalData.BLEInformation = {};
      }
      
      // 先检查缓存中是否有打印机设置
      const cachedDeviceInfo = wx.getStorageSync('bleDeviceInfo');
      if (!cachedDeviceInfo || !cachedDeviceInfo.deviceId) {
        // 如果没有缓存打印机设置，直接返回，不检测蓝牙
        console.log('未设置打印机，跳过打印功能');
        return;
      }
      
      // 如果缓存了蓝牙配置，从缓存中恢复打印机信息
      if (!app.globalData.BLEInformation.deviceId) {
        console.log('从缓存恢复打印机信息:', cachedDeviceInfo);
        app.globalData.BLEInformation = cachedDeviceInfo;
      }
      
      // 检查蓝牙是否已连接（包括从缓存恢复的）
      console.log('检查蓝牙信息，BLEInformation:', app.globalData.BLEInformation);
      if (!app.globalData.BLEInformation || !app.globalData.BLEInformation.deviceId) {
        console.log('未设置打印机，跳过打印功能');
        return; // 直接返回，不提示错误（静默跳过）
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

      // ========== 使用新的标签打印工具类 ==========
      const labelPrinter = require('../../../utils/labelPrinter.js');
      
      try {
        // 生成打印数据
        const printData = labelPrinter.quickPrint(orderArray, {
          paperSizeId: wx.getStorageSync('paperSize') || 1,
          goodsItem: null, // indexShelf 页面可能没有单独的 goodsItem，从订单中获取
          printRemark: true
        });
        
        if (!printData || printData.length === 0) {
          console.error('[doPrint] 打印数据为空，请检查打印内容');
          wx.showToast({
            title: '打印数据为空',
            icon: 'none'
          });
          return;
        }
        
        console.log('[doPrint] 打印数据生成成功，长度:', printData.length);
      
      // 发送打印数据
        that.sendPrintData(printData);
      } catch (error) {
        console.error('[doPrint] 打印数据生成失败:', error);
        wx.showToast({
          title: '打印数据生成失败',
          icon: 'none'
        });
      }
      // ========== 新的工具类代码结束 ==========
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
        
        console.log('✅ 所有数据发送完成');
        wx.showToast({
          title: '打印完成',
          icon: 'success'
        });
        
        // 打印完成后断开蓝牙连接，释放打印机资源供其他用户使用
        console.log('📴 准备在500ms后断开标签打印机连接，释放资源供其他用户使用');
        setTimeout(function() {
          console.log('📴 开始断开标签打印机连接...');
          that._closeLabelPrinterConnection();
        }, 500); // 延迟500ms后断开连接，确保打印机有时间处理数据
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

    // 断开标签打印机连接
    _closeLabelPrinterConnection() {
      var that = this;
      var app = getApp();
      
      // 使用全局变量中的设备信息
      var deviceId = app.globalData.BLEInformation && app.globalData.BLEInformation.deviceId;
      
      if (deviceId) {
        console.log('📴 准备断开标签打印机连接，deviceId:', deviceId);
        wx.closeBLEConnection({
          deviceId: deviceId,
          success: function(res) {
            console.log('✅ 标签打印机连接已断开');
            // 清除连接状态标记
            if (app.globalData.BLEInformation) {
              app.globalData.BLEInformation.isConnected = false;
            }
          },
          fail: function(err) {
            console.log('⚠️ 断开标签打印机连接失败:', err);
            // 即使断开失败，也清除连接状态标记
            if (app.globalData.BLEInformation) {
              app.globalData.BLEInformation.isConnected = false;
            }
          }
        });
      } else {
        console.log('⚠️ 标签打印机信息不存在，无需断开连接');
      }
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