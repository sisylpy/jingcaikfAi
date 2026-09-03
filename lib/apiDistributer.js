
import Promise from './bluebird'
import apiUrl from '../config.js'

var load = require('./load.js');





//



/** 仅查询货架有效层号列表（1、2、3…），不含商品明细 */
export const getShelfLayerlist = (shelfId) => {
  return new Promise((resolve, reject) => {
    wx.request({
      url: apiUrl.apiUrl + 'nxdistributergoodsshelfgoods/getShelfLayerlist/' + shelfId,
      method: 'GET',
      success: (res) => {
        resolve({ result: res.data })
      },
      fail: (e) => {
        reject(e);
        load.hideLoading();
        wx.showToast({
          title: '请检查网络',
          icon: 'none'
        })
      }
    })
  })
}

/** 按货架 + 有效层级查询该层商品（顺序与架上 sort 一致） */
export const getShelfGoodsByLayer = (shelfId, layer) => {
  return new Promise((resolve, reject) => {
    wx.request({
      url: apiUrl.apiUrl + 'nxdistributergoodsshelfgoods/getShelfGoodsByLayer',
      method: 'POST',
      data: {
        shelfId: shelfId,
        layer: layer
      },
      header: {
        "Content-Type": "application/x-www-form-urlencoded;charset=utf-8"
      },
      success: (res) => {
        resolve({ result: res.data })
      },
      fail: (e) => {
        reject(e);
        load.hideLoading();
        wx.showToast({
          title: '请检查网络',
          icon: 'none'
        })
      }
    })
  })
}



export const saveNxDisLinshiGoods = (data) => {
  return new Promise((resolve, reject) => {
    wx.request({
      url: apiUrl.apiUrl + 'nxdistributergoods/saveNxDisLinshiGoods',
      method: 'POST',
      data,
      success: (res) => {
        resolve({ result: res.data })
      },
      fail: (e) => {
        reject(e);
        load.hideLoading();
        wx.showToast({
          title: '请检查网络',
        })
      }
    })
  })
}



export const setShelfLayer = (shelfGoodsId) => {
  return new Promise((resolve, reject) => {
    wx.request({
      url: apiUrl.apiUrl + 'nxdistributergoodsshelfgoods/setShelfLayer',
      method: 'POST',
      data: {
        shelfGoodsId
      },
      header: {
        'content-type': 'application/json'
      },
      success: (res) => {
        resolve({ result: res.data })
      },
      fail: (e) => {
        reject(e);
        load.hideLoading();
        wx.showToast({
          title: '请检查网络',
          icon: 'none'
        })
      }
    })
  })
}

export const clearShelfLayer = (shelfGoodsId) => {
  return new Promise((resolve, reject) => {
    wx.request({
      url: apiUrl.apiUrl + 'nxdistributergoodsshelfgoods/clearShelfLayer',
      method: 'POST',
      data: {
        shelfGoodsId
      },
      header: {
        'content-type': 'application/json'
      },
      success: (res) => {
        resolve({ result: res.data })
      },
      fail: (e) => {
        reject(e);
        load.hideLoading();
        wx.showToast({
          title: '请检查网络',
          icon: 'none'
        })
      }
    })
  })
}




/**
 * 添加进货商品，修改订单状态
 * @param {*} data 
 */
export const updateDisStock = (data) => {
  return new Promise((resolve, reject) => {
    wx.request({
      url: apiUrl.apiUrl + 'nxdistributergoodsshelfstock/updateDisStock' ,
      method: 'POST',
      data,
      success: (res) => {
        resolve({ result: res.data })
      },
      fail: (e) => {
        reject(e);
        load.hideLoading();
        wx.showToast({
          title: '请检查网络',
          icon: 'none'
        })
      }
    })
  })
}



export const uploadShelfStock = (params) => {
  const { shelfId, filePath, operatorId } = params;
  return new Promise((resolve, reject) => {
    wx.uploadFile({
      url: `${apiUrl.apiUrl}nxdistributergoodsshelfstock/uploadShelfStock`,
      filePath,
      name: 'file',
      formData: {
        shelfId,
        operatorId: operatorId || ''
      },
      success: (res) => {
        try {
          const data = JSON.parse(res.data);
          resolve({ result: data });
        } catch (error) {
          reject(error);
          wx.showToast({
            title: '上传失败',
            icon: 'none'
          });
        }
      },
      fail: (err) => {
        reject(err);
        load.hideLoading();
        wx.showToast({
          title: '上传失败，请检查网络',
          icon: 'none'
        });
      }
    });
  });
};






/**
 * 添加进货商品，修改订单状态
 * @param {*} data 
 */
export const givePurGoodsQuantity = (data) => {
  return new Promise((resolve, reject) => {
    wx.request({
      url: apiUrl.apiUrl + 'nxdistributerpurchasegoods/givePurGoodsQuantity',
      method: 'POST',
      data:{
        id: data.id,
        quantity: data.quantity,
        standard : data.standard,
        level: data.level
      },
      header: {
        "Content-Type": "application/x-www-form-urlencoded;charset=utf-8"
      },
      success: (res) => {
        resolve({ result: res.data })
      },
      fail: (e) => {
        reject(e);
        load.hideLoading();
        wx.showToast({
          title: '请检查网络',
          icon: 'none'
        })
      }
    })
  })
}


//


/**
 * 添加进货商品，修改订单状态
 * @param {*} data 
 */
export const deletePlanPurchaseGoods = (data) => {
  return new Promise((resolve, reject) => {
    wx.request({
      url: apiUrl.apiUrl + 'nxdistributerpurchasegoods/deletePlanPurchaseGoods/' + data,
      method: 'GET',
      success: (res) => {
        resolve({ result: res.data })
      },
      fail: (e) => {
        reject(e);
        load.hideLoading();
        wx.showToast({
          title: '请检查网络',
          icon: 'none'
        })
      }
    })
  })
}

//


/**
 * 搜索批发商商品
 */
export const queryDisShelfGoods = (data) => {
  return new Promise((resolve, reject) => {
    wx.request({
      url: apiUrl.apiUrl + 'nxdistributergoodsshelfgoods/queryDisShelfGoods' ,
      method: 'POST',
      data:{
        disId: data.disId,
        searchStr: data.searchStr,
      },
      header: {
        "Content-Type": "application/x-www-form-urlencoded;charset=utf-8"
      },
      success: (res) => {
        resolve({ result: res.data })
      },
      fail: (e) => {
        reject(e);
        load.hideLoading();
        wx.showToast({
          title: '请检查网络',
        })
      }
    })
  })
}

