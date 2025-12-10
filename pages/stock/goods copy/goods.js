const globalData = getApp().globalData;
var load = require('../../../lib/load.js');
let scrollDdirection = 0; // 用来计算滚动的方向

const tabBarHeight = 50; // 根据实际情况调整
const viewBarHeight = 60;

import apiUrl from '../../../config.js'

import {
 
  stockerGetStockGoods,
  stokerGetToStockGoodsWithDepIds, 
  stockerGetStockGoodsKfPage,
  stockerGetToStockGoodsWithDepIdsKf,
  giveOrderWeightListForStockAndFinish,
  giveOrderWeightListForStockShelfGoods
} from '../../../lib/apiDepOrder'


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
  },

  pageLifetimes: {

    show() {
      //tabBar
      if (typeof this.getTabBar === 'function' &&
        this.getTabBar()) {
        this.getTabBar().setData({
          selected: 1
        })
      }

      const app = getApp();
      const navBarHeight = app.globalData.navBarHeight;
      const screenHeight = app.globalData.screenHeight;
      const screenWidth = app.globalData.screenWidth;
      const rpxRatio = 750 / screenWidth;
      const navBarHeightRpx = navBarHeight * rpxRatio;
      const viewBarHeightRpx = viewBarHeight * rpxRatio;
      const tabBarHeightRpx = 100;
      const contentHeight = (screenHeight - navBarHeight  - viewBarHeight) * rpxRatio;

      this.setData({ 
        contentHeight: contentHeight,
        navBarHeight: navBarHeightRpx,
        tabBarHeight: tabBarHeightRpx,
        viewBarHeight: viewBarHeightRpx,
        leftMenuWidth: 150, // 左侧菜单宽度，单位 rpx
      });

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
        showType: 'type', // 'type': 按类别显示, 'shelf': 按货架显示
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
        // 根据showType初始化数据
        this._initDataForShowType();

       
      }else{
        this._login();
      }

    },
  },


  methods: {

    changeShowType() {
      if (this.data.showType == 'type') {
        this.setData({
          showType: 'shelf'
        })
      } else {
        this.setData({
          showType: 'type'
        })
      }
      // 重新初始化数据
      this._initDataForShowType();
    },

    _initDataForShowType() {
      if (this.data.showType === 'shelf') {
        // 按货架显示
        this._initShelfData();
      } else {
        // 按类别显示
        this._initData();
      }
    },

    _initShelfData() {
      console.log("========= _initShelfData 开始 - 按货架显示（不传客户ID，获取全部数据）=========");
      console.log("当前 disId:", this.data.disId);
      
      load.showLoading("获取货架数据");
      
      // 不传客户ID（传0），获取全部货架的订单
      var data = {
        nxDepIds: 0,
        gbDepIds: 0,
        nxDisId: this.data.disId,
      }
      
      console.log("调用接口 stockerGetToStockGoodsWithDepIdsKf，参数:", data);
      
      stockerGetToStockGoodsWithDepIdsKf(data).then(res => {
        load.hideLoading();
        console.log("========= 接口返回结果 =========");
        console.log("res.result.code:", res.result.code);
        console.log("res.result.msg:", res.result.msg);
        console.log("res.result.data:", res.result.data);
        
        if (res.result.code == 0) {
          console.log("货架数量:", (res.result.data.shelfArr || []).length);
          console.log("货架列表:", res.result.data.shelfArr);
          console.log("waitDepNx:", res.result.data.waitDepNx);
          console.log("waitDepGb:", res.result.data.waitDepGb);
          console.log("depOrdersWait:", res.result.data.depOrdersWait);
          
          this.setData({    
            shelfArr: res.result.data.shelfArr || [],
            waitDepNx: res.result.data.waitDepNx || [],
            waitDepGb: res.result.data.waitDepGb || [],
            depOrdersWait: res.result.data.depOrdersWait || [],
            stockCountOk: res.result.data.stockCountOk || [],
          });
          
          console.log("设置后的 shelfArr 长度:", this.data.shelfArr.length);
          
          if (this.data.shelfArr.length === 0) {
            console.warn("警告：没有货架数据返回！");
            wx.showToast({
              title: '暂无待出库的货架',
              icon: 'none'
            });
          }
          
          // 更新tabBar计数
          this.getTabBar().setData({
            stockCount: res.result.data.stockCount || 0,
            stockCountOk: res.result.data.stockCountOk || 0,
          });

          // 获取货架位置信息（如果数组不为空）
          if (this.data.shelfArr.length > 0) {
            this.lisenerScrollShelf();
          }
          console.log("========= _initShelfData 成功完成 =========");
        } else {
          console.error("接口返回错误:", res.result);
          this.setData({
            shelfArr: []
          });
          wx.showToast({
            title: res.result.msg || '获取数据失败',
            icon: 'none'
          });
        }
      }).catch(err => {
        load.hideLoading();
        console.error('========= 获取货架数据失败 =========');
        console.error('错误详情:', err);
        wx.showToast({
          title: '获取货架数据失败',
          icon: 'none'
        });
      });
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
            waitDepNx: res.result.data.waitDepNx,
            waitDepGb: res.result.data.waitDepGb, 
            depOrdersWait: res.result.data.depOrdersWait,
            idDepOrdersWait: res.result.data.idDepOrdersWait,
          })
          if(res.result.data.shelfArr.length == 0){
            console.log("resgrandarrr", res.result.data.shelfArr.length);
            that.setData({
              outNxDepNames: [],
              outNxDepIds: [],
              outGbDepIds:[],
              outGbDepNames: [],
            })
            wx.removeStorageSync('idsChangeStock');
            // 重新初始化数据
            that._initDataForShowType();
          }

          that.getTabBar().setData({
            stockCount: res.result.data.stockCount,
            stockCountOk: res.result.data.stockCountOk,           
          })
    
          // that.lisenerScrollShelf();
        
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

    _updateStorage() {
      var that  = this;
      var idsChangeStock = wx.getStorageSync('idsChangeStock');
      
      if (idsChangeStock) {
        var waitDepNx = that.data.waitDepNx;
        var newIds = [];
        var newNames = [];
        if (waitDepNx.length > 0) {
          var ids = idsChangeStock.outNxDepIds;
          if (ids.length > 0) {
            for (var i = 0; i < waitDepNx.length; i++) {
              var wId = waitDepNx[i].nxDepartmentId;
              var wName = waitDepNx[i].nxDepartmentName;
              for (var j = 0; j < ids.length; j++) {
                var sId = ids[j];
                console.log("wid===" , wId);
                console.log("sId===" , sId);
                if (wId == sId) {
                  newIds.push(sId);
                  newNames.push(wName);
                }
              }
            }
          }
        }

        var waitDepGb = that.data.waitDepGb;
        var newIdsGb = [];
        var newNamesGb = [];
        if (waitDepGb.length > 0) {
         var idsGb =  idsChange.outGbDepIds;
          if (idsGb.length > 0) {
            for (var i = 0; i < waitDepGb.length; i++) {
              var wIdG = waitDepGb[i].gbDepartmentId;
              var wNameG = waitDepGb[i].gbDepartmentName;
              for (var j = 0; j < idsGb.length; j++) {
                var wIdG = idsGb[j];
                if (wId == wIdG) {
                  newIdsGb.push(wIdG);
                  newNamesGb.push(wNameG);
                }
              }
            }
          }
        }
      
         
        if(newIds.length > 0 || newIdsGb.length > 0){
      
          var idsChange = {
            haveIds: true,
            outNxDepIds: newIds,
            outNxDepNames: newNames, 
            outGbDepIds: newIdsGb,
            outGbDepNames: newNamesGb,
          }
          wx.setStorageSync('idsChangeStock', idsChange);
  
        }else{
          wx.removeStorageSync('idsChangeStock');
          this.setData({
            outGbDepIds: [],
            outNxDepIds: [],
            outNxDepNames: [],
            outGbDepNames: [],
          })
          this._initData();
        }

      }
  
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

    // 获取货架位置信息（按货架模式）
    lisenerScrollShelf() {
      // 判断货架数组是否为空
      if (!this.data.shelfArr || this.data.shelfArr.length === 0) {
        console.log("货架数组为空，跳过 lisenerScrollShelf");
        return;
      }
      
      console.log("开始获取货架位置信息，货架数量:", this.data.shelfArr.length);
      
      new Promise(resolve => {
        let query = wx.createSelectorQuery().in(this);
        for (let i in this.data.shelfArr) {
          query.select(`#position${i}`).boundingClientRect();
        }
        query.exec(function (res) {
          resolve(res);
        });
      }).then(res => {
        console.log("获取到货架位置信息:", res);
        this.data.shelfArr.forEach((item, index) => {
          item.offsetTop = res[index].top
        })
        this.setData({
          scrollInfo: res,
          shelfArr: this.data.shelfArr
        })
      }).catch(err => {
        console.error("获取货架位置信息失败:", err);
      });
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

    

    /**
     * 监听滚动条滚动事件
     */
    scrollTo(e) {
      const scrollTop = e.detail.scrollTop; //滚动的Y轴
      const {
        selectedSub,
        grandList
      } = this.data;
      let left_ = 0
      if (scrollDdirection < scrollTop) {
        // 向上滑动
        scrollDdirection = scrollTop
        // 计算偏移位置
        if (selectedSub < grandList.length - 1 && scrollTop >= grandList[selectedSub + 1].offsetTop) {
          if (selectedSub > 2) {
            left_ = (selectedSub - 2) * 50
          }
          this.setData({
            selectedSub: selectedSub + 1,
            scrollTopLeft: left_
          })
        }
      } else {
        // 向下滑动
        scrollDdirection = scrollTop
        // 计算偏移位置
        if (selectedSub > 0 && scrollTop < grandList[selectedSub - 1].offsetTop && scrollTop > 0) {
          if (selectedSub > 3) {
            left_ = (selectedSub - 4) * 50
          }
          this.setData({
            selectedSub: selectedSub - 1,
            scrollTopLeft: left_
          })
        }
      }
    },

    scrollToShelf(e) {
      console.log("scrollToShelf - 按货架滚动监听");
      const scrollTop = e.detail.scrollTop; //滚动的Y轴
      const {
        selectedSub,
        shelfArr
      } = this.data;
      let left_ = 0
      if (scrollDdirection < scrollTop) {
        // 向上滑动
        scrollDdirection = scrollTop
        // 计算偏移位置
        if (selectedSub < shelfArr.length - 1 && scrollTop >= shelfArr[selectedSub + 1].offsetTop) {
          if (selectedSub > 2) {
            left_ = (selectedSub - 2) * 50
          }
          this.setData({
            selectedSub: selectedSub + 1,
            scrollTopLeft: left_
          })
        }
      } else {
        // 向下滑动
        scrollDdirection = scrollTop
        // 计算偏移位置
        if (selectedSub > 0 && scrollTop < shelfArr[selectedSub - 1].offsetTop && scrollTop > 0) {
          if (selectedSub > 3) {
            left_ = (selectedSub - 4) * 50
          }
          this.setData({
            selectedSub: selectedSub - 1,
            scrollTopLeft: left_
          })
        }
      }
    },

    showIsOutShelf(e){
      console.log("showIsOutShelf - 按货架显示");
      var item = e.currentTarget.dataset.item;
      var arr = item.nxDistributerGoodsEntity.nxDepartmentOrdersEntities;
      var temp = [];
      for(var i = 0; i < arr.length; i++){
        var order = arr[i];
        order.hasChoice = true;
        order.nxDoWeight = "";
        temp.push(order);
      }
      item.nxDistributerGoodsEntity.nxDepartmentOrdersEntities = temp;

      // 找到对应的货架索引
      const shelfId = e.currentTarget.dataset.item.nxDgsgShelfId;
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
        item: item.nxDistributerGoodsEntity,
      })
    },

    showIsOut(e) {
      var item = e.currentTarget.dataset.item;
      var arr = item.nxDepartmentOrdersEntities;
      var temp = [];
      for(var i = 0; i < arr.length; i++){
        var order = arr[i];
        order.hasChoice = true;
        order.nxDoWeight = "";
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
          }
        }
      }

      if (arr.length > 0) {
        load.showLoading("保存数据中");
        
        // 根据showType选择不同的出库接口
        const apiMethod = that.data.showType === 'shelf' ? giveOrderWeightListForStockShelfGoods : giveOrderWeightListForStockAndFinish;
        
        apiMethod(arr).then(res => {
          load.hideLoading();
          if (res.result.code == 0) { 
            console.log("zoahsuishsissiisiisisisiisi");
            console.log(that.data.outNxDepIds, " a" , that.data.showType);
            
            // 打印订单信息
            if (arr.length > 0) {
              that.printCustomers(arr);  // 传入完整的订单数组
            }
            
            // 重新初始化数据
            that._initDataForShowType();
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

    // 打印订单信息
    printCustomers(orderArray) {
      console.log('printCustomers 被调用，订单数量:', orderArray.length);
      var that = this;
      
      var app = getApp();
      if (!app.globalData.BLEInformation || !app.globalData.BLEInformation.deviceId) {
        console.error('蓝牙未连接');
        wx.showToast({
          title: '请先连接打印机',
          icon: 'none'
        });
        return;
      }
      
      console.log('=== 打印流程开始 ===');
      wx.showLoading({
        title: '连接打印机...',
      });
      
      wx.openBluetoothAdapter({
        success: function(res) {
          setTimeout(() => {
            wx.createBLEConnection({
              deviceId: app.globalData.BLEInformation.deviceId,
              success: function(res) {
                that.discoverAndCacheWritableChar(orderArray);
              },
              fail: function(err) {
                // 如果是已连接错误，直接使用现有连接
                if (err.errCode === 1509007 || err.errMsg.indexOf('already connect') !== -1) {
                  console.log('设备已连接，直接使用现有连接');
                  app.globalData.BLEInformation.isConnected = true;
                  that.discoverAndCacheWritableChar(orderArray);
                } else {
                  console.error('蓝牙连接失败:', err);
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
          console.error('蓝牙适配器初始化失败:', err);
          wx.hideLoading();
          wx.showToast({
            title: '请打开蓝牙',
            icon: 'none'
          });
        }
      });
    },

    // 发现并缓存可写特征值
    discoverAndCacheWritableChar(orderArray) {
      var that = this;
      var app = getApp();
      
      wx.getBLEDeviceServices({
        deviceId: app.globalData.BLEInformation.deviceId,
        success: function(res) {
          var services = res.services || [];
          var targetServices = services.filter(function(s) {
            return /fff0/i.test(s.uuid) || /ffe0/i.test(s.uuid) || /180f/i.test(s.uuid) || /fff2/i.test(s.uuid);
          });
          
          var service = targetServices[0] || services[0];
          if (!service) {
            wx.hideLoading();
            wx.showToast({
              title: '未发现可用服务',
              icon: 'none'
            });
            return;
          }
          
          wx.getBLEDeviceCharacteristics({
            deviceId: app.globalData.BLEInformation.deviceId,
            serviceId: service.uuid,
            success: function(chrRes) {
              var chs = chrRes.characteristics || [];
              
              var writable = null;
              for (var i = 0; i < chs.length; i++) {
                if (chs[i].properties.writeNoResponse) {
                  writable = chs[i];
                  break;
                }
              }
              
              if (!writable) {
                for (var i = 0; i < chs.length; i++) {
                  if (chs[i].properties.write) {
                    writable = chs[i];
                    break;
                  }
                }
              }
              
              if (!writable) {
                wx.hideLoading();
                wx.showToast({
                  title: '未发现可写特征',
                  icon: 'none'
                });
                return;
              }
              
              app.globalData.BLEInformation.writeServiceId = service.uuid;
              app.globalData.BLEInformation.writeCharaterId = writable.uuid;
              
              wx.setStorageSync('bleDeviceInfo', app.globalData.BLEInformation);
              
              console.log('特征发现完成');
              wx.hideLoading();
              that.doPrint(orderArray);
            }
          });
        }
      });
    },

    // 执行打印
    doPrint(orderArray) {
      console.log('doPrint 开始执行，订单数量:', orderArray.length);
      var that = this;
      var app = getApp();
      
      if (!app.globalData.BLEInformation.writeCharaterId || !app.globalData.BLEInformation.writeServiceId) {
        wx.showToast({
          title: '打印机特征值缺失',
          icon: 'none'
        });
        return;
      }

      var tsc = require("../../../utils/GPutils/tsc.js").jpPrinter;
      var command = tsc.createNew();
      
      var cachedPaperSize = wx.getStorageSync('paperSize') || 1;
      var sizes = {
        1: { width: 40, height: 30 },
        2: { width: 40, height: 60 },
        3: { width: 50, height: 80 }
      };
      var paperSizeMM = sizes[cachedPaperSize] || sizes[1];
      
      var isVertical = (paperSizeMM.height >= 60);
      
      command.setSize(paperSizeMM.width, paperSizeMM.height);
      command.setGap(2);
      command.setDirection(0);
      command.setReference(0, 0);
      command.setCls();
      
      var fontName = "TSS24.BF2";
      var scale = paperSizeMM.height <= 30 ? 3 : 2;
      var rotation = paperSizeMM.height <= 30 ? 0 : 270;
      var startX = paperSizeMM.height <= 30 ? 16 : 0;
      var startY = Math.floor(2 * (203 / 25.4));
      var lineHeight = 30;
      
      var DPI = 203;
      var DPMM = DPI / 25.4;
      
      if (paperSizeMM.height <= 30) {
        startX = Math.floor(2 * DPMM);
        startY = Math.floor(2 * DPMM);
        lineHeight = 80;
      } else if (isVertical) {
        startY = Math.floor(8 * DPMM);
      }
      
      console.log('标签尺寸:', paperSizeMM.width, 'x', paperSizeMM.height, 'mm');
      
      if (isVertical) {
        for (var orderIdx = 0; orderIdx < orderArray.length; orderIdx++) {
          var order = orderArray[orderIdx];
          
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
          var standard = order.nxDoStandard || '';
          
          var x1 = 40, x2 = 120, x3 = 200, x4 = 280;
          var y = startY;
          
          command.setText(x1, y, fontName, rotation, scale, scale, customerName);
          command.setText(x2, y, fontName, rotation, scale, scale, goodsName);
          command.setText(x3, y, fontName, rotation, scale, scale, '数量：' + quantity + (standard ? standard : ''));
          
          if (paperSizeMM.height === 80 && remark) {
            command.setText(x4, y, fontName, rotation, scale, scale, '备注：' + remark);
          }
        }
      } else {
        var printLines = [];
        for (var i = 0; i < orderArray.length; i++) {
          var order = orderArray[i];
          var customerName = '';
          if (order.gbDepartmentEntity && order.gbDepartmentEntity.gbDepartmentAttrName) {
            customerName = order.gbDepartmentEntity.gbDepartmentAttrName;
          } else if (order.nxDepartmentEntity && order.nxDepartmentEntity.nxDepartmentAttrName) {
            customerName = order.nxDepartmentEntity.nxDepartmentAttrName;
          } else if (order.nxRestrauntEntity && order.nxRestrauntEntity.nxRestrauntAttrName) {
            customerName = order.nxRestrauntEntity.nxRestrauntAttrName;
          }
          printLines.push(customerName);
        }
        
        for (var i = 0; i < printLines.length; i++) {
          var content = printLines[i];
          var printY = startY + i * lineHeight;
          command.setText(startX, printY, fontName, rotation, scale, scale, content);
        }
      }
      
      command.setPagePrint();
      var buff = command.getData();
      console.log('打印数据生成成功，长度:', buff.length);
      this.reliableSendPrintData(buff);
    },

    // 延迟函数
    delay(ms) {
      return new Promise(function(resolve) {
        setTimeout(resolve, ms);
      });
    },

    // 可靠的发送方法
    async reliableSendPrintData(buff) {
      var that = this;
      var app = getApp();
      var oneTimeData = 20;
      var totalChunks = Math.ceil(buff.length / oneTimeData);
      
      try {
        for (var i = 0; i < totalChunks; i++) {
          var chunkStart = i * oneTimeData;
          var chunkEnd = Math.min(chunkStart + oneTimeData, buff.length);
          var chunkSize = chunkEnd - chunkStart;
          
          if (chunkSize === 0) continue;
          
          var buf = new ArrayBuffer(chunkSize);
          var dataView = new DataView(buf);
          
          for (var j = 0; j < chunkSize; j++) {
            dataView.setUint8(j, buff[chunkStart + j]);
          }
          
          await that.sendSingleChunk(buf);
          
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
        wx.writeBLECharacteristicValue({
          deviceId: app.globalData.BLEInformation.deviceId,
          serviceId: app.globalData.BLEInformation.writeServiceId,
          characteristicId: app.globalData.BLEInformation.writeCharaterId,
          value: buf,
          success: function(res) {
            resolve(res);
          },
          fail: function(e) {
            console.error('数据包发送失败:', e);
            reject(e);
          }
        });
      });
    },

    // methods
  },






})