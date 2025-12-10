Component({
  
  properties: {
    showPopup: Boolean,
    item: {
      type: Object,
      value: ""
    },
    planOrder: {
      type: String,
      value: ""
    },
 
    applyStandardName: {
      type: String,
      value: ""
    },
    
    

  },

  

  data: {
    priceLevel: 1
  },

  methods: {

    getPlanOrder: function(e){
      if (e.detail.value.length > 0) {
        this.setData({
          planOrder: e.detail.value
        })
      }
    },

    getStandard: function(e){
      if (e.detail.value.length > 0) {
        this.setData({
          applyStandardName: e.detail.value
        })
      }
    },
    cancle() {
      this.setData({
        show: false,
      })
      this.triggerEvent('cancle')
    },
    delete(){
      // this.setData({
      //   show: false,
      // })
      console.log("delPurGoodsdelPurGoods")
      this.triggerEvent('delPurGoods')

    },

    confirmEdit(e) {
        console.log("commdmddedididid")
        this.triggerEvent('confirmEditGoods', {
        
          planOrder: this.data.planOrder,
          applyStandardName: this.data.applyStandardName,
          priceLevel: 1

        })

        this.setData({
          show: false,
          ids: [],
          planOrder: ""
        })
    

     
    },



    onCancel() {
      this.triggerEvent('closeEditPurGoods');
    },
    // onConfirm() {
    //   this.triggerEvent('confirmWarn');
    // },
    stopPropagation(event) {
      // event.stopPropagation(); // 防止点击内容区域关闭弹出窗口
    }
  }
});
