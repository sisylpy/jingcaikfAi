var load = require('../../../../lib/load.js');
var app = getApp()

import {
  disGetShelfList,
  updateShelfGoods

} from '../../../../lib/apiDistributer'

Page({

  /**
   * 页面的初始数据
   */
  data: {
   

  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    const globalData = app.globalData;


    this.setData({
     windowWidth: globalData.windowWidth * globalData.rpxR,
        windowHeight: globalData.windowHeight * globalData.rpxR,
        navBarHeight: globalData.navBarHeight * globalData.rpxR,
        disId: options.disId

    })

    var shelf = wx.getStorageSync('shelfItem');
    if(shelf){
      this.setData({
        shelf: shelf
      })
    }
    var disGoods = wx.getStorageSync('goodsItem');
    if(disGoods){
      this.setData({
        disGoods: disGoods
      })
    }
    var shelfGoods = wx.getStorageSync('shelfGoods');
    if(shelfGoods){
      this.setData({
        shelfGoods: shelfGoods
      })
    }
 

    this._initData();
  },

  _initData(){

    disGetShelfList(this.data.disId)
    .then(res =>{
      if(res.result.code == 0){
        this.setData({
          shelfArr: res.result.data.shelfArr
        })
      }
    })


  },


  shelfChange(e){
    var index = e.detail.value;
    var shelfItem = this.data.shelfArr[index];
    var shelfId = shelfItem.nxDistributerGoodsShelfId;
    console.log(shelfId);
    var shelfGoods = this.data.shelfGoods;
    var oldId = shelfGoods.nxDgsgShelfId;
    if(oldId !== shelfId){
      this.setData({
        canSave: true,
      })
      shelfGoods.nxDgsgShelfId = shelfId;
      shelfGoods.nxDgsgShelfSort = shelfItem.nxDistributerGoodsShelfSort
    }
    
  },

  save(){

    updateShelfGoods(this.data.shelfGoods).then(res =>{
      if(res.result.code == 0){
        var pages = getCurrentPages();
        var prevPage = pages[pages.length - 2];
        prevPage.setData({
          update: true
        })
        wx.navigateBack({delta: 1});
      }
    })
  },

  
  toBack() {
    wx.navigateBack({
      delta: 1,
    })
  },


})