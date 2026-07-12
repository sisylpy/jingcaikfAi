var load = require('../../lib/load.js');
import apiUrl from '../../config.js'


import {
  updateWeighterWithFile,
  updateWeightUser,
  weighterLoginKf
} from '../../lib/apiDistributer'

Page({

  /**
   * 页面的初始数据
   */
  data: {

    canSave: false,
    imgChanged: false,
  

  },

  /**
   * 客户页 order/index 每次 onShow 都会 _login 并写入 userInfo；
   * 货架 / 未出库 tab 只在初次 onLoad/attached 读缓存，且再次进入本页时可能只触发 onShow，
   * 故在 onShow（未编辑时）也从缓存同步一次，避免列表为空。
   */
  _applyUserInfoFromCache() {
    var userInfo = wx.getStorageSync('userInfo');
    if (!userInfo) {
      const app = getApp();
      if (app.globalData && app.globalData.userInfo) {
        userInfo = app.globalData.userInfo;
        wx.setStorageSync('userInfo', userInfo);
      }
    }
    if (!userInfo) {
      return;
    }
    const patch = {
      userInfo: userInfo,
      userName: userInfo.nxWuWxNickName,
      phone: userInfo.nxWuWxPhone,
      deviceId: userInfo.nxWuPrintDeviceId,
    };
    if (userInfo.nxWuUrlChange == 1) {
      patch.src = apiUrl.server + userInfo.nxWuWxAvartraUrl;
    } else {
      patch.src = userInfo.nxWuWxAvartraUrl;
    }
    this.setData(patch);
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    const app = getApp();
    const globalData = app.globalData;

    this.setData({
      windowWidth: globalData.windowWidth * globalData.rpxR,
      windowHeight: globalData.windowHeight * globalData.rpxR,
      navBarHeight: globalData.navBarHeight  * globalData.rpxR,
      url: apiUrl.server,

    })

    this._applyUserInfoFromCache();
  },

  onShow() {
    if (!this.data.canSave && !this.data.imgChanged) {
      this._applyUserInfoFromCache();
    }
  },


  //选择图片
  choiceImg: function (e) {
    var _this = this;

    wx.chooseImage({
      count: 1, // 最多可以选择的图片张数，默认9
      sizeType: ['original', 'compressed'], // original 原图，compressed 压缩图，默认二者都有
      sourceType: ['album', 'camera'], // album 从相册选图，camera 使用相机，默认二者都有
      success: function (res) {
        _this.setData({
          src: res.tempFilePaths,
          // isSelectImg: true,
          imgChanged: true,
          canSave: true

        })
        console.log("savefileleel");
        var filePathList = _this.data.src;
        var userName = _this.data.userName;
        var userId = _this.data.userInfo.nxWeightUserId;
        load.showLoading("保存修改内容")
        updateWeighterWithFile(filePathList, userName, userId).then(res => {
          if(res.result == '{"code":0}'){ 
            load.hideLoading();
            _this._login();
          }else{
            wx.showToast({
              title: '修改失败',
              icon: 'none'
            })
          }   
        })
        // _this._checkSave();
      },
      fail: function () {
        // fail
      },
      complete: function () {
        // complete
      }
    })

  },


  /**
   * 获取用户名
   * @param {*} e 
   */
  getUserName(e) {
    if(e.detail.value !== this.data.userInfo.nxWuWxNickName){
      this.setData({
        userName: e.detail.value,
        canSave: true,
      })
    }
   

  },

  getPhone(e){
    if(e.detail.value){
      this.setData({
        phone: e.detail.value,
        canSave: true,
      })
    }
  },

  delPrint(){

    this.setData({
      deviceId:  "-1",
      canSave: true,
    })
 
  },

  // 手机号码验证（失去焦点时调用）
  validatePhone(e) {
    const phone = e.detail.value;
    console.log("validatePhone", phone);
    
    if (phone.length > 0) {
      // 手机号码验证正则表达式
      var myreg = /^[1][3,4,5,7,8,9][0-9]{9}$/;

      if (!(myreg.test(phone))) {
        wx.showModal({
          title: '手机号码不正确',
          showCancel: false,
          confirmText: "知道了",
        });
        this.setData({
          phoneValid: false
        });
      } else {
        this.setData({
          phoneValid: true
        });
      }
    } else {
      this.setData({
        phoneValid: false
      });
    }
  },

  /**
   * 修改显示周期
   * @param {}} e 
   */
  radioChange: function (e) {
    this.setData({
      weeks:e.detail.value,
      canSave: true,
    })
  },

/**
 * 保存修改内容
 */
  save() {

    var that = this;
    //如果修改了图片
    if (this.data.imgChanged) {
      var filePathList = this.data.src;
      var userName = this.data.userName;
      var userId = this.data.userInfo.nxWeightUserId;

      load.showLoading("保存修改内容")
      updateWeighterWithFile(filePathList, userName, userId).then(res => {
        if(res.result == '{"code":0}'){ 
          load.hideLoading();
           that._login();
        }else{
          wx.showToast({
            title: '修改失败',
            icon: 'none'
          })
        }   
      })
    } else {
      //没有修改图片
      var userName = this.data.userName;
      var userId = this.data.userInfo.nxWeightUserId;
      var data = {
        userName: userName,
        userId: userId,
        phone: this.data.phone,
        deviceId: this.data.deviceId,
      }
      load.showLoading("保存修改内容");
      updateWeightUser(data).then(res => {
        if (res.result.code == 0) {
        load.hideLoading();
          console.log("res",res.result.data);
        let pages = getCurrentPages();
        let prevPage = pages[pages.length - 1];
        prevPage.setData({
          userInfo: res.result.data
        })
        wx.setStorageSync('userInfo', res.result.data);
        wx.navigateBack({
          delta: 1,
        })
      }else{
        load.hideLoading();
        wx.showToast({
          title: '获取信息失败',
          icon: 'none'
        })
      }
      })
    }
  },
  _login() {
    var that = this;
    // 首次登录
    wx.login({
      success(res) {
        console.log(res);
        if (res.code) {
          var disUser = {
            nxWuLoginCode: res.code,
          }
          weighterLoginKf(disUser)
            .then(res => {
              if (res.result.code !== -1) {
                console.log(res.result)
                //缓存用户信息
                
                wx.setStorageSync('userInfo', res.result.data.userInfo);
                wx.setStorageSync('disInfo', res.result.data.disInfo);
                let pages = getCurrentPages();
                let prevPage = pages[pages.length - 1];
                console.log("updateususuisdifnifididifaiiifad")
                prevPage.setData({
                  userInfo: res.result.data,
                  userInfo: res.result.data.userInfo,
                  disInfo: res.result.data.disInfo,
                  disId: res.result.data.disInfo.nxDistributerId,
                })      
                wx.navigateBack({
                  delta: 1,
                })
              }
              
            })
        }
      }
    })
    //login finish
  },

  onUnload(){
    wx.removeStorageSync('editUserItem')
  },


  toBack(){
    wx.navigateBack({
      delta: 1,
    })
  }
  

   






})