/**
 * 添加进货商品，修改订单状态
 * @param {*} data 
 */
export const staffRecievePurGoods = (data) => {
  return new Promise((resolve, reject) => {
    wx.request({
      url: apiUrl.apiUrl + 'nxdistributerpurchasegoods/staffRecievePurGoods' ,
      method: 'POST',
      data: {
        purGoodsId: data.purGoodsId,
        userId: data.userId
       },
       header: {
         "Content-Type": "application/x-www-form-urlencoded;charset=utf-8"
       },

      success: (res) => {
        resolve({ result: res.data })
      },
      fail: (e) => {
        reject(e);
        load.hideLoading();
        wx.showToast({
          title: '请检查网络',
          icon: 'none'
        })
      }
    })
  })
}

/**
 * 添加进货商品，修改订单状态
 * @param {*} data 
 */
export const updatePurchaseGoods = (data) => {
  return new Promise((resolve, reject) => {
    wx.request({
      url: apiUrl.apiUrl + 'nxdistributerpurchasegoods/updatePurchaseGoods',
      method: 'POST',
      data,
      success: (res) => {
        resolve({ result: res.data })
      },
      fail: (e) => {
        reject(e);
        load.hideLoading();
        wx.showToast({
          title: '请检查网络',
          icon: 'none'
        })
      }
    })
  })
}


//



/**
 * 添加进货商品，修改订单状态
 * @param {*} data 
 */
export const staffApplyPurGoods = (data) => {
  return new Promise((resolve, reject) => {
    wx.request({
      url: apiUrl.apiUrl + 'nxdistributerpurchasegoods/staffApplyPurGoods',
      method: 'POST',
      data,
      success: (res) => {
        resolve({ result: res.data })
      },
      fail: (e) => {
        reject(e);
        load.hideLoading();
        wx.showToast({
          title: '请检查网络',
          icon: 'none'
        })
      }
    })
  })
}

/**
 * 添加进货商品，修改订单状态
 * @param {*} data 
 */
export const staffApplyPurGoodsOrderBundle = (data) => {
  return new Promise((resolve, reject) => {
    wx.request({
      url: apiUrl.apiUrl + 'nxdistributerpurchasegoods/staffApplyPurGoodsOrderBundle',
      method: 'POST',
      data,
      success: (res) => {
        resolve({ result: res.data })
      },
      fail: (e) => {
        reject(e);
        load.hideLoading();
        wx.showToast({
          title: '请检查网络',
          icon: 'none'
        })
      }
    })
  })
}




/**
 * 批发商登陆
 * @param {*} data 
 */

/**
 * 批发商登陆
 * @param {*} data 
 */
export const weighterLoginKf = (data) => {
  return new Promise((resolve, reject) => {
    wx.request({
      url: apiUrl.apiUrl + 'nxdistributeruser/weighterLoginKf',
      method: 'POST',
      data,
      success: (res) => {
        resolve({ result: res.data })
      },
      fail: (e) => {
        reject(e);
        load.hideLoading();
        wx.showToast({
          title: '请检查网络',
        })
      }
    })
  })
}


export const weighterKfUserSaveWithFile = (filePathList, userName, code, userType, disId, userId) => { 
  return new Promise((resolve, reject) => {
     // 构建 formData，根据用户类型传递不同的参数
     const formData = {
       userName: userName,
       code: code,
       userType: userType,
       disId:disId,
       userId: userId,
     };
     
    
     wx.uploadFile({
       url: apiUrl.apiUrl + 'nxdistributeruser/weighterKfUserSaveWithFile',//演示域名、自行配置
       filePath: filePathList[0],
       name: 'file',
       header: {
         "Content-Type": "multipart/form-data"
       },
       formData: formData,
       success: function (res) {
         // 解析返回的字符串为JSON对象
         try {
           const result = typeof res.data === 'string' ? JSON.parse(res.data) : res.data;
           resolve({ result: result });
         } catch (e) {
           resolve({ result: res.data });
         }
       },
       fail: function (e) {
         reject(e);
         load.hideLoading();
       },
 
     })
   })
 }


export const updateJrdhSupplier = (data) => {
  return new Promise((resolve, reject) => {
    wx.request({
      url: apiUrl.apiUrl + 'nxjrdhsupplier/updateJrdhSupplier' ,
      method: 'POST',
      data,
      success: (res) => {
        resolve({ result: res.data })
      },
      fail: (e) => {
        reject(e);
        load.hideLoading();
        wx.showToast({
          title: '请检查网络',
          icon: 'none'
        })
      }
    })
  })
}




export const saveJrdhSupplier = (data) => {
  return new Promise((resolve, reject) => {
    wx.request({
      url: apiUrl.apiUrl + 'nxjrdhsupplier/saveJrdhSupplier' ,
      method: 'POST',
      data,
      success: (res) => {
        resolve({ result: res.data })
      },
      fail: (e) => {
        reject(e);
        load.hideLoading();
        wx.showToast({
          title: '请检查网络',
        })
      }
    })
  })
}



export const disGetBuyType = (data) => { 
  return new Promise((resolve, reject) => {
     wx.request({
       url: apiUrl.apiUrl + 'nxdistributerpay/disGetBuyType',//演示域
       method: 'POST',
       data: {
        disId: data.disId,
        type: data.type
       },
       header: {
         "Content-Type": "application/x-www-form-urlencoded;charset=utf-8"
       },
       success: function (res) {
         resolve({ result: res.data })

       },
       fail: function (e) {
         reject(e);
         load.hideLoading();
       },
 
     })
   })
 }

export const updateFatherNx = (filePathList, goodsName,goodsId) => { 
  return new Promise((resolve, reject) => {
     wx.uploadFile({
       url: apiUrl.apiUrl + 'nxdistributergoods/updateFatherNx',//演示域名、自行配置
       filePath: filePathList,
       name: 'file',
       header: {
         "Content-Type": "multipart/form-data"
       },
       formData: {
        goodsName: goodsName,
        id: goodsId,
       },
       success: function (res) {
         resolve({ result: res.data })
       },
       fail: function (e) {
         reject(e);
       }, 
     })
   })
 }
 export const updateFatherBigNx = (filePathList, goodsName,goodsId) => { 
  return new Promise((resolve, reject) => {
     wx.uploadFile({
       url: apiUrl.apiUrl + 'nxdistributergoods/updateFatherBigNx',//演示域名、自行配置
       filePath: filePathList,
       name: 'file',
       header: {
         "Content-Type": "multipart/form-data"
       },
       formData: {
        goodsName: goodsName,
        id: goodsId,
       },
       success: function (res) {
         resolve({ result: res.data })
       },
       fail: function (e) {
         reject(e);
       }, 
     })
   })
 }




