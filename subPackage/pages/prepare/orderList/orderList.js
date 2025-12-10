const globalData = getApp().globalData;
var load = require('../../../../lib/load.js');

import {
  saveDisPurGoodsBatch,
  givePurGoodsQuantity,
} from '../../../../lib/apiDepOrder'


Page({

  /**
   * 页面的初始数据
   */
  data: {

    showEditPurchase: false,
    haveOrder: false,
    canSave: false,
  },

  onShow() {

  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    this.setData({
      windowWidth: globalData.windowWidth * globalData.rpxR,
      windowHeight: globalData.windowHeight * globalData.rpxR,
      navBarHeight: globalData.navBarHeight * globalData.rpxR,

    })
    var value = wx.getStorageSync('userInfo');
    if (value) {
      this.setData({
        disId: value.nxDistributerEntity.nxDistributerId,
        userInfo: value,
        disInfo: value.nxDistributerEntity,
      })
    }

    var arr = wx.getStorageSync('selArr');
    this.setData({
      purGoodsArr: arr,
    })

    this._checkCanSave()

  },

  _checkCanSave() {
    var arr = this.data.purGoodsArr;
    var count = 0;
    for (var i = 0; i < arr.length; i++) {
      if (arr[i].nxDpgQuantity !== null) {
        console.log("coudndn", arr[i].nxDpgQuantity)
        count = Number(count) + Number(1);
      }
    }
    if (count == arr.length) {
      this.setData({
        canSave: true,
      })
    } else {
      this.setData({
        canSave: false
      })
    }
  },

  changeHaveOrder() {
    this.setData({
      haveOrder: !this.data.haveOrder
    })
  },

 
  saveBatch(e) {
    var type = e.currentTarget.dataset.type;
    var batch = {
      nxDpbDistributerId: this.data.disId,
      nxDPGEntities: this.data.purGoodsArr,
      nxDPBPurUserId: this.data.userInfo.nxDistributerUserId,
      nxDpbPurchaseType: type,
    }
    saveDisPurGoodsBatch(batch).then(res => {
      var that = this;
      if (res.result.code == 0) {
        if (type == 0) {
          console.log("batchId=" + res.result.data + "&retName=" + that.data.disInfo.nxDistributerName + "&disId=" + that.data.disId + "&purUserId=" + that.data.userInfo.nxDistributerUserId + '&fromBuyer=1')
          var that = this;
          wx.navigateToMiniProgram({
            appId: 'wxfa34176649802291',
            path: 'pages/txs/prepareBatch/prepareBatch?batchId=' + res.result.data + '&retName=' + that.data.disInfo.nxDistributerName + '&disId=' + that.data.disId + '&purUserId=' + that.data.userInfo.nxDistributerUserId + '&fromBuyer=1',
            envVersion: 'trial', //release  develop  trial
            success(res) {
              console.log("siisiss")
              
wx.navigateBack({delta: 1})
            },
            fail() {
              that.cancelDisBatch();
            },
          })
        } else if (type == 2) {

          that._paste();
        }
          
      } else {
        wx.showToast({
          title: res.result.msg,
          icon: 'none'
        })
      }
      
    })

  },


  _paste() {
    // 假设订单内容保存在 orderContent 变量中
    // let orderContent = "订单号：123456\n商品名称：商品A\n数量：2\n总价：¥200";
     var orderContent = this._getPasteContent();
    // 复制到剪贴板
    wx.setClipboardData({
      data: orderContent,
      success(res) {
        wx.showToast({
          title: '订单内容已复制',
          icon: 'success',
          duration: 2000
        });
      },
      fail(err) {
        console.log(err);
        wx.showToast({
          title: '复制失败，请重试',
          icon: 'none',
          duration: 2000
        });
      }
    });

  },

  _getPasteContent(){
    let orderContent = "订单号：123456\n商品名称：商品A\n数量：2\n总价：¥200";
    var arr = this.data.purGoodsArr;
   
    for (var i = 0; i < arr.length; i++) {
      if (arr[i].nxDpgQuantity !== null) {
        var goodsName = arr[i].nxDistributerGoodsEntity.nxDgGoodsName;
        var quantity =  arr[i].nxDpgQuantity;
        var standard = arr[i].nxDpgStandard;
        orderContent = i+ 1 +", " + goodsName + " " + quantity + standard + "\n";
      }
    }
    return orderContent
  },

  closeEditPurGoods() {
    this.setData({
      purchaseGoods: "",
      showEditPurchase: false,
      item: "",
      goodsIndex: "",
      planOrder: "",
      applyStandardName: "",
    })
  },

  toEditPurchaseGoods(e) {
    var puringGoods = e.currentTarget.dataset.item;
    var item = puringGoods.nxDistributerGoodsEntity;
    this.setData({
      purchaseGoods: puringGoods,
      showEditPurchase: true,
      item: item,
      goodsIndex: e.currentTarget.dataset.index,
      planOrder: puringGoods.nxDpgQuantity,
      applyStandardName: puringGoods.nxDpgStandard,
    })
  },


  confirmEditPurGoods(e) {
    console.log(e);
    var id = this.data.purchaseGoods.nxDistributerPurchaseGoodsId;
    var plan = e.detail.planOrder;
    var standard = e.detail.applyStandardName;
    var purGoods = {
      id: id,
      quantity: e.detail.planOrder,
      standard: e.detail.applyStandardName,
      level: e.detail.priceLevel,
    }
    var that = this;
    givePurGoodsQuantity(purGoods).then(res => {
      if (res.result.code == 0) {
        console.log(res);
        var data = "purGoodsArr[" + this.data.goodsIndex + "].nxDpgQuantity";
        var dataS = "purGoodsArr[" + this.data.goodsIndex + "].nxDpgStandard";
        this.setData({
          [data]: plan,
          [dataS]: standard,
          purchaseGoods: "",
          showEditPurchase: false,
          item: "",
          goodsIndex: "",
          planOrder: "",
        })
        that._checkCanSave();
      }
    })
  },




  toBack() {
    wx.navigateBack({
      delta: 1,
    })
  },

  onUnload() {
    // wx.removeStorageSync('selArr');
  },







})