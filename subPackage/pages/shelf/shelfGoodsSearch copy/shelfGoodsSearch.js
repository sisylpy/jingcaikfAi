var load = require('../../../../lib/load.js');

var dateUtils = require('../../../../utils/dateUtil');
import apiUrl from '../../../../config.js'
let windowWidth = 0;
let itemWidth = 0;
let heightArr = [0];
import {
 
  queryDisShelfGoods,

} from '../../../../lib/apiDistributer';



Page({
  data: {
    placeHolder: "输入商品名称或拼音字母、首字母",
    searchString: "",
    isSearching: false,
    disSearchArr: [],
  },


  onLoad: function (options) {
    const app = getApp();
    const globalData = app.globalData;

    this.setData({
      windowWidth: globalData.windowWidth * globalData.rpxR,
      windowHeight: globalData.windowHeight * globalData.rpxR,
      navBarHeight: globalData.navBarHeight * globalData.rpxR,
      url: apiUrl.server,
      disId: options.disId,
    })

  },



  getString(e){
    console.log("searchindindidnid");
   
      var string = e.detail.value;
      string = string.replace(/\s*/g, "");
      if(string.length > 0){
        this.setData({
          searchString: string
        })
      }else{
        this.setData({
          searchString: ""
        })
      }

  },

  getSearchString(e) {
   

    if (this.data.searchString.length > 0) {
      var data = {
        disId: this.data.disId,
        searchStr: this.data.searchString,
      }
      load.showLoading("搜索商品中...")
      queryDisShelfGoods(data).then(res => {
        if (res.result.code == 0) {
          console.log(res.result.data);
          load.hideLoading();
          this.setData({
            disSearchArr: res.result.data
          })
          
        } else {
          load.hideLoading();
          wx.showToast({
            title: res.result.msg,
            icon: "none"
          })

        }
      })
    } else {
      console.log("thisd.ata.dfasslenene===0")
      load.hideLoading();
      this.setData({
        disSearchArr: [],
        searchString: ""
      })
    }
  },




  deleteYes() {
    this.setData({
      deleteShow: false,
    })
    var that = this;
    deleteOrder(this.data.applyItem.nxDepartmentOrdersId).then(res => {
      if (res.result.code == 0) {
           this.setData({
             searchString: "",
             applyItem: "",
             editApply: false,
             isSearching: true,
           })
          that.getSearchStringPlaceHolder();

      }
    })
  },

  deleteNo() {
    this.setData({
      applyItem: "",
      deleteShow: false,
    })
  },


  /**
   * 修改配送商品申请
   */
  editApply() {
    var applyItem = this.data.applyItem;
    this.setData({
      show: true,
      applyStandardName: applyItem.nxDoStandard,
      itemDis: this.data.applyItem.nxDistributerGoodsEntity,
      editApply: true,
      applyNumber: applyItem.nxDoQuantity,
      applyRemark: applyItem.nxDoRemark,

    })
    if (applyItem.nxDoSubtotal !== null) {
      console.log("eidididiiidid");
      this.setData({
        applySubtotal: applyItem.nxDoSubtotal + "元"
      })

    }
  },


  _cancle() {
    this.setData({
      show: false,
      applyStandardName: "",
      itemDis: "",
      editApply: false,
      applyNumber: "",
      applyRemark: "",
      applySubtotal: ""
    })
  },

  // no use


  getSearchStringPlaceHolder() {

    var that = this;
    console.log("hpalslhdolddller");
    console.log(that.data.placeHolder.length);
    if (that.data.placeHolder.length > 0 ) {

      var data = {
        disId: this.data.disId,
        searchStr: this.data.placeHolder,
      }
      load.showLoading("搜索商品中...")
      queryDisShelfGoods(data).then(res => {
        if (res.result.code == 0) {
          load.hideLoading();
          this.setData({
            disSearchArr: res.result.data,
          })
        
        } else {
          load.hideLoading();
          wx.showToast({
            title: res.result.msg,
            icon: "none"
          })

        }
      })
    } else {
      this.setData({
        disSearchArr: [],
        isSearching: true,

      })

    }
  },



  delSearch() {
    this.setData({
      searchString: "",
      disSearchArr: []
    })
  },

  hideMask() {
    this.setData({
      showOperation: false,
    })
  },


  toBack() {
    wx.navigateBack({
      delta: 1
    })
  },

  onUnload(){
    if(this.data.orderCount > 0){
      var pages = getCurrentPages();
      var prevPage = pages[pages.length - 2]; //上一个页面
      //直接调用上一个页面的setData()方法，把数据存到上一个页面中去
      prevPage.setData({
        update: true
      })
    }
  }

})