/**
 * 删除管理员
 * @param {} data 
 */
export const deleteJrdhUser = (data) => {
  return new Promise((resolve, reject) => {
    wx.request({
      url: apiUrl.apiUrl + 'nxjrdhuser/deleteJrdhUser/' + data,
      method: 'GET',
      success: (res) => {
        resolve({ result: res.data })
      },
      fail: (e) => {
        reject(e);
        load.hideLoading();
        wx.showToast({
          title: '请检查网络',
        })
      }
    })
  })
}



/**
 * 删除管理员
 * @param {} data 
 */
export const deleteDisUser = (data) => {
  return new Promise((resolve, reject) => {
    wx.request({
      url: apiUrl.apiUrl + 'nxdistributeruser/deleteDisUser/' + data,
      method: 'GET',
      success: (res) => {
        resolve({ result: res.data })
      },
      fail: (e) => {
        reject(e);
        load.hideLoading();
        wx.showToast({
          title: '请检查网络',
        })
      }
    })
  })
}



export const disGetPayListLiuliang = (data) => { 
  return new Promise((resolve, reject) => {
     wx.request({
       url: apiUrl.apiUrl + 'nxdistributerpay/disGetPayListLiuliang',//演示域
       method: 'POST',
       data: {
        disId: data.disId,
        startDate: data.startDate,
        stopDate: data.stopDate
       },
       header: {
         "Content-Type": "application/x-www-form-urlencoded;charset=utf-8"
       },
       success: function (res) {
         resolve({ result: res.data })

       },
       fail: function (e) {
         reject(e);
         load.hideLoading();
       },
 
     })
   })
 }
export const disGetPayList = (data) => { 
  return new Promise((resolve, reject) => {
     wx.request({
       url: apiUrl.apiUrl + 'nxdistributerpay/disGetPayList',//演示域
       method: 'POST',
       data: {
        disId: data.disId,
        type: data.type
       },
       header: {
         "Content-Type": "application/x-www-form-urlencoded;charset=utf-8"
       },
       success: function (res) {
         resolve({ result: res.data })

       },
       fail: function (e) {
         reject(e);
         load.hideLoading();
       },
 
     })
   })
 }
 

 /**
  * 用户修改信息
  * @param {*} data 
  */
export const updateWeightUser = (data) => {
  return new Promise((resolve, reject) => {
    wx.request({
      url: apiUrl.apiUrl + 'nxdistributeruser/updateWeightUser' ,
      method: 'POST',
      data: {
        userName: data.userName,
        userId: data.userId,
        phone: data.phone,
        deviceId: data.deviceId
      },
      header: {
        "Content-Type": "application/x-www-form-urlencoded;charset=utf-8"
      },
      success: (res) => {
        resolve({ result: res.data })
      },
      fail: (e) => {
        reject(e);
        load.hideLoading();
      }
    })
  })
}


export const updateWeighterWithFile = (filePathList, userName,userId  ) => { 
  return new Promise((resolve, reject) => {
     wx.uploadFile({
       url: apiUrl.apiUrl + 'nxdistributeruser/updateWeighterWithFile',//演示域名、自行配置
       filePath: filePathList[0],
       name: 'file',
       header: {
         "Content-Type": "multipart/form-data"
       },
       formData: {
        userName: userName,
        userId: userId,
       },
       success: function (res) {
         resolve({ result: res.data })
        
      
       },
       fail: function (e) {
         reject(e);
         load.hideLoading();
       },
 
     })
   })
 }


/**
 * 获取客户配送商品
 * @param {} data 
 */
export const disGetDepGoods = (data) => {
  return new Promise((resolve, reject) => {
    wx.request({
      url: apiUrl.apiUrl + 'nxdepartmentdisgoods/disGetDepGoods/' + data ,
      method: 'GET',
    
      success: (res) => {
        resolve({ result: res.data })
      },
      fail: (e) => {
        reject(e);
        load.hideLoading();
        wx.showToast({
          title: '请检查网络',
          icon: 'none'
        })
      }
    })
  })
}

/**
 * 获取群用户列表
 * @param {*} data 
 */
export const getDepUsersByFatherId = (data) => {
  return new Promise((resolve, reject) => {
    wx.request({
      url: apiUrl.apiUrl + 'nxdepartmentuser/getDepUsersByFatherId/' + data ,
      method: 'GET',
      success: (res) => {
        resolve({ result: res.data })
      },
      fail: (e) => {
        reject(e);
        load.hideLoading();
        wx.showToast({
          title: '请检查网络',
          icon: 'none'
        })
      }
    })
  })
}


export const deleteBill = (data) => {
  return new Promise((resolve, reject) => {
    wx.request({
      url: apiUrl.apiUrl + 'nxdepartmentbill/deleteBill/' + data,
      method: 'GET',
      success: (res) => {
        resolve({ result: res.data })
      },
      fail: (e) => {
        reject(e);
        load.hideLoading();
        wx.showToast({
          title: '请检查网络',
        })
      }
    })
  })
}


/**
 * 获取客户送货单
 * @param {*} data 
 */
export const sellerAndBuyerGetAccountBills = (data) => {
  return new Promise((resolve, reject) => {
    wx.request({
      url: apiUrl.apiUrl + 'nxdepartmentbill/sellerAndBuyerGetAccountBills',
      method: 'POST',
      data:{
        depFatherId: data.depFatherId,
        disId: data.disId
     },
     header: {
       "Content-Type": "application/x-www-form-urlencoded;charset=utf-8"
     },
      success: (res) => {
        resolve({ result: res.data })
      },
      fail: (e) => {
        reject(e);
        load.hideLoading();
        wx.showToast({
          title: '请检查网络',
          icon: 'none'
        })
      }
    })
  })
}










export const deleteDepUser = (data) => {
  return new Promise((resolve, reject) => {
    wx.request({
      url: apiUrl.apiUrl + 'nxdepartmentuser/deleteDepUser/' + data ,
      method: 'GET',
      success: (res) => {
        resolve({ result: res.data })
      },
      fail: (e) => {
        reject(e)
      }
    })
  })
}

/**
 * 保存订单的数量
 * @param {*} data 
 */
