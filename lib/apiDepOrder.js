import Promise from './bluebird'
import apiUrl from '../config.js'

var load = require('./load.js');





//







export const stokerGetToStockGoodsWithDepIds = (data) => {
  return new Promise((resolve, reject) => {
    wx.request({
      url: apiUrl.apiUrl + 'nxdepartmentorders/stokerGetToStockGoodsWithDepIds',
      method: 'POST',
      data: {
        nxDepIds: data.nxDepIds,
        gbDepIds: data.gbDepIds,
        nxDisId: data.nxDisId,
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

export const cancleGbOrderSx = (data) => {
  return new Promise((resolve, reject) => {
    wx.request({
      url: apiUrl.apiUrl + 'nxdepartmentorders/cancleGbOrderSx/' + data ,
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
export const disGetToPlanPurchaseGoodsSearch = (data) => {
  return new Promise((resolve, reject) => {
    wx.request({
      url: apiUrl.apiUrl + 'nxdepartmentorders/disGetToPlanPurchaseGoodsSearch',
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
          icon: 'none'
        })
      }
    })
  })
}



/**
 * 送货单完成结账
 * @param {*} data 
 */
export const settleDepBills = (data) => {
  return new Promise((resolve, reject) => {
    wx.request({
      url: apiUrl.apiUrl + 'nxdepartmentbill/settleDepBills' ,
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
          icon: 'none'
        })
      }
    })
  })
}


export const getBillApplys = (data) => {
  return new Promise((resolve, reject) => {
    wx.request({
      url: apiUrl.apiUrl + 'nxdepartmentbill/getBillApplys' ,
      method: 'POST',
      data:{
        billId: data.billId,
        depFatherId: data.depFatherId,
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


export const disGetUnSettleAccountBills = (data) => {
  return new Promise((resolve, reject) => {
    wx.request({
      url: apiUrl.apiUrl + 'nxdepartmentbill/disGetUnSettleAccountBills/' + data ,
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




export const cancelOutOrder = (data) => {
  return new Promise((resolve, reject) => {
    wx.request({
      url: apiUrl.apiUrl + 'nxdepartmentorders/cancelOutOrder',
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

export const stokerHaveNotOutCataGoods = (data) => {
  return new Promise((resolve, reject) => {
    wx.request({
      url: apiUrl.apiUrl + 'nxdepartmentorders/stokerHaveNotOutCataGoods' ,
      method: 'POST',
      data:{
        depFatherId: data.depFatherId,
        gbDepFatherId: data.gbDepFatherId,
        resFatherId: data.resFatherId,
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
          icon: 'none'
        })
      }
    })
  })
}
//
export const stokerHaveNotCollOutCataGoods = (data) => {
  return new Promise((resolve, reject) => {
    wx.request({
      url: apiUrl.apiUrl + 'nxdepartmentorders/stokerHaveNotCollOutCataGoods' ,
      method: 'POST',
      data:{
        nxDisId: data.nxDisId,
        requestDisId: data.requestDisId,
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


export const stockerGetHaveOutCollCataGoods = (data) => {
  return new Promise((resolve, reject) => {
    wx.request({
      url: apiUrl.apiUrl + 'nxdepartmentorders/stockerGetHaveOutCollCataGoods' ,
      method: 'POST',
      data:{
        nxDisId: data.nxDisId,
        requestDisId: data.requestDisId,
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
export const stockerGetHaveOutCataGoods = (data) => {
  return new Promise((resolve, reject) => {
    wx.request({
      url: apiUrl.apiUrl + 'nxdepartmentorders/stockerGetHaveOutCataGoods' ,
      method: 'POST',
      data:{
        depFatherId: data.depFatherId,
        gbDepFatherId: data.gbDepFatherId,
        resFatherId: data.resFatherId,
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
          icon: 'none'
        })
      }
    })
  })
}

/**
 * 跟新批发商别名
 */
export const disFinishPurchaseBatch = (data) => {
  return new Promise((resolve, reject) => {
    wx.request({
      url: apiUrl.apiUrl + 'nxdistributerpurchasebatch/disFinishPurchaseBatch',
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


export const purchaserEditBatch = (data) => {
  return new Promise((resolve, reject) => {
    wx.request({
      url: apiUrl.apiUrl + 'nxdistributerpurchasebatch/purchaserEditBatch/' +data,
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


export const deleteDisPurBatchItem = (data) => {
  return new Promise((resolve, reject) => {
    wx.request({
      url: apiUrl.apiUrl + 'nxdistributerpurchasebatch/deleteDisPurBatchItem/' + data,
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



export const stockerGetToStockGoodsWithCollDisId = (data) => {
  return new Promise((resolve, reject) => {
    wx.request({
      url: apiUrl.apiUrl + 'nxdepartmentorders/stockerGetToStockGoodsWithCollDisId',
      method: 'POST',
      data: {
        requestDisId: data.requestDisId,
        nxDisId: data.nxDisId,
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


export const stockerGetToStockGoodsWithDepIdsKf = (data) => {
  return new Promise((resolve, reject) => {
    wx.request({
      url: apiUrl.apiUrl + 'nxdepartmentorders/stockerGetToStockGoodsWithDepIdsKf',
      method: 'POST',
      data: {
        nxDepIds: data.nxDepIds,
        gbDepIds: data.gbDepIds,
        nxDisId: data.nxDisId,
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

/**
 * 称重端按具体订单只读查询客户商品当前标准。
 */
export const pickerGetOrderCustomerStandard = (data) => {
  return new Promise((resolve, reject) => {
    const requestData = {
      distributerId: data.distributerId,
      weightUserId: data.weightUserId,
      orderId: data.orderId
    }
    if (data.supplierId !== undefined && data.supplierId !== null && Number(data.supplierId) > 0) {
      requestData.supplierId = Number(data.supplierId)
    }
    wx.request({
      url: apiUrl.apiUrl + 'nxdepartmentdisgoodsstandard/pickerCurrent/' + data.departmentDisGoodsId,
      method: 'GET',
      data: requestData,
      success: (res) => {
        resolve({ result: res.data })
      },
      fail: (e) => {
        reject(e)
      }
    })
  })
}


export const stockerGetStockGoodsKfPage = (data) => {
  return new Promise((resolve, reject) => {
    wx.request({
      url: apiUrl.apiUrl + 'nxdepartmentorders/stockerGetStockGoodsKfPage',
      method: 'POST',
      data: {
        disId: data.disId,
        page: data.page,
        limit: data.limit,
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
 * 获取货架列表（仅基本信息，不包含商品详情）
 * @param {Object} data - 请求参数
 * @param {String} data.nxDepIds - 部门ID列表（String类型），"0"表示全部，多个用逗号分隔
 * @param {String} data.gbDepIds - GB部门ID列表（String类型），"0"表示全部，多个用逗号分隔
 * @param {Integer} data.nxDisId - 分销商ID
 */
export const stockerGetShelfListWithDepIds = (data) => {
  return new Promise((resolve, reject) => {
    wx.request({
      url: apiUrl.apiUrl + 'nxdepartmentorders/stockerGetShelfListWithDepIds',
      method: 'POST',
      data: {
        nxDepIds: data.nxDepIds,
        gbDepIds: data.gbDepIds,
        nxDisId: data.nxDisId,
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

/**
 * 获取指定货架的商品详情
 * @param {Object} data - 请求参数
 * @param {Integer} data.shelfId - 货架ID
 * @param {String} data.nxDepIds - 部门ID列表（String类型），"0"表示全部，多个用逗号分隔
 * @param {String} data.gbDepIds - GB部门ID列表（String类型），"0"表示全部，多个用逗号分隔
 * @param {Integer} data.nxDisId - 分销商ID
 */
export const stockerGetShelfGoodsDetail = (data) => {
  return new Promise((resolve, reject) => {
    wx.request({
      url: apiUrl.apiUrl + 'nxdepartmentorders/stockerGetShelfGoodsDetail',
      method: 'POST',
      data: {
        shelfId: data.shelfId,
        nxDepIds: data.nxDepIds,
        gbDepIds: data.gbDepIds,
        nxDisId: data.nxDisId,
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

/**
 * 刷新统计数据（完成出货后调用）
 * @param {Object} data - 请求参数
 * @param {String} data.nxDepIds - 部门ID列表（String类型），"0"表示全部，多个用逗号分隔
 * @param {String} data.gbDepIds - GB部门ID列表（String类型），"0"表示全部，多个用逗号分隔
 * @param {Integer} data.nxDisId - 分销商ID
 */
export const stockerGetShelfStatistics = (data) => {
  return new Promise((resolve, reject) => {
    wx.request({
      url: apiUrl.apiUrl + 'nxdepartmentorders/stockerGetShelfStatistics',
      method: 'POST',
      data: {
        nxDepIds: data.nxDepIds,
        gbDepIds: data.gbDepIds,
        nxDisId: data.nxDisId,
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
//


/**
 * 获取分类列表（仅基本信息，不包含商品详情）
 * @param {Object} data - 请求参数
 * @param {String} data.nxDepIds - 部门ID列表（String类型），"0"表示全部，多个用逗号分隔
 * @param {String} data.gbDepIds - GB部门ID列表（String类型），"0"表示全部，多个用逗号分隔
 * @param {Integer} data.nxDisId - 分销商ID
 */
export const stockerGetCategoryListWithCollNxDisId = (data) => {
  return new Promise((resolve, reject) => {
    wx.request({
      url: apiUrl.apiUrl + 'nxdepartmentorders/stockerGetCategoryListWithCollNxDisId',
      method: 'POST',
      data: {
        nxDisId: data.nxDisId,
        requestDisId: data.requestDisId,
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

/**
 * 获取分类列表（仅基本信息，不包含商品详情）
 * @param {Object} data - 请求参数
 * @param {String} data.nxDepIds - 部门ID列表（String类型），"0"表示全部，多个用逗号分隔
 * @param {String} data.gbDepIds - GB部门ID列表（String类型），"0"表示全部，多个用逗号分隔
 * @param {Integer} data.nxDisId - 分销商ID
 */
export const stockerGetCategoryListWithDepIds = (data) => {
  return new Promise((resolve, reject) => {
    wx.request({
      url: apiUrl.apiUrl + 'nxdepartmentorders/stockerGetCategoryListWithDepIds',
      method: 'POST',
      data: {
        nxDepIds: data.nxDepIds,
        gbDepIds: data.gbDepIds,
        nxDisId: data.nxDisId,
        supplierId: data.supplierId,
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


export const stockerGetCategoryGoodsDetailWithCooNxDisId = (data) => {
  return new Promise((resolve, reject) => {
    wx.request({
      url: apiUrl.apiUrl + 'nxdepartmentorders/stockerGetCategoryGoodsDetailWithCooNxDisId',
      method: 'POST',
      data: {
        categoryId: data.categoryId,
        nxDisId: data.nxDisId,
        requestDisId: data.requestDisId
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


export const stockerGetCategoryGoodsDetail = (data) => {
  return new Promise((resolve, reject) => {
    wx.request({
      url: apiUrl.apiUrl + 'nxdepartmentorders/stockerGetCategoryGoodsDetail',
      method: 'POST',
      data: {
        categoryId: data.categoryId,
        nxDisId: data.nxDisId, 
        nxDepIds: data.nxDepIds,
        gbDepIds: data.gbDepIds,
        supplierId: data.supplierId,
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

/**
 * 刷新统计数据（完成出货后调用）- 分类商品
 * @param {Object} data - 请求参数
 * @param {String} data.nxDepIds - 部门ID列表（String类型），"0"表示全部，多个用逗号分隔
 * @param {String} data.gbDepIds - GB部门ID列表（String类型），"0"表示全部，多个用逗号分隔
 * @param {Integer} data.nxDisId - 分销商ID
 */
export const stockerGetCategoryStatistics = (data) => {
  return new Promise((resolve, reject) => {
    wx.request({
      url: apiUrl.apiUrl + 'nxdepartmentorders/stockerGetCategoryStatistics',
      method: 'POST',
      data: {
        nxDepIds: data.nxDepIds,
        gbDepIds: data.gbDepIds,
        nxDisId: data.nxDisId,
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




//


export const stockerGetShelfList = (data) => {
  return new Promise((resolve, reject) => {
    wx.request({
      url: apiUrl.apiUrl + 'nxdepartmentorders/stockerGetShelfList/' + data,
      method: 'GET',
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

/**
 * 修改订货申请
 * @param {*} data 
 */




export const deleteDisBatch = (data) => {
  return new Promise((resolve, reject) => {
    wx.request({
      url: apiUrl.apiUrl + 'nxdistributerpurchasebatch/deleteDisBatch/' + data,
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
 * 添加进货商品，修改订单状态
 * @param {*} data 
 */


export const disInitOrderStatus = (data) => {
  return new Promise((resolve, reject) => {
    wx.request({
      url: apiUrl.apiUrl + 'nxdepartmentorders/disInitOrderStatus',
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
 * 分享进货商品
 * @param {*} data 
 */
export const saveDisPurGoodsBatch = (data) => {
  return new Promise((resolve, reject) => {
    wx.request({
      url: apiUrl.apiUrl + 'nxdistributerpurchasebatch/saveDisPurGoodsBatch' ,
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
 * 获取上货商品列表
 * @param {*} data 
 */
export const disGetPurchasingBatch= (data) => {
  return new Promise((resolve, reject) => {
    wx.request({
      url: apiUrl.apiUrl + 'nxdistributerpurchasebatch/disGetPurchasingBatch',
      method: 'POST',
      data:{
        disId: data.disId,
        type: data.type
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
 * 获取上货商品列表
 * @param {*} data 
 */

//












export const stockerGetStockGoodsUnWeigth = (data) => {
  return new Promise((resolve, reject) => {
    wx.request({
      url: apiUrl.apiUrl + 'nxdepartmentorders/stockerGetStockGoodsUnWeigth',
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




export const giveOrderWeightListForStockShelfGoods = (data) => {
  return new Promise((resolve, reject) => {
    wx.request({
      url: apiUrl.apiUrl + 'nxdepartmentorders/giveOrderWeightListForStockShelfGoods',
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

export const giveOrderWeightListForStockAndFinish = (data) => {
  return new Promise((resolve, reject) => {
    wx.request({
      url: apiUrl.apiUrl + 'nxdepartmentorders/giveOrderWeightListForStockAndFinish',
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
 * 拣货员出库（单个订单）
 * @param {Object} data - 请求参数
 * @param {Integer} data.orderId - 订单ID
 * @param {String} data.orderWeight - 订单重量
 * @param {Integer} data.pickerUserId - 拣货员用户ID
 */
export const pickerGiveOrderWeight = (data) => {
  return new Promise((resolve, reject) => {
    wx.request({
      url: apiUrl.apiUrl + 'nxdepartmentorders/pickerGiveOrderWeight',
      method: 'POST',
      data: {
        orderId: data.orderId,
        orderWeight: data.orderWeight,
        pickerUserId: data.pickerUserId
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
 * 拣货员出库并更新货架库存（单个订单，用于分类显示）
 * @param {Object} data - 请求参数
 * @param {Integer} data.orderId - 订单ID
 * @param {String} data.orderWeight - 订单重量
 * @param {Integer} data.pickerUserId - 拣货员用户ID
 * @param {Integer} data.shelfId - 货架ID
 */
export const pickerGiveOrderWeightUpdateShelfStock = (data) => {
  return new Promise((resolve, reject) => {
    wx.request({
      url: apiUrl.apiUrl + 'nxdepartmentorders/pickerGiveOrderWeightUpdateShelfStock',
      method: 'POST',
      data: {
        orderId: data.orderId,
        orderWeight: data.orderWeight,
        pickerUserId: data.pickerUserId,
        shelfId: data.shelfId
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
export const giveOrderPrice = (data) => {
  return new Promise((resolve, reject) => {
    wx.request({
      url: apiUrl.apiUrl + 'nxdepartmentorders/giveOrderPrice',
      method: 'POST',
      data: {
        orderId: data.orderId,
        price: data.price,
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


export const updateOrderWeight = (data) => {
  return new Promise((resolve, reject) => {
    wx.request({
      url: apiUrl.apiUrl + 'nxdepartmentorders/updateOrderWeight',
      method: 'POST',
      data: {
        orderId: data.orderId,
        weight: data.weight,
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
 * 供货商修改订单重量接口
 * @param {Object} data - 请求参数
 * @param {Number} data.orderId - 订单ID
 * @param {String} data.weight - 订单重量
 * @param {Number} [data.pickUserId] - 称重员工ID（可选）
 */
export const sellerUpdateOrderWeight = (data) => {
  return new Promise((resolve, reject) => {
    wx.request({
      url: apiUrl.apiUrl + 'nxdistributerpurchasegoods/sellerUpdateOrderWeight',
      method: 'POST',
      data: {
        orderId: data.orderId,
        weight: data.weight,
        pickUserId: data.pickUserId
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
 * 删除订货申请
 * @param {*} data 
 */
export const deleteOrder = (data) => {
  return new Promise((resolve, reject) => {
    wx.request({
      url: apiUrl.apiUrl + 'nxdepartmentorders/delete/' + data ,
      method: 'GET',
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



/**
 * 修改订货申请
 * @param {*} data 
 */
export const updateOrder = (data) => {
  return new Promise((resolve, reject) => {
    wx.request({
      url: apiUrl.apiUrl + 'nxdepartmentorders/updateOrder' ,
      method: 'POST',
      data:{
        id: data.id,
        weight: data.weight,
        standard: data.standard,
        remark: data.remark,
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







export const getOrderPage = (data) => {
  return new Promise((resolve, reject) => {
    wx.request({
      url: apiUrl.apiUrl + 'nxdepartmentorders/getOrderPage' ,
      method: 'POST',
      data:{
        depFatherId: data.depFatherId,
        gbDepFatherId: data.gbDepFatherId,
        resFatherId: data.resFatherId,
        orderBy: data.orderBy
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
 * page：order
 * 获取订货客户的订单
 * @param {*} data 
 */
export const disGetTodayOrderCustomer = (data) => {
  return new Promise((resolve, reject) => {
    wx.request({
      url: apiUrl.apiUrl + 'nxdepartmentorders/disGetTodayOrderCustomer/' + data,
      method: 'GET',
      success: (res) => {
        resolve({ result: res.data })
      },
      fail: (e) => {
        reject(e);
        load.hideLoading();
        wx.showToast({
          title: '"' + e +'"',
          icon: 'none',
          duration: 5000
        })
       
      }
    })
  })
}
