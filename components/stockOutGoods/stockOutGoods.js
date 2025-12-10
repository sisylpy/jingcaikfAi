Component({
  /**
   * 组件的属性列表
   */
  properties: {
    //是否显示modal
    show: {
      type: Boolean,
      value: true
    },

    item: {
      type: Object,
      value: {}
    },


    resetAfterSave(orders = []) {
      if (Array.isArray(orders) && orders.length > 0) {
        this.setData({
          focusIndex: 0
        });
      } else {
        this.setData({
          focusIndex: -1
        });
      }
    },

    statusBarHeight: {
      type: Number,
      value: ""
    },

    windowHeight: {
      type: Number,
      value: ""
    },

    windowWidth: {
      type: Number,
      value: ""
    },
    url: {
      type: String,
      value: ""
    }

  },

  /**
   * 组件的初始数据
   */
  data: {
    focusIndex: -1,
    scrollViewHeight: 300 // 默认高度（2个订单的高度）
  },

  /**
   * 数据监听器
   */
  observers: {
    'item.nxDepartmentOrdersEntities': function(orders) {
      // 根据订单数量动态计算滚动区域高度
      var orderCount = orders && orders.length ? orders.length : 0;
      var windowHeight = this.data.windowHeight || 0;
      var scrollHeight;
      
      // 每个订单大约需要 150rpx 的高度
      if (orderCount <= 2) {
        // 订单数量 <= 2，使用固定高度（2个订单的高度，约 300rpx）
        scrollHeight = 300;
      } else if (orderCount === 3) {
        // 3个订单，使用 450rpx（3个订单的高度）
        scrollHeight = 450;
      } else if (orderCount === 4) {
        // 4个订单，使用 600rpx（4个订单的高度）
        scrollHeight = 600;
      } else {
        // 订单数量 > 4，使用更大的高度（屏幕高度的一半）
        scrollHeight = windowHeight / 2;
      }
      
      this.setData({
        scrollViewHeight: scrollHeight
      });
      
      console.log('[stockOutGoods] 订单数量:', orderCount, '滚动区域高度:', scrollHeight, 'rpx');
    }
  },

  /**
   * 组件的方法列表
   */
  methods: {

    clickMask() {
      this.setData({
        show: false,
        focusIndex: -1
      })
    },

    cancle() {
      this.setData({
        show: false,
        item: {},
        focusIndex: -1
      })
      this.triggerEvent('cancle')
    },



    confirm(e) {
      var arr = (this.data.item && this.data.item.nxDepartmentOrdersEntities) ? this.data.item.nxDepartmentOrdersEntities : [];
      var targetIndex = this.data.focusIndex;

      if (targetIndex === -1) {
        // 如果没有聚焦，尝试找到第一条被选中且有重量的订单
        for (var i = 0; i < arr.length; i++) {
          if (arr[i].hasChoice) {
            targetIndex = i;
            break;
          }
        }
      }

      console.log('[stockOutGoods] confirm: 总订单数=', arr.length, '当前索引=', targetIndex);

      if (targetIndex === -1 || !arr[targetIndex] || !arr[targetIndex].hasChoice) {
        wx.showToast({
          title: '请先选择客户订单',
          icon: 'none'
        })
        return;
      }

      var weightNumber = parseFloat(arr[targetIndex].nxDoWeight);
      if (isNaN(weightNumber) || weightNumber <= 0) {
        wx.showToast({
          title: '请先填写出货数量',
          icon: 'none'
        })
        return;
      }

      console.log('[stockOutGoods] confirm: 即将提交的订单索引=', targetIndex, '重量=', arr[targetIndex].nxDoWeight);

      this.triggerEvent('confirm', {
        item: this.data.item,
        index: targetIndex
      })

      this.setData({
        focusIndex: -1
      })
    },


    choiceOrder(e){
      var index = e.currentTarget.dataset.index;
      var data = "item.nxDepartmentOrdersEntities[" + index + "].hasChoice";
      var weightField = "item.nxDepartmentOrdersEntities[" + index + "].nxDoWeight";
      if (!(this.data.item && this.data.item.nxDepartmentOrdersEntities && this.data.item.nxDepartmentOrdersEntities[index])) {
        return;
      }
      var choice = this.data.item.nxDepartmentOrdersEntities[index].hasChoice;
      if(choice){
        this.setData({
          [data]: false,
          [weightField]: ""
        })
      }else{
        this.setData({
          [data]: true,
        })
      } 
    },
   

getOrderWeight(e) {
  var index = e.currentTarget.dataset.index;
  if (!(this.data.item && this.data.item.nxDepartmentOrdersEntities && this.data.item.nxDepartmentOrdersEntities[index])) {
    return;
  }
  var doWeightData = "item.nxDepartmentOrdersEntities[" + index + "].nxDoWeight";
  var orderWeighValue = e.detail.value;
  var weightValue = "";
    //输入非空 
    if (orderWeighValue.length > 0) {
      weightValue = orderWeighValue;
      //1. 小数点
      var y = String(orderWeighValue).indexOf("."); //获取小数点的位置
      console.log(y);
      var count = 0;
      if (y !== -1) {
        count = String(orderWeighValue).length - y - 1; //获取小数点后的个数（减1是因为包含小数点本身）
      }
      if (count > 2) {
        wx.showToast({
          title: '小数点只能保留两位',
          icon: 'none'
        })
        // 保留小数点后2位
        var parts = orderWeighValue.split(".");
        if (parts.length === 2 && parts[1].length > 2) {
          weightValue = parts[0] + "." + parts[1].substring(0, 2);
        } else {
          weightValue = orderWeighValue.substring(0, orderWeighValue.length - 1);
        }
      }
    //2. 值大小判断
    if (e.detail.value > 99999) {
      wx.showToast({
        title: '最大不能超过九万九千九百九十九',
        icon: "none"
      })
     weightValue = Number(orderWeighValue.substring(0, orderWeighValue.length - 1));
    }
    
    // 清空其他所有订单的重量，确保只有一个输入框有重量
    var updateData = {
      [doWeightData]: weightValue,
    };
    var arr = this.data.item.nxDepartmentOrdersEntities || [];
    for (var i = 0; i < arr.length; i++) {
      if (i !== index) {
        var otherWeightData = "item.nxDepartmentOrdersEntities[" + i + "].nxDoWeight";
        updateData[otherWeightData] = "";
      }
    }
    
    this.setData(updateData);
  } else {
    this.setData({
      [doWeightData]: "",
    })
  }
},

    handleFocus(e) {
      var nextIndex = Number(e.currentTarget.dataset.index);
      var prevIndex = this.data.focusIndex;
      console.log('[stockOutGoods] handleFocus: prevIndex=', prevIndex, ', nextIndex=', nextIndex);
      if (!(this.data.item && this.data.item.nxDepartmentOrdersEntities && this.data.item.nxDepartmentOrdersEntities[nextIndex])) {
        return;
      }
      if (!isNaN(nextIndex) && nextIndex !== prevIndex) {
        this.setData({
          focusIndex: nextIndex
        }, () => {
          console.log('[stockOutGoods] setData完成, focusIndex=', this.data.focusIndex);
        });
      }
    },






  },




})