
import apiUrl from '../../../../config.js'
var load = require('../../../../lib/load.js');

import {
  
  addShelfGoods,
  queryShelfNxGoodsWithNxDisByQuickSearch
}
from '../../../../lib/apiDistributer'

import { 
  downDisGoods,
}from '../../../../lib/apiibook'


Page({

  onShow(){
    if(this.data.add){
      var shelfItem = this.data.addItem;
      var arr = this.data.showArr;
      arr.push(shelfItem);
      this.setData({
        showArr: arr,
      })
    }
  },

  /**
   * 页面的初始数据
   */
  data: {
   
    showArr: [],
    searchStr: "",
    item: null,
    nxArr: [],
    keyboardVisible: true, // 标记键盘是否可见
    keyboardOffset: 0,
    rpxR: 1,
  },


  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    const app = getApp();
    const globalData = app.globalData;




    var value = wx.getStorageSync('userInfo');
    if (value) {
      this.setData({
        disId: value.nxDistributerEntity.nxDistributerId,
        userInfo: value
      })
    }

    var searchBar = 180;
 
     this.setData({
       windowWidth: globalData.windowWidth * globalData.rpxR,
       windowHeight: globalData.windowHeight * globalData.rpxR,
       navBarHeight: globalData.navBarHeight * globalData.rpxR,
       searchBoxHeight: searchBar * globalData.rpxR,
       orderDataHeight: 0,  // 用于存储订单数据区域的高度
       url: apiUrl.server,
       name: options.name,
       shelfId: options.shelfId,
       sort: options.sort,
       shelfSort: options.shelfSort,
       rpxR: globalData.rpxR || 1,
    })

    var shelf = wx.getStorageSync('shelfItem');
    if(shelf){
      this.setData({
        shelf: shelf
      })
    }
    
  },

  clearNx(){
    this.setData({
      nxArr: [],
    })
  },

  onFocus(e) {
    const height = (e.detail && e.detail.height) ? e.detail.height : 0;
    const keyboardOffset = height ? height * (this.data.rpxR || 1) : 0;
    this.setData({
      nxArr: [],
      keyboardVisible: true, // 键盘弹出
      keyboardOffset: keyboardOffset
    });
    console.log('键盘弹出');
  },

  onBlur(e) {
    this.setData({
      keyboardVisible: false, // 键盘收起,
      keyboardOffset: 0,
      // nxArr: [],
      // focusInput: true,
    });
    console.log('键盘收起');
  },

  getSearchStringNx(e){
     if(e.detail.value.length > 0){
      this.setData({
        nxArr: [],
        searchStr: e.detail.value,
      })
      var data = {
        searchStr: this.data.searchStr,
        disId: this.data.disId,
      }
      load.showLoading("搜索商品中");
      queryShelfNxGoodsWithNxDisByQuickSearch(data).then(res => {
        console.log(res);
        load.hideLoading();
        if (res.result.code == 0) {
          if (res.result.data.length > 0) {
            this.setData({
              nxArr: res.result.data,
              count: res.result.data.length,
            })
          } else {
            this.setData({
              nxArr: [],
            })
          }
        }
      })
  
     }else{
       this.setData({
        nxArr: [],
       })
     }
   
  },


  /**
   * 保存批发商商品
   * @param {*} e 
   */
  downLoadGoods: function (e) {
    this.setData({
      item: e.currentTarget.dataset.item,
      addIndex: e.currentTarget.dataset.index,

    })
    
    var dg = {
      nxDgDistributerId: this.data.disId,
      nxDgNxGoodsId: this.data.item.nxGoodsId,
      nxDgGoodsName: this.data.item.nxGoodsName,
      nxDgNxFatherId: this.data.fatherId,
      nxDgNxFatherImg: this.data.fatherImg,
      nxDgNxFatherName: this.data.fatherName,
      nxDgGoodsDetail: this.data.item.nxGoodsDetail,
      nxDgGoodsPlace: this.data.item.nxGoodsPlace,
      nxDgGoodsBrand: this.data.item.nxGoodsBrand,
      nxDgGoodsStandardname: this.data.item.nxGoodsStandardname,
      nxDgGoodsStandardWeight: this.data.item.nxGoodsStandardWeight,
      nxDgGoodsPinyin: this.data.item.nxGoodsPinyin,
      nxDgGoodsPy: this.data.item.nxGoodsPy,
      nxDgPullOff: 0,
      nxDgGoodsStatus: 0,
      nxDgPurchaseAuto: this.data.purchaseAuto,
      nxDgNxGoodsFatherColor: this.data.color,
      nxStandardEntities: this.data.item.nxGoodsStandardEntities,
      nxAliasEntities: this.data.item.nxAliasEntities,
      nxDgPurchaseAuto: 1,
    };

    load.showLoading("保存商品");
    var that = this;
    downDisGoods(dg)
      .then(res => {
        if (res.result.code == 0) {
          load.hideLoading();
          that.downSucuessToAddShelfGoods(res.result.data, that.data.addIndex);
        } else {
          load.hideLoading();
          wx.showToast({
            title: res.result.msg,
            icon: 'none'
          })
        }
      })
  },

  downSucuessToAddShelfGoods(data,index){
   
    var shelfItem = {
      nxDgsgDisGoodsId: data.nxDistributerGoodsId,
      nxDgsgShelfId: Number(this.data.shelfId),
      nxDistributerGoodsEntity: data,
      nxDgsgSort: Number(this.data.sort) + Number(1),
      nxDgsgShelfSort: this.data.shelfSort
    }
    var temp = [];
    temp.push(shelfItem);
    addShelfGoods(temp)
    .then(res =>{
      if(res.result.code == 0){
        var that  = this;
        var shelfList = that.data.showArr;
        shelfList.push(shelfItem);
        var spIndex = Number(that.data.addIndex);
        that.data.nxArr.splice(spIndex,1);
        if(that.data.nxArr.length == 0){
          that.setData({
            showArr: shelfList,
            sort:  Number(that.data.sort) + Number(1),
            focusInput: true,
            searchStr: "",
            nxArr: []
          })

        }else{
          that.setData({
            nxArr: that.data.nxArr,
            showArr: shelfList,
            sort:  Number(this.data.sort) + Number(1),
            searchStr: "",
          })
        }
        this.calculateOrderDataHeight();

      }
    })
  },

  addShelfGoods(e){
    var data = e.currentTarget.dataset.item;
    this.setData({
      addIndex: e.currentTarget.dataset.index,
    })
    var shelfItem = {
      nxDgsgDisGoodsId: data.nxDistributerGoodsId,
      nxDgsgShelfId: Number(this.data.shelfId),
      nxDistributerGoodsEntity: data,
      nxDgsgSort: Number(this.data.sort) + Number(1),
      nxDgsgShelfSort: this.data.shelfSort,
    }
    var temp = [];
    temp.push(shelfItem);
    addShelfGoods(temp)
    .then(res =>{
      if(res.result.code == 0){
        var that  = this;
        var shelfList = that.data.showArr;
        shelfList.push(shelfItem);
        var spIndex = Number(that.data.addIndex);
        that.data.nxArr.splice(spIndex,1);
       if(that.data.nxArr.length == 0){
        this.setData({
          showArr: shelfList,
          sort:  Number(that.data.sort) + Number(1),
          searchStr: "",
          nxArr: []
        })
       }else{
        that.setData({
           nxArr: that.data.nxArr,
          showArr: shelfList,
          sort:  Number(that.data.sort) + Number(1),
          searchStr: "",
        })
       }
       this.calculateOrderDataHeight();

      }
    })
  },


  calculateOrderDataHeight: function () {
    const query = wx.createSelectorQuery();
    query.select('.content-scroll').boundingClientRect(rect => {
      if (!rect) {
        return;
      }
      this.setData({
        orderDataHeight: rect.height || 0
      });
    }).exec();
  },


  
 toBack() {
   
    wx.navigateBack({
      delta: 1,
    })
  },
})


  // _againSearchString(e) {
  
  //     var data = {
  //       disId: this.data.disId,
  //       searchStr: this.data.searchStr,
  //       depId: this.data.depId,
  //     }
    
  //      queryDisShelfGoodsByQuickSearch,(data).then(res => {
  //       console.log(res)
  //       if (res.result.code == 0) {
  //         if (res.result.data.nxArr ==  -1) {
  //           this.setData({
  //             strArr: res.result.data.disArr,
  //             nxArr: [],
  //           })
  //         } else {
  //           if(res.result.data.nxArr !==  -1){
  //             this.setData({
  //               nxArr: res.result.data.nxArr,
  //               strArr: [],
  //             })
  //           }else{
  //             this.setData({
  //               strArr: [],
  //               nxArr: []
  //             })
  //           }
            
  //         }
  //       }
  //     })    
  // },



  // changeSearchType(e){
  //   if(this.data.searchType == 0){
  //     this.setData({
  //       searchStr: "",
  //       searchType: 1,
  //       nxArr: [],
  //       strArr: [],
  //       isSearching: false
  //     })
  //   }else{
  //     this.setData({
  //       searchStr: "",
  //       searchType: 0,
  //       nxArr: [],
  //       strArr: [],
  //       isSearching: false
  //     })
  //   }
  // },

 
//  getSearchString(e) {
//   this.setData({
//     isSearching: true,
//   })

//   if (e.detail.value.length > 0) {
//     this.setData({
//       searchStr: e.detail.value,
//     })

//     var data = {
//       disId: this.data.disId,
//       searchStr: e.detail.value,
//     }

//      queryDisShelfGoodsByQuickSearch(data).then(res => {
//       if (res.result.code == 0) {
//         this.setData({
//           strArr: res.result.data,
//           nxArr: [],
//           count: res.result.data.length,
//         })
//       }
//     })
//   } else {
//     this.setData({
//       searchArr: [],
//       isSearching: false,
//       searchStr: "",
//     })
//   }

// },