export const updateDepUserAdmin = (data) => {
  return new Promise((resolve, reject) => {
    wx.request({
      url: apiUrl.apiUrl + 'nxdepartmentuser/updateDepUserAdmin',
      method: 'POST',
      data,
      success: (res) => {
        resolve({ result: res.data })
      },
      fail: (e) => {
        reject(e);
        load.hideLoading();
        wx.showToast({
          title: '请检查网络',
          icon: 'none'
        })
      }
    })
  })
}




/**
 * 获取订货群子部门
 * @param {}} data 
 */
export const updateGroupName = (data) => {
  return new Promise((resolve, reject) => {
    wx.request({
      url: apiUrl.apiUrl + 'nxdepartment/updateGroupName',
      method: 'POST',
      data,
      success: (res) => {
        resolve({ result: res.data })
      },
      fail: (e) => {
        reject(e);
        load.hideLoading();
        wx.showToast({
          title: '请检查网络',
          icon: 'none'
        })
      }
    })
  })
}



export const deleteDepGoods = (data) => {
  return new Promise((resolve, reject) => {
    wx.request({
      url: apiUrl.apiUrl + 'nxdepartmentdisgoods/deleteDepGoods/' +data,
      method: 'GET',
      success: (res) => {
        resolve({ result: res.data })
      },
      fail: (e) => {
        reject(e);
        load.hideLoading();
        wx.showToast({
          title: '请检查网络',
          icon: 'none'
        })
        
      }
    })
  })
}


export const deleteGroupDep = (data) => {
  return new Promise((resolve, reject) => {
    wx.request({
      url: apiUrl.apiUrl + 'nxdepartment/deleteGroupDep',
      method: 'POST',
      data,
      success: (res) => {
        resolve({ result: res.data })
      },
      fail: (e) => {
        reject(e)
      }
    })
  })
}

export const getDepInfo = (data) => {
  return new Promise((resolve, reject) => {
    wx.request({
      url: apiUrl.apiUrl + 'nxdepartment/getDepInfo/' + data ,
      method: 'GET',
      success: (res) => {
        resolve({ result: res.data })
      },
      fail: (e) => {
        reject(e);
        load.hideLoading();
        wx.showToast({
          title: '请检查网络',
          icon: 'none'
        })
      }
    })
  })
}


export const disGetAllGbDistributer = (data) => {
  return new Promise((resolve, reject) => {
    wx.request({
      url: apiUrl.apiUrl + 'nxdistributergbdistributer/disGetAllGbDistributer/' + data,
      method: 'GET',
      success: (res) => {
        resolve({ result: res.data })
      },
      fail: (e) => {
        reject(e);
        load.hideLoading();
        wx.showToast({
          title: '请检查网络',
        })
      }
    })
  })
}


/**
 * 搜索类别商品
 * @param {*} data 
 */
export const queryShelfNxGoodsWithNxDisByQuickSearch = (data) => {
  return new Promise((resolve, reject) => {
    wx.request({
      url: apiUrl.apiUrl + 'nxgoods/queryShelfNxGoodsWithNxDisByQuickSearch',
      method: 'POST',
      data: {
        "searchStr": data.searchStr,
        "disId": data.disId,
        
      },
      header: {
        "Content-Type": "application/x-www-form-urlencoded;charset=utf-8"
      },
      success: (res) => {
        resolve({ result: res.data })
      },
      fail: (e) => {
        reject(e);
        wx.showToast({
          title: '请检查网络',
          icon: 'none'
        })
      }
    })
  })
}



/**
 * 搜索批发商商品
 */
export const queryDisShelfGoodsByQuickSearch = (data) => {
  return new Promise((resolve, reject) => {
    wx.request({
      url: apiUrl.apiUrl + 'nxdistributergoods/queryDisShelfGoodsByQuickSearch' ,
      method: 'POST',
      data:{
        disId: data.disId,
        searchStr: data.searchStr,
      },
      header: {
        "Content-Type": "application/x-www-form-urlencoded;charset=utf-8"
      },
      success: (res) => {
        resolve({ result: res.data })
      },
      fail: (e) => {
        reject(e);
        load.hideLoading();
        wx.showToast({
          title: '请检查网络',
        })
      }
    })
  })
}



/**
 * 获取上货商品列表
 * @param {*} data 
 */
export const updateShelfGoods= (data) => {
  return new Promise((resolve, reject) => {
    wx.request({
      url: apiUrl.apiUrl + 'nxdistributergoodsshelfgoods/updateShelfGoods',
      method: 'POST', 
      data,  
      success: (res) => {
        resolve({ result: res.data })
      },
      fail: (e) => {
        reject(e);
        load.hideLoading();
        wx.showToast({
          title: '请检查网络',
          icon: 'none'
        })
      }
    })
  })
}


export const disGetShelfList = (data) => {
  return new Promise((resolve, reject) => {
    wx.request({
      url: apiUrl.apiUrl + 'nxdistributergoodsshelf/disGetShelfList/' + data,
      method: 'GET',
      success: (res) => {
        resolve({ result: res.data })
      },
      fail: (e) => {
        reject(e);
        load.hideLoading();
        wx.showToast({
          title: '请检查网络',
        })
      }
    })
  })
}


export const disGetShelfListByType = (data) => {
  return new Promise((resolve, reject) => {
    wx.request({
      url: apiUrl.apiUrl + 'nxdistributergoodsshelf/disGetShelfListByType',
      method: 'POST',
      data: {
        disId: data.disId,
        shelfGoodsType: data.shelfGoodsType
      },
      header: {
        "Content-Type": "application/x-www-form-urlencoded;charset=utf-8"
      },
      success: (res) => {
        resolve({ result: res.data })
      },
      fail: (e) => {
        reject(e);
        load.hideLoading();
        wx.showToast({
          title: '请检查网络',
        })
      }
    })
  })
}




export const updateShelfSort = (data) => {
  return new Promise((resolve, reject) => {
    wx.request({
      url: apiUrl.apiUrl + 'nxdistributergoodsshelf/updateShelfSort',
      method: 'POST',
      data,
      success: (res) => {
        resolve({ result: res.data })
      },
      fail: (e) => {
        reject(e);
        load.hideLoading();
        wx.showToast({
          title: '请检查网络',
          icon: 'none'
        })
      }
    })
  })
}

