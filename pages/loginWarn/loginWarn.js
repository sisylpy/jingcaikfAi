const globalData = getApp().globalData;
var load = require('../../lib/load.js');
const app = getApp();
var commercialUsage = require('../../utils/commercialUsage.js');

import {
  disAndUserSave,
  disAndUserSaveWork,
  weighterLoginKf,
  disLoginWork,
  getSysTypeList
} from '../../lib/apiDistributer'

Page({

  data: {
    canLogin: false,
    accept: false,
    address: null,
    marketName: null,
    name: null,
    phone: null,
    showSelect: false,
    items: [{
        name: '0',
        value: '专业品批发'
      },
      {
        name: '1',
        value: '全品配送',
      },
      {
        name: '2',
        value: '平台'
      },
      
    ],
    longitude: 0,
    latitude: 0,
    marketId: -1,
    down: false
  },

  onLoad: function (options) {
    this.setData({
      windowWidth: globalData.windowWidth * globalData.rpxR,
      windowHeight: globalData.windowHeight * globalData.rpxR,
      environment: globalData.environment,
    })


    getSysTypeList(1).then(res =>{
      if(res.result.code ==0 ){
        this.setData({
          itemsMarket: res.result.data,
        })
      }
    })
  },


  radioChange: function (e) {
    console.log(e);
    var value = e.detail.value
    this.setData({
      type: value,
      selected: true,
      typeName: this.data.items[value].value,
      showSelect: false
    })
    this._canLogin();
  },

  //radioChangeMarket
  radioChangeMarket: function (e) {
    console.log(e);
    var value = e.detail.value
    this.setData({
      typeId: this.data.itemsMarket[value].sysBusinessTypeId,
      selected: true,
      marketName: this.data.itemsMarket[value].sysBusinessTypeName,
      showMarket: false
    })
    this._canLogin();
  },


  downIf(e){
    console.log(e);

    this.setData({
      down: e.detail.value
    })
  },

  getName: function (e) {
    console.log("getNamegetNamegetName")
    if (e.detail.value.length > 0) {
      this.setData({
        name: e.detail.value,
      })

    }else{
      this.setData({
        name: null,
      })
    }
    this._canLogin();
  },

  


  getAddress(e) {
    console.log("getAddressgetAddress")
    if (e.detail.value.length > 0) {
      this.setData({
        address: e.detail.value,
      })
    }else{
      this.setData({
        address: null,
      })
    }
    this._canLogin();

  },
  //


  getPhone(e) {
    console.log("getPhonegetPhone")
    if (e.detail.value.length > 0) {
      var myreg = /^[1][3,4,5,7,8,9][0-9]{9}$/;

      if (!(myreg.test(e.detail.value))) {
        wx.showModal({
          title: '手机号码不正确',
          showCancel: false,
          confirmText: "知道了",
        })
      } else {
        this.setData({
          phone: e.detail.value,
        })
        this._canLogin(e);
      }
    } else {
      this.setData({
        phone: null,
      })
    }
  },


  _canLogin() {
    console.log("_canLogin_canLogin----")
    if (this.data.name !==  null && this.data.marketName !== null && this.data.address !== null  && this.data.phone !== null ) {
      this.setData({
        canLogin: true,
      })
    }else{
      this.setData({
        canLogin: false,
      })
    }
  },


  //微信授权点击“允许”
  getUserInfo: function (e) {

    if (e.currentTarget.dataset.type == "register") {
      if(this.data.environment == 'wxwork'){
        this._registerWork(e);
      }else{
        this._register(e);
      }
    }
    if (e.currentTarget.dataset.type == "login") {
      if(this.data.environment == 'wxwork'){
        this._loginWork(e);
      }else{
      this._login(e);
      }
    }
  },

  showSelect() {
    this.setData({
      showSelect: true
    })
  },
  closeType(e) {
    console.log(e)
    this.setData({
      showSelect: false
    })

  },


  //


  showMarket() {
    this.setData({
      showMarket: true
    })
  },

  closeMarket(e) {
    console.log(e)
    this.setData({
      showMarket: false
    })

  },

  _login() {

    wx.login({
      success: (res) => {
        load.hideLoading();
        var disUser = {
          nxWuLoginCode: res.code,
        }
        weighterLoginKf(disUser)
          .then((res) => {
            if (res.result.code !== -1) { //登陆成功
              wx.setStorageSync('userInfo', res.result.data.userInfo);
              wx.setStorageSync('disInfo', res.result.data.disInfo)
              app.globalData.userInfo = res.result.data.userInfo;
              wx.switchTab({
                url: '../order/index/index',
              })
            } else { // 登陆失败
              wx.showModal({
                title: res.result.msg,
                content: "请注册",
                showCancel: false,
                confirmText: "知道了",
              })

            }
          })
      },
      fail: (res => {
        load.hideLoading();
        wx.showToast({
          title: res,
          icon: 'none',
          duration: 10000,
        })
      })
    })
  },


  _register(e) {
    if (this.data.canLogin && this.data.name.length > 0) {
      wx.getUserProfile({
        desc: '用于完善会员资料', // 声明获取用户个人信息后的用途，后续会展示在弹窗中，请谨慎填写
        success: resUser => {
          wx.login({
            success: (res) => {
              load.showLoading("注册新用户")
              var serviceArr = [{
                  nxDsCityId: 1,
                  nxDsCityName: "北京市"
                },
                {
                  nxDsCityId: 6,
                  nxDsCityName: "河北省 三河市"
                }
              ];
              var dep = {
                nxDistributerName: this.data.name,
                nxDistributerAddress: this.data.address,
                nxDistributerMarketName: this.data.marketName,
                nxDistributerImg: "uploadImage/r.jpg",
                nxDistributerLan: this.data.latitude,
                nxDistributerLun: this.data.longitude,
                nxDistributerPhone: this.data.phone,
                nxDistributerBusinessTypeId: this.data.typeId,
                nxDistributerType: this.data.type,
                isSelected: this.data.down,
                nxDistributerServiceCityEntities: serviceArr,
                nxDistributerUserEntity: {
                  nxDiuWxNickName: resUser.userInfo.nickName,
                  nxDiuWxAvartraUrl: resUser.userInfo.avatarUrl,
                  nxWuLoginCode: res.code,
                  nxDiuAdmin: 0,
                  nxDiuPrintDeviceId: -1,
                  nxDiuPrintBillDeviceId: -1,
                }
              }
              console.log(dep);
              disAndUserSave(dep)
                .then((res) => {                
                  if (res.result.code !== -1) { //注册成功
                    load.hideLoading()
                    wx.setStorageSync('userInfo', res.result.data.userInfo);
                    wx.setStorageSync('disInfo', res.result.data.disInfo)
                    wx.setStorageSync('commercialEntitlement',
                      res.result.data.commercialEntitlement || null)
                    commercialUsage.saveFromLogin(res.result.data)
                    app.globalData.userInfo = res.result.data.userInfo;
                    wx.switchTab({
                      url: '../order/index/index',
                    })
                  } else { //注册失败
                   
                    wx.showToast({
                      title: res.result.msg,
                      icon: 'none'
                    })
                    load.hideLoading();
                  }
                })
            },
            fail: (res => {
              load.hideLoading();
              wx.showToast({
                title: res,
                icon: 'none'
              })
            })
          })
        },
        fail: res => {
          wx.showToast({
            title: "请检查网络",
            icon: 'none'
          })
          setTimeout(() => {
            load.showLoading("注册用户并设置商品，需要2分钟时间。");
            //  this._login();
           }, 2000);
        }
      })
    } else {
      wx.showToast({
        title: '请填写完整注册项',
        icon: 'none'
      })
    }
  },

  _registerWork(e) {
    console.log("wxqyeredg")
    if (this.data.canLogin && this.data.name.length > 0) {
      wx.getUserProfile({
        desc: '用于完善会员资料', // 声明获取用户个人信息后的用途，后续会展示在弹窗中，请谨慎填写
        success: resUser => {
          console.log(resUser)
          wx.qy.login({
            suiteId: 'ww2cddb5d2d7b3ee5d',
            success: (resQy) => {
              console.log(resQy);
              if(resQy.code){
                load.showLoading("注册新用户")
                var serviceArr = [{
                    nxDsCityId: 1,
                    nxDsCityName: "北京市"
                  },
                  {
                    nxDsCityId: 6,
                    nxDsCityName: "河北省 三河市"
                  }
                ];

                var dep = {
                  nxDistributerName: this.data.name,
                  nxDistributerAddress: this.data.address,
                  nxDistributerMarketName: this.data.marketName,
                  nxDistributerImg: "uploadImage/r.jpg",
                  nxDistributerLan: this.data.latitude,
                  nxDistributerLun: this.data.longitude,
                  nxDistributerPhone: this.data.phone,
                  nxDistributerBusinessTypeId: this.data.typeId,
                  nxDistributerType: this.data.type,
                  isSelected: this.data.down,
                  nxDistributerServiceCityEntities: serviceArr,
                  qyNxDisCorpEntity: {
                    // qyNxDisCorpName: 
                  },
                  nxDistributerUserEntity: {
                    nxDiuWxNickName: resUser.userInfo.nickName,
                    nxDiuWxAvartraUrl: resUser.userInfo.avatarUrl,
                    nxWuLoginCode: resQy.code,
                    nxDiuAdmin: 0,
                    nxDiuPrintDeviceId: -1,
                    nxDiuPrintBillDeviceId: -1,
                  }
                }
                disAndUserSaveWork(dep)
                  .then((res) => {
                    wx.hideLoading()
                    if (res.result.code !== -1) { //注册成功
                      wx.setStorageSync('userInfo', res.result.data.userInfo);
                      wx.setStorageSync('disInfo', res.result.data.disInfo)
                      wx.setStorageSync('commercialEntitlement',
                        res.result.data.commercialEntitlement || null)
                      commercialUsage.saveFromLogin(res.result.data)
                      app.globalData.userInfo = res.result.data.userInfo;
                      wx.switchTab({
                        url: '../order/index/index',
                      })
                    } else { //注册失败
                      wx.showToast({
                        title: res.result.msg,
                        icon: 'none'
                      })
                      load.hideLoading();
                    }
                  })
              }
            },
            fail: (res => {
              load.hideLoading();
              wx.showToast({
                title: res,
                icon: 'none'
              })
              
            })
          })
        },
        fail: res => {
          setTimeout(() => {
            load.showLoading("注册用户并设置商品，需要2分钟时间。");
            //  this._login();
           }, 2000);
          // wx.showToast({
          //   title: "请检查网络",
          //   icon: 'none'
          // })

        }
      })
    } else {
      wx.showToast({
        title: '请填写完整注册项',
        icon: 'none'
      })
    }


  },

  _loginWork() {

    wx.qy.login({
      suiteId: 'ww2cddb5d2d7b3ee5d', 
      success: (resQy) => {
        if(resQy.code){
          load.hideLoading();
          var disUser = {
            nxWuLoginCode: resQy.code,
          }
          disLoginWork(disUser)
            .then((res) => {
              if (res.result.code !== -1) { //登陆成功
                wx.setStorageSync('userInfo', res.result.data.userInfo);
                wx.setStorageSync('disInfo', res.result.data.disInfo)
                app.globalData.userInfo = res.result.data.userInfo;
                wx.switchTab({
                  url: '../order/index/index',
                })
              } else { // 登陆失败
                wx.showModal({
                  title: res.result.msg,
                  content: "请注册",
                  showCancel: false,
                  confirmText: "知道了",
                })
  
              }
            })

        }
       
      },
      fail: (res => {
        load.hideLoading();
        wx.showToast({
          title: res,
          icon: 'none',
          duration: 10000,
        })
      })
    })
  },
  
  




})
