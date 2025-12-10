


let self;
const app = getApp()
var load = require('../../../../lib/load.js');

import {
 
  getShelfGoods,
  updateShelfGoodsSort,
  deleteShelfGoods
} from '../../../../lib/apiDistributer'

Page({
  /**
   * 页面的初始数据
   */
  data: {
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
      shelfId: options.shelfId,
      navBarHeight: globalData.navBarHeight * globalData.rpxR,
    })
    self = this;

    this._getInitData();
    
  },

  _getInitData(){
   load.showLoading("获取商品中")
   getShelfGoods({
     shelfId: this.data.shelfId,
     page: 1,
     limit: 500
   })
    .then(res =>{
      if(res.result.code == 0){
        load.hideLoading();
        console.log(res);
       const respData = res.result.data || res.result.page || {};
       const goodsList = Array.isArray(respData.list) ? respData.list : (Array.isArray(respData) ? respData : []);
       this.setData({
         shelfGoodsList: goodsList,
       }) 
      }else{
        load.hideLoading();

      }
    })  
  },

  // 输入框失去焦点时触发排序
  onSortInputBlur: function(e) {
    console.log('🔍 输入框失去焦点事件');
    console.log('点击的商品索引:', e.currentTarget.dataset.index);
    console.log('点击的商品ID:', e.currentTarget.dataset.id);
    console.log('输入框的值:', e.detail.value);
    this._handleSortInput(e);
  },

  // 输入框确认时触发排序
  onSortInputConfirm: function(e) {
    console.log('🔍 输入框确认事件');
    console.log('点击的商品索引:', e.currentTarget.dataset.index);
    console.log('点击的商品ID:', e.currentTarget.dataset.id);
    console.log('输入框的值:', e.detail.value);
    this._handleSortInput(e);
  },

  // 处理排序输入
  _handleSortInput: function(e) {
    var index = e.currentTarget.dataset.index;
    var id = e.currentTarget.dataset.id;
    var value = parseInt(e.detail.value);
    
    console.log('=== 开始排序操作 ===');
    console.log('输入排序值:', value);
    console.log('当前商品索引:', index);
    console.log('当前商品ID:', id);
    
    // 通过ID查找当前商品，而不是通过索引
    var shelfGoodsList = this.data.shelfGoodsList;
    var currentItem = null;
    var currentIndex = -1;
    
    for (var i = 0; i < shelfGoodsList.length; i++) {
      if (shelfGoodsList[i].nxDistributerGoodsShelfGoodsId == id) {
        currentItem = shelfGoodsList[i];
        currentIndex = i;
        break;
      }
    }
    
    if (!currentItem) {
      console.log('❌ 未找到对应商品');
      return;
    }
    
    console.log('当前商品名称:', currentItem.nxDistributerGoodsEntity.nxDgGoodsName);
    console.log('当前商品原排序:', currentItem.nxDgsgSort);
    console.log('当前商品实际索引:', currentIndex);
    
    // 显示网格布局的索引映射
    console.log('📊 网格布局索引映射:');
    shelfGoodsList.forEach((item, idx) => {
      var row = Math.floor(idx / 4) + 1;
      var col = (idx % 4) + 1;
      console.log(`  数组索引${idx}: ${item.nxDistributerGoodsEntity.nxDgGoodsName} → 第${row}行第${col}列`);
    });
    
    if (isNaN(value) || value <= 0) {
      console.log('❌ 输入值无效，退出排序');
      wx.showToast({
        title: '请输入有效的排序数字',
        icon: 'none'
      });
      return;
    }
    
    console.log('📋 排序前商品列表:');
    shelfGoodsList.forEach((item, idx) => {
      var row = Math.floor(idx / 4) + 1;
      var col = (idx % 4) + 1;
      console.log(`  ${idx + 1}. ${item.nxDistributerGoodsEntity.nxDgGoodsName} (排序:${item.nxDgsgSort}) [第${row}行第${col}列]`);
    });
    
    // 如果输入的值超出范围，提示错误
    if (value > shelfGoodsList.length) {
      console.log('❌ 排序值超出范围，退出排序');
      wx.showToast({
        title: '排序号不能超过商品总数',
        icon: 'none'
      });
      return;
    }
    
    // 如果输入的值就是当前位置，不需要移动
    if (value === currentIndex + 1) {
      console.log('✅ 位置相同，无需移动');
      return;
    }
    
    console.log(`🔄 开始移动商品: ${currentItem.nxDistributerGoodsEntity.nxDgGoodsName}`);
    console.log(`   从位置 ${currentIndex + 1} 移动到位置 ${value}`);
    
    // 将当前项从数组中移除
    shelfGoodsList.splice(currentIndex, 1);
    console.log('   1. 已从原位置移除商品');
    
    // 将当前项插入到新的位置（value-1 因为数组索引从0开始）
    shelfGoodsList.splice(value - 1, 0, currentItem);
    console.log(`   2. 已插入到新位置 ${value}`);
    
    console.log('📋 移动后商品列表:');
    shelfGoodsList.forEach((item, idx) => {
      var row = Math.floor(idx / 4) + 1;
      var col = (idx % 4) + 1;
      console.log(`  ${idx + 1}. ${item.nxDistributerGoodsEntity.nxDgGoodsName} (排序:${item.nxDgsgSort}) [第${row}行第${col}列]`);
    });
    
    // 更新所有项的排序号
    console.log('🔄 开始重新编号...');
    for (var i = 0; i < shelfGoodsList.length; i++) {
      var oldSort = shelfGoodsList[i].nxDgsgSort;
      shelfGoodsList[i].nxDgsgSort = i + 1;
      console.log(`   ${shelfGoodsList[i].nxDistributerGoodsEntity.nxDgGoodsName}: ${oldSort} → ${i + 1}`);
    }
    
    console.log('📋 重新编号后商品列表:');
    shelfGoodsList.forEach((item, idx) => {
      var row = Math.floor(idx / 4) + 1;
      var col = (idx % 4) + 1;
      console.log(`  ${idx + 1}. ${item.nxDistributerGoodsEntity.nxDgGoodsName} (排序:${item.nxDgsgSort}) [第${row}行第${col}列]`);
    });
    
    this.setData({
      shelfGoodsList: shelfGoodsList,
      isChanged: true
    });
    console.log('✅ 页面数据已更新');
    
    // 添加一个小延迟确保UI更新
    setTimeout(() => {
      console.log('📋 UI更新后的最终状态:');
      this.data.shelfGoodsList.forEach((item, idx) => {
        var row = Math.floor(idx / 4) + 1;
        var col = (idx % 4) + 1;
        console.log(`  ${idx + 1}. ${item.nxDistributerGoodsEntity.nxDgGoodsName} (排序:${item.nxDgsgSort}) [第${row}行第${col}列]`);
      });
      console.log('=== 排序操作完成 ===');
    }, 100);
  },

  saveChange(){
    var arr = this.data.shelfGoodsList;
    var temp = [];
    for(var i = 0; i < arr.length; i++){
      var item = arr[i];
      item.nxDgsgSort = i + 1;
      temp.push(item);
    }
    load.showLoading("保存修改商品")
    updateShelfGoodsSort(temp)
    .then(res =>{
      if(res.result.code == 0){
        load.hideLoading();
        var pages = getCurrentPages();
        var prevPage = pages[pages.length - 2]; //上一个页面
        //直接调用上一个页面的setData()方法，把数据存到上一个页面中去
        prevPage.setData({
          update: true,
        })
        wx.navigateBack({
          delta: 1,
        })
      }else {
        load.hideLoading();
      }
    })
  },

  deleteGoods(e){
     deleteShelfGoods(e.currentTarget.dataset.id)
     .then(res =>{
       if(res.result.code == 0){
         
         this._getInitData();
       }
     })
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

  toBack(){
    wx.navigateBack({
      delta: 1,
    })
  },

})

