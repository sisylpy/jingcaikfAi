Component({
  properties: {
    show: {
      type: Boolean,
      value: false
    },
    shelfGoods: {
      type: Object,
      value: null
    },
    disId: {
      type: Number,
      value: 0
    },
    userId: {
      type: Number,
      value: 0
    }
  },

  data: {
    showStockList: false,
    showEditModal: false,
    stockList: [],
    selectedStock: null,
    goodsInfo: null,
    editRestWeight: '',
    editSellingPrice: '',
    canSubmit: false
  },

  observers: {
    'show,shelfGoods': function(show, shelfGoods) {
      console.log('=== editShelfStockDetail observers ===')
      console.log('show值变化:', show)
      console.log('shelfGoods:', shelfGoods)
      
      if (show && shelfGoods) {
        console.log('条件满足，初始化数据')
        this.initData(shelfGoods)
      } else if (!show) {
        console.log('组件隐藏，重置内部状态')
        this.resetState()
      } else {
        console.log('条件不满足，跳过初始化')
      }
    }
  },

  attached() {
    console.log('=== editShelfStock attached ===')
    console.log('初始show值:', this.data.show)
    console.log('初始shelfGoods:', this.data.shelfGoods)
    
    // 如果show为true且有数据，立即初始化
    if (this.data.show && this.data.shelfGoods) {
      console.log('attached中直接初始化')
      this.initData()
    }
  },

  methods: {
    resetState() {
      console.log('[editShelfStockDetail] resetState 调用')
      this.setData({
        showStockList: false,
        showEditModal: false,
        stockList: [],
        selectedStock: null,
        editRestWeight: '',
        editSellingPrice: '',
        canSubmit: false,
        goodsInfo: null
      })
    },

    // 初始化数据
    initData(passedShelfGoods) {
      console.log('[editShelfStockDetail] === 初始化库存编辑数据 ===')
      const shelfGoods = passedShelfGoods || this.data.shelfGoods || this.properties.shelfGoods || {}
      console.log('[editShelfStockDetail] shelfGoods:', shelfGoods)
      console.log('[editShelfStockDetail] shelfGoods keys:', Object.keys(shelfGoods))
      
      // 检查数据结构
      let goodsInfo = null
      let stockList = []
      
      if (shelfGoods.nxDistributerGoodsEntity) {
        goodsInfo = shelfGoods.nxDistributerGoodsEntity
        stockList = shelfGoods.nxDisGoodsShelfStockEntities || []
        console.log('[editShelfStockDetail] 使用 nxDistributerGoodsEntity，批次数:', stockList.length)
      } else if (shelfGoods.nxDisGoodsShelfStockEntities) {
        // 如果没有商品实体，直接使用批次数据
        stockList = shelfGoods.nxDisGoodsShelfStockEntities || []
        // 尝试从其他字段获取商品信息
        goodsInfo = {
          nxDgGoodsName: '商品',
          nxDgGoodsStandardname: '斤'
        }
        console.log('[editShelfStockDetail] 仅有 nxDisGoodsShelfStockEntities，批次数:', stockList.length)
      }
      
      console.log('[editShelfStockDetail] 商品信息:', goodsInfo)
      console.log('[editShelfStockDetail] 批次数量:', stockList.length)
      console.log('[editShelfStockDetail] 批次列表:', stockList)
      
      this.setData({
        goodsInfo,
        stockList,
        showStockList: true,
        showEditModal: false,
        selectedStock: null,
        editRestWeight: '',
        editSellingPrice: '',
        canSubmit: false
      })
      
      console.log('[editShelfStockDetail] === 设置完成，showStockList应为true ===')
      console.log('[editShelfStockDetail] 当前showStockList:', this.data.showStockList)
    },

    // 阻止事件冒泡
    preventClose() {},

    // 选择批次
    selectStock(e) {
      const index = e.currentTarget.dataset.index
      const selectedStock = this.data.stockList[index]
      
      console.log('=== 选择批次 ===')
      console.log('批次索引:', index)
      console.log('选中批次:', selectedStock)
      if (selectedStock) {
        try {
          console.log('选中批次字段列表:', Object.keys(selectedStock))
        } catch (err) {
          console.warn('获取选中批次字段列表失败', err)
        }
      }
      
      this.setData({
        selectedStock,
        showStockList: false,
        showEditModal: true,
        editRestWeight: selectedStock && selectedStock.nxDgssRestWeight != null ? String(selectedStock.nxDgssRestWeight) : '',
        editSellingPrice: selectedStock && selectedStock.nxDgssSellingPrice != null ? String(selectedStock.nxDgssSellingPrice) : ''
      })
      
      this.checkCanSubmit()
    },

    onRestWeightInput(e) {
      const value = e.detail.value
      console.log('输入剩余数量:', value)
      this.setData({
        editRestWeight: value
      })
      this.checkCanSubmit()
    },

    onSellingPriceInput(e) {
      const value = e.detail.value
      console.log('输入建议售价:', value)
      this.setData({
        editSellingPrice: value
      })
      this.checkCanSubmit()
    },

    // 检查是否可以提交
    checkCanSubmit() {
      const { editRestWeight, editSellingPrice, selectedStock } = this.data
      console.log('=== checkCanSubmit ===')
      console.log('editRestWeight:', editRestWeight)
      console.log('editSellingPrice:', editSellingPrice)
      console.log('selectedStock:', selectedStock)
      
      const rest = parseFloat(editRestWeight)
      const selling = parseFloat(editSellingPrice)
      const canSubmit = selectedStock &&
                        editRestWeight !== '' &&
                        editSellingPrice !== '' &&
                        !isNaN(rest) && rest >= 0 &&
                        !isNaN(selling) && selling >= 0
      
      console.log('canSubmit计算结果:', canSubmit)
      this.setData({ canSubmit })
      console.log('设置后canSubmit:', this.data.canSubmit)
    },

    // 关闭批次列表
    closeStockList() {
      this.setData({
        showStockList: false
      })
      this.triggerEvent('close')
      console.log('[editShelfStockDetail] closeStockList -> 触发 close 事件')
    },

    // 关闭编辑弹窗
    closeEditModal() {
      this.setData({
        showEditModal: false
      })
      console.log('[editShelfStockDetail] closeEditModal 调用')
    },

    // 返回批次列表
    backToStockList() {
      this.setData({
        showEditModal: false,
        showStockList: true
      })
      console.log('[editShelfStockDetail] backToStockList -> 返回批次列表')
    },

    // 提交修改
    submit() {
      console.log('=== submit方法被调用 ===')
      console.log('canSubmit:', this.data.canSubmit)
      console.log('当前所有data:', this.data)
      
      if (!this.data.canSubmit) {
        console.log('=== 提交失败 ===')
        console.log('canSubmit:', this.data.canSubmit)
        wx.showToast({
          title: '请先填写有效的数值',
          icon: 'none'
        })
        return
      }

      const { editRestWeight, editSellingPrice, selectedStock } = this.data
      const restWeightNum = parseFloat(editRestWeight)
      const sellingPriceNum = parseFloat(editSellingPrice)

      const stockId = selectedStock.nxDisGoodsShelfStockId ||
                      selectedStock.nxDistributerGoodsShelfStockId ||
                      selectedStock.nxDgssShelfStockId ||
                      selectedStock.nxDgssStockId ||
                      selectedStock.nxDgssId ||
                      selectedStock.nxDgssEntityId ||
                      selectedStock.nxDgssShelfId ||
                      selectedStock.nxDisGoodsStockId ||
                      selectedStock.nxDisGoodsShelfStockEntityId ||
                      selectedStock.id ||
                      selectedStock.stockId

      if (!stockId) {
        console.error('未找到批次ID，selectedStock:', selectedStock)
        wx.showToast({
          title: '批次数据异常',
          icon: 'none'
        })
        return
      }

      const payload = {
        stockId,
        restWeight: restWeightNum,
        sellingPrice: sellingPriceNum,
        disId: this.data.disId,
        userId: this.data.userId
      }

      console.log('=== 确认提交 ===')
      console.log('提交参数:', payload)

      wx.showModal({
        title: '确认修改',
        content: `剩余数量将更新为 ${restWeightNum}${this.data.goodsInfo.nxDgGoodsStandardname}，建议售价为 ¥${sellingPriceNum}，确认提交吗？`,
        success: (res) => {
          if (res.confirm) {
            console.log('用户确认提交')
            this.triggerEvent('confirm', payload)
          } else {
            console.log('用户取消提交')
          }
        }
      })
    },
  }
})

