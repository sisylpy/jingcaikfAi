const globalData = getApp().globalData;
var load = require('../../../lib/load.js');
let scrollDdirection = 0; // 用来计算滚动的方向

const tabBarHeight = 50; // 根据实际情况调整
const viewBarHeight = 60;

import apiUrl from '../../../config.js'

import {
  stockerGetStockGoodsUnWeigth,
  stokerGetToStockGoodsWithDepIds, 
  giveOrderWeightListForStockAndFinish
} from '../../../lib/apiDepOrder'

Component({
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
  
      const contentHeight = (screenHeight - navBarHeight - tabBarHeight - viewBarHeight) * rpxRatio;

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
        goodsType: 1,

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
      }

      var idsChangeStock = wx.getStorageSync('idsChangeStock');
      if (idsChangeStock) {
        this.setData({
          outNxDepIds: idsChangeStock.outNxDepIds,
          outGbDepIds: idsChangeStock.outGbDepIds,
          outNxDepNames: idsChangeStock.outNxDepNames,
          outGbDepNames: idsChangeStock.outGbDepNames,
        })
        this._initNxData();
       
      } else {
        this._initData();
        
      }

    },

  },


  methods: {

    delSearch(){
      wx.removeStorageSync('idsChangeStock');
      this.setData({
        outNxDepIds: [],
        outGbDepIds: [],
        outNxDepNames: [],
        outGbDepNames: [],
      })
      this._initData();
    },

    
    _initData() {
      console.log("aa")
      var that = this;
      load.showLoading("获取数据")
      var data = {
        disId: this.data.disId,
        goodsType: this.data.goodsType,
      }
      stockerGetStockGoodsUnWeigth(data).then(res => {
        load.hideLoading();
        if (res.result.code == 0) {
         
          console.log(res.result.data)
          this.setData({
            grandList: res.result.data.grandArr,
            waitDepNx: res.result.data.waitDepNx,
            waitDepGb: res.result.data.waitDepGb,
             depOrdersWait: res.result.data.depOrdersWait,
             stockCount: res.result.data.stockCount,
             stockCountOk: res.result.data.stockCountOk,
             wxCount: res.result.data.wxCount,
             wxCountOk: res.result.data.wxCountOk,
           
          })

          var pre = Number(res.result.data.buyOrders) - Number(res.result.data.buyOrdersOk);
          that.getTabBar().setData({
            stockCount: res.result.data.stockCount,
            stockCountOk: res.result.data.stockCountOk,
            wxCount: res.result.data.wxCount,
            wxCountOk: res.result.data.wxCountOk,
            prepareCount: pre,
            buyOrders: res.result.data.buyOrders,
            buyOrdersOk: res.result.data.buyOrdersOk,
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
        goodsType: this.data.goodsType
      }

      stokerGetToStockGoodsWithDepIds(data).then(res => {
        if (res.result.code == 0) {
          console.log(res.result.data)
          this.setData({
          
            grandList: res.result.data.grandArr,
            waitDepNx: res.result.data.waitDepNx,
            waitDepGb: res.result.data.waitDepGb,
            depOrdersWait: res.result.data.depOrdersWait,
            stockCount: res.result.data.stockCount,
            stockCountOk: res.result.data.stockCountOk,    
            wxCount: res.result.data.wxCount,
            wxCountOk: res.result.data.wxCountOk,
          })
          if(res.result.data.grandArr.length == 0){
            console.log("resgrandarrr", res.result.data.grandArr.length);
            that.setData({
              outNxDepNames: [],
            })
            // wx.removeStorageSync('idsChangeStock');
            // that._initData();
          }

          var pre = Number(res.result.data.buyOrders) - Number(res.result.data.buyOrdersOk);
          that.getTabBar().setData({
            stockCount: res.result.data.stockCount,
            stockCountOk: res.result.data.stockCountOk,
            wxCount: res.result.data.wxCount,
            wxCountOk: res.result.data.wxCountOk,
            prepareCount: pre,
            // buyOrders: res.result.data.buyOrders,
            // buyOrdersOk: res.result.data.buyOrdersOk,
            })

          // that.lisenerScroll();
        
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
      var arrNeed = e.detail.item.nxDepartmentOrdersEntities;
      var arr = [];
      if (arrNeed.length > 0) {
        for (var i = 0; i < arrNeed.length; i++) {
          var weightValue = arrNeed[i].nxDoWeight;
          var choice = arrNeed[i].hasChoice;
          if (weightValue !== null && weightValue > 0 && choice) {
            arr.push(arrNeed[i]);
          }
        }
      }

      if (arr.length > 0) {
        load.showLoading("保存数据中");
        giveOrderWeightListForStockAndFinish(arr).then(res => {
          load.hideLoading();
          if (res.result.code == 0) { 
            if (this.data.outNxDepIds.length > 0 || this.data.outGbDepIds.length > 0) {
              this._initNxData();
             
            } else {
              this._initData();
             
            }
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
      wx.navigateTo({
        url: '../../../subPackage/pages/prepare/orderDepList/orderDepList?disId=' + this.data.disId + '&goodsType=' + this.data.goodsType + '&inputType=-1',
      })
    },


    toEditHome() {
      if(this.data.userInfo.nxDiuAdmin == 0){
        wx.navigateTo({
          url: '../../../subPackage/pages/mangement/homePage/homePage',
        })
      }
     
    },

    toLand() {
      wx.navigateTo({
        url: '../../../subPackage/pages/prepare/land/land?goodsType=-1',
      })

    },



    toPrint() {
    
      wx.navigateTo({
        url: '../../../subPackage/pages/prepare/preparePrint/preparePrint?disId=' + this.data.disId + '&goodsType=-1',
      })
    },


    toWeightPage() {
      wx.navigateTo({
        url: '../../../subPackage/pages/prepare/weightPage/weightPage?disId=' + this.data.disId + '&goodsType='
         + this.data.goodsType,
      })
    },

    onNavButtonTap() {
      console.log("aa")
      wx.navigateTo({
        url: '../../../subPackage/pages/management/homePage/homePage',
      })
     },
     

    // methods
  },






})