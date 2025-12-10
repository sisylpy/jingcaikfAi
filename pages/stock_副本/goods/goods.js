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
  giveOrderWeightListForStockAndFinish
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
        this._initData();

       
      }else{
        this._login();
      }

     
      
    },
  },


  methods: {

    

    
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
            that._initDataKf();
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

    // lisenerScrollShelf() {
    //   // 获取各分类容器距离顶部的距离
    //   new Promise(resolve => {
    //     let query = wx.createSelectorQuery();
    //     for (let i in this.data.shelfArr) {
    //       query.select(`#positionshelf${i}`).boundingClientRect();
    //     }
    //     query.exec(function (res) {
    //       resolve(res);
    //     });
    //   }).then(res => {
    //     this.data.shelfArr.forEach((item, index) => {
    //       item.offsetTop = res[index].top
    //     })
    //     this.setData({
    //       scrollInfo: res,
    //       shelfArr: this.data.shelfArr
    //     })
    //   });
    // },

    
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

    // scrollToShelf(e) {
    //   console.log("scrollToShelfscrollToShelf")
    //   const scrollTop = e.detail.scrollTop; //滚动的Y轴
    //   const {
    //     selectedSub,
    //     shelfArr
    //   } = this.data;
    //   let left_ = 0
    //   if (scrollDdirection < scrollTop) {
    //     // 向上滑动
    //     scrollDdirection = scrollTop
    //     // 计算偏移位置
    //     if (selectedSub < shelfArr.length - 1 && scrollTop >= shelfArr[selectedSub + 1].offsetTop) {
    //       if (selectedSub > 2) {
    //         left_ = (selectedSub - 2) * 50
    //       }
    //       this.setData({
    //         selectedSub: selectedSub + 1,
    //         scrollTopLeft: left_
    //       })
    //     }
    //   } else {
    //     // 向下滑动
    //     scrollDdirection = scrollTop
    //     // 计算偏移位置
    //     if (selectedSub > 0 && scrollTop < shelfArr[selectedSub - 1].offsetTop && scrollTop > 0) {
    //       if (selectedSub > 3) {
    //         left_ = (selectedSub - 4) * 50
    //       }
    //       this.setData({
    //         selectedSub: selectedSub - 1,
    //         scrollTopLeft: left_
    //       })
    //     }
    //   }
    // },

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
        giveOrderWeightListForStockAndFinish(arr).then(res => {
          load.hideLoading();
          if (res.result.code == 0) { 
            console.log("zoahsuishsissiisiisisisiisi");
            console.log(that.data.outNxDepIds, " a" , that.data.showType);
            if (that.data.outNxDepIds.length > 0 || that.data.outGbDepIds.length > 0) {
              if(that.data.showType == 'shelf'){
                that._initNxDataKf();
              }else{
                that._initNxData();
              }
             
            } else {
              if(that.data.showType == 'shelf'){
                that._initDataKf();
              }else{
                that._initData();
              }
             
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

    // methods
  },






})