export const deleteShelfGoods = (data) => {
  return new Promise((resolve, reject) => {
    wx.request({
      url: apiUrl.apiUrl + 'nxdistributergoodsshelfgoods/deleteShelfGoods/' + data,
      method: 'GET',
      success: (res) => {
        resolve({ result: res.data })
      },
      fail: (e) => {
        reject(e);
        load.hideLoading();
        wx.showToast({
          title: '请检查网络',
        })
      }
    })
  })
}


export const updateShelfGoodsSort = (data) => {
  return new Promise((resolve, reject) => {
    wx.request({
      url: apiUrl.apiUrl + 'nxdistributergoodsshelfgoods/updateShelfGoodsSort',
      method: 'POST',
      data,
      header: {
        "content-type": 'application/json'
      },
      success: (res) => {
        resolve({ result: res.data })
      },
      fail: (e) => {
        reject(e);
        load.hideLoading();
        wx.showToast({
          title: '请检查网络',
        })
      }
    })
  })
}

export const addShelfGoods = (data) => {
  return new Promise((resolve, reject) => {
    wx.request({
      url: apiUrl.apiUrl + 'nxdistributergoodsshelfgoods/addShelfGoods',
      method: 'POST',
      data,
      header: {
        "content-type": 'application/json'
      },
      success: (res) => {
        resolve({ result: res.data })
      },
      fail: (e) => {
        reject(e);
        load.hideLoading();
        wx.showToast({
          title: '请检查网络',
        })
      }
    })
  })
}

export const disGetToPlanPurchaseShelfGoods = (data) => {
  return new Promise((resolve, reject) => {
    wx.request({
      url: apiUrl.apiUrl + 'nxdistributergoodsshelf/disGetToPlanPurchaseShelfGoods' ,
      method: 'POST',
      data:{
        disId: data.disId,
        shelfId: data.shelfId,
      },
      header: {
        "Content-Type": "application/x-www-form-urlencoded;charset=utf-8"
      },
      success: (res) => {
        resolve({ result: res.data })
      },
      fail: (e) => {
        reject(e);
        load.hideLoading();
        wx.showToast({
          title: '请检查网络',
        })
      }
    })
  })
}



export const getShelfGoods = (data) => {
  const sort = data.shelfGoodsQuerySort
  const shelfGoodsQuerySort = sort === undefined || sort === null || sort === '' ? 0 : Number(sort)
  return new Promise((resolve, reject) => {
    wx.request({
      url: apiUrl.apiUrl + 'nxdistributergoodsshelf/getShelfGoods' ,
      method: 'POST',
      data: {
        shelfId: data.shelfId,
        page: data.page,
        limit: data.limit,
        shelfGoodsType: data.shelfGoodsType,
        shelfGoodsQuerySort
      },
      header: {
        "Content-Type": "application/x-www-form-urlencoded;charset=utf-8"
      },
      success: (res) => {
        resolve({ result: res.data })
      },
      fail: (e) => {
        reject(e);
        load.hideLoading();
        wx.showToast({
          title: '请检查网络',
        })
      }
    })
  })
}

/** 分销商未上架商品分页。若后端路径不同，请按服务端文档改 url。 */
export const disGetUnshelfGoods = (disId, page = 1, limit = 15) => {
  return new Promise((resolve, reject) => {
    wx.request({
      url: `${apiUrl.apiUrl}nxdistributergoodsshelfgoods/disGetUnshelfGoods/${disId}?page=${page}&limit=${limit}`,
      method: 'GET',
      success: (res) => {
        resolve({ result: res.data })
      },
      fail: (e) => {
        reject(e)
        load.hideLoading()
        wx.showToast({ title: '请检查网络', icon: 'none' })
      }
    })
  })
}

/** 保存采购并入库（路径需与后端一致） */
export const disSavePurGoodsSaveStock = (data) => {
  return new Promise((resolve, reject) => {
    wx.request({
      url: apiUrl.apiUrl + 'nxdistributerpurchasegoods/disSavePurGoodsSaveStock',
      method: 'POST',
      data,
      header: { 'content-type': 'application/json' },
      success: (res) => {
        resolve({ result: res.data })
      },
      fail: (e) => {
        reject(e)
        load.hideLoading()
        wx.showToast({ title: '请检查网络', icon: 'none' })
      }
    })
  })
}

/** 采购入库（货架商品 / 搜索页共用） */
export const saveShelfGoodsStock = (data) => {
  return new Promise((resolve, reject) => {
    wx.request({
      url: apiUrl.apiUrl + 'nxdistributergoodsshelfstock/saveShelfGoodsStock',
      method: 'POST',
      data,
      header: { 'content-type': 'application/json' },
      success: (res) => {
        resolve({ result: res.data })
      },
      fail: (e) => {
        reject(e)
        load.hideLoading()
        wx.showToast({ title: '请检查网络', icon: 'none' })
      }
    })
  })
}

/** 下载货架商品导入模板，resolve 临时文件路径 */
export const downloadShelfGoodsTemplate = (shelfId) => {
  return new Promise((resolve, reject) => {
    const url = `${apiUrl.apiUrl}nxdistributergoodsshelf/downloadShelfGoodsTemplate/${shelfId}`
    wx.downloadFile({
      url,
      success: (res) => {
        if (res.statusCode === 200 && res.tempFilePath) {
          resolve(res.tempFilePath)
        } else {
          reject(new Error('download fail'))
        }
      },
      fail: (e) => {
        reject(e)
        wx.showToast({ title: '下载失败', icon: 'none' })
      }
    })
  })
}

/** 下载货架库存导入模板 */
export const downloadShelfStockTemplate = (shelfId) => {
  return new Promise((resolve, reject) => {
    const url = `${apiUrl.apiUrl}nxdistributergoodsshelfstock/downloadShelfStockTemplate/${shelfId}`
    wx.downloadFile({
      url,
      success: (res) => {
        if (res.statusCode === 200 && res.tempFilePath) {
          resolve(res.tempFilePath)
        } else {
          reject(new Error('download fail'))
        }
      },
      fail: (e) => {
        reject(e)
        wx.showToast({ title: '下载失败', icon: 'none' })
      }
    })
  })
}

/** 从 Excel 导入货架商品 */
export const importShelfGoodsFromExcel = ({ shelfId, filePath, operatorId }) => {
  return new Promise((resolve, reject) => {
    wx.uploadFile({
      url: `${apiUrl.apiUrl}nxdistributergoodsshelf/importShelfGoodsFromExcel`,
      filePath,
      name: 'file',
      formData: {
        shelfId: String(shelfId),
        operatorId: operatorId != null ? String(operatorId) : ''
      },
      success: (res) => {
        try {
          const data = JSON.parse(res.data)
          resolve({ result: data })
        } catch (err) {
          reject(err)
          wx.showToast({ title: '解析响应失败', icon: 'none' })
        }
      },
      fail: (err) => {
        reject(err)
        wx.showToast({ title: '上传失败', icon: 'none' })
      }
    })
  })
}

