var load = require('../../../../lib/load.js');
var app = getApp()

import {
  disGetShelfList,
  updateShelfSort

} from '../../../../lib/apiDistributer'

Page({

  /**
   * 页面的初始数据
   */
  data: {
    movableViewInfo: {
      y: 0,
      showClass: 'none',
      shelfGoods: {},
     
    },

    pageInfo: {
      rowHeight: 47,
      scrollHeight: 90,
      startIndex: null,
      scrollY: true,
      readyPlaceIndex: null,
      startY: 0,
      selectedIndex: null,
    },
    isChanged: false,
    
    hide: false,
    scrollTop: 0
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    const globalData = app.globalData;


    this.setData({
     windowWidth: globalData.windowWidth * globalData.rpxR,
        windowHeight: globalData.windowHeight * globalData.rpxR,
        statusBarHeight: globalData.statusBarHeight * globalData.rpxR,
        disId: options.disId

    })

 

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



  dragStart: function (event) {
    console.log(event)
    var startIndex = event.target.dataset.index
    console.log('获取到的元素为', this.data.shelfArr[startIndex])
    // 初始化页面数据
    var pageInfo = this.data.pageInfo
    pageInfo.startY = event.touches[0].clientY
    pageInfo.readyPlaceIndex = startIndex
    pageInfo.selectedIndex = startIndex
    pageInfo.scrollY = false
    pageInfo.startIndex = startIndex
    
    this.setData({
      'movableViewInfo.y': pageInfo.startY - (pageInfo.rowHeight / 2)
    })
    // 初始化拖动控件数据
    var movableViewInfo = this.data.movableViewInfo
    movableViewInfo.shelfGoods = this.data.shelfArr[startIndex].nxDistributerGoodsShelfName;
    movableViewInfo.showClass = "inline"
    console.log(movableViewInfo);
    this.setData({
      movableViewInfo: movableViewInfo,
      pageInfo: pageInfo
    })
  },

  dragMove: function (event) {
    var optionList = this.data.shelfArr
    var pageInfo = this.data.pageInfo
    // 计算拖拽距离
    var movableViewInfo = this.data.movableViewInfo
    var movedDistance = event.touches[0].clientY - pageInfo.startY
    movableViewInfo.y = pageInfo.startY - (pageInfo.rowHeight / 2) + movedDistance
    console.log('移动的距离为', movedDistance)

    // 修改预计放置位置
    var movedIndex = parseInt(movedDistance / pageInfo.rowHeight)
    var readyPlaceIndex = pageInfo.startIndex + movedIndex
    if (readyPlaceIndex < 0 ) {
      readyPlaceIndex = 0
    }
    else if (readyPlaceIndex >= optionList.length){
      readyPlaceIndex = optionList.length - 1
    }
    
    if (readyPlaceIndex != pageInfo.selectedIndex ) {
      var selectedData = optionList[pageInfo.selectedIndex]
      optionList.splice(pageInfo.selectedIndex, 1)
      optionList.splice(readyPlaceIndex, 0, selectedData)
      pageInfo.selectedIndex = readyPlaceIndex

    }
    // 移动movableView
    pageInfo.readyPlaceIndex = readyPlaceIndex
    // console.log('移动到了索引', readyPlaceIndex, '选项为', optionList[readyPlaceIndex])
    console.log(movableViewInfo);
    this.setData({
      movableViewInfo: movableViewInfo,
      shelfArr: optionList,
      pageInfo: pageInfo,
    })
  },

  dragEnd: function (event) {
    // 重置页面数据
    var pageInfo = this.data.pageInfo
    pageInfo.readyPlaceIndex = null
    pageInfo.startY = null
    pageInfo.selectedIndex = null
    pageInfo.startIndex = null
    pageInfo.scrollY = true
    // 隐藏movableView
    var movableViewInfo = this.data.movableViewInfo
    movableViewInfo.showClass = 'none'
  
    this.setData({
      pageInfo: pageInfo,
      movableViewInfo: movableViewInfo ,
      isChanged: true

    })
    console.log(this.data.shelfArr);
  },


  onPageScroll: function (e) {
    var _this = this;
    if (e.scrollTop <= 0) {
      e.scrollTop = 0;
    } else if (e.scrollTop > wx.getSystemInfoSync().windowHeight) {
      e.scrollTop = wx.getSystemInfoSync().windowHeight;
    }

    if (e.scrollTop > this.data.scrollTop || e.scrollTop == wx.getSystemInfoSync().windowHeight) {
      this.setData({
        hide: true
      })
    } else {
      this.setData({
        hide: false
      })
    }
    setTimeout(function () {
      _this.setData({
        scrollTop: e.scrollTop
      })
    }, 0)
  },



  saveChange(){
   
    load.showLoading("保存修改货架")
    updateShelfSort(this.data.shelfArr)
    .then(res =>{
      if(res.result.code == 0){
        load.hideLoading();
        wx.navigateBack({
          delta: 1,
        })
      }else {
        load.hideLoading();
      }
    })
  },

  
  toBack() {
    wx.navigateBack({
      delta: 1,
    })
  },


})