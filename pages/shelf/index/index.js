var load = require('../../../lib/load.js');
import apiUrl from '../../../config.js'

import {
  getShelfsByUserId,
  getShelfGoods,
  updateShelfName,
  deleteShelf,
  saveNewShelf,
  deleteShelfGoods,
  staffApplyPurGoods,
  deletePlanPurchaseGoods,
  updatePurchaseGoods,
  staffRecievePurGoods,

  uploadShelfStock,
  updateDisStock,
  setShelfLayer,
  clearShelfLayer

  
} from '../../../lib/apiDistributer.js'




const tabBarHeight = 50; // 根据实际情况调整
const viewBarHeight = 60;

Component({

  pageLifetimes: {
    show() {
      // 设置 tabBar 选中状态
      if (typeof this.getTabBar === 'function' &&
        this.getTabBar()) {
        this.getTabBar().setData({
          selected: 2
        })
      }
      
      // 如果有用户信息，重新获取数据
      var value = wx.getStorageSync('userInfo');
      if (value && this.data.disId) {
        this.setData({
          currentPage: 1,
          showEndHint: false,
          showNoDataHint: false
        });
        this.resetScrollPosition();
        console.log("show - getDisShelfs");
        this._getDisShelfs();
      }
    }
  },

  observers: {
    'showStock': function(showStock) {
      console.log('=== shelf/index observers showStock ===')
      console.log('showStock值变化:', showStock)
    }
  },



  data: {
    
    contentHeight: 0,
    leftMenuWidth: 200, // 左侧菜单宽度，单位 rpx
    navBarHeight: 0,
    tabBarHeight: 0,

    totalPage: 0,
    totalCount: 0,
    limit: 15,
    currentPage: 1,
    showNoDataHint: false,
    showEndHint: false,
    toTop: 0,
    shelfItem: null,
    shelfArr: [],
    shelfGoodsList: [], // 货架商品列表
    shelfId: -1,
    shelfIndex: 0, // 当前选中的货架索引
    
    // 采购相关变量
    showPlanPurchase: false,
    showAdd: false,
    isEditShelf: false,
    arriveDate: '',
    show: false,
    showOperation: false,
    isEditGoods: false,
    isShowTools: false,
    disGoods: null,
    shelfGoods: null,
    item: null,
    applyStandardName: '',
    isEditPurchase: false, // 标识是否为修改采购模式
    showEditPurGoods: false, // 控制修改采购弹窗显示
    showInputPurGoods: false, // 控制输入采购商品弹窗显示
    showInputPurStock: false, // 控制输入库存弹窗显示
    purchaseGoods: null, // 采购商品数据
    showStock: false, // 控制库存编辑弹窗显示
    showStockDetail: false, // 控制库存详细弹窗显示
    stockRestWeightTotal: 0,
    restWeight: "0", // 剩余重量
    maxRestWeight: 0, // 最大剩余重量
    showDeleteConfirm: false,
    isListView: false,
    isLoading: false,
    
    // 页面刷新相关
    needsRefreshOnShow: false, // 页面显示时需要刷新标记
    refreshShelfListOnShow: false, // 页面显示时需要刷新货架列表标记
    
    // 语音相关
    voiceShelfAdded: false, // 语音添加货架标记
    voiceShelfNewItems: [], // 语音新增商品列表
    
    // 层文本映射
    layerTextMap: {
      1: '第一层结束',
      2: '第二层结束',
      3: '第三层结束',
      4: '第四层结束',
      5: '第五层结束',
      6: '第六层结束',
      7: '第七层结束',
      8: '第八层结束',
      9: '第九层结束',
      10: '第十层结束'
    },
    
    // 图片相关
    showImageModal: false, // 显示图片模态框
    currentImage: '', // 当前图片
    currentGoods: null, // 当前商品
    
    url: '', // 服务器地址
   
  },

  lifetimes: {
    attached(e) {
      const app = getApp();
      const globalData = app.globalData;
    const navBarHeight = globalData.navBarHeight;
    const screenHeight = globalData.screenHeight;
    const screenWidth = globalData.screenWidth;
    const rpxRatio = 750 / screenWidth;
    const navBarHeightRpx = navBarHeight * rpxRatio;
    const tabBarHeightRpx = 100;
    const viewBarHeightRpx = viewBarHeight * rpxRatio;

    const contentHeight = (screenHeight - navBarHeight  - viewBarHeight) * rpxRatio;
  

    this.setData({

      contentHeight: contentHeight,
      navBarHeight: navBarHeightRpx,
      tabBarHeight: tabBarHeightRpx,
      viewBarHeight: viewBarHeightRpx,
      leftMenuWidth: 100, // 左侧菜单宽度，单位 rpx

    });
    
      this.setData({
        windowWidth: globalData.windowWidth * globalData.rpxR,
        windowHeight: globalData.windowHeight * globalData.rpxR,
        statusBarHeight: globalData.statusBarHeight * globalData.rpxR,
        url: apiUrl.server,
        scrollViewTop: 0,
        showEditPurchase: false,
        show: false,
        showPay: false,
        batchCount: 0,
        hide: false,
        scrollTop: 0,
        shelfIndex: 0,
      })
      // 
      var value = wx.getStorageSync('userInfo');
      if (value) {
        this.setData({
          disId: value.nxDistributerEntity.nxDistributerId,
          userInfo: value,
          userId: value.nxDistributerUserId,
        })

        console.log("geetshellf");
        this._getDisShelfs();

      }
    }
  },

  methods: {
    // ./show

    showType() {
      const nextView = !this.data.isListView;
      this.setData({
        isListView: nextView,
        currentPage: 1,
        showEndHint: false
      }, () => {
        console.log('[shelf/index] showType toggle -> view=', this.data.isListView ? 'list' : 'grid',
          'currPage=', this.data.currentPage,
          'totalPage=', this.data.totalPage,
          'totalCount=', this.data.totalCount,
          'listLength=', this.data.shelfGoodsList ? this.data.shelfGoodsList.length : 0
        );
        this.resetScrollPosition();
        this._getShelfGoods();
      });
    },

    resetScrollPosition() {
      const needsForceReset = this.data.toTop === 0 ? 0.1 : 0;
      this.setData({
        toTop: needsForceReset,
        scrollViewTop: 0,
        scrollTopLeft: 0
      }, () => {
        if (needsForceReset !== 0) {
          this.setData({ toTop: 0 });
        }
      });
    },

    stopPropagation() {},

    updateShelfGoodsData(e){
    console.log("updateShelfGoodsData");
    // 重新获取当前货架的商品列表
    this._getShelfGoods();
  },

  
 _getShelfGoods(){

   console.log("_getShelfGoods_getShelfGoods")
   load.showLoading("获取商品");
 getShelfGoods({
   shelfId: this.data.shelfId,
   page: this.data.currentPage,
   limit: this.data.limit
 })
  .then(res =>{
    load.hideLoading();
    if(res.result.code == 0){
     const respData = res.result.data || res.result.page || {};
     const goodsList = Array.isArray(respData.list) ? respData.list : (Array.isArray(respData) ? respData : []);
     const totalPage = Number(respData.totalPage || respData.totalPages || this.data.totalPage || 0);
     const totalCount = Number(respData.totalCount || respData.total || this.data.totalCount || 0);
     const currPage = Number(respData.currPage || 1);
      this.setData({
       shelfGoodsList: goodsList,
       totalPage: totalPage,
      totalCount: totalCount,
      currentPage: currPage,
      isLoading: false,
      showNoDataHint: goodsList.length === 0,
      showEndHint: goodsList.length > 0 && currPage >= totalPage && totalPage > 0
      }, () => {
        console.log('[shelf/index] _getShelfGoods setData -> view=', this.data.isListView ? 'list' : 'grid',
          'currPage=', this.data.currentPage,
          'totalPage=', this.data.totalPage,
          'totalCount=', this.data.totalCount,
          'listLength=', this.data.shelfGoodsList.length
        );
      }) 
    }else{
      load.hideLoading();

    }
  })  
 },

  changeShelfId(e){
      console.log(e);
      console.log("abbdbdbddbds-changeShelfIdchangeShelfId")
      this.setData({
        shelfIndex: e.currentTarget.dataset.index,
        shelfItem: e.currentTarget.dataset.item,
        shelfId: e.currentTarget.dataset.id,
    currentPage: 1,
    isLoading: true
      }) 
  getShelfGoods({
    shelfId: e.currentTarget.dataset.id,
    page: 1,
    limit: this.data.limit
  })
      .then(res =>{
        console.log("reeee", res)
        if(res.result.code == 0){
          
          load.hideLoading();
      const respData = res.result.data || res.result.page || {};
      const goodsList = Array.isArray(respData.list) ? respData.list : (Array.isArray(respData) ? respData : []);
      const totalPage = Number(respData.totalPage || respData.totalPages || this.data.totalPage || 0);
      const totalCount = Number(respData.totalCount || respData.total || this.data.totalCount || 0);
      const currPage = Number(respData.currPage || 1);
          this.setData({
        shelfGoodsList: goodsList,
        totalPage: totalPage,
        totalCount: totalCount,
        isLoading: false,
        currentPage: currPage,
        showNoDataHint: goodsList.length === 0,
        showEndHint: goodsList.length > 0 && currPage >= totalPage && totalPage > 0
          }, () => {
            console.log('[shelf/index] changeShelfId setData -> view=', this.data.isListView ? 'list' : 'grid',
              'currPage=', this.data.currentPage,
              'totalPage=', this.data.totalPage,
              'totalCount=', this.data.totalCount,
              'listLength=', this.data.shelfGoodsList.length
            );
          }) 
        }else{
          load.hideLoading();
  
        }
      })  
    },

    toShowTools(e) {     
      if (this.data.isShowTools) {
        this.setData({
          isShowTools: false,
        })
      } else {
        this.setData({
          isShowTools: true,
        })
      }
     
    },

    hideShowTools(){
      this.setData({
        isShowTools: false,
        isEditShelf: false,
        showOperation: false,
      })
    },

    hideChoice() {
      this.setData({
        isEditGoods: false,
        showOperation: false,
        item: "",      
        isShowTools: false,
      })
     
    },

    changeShelf(e){
      this.setData({
        showOperation:false
      })
      wx.setStorageSync('shelfItem', this.data.shelfItem);
      wx.setStorageSync('shelfGoods', this.data.shelfGoods);
      wx.navigateTo({
        url: '/subPackage/pages/shelf/changeShelf/changeShelf?disId=' + this.data.disId,
      })
    },

    showChoice(e) {
      var disGoods = e.currentTarget.dataset.goods;
      this.setData({ 
        showOperation: true,
        isEditGoods: true,
        disGoods: disGoods,
        shelfGoods: e.currentTarget.dataset.shelfgoods,
      })
    },

    showEditGoods(e) {
      this.setData({ 
        showChoice: false,
        isEditGoods: true,
      })
    },
    
    addNew(e) {
      this.setData({
        showAdd: true,
        isEditShelf: false
      })
    },

    // auto
    showInputOrder(e) {
      this.setData({
        showPlanPurchase: true,
        item: this.data.disGoods,
        applyStandardName: this.data.disGoods.nxDgGoodsStandardname,
        windowHeight: this.data.windowHeight,
        showOperation: false
      })
    },

  /**
   * 显示操作面板，选择被操作商品
   * @param {}} e 
   */
  applyGoods() {
    this.setData({
      show: true,
      item: this.data.disGoods,
      applyStandardName: this.data.disGoods.nxDgGoodsStandardname,
      planOrder: '', // 重置采购数量
      priceLevel: '-1', // 重置价格等级
      showOperation: false,
      isEditPurchase: false, // 标识为新增模式
    })
  },

  // 打开订货弹窗name=朝天椒皮&id=26929&type=undefined&standard=袋
  toOpenDisPlanPurchase() {
    // 获取商品信息（从 shelfGoods 中获取）
    console.log("indotuutot");
    const shelfGoods = this.data.shelfGoods || {};
    const stockList = Array.isArray(shelfGoods.nxDisGoodsShelfStockEntities) ? shelfGoods.nxDisGoodsShelfStockEntities : [];
    let restWeightTotal = 0;
    stockList.forEach(item => {
      restWeightTotal += Number(item && item.nxDgssRestWeight ? item.nxDgssRestWeight : 0);
    });
    const disGoods = shelfGoods.nxDistributerGoodsEntity;
    if (!disGoods) {
      console.warn('toOpenDisPlanPurchase: disGoods is undefined');
      return;
    }
    // 根据 nxDgCartonUnit 是否为 null 决定使用哪个规格
    const standardName = disGoods.nxDgCartonUnit !== null && disGoods.nxDgCartonUnit !== undefined && disGoods.nxDgCartonUnit !== '' ?
      disGoods.nxDgCartonUnit :
      disGoods.nxDgGoodsStandardname;
    this.setData({
      show: true,
      item: disGoods,
      disGoods: disGoods,
      applyStandardName: standardName,
      windowHeight: this.data.windowHeight,
      showOperation: false,
      restWeight: restWeightTotal.toString(),
      maxRestWeight: restWeightTotal
    })
  },

  /**
   * 取消采购
   */
  cancle() {
    this.setData({
      show: false,
      showOperation: false,
      isEditPurchase: false, // 重置修改模式
    })
  },

  /**
   * 修改采购商品
   */
  editPurchaseGoods() {
    console.log('editPurchaseGoods called');
    console.log('shelfGoods:', this.data.shelfGoods);
    console.log('shelfPurGoods:', this.data.shelfGoods.shelfPurGoods);
    
    this.setData({
      showEditPurGoods: true,
      item: this.data.disGoods,
      applyStandardName: this.data.shelfGoods.shelfPurGoods.nxDpgStandard,
      planOrder: this.data.shelfGoods.shelfPurGoods.nxDpgQuantity.toString(),
      priceLevel: this.data.shelfGoods.shelfPurGoods.nxDpgCostLevel,
      purchaseGoods: this.data.shelfGoods.shelfPurGoods,
      showOperation: false,
      isEditPurchase: true, // 标识为修改模式
    })
    
    console.log('showEditPurGoods set to true');
  },

  /**
   * 接收采购商品
   */
  receivePurGoods() {
    wx.showModal({
      title: '确认接收',
      content: '确定要接收商品"' + this.data.shelfGoods.nxDistributerGoodsEntity.nxDgGoodsName + '"吗？',
      success: (res) => {
        if (res.confirm) {
          var purGoods = this.data.shelfGoods.shelfPurGoods;
          var data ={
            purGoodsId: purGoods.nxDistributerPurchaseGoodsId,
            userId: this.data.userId
          }
          load.showLoading("接收商品中");
          staffRecievePurGoods(data).then(res => {
            load.hideLoading();
            if (res.result.code == 0) {
              wx.showToast({
                title: '商品接收成功',
              })
              this.setData({
                showOperation: false,
                isEditGoods: false,
              })
              this._getShelfGoods();
            } else {
              wx.showToast({
                title: res.result.msg,
                icon: 'none'
              })
            }
          })
        }
      }
    })
  },

  /**
   * 确认修改采购商品
   */
  confirmEditPurGoods(e) {
    var purGoods = this.data.purchaseGoods;
    purGoods.nxDpgQuantity = e.detail.planOrder;
    purGoods.nxDpgStandard = e.detail.applyStandardName;
    purGoods.nxDpgCostLevel = e.detail.priceLevel;
    
    load.showLoading("修改进货商品")
    updatePurchaseGoods(purGoods).then(res => {
      if (res.result.code == 0) {
        wx.showToast({
          title: '进货商品修改成功',
        })
        load.hideLoading();
        this.setData({
          showEditPurGoods: false,
          showOperation: false,
          isEditPurchase: false,
        })
        this._getShelfGoods();
      } else {
        load.hideLoading();
        wx.showToast({
          title: res.result.msg,
          icon: 'none'
        })
      }
    })
  },

  /**
   * 关闭修改采购弹窗
   */
  closeEditPurGoods() {
    this.setData({
      showEditPurGoods: false,
      showOperation: false,
      isEditPurchase: false,
    })
  },

  /**
   * 删除采购商品
   */
  deletePurGoods() {
    var id = this.data.purchaseGoods.nxDistributerPurchaseGoodsId;
    
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这个采购商品吗？',
      success: (res) => {
        if (res.confirm) {
          load.showLoading("删除采购商品中");
          deletePlanPurchaseGoods(id).then(res => {
            load.hideLoading();
            if (res.result.code == 0) {
              wx.showToast({
                title: '删除成功',
              })
              this.setData({
                showEditPurGoods: false,
                showOperation: false,
              })
              this._getShelfGoods();
            } else {
              wx.showToast({
                title: res.result.msg,
                icon: 'none'
              })
            }
          })
        }
      }
    })
  },

    confirm(e){
     
      var goodsId = this.data.disGoods.nxDistributerGoodsId;
      var fatherGoodsId = this.data.disGoods.nxDgDfgGoodsFatherId;
      var grandGoodsId = this.data.disGoods.nxDgDfgGoodsGrandId;
      var plan = e.detail.planOrder;
      // 优先使用用户输入的规格，如果为空则使用商品默认规格
      var standard = (e.detail.applyStandardName && e.detail.applyStandardName.trim()) 
        ? e.detail.applyStandardName.trim() 
        : (this.data.item && this.data.item.nxDgGoodsStandardname 
          ? this.data.item.nxDgGoodsStandardname 
          : this.data.disGoods.nxDgGoodsStandardname || '');      
      
      var purGoods = {
        nxDpgDisGoodsId: goodsId,
        nxDpgDisGoodsFatherId: fatherGoodsId,
        nxDpgDisGoodsGrandId: grandGoodsId,
        nxDpgQuantity: plan,
        nxDpgStandard: standard,
        nxDpgDistributerId: this.data.disId,
        nxDpgInputType: 1,
        nxDpgCostLevel: e.detail.priceLevel,
        nxDpgPurchaseType: 0,
        nxDpgPurchaseDate: this.data.arriveDate
      }
      
      // 如果是修改模式，添加采购商品ID
      if (this.data.isEditPurchase && this.data.shelfGoods.shelfPurGoods) {
        purGoods.nxDistributerPurchaseGoodsId = this.data.shelfGoods.shelfPurGoods.nxDistributerPurchaseGoodsId;
      }
      var loadingText = this.data.isEditPurchase ? "修改进货商品" : "保存进货商品";
      var successText = this.data.isEditPurchase ? "进货商品修改成功" : "进货商品保存成功";
      
      load.showLoading(loadingText)
      staffApplyPurGoods(purGoods).then(res => {
        if (res.result.code  == 0) {
          wx.showToast({
            title: successText,
          })
          load.hideLoading();
          this.setData({
            show: false,
            showOperation: false,
            isEditPurchase: false, // 重置修改模式
          })
          this._getShelfGoods();
        }else{
          load.hideLoading();
          wx.showToast({
            title: res.result.msg,
            icon: 'none'
          })
        }
      })
    },
   



  _getDisShelfs() {
    // 1. 先拉左侧所有货架
    load.showLoading("查询货架中");
    getShelfsByUserId(this.data.userId).then(res => {
      load.hideLoading();
      if (res.result.code === 0) {
        const shelfList = res.result.data || [];
        if (shelfList.length > 0) {
          this.setData({
            shelfItem: res.result.data[0],
            shelfIndex: 0,
            shelfArr: shelfList,
            shelfId: res.result.data[0].nxDistributerGoodsShelfId,
          }, () => {
            // 2. 拉第一个货架的商品
            this._getShelfGoods();
          });
        }
      }
    });
  },



  editShelfState() {    
    wx.navigateTo({
      url: '/subPackage/pages/shelf/editShelf/editShelf?disId=' + this.data.disId,
    })
  },


toEditPurchaseGoods(e){
    this.setData({ 
      isShowTools: false,
    })
  wx.navigateTo({
    url: '/subPackage/pages/shelf/shelfGoodsSort/shelfGoodsSort?shelfId=' + this.data.shelfId,
  })
},

toBack(){
  wx.navigateBack({delta: 1});
},



editShelfName (){
    this.setData({
      showOperation: true,
      shelfItem: this.data.shelfArr[shelfIndex],
    })
  },



  toAddShelfGoods(e){
    this.setData({
      isShowTools: false,
    })

   var sort = this.data.totalCount;
   
    wx.navigateTo({
      url: '/subPackage/pages/shelf/resGoodsListShelf/resGoodsListShelf?name=' + this.data.shelfItem.nxDistributerGoodsShelfName
       + '&disId=' + this.data.disId + '&shelfId=' + this.data.shelfId + '&sort=' + sort + '&shelfSort=' + this.data.shelfItem.nxDistributerGoodsShelfSort,
    })
  },

  toAddShelfGoodsSort(e){
    this.setData({
      showOperation:false,     
    })

   var sort = this.data.shelfGoods.nxDgsgSort;
   sort = Number(sort) - Number(1);
    wx.navigateTo({
      url: '/subPackage/pages/shelf/resGoodsListShelf/resGoodsListShelf?name=' + this.data.shelfItem.nxDistributerGoodsShelfName
       + '&disId=' + this.data.disId + '&shelfId=' + this.data.shelfId + '&sort=' + sort + '&shelfSort=' + this.data.shelfItem.nxDistributerGoodsShelfSort,
    })
  },


  toAddPurchaseGoods(e){
    this.setData({
      isShowTools: false,
      showOperation:false,
    })
    wx.navigateTo({
      url: '../../../../subPackage/pages/shelf/addShelfPurchaseGoods/addShelfPurchaseGoods?shelfId=' + this.data.shelfId + '&disId=' + this.data.disId,
    })
  },





  deleteGoods() {
    // 检查是否有采购商品订单
    if (this.data.shelfGoods.shelfPurGoods !== null) {
      wx.showToast({
        title: '该商品有采购订单，无法删除',
        icon: 'none',
        duration: 2000
      })
      return
    }
    this.setData({
      showDeleteConfirm: true
    });
  },

  cancelDeleteGoods() {
    this.setData({
      showDeleteConfirm: false
    });
  },

  confirmDeleteGoods() {
    if (!this.data.shelfGoods) return;
    this.setData({
      showDeleteConfirm: false
    });
          load.showLoading("删除货架商品中");
          deleteShelfGoods(this.data.shelfGoods.nxDistributerGoodsShelfGoodsId)
          .then(res => {
            load.hideLoading();
            if (res.result.code == 0) {
              wx.showToast({
                title: '删除成功',
              })
              this.setData({
                showOperation: false,
                isEditGoods: false,
                item: "",
                shelfGoods: "",
              })
              this.updateShelfGoodsData();
            } else {
              wx.showToast({
                title: res.result.msg,
                icon: 'none'
              })
            }
    }).catch(() => {
      load.hideLoading();
      wx.showToast({
        title: '删除失败，请重试',
        icon: 'none'
          })
    });
  },

  /**
   * 弹窗获取页面高度
   * @param {*} e 
   */
  getFocus(e) {
    const app = getApp();
    const globalData = app.globalData;
    var modalContentHeight = (globalData.windowHeight - e.detail.keyboardHeight) * globalData.rpxR;
    this.setData({
      modalContentHeight: modalContentHeight
    })
  },

  editShelfName(e) {
    this.setData({
      showAdd: true,
      isShowTools: false,
      isEditShelf: true,
      showOperation:false
    })
    
  },


  toDeleteShelf() {
    load.showLoading("删除货架中");
    deleteShelf(this.data.shelfId)
    .then(res => {
      load.hideLoading();
      if (res.result.code == 0) {
        this.setData({
          isShowTools: false,
          shelfIndex: 0,
        })
        this._getDisShelfs();
      } else {
        wx.showToast({
          title: res.result.msg,
          icon: 'none'
        })
      }
    })
  },


  //添加进货
  confirmShelf(e) {

    var that = this;
    if (!this.data.isEditShelf) {
      var shelf = {
        nxDistributerGoodsShelfName: e.detail.shelfName,
        nxDistributerGoodsShelfDisId: this.data.disId,
        nxDistributerGoodsShelfSort: this.data.shelfArr.length + 1,
      }
      load.showLoading("保存数据中");
      saveNewShelf(shelf)
        .then(res => {
        load.hideLoading();
          if (res.result.code == 0) {
            var arr = that.data.shelfArr;
            arr.push(res.result.data);
            var data = "shelfArr";
            that.setData({
              [data]: arr,
              shelfId: res.result.data.nxDistributerGoodsShelfId,
              shelfItem: res.result.data,
              shelfIndex: that.data.shelfArr.length - 1 ,
              shelfGoodsList: [],
            })
           
          }
        })

    } else {

      var shelfId = this.data.shelfItem.nxDistributerGoodsShelfId
      var data = {
        shelfId: shelfId,
        shelfName: e.detail.shelfName
      }
      updateShelfName(data).then(res => {
        if (res.result.code == 0) {
          console.log(res);
          this.setData({
            showAdd: false
          })
          var data = "shelfArr[" + this.data.shelfIndex+"]";
          this.setData({
            [data]: res.result.data,
          })
        } else {
          wx.showToast({
            title: res.result.msg,
            icon: "none"
          })
        }
      })
    }
  },


  toSearch(){
    wx.navigateTo({
      url: '/subPackage/pages/shelf/shelfGoodsSearch/shelfGoodsSearch?disId=' + this.data.disId,
    })

  },


  showStock(){
    console.log('=== 点击修改库存 ===')
    console.log('shelfGoods:', this.data.shelfGoods)
    
    if (!this.data.shelfGoods) {
      console.error('错误：shelfGoods为null或undefined')
      wx.showToast({
        title: '商品数据异常',
        icon: 'none'
      })
      return
    }
    
    console.log('批次数据:', this.data.shelfGoods.nxDisGoodsShelfStockEntities)
    console.log('批次数量:', this.data.shelfGoods.nxDisGoodsShelfStockEntities ? this.data.shelfGoods.nxDisGoodsShelfStockEntities.length : 0)
    
    console.log('设置showStock为true')
    const totalRestWeight = this._calculateTotalRestWeight(this.data.shelfGoods)
    this.setData({
      showStock: true,
      showOperation:false,
      stockRestWeightTotal: totalRestWeight
    }, () => {
      console.log('setData完成，showStock应该为true')
      console.log('当前showStock值:', this.data.showStock)
      console.log('当前总剩余库存:', this.data.stockRestWeightTotal)
    })
  },

  showStockDetail(){
    console.log('=== 点击查看库存详细 ===')
    const shelfGoods = this.data.shelfGoods

    if (!shelfGoods) {
      console.error('错误：shelfGoods为null或undefined')
      wx.showToast({
        title: '商品数据异常',
        icon: 'none'
      })
      return
    }

    if (!shelfGoods.nxDisGoodsShelfStockEntities || shelfGoods.nxDisGoodsShelfStockEntities.length === 0) {
      wx.showToast({
        title: '暂无批次库存',
        icon: 'none'
      })
      return
    }

    this.setData({
      showStockDetail: true,
      showOperation: false
    }, () => {
      console.log('showStockDetail 设置完成，当前值:', this.data.showStockDetail)
      console.log('传入 shelfGoods 是否存在:', !!this.data.shelfGoods)
      if (this.data.shelfGoods && this.data.shelfGoods.nxDisGoodsShelfStockEntities) {
        console.log('批次数量:', this.data.shelfGoods.nxDisGoodsShelfStockEntities.length)
      }
    })
  },

  closeStockDetailModal(){
    this.setData({
      showStockDetail: false
    })
  },

  confirmStockDetail(e){
    const { stockId, restWeight, sellingPrice } = e.detail || {}
    if (!stockId) {
      console.warn('confirmStockDetail 缺少 stockId', e)
      wx.showToast({
        title: '批次数据异常',
        icon: 'none'
      })
      return
    }

    load.showLoading('保存中...')
    updateDisStock({
      stockId,
      restWeight,
      sellingPrice,
      disId: this.data.disId,
      userId: this.data.userId
    }).then(res => {
      load.hideLoading()
      if (res.result.code === 0) {
        wx.showToast({
          title: '更新成功',
          icon: 'success'
        })
        this.setData({
          showStockDetail: false,
          isEditGoods: false
        })
        this.refreshAfterStockOperation()
      } else {
        wx.showToast({
          title: res.result.msg || '更新失败',
          icon: 'none'
        })
      }
    }).catch(err => {
      console.error('更新库存失败:', err)
      load.hideLoading()
      wx.showToast({
        title: '网络错误',
        icon: 'none'
      })
    })
  },

  // 关闭库存弹窗
  closeStockModal(){
    this.setData({
      showStock: false,
    })
  },

  // 库存操作成功后刷新数据
  refreshAfterStockOperation(){
    // 刷新当前货架的商品列表
    this._getDisShelfs()
  },

  _calculateTotalRestWeight(shelfGoods = {}){
    const stockList = Array.isArray(shelfGoods.nxDisGoodsShelfStockEntities) ? shelfGoods.nxDisGoodsShelfStockEntities : []
    return stockList.reduce((sum, item) => {
      const weight = Number(item && item.nxDgssRestWeight ? item.nxDgssRestWeight : 0)
      return sum + (isNaN(weight) ? 0 : weight)
    }, 0)
  },

  onScrollToLower() {
    if (this.data.isLoading) return;
    if (this.data.shelfIndex === this.data.shelfArr.length) return;
    if (Number(this.data.currentPage) >= Number(this.data.totalPage)) {
      this.setData({
        showEndHint: this.data.shelfGoodsList.length > 0 && this.data.totalPage > 0
      });
      return;
    }
    const nextPage = (this.data.currentPage || 1) + 1;
    this.setData({ isLoading: true });
    getShelfGoods({
      shelfId: this.data.shelfId,
      page: nextPage,
      limit: this.data.limit
    }).then(res => {
      if (res.result.code === 0) {
        const respData = res.result.data || res.result.page || {};
        const newList = Array.isArray(respData.list) ? respData.list : (Array.isArray(respData) ? respData : []);
        const merged = (this.data.shelfGoodsList || []).concat(newList);
        const totalPage = Number(respData.totalPage || respData.totalPages || this.data.totalPage || 0);
        const totalCount = Number(respData.totalCount || respData.total || this.data.totalCount || 0);
        const currPage = Number(respData.currPage || nextPage);
        this.setData({
          shelfGoodsList: merged,
          totalPage: totalPage,
          totalCount: totalCount,
          currentPage: currPage,
          isLoading: false,
          showNoDataHint: merged.length === 0,
          showEndHint: merged.length > 0 && currPage >= totalPage && totalPage > 0
        }, () => {
          console.log('[shelf/index] onScrollToLower setData -> view=', this.data.isListView ? 'list' : 'grid',
            'currPage=', this.data.currentPage,
            'totalPage=', this.data.totalPage,
            'totalCount=', this.data.totalCount,
            'listLength=', this.data.shelfGoodsList.length
          );
        });
      } else {
        this.setData({ isLoading: false });
        wx.showToast({
          title: res.result.msg || '加载失败',
          icon: 'none'
        });
      }
    }).catch(() => {
      this.setData({ isLoading: false });
      wx.showToast({
        title: '加载失败，请检查网络',
        icon: 'none'
      });
    });
  },

  setShelfLayer() {
    const shelfGoods = this.data.shelfGoods;
    if (!shelfGoods || !shelfGoods.nxDistributerGoodsShelfGoodsId) {
      wx.showToast({
        title: '未找到货架商品',
        icon: 'none'
      });
      return;
    }

    const goodsName = shelfGoods.nxDistributerGoodsEntity
      ? shelfGoods.nxDistributerGoodsEntity.nxDgGoodsName
      : '';

    wx.showModal({
      title: '设置层架',
      content: goodsName ? `确认将「${goodsName}」设置为本层结尾？` : '确认设置该商品为本层结尾？',
      success: (res) => {
        if (!res.confirm) {
          return;
        }
        load.showLoading('设置层架');
        setShelfLayer(shelfGoods.nxDistributerGoodsShelfGoodsId)
          .then((response) => {
            load.hideLoading();
            const result = response.result || {};
            if (result.code === 0) {
              wx.showToast({
                title: result.msg || '设置成功',
                icon: 'success'
              });
              this.setData({
                showOperation: false
              });
              this.updateShelfGoodsData();
            } else {
              wx.showToast({
                title: result.msg || '设置失败',
                icon: 'none'
              });
            }
          })
          .catch((error) => {
            console.error('setShelfLayer error', error);
            load.hideLoading();
            wx.showToast({
              title: '设置失败，请重试',
              icon: 'none'
            });
          });
      }
    });
  },

  clearShelfLayer() {
    const shelfGoods = this.data.shelfGoods;
    if (!shelfGoods || !shelfGoods.nxDistributerGoodsShelfGoodsId) {
      wx.showToast({
        title: '未找到货架商品',
        icon: 'none'
      });
      return;
    }

    const goodsName = shelfGoods.nxDistributerGoodsEntity
      ? shelfGoods.nxDistributerGoodsEntity.nxDgGoodsName
      : '';

    wx.showModal({
      title: '取消层架',
      content: goodsName ? `确认取消「${goodsName}」的层架标记？` : '确认取消该商品的层架标记？',
      success: (res) => {
        if (!res.confirm) {
          return;
        }
        load.showLoading('取消层架');
        clearShelfLayer(shelfGoods.nxDistributerGoodsShelfGoodsId)
          .then((response) => {
            load.hideLoading();
            const result = response.result || {};
            if (result.code === 0) {
              wx.showToast({
                title: result.msg || '已取消',
                icon: 'success'
              });
              this.setData({
                showOperation: false
              });
              this.updateShelfGoodsData();
            } else {
              wx.showToast({
                title: result.msg || '取消失败',
                icon: 'none'
              });
            }
          })
          .catch((error) => {
            console.error('clearShelfLayer error', error);
            load.hideLoading();
            wx.showToast({
              title: '取消失败，请重试',
              icon: 'none'
            });
          });
      }
    });
  },

  


  onNavButtonTap(){
    wx.navigateTo({
      url: '../../disUserEdit/disUserEdit',
    })

    
  },


  }
})