//subPackage/pages/shelf/shelfGoodsSort/shelfGoodsSort

export const deleteShelf = (data) => {
  return new Promise((resolve, reject) => {
    wx.request({
      url: apiUrl.apiUrl + 'nxdistributergoodsshelf/deleteShelf/' + data,
      method: 'GET',
      success: (res) => {
        resolve({ result: res.data })
      },
      fail: (e) => {
        reject(e);
        load.hideLoading();
        wx.showToast({
          title: '请检查网络',
        })
      }
    })
  })
}


export const updateShelfName = (data) => {
  return new Promise((resolve, reject) => {
    wx.request({
      url: apiUrl.apiUrl + 'nxdistributergoodsshelf/updateShelfName'  ,
      method: 'POST',
      data: {
        shelfId: data.shelfId,
        shelfName: data.shelfName
      },
      header: {
        "Content-Type": "application/x-www-form-urlencoded;charset=utf-8"
      },
      success: (res) => {
        resolve({ result: res.data })
      },
      fail: (e) => {
        reject(e);
        load.hideLoading();
        wx.showToast({
          title: '请检查网络',
        })
      }
    })
  })
}

export const disGetShelfs = (data) => {
  return new Promise((resolve, reject) => {
    wx.request({
      url: apiUrl.apiUrl + 'nxdistributergoodsshelf/disGetShelfs/' + data,
      method: 'GET',
      success: (res) => {
        resolve({ result: res.data })
      },
      fail: (e) => {
        reject(e);
        load.hideLoading();
        wx.showToast({
          title: '请检查网络',
        })
      }
    })
  })
}

export const disGetShelfsWithDetail = (data) => {
  return new Promise((resolve, reject) => {
    wx.request({
      url: apiUrl.apiUrl + 'nxdistributergoodsshelf/disGetShelfsWithDetail/' + data,
      method: 'GET',
      success: (res) => {
        resolve({ result: res.data })
      },
      fail: (e) => {
        reject(e);
        load.hideLoading();
        wx.showToast({
          title: '请检查网络',
        })
      }
    })
  })
}

export const updateShelf = (data) => {
  return new Promise((resolve, reject) => {
    wx.request({
      url: apiUrl.apiUrl + 'nxdistributergoodsshelf/updateShelf',
      method: 'POST',
      data,
      success: (res) => {
        resolve({ result: res.data })
      },
      fail: (e) => {
        reject(e);
        load.hideLoading();
        wx.showToast({
          title: '请检查网络',
        })
      }
    })
  })
}

export const saveNewShelf = (data) => {
  return new Promise((resolve, reject) => {
    wx.request({
      url: apiUrl.apiUrl + 'nxdistributergoodsshelf/saveNewShelf',
      method: 'POST',
      data,
      success: (res) => {
        resolve({ result: res.data })
      },
      fail: (e) => {
        reject(e);
        load.hideLoading();
        wx.showToast({
          title: '请检查网络',
        })
      }
    })
  })
}








export const deleteNxDisSuppler = (data) => {
  return new Promise((resolve, reject) => {
    wx.request({
      url: apiUrl.apiUrl + 'nxjrdhsupplier/deleteNxDisSuppler/' + data,
      method: 'GET',
      success: (res) => {
        resolve({ result: res.data })
      },
      fail: (e) => {
        reject(e);
        load.hideLoading();
        wx.showToast({
          title: '请检查网络',
        })
      }
    })
  })
}

export const nxDisGetAllSuppliers = (data) => {
  return new Promise((resolve, reject) => {
    wx.request({
      url: apiUrl.apiUrl + 'nxjrdhsupplier/nxDisGetAllSuppliers',
      method: 'POST',
      data:{
        nxDisId: data.nxDisId,
        userId: data.userId,
      },
      header: {
        "Content-Type": "application/x-www-form-urlencoded;charset=utf-8"
      },
      success: (res) => {
        resolve({ result: res.data })
      },
      fail: (e) => {
        reject(e);
        load.hideLoading();
        wx.showToast({
          title: '请检查网络',
        })
      }
    })
  })
}



/**
 * 获取管理员
 * @param {} data 
 */
export const getDisUsers = (data) => {
  return new Promise((resolve, reject) => {
    wx.request({
      url: apiUrl.apiUrl + 'nxdistributeruser/getDisUsers/' + data,
      method: 'GET',
      success: (res) => {
        resolve({ result: res.data })
      },
      fail: (e) => {
        reject(e);
        load.hideLoading();
        wx.showToast({
          title: '请检查网络',
        })
      }
    })
  })
}

export const getDisUserInfo = (data) => {
  return new Promise((resolve, reject) => {
    wx.request({
      url: apiUrl.apiUrl + 'nxdistributeruser/getDisUserInfo/' + data,
      method: 'GET',
      success: (res) => {
        resolve({ result: res.data })
      },
      fail: (e) => {
        reject(e);
        load.hideLoading();
        wx.showToast({
          title: '请检查网络',
        })
      }
    })
  })
}



/**
 * 搜索批发商商品
 */
export const queryDisGoodsAndNxGoodsByQuickSearch = (data) => {
  return new Promise((resolve, reject) => {
    wx.request({
      url: apiUrl.apiUrl + 'nxdistributergoods/queryDisGoodsAndNxGoodsByQuickSearch' ,
      method: 'POST',
      data:{
        disId: data.disId,
        searchStr: data.searchStr,
      },
      header: {
        "Content-Type": "application/x-www-form-urlencoded;charset=utf-8"
      },
      success: (res) => {
        resolve({ result: res.data })
      },
      fail: (e) => {
        reject(e);
        load.hideLoading();
        wx.showToast({
          title: '请检查网络',
        })
      }
    })
  })
}



/**
 * 修改批发商商品暂时停订
 * @param {*} data 
 */
export const disGoodsUpdate = (data) => {
  return new Promise((resolve, reject) => {
    wx.request({
      url: apiUrl.apiUrl + 'nxdistributergoods/disGoodsUpdate',
      method: 'POST',
      data,
      success: (res) => {
        resolve({ result: res.data })
      },
      fail: (e) => {
        reject(e);
        load.hideLoading();
        wx.showToast({
          title: '请检查网络',
        })
      }
    })
  })
}
//


