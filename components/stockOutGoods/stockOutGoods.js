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
      
      // 如果当前 focusIndex 无效，则设置为第一条订单（索引0）
      var currentFocusIndex = this.data.focusIndex;
      var updateData = {
        scrollViewHeight: scrollHeight
      };
      
      if (currentFocusIndex < 0 || currentFocusIndex >= orderCount) {
        updateData.focusIndex = orderCount > 0 ? 0 : -1;
      }
      
      this.setData(updateData);
      
      console.log('[stockOutGoods] 订单数量:', orderCount, '滚动区域高度:', scrollHeight, 'rpx', 'focusIndex:', updateData.focusIndex || currentFocusIndex);
    },
    'show': function(show) {
      // 当弹窗打开时，如果有订单，则默认选中第一条订单（索引0）
      if (show) {
        var orders = this.data.item && this.data.item.nxDepartmentOrdersEntities;
        var orderCount = orders && orders.length ? orders.length : 0;
        if (orderCount > 0) {
          this.setData({
            focusIndex: 0
          });
          console.log('[stockOutGoods] 弹窗打开，默认选中第一条订单，focusIndex:', 0);
        }
      }
    }
  },

  /**
   * 组件的方法列表
   */
  methods: {

    openCustomerStandard(e) {
      this.triggerEvent('openstandard', {
        order: e.currentTarget.dataset.order,
        goodsName: e.currentTarget.dataset.goodsName || (this.data.item && this.data.item.nxDgGoodsName) || ''
      });
    },

    resetAfterSave(orders = []) {
      if (Array.isArray(orders) && orders.length > 0) {
        this.setData({ focusIndex: 0 });
      } else {
        this.setData({ focusIndex: -1 });
      }
    },

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
      
      // 使用当前选中的订单索引（focusIndex）
      var targetIndex = this.data.focusIndex;

      console.log('[stockOutGoods] confirm: 总订单数=', arr.length, '当前索引=', targetIndex);

      // 检查是否有订单和订单是否存在
      if (targetIndex === -1 || !arr[targetIndex]) {
        wx.showToast({
          title: '请先选择订单',
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
        index: targetIndex,
        order: arr[targetIndex] // 传递当前选中的订单对象
      })

      // 提交后保持当前选中状态，不需要重置 focusIndex
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
      
      // 0. 检测并修正错误格式：连续的小数点（如 "1..3" -> "1.3"）
      // 使用正则表达式替换连续的小数点为单个小数点
      weightValue = weightValue.replace(/\.{2,}/g, '.');
      
      // 检测多个小数点（如 "1.2.3"），只保留第一个小数点
      var dotCount = (weightValue.match(/\./g) || []).length;
      if (dotCount > 1) {
        // 找到第一个小数点的位置
        var firstDotIndex = weightValue.indexOf('.');
        // 保留第一个小数点，移除后续的小数点
        weightValue = weightValue.substring(0, firstDotIndex + 1) + weightValue.substring(firstDotIndex + 1).replace(/\./g, '');
        wx.showToast({
          title: '只能输入一个小数点',
          icon: 'none'
        });
      }
      
      //1. 小数点位数判断
      var y = String(weightValue).indexOf("."); //获取小数点的位置
      console.log(y);
      var count = 0;
      if (y !== -1) {
        count = String(weightValue).length - y - 1; //获取小数点后的个数（减1是因为包含小数点本身）
      }
      if (count > 2) {
        wx.showToast({
          title: '小数点只能保留两位',
          icon: 'none'
        })
        // 保留小数点后2位
        var parts = weightValue.split(".");
        if (parts.length === 2 && parts[1].length > 2) {
          weightValue = parts[0] + "." + parts[1].substring(0, 2);
        } else {
          weightValue = weightValue.substring(0, weightValue.length - 1);
        }
      }
      
      //2. 值大小判断
      var numValue = parseFloat(weightValue);
      if (!isNaN(numValue) && numValue > 99999) {
        wx.showToast({
          title: '最大不能超过九万九千九百九十九',
          icon: "none"
        })
        // 如果超过最大值，截取到前一位
        weightValue = weightValue.substring(0, weightValue.length - 1);
      }
      
      // 3. 检测无效格式：只有小数点（如 "." 或 ".."）
      if (weightValue === '.' || weightValue === '') {
        weightValue = '';
      }
    
    // 只更新当前订单的重量，不清空其他订单的重量（允许同时填写多条订单）
    this.setData({
      [doWeightData]: weightValue,
    });
  } else {
    this.setData({
      [doWeightData]: "",
    })
  }
},

    handleFocus(e) {
      // 允许点击输入框切换选中订单
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
