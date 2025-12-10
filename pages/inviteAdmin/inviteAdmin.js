const globalData = getApp().globalData;
var load = require('../../lib/load.js');
var utils = require('../../utils/util')
const app = getApp();

import {
  disUserSave,
  disKfUserSaveWithFile,
  disUserSaveWithFileWork,
  disLoginKf,
  disLoginWork
} from '../../lib/apiDistributer'

Page({

  data: {
    corpId: "-1",
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    this.setData({
      windowWidth: globalData.windowWidth * globalData.rpxR,
      windowHeight: globalData.windowHeight * globalData.rpxR,
      navBarHeight: globalData.navBarHeight * globalData.rpxR,
      nickName: "",
      disId: options.disId,
    })

    if (options.q) {
      //获取二维码的携带的链接信息
      let qrUrl = decodeURIComponent(options.q)
      var that = this;
      that.setData({
        //获取链接中的参数信息
        disId: utils.getQueryString(qrUrl, 'disId'),
        disName: utils.getQueryString(qrUrl, 'disName'),
        admin: utils.getQueryString(qrUrl, 'admin'),
      })
    }

    this._aaa();
  },

  /**
   * 分享给微信好友
   * @param {*} options 
   */
  onShareAppMessage: function (options) {
    const disId = this.data.disId;
    const disName = this.data.disName || '配送商';
    
    return {
      title: `邀请您加入${disName}的拣货团队`, 
      path: '/pages/inviteAdmin/inviteAdmin?disId=' + disId + '&disName=' + encodeURIComponent(disName) + '&admin=0',
      imageUrl: '',
    }
  },
  


  _aaa() {
    wx.login({
      success: (res) => {
        console.log(res);
        this.setData({
          code: res.code
        })
      },

      fail: (res => {
        wx.showToast({
          title: '请重新操作',
          icon: 'none'
        })
      })
    })
  },



  //微信授权点击“允许”
  getUserInfo: function (e) {

    if (e.currentTarget.dataset.type == "register") {
      this._registerWork(e);
    }
    if (e.currentTarget.dataset.type == "login") {
      if(this.data.environment == 'wxwork'){
        this._loginWork();
      }else{
        this._login(e);
      }
    }
  },


  onChooseAvatar(e) {
    console.log(e);
    var that = this;
    var src = [];
    src.push(e.detail.avatarUrl)
    var filePathList = src;
    var userName = this.data.nickName;
    var disId = this.data.disId;
    var code = this.data.code;
   
    disKfUserSaveWithFile(filePathList, userName, code, disId).then((res) => {
      console.log(res);
      if (res.result == '{"code":0}') {
        that._login();

      } else {
        load.hideLoading();
        wx.showToast({
          title: "请直接登陆",
          icon: 'none'
        })
      }

    })


  },


  getNickName(e) {
    this.setData({
      nickName: e.detail.value
    })
  },


  tishi() {
    wx.showToast({
      title: '请输入用户名',
      icon: 'none'
    })
  },

  _login() {
    var that = this;
    console.log("loginiddndnidd")
    wx.login({
      success: (res) => {
        load.hideLoading();

        var disUser = {
          nxDiuCode: res.code,
        }
        disLoginKf(disUser)
          .then((res) => {
            console.log(res);
            if (res.result.code !== -1) { //登陆成功
              console.log("resss")
              wx.setStorageSync('userInfo', res.result.data.userInfo);
              wx.setStorageSync('disInfo', res.result.data.disInfo);
              wx.switchTab({
                url: '/pages/order/index/index',
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
        wx.showModal({
          title: res.result.msg,
          showCancel: false,
          confirmText: "知道了",
        })
      })
    })


  },


  _loginWork() {
    var that = this;
    wx.qy.login({
      suiteId: 'ww2cddb5d2d7b3ee5d',
      success: (resQy) => {
        console.log(resQy);
        if (resQy.code) {
          load.hideLoading();
          var disUser = {
            nxDiuCode: resQy.code,
          }
          disLoginWork(disUser)
            .then((res) => {
              if (res.result.code !== -1) { //登陆成功
                console.log(res.result.data);
                wx.setStorageSync('userInfo', res.result.data.userInfo);
                wx.setStorageSync('disInfo', res.result.data.disInfo)
                wx.switchTab({
                  url: '../stock/index/index',
                })
              } else { // 登陆失败
                wx.showModal({
                  title: res.result.msg,
                  content: "请注册",
                  showCancel: false,
                  confirmText: "知道了",
                })
                wx.redirectTo({
                  url: '../../login/login',
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



  _registerWork(e) {
    console.log("Reessworkekkekkekk")

    wx.getUserProfile({
      desc: '用于完善会员资料', // 声明获取用户个人信息后的用途，后续会展示在弹窗中，请谨慎填写
      success: resUser => {
        console.log(resUser)
        wx.qy.login({
          suiteId: 'ww2cddb5d2d7b3ee5d',
          success: (resQy) => {
            console.log(resQy);
            if (resQy.code) {
              load.showLoading("注册新用户")
              var code = resQy.code;
              var corpId = this.data.corpId;
              
              if (this.data.corpId !== null) {
                var corp = corpId.split(",");
                var data = {
                  code: code,
                  disId: corp[0],
                  corpId: corp[1],
                  userName: resUser.userInfo.nickName,
                  userUrl: resUser.userInfo.avatarUrl,
                }
                console.log(data);
                disUserSaveWithFileWork(data).then((res) => {
                  console.log(res);
                  if (res.result.code == 0) {
                    load.hideLoading();
                    wx.switchTab({
                      url: '../stock/index/index',
                    })

                  } else {
                    load.hideLoading();
                    wx.showToast({
                      title: "请直接登陆",
                      icon: 'none'
                    })
                  }

                })
              }
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

  },




  _register(e) {
    var disId = this.data.disId;
    wx.getUserProfile({
      desc: '用于完善会员资料', // 声明获取用户个人信息后的用途，后续会展示在弹窗中，请谨慎填写
      success: resUser => {
        wx.login({
          success: (res) => {
            load.showLoading("注册新用户")
            var nxDistributerUser = {
              nxDiuWxNickName: resUser.userInfo.nickName,
              nxDiuWxAvartraUrl: resUser.userInfo.avatarUrl,
              nxDiuWxPhone: 111111,
              nxDiuCode: res.code,
              nxDiuAdmin: 0,
              nxDiuDistributerId: disId

            }
            disUserSave(nxDistributerUser)
              .then((res) => {
                wx.hideLoading()
                if (res.result.code !== -1) { //注册成功
                  console.log(res)
                  wx.setStorageSync('userInfo', res.result.data.userInfo);
                  wx.setStorageSync('disInfo', res.result.data.disInfo)
                  app.globalData.userInfo = res.result.data;
                  if (wx.getStorageSync('userInfo')) {
                    wx.switchTab({
                      url: '../stock/index/index',
                    })
                  }
                } else { //注册失败
                  wx.showModal({
                    title: res.result.msg,
                    showCancel: false,
                    confirmText: "知道了",
                  })
                  load.hideLoading();
                }
              })
          },
          fail: (res => {
            load.hideLoading();
            wx.showModal({
              title: res.result.msg,
              showCancel: false,
              confirmText: "知道了",
            })
          })
        })
      },
      fail: res => {
        wx.showToast({
          title: "请检查网络",
          icon: 'none'
        })

      }
    })

  },





})