export const stockerGetFinishStockGoodsDeps = (data) => {
  return new Promise((resolve, reject) => {
    wx.request({
      url: apiUrl.apiUrl + 'nxdepartmentorders/stockerGetFinishStockGoodsDeps',
      method: 'POST',
      data: {
        disId: data.disId,
        supplierId: data.supplierId
      },
      header: {
        "Content-Type": "application/x-www-form-urlencoded;charset=utf-8"
      },
      success: (res) => {
        resolve({ result: res.data })
      },
      fail: (e) => {
        reject(e);
        load.hideLoading();
        wx.showToast({
          title: '请检查网络',
        })
      }
    })
  })
}


//



export const supplierGetWaitStockGoodsDeps = (data) => {
  return new Promise((resolve, reject) => {
    wx.request({
      url: apiUrl.apiUrl + 'nxdepartmentorders/supplierGetWaitStockGoodsDeps',
      method: 'POST',
      data: {
        disId: data.disId,
        supplierId: data.supplierId
      },
      header: {
        "Content-Type": "application/x-www-form-urlencoded;charset=utf-8"
      },
      success: (res) => {
        resolve({ result: res.data })
      },
      fail: (e) => {
        reject(e);
        load.hideLoading();
        wx.showToast({
          title: '请检查网络',
        })
      }
    })
  })
}


export const stockerGetWaitStockGoodsDeps = (data) => {
  return new Promise((resolve, reject) => {
    wx.request({
      url: apiUrl.apiUrl + 'nxdepartmentorders/stockerGetWaitStockGoodsDeps',
      method: 'POST',
      data: {
        disId: data.disId,
      },
      header: {
        "Content-Type": "application/x-www-form-urlencoded;charset=utf-8"
      },
      success: (res) => {
        resolve({ result: res.data })
      },
      fail: (e) => {
        reject(e);
        load.hideLoading();
        wx.showToast({
          title: '请检查网络',
        })
      }
    })
  })
}


/**
 * 添加批发商订货规格
 * @param {*} data 
 */
export const disSaveStandard = (data) => {
  return new Promise((resolve, reject) => {
    wx.request({
      url: apiUrl.apiUrl + 'nxdistributerstandard/disSaveStandard' ,
      method: 'POST',
      data,
      success: (res) => {
        resolve({ result: res.data })
      },
      fail: (e) => {
        reject(e);
        load.hideLoading();
        wx.showToast({
          title: '请检查网络',
        })
      }
    })
  })
}



/**
 * 搜索批发商商品
 */
export const queryDisGoodsByQuickSearchWithDepId = (data) => {
  return new Promise((resolve, reject) => {
    wx.request({
      url: apiUrl.apiUrl + 'nxdistributergoods/queryDisGoodsByQuickSearchWithDepId' ,
      method: 'POST',
      data:{
        disId: data.disId,
        searchStr: data.searchStr,
        depId: data.depId
      },
      header: {
        "Content-Type": "application/x-www-form-urlencoded;charset=utf-8"
      },
      success: (res) => {
        resolve({ result: res.data })
      },
      fail: (e) => {
        reject(e);
        load.hideLoading();
        wx.showToast({
          title: '请检查网络',
        })
      }
    })
  })
}


/**
 * 获取批发商客户列表
 * @param {*} data 
 */
export const disGetAllCustomer = (data) => {
  return new Promise((resolve, reject) => {
    wx.request({
      url: apiUrl.apiUrl + 'nxdepartment/disGetAllCustomer/' + data,
      method: 'GET',
      success: (res) => {
        resolve({ result: res.data })
      },
      fail: (e) => {
        reject(e);
        load.hideLoading();
        wx.showToast({
          title: '请检查网络',
        })
      }
    })
  })
}



/**
 * 跟新批发商别名
 */
export const disDeleteAlias = (data) => {
  return new Promise((resolve, reject) => {
    wx.request({
      url: apiUrl.apiUrl + 'nxdistributeralias/disDeleteAlias/' + data,
      method: 'GET',
      success: (res) => {
        resolve({ result: res.data })
      },
      fail: (e) => {
        reject(e);
        load.hideLoading();
        wx.showToast({
          title: '请检查网络',
        })
      }
    })
  })
}

/**
 * 跟新批发商别名
 */
export const updateDisAlias = (data) => {
  return new Promise((resolve, reject) => {
    wx.request({
      url: apiUrl.apiUrl + 'nxdistributeralias/updateDisAlias',
      method: 'POST',
      data,
      success: (res) => {
        resolve({ result: res.data })
      },
      fail: (e) => {
        reject(e);
        load.hideLoading();
        wx.showToast({
          title: '请检查网络',
        })
      }
    })
  })
}
/**
 * 添加批发商品别名
 */
export const saveDisAlias = (data) => {
  return new Promise((resolve, reject) => {
    wx.request({
      url: apiUrl.apiUrl + 'nxdistributeralias/saveDisAlias',
      method: 'POST',
      data,
      success: (res) => {
        resolve({ result: res.data })
      },
      fail: (e) => {
        reject(e);
        load.hideLoading();
        wx.showToast({
          title: '请检查网络',
        })
      }
    })
  })
}

/**
 * 删除批发商订货规格
 * @param {*} data 
 */
export const disDeleteStandard = (data) => {
  return new Promise((resolve, reject) => {
    wx.request({
      url: apiUrl.apiUrl + 'nxdistributerstandard/disDeleteStandard/' + data ,
      method: 'GET',
      success: (res) => {
        resolve({ result: res.data })
      },
      fail: (e) => {
        reject(e);
        load.hideLoading();
        wx.showToast({
          title: '请检查网络',
        })
      }
    })
  })
}

/**
 * 修改批发商订货规格
 * @param {*} data 
 */
export const disUpdateStandard = (data) => {
  return new Promise((resolve, reject) => {
    wx.request({
      url: apiUrl.apiUrl + 'nxdistributerstandard/disUpdateStandard' ,
      method: 'POST',
      data,
      success: (res) => {
        resolve({ result: res.data })
      },
      fail: (e) => {
        reject(e);
        load.hideLoading();
        wx.showToast({
          title: '请检查网络',
        })
      }
    })
  })
}


/**
 * 批发商商品详细
 * @param {*} data 
 */
