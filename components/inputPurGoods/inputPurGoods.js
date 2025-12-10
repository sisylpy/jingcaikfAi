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
      value: ""
    },
    maskHeight: {
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
    scaleInput: {
      type: Boolean,
      value: "false"
    }
  },

  /**
   * 组件的初始数据
   */
  data: {
  },

  /**
   * 组件的方法列表
   */
  methods: {

    clickMask() {
      this.setData({
        show: false,
      })
    },

    cancle() {
      this.setData({
        show: false,
        editApply: false,
        item: "",
      })
      this.triggerEvent('cancle')
    },

    finish(e){
      this.setData({
        show: false,
        editApply: false,
        item: "",
        
      })
      this.triggerEvent('finish')
    },

    
    // 获取采购单价
    getPurchasePrice(e) {
      var price = e.detail.value;
      this.setData({
        'item.nxDpgBuyPrice': price
      });
      this._calculateSubtotal();
    },

    // 获取建议售价
    getPurchaseExpectPrice(e) {
      var price = e.detail.value;
      this.setData({
        'item.nxDpgExpectPrice': price
      });
    },

    // 获取采购数量
    getPurchaseQuantity(e) {
      var quantity = e.detail.value;
      this.setData({
        'item.nxDpgBuyQuantity': quantity
      });
      this._calculateSubtotal();
    },

    // 计算总金额
    _calculateSubtotal() {
      var price = Number(this.data.item.nxDpgBuyPrice) || 0;
      var quantity = Number(this.data.item.nxDpgBuyQuantity) || 0;
      var subtotal = (price * quantity).toFixed(2);
      
      this.setData({
        'item.nxDpgBuySubtotal': subtotal
      });
    },

    // 检查价格
    _checkPrice(e) {
      var price = e.detail.value;
      if (price && (isNaN(price) || price < 0)) {
        wx.showToast({
          title: '请输入有效的价格',
          icon: 'none'
        });
      }
    },

    // 检查数量
    _checkQuantity(e) {
      var quantity = e.detail.value;
      if (quantity && (isNaN(quantity) || quantity <= 0)) {
        wx.showToast({
          title: '请输入有效的数量',
          icon: 'none'
        });
      }
    },

    // 切换等待入库状态
    changeWait(e) {
      const checked = e.detail.value;
      this.setData({
        'item.isShowTools': checked
      });
    },

    confirm(e) {
        // 验证采购单价
        if (!this.data.item.nxDpgBuyPrice || this.data.item.nxDpgBuyPrice.length == 0) {
          wx.showToast({
            title: '采购单价不能为空',
            icon: 'none'
          })
          return;
        }

        // 验证采购数量
        if (!this.data.item.nxDpgBuyQuantity || this.data.item.nxDpgBuyQuantity.length == 0) {
          wx.showToast({
            title: '采购数量不能为空',
            icon: 'none'
          })
          return;
        }

        console.log(this.data.item)
        this.triggerEvent('confirm', {
          item: this.data.item
        })
        this.setData({
          show: false,
        })
    },


    // getPurchasePrice: function (e) {
    //   console.log("getPurchasePrice_getBuySubtotal")
    //   var itemData = "item.nxDpgBuyPrice";
    //   var numberStr = e.detail.value;
    //   //输入非空 
    //   if (e.detail.value.length > 0) {
    //     //0
    //     this.setData({
    //       [itemData]: numberStr,
    //     })
    //     //1. 小数点
    //     var y = String(numberStr).indexOf("."); //获取小数点的位置
    //     if (y !== -1) {
    //       var count = String(numberStr).length - y; //获取小数点后的个数
    //     }
    //     if (count > 2) {
    //       wx.showToast({
    //         title: '小数点只能保留一位',
    //       })
    //       this.setData({
    //         [itemData]: numberStr.substring(0, numberStr.length - 1),
    //       })
    //     }
    //     //2. 值大小判断
    //     if (numberStr > 99999) {
    //       wx.showToast({
    //         title: '最大不能超过九万九千九百九十九',
    //         icon: "none"
    //       })
    //       this.setData({
    //         [itemData]: numberStr.substring(0, numberStr.length - 1),
    //       })
    //     }
    //     this._getBuySubtotal();
    //     this._countOrderCostPrice();
    //   } else {
    //     this._emptyInputPrice();
    //   }
    // },

    getOrderWeight(e) {
      var index = e.currentTarget.dataset.index;
      var doWeightData = "item.nxDepartmentOrdersEntities[" + index + "].nxDoWeight";
      var costSubtotalData = "item.nxDepartmentOrdersEntities[" + index + "].nxDoCostSubtotal";
      var orderWeighValue = e.detail.value;
      var costPrice = this.data.item.nxDepartmentOrdersEntities[index].nxDoCostPrice;    
      var costSubtotal = (Number(costPrice) * Number(orderWeighValue)).toFixed(1);

      //输入非空 
      if (orderWeighValue.length > 0) {

        console.log(costSubtotal);
        console.log("yisagnshicostsubtototototo")
        this.setData({
          [doWeightData]: orderWeighValue,
          [costSubtotalData]: costSubtotal
        })
        var doPrice = this.data.item.nxDepartmentOrdersEntities[index].nxDoPrice; 
        if(doPrice !== null){
          var orderSubtotalData = "item.nxDepartmentOrdersEntities[" + index + "].nxDoSubtotal";
           var doSubtotal = (Number(doPrice) * Number(orderWeighValue)).toFixed(1);
           var profitSubtotal = (Number(doSubtotal) - Number(costSubtotal)).toFixed(1);        
           var profitScale = (Number(profitSubtotal) / Number(doSubtotal) * 100).toFixed(2);
           var profitSubData = "item.nxDepartmentOrdersEntities[" + index + "].nxDoProfitSubtotal";
           var profitScaleData = "item.nxDepartmentOrdersEntities[" + index + "].nxDoProfitScale";
           this.setData({
             [orderSubtotalData] : doSubtotal,
             [profitSubData]: profitSubtotal,
             [profitScaleData]:  profitScale
           })
        }
        

        //1. 小数点
        var y = String(orderWeighValue).indexOf("."); //获取小数点的位置
        console.log(y);
        if (y !== -1) {
          var count = String(orderWeighValue).length - y; //获取小数点后的个数
        }
        if (count > 2) {
          wx.showToast({
            title: '小数点只能保留一位',
          })
          
          var newWeight = Number(orderWeighValue.substring(0, orderWeighValue.length - 1));
          var costSubtotal = (Number(costPrice) * newWeight).toFixed(1);
          this.setData({
            [orderWeightData]: newWeight,
            [costSubtotalData]: costSubtotal
          })
          if(doPrice !== null){
            var orderSubtotalData = "item.nxDepartmentOrdersEntities[" + index + "].nxDoSubtotal";
             var doSubtotal = (Number(doPrice) * Number(newWeight)).toFixed(1);
             var profitSubtotal = (Number(doSubtotal) - Number(costSubtotal)).toFixed(1);        
             var profitScale = (Number(profitSubtotal) / Number(doSubtotal) * 100).toFixed(2);
             var profitSubData = "item.nxDepartmentOrdersEntities[" + index + "].nxDoProfitSubtotal";
             var profitScaleData = "item.nxDepartmentOrdersEntities[" + index + "].nxDoProfitScale";
             this.setData({
               [orderSubtotalData] : doSubtotal,
               [profitSubData]: profitSubtotal,
               [profitScaleData]:  profitScale
             })
          }
          


        }
        //2. 值大小判断
        if (e.detail.value > 99999) {
          wx.showToast({
            title: '最大不能超过九万九千九百九十九',
            icon: "none"
          })
          var newWeight = Number(orderWeighValue.substring(0, orderWeighValue.length - 1));
          var costSubtotal = (Number(price) * newWeight).toFixed(1);
          this.setData({
            [orderWeightData]: newWeight,
            [costSubtotalData]: costSubtotal
          })
          if(doPrice !== null){
            var orderSubtotalData = "item.nxDepartmentOrdersEntities[" + index + "].nxDoSubtotal";
             var doSubtotal = (Number(doPrice) * Number(newWeight)).toFixed(1);
             var profitSubtotal = (Number(doSubtotal) - Number(costSubtotal)).toFixed(1);        
             var profitScale = (Number(profitSubtotal) / Number(doSubtotal) * 100).toFixed(2);
             var profitSubData = "item.nxDepartmentOrdersEntities[" + index + "].nxDoProfitSubtotal";
             var profitScaleData = "item.nxDepartmentOrdersEntities[" + index + "].nxDoProfitScale";
             this.setData({
               [orderSubtotalData] : doSubtotal,
               [profitSubData]: profitSubtotal,
               [profitScaleData]:  profitScale
             })
          }
        
        }
      
      } else {
        this.setData({
          [orderWeightData]: "",
          [subData]: ""
        })
      }
      this._getBuySubtotal();
    },

    _emptyInputPrice() {
      var arr = this.data.item.nxDepartmentOrdersEntities;
      for (var i = 0; i < arr.length; i++) {
        var orderPriceData = "item.nxDepartmentOrdersEntities[" + i + "].nxDoCostPrice";
        var subData = "item.nxDepartmentOrdersEntities[" + i + "].nxDoCostSubtotal";
        this.setData({
          [orderPriceData]: "",
          [subData]: ""
        })
      }
      var subData = "item.nxDpgBuySubtotal";
      var priceData = "item.nxDpgBuyPrice";
      this.setData({
        [subData]: "",
        [priceData]: "",
      })
    },
    
   
    _countOrderCostPrice() {
      var buyPrice = Number(this.data.item.nxDpgBuyPrice);
      var arr = this.data.item.nxDepartmentOrdersEntities;
      for (var i = 0; i < arr.length; i++) {
        var costPriceData = "item.nxDepartmentOrdersEntities[" + i + "].nxDoCostPrice";
        this.setData({
          [costPriceData]: buyPrice,         
        })
        var doWeight = this.data.item.nxDepartmentOrdersEntities[i].nxDoWeight;
        if(doWeight !== null && doWeight > 0){
          var costSubtotalData = "item.nxDepartmentOrdersEntities[" + i + "].nxDoCostSubtotal";
          var costSubtotal = (Number(buyPrice) * Number(doWeight)).toFixed(1);
          this.setData({
            [costSubtotalData]: costSubtotal,         
          })
        }
      }
      this._getBuySubtotal();
    },

    _getBuySubtotal(e) {
      var arr = this.data.item.nxDepartmentOrdersEntities;
      var purGoodsBuyQuantity = "";
      var buyPrice = this.data.item.nxDpgBuyPrice;

      for (var i = 0; i < arr.length; i++) {
       var doWeight = arr[i].nxDoWeight;
        purGoodsBuyQuantity = (Number(purGoodsBuyQuantity) + Number(doWeight)).toFixed(1);
      }
      var purGoodsBuySubtotal = (Number(purGoodsBuyQuantity) * Number(buyPrice)).toFixed(1);
      var purGoodsBuySubtotalData = "item.nxDpgBuySubtotal";
      var purGoodsBuyQuantityData = "item.nxDpgBuyQuantity";
      this.setData({
        [purGoodsBuySubtotalData]: purGoodsBuySubtotal,
        [purGoodsBuyQuantityData]: purGoodsBuyQuantity,
      })
    },

    
    _countOrderSubtotal(){
      var doPrice = this.data.item.nxDpgBuyPrice;
      var arr = this.data.item.nxDepartmentOrdersEntities;
      for(var i = 0; i < arr.length; i++){
        var priceData = "item.nxDepartmentOrdersEntities[" + i +"].nxDoCostPrice";
        this.setData({
          [priceData]: doPrice,
        })
      }
    },












  },




})