export const disGetGoodsDetail = (data) => {
  return new Promise((resolve, reject) => {
    wx.request({
      url: apiUrl.apiUrl + 'nxdistributergoods/disGetGoodsDetail/' + data ,
      method: 'GET',
      success: (res) => {
        resolve({ result: res.data })
      },
      fail: (e) => {
        reject(e);
        load.hideLoading();
        wx.showToast({
          title: '请检查网络',
        })
      }
    })
  })
}

export const disGetUpdatePriceGoods = (data) => {
  return new Promise((resolve, reject) => {
    wx.request({
      url: apiUrl.apiUrl + 'nxdistributergoods/disGetUpdatePriceGoods',
      method: 'POST',
      data: {
        disId: data.disId,
        type: data.type,
      },
      header: {
        "Content-Type": "application/x-www-form-urlencoded;charset=utf-8"
      },
      success: (res) => {
        resolve({ result: res.data })
      },
      fail: (e) => {
        reject(e);
        load.hideLoading();
        wx.showToast({
          title: '请检查网络',
        })
      }
    })
  })
}


export const disUpdateBuyingPrice = (data) => {
  return new Promise((resolve, reject) => {
    wx.request({
      url: apiUrl.apiUrl + 'nxdepartmentorders/disUpdateBuyingPrice',
      method: 'POST',
      data,
      success: (res) => {
        resolve({ result: res.data })
      },
      fail: (e) => {
        reject(e);
        load.hideLoading();
        wx.showToast({
          title: '请检查网络',
          icon: 'none'
        })
      }
    })
  })
}


/**
 * 批发商商品类别列表
 * @param {*} data 
 */
export const getDisGoodsByGrandId = (data) => {
  return new Promise((resolve, reject) => {
    wx.request({
      url: apiUrl.apiUrl + 'nxdistributerfathergoods/getDisGoodsByGrandId' ,
      method: 'POST',
      data:{
        fatherId: data.fatherId,
      },
      header: {
        "Content-Type": "application/x-www-form-urlencoded;charset=utf-8"
      },
      success: (res) => {
        resolve({ result: res.data })
      },
      fail: (e) => {
        reject(e);
        load.hideLoading();
        wx.showToast({
          title: '请检查网络',
        })
       
      }
    })
  })
}



/**
 * 批发商商品类别列表
 * @param {*} data 
 */
export const getDisGoodsByGreatGrandId = (data) => {
  return new Promise((resolve, reject) => {
    wx.request({
      url: apiUrl.apiUrl + 'nxdistributerfathergoods/getDisGoodsByGreatGrandId' ,
      method: 'POST',
      data:{
        fatherId: data.fatherId,
        limit: data.limit,
        page: data.page
      },
      header: {
        "Content-Type": "application/x-www-form-urlencoded;charset=utf-8"
      },
      success: (res) => {
        resolve({ result: res.data })
      },
      fail: (e) => {
        reject(e);
        load.hideLoading();
        wx.showToast({
          title: '请检查网络',
        })
       
      }
    })
  })
}

export const getDisGoodsCataWithCount = (data) => {
  return new Promise((resolve, reject) => {
    wx.request({
      url: apiUrl.apiUrl + 'nxdistributerfathergoods/getDisGoodsCataWithCount/' + data ,
      method: 'GET',
      success: (res) => {
        resolve({ result: res.data })
      },
      fail: (e) => {
        reject(e);
        load.hideLoading();
        wx.showToast({
          title: '请检查网络',
        })
       
      }
    })
  })
}



/**
 * 添加损耗记录
 * @param {*} data {disId, disGoodsId, weight, userId}
 */
export const addUse = (data) => {
  return new Promise((resolve, reject) => {
    wx.request({
      url: apiUrl.apiUrl + 'nxdistributergoodsshelfstockreduce/addUse',
      method: 'POST',
      data: {
        disId: data.disId,
        disGoodsId: data.disGoodsId,
        weight: data.weight,
        userId: data.userId
      },
      header: {
        "Content-Type": "application/x-www-form-urlencoded;charset=utf-8"
      },
      success: (res) => {
        resolve({ result: res.data })
      },
      fail: (e) => {
        reject(e);
        load.hideLoading();
        wx.showToast({
          title: '请检查网络',
          icon: 'none'
        })
      }
    })
  })
}



/**
 * 添加损耗记录
 * @param {*} data {disId, disGoodsId, weight, userId}
 */
export const addLoss = (data) => {
  return new Promise((resolve, reject) => {
    wx.request({
      url: apiUrl.apiUrl + 'nxdistributergoodsshelfstockreduce/addLoss',
      method: 'POST',
      data: {
        disId: data.disId,
        disGoodsId: data.disGoodsId,
        weight: data.weight,
        userId: data.userId
      },
      header: {
        "Content-Type": "application/x-www-form-urlencoded;charset=utf-8"
      },
      success: (res) => {
        resolve({ result: res.data })
      },
      fail: (e) => {
        reject(e);
        load.hideLoading();
        wx.showToast({
          title: '请检查网络',
          icon: 'none'
        })
      }
    })
  })
}

/**
 * 添加退货记录
 * @param {*} data {disId, disGoodsId, weight, userId}
 */
export const addReturn = (data) => {
  return new Promise((resolve, reject) => {
    wx.request({
      url: apiUrl.apiUrl + 'nxdistributergoodsshelfstockreduce/addReturn',
      method: 'POST',
      data: {
        disId: data.disId,
        disGoodsId: data.disGoodsId,
        weight: data.weight,
        userId: data.userId
      },
      header: {
        "Content-Type": "application/x-www-form-urlencoded;charset=utf-8"
      },
      success: (res) => {
        resolve({ result: res.data })
      },
      fail: (e) => {
        reject(e);
        load.hideLoading();
        wx.showToast({
          title: '请检查网络',
          icon: 'none'
        })
      }
    })
  })
}

/**
 * 添加废弃记录
 * @param {*} data {disId, disGoodsId, weight, userId}
 */
export const addWaste = (data) => {
  return new Promise((resolve, reject) => {
    wx.request({
      url: apiUrl.apiUrl + 'nxdistributergoodsshelfstockreduce/addWaste',
      method: 'POST',
      data: {
        disId: data.disId,
        disGoodsId: data.disGoodsId,
        weight: data.weight,
        userId: data.userId
      },
      header: {
        "Content-Type": "application/x-www-form-urlencoded;charset=utf-8"
      },
      success: (res) => {
        resolve({ result: res.data })
      },
      fail: (e) => {
        reject(e);
        load.hideLoading();
        wx.showToast({
          title: '请检查网络',
          icon: 'none'
        })
      }
    })
  })
}
