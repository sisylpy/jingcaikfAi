var load = require('../../../lib/load.js');
import apiUrl from '../../../config.js'

import {
  pickerGiveOrderWeight,
  pickerGiveOrderWeightUpdateShelfStock,
  sellerUpdateOrderWeight,
  stockerGetShelfListWithDepIds,
  stockerGetShelfGoodsDetail,
  stockerGetShelfStatistics,

  stockerGetCategoryListWithDepIds,
  stockerGetCategoryGoodsDetail,
  
  stockerGetCategoryStatistics
} from '../../../lib/apiDepOrder'


// 节流函数 - 用于优化滚动事件处理
function throttle(fn, gapTime) {
  if (gapTime == null || gapTime == undefined) {
    gapTime = 100;
  }
  let _lastTime = null;
  return function () {
    let _nowTime = + new Date();
    if (_nowTime - _lastTime > gapTime || !_lastTime) {
      fn.apply(this, arguments);
      _lastTime = _nowTime;
    }
  };
}


const viewBarHeight = 60;

Component({

  pageLifetimes: {
    show() {
      var value = wx.getStorageSync('userInfo');
      console.log("📦 userInfo:", value);
      console.log("📦 this.data.disId:", this.data.disId);

      // 与 custom-tab-bar 的 setData 错开，减轻「recursive update」告警
      const runShow = () => {
        if (typeof this.getTabBar === 'function' && this.getTabBar()) {
          this.getTabBar().setData({ selected: 1 });
        }
        if (value && this.data.disId) {
          this.setData({
            currentPage: 1,
            showEndHint: false,
            showNoDataHint: false
          }, () => {
            this._initDataForShowType();
          });
        } else {
          console.log("⚠️ 条件不满足，value:", !!value, "disId:", this.data.disId);
        }
        console.log("========= total/goods pageLifetimes.show() 延后任务执行完成 =========");
      };
      if (typeof wx.nextTick === 'function') {
        wx.nextTick(runShow);
      } else {
        setTimeout(runShow, 0);
      }
    }
  },


  lifetimes: {
    attached(e) {
      console.log("========= shelf lifetimes.attached() 开始执行 =========");
      console.log("🔍 检查 this._aaa 类型:", typeof this._aaa);
      console.log("🔍 检查 this.methods:", this.methods);
      
      const app = getApp();
      const globalData = app.globalData;
    const navBarHeight = globalData.navBarHeight;
    const screenHeight = globalData.screenHeight;
    const screenWidth = globalData.screenWidth;
    const rpxRatio = 750 / screenWidth;
    const navBarHeightRpx = navBarHeight * rpxRatio;
    const tabBarHeightRpx = 100;
    const viewBarHeightRpx = viewBarHeight * rpxRatio;

    const contentHeight = (screenHeight - navBarHeight  - viewBarHeight) * rpxRatio;
  

    this.setData({

      contentHeight: contentHeight,
      navBarHeight: navBarHeightRpx,
      tabBarHeight: tabBarHeightRpx,
      viewBarHeight: viewBarHeightRpx,
      leftMenuWidth: 100, // 左侧菜单宽度，单位 rpx

    });
    
      this.setData({
        windowWidth: globalData.windowWidth * globalData.rpxR,
        windowHeight: globalData.windowHeight * globalData.rpxR,
        statusBarHeight: globalData.statusBarHeight * globalData.rpxR,
        url: apiUrl.server,
        scrollViewTop: 0,
        // stockOutGoods：需为 Object，且子组件模板会读 nxDgGoodsBrand.length、nxDepartmentOrdersEntities
        item: {
          nxDgGoodsBrand: '',
          nxDgGoodsName: '',
          nxDgGoodsStandardname: '',
          nxDgGoodsStandardWeight: '',
          nxDepartmentOrdersEntities: []
        },
        showDisOutGoods: false,
        grandList: [],
        shelfArr: [],
        selectedSub: 0, // 选中的分类
        scrollHeight: 0, // 滚动视图的高度
        toView: 'position0', // 滚动视图跳转的位置
        leftScrollIntoView: '', // 左侧滚动到指定位置
        leftScrollCounter: 0, // 左侧滚动计数器，确保每次都是新值
        isClickingLeftMenu: false, // 标记是否正在点击左侧菜单，避免滚动事件覆盖
        programmaticScrollTarget: null, // 记录程序触发的滚动目标，用于判断是否是程序触发的滚动
        clickingTargetIndex: null, // 记录点击的目标 index，用于在滚动检测中判断
        // 重置锁住相关状态
        canClickGoods: false, // 重置为不允许点击右侧商品
        clickedLeftMenuIndex: null, // 重置锁住的菜单 index
        outNxDepIds: [],
        outNxDepNames: [],
        outGbDepIds: [],
        outGbDepNames: [],
        // 从缓存读取 showType，如果没有缓存则使用默认值 'type'
        showType: wx.getStorageSync('showType') || 'type', // 
      })
      // 
      var value = wx.getStorageSync('userInfo');
      console.log("📦 attached() 中获取 userInfo:", value);
      if (value) {
        this.setData({
          userInfo: value,
        })
        var disValue = wx.getStorageSync('disInfo');
        console.log("📦 attached() 中获取 disInfo:", disValue);
        if (disValue) {
          this.setData({
            disInfo: disValue,
            disId: disValue.nxDistributerId,
            supplierId: -1
          })
          if(this.data.showType == 'type'){
            this._initCategoryData();
          }else{
            this._initShelfData();
          }
        }else{
          var supplierValue = wx.getStorageSync('supplierCustomer');
          console.log("📦 supplierValue:", supplierValue);
          
          if (supplierValue) {
            console.log("✅ 检测到供货商登录");
            var disId = supplierValue.disId;
            console.log("✅ 供货商登录，disId:", disId);
            console.log("✅ supplierId:", supplierValue.supplierId);
            this.setData({
              supplierCustomer: supplierValue,
              supplierId: supplierValue.supplierId,
              disId: disId
            });
            this._initCategoryData();
          }
        }

      

      
        
      } 
      
    }
  },

  methods: {
    // ./show

    changeShowType() {
      // 切换前先清理状态
      
      const newShowType = this.data.showType === 'type' ? 'shelf' : 'type';
      
      // 重置滚动和选中状态，同时重置商品点击权限
      const resetData = {
        showType: newShowType,
        selectedSub: 0,
        leftScrollIntoView: '',
        toView: 'position0',
        scrollTop: 0,
        canClickGoods: false, // 切换显示类型时，重置为不允许点击
        clickedLeftMenuIndex: null, // 切换显示类型时，重置允许点击的菜单 index
      };
      
      // 如果切换到货架显示，重置货架相关状态
      if (newShowType === 'shelf') {
        resetData.shelfArr = [];
        resetData.isLoadingMoreShelves = false;
        resetData.isGettingShelfPositions = false;
        resetData.selectedShelfId = '';
        resetData.positionId = '';
      } else {
        // 如果切换到类别显示，重置类别相关状态
        resetData.grandList = [];
        resetData.goodsList = [];
      }
      
      this.setData(resetData, () => {
      // 保存到缓存
      wx.setStorageSync('showType', newShowType);
      // 重新初始化数据
      this._initDataForShowType();
      });
    },


    _aaa() {
      this._initDataForShowType();
    },

    

    _initDataForShowType() {
      console.log("========= _initDataForShowType 被调用 =========");
      console.log("📊 当前 disId:", this.data.disId);
      console.log("📊 当前 showType:", this.data.showType);
      
      // 确保 disId 已设置
      if (!this.data.disId) {
        console.warn("⚠️ disId 未设置，延迟 100ms 后重试");
        setTimeout(() => {
          console.log("🔄 延迟重试 _initDataForShowType");
          this._initDataForShowType();
        }, 100);
        return;
      }
      
      console.log("✅ disId 已设置，准备初始化数据");
      this.setData({
        canClickGoods: false,
        clickedLeftMenuIndex: null,
        isClickingLeftMenu: false,
        clickingTargetIndex: null
      }, () => {
        if (this.data.showType === 'shelf') {
          console.log("📦 showType 为 'shelf'，调用 _initShelfData()");
          this._initShelfData();
        } else {
          console.log("📦 showType 为 'type'，调用 _initCategoryData()");
          this._initCategoryData();
        }
      });
    },

    _initShelfData() {
      console.log("========= _initShelfData 开始 - 使用新接口分页加载 =========");
      console.log("当前 disId:", this.data.disId);
      
      // 1. 先获取所有货架列表
      this.loadShelfList().then(() => {
        // 2. 智能加载商品，保证至少10个商品
        this.loadGoodsUntilMinCount(10);
      });
    },

    _initCategoryData() {
      console.log("========= _initCategoryData 开始 =========");
      console.log("当前 disId:", this.data.disId);
      
      // 确保 disId 已设置
      if (!this.data.disId) {
        console.error("错误：disId 未设置，无法调用接口！");
        return;
      }
      
      this.loadCategoryList().then(() => {
        this.loadCategoryGoodsUntilMinCount(10);
      });
    },

    /**
     * 打印货架相关接口返回的结构（顶层 keys、首条 goodsList 行、完整 JSON）
     */
    _logShelfApiStructure(tag, payload) {
      try {
        if (payload == null || payload === undefined) {
          console.log('[total/goods API]', tag, 'data 为空');
          return;
        }
        if (typeof payload !== 'object') {
          console.log('[total/goods API]', tag, '非对象:', payload);
          return;
        }
        console.log('[total/goods API]', tag, '顶层 keys:', Object.keys(payload));
        if (Array.isArray(payload.shelfList)) {
          console.log('[total/goods API]', tag, 'shelfList.length=', payload.shelfList.length);
          const s0 = payload.shelfList[0];
          if (s0 && typeof s0 === 'object') {
            console.log('[total/goods API]', tag, 'shelfList[0] keys:', Object.keys(s0));
          }
        }
        if (Array.isArray(payload.goodsList)) {
          console.log('[total/goods API]', tag, 'goodsList.length=', payload.goodsList.length);
          const r0 = payload.goodsList[0];
          if (r0 && typeof r0 === 'object') {
            console.log('[total/goods API]', tag, 'goodsList[0] keys:', Object.keys(r0));
            if (r0.goods && typeof r0.goods === 'object') {
              console.log('[total/goods API]', tag, 'goodsList[0].goods keys:', Object.keys(r0.goods));
            }
            if (Array.isArray(r0.sameShelfGoods) && r0.sameShelfGoods[0]) {
              console.log('[total/goods API]', tag, 'goodsList[0].sameShelfGoods[0] keys:', Object.keys(r0.sameShelfGoods[0]));
            }
          }
        }
        const json = JSON.stringify(payload, null, 2);
        if (json.length > 80000) {
          console.log('[total/goods API]', tag, '完整JSON(截断前4万字符):\n', json.slice(0, 40000), '\n...(已截断，总长', json.length, ')');
        } else {
          console.log('[total/goods API]', tag, '完整JSON:\n', json);
        }
      } catch (e) {
        console.warn('[total/goods API]', tag, '打印结构失败', e);
      }
    },

    // 加载货架列表（仅基本信息）
    loadShelfList() {
      var that = this;
      load.showLoading("获取货架数据");
      
      // 注意：nxDepIds 和 gbDepIds 需要转换为 String 类型
      const nxDepIdsStr = (this.data.outNxDepIds && this.data.outNxDepIds.length > 0) 
        ? this.data.outNxDepIds.join(',') 
        : "0";
      const gbDepIdsStr = (this.data.outGbDepIds && this.data.outGbDepIds.length > 0) 
        ? this.data.outGbDepIds.join(',') 
        : "0";
      
      console.log("调用接口 stockerGetShelfListWithDepIds，参数:", {
        nxDepIds: nxDepIdsStr,
        gbDepIds: gbDepIdsStr,
        nxDisId: this.data.disId
      });
      
      return stockerGetShelfListWithDepIds({
        nxDepIds: nxDepIdsStr,
        gbDepIds: gbDepIdsStr,
        nxDisId: this.data.disId
      }).then(res => {
        load.hideLoading();
        console.log("========= 货架列表接口返回结果 =========");
        console.log("res.result.code:", res.result.code);
        console.log("res.result.msg:", res.result.msg);
        console.log("yuanshidata", res.result.data);
        
        if (res.result.code == 0) {
          this._logShelfApiStructure('stockerGetShelfListWithDepIds res.result.data', res.result.data);
          const shelfList = (res.result.data.shelfList || []).map(shelf => ({
            ...shelf,
            nxDisGoodsShelfGoodsEntities: [],
            loaded: false,        // 标记商品是否已加载
            isEmpty: false       // 标记是否为空货架
          }));
          
          // 检查 shelfList 中是否已经存在"非货架"项（nxDistributerGoodsShelfId === 0）
          const hasUnshelfShelf = shelfList.some(shelf => shelf.nxDistributerGoodsShelfId === 0);
          
          // 如果不存在"非货架"项，检查是否有非货架订单数量字段
          // 可能字段名：unshelfOrderCount, noShelfOrderCount, unshelfGoodsCount 等
          if (!hasUnshelfShelf) {
            const unshelfOrderCount = res.result.data.unshelfOrderCount || 
                                     res.result.data.noShelfOrderCount || 
                                     res.result.data.unshelfGoodsCount || 
                                     0;
            
            console.log("非货架订单数量:", unshelfOrderCount);
            
            // 如果非货架订单数量 > 0，创建"非货架"项并追加到列表后面
            if (unshelfOrderCount > 0) {
              const unshelfShelf = {
                nxDistributerGoodsShelfId: 0,        // 货架ID设为 0（表示非货架）
                nxDistributerGoodsShelfName: "非货架", // 货架名称设为"非货架"
                newOrderCount: unshelfOrderCount,     // 订单数量设为查询到的非货架订单数量
                goodsCount: unshelfOrderCount,        // 商品数量
                hasGoods: true,                       // 有商品
                sortOrder: 9999,                      // 排序值设为 9999（确保在最后）
                nxDisGoodsShelfGoodsEntities: [],
                loaded: false,                        // 标记商品是否已加载
                isEmpty: false                        // 标记是否为空货架
              };
              
              shelfList.push(unshelfShelf);
              console.log("已添加'非货架'项到货架列表，订单数量:", unshelfOrderCount);
            }
          } else {
            console.log("后台接口已返回'非货架'项，无需重复创建");
          }
          
          console.log("货架数量:", shelfList.length);
          console.log("货架列表:", shelfList);
          
          // 打印 shelfArr 的完整内容（JSON格式，便于复制）
          console.log("========= shelfArr 完整内容（JSON格式）=========");
          console.log(JSON.stringify(shelfList, null, 2));
          console.log("================================================");
          console.log("Reeeee", res.result.data);
          this.setData({    
            shelfArr: shelfList,
            
          });
          
          // 更新tabBar计数
          this.getTabBar().setData({
            stockCount: res.result.data.stockCount,
            depCount: res.result.data.depCount,
          });
          
          if (shelfList.length === 0) {
            console.warn("警告：没有货架数据返回！");
            wx.showToast({
              title: '暂无待出库的货架',
              icon: 'none'
            });
          }
        } else {
          console.error("接口返回错误:", res.result);
          this.setData({
            shelfArr: []
          });
          wx.showToast({
            title: res.result.msg || '获取数据失败',
            icon: 'none'
          });
        }
      })
    },
    
    // 智能加载商品，直到达到最小数量
    loadGoodsUntilMinCount(minCount = 10) {
      let currentGoodsCount = this.countTotalGoods();
      let shelfIndex = 0;
      
      // 找到第一个未加载且未在加载中的货架
      while (shelfIndex < this.data.shelfArr.length && 
             (this.data.shelfArr[shelfIndex].loaded || this.data.shelfArr[shelfIndex].loading)) {
        shelfIndex++;
      }
      
      // 如果商品数还不够，继续加载
      if (currentGoodsCount < minCount && shelfIndex < this.data.shelfArr.length) {
        const shelf = this.data.shelfArr[shelfIndex];
        
        console.log(`智能加载：当前商品数=${currentGoodsCount}，需要=${minCount}，加载货架[${shelfIndex}]：${shelf.nxDistributerGoodsShelfName}`);
        
        // 加载这个货架的商品
        return this.loadShelfGoodsDetail(shelf.nxDistributerGoodsShelfId, shelfIndex)
          .then(() => {
            // 重新计算商品数
            const newCount = this.countTotalGoods();
            console.log(`加载完成，当前商品数=${newCount}`);
            
            // 如果还不够，继续加载下一个货架
            if (newCount < minCount) {
              return this.loadGoodsUntilMinCount(minCount);
            } else {
              // 加载完成，更新UI（延迟执行，避免频繁调用）
              console.log("智能加载完成，商品数已满足要求");
              setTimeout(() => {
                this.calcShelfOffsetTops();
              }, 200);
            }
          })
          .catch(err => {
            console.error(`加载货架[${shelfIndex}]失败，跳过:`, err);
            // 加载失败时，标记为已加载（避免重复尝试），然后继续加载下一个
            const shelfArr = this.data.shelfArr;
            if (shelfIndex < shelfArr.length) {
              shelfArr[shelfIndex].loaded = true;
              shelfArr[shelfIndex].loading = false;
              shelfArr[shelfIndex].isEmpty = true;  // 标记为空，避免重复尝试
              this.setData({ shelfArr: shelfArr });
            }
            // 继续加载下一个货架
            if (shelfIndex + 1 < this.data.shelfArr.length) {
              this.loadGoodsUntilMinCount(minCount);
            } else {
              this.calcShelfOffsetTops();
            }
          });
      } else {
        // 已经满足条件或没有更多货架
        if (shelfIndex >= this.data.shelfArr.length) {
          console.log("智能加载结束：所有货架都已加载或正在加载中");
        } else {
          console.log("智能加载结束：商品数已满足要求");
        }
        this.calcShelfOffsetTops();
      }
    },

    // 加载单个货架的商品详情
    loadShelfGoodsDetail(shelfId, shelfIndex, forceRefresh = false) {
      var that = this;
      
      // 检查货架是否已经加载或正在加载
      const shelfArr = this.data.shelfArr;
      if (shelfIndex >= shelfArr.length) {
        console.warn(`货架索引[${shelfIndex}]超出范围`);
        return Promise.reject(new Error('货架索引超出范围'));
      }
      
      const shelf = shelfArr[shelfIndex];
      
      // 如果不是强制刷新，且已经加载，则跳过
      if (!forceRefresh && shelf.loaded) {
        console.log(`货架[${shelfIndex}]已加载，跳过`);
        return Promise.resolve();
      }
      
      // 标记为正在加载，防止重复请求
      if (shelf.loading) {
        console.log(`货架[${shelfIndex}]正在加载中，跳过`);
        return Promise.resolve();
      }
      
      // 如果是强制刷新，清除已加载标记
      if (forceRefresh) {
        shelf.loaded = false;
        console.log(`货架[${shelfIndex}]强制刷新，重新加载`);
      }
      
      shelf.loading = true;
      shelfArr[shelfIndex] = shelf;
      this.setData({ shelfArr: shelfArr });
      
      // 注意：nxDepIds 和 gbDepIds 需要转换为 String 类型
      const nxDepIdsStr = (this.data.outNxDepIds && this.data.outNxDepIds.length > 0) 
        ? this.data.outNxDepIds.join(',') 
        : "-1";
      const gbDepIdsStr = (this.data.outGbDepIds && this.data.outGbDepIds.length > 0) 
        ? this.data.outGbDepIds.join(',') 
        : "-1";
      
      console.log(`加载货架商品详情：shelfId=${shelfId}, shelfIndex=${shelfIndex}, 是否为非货架: ${shelfId === 0}`);
      
      return stockerGetShelfGoodsDetail({
        shelfId: shelfId,
        nxDepIds: nxDepIdsStr,
        gbDepIds: gbDepIdsStr,
        nxDisId: this.data.disId
      }).then(res => {
        console.log(`货架[${shelfIndex}]接口返回:`, res);
        console.log(`货架[${shelfIndex}]接口返回 code:`, res.result.code, 'msg:', res.result.msg);
        
        if (res.result.code == 0) {
          // 检查返回数据结构
          if (!res.result.data) {
            console.error(`货架[${shelfIndex}]返回数据为空`);
            throw new Error('返回数据为空');
          }
          
          // 接口返回的新数据结构
          const newShelfData = res.result.data;
          this._logShelfApiStructure(`stockerGetShelfGoodsDetail shelfIndex=${shelfIndex} shelfId=${shelfId}`, newShelfData);
          
          // 将新数据结构转换为前端期望的旧格式
          const convertedShelf = this.convertShelfDataToOldFormat(newShelfData);
          
          if (!convertedShelf) {
            console.error(`货架[${shelfIndex}]数据转换失败，原始数据:`, newShelfData);
            console.error(`货架[${shelfIndex}]数据转换失败原因: goodsList不存在或为空`);
            throw new Error('数据转换失败');
          }
          
          console.log(`货架[${shelfIndex}]数据转换成功，商品数量:`, convertedShelf.nxDisGoodsShelfGoodsEntities ? convertedShelf.nxDisGoodsShelfGoodsEntities.length : 0);
          
          // 更新对应货架的商品数据
          // 保留原有的 newOrderCount 和 hasGoods 字段（从接口1获取的）
          const originalShelf = shelfArr[shelfIndex];
          shelfArr[shelfIndex] = {
            ...originalShelf,  // 先保留原有字段（包括 newOrderCount, hasGoods）
            ...convertedShelf,   // 然后覆盖转换后的字段
            loaded: true,
            loading: false,  // 清除加载中标记
            isEmpty: !convertedShelf.nxDisGoodsShelfGoodsEntities || 
                     convertedShelf.nxDisGoodsShelfGoodsEntities.length === 0,
            // 确保保留原有的 newOrderCount 和 hasGoods（如果接口2没有返回）
            newOrderCount: originalShelf.newOrderCount !== undefined ? originalShelf.newOrderCount : 
                       (convertedShelf.nxDisGoodsShelfGoodsEntities ? convertedShelf.nxDisGoodsShelfGoodsEntities.length : 0),
            hasGoods: originalShelf.hasGoods !== undefined ? originalShelf.hasGoods : true
          };
          
          const newOrderCount = convertedShelf.nxDisGoodsShelfGoodsEntities ? convertedShelf.nxDisGoodsShelfGoodsEntities.length : 0;
          console.log(`货架[${shelfIndex}]加载完成，商品数=${newOrderCount}，保留goodsCount=${shelfArr[shelfIndex].newOrderCount}`);
          
          // 使用路径更新，只更新单个货架，避免更新整个数组
          // 这样可以大幅减少 setData 的数据量
          const updatePath = `shelfArr[${shelfIndex}]`;
          this.setData({
            [updatePath]: shelfArr[shelfIndex]
          }, () => {
            // 数据更新后，延迟重新计算 offsetTop，确保位置信息准确
            // 注意：不在这里自动计算，避免触发左侧菜单滚动
            // 位置计算由其他需要的地方主动调用
            // setTimeout(() => {
            //   this.calcShelfOffsetTops();
            // }, 200);
          });
          
          // 打印当前 shelfArr 的完整内容（JSON格式，便于复制）
          console.log("========= shelfArr 完整内容（JSON格式）=========");
          console.log(JSON.stringify(shelfArr, null, 2));
          console.log("================================================");
        } else {
          // 加载失败，清除加载中标记
          shelfArr[shelfIndex].loading = false;
          this.setData({ shelfArr: shelfArr });
          console.error(`加载货架[${shelfIndex}]失败:`, res.result.msg);
          throw new Error(res.result.msg || '加载失败');
        }
      }).catch(err => {
        // 加载失败，清除加载中标记
        if (shelfIndex < shelfArr.length) {
          shelfArr[shelfIndex].loading = false;
          this.setData({ shelfArr: shelfArr });
        }
        // 加载失败，重置状态
        if (shelfIndex < shelfArr.length) {
          shelfArr[shelfIndex].loading = false;
          shelfArr[shelfIndex].loaded = true;  // 标记为已加载，避免重复尝试
          shelfArr[shelfIndex].isEmpty = true; // 标记为空货架
          this.setData({ shelfArr: shelfArr });
        }
        console.error(`加载货架[${shelfIndex}]异常，已标记为已加载:`, err);
        console.error(`加载货架[${shelfIndex}]异常详情:`, err.message, err.stack);
        
        // 特殊处理：如果是非货架（shelfId=0）且是后端 TooManyResultsException 错误
        if (shelfId === 0) {
          console.error(`[非货架] 加载失败，可能是后端接口问题：当 shelfId=0 时，后端使用了 selectOne() 但返回了多条记录`);
          wx.showToast({
            title: '非货架商品加载失败，请联系技术支持',
            icon: 'none',
            duration: 3000
          });
        }
        
        throw err;
      });
    },

    // 计算当前已加载的商品总数
    countTotalGoods() {
      return this.data.shelfArr.reduce((total, shelf) => {
        if (shelf.loaded && shelf.nxDisGoodsShelfGoodsEntities) {
          return total + shelf.nxDisGoodsShelfGoodsEntities.length;
        }
        return total;
      }, 0);
    },

    _getShelfIdToSortMap() {
      const map = {};
      (this.data.shelfArr || []).forEach((s) => {
        const id = s.nxDistributerGoodsShelfId;
        if (id == null) return;
        const sort = s.nxDistributerGoodsShelfSort;
        if (sort != null && sort !== '') {
          map[id] = sort;
        }
      });
      return map;
    },

    _normalizeSameShelfGoodsList(sameList, currentShelfId, currentShelfSort) {
      const sortMap = this._getShelfIdToSortMap();
      return (sameList || []).map((item) => {
        const sid = item.nxDgsgShelfId;
        const nxDgsgShelfSort =
          item.nxDgsgShelfSort ??
          item.nxDistributerGoodsShelfSort ??
          (sid != null ? sortMap[sid] : undefined) ??
          (sid === currentShelfId ? currentShelfSort : null);
        return {
          ...item,
          nxDgsgShelfSort
        };
      });
    },

    // 将新的扁平化数据结构转换为前端期望的格式（兼容旧代码）
    convertShelfDataToOldFormat(newShelfData) {
      if (!newShelfData) {
        console.warn('convertShelfDataToOldFormat: newShelfData 为空');
        return null;
      }
      if (!newShelfData.goodsList) {
        console.warn('convertShelfDataToOldFormat: goodsList 不存在或为空', newShelfData);
        return null;
      }

      const shelfLevelSort = newShelfData.nxDistributerGoodsShelfSort
      const currentShelfId = newShelfData.nxDistributerGoodsShelfId

      // 转换商品列表：goodsList -> nxDisGoodsShelfGoodsEntities（透传行上其余字段，避免排序/层标记等被丢）
      const nxDisGoodsShelfGoodsEntities = (newShelfData.goodsList || []).map((shelfGoods) => {
        const {
          goods,
          sameShelfGoods: rawSame = [],
          nxDisGoodsShelfStockEntities: stockEntities,
          ...restRow
        } = shelfGoods;
        const g = goods || {};
        const orders = Array.isArray(g.orders) ? g.orders : [];
        const rawStock =
          stockEntities ??
          shelfGoods.stockList ??
          g.nxDisGoodsShelfStockEntities ??
          g.stockList;
        const stockList = Array.isArray(rawStock) ? rawStock : rawStock ? [rawStock] : [];

        return {
          ...restRow,
          nxDgsgShelfLayerSeq: shelfGoods.nxDgsgShelfLayerSeq,
          nxDgsgShelfSort:
            shelfGoods.nxDgsgShelfSort ?? shelfGoods.nxDistributerGoodsShelfSort ?? shelfLevelSort,
          nxDisGoodsShelfStockEntities: stockList,
          sameShelfGoods: this._normalizeSameShelfGoodsList(
            rawSame,
            currentShelfId,
            shelfLevelSort
          ),
          nxDistributerGoodsEntity: {
            nxDistributerGoodsId: g.nxDistributerGoodsId,
            nxDgGoodsName: g.nxDgGoodsName,
            nxDgGoodsStandardname: g.nxDgGoodsStandardname,
            nxDgGoodsStandardWeight: g.nxDgGoodsStandardWeight,
            nxDgCartonUnit: g.nxDgCartonUnit,
            nxDgItemsPerCarton: g.nxDgItemsPerCarton,
            nxDgGoodsBrand: g.nxDgGoodsBrand,
            nxDgNxGoodsId: g.nxDgNxGoodsId,
            nxDepartmentOrdersEntities: orders.map((order) => ({
              nxDepartmentOrdersId: order.nxDepartmentOrdersId,
              nxDoQuantity: order.nxDoQuantity,
              nxDoStandard: order.nxDoStandard,
              nxDoWeight: order.nxDoWeight,
              nxDoRemark: order.nxDoRemark,
              nxDoPrintStandard: order.nxDoPrintStandard,
              pickDetail: order.pickDetail,
              nxDoRequestDistributerName: order.nxDoRequestDistributerName,
              nxDoRequestDistributerName: order.nxDoRequestDistributerName,
              nxDoRequestDisId: order.nxDoRequestDisId,
              nxDoDistributerId: order.nxDoDistributerId,
              nxDepartmentEntity: this.parseDepName(order.depName),
              gbDepartmentEntity: this.parseGbDepName(order.gbDepName),
            
              nxDepartmentDisGoodsEntity: order.pickDetail ? {
                nxDdgPickDetail: order.pickDetail
              } : null
            }))
          }
        };
      });

      const rawList = newShelfData.goodsList || [];
      if (rawList.length > 0) {
        const g0 = rawList[0].goods || {};
        const withItemsPerCarton = rawList.filter((row) => {
          const g = row.goods;
          return g && g.nxDgItemsPerCarton != null && g.nxDgItemsPerCarton !== '';
        }).length;
        const row0 = rawList[0] || {};
        console.log(
          '[total/goods convertShelfDataToOldFormat]',
          'shelf=', newShelfData.nxDistributerGoodsShelfName,
          'id=', newShelfData.nxDistributerGoodsShelfId,
          'rows=', rawList.length,
          'rowsWithNxDgItemsPerCarton=', withItemsPerCarton,
          'shelfLevel nxDistributerGoodsShelfSort=', shelfLevelSort,
          'sample[0] row keys=', Object.keys(row0),
          'sample[0] nxDgsgShelfSort=', row0.nxDgsgShelfSort,
          'sample[0].goods keys=', Object.keys(g0),
          'sample nxDgItemsPerCarton=', g0.nxDgItemsPerCarton,
          'sample nxDgCartonUnit=', g0.nxDgCartonUnit
        );
        const rowWithCarton = rawList.find((row) => {
          const g = row.goods;
          return g && g.nxDgItemsPerCarton != null && String(g.nxDgItemsPerCarton).trim() !== '';
        });
        if (rowWithCarton && rowWithCarton.goods) {
          const g = rowWithCarton.goods;
          console.log(
            '[total/goods convertShelfDataToOldFormat] firstRowWithItemsPerCarton',
            'name=', g.nxDgGoodsName,
            'nxDgItemsPerCarton=', g.nxDgItemsPerCarton,
            'nxDgCartonUnit=', g.nxDgCartonUnit
          );
        }
      }
      
      return {
        nxDistributerGoodsShelfId: newShelfData.nxDistributerGoodsShelfId,
        nxDistributerGoodsShelfName: newShelfData.nxDistributerGoodsShelfName,
        nxDistributerGoodsShelfSort: newShelfData.nxDistributerGoodsShelfSort,
        nxDistributerGoodsShelfDisId: newShelfData.nxDistributerGoodsShelfDisId,
        nxDisGoodsShelfGoodsEntities: nxDisGoodsShelfGoodsEntities
      };
    },

    // 解析部门名称字符串为嵌套对象
    parseDepName(depName) {
      if (!depName) return null;
      
      const parts = depName.split('.');
      if (parts.length > 1) {
        return {
          nxDepartmentName: parts[parts.length - 1],
          nxDepartmentAttrName: parts[parts.length - 1], // 同时设置 AttrName 以兼容 WXML
          fatherDepartmentEntity: {
            nxDepartmentName: parts[0],
            nxDepartmentAttrName: parts[0] // 同时设置 AttrName 以兼容 WXML
          }
        };
      } else {
        return {
          nxDepartmentName: depName,
          nxDepartmentAttrName: depName, // 同时设置 AttrName 以兼容 WXML
          fatherDepartmentEntity: null
        };
      }
    },

    // 解析GB部门名称字符串为嵌套对象
    parseGbDepName(gbDepName) {
      if (!gbDepName) return null;
      
      const parts = gbDepName.split('.');
      if (parts.length > 1) {
        return {
          gbDepartmentName: parts[parts.length - 1],
          fatherGbDepartmentEntity: {
            gbDepartmentName: parts[0],
            gbDepartmentSubAmount: parts.length > 1 ? 2 : 1  // 如果有父部门，设置子部门数量
          }
        };
      } else {
        return {
          gbDepartmentName: gbDepName,
          fatherGbDepartmentEntity: null
        };
      }
    },

    // ========== 分类商品分页加载方法 ==========
    
    // 加载分类列表（仅基本信息）
    loadCategoryList() {
      var that = this;
      load.showLoading("获取分类数据");
      
      // 注意：nxDepIds 和 gbDepIds 需要转换为 String 类型
      const nxDepIdsStr = (this.data.outNxDepIds && this.data.outNxDepIds.length > 0) 
        ? this.data.outNxDepIds.join(',') 
        : "0";
      const gbDepIdsStr = (this.data.outGbDepIds && this.data.outGbDepIds.length > 0) 
        ? this.data.outGbDepIds.join(',') 
        : "0";
      
      console.log("调用接口 stockerGetCategoryListWithDepIds，参数:", {
        nxDepIds: nxDepIdsStr,
        gbDepIds: gbDepIdsStr,
        nxDisId: this.data.disId
      });
      
      return stockerGetCategoryListWithDepIds({
        nxDepIds: nxDepIdsStr,
        gbDepIds: gbDepIdsStr,
        nxDisId: this.data.disId,
        supplierId: this.data.supplierId

      }).then(res => {
        load.hideLoading();
        console.log("========= 分类列表接口返回结果 =========");
        console.log("res.result.code:", res.result.code);
        console.log("res.result.msg:", res.result.msg);
        
        if (res.result.code == 0) {
          const categoryList = (res.result.data.categoryList || []).map(category => ({
            ...category,
            nxDistributerGoodsEntities: [],  // 商品列表初始为空
            loaded: false,        // 标记商品是否已加载
            loading: false,       // 标记是否正在加载
            isEmpty: false       // 标记是否为空分类
          }));
          
          console.log("分类数量:", categoryList.length);
          console.log("分类列表aaa:", res.result.data);
          
          this.setData({    
            grandList: categoryList,  // 保持字段名兼容
            // waitDepNx: res.result.data.waitDepNx || [],
            // waitDepGb: res.result.data.waitDepGb || [],
            // depOrdersWait: res.result.data.depOrdersWait || 0,
            selectedSub: 0,  // 初始化选中第一个分类
          });
          
          // 更新tabBar计数
          this.getTabBar().setData({
            stockCount: res.result.data.stockCount || 0,
            depCount: res.result.data.depCount || 0,
          });

          if (categoryList.length === 0) {
            console.warn("警告：没有分类数据返回！");
            wx.showToast({
              title: '暂无待出库的分类',
              icon: 'none'
            });
          }
        } else {
          console.error("接口返回错误:", res.result);
          this.setData({
            grandList: []
          });
          wx.showToast({
            title: res.result.msg || '获取数据失败',
            icon: 'none'
          });
        }
      }).catch(err => {
        load.hideLoading();
        console.error('========= 获取分类列表失败 =========');
        console.error('错误详情:', err);
        wx.showToast({
          title: '获取分类数据失败',
          icon: 'none'
        });
      });
    },

    // 智能加载分类商品，直到达到最小数量
    loadCategoryGoodsUntilMinCount(minCount = 10) {
      let currentGoodsCount = this.countCategoryTotalGoods();
      let categoryIndex = 0;
      
      // 找到第一个未加载且未在加载中的分类
      while (categoryIndex < this.data.grandList.length && 
             (this.data.grandList[categoryIndex].loaded || this.data.grandList[categoryIndex].loading)) {
        categoryIndex++;
      }
      
      // 如果商品数还不够，继续加载
      if (currentGoodsCount < minCount && categoryIndex < this.data.grandList.length) {
        const category = this.data.grandList[categoryIndex];
        
        console.log(`智能加载分类商品：当前商品数=${currentGoodsCount}，需要=${minCount}，加载分类[${categoryIndex}]：${category.nxDfgFatherGoodsName}`);
        
        // 加载这个分类的商品
        return this.loadCategoryGoodsDetail(category.nxDistributerFatherGoodsId, categoryIndex)
          .then(() => {
            // 重新计算商品数
            const newCount = this.countCategoryTotalGoods();
            console.log(`加载完成，当前商品数=${newCount}`);
            
            // 如果还不够，继续加载下一个分类
            if (newCount < minCount) {
              return this.loadCategoryGoodsUntilMinCount(minCount);
            } else {
              // 加载完成，更新UI（延迟执行，避免频繁调用）
              console.log("智能加载完成，商品数已满足要求");
              setTimeout(() => {
                this.calcCategoryOffsetTops();
                // 确保第一个分类被选中
                if (this.data.selectedSub === undefined || this.data.selectedSub === null) {
                  console.log('[loadCategoryGoodsUntilMinCount] 🔄 初始化，设置 selectedSub 为 0');
                  this.setData({
                    selectedSub: 0,
                    leftScrollIntoView: 'left-category-0'
                  }, () => {
                    console.log('[loadCategoryGoodsUntilMinCount] ✅ setData 完成，当前 selectedSub:', this.data.selectedSub);
                  });
                }
              }, 200); // 增加延迟，确保 DOM 渲染完成后再计算位置
            }
          })
          .catch(err => {
            console.error(`加载分类[${categoryIndex}]失败，跳过:`, err);
            // 加载失败时，标记为已加载（避免重复尝试），然后继续加载下一个
            const grandList = this.data.grandList;
            if (categoryIndex < grandList.length) {
              grandList[categoryIndex].loaded = true;
              grandList[categoryIndex].loading = false;
              grandList[categoryIndex].isEmpty = true;  // 标记为空，避免重复尝试
              this.setData({ grandList: grandList });
            }
            // 继续加载下一个分类
            if (categoryIndex + 1 < this.data.grandList.length) {
              this.loadCategoryGoodsUntilMinCount(minCount);
            } else {
              this.calcCategoryOffsetTops();
            }
          });
            } else {
              // 已经满足条件或没有更多分类
        if (categoryIndex >= this.data.grandList.length) {
          console.log("智能加载结束：所有分类都已加载或正在加载中");
        } else {
          console.log("智能加载结束：商品数已满足要求");
        }
              this.calcCategoryOffsetTops();
            }
    },

    // 加载单个分类的商品详情
    loadCategoryGoodsDetail(categoryId, categoryIndex, forceRefresh = false) {
      var that = this;
      
      // 检查分类是否已经加载或正在加载
      const grandList = this.data.grandList;
      if (categoryIndex >= grandList.length) {
        console.warn(`分类索引[${categoryIndex}]超出范围`);
        return Promise.reject(new Error('分类索引超出范围'));
      }
      
      const category = grandList[categoryIndex];
      
      // 如果不是强制刷新，且已经加载，则跳过
      if (!forceRefresh && category.loaded) {
        console.log(`分类[${categoryIndex}]已加载，跳过`);
        return Promise.resolve();
      }
      
      // 标记为正在加载，防止重复请求
      if (category.loading) {
        console.log(`分类[${categoryIndex}]正在加载中，跳过`);
        return Promise.resolve();
      }
      
      // 如果是强制刷新，清除已加载标记
      if (forceRefresh) {
        category.loaded = false;
        console.log(`分类[${categoryIndex}]强制刷新，重新加载`);
      }
      
      category.loading = true;
      grandList[categoryIndex] = category;
      this.setData({ grandList: grandList });
      
      // 注意：nxDepIds 和 gbDepIds 需要转换为 String 类型
      const nxDepIdsStr = (this.data.outNxDepIds && this.data.outNxDepIds.length > 0) 
        ? this.data.outNxDepIds.join(',') 
        : "0";
      const gbDepIdsStr = (this.data.outGbDepIds && this.data.outGbDepIds.length > 0) 
        ? this.data.outGbDepIds.join(',') 
        : "0";
      
      console.log(`加载分类商品详情：categoryId=${categoryId}, categoryIndex=${categoryIndex}`);
      
      return stockerGetCategoryGoodsDetail({
        categoryId: categoryId,
        nxDepIds: nxDepIdsStr,
        gbDepIds: gbDepIdsStr,
        nxDisId: this.data.disId,
        supplierId: this.data.supplierId,
      }).then(res => {
        console.log(`分类[${categoryIndex}]接口返回:`, res);
        
        if (res.result.code == 0) {
          // 检查返回数据结构
          if (!res.result.data) {
            console.error(`分类[${categoryIndex}]返回数据为空`);
            throw new Error('返回数据为空');
          }
          
          // 接口返回的新数据结构（和货架商品接口一致，直接是 data，不包含 category 包装）
          const newCategoryData = res.result.data;
          
          // 将新数据结构转换为前端期望的旧格式（兼容现有 WXML 模板）
          const convertedCategory = this.convertCategoryDataToOldFormat(newCategoryData);
          
          if (!convertedCategory) {
            console.error(`分类[${categoryIndex}]数据转换失败`);
            throw new Error('数据转换失败');
          }
          
          // 更新对应分类的商品数据
          // 保留原有的 newOrderCount 和 hasGoods 字段（从接口1获取的）
          const originalCategory = grandList[categoryIndex];
          grandList[categoryIndex] = {
            ...convertedCategory,
            newOrderCount: originalCategory.newOrderCount,  // 保留商品数量
            hasGoods: originalCategory.hasGoods,      // 保留是否有商品标记
            loaded: true,
            loading: false,
            isEmpty: !convertedCategory.nxDistributerGoodsEntities || 
                     convertedCategory.nxDistributerGoodsEntities.length === 0
          };
          
          console.log(`分类[${categoryIndex}]加载完成，商品数=${convertedCategory.nxDistributerGoodsEntities ? convertedCategory.nxDistributerGoodsEntities.length : 0}，保留goodsCount=${originalCategory.newOrderCount}`);
          
          this.setData({
            grandList: grandList
          }, () => {
            // 数据更新后，延迟重新计算 offsetTop，确保位置信息准确
            // 注意：不在这里自动计算，避免触发左侧菜单滚动
            // 位置计算由其他需要的地方主动调用
            // setTimeout(() => {
            //   this.calcCategoryOffsetTops();
            // }, 200);
          });
        } else {
          throw new Error(res.result.msg || '接口返回错误');
        }
      }).catch(err => {
        // 加载失败，重置状态
        if (categoryIndex < grandList.length) {
        grandList[categoryIndex].loading = false;
          grandList[categoryIndex].loaded = true;  // 标记为已加载，避免重复尝试
          grandList[categoryIndex].isEmpty = true; // 标记为空分类
        this.setData({ grandList: grandList });
        }
        console.error(`分类[${categoryIndex}]加载异常，已标记为已加载:`, err);
        throw err;
      });
    },

    // 计算当前已加载的分类商品总数
    countCategoryTotalGoods() {
      return this.data.grandList.reduce((total, category) => {
        if (category.loaded && category.nxDistributerGoodsEntities) {
          return total + category.nxDistributerGoodsEntities.length;
        }
        return total;
      }, 0);
    },

    // 将新的扁平化数据结构转换为前端期望的格式（兼容旧代码）
    convertCategoryDataToOldFormat(newCategoryData) {
      if (!newCategoryData || !newCategoryData.goodsList) {
        return null;
      }
      
      // 转换商品列表：goodsList -> nxDistributerGoodsEntities
      const nxDistributerGoodsEntities = (newCategoryData.goodsList || []).map(goods => ({
        nxDistributerGoodsId: goods.nxDistributerGoodsId,
        nxDgGoodsName: goods.nxDgGoodsName,
        nxDgGoodsStandardname: goods.nxDgGoodsStandardname,
        nxDgGoodsStandardWeight: goods.nxDgGoodsStandardWeight,
        nxDgCartonUnit: goods.nxDgCartonUnit,
        nxDgGoodsBrand: goods.nxDgGoodsBrand,
        // 转换订单信息：orders -> nxDepartmentOrdersEntities
        nxDepartmentOrdersEntities: (goods.orders || []).map(order => ({
          nxDepartmentOrdersId: order.nxDepartmentOrdersId,
          nxDoQuantity: order.nxDoQuantity,
          nxDoStandard: order.nxDoStandard,
          nxDoWeight: order.nxDoWeight,
          nxDoRemark: order.nxDoRemark,
          nxDoPrintStandard: order.nxDoPrintStandard,
          pickDetail: order.pickDetail,
          nxDoRequestDistributerName: order.nxDoRequestDistributerName,
          nxDoRequestDisId: order.nxDoRequestDisId,
          nxDoDistributerId: order.nxDoDistributerId,
          // 将扁平化字符串转换为嵌套对象
          nxDepartmentEntity: this.parseDepName(order.depName),
          gbDepartmentEntity: this.parseGbDepName(order.gbDepName),
          nxDepartmentDisGoodsEntity: order.pickDetail ? {
            nxDdgPickDetail: order.pickDetail
          } : null
        }))
      }));
      
      return {
        nxDistributerFatherGoodsId: newCategoryData.nxDistributerFatherGoodsId,
        nxDfgFatherGoodsName: newCategoryData.nxDfgFatherGoodsName,
        nxDfgFatherGoodsSort: newCategoryData.nxDfgFatherGoodsSort,
        nxDfgFatherGoodsColor: newCategoryData.nxDfgFatherGoodsColor,
        nxDistributerGoodsEntities: nxDistributerGoodsEntities
      };
    },
   
    /**
     * 获取右边每个分类的头部偏移量
     */
    lisenerScroll() {
      // 判断分类数组是否为空
      if (!this.data.grandList || this.data.grandList.length === 0) {
        console.log("分类数组为空，跳过 lisenerScroll");
        return;
      }
      
      // 只查询已加载的分类位置，减少查询数量
      const loadedCategories = this.data.grandList.filter((category, index) => category.loaded);
      
      if (loadedCategories.length === 0) {
        return;
      }
      
      // 获取各分类容器距离顶部的距离（只查询已加载的分类）
      new Promise(resolve => {
        let query = wx.createSelectorQuery().in(this);
        // 查询滚动容器的 scrollTop
        query.select('.scroll-content').scrollOffset();
        // 只查询已加载的分类
        loadedCategories.forEach((category, idx) => {
          const originalIndex = this.data.grandList.indexOf(category);
          query.select(`#position${originalIndex}`).boundingClientRect();
        });
        query.exec(function (res) {
          resolve(res);
        });
      }).then(res => {
        if (!res || res.length === 0) return;
        
        // 第一个结果是滚动容器的 scrollTop
        const scrollTop = res[0] ? res[0].scrollTop : 0;
        // 后续结果是各个分类的 boundingClientRect
        const rects = res.slice(1);
        
        // 更新已加载分类的位置信息（使用绝对位置：scrollTop + top）
        let categoryIndex = 0;
        const updateData = {};
        this.data.grandList.forEach((item, index) => {
          if (item.loaded && categoryIndex < rects.length) {
            // 计算绝对位置：滚动位置 + 相对于视口的位置
            const absoluteTop = scrollTop + rects[categoryIndex].top;
            item.offsetTop = absoluteTop;
            // 使用路径更新方式，只更新 offsetTop，减少数据传输量
            updateData[`grandList[${index}].offsetTop`] = absoluteTop;
            categoryIndex++;
          }
        });
        
        // 批量更新，减少 setData 调用
        if (Object.keys(updateData).length > 0) {
          this.setData(updateData);
        }
      });
    },


    
    /**
     * 跳转滚动条位置（分类模式）- 简化版，取消滚动检测性能优化
     */
    toScrollView(e) {
      const { index } = e.currentTarget.dataset;
      const currentSelected = this.data.selectedSub;
      const category = this.data.grandList[index];
      const categoryName = category ? category.nxDfgFatherGoodsName : '未知';
      
      console.log('========= [toScrollView] 点击左侧分类 =========');
      console.log('点击的 index:', index, '分类名称:', categoryName);
      console.log('当前 selectedSub:', currentSelected);
      console.log('当前 clickedLeftMenuIndex:', this.data.clickedLeftMenuIndex);
      
      if (!category) {
        console.log('[toScrollView] ❌ 分类不存在，index:', index);
        return;
      }
      
      // 切换锁住状态：如果点击的是已锁住的菜单，则解除锁住；否则锁住该菜单
      const isCurrentlyLocked = this.data.clickedLeftMenuIndex === index;
      const newLockedIndex = isCurrentlyLocked ? null : index;
      
      console.log('[toScrollView] 🔒 锁住状态切换：当前锁住 index=' + this.data.clickedLeftMenuIndex + 
                  ', 点击 index=' + index + ', 是否已锁住=' + isCurrentlyLocked + 
                  ', 新锁住 index=' + newLockedIndex);
      
      // 设置标志，表示正在点击左侧菜单，暂时禁用滚动检测
      // 同时根据锁住状态设置允许点击右侧商品的权限
      // 立即更新 selectedSub，确保右侧选中状态立即显示
      this.setData({
        isClickingLeftMenu: true,
        clickingTargetIndex: index, // 记录目标 index
        canClickGoods: newLockedIndex !== null, // 只有锁住时才允许点击右侧商品
        clickedLeftMenuIndex: newLockedIndex, // 切换锁住状态
        selectedSub: index // 立即更新 selectedSub，让右侧选中状态立即显示
      });
      
      if (newLockedIndex !== null) {
        console.log('[toScrollView] 🔒 进入工作状态（锁住分类 index=' + index + '）');
      } else {
        console.log('[toScrollView] 🔓 退出工作状态（解除锁住）');
      }
      
        // 如果分类未加载，先加载该分类
      if (!category.loaded) {
        console.log('[toScrollView] ⏳ 分类未加载，开始加载，index:', index);
        this.loadCategoryGoodsDetail(category.nxDistributerFatherGoodsId, index)
          .then(() => {
            // 加载完成后，先等待 DOM 渲染完成，再滚动到对应位置
            const targetView = `position${index}`;
            console.log('[toScrollView] ✅ 加载完成，等待 DOM 渲染后滚动到:', targetView);
            
            // 先更新 selectedSub，让 UI 更新
            this.setData({
              selectedSub: index,
              leftScrollIntoView: `left-category-${index}`
            });
            
            // 等待 DOM 渲染完成（需要等待数据更新和 offsetTop 计算）
            setTimeout(() => {
              // 先计算 offsetTop，确保位置信息准确
              this.calcCategoryOffsetTops();
              
              // 再等待 offsetTop 计算完成，然后滚动
              setTimeout(() => {
                // 先清空 toView，再设置新值，确保 scroll-into-view 能触发滚动
              this.setData({ 
                  toView: '' // 先清空
                }, () => {
                  // 在 setData 完成后，延迟设置 toView，确保能触发滚动
                  setTimeout(() => {
                    this.setData({
                      toView: targetView
                    });
                    console.log('[toScrollView] ✅ 设置 toView:', targetView, '触发右侧滚动');
                  }, 50);
                });
              }, 200); // 等待 offsetTop 计算完成
            }, 100); // 等待 DOM 渲染
            
            // 延迟清空 leftScrollIntoView，避免后续操作触发滚动
            setTimeout(() => {
              this.setData({ 
                leftScrollIntoView: ''
              });
              console.log('[toScrollView] 🧹 清空 leftScrollIntoView，避免后续滚动，当前 selectedSub:', this.data.selectedSub);
            }, 500); // 延迟到 500ms，确保滚动已完成
            
            // 延迟清除标志，确保右侧滚动完成后再允许滚动检测
            // 注意：不立即清除 clickingTargetIndex，保留更长时间，确保滚动检测不会覆盖用户选择
            setTimeout(() => {
              this.setData({ 
                isClickingLeftMenu: false
              });
              console.log('[toScrollView] ✅ 清除 isClickingLeftMenu，恢复滚动检测，但保留 clickingTargetIndex 保护');
            }, 1000); // 1000ms 后恢复滚动检测
            
            // 延迟更长时间后清除 clickingTargetIndex，确保滚动完全稳定
            setTimeout(() => {
              this.setData({
                clickingTargetIndex: null
              });
              console.log('[toScrollView] ✅ 清除 clickingTargetIndex，完全恢复滚动检测');
            }, 2000); // 2000ms 后完全清除保护
          })
          .catch(err => {
            console.error('[toScrollView] ❌ 加载分类失败:', err);
            // 加载失败也要清除标志
            this.setData({
              isClickingLeftMenu: false
            });
          });
        return;
      }
      
      // 分类已加载，先计算 offsetTop，再滚动
      const targetView = `position${index}`;
      console.log('[toScrollView] ✅ 分类已加载，准备滚动到:', targetView);
      
      // selectedSub 已在上面立即更新，这里只需要设置 leftScrollIntoView
      this.setData({
        leftScrollIntoView: `left-category-${index}`
      });
      
      // 先计算 offsetTop，确保位置信息准确
        this.calcCategoryOffsetTops();
      
      // 等待 offsetTop 计算完成，然后滚动
      setTimeout(() => {
        // 先清空 toView，再设置新值，确保 scroll-into-view 能触发滚动
      this.setData({
          toView: '' // 先清空
        }, () => {
          // 在 setData 完成后，延迟设置 toView，确保能触发滚动
          setTimeout(() => {
            this.setData({
              toView: targetView
            });
            console.log('[toScrollView] ✅ 设置 toView:', targetView, '触发右侧滚动');
          }, 50);
        });
      }, 200); // 等待 offsetTop 计算完成
      
      // 延迟清空 leftScrollIntoView，避免后续操作触发滚动
      setTimeout(() => {
        this.setData({ 
          leftScrollIntoView: ''
        });
        console.log('[toScrollView] 🧹 清空 leftScrollIntoView，避免后续滚动，当前 selectedSub:', this.data.selectedSub);
      }, 500); // 延迟到 500ms，确保滚动已完成
      
      // 延迟清除标志，确保右侧滚动完成后再允许滚动检测
      // 注意：不立即清除 clickingTargetIndex，保留更长时间，确保滚动检测不会覆盖用户选择
      setTimeout(() => {
        this.setData({ 
          isClickingLeftMenu: false
        });
        console.log('[toScrollView] ✅ 清除 isClickingLeftMenu，恢复滚动检测，但保留 clickingTargetIndex 保护');
      }, 1000); // 1000ms 后恢复滚动检测
      
      // 延迟更长时间后清除 clickingTargetIndex，确保滚动完全稳定
      setTimeout(() => {
        this.setData({
          clickingTargetIndex: null
        });
        console.log('[toScrollView] ✅ 清除 clickingTargetIndex，完全恢复滚动检测');
      }, 2000); // 2000ms 后完全清除保护
      console.log('==========================================');
    },

    // 获取货架位置信息（按货架模式）
    lisenerScrollShelf() {
      // 判断货架数组是否为空
      if (!this.data.shelfArr || this.data.shelfArr.length === 0) {
        console.log("货架数组为空，跳过 lisenerScrollShelf");
        return;
      }
      
      // 防抖：如果正在获取位置信息，跳过
      if (this.data.isGettingShelfPositions) {
        console.log("正在获取货架位置信息，跳过");
        return;
      }
      
      this.setData({ isGettingShelfPositions: true });
      
      console.log("开始获取货架位置信息，货架数量:", this.data.shelfArr.length);
      
      // 只查询已加载的货架位置，减少查询数量
      const loadedShelves = this.data.shelfArr.filter((shelf, index) => shelf.loaded);
      
      if (loadedShelves.length === 0) {
        this.setData({ isGettingShelfPositions: false });
        return;
      }
      
      new Promise(resolve => {
        let query = wx.createSelectorQuery().in(this);
        // 查询滚动容器的 scrollTop
        query.select('.scroll-content').scrollOffset();
        // 只查询已加载的货架
        loadedShelves.forEach((shelf, idx) => {
          const originalIndex = this.data.shelfArr.indexOf(shelf);
          query.select(`#position${originalIndex}`).boundingClientRect();
        });
        query.exec(function (res) {
          resolve(res);
        });
      }).then(res => {
        if (!res || res.length === 0) {
          this.setData({ isGettingShelfPositions: false });
          return;
        }
        
        // 第一个结果是滚动容器的 scrollTop
        const scrollTop = res[0] ? res[0].scrollTop : 0;
        // 后续结果是各个货架的 boundingClientRect
        const rects = res.slice(1);
        
        console.log("获取到货架位置信息:", rects);
        // 更新已加载货架的位置信息（使用绝对位置：scrollTop + top）
        let shelfIndex = 0;
        this.data.shelfArr.forEach((item, index) => {
          if (item.loaded && shelfIndex < rects.length) {
            // 计算绝对位置：滚动位置 + 相对于视口的位置
            const absoluteTop = scrollTop + rects[shelfIndex].top;
            item.offsetTop = absoluteTop;
            shelfIndex++;
          }
        });
        
        // 只更新位置信息，不更新整个 shelfArr（避免大数据量）
        // 使用路径更新方式更新每个货架的 offsetTop
        const updateData = {
          isGettingShelfPositions: false
        };
        
        // 逐个更新货架的 offsetTop，避免一次性更新整个数组
        let resIndex = 0;
        this.data.shelfArr.forEach((item, index) => {
          if (item.loaded && resIndex < rects.length) {
            const absoluteTop = scrollTop + rects[resIndex].top;
            updateData[`shelfArr[${index}].offsetTop`] = absoluteTop;
            resIndex++;
          }
        });
        
        this.setData(updateData);
      }).catch(err => {
        console.error("获取货架位置信息失败:", err);
        this.setData({ isGettingShelfPositions: false });
      });
    },

    /**
     * 跳转滚动条位置（货架模式）- 简化版，取消滚动检测性能优化
     */
    toScrollViewShelf(e) {
      const { index } = e.currentTarget.dataset;
      const currentSelected = this.data.selectedSub;
      const shelf = this.data.shelfArr[index];
      const shelfName =  shelf.nxDistributerGoodsShelfName ;
      
      console.log('========= [toScrollViewShelf] 点击左侧货架 =========');
      console.log('点击的 index:', index, '货架名称:', shelfName);
      console.log('当前 selectedSub:', currentSelected);
      console.log('准备设置 selectedSub 为:', index);
      
      if (!shelf) {
        console.log('[toScrollViewShelf] ❌ 货架不存在，index:', index);
        return;
      }
      
      // 切换锁住状态：如果点击的是已锁住的菜单，则解除锁住；否则锁住该菜单
      const isCurrentlyLocked = this.data.clickedLeftMenuIndex === index;
      const newLockedIndex = isCurrentlyLocked ? null : index;
      
      console.log('[toScrollViewShelf] 🔒 锁住状态切换：当前锁住 index=' + this.data.clickedLeftMenuIndex + 
                  ', 点击 index=' + index + ', 是否已锁住=' + isCurrentlyLocked + 
                  ', 新锁住 index=' + newLockedIndex);
      
      // 设置标志，表示正在点击左侧菜单，暂时禁用滚动检测
      // 同时根据锁住状态设置允许点击右侧商品的权限
      // 立即更新 selectedSub，确保右侧选中状态立即显示
      this.setData({
        selectedShelfId: e.currentTarget.dataset.id,
        isClickingLeftMenu: true,
        clickingTargetIndex: index, // 记录目标 index（与分类模式保持一致）
        canClickGoods: newLockedIndex !== null, // 只有锁住时才允许点击右侧商品
        clickedLeftMenuIndex: newLockedIndex, // 切换锁住状态
        selectedSub: index // 立即更新 selectedSub，让右侧选中状态立即显示
      });
      
      if (newLockedIndex !== null) {
        console.log('[toScrollViewShelf] 🔒 进入工作状态（锁住货架 index=' + index + '）');
      } else {
        console.log('[toScrollViewShelf] 🔓 退出工作状态（解除锁住）');
      }
      
      // 如果货架未加载，或者已加载但没有商品数据，先加载商品
      const hasNoGoods = !shelf.nxDisGoodsShelfGoodsEntities || shelf.nxDisGoodsShelfGoodsEntities.length === 0;
      const shouldLoad = (!shelf.loaded && !shelf.loading) || (shelf.loaded && hasNoGoods);
      
      if (shouldLoad) {
        console.log('[toScrollViewShelf] ⏳ 货架需要加载，index:', index, 'shelfId:', shelf.nxDistributerGoodsShelfId, '货架名称:', shelfName, 
                    'loaded:', shelf.loaded, 'hasNoGoods:', hasNoGoods);
        this.loadShelfGoodsDetail(shelf.nxDistributerGoodsShelfId, index)
          .then(() => {
            // 加载完成后，滚动到对应位置
            const targetView = `position${index}`;
            console.log('[toScrollViewShelf] ✅ 加载完成，准备滚动到:', targetView);
            
            // 先清空 toView，再设置新值，确保 scroll-into-view 能触发滚动
        this.setData({ 
              selectedSub: index,
              leftScrollIntoView: `left-shelf-${index}`,
              toView: '' // 先清空
            }, () => {
              // 在 setData 完成后，延迟设置 toView，确保能触发滚动
              setTimeout(() => {
                this.setData({
                  toView: targetView
                });
                console.log('[toScrollViewShelf] ✅ 设置 toView:', targetView, '触发右侧滚动');
              }, 50);
            });
            
            // 立即清空 leftScrollIntoView（不等待 setData 完成），避免后续操作触发滚动
            setTimeout(() => {
            this.setData({ 
                leftScrollIntoView: ''
              });
              console.log('[toScrollViewShelf] 🧹 清空 leftScrollIntoView，避免后续滚动，当前 selectedSub:', this.data.selectedSub);
            }, 100); // 延迟到 100ms，确保 toView 已设置
            
            // 延迟清除标志，确保右侧滚动完成后再允许滚动检测
            // 注意：不立即清除 clickingTargetIndex，保留更长时间，确保滚动检测不会覆盖用户选择
            setTimeout(() => {
            this.setData({ 
                isClickingLeftMenu: false
              });
              console.log('[toScrollViewShelf] ✅ 清除 isClickingLeftMenu，恢复滚动检测，但保留 clickingTargetIndex 保护');
            }, 1000); // 1000ms 后恢复滚动检测
            
            // 延迟更长时间后清除 clickingTargetIndex，确保滚动完全稳定
            setTimeout(() => {
              this.setData({
                clickingTargetIndex: null
              });
              console.log('[toScrollViewShelf] ✅ 清除 clickingTargetIndex，完全恢复滚动检测');
            }, 2000); // 2000ms 后完全清除保护
          })
          .catch(err => {
            console.error(`[toScrollViewShelf] ❌ 加载货架[${index}]失败:`, err);
            wx.showToast({
              title: '加载失败',
              icon: 'none'
            });
            // 加载失败也要清除标志
            this.setData({
              isClickingLeftMenu: false,
              clickingTargetIndex: null
            });
          });
        return;
      }
      
      // 如果货架已加载，直接滚动
      const targetView = `position${index}`;
      console.log('[toScrollViewShelf] ✅ 货架已加载，准备滚动到:', targetView);
      
      // selectedSub 已在上面立即更新，这里只需要设置 leftScrollIntoView 和 toView
      // 先清空 toView，再设置新值，确保 scroll-into-view 能触发滚动
      this.setData({ 
        leftScrollIntoView: `left-shelf-${index}`,
        toView: '' // 先清空
      }, () => {
        // 在 setData 完成后，延迟设置 toView，确保能触发滚动
        setTimeout(() => {
          this.setData({
            toView: targetView
          });
          console.log('[toScrollViewShelf] ✅ 设置 toView:', targetView, '触发右侧滚动');
        }, 50);
      });
      
      // 立即清空 leftScrollIntoView（不等待 setData 完成），避免后续操作触发滚动
      setTimeout(() => {
        this.setData({ 
          leftScrollIntoView: ''
        });
        console.log('[toScrollViewShelf] 🧹 清空 leftScrollIntoView，避免后续滚动，当前 selectedSub:', this.data.selectedSub);
      }, 100); // 延迟到 100ms，确保 toView 已设置
      
      // 延迟清除标志，确保右侧滚动完成后再允许滚动检测
      // 注意：不立即清除 clickingTargetIndex，保留更长时间，确保滚动检测不会覆盖用户选择
      setTimeout(() => {
        this.setData({ 
          isClickingLeftMenu: false
        });
        console.log('[toScrollViewShelf] ✅ 清除 isClickingLeftMenu，恢复滚动检测，但保留 clickingTargetIndex 保护');
      }, 1000); // 1000ms 后恢复滚动检测
      
      // 延迟更长时间后清除 clickingTargetIndex，确保滚动完全稳定
      setTimeout(() => {
        this.setData({
          clickingTargetIndex: null
        });
        console.log('[toScrollViewShelf] ✅ 清除 clickingTargetIndex，完全恢复滚动检测');
      }, 2000); // 2000ms 后完全清除保护
      console.log('==========================================');
    },


    

    /**
     * 监听滚动条滚动事件（分类模式）
     */
    scrollTo(e) {
      // 使用节流处理滚动事件
      if (!this._scrollToThrottle) {
        // 优化：将节流时间从 100ms 增加到 150ms，减少滚动事件处理频率，提升性能
        this._scrollToThrottle = throttle(this._handleScrollTo.bind(this), 150);
      }
      this._scrollToThrottle(e);
    },

    /**
     * 处理滚动事件的核心逻辑（分类模式）
     */
    _handleScrollTo(e) {
      const scrollTop = e.detail.scrollTop;
      const { selectedSub, grandList, scrollTriggerThreshold } = this.data;
      
      if (!grandList || grandList.length === 0) {
        return;
      }
      
      // 优化：增大触发阈值，避免因计算误差导致的误判
      // scrollTriggerThreshold 默认 80rpx，转换为 px 后约 40-50px
      const rpxRatio = 750 / getApp().globalData.screenWidth;
      const thresholdPx = scrollTriggerThreshold / rpxRatio;
      
      let newIndex = -1;
      let bestMatch = -1;
      let minDistance = Infinity;
      
      // 改进策略：找到最接近当前滚动位置但不超过的分类
      // 这样可以更准确地定位当前应该选中的分类
      for (let i = 0; i < grandList.length; i++) {
        const category = grandList[i];
        if (!category.loaded || category.offsetTop === undefined) {
          continue;
        }
        
        const distance = scrollTop - category.offsetTop;
        
        // 如果当前滚动位置已经超过这个分类的起始位置
        if (distance >= -thresholdPx) {
          // 记录最接近且不超过的分类
          if (distance >= 0 && distance < minDistance) {
            minDistance = distance;
            bestMatch = i;
          }
          // 如果当前滚动位置在这个分类范围内（考虑阈值）
          if (distance >= -thresholdPx && distance <= thresholdPx * 2) {
            newIndex = i;
            break; // 找到最匹配的，直接退出
          }
        }
      }
      
      // 如果没有找到精确匹配，使用最佳匹配
      if (newIndex === -1 && bestMatch !== -1) {
        newIndex = bestMatch;
      }
      
      // 如果还是没找到，使用原来的逻辑（从后往前找）
      if (newIndex === -1) {
        const triggerLine = scrollTop + thresholdPx;
      for (let i = grandList.length - 1; i >= 0; i--) {
        const category = grandList[i];
          if (category.loaded && category.offsetTop !== undefined && category.offsetTop <= triggerLine) {
            newIndex = i;
          break;
          }
        }
      }
      
      // 如果用户已经点击了左侧菜单（clickedLeftMenuIndex 不为 null），
      // 滚动检测不应该改变 selectedSub，应该保持用户的选择
      // 但是仍然需要检查并加载更多数据
      const shouldSkipSelectedSubUpdate = this.data.clickedLeftMenuIndex !== null;
      
      if (shouldSkipSelectedSubUpdate) {
        console.log('[_handleScrollTo] 🚫 用户已点击左侧菜单 (clickedLeftMenuIndex=' + this.data.clickedLeftMenuIndex + ')，保持用户选择，跳过 selectedSub 更新');
      } else {
        // 如果正在点击左侧菜单，不更新 selectedSub，避免覆盖用户的选择
        if (this.data.isClickingLeftMenu) {
          console.log('[_handleScrollTo] 🚫 正在点击左侧菜单，跳过滚动检测，当前 selectedSub:', selectedSub);
        } else {
          // 如果存在点击的目标 index，只有当 newIndex 等于目标 index 时才允许更新，否则跳过
          const clickingTargetIndex = this.data.clickingTargetIndex;
          if (clickingTargetIndex !== null) {
            if (newIndex === clickingTargetIndex) {
              // 如果 newIndex 等于目标 index，允许更新（用户点击的目标已经滚动到位）
              console.log('[_handleScrollTo] ✅ 滚动到目标位置，允许更新 selectedSub 为:', newIndex);
            } else {
              // 如果 newIndex 不等于目标 index，跳过更新，避免覆盖用户的选择
              console.log('[_handleScrollTo] 🚫 存在点击目标 index:', clickingTargetIndex, '但检测到 newIndex:', newIndex, '跳过更新，避免覆盖用户选择');
              // 即使跳过更新，也要继续加载数据
              this.checkAndLoadMoreCategories();
              return;
            }
          }
          
          // 关键优化：只有当索引真的发生变化时，才 setData
          // 只更新选中状态（高亮），不触发左侧菜单滚动，避免抖动
          if (newIndex !== -1 && newIndex !== selectedSub) {
            const categoryName = grandList[newIndex] ? grandList[newIndex].nxDfgFatherGoodsName : '未知';
            console.log('[_handleScrollTo] 📜 滚动检测：更新 selectedSub，从', selectedSub, '到', newIndex, '分类:', categoryName, '不设置 leftScrollIntoView');
            this.setData({
              selectedSub: newIndex
              // 移除 leftScrollIntoView，避免左侧菜单乱滚动
            }, () => {
              console.log('[_handleScrollTo] ✅ setData 完成，当前 selectedSub:', this.data.selectedSub);
            });
          }
        }
      }
      
      // 滚动时，检查是否需要加载更多分类（无论是否更新 selectedSub，都要加载数据）
      this.checkAndLoadMoreCategories();
    },

    // 计算分类的 offsetTop（只计算一次）
    calcCategoryOffsetTops() {
      if (!this.data.grandList || this.data.grandList.length === 0) {
        return;
      }
      
      const loadedCategories = this.data.grandList.filter(category => category.loaded);
      if (loadedCategories.length === 0) {
        return;
      }
      
      const query = wx.createSelectorQuery().in(this);
      // 修复：使用正确的选择器，分类模式现在也有 class="scroll-content"
      query.select('.scroll-content').scrollOffset();
      
      loadedCategories.forEach((category, idx) => {
        const originalIndex = this.data.grandList.indexOf(category);
        query.select(`#position${originalIndex}`).boundingClientRect();
      });
      
      query.exec((res) => {
        if (!res || res.length === 0) {
          console.warn('calcCategoryOffsetTops: 查询结果为空，可能选择器不正确');
          return;
        }
        
        const scrollTop = res[0] ? res[0].scrollTop : 0;
        const rects = res.slice(1);
        
        if (rects.length === 0) {
          console.warn('calcCategoryOffsetTops: 未找到任何分类元素的位置信息');
          return;
        }
        
        const updateData = {};
        let categoryIndex = 0;
        
        this.data.grandList.forEach((item, index) => {
          if (item.loaded && categoryIndex < rects.length) {
            const rect = rects[categoryIndex];
            if (rect && rect.top !== undefined) {
              // 计算绝对位置：滚动位置 + 相对于视口的位置
              const absoluteTop = scrollTop + rect.top;
            item.offsetTop = absoluteTop;
            updateData[`grandList[${index}].offsetTop`] = absoluteTop;
              console.log(`分类[${index}] ${item.nxDfgFatherGoodsName} offsetTop=${absoluteTop}`);
            }
            categoryIndex++;
          }
        });
        
        if (Object.keys(updateData).length > 0) {
          // 在更新位置信息时，确保 leftScrollIntoView 为空，避免触发左侧菜单滚动
          updateData.leftScrollIntoView = '';
          this.setData(updateData);
          console.log('分类 offsetTop 计算完成，更新了', Object.keys(updateData).length, '个分类的位置，已清空 leftScrollIntoView');
        }
      });
    },

    /**
     * 监听滚动条滚动事件（货架模式）
     */
    scrollToShelf(e) {
      // 使用节流处理滚动事件
      if (!this._scrollToShelfThrottle) {
        // 优化：将节流时间从 100ms 增加到 150ms，减少滚动事件处理频率，提升性能
        this._scrollToShelfThrottle = throttle(this._handleScrollToShelf.bind(this), 150);
      }
      this._scrollToShelfThrottle(e);
    },

    /**
     * 处理滚动事件的核心逻辑（货架模式）
     */
    _handleScrollToShelf(e) {
      const scrollTop = e.detail.scrollTop;
      const { selectedSub, shelfArr, scrollTriggerThreshold } = this.data;
      
      if (!shelfArr || shelfArr.length === 0) {
        return;
      }
      
      // 优化：增大触发阈值，避免因计算误差导致的误判
      const rpxRatio = 750 / getApp().globalData.screenWidth;
      const thresholdPx = scrollTriggerThreshold / rpxRatio;
      
      let newIndex = -1;
      let bestMatch = -1;
      let minDistance = Infinity;
      
      // 改进策略：找到最接近当前滚动位置但不超过的货架
      for (let i = 0; i < shelfArr.length; i++) {
        const shelf = shelfArr[i];
        if (!shelf.loaded || shelf.offsetTop === undefined) {
          continue;
        }
        
        const distance = scrollTop - shelf.offsetTop;
        
        // 如果当前滚动位置已经超过这个货架的起始位置
        if (distance >= -thresholdPx) {
          // 记录最接近且不超过的货架
          if (distance >= 0 && distance < minDistance) {
            minDistance = distance;
            bestMatch = i;
          }
          // 如果当前滚动位置在这个货架范围内（考虑阈值）
          if (distance >= -thresholdPx && distance <= thresholdPx * 2) {
            newIndex = i;
            break; // 找到最匹配的，直接退出
          }
        }
      }
      
      // 如果没有找到精确匹配，使用最佳匹配
      if (newIndex === -1 && bestMatch !== -1) {
        newIndex = bestMatch;
      }
      
      // 如果还是没找到，使用原来的逻辑（从后往前找）
      if (newIndex === -1) {
        const triggerLine = scrollTop + thresholdPx;
      for (let i = shelfArr.length - 1; i >= 0; i--) {
        const shelf = shelfArr[i];
          if (shelf.loaded && shelf.offsetTop !== undefined && shelf.offsetTop <= triggerLine) {
            newIndex = i;
          break;
          }
        }
      }
      
      // 如果用户已经点击了左侧菜单（clickedLeftMenuIndex 不为 null），
      // 滚动检测不应该改变 selectedSub，应该保持用户的选择
      // 但是仍然需要检查并加载更多数据
      const shouldSkipSelectedSubUpdate = this.data.clickedLeftMenuIndex !== null;
      
      if (shouldSkipSelectedSubUpdate) {
        console.log('[_handleScrollToShelf] 🚫 用户已点击左侧菜单 (clickedLeftMenuIndex=' + this.data.clickedLeftMenuIndex + ')，保持用户选择，跳过 selectedSub 更新');
      } else {
        // 如果正在点击左侧菜单，不更新 selectedSub，避免覆盖用户的选择
        if (this.data.isClickingLeftMenu) {
          console.log('[_handleScrollToShelf] 🚫 正在点击左侧菜单，跳过滚动检测，当前 selectedSub:', selectedSub);
        } else {
          // 如果存在点击的目标 index，只有当 newIndex 等于目标 index 时才允许更新，否则跳过
          const clickingTargetIndex = this.data.clickingTargetIndex;
          if (clickingTargetIndex !== null) {
            if (newIndex === clickingTargetIndex) {
              // 如果 newIndex 等于目标 index，允许更新（用户点击的目标已经滚动到位）
              console.log('[_handleScrollToShelf] ✅ 滚动到目标位置，允许更新 selectedSub 为:', newIndex);
            } else {
              // 如果 newIndex 不等于目标 index，跳过更新，避免覆盖用户的选择
              console.log('[_handleScrollToShelf] 🚫 存在点击目标 index:', clickingTargetIndex, '但检测到 newIndex:', newIndex, '跳过更新，避免覆盖用户选择');
              // 即使跳过更新，也要继续加载数据
              this.checkAndLoadMoreShelves();
              return;
            }
          }
          
          // 关键优化：只有当索引真的发生变化时，才 setData
          // 只更新选中状态（高亮），不触发左侧菜单滚动，避免抖动
          if (newIndex !== -1 && newIndex !== selectedSub) {
            const shelfName = shelfArr[newIndex] ? shelfArr[newIndex].nxDistributerGoodsShelfName : '未知';
            console.log('[_handleScrollToShelf] 📜 滚动检测：更新 selectedSub，从', selectedSub, '到', newIndex, '货架:', shelfName, '不设置 leftScrollIntoView');
            this.setData({
              selectedSub: newIndex
              // 移除 leftScrollIntoView，避免左侧菜单乱滚动
            }, () => {
              console.log('[_handleScrollToShelf] ✅ setData 完成，当前 selectedSub:', this.data.selectedSub);
            });
          }
        }
      }
      
      // 滚动时，检查是否需要加载更多货架（无论是否更新 selectedSub，都要加载数据）
      this.checkAndLoadMoreShelves();
    },

    // 计算货架的 offsetTop（只计算一次）
    calcShelfOffsetTops() {
      if (!this.data.shelfArr || this.data.shelfArr.length === 0) {
        return;
      }
      
      const loadedShelves = this.data.shelfArr.filter(shelf => shelf.loaded);
      if (loadedShelves.length === 0) {
        return;
      }
      
      const query = wx.createSelectorQuery().in(this);
      query.select('.scroll-content').scrollOffset();
      
      loadedShelves.forEach((shelf, idx) => {
        const originalIndex = this.data.shelfArr.indexOf(shelf);
        query.select(`#position${originalIndex}`).boundingClientRect();
      });
      
      query.exec((res) => {
        if (!res || res.length === 0) return;
        
        const scrollTop = res[0] ? res[0].scrollTop : 0;
        const rects = res.slice(1);
        
        const updateData = {};
        let shelfIndex = 0;
        
        this.data.shelfArr.forEach((item, index) => {
          if (item.loaded && shelfIndex < rects.length) {
            const absoluteTop = scrollTop + rects[shelfIndex].top;
            item.offsetTop = absoluteTop;
            updateData[`shelfArr[${index}].offsetTop`] = absoluteTop;
            shelfIndex++;
          }
        });
        
        if (Object.keys(updateData).length > 0) {
          // 在更新位置信息时，确保 leftScrollIntoView 为空，避免触发左侧菜单滚动
          updateData.leftScrollIntoView = '';
          this.setData(updateData);
          console.log('货架 offsetTop 计算完成，更新了', Object.keys(updateData).length, '个货架的位置，已清空 leftScrollIntoView');
        }
      });
    },

    // 检查并加载更多货架（滚动到底部时）
    checkAndLoadMoreShelves() {
      // 防止重复调用
      if (this.data.isLoadingMoreShelves) {
        console.log('正在加载更多货架，跳过');
        return;
      }
      
      const nextUnloadedIndex = this.data.shelfArr.findIndex(s => !s.loaded && !s.loading);
      if (nextUnloadedIndex !== -1) {
        this.setData({ isLoadingMoreShelves: true });
        const shelf = this.data.shelfArr[nextUnloadedIndex];
        console.log(`滚动加载：加载货架[${nextUnloadedIndex}]：${shelf.nxDistributerGoodsShelfName}`);
        
        return this.loadShelfGoodsDetail(shelf.nxDistributerGoodsShelfId, nextUnloadedIndex)
          .then(() => {
            this.setData({ isLoadingMoreShelves: false });
            // 加载完成后，检查是否需要继续加载（保证至少10个）
            const currentCount = this.countTotalGoods();
            if (currentCount < 10) {
              return this.loadGoodsUntilMinCount(10);
      } else {
              // 延迟执行，避免频繁调用，确保 DOM 渲染完成后再计算位置
              setTimeout(() => {
                this.calcShelfOffsetTops();
              }, 200);
            }
          })
          .catch(err => {
            this.setData({ isLoadingMoreShelves: false });
            console.error(`滚动加载货架[${nextUnloadedIndex}]失败:`, err);
          });
      } else {
        console.log('没有更多未加载的货架');
      }
    },

    // 滚动到底部时触发
    onScrollToLower() {
      if (this.data.showType === 'shelf') {
        console.log('滚动到底部，加载更多货架');
        this.checkAndLoadMoreShelves();
      } else {
        console.log('滚动到底部，加载更多分类');
        this.checkAndLoadMoreCategories();
      }
    },

    // 检查并加载更多分类
    checkAndLoadMoreCategories() {
      const grandList = this.data.grandList;
      const nextUnloadedIndex = grandList.findIndex(c => !c.loaded);
      if (nextUnloadedIndex !== -1) {
        const category = grandList[nextUnloadedIndex];
        this.loadCategoryGoodsDetail(category.nxDistributerFatherGoodsId, nextUnloadedIndex)
          .then(() => {
            // 加载完成后，检查是否需要继续加载（保证至少10个）
            const currentCount = this.countCategoryTotalGoods();
            if (currentCount < 10) {
              this.loadCategoryGoodsUntilMinCount(10);
            } else {
              this.calcCategoryOffsetTops();
            }
          })
          .catch(err => {
            console.error('加载分类失败:', err);
          });
      }
    },

    showIsOutShelf(e){
       // 检查是否允许点击（必须点击左侧菜单后才能点击右侧商品）
       if (e.currentTarget.dataset.item.nxDistributerGoodsEntity.nxDgGoodsName == '') {
        wx.showToast({
          title: '订单未成功',
          icon: 'none',
          duration: 1500
        });
        return;
      }

      // 检查是否允许点击（必须点击左侧菜单后才能点击右侧商品）
      if (!this.data.canClickGoods || this.data.clickedLeftMenuIndex === null) {
        wx.showToast({
          title: '请先选择左侧货架',
          icon: 'none',
          duration: 1500
        });
        return;
      }
      
      // 获取商品所属的货架 index（从 wxml 传递过来）
      var targetShelfIndex = e.currentTarget.dataset.shelfIndex;
      // 检查商品是否属于当前允许点击的货架
      if (targetShelfIndex !== this.data.clickedLeftMenuIndex) {
        wx.showToast({
          title: '请先选择左侧货架',
          icon: 'none',
          duration: 1500
        });
        return;
      }
      
      console.log("showIsOutShelf - 按货架显示");
      var item = e.currentTarget.dataset.item;
      var arr = item.nxDistributerGoodsEntity.nxDepartmentOrdersEntities;
      var temp = [];
      for(var i = 0; i < arr.length; i++){
        var order = arr[i];
        order.hasChoice = true;
        // 保留原来的 nxDoWeight 值，不设置为空
        temp.push(order);
      }
      item.nxDistributerGoodsEntity.nxDepartmentOrdersEntities = temp;

      // 找到对应的货架索引（通过 shelfId 查找）
      const shelfId = e.currentTarget.dataset.item.nxDgsgShelfId;
      const shelfIndex = this.data.shelfArr.findIndex(shelf => shelf.nxDistributerGoodsShelfId === shelfId);
      
      if (shelfIndex !== -1) {
        const currentSelected = this.data.selectedSub;
        const shelfName = this.data.shelfArr[shelfIndex] ? this.data.shelfArr[shelfIndex].nxDistributerGoodsShelfName : '未知';
        console.log('[showIsOutShelf] 📦 显示出库弹窗，设置 selectedSub，从', currentSelected, '到', shelfIndex, '货架:', shelfName);
        
        // 更新选中状态和滚动位置
        this.setData({
          selectedSub: shelfIndex,
          leftScrollIntoView: `left-shelf-${shelfIndex}`
        }, () => {
          console.log('[showIsOutShelf] ✅ setData 完成，当前 selectedSub:', this.data.selectedSub);
          // 立即清空 leftScrollIntoView，避免后续操作触发滚动
          setTimeout(() => {
            this.setData({
              leftScrollIntoView: ''
            });
            console.log('[showIsOutShelf] 🧹 清空 leftScrollIntoView，避免后续滚动');
          }, 100);
        });
      }

      // 保存 shelfId 到 data 中，以便在 confirm 时使用
      this.setData({
        showDisOutGoods: true,
        item: item.nxDistributerGoodsEntity,
        currentShelfId: shelfId // 保存当前商品的 shelfId
      })
    },

    showIsOut(e) {
      // 检查是否允许点击（必须点击左侧菜单后才能点击右侧商品）
      if (!this.data.canClickGoods || this.data.clickedLeftMenuIndex === null) {
        console.log('[showIsOut] ❌ 不允许点击：canClickGoods=', this.data.canClickGoods, 'clickedLeftMenuIndex=', this.data.clickedLeftMenuIndex);
        wx.showToast({
          title: '请先选择左侧分类',
          icon: 'none',
          duration: 1500
        });
        return;
      }
      
      // 获取商品所属的分类 index（从 wxml 传递过来）
      var categoryIndex = e.currentTarget.dataset.categoryIndex;
      console.log('[showIsOut] 检查点击权限：categoryIndex=', categoryIndex, 'clickedLeftMenuIndex=', this.data.clickedLeftMenuIndex);
      
      // 检查商品是否属于当前允许点击的分类
      if (categoryIndex !== this.data.clickedLeftMenuIndex) {
        console.log('[showIsOut] ❌ 商品不属于已点击的分类：categoryIndex=', categoryIndex, 'clickedLeftMenuIndex=', this.data.clickedLeftMenuIndex);
        wx.showToast({
          title: '请先选择左侧分类',
          icon: 'none',
          duration: 1500
        });
        return;
      }
      
      console.log('[showIsOut] ✅ 允许点击，打开弹窗');
      var item = e.currentTarget.dataset.item;
      var arr = item.nxDepartmentOrdersEntities;
      var temp = [];
      for(var i = 0; i < arr.length; i++){
        var order = arr[i];
        order.hasChoice = true;
        // 保留原来的 nxDoWeight 值，不设置为空
        temp.push(order);
      }
      item.nxDepartmentOrdersEntities = temp;
      // 按分类显示时，没有 shelfId，设置为 null
      this.setData({
        showDisOutGoods: true,
        item: item,
        currentShelfId: null // 分类显示模式下，没有 shelfId
      })
    },


    cancle() {
      this.setData({
        showDisOutGoods: false,
        item: {
          nxDgGoodsBrand: '',
          nxDgGoodsName: '',
          nxDgGoodsStandardname: '',
          nxDgGoodsStandardWeight: '',
          nxDepartmentOrdersEntities: []
        }
      });
    },

    confirm(e) {
      var that = this;
      var order = e.detail.order; // 获取组件传递的当前选中的订单对象
      var targetIndex = e.detail.index; // 获取订单索引
      
      if (!order || !order.nxDepartmentOrdersId) {
        wx.showToast({
          title: '订单信息错误',
          icon: 'none'
        });
        return;
      }
      
      var weightValue = order.nxDoWeight;
      if (!weightValue || weightValue <= 0) {
        wx.showToast({
          title: '请先填写出货数量',
          icon: 'none'
        });
        return;
      }
      
      load.showLoading("保存数据中");
      
      // 判断是否是供货商员工：从缓存中获取 userType
      var supplierCustomer = wx.getStorageSync('supplierCustomer');
      var userType = supplierCustomer ? supplierCustomer.userType : null;
      var isSupplierEmployee = (userType && userType != 1);
      
      // 如果是供货商员工，使用 sellerUpdateOrderWeight 接口
      if (isSupplierEmployee) {
        sellerUpdateOrderWeight({
          orderId: order.nxDepartmentOrdersId,
          weight: String(weightValue),
          pickUserId: that.data.userInfo ? that.data.userInfo.nxWeightUserId : null
        }).then(res => {
          load.hideLoading();
          if (res.result.code == 0) {
            console.log("订单出库成功，订单ID:", order.nxDepartmentOrdersId, "重量:", weightValue);
            
            // 从弹窗中移除已完成的订单
            const item = that.data.item;
            if (item && item.nxDepartmentOrdersEntities) {
              const originalLength = item.nxDepartmentOrdersEntities.length;
              item.nxDepartmentOrdersEntities = item.nxDepartmentOrdersEntities.filter(ord => {
                return ord.nxDepartmentOrdersId !== order.nxDepartmentOrdersId;
              });
              
              console.log(`已移除 1 个已完成的订单，剩余 ${item.nxDepartmentOrdersEntities.length} 个订单`);
              
              that.setData({
                item: item
              });
            }
            
            // 如果商品下的订单数量为0，则关闭弹窗
            if (item.nxDepartmentOrdersEntities && item.nxDepartmentOrdersEntities.length === 0) {
              that.setData({
                showDisOutGoods: false
              });
            } else {
              console.log(`弹窗中还有 ${item.nxDepartmentOrdersEntities.length} 个订单，保持弹窗打开`);
            }
            
            // 打印订单信息（单个订单）
            var customerName = '';
            if (order.nxDoRequestDisId != null && order.nxDoRequestDisId !== -1 && order.nxDoRequestDistributerName) {
              // 协作订单：协作商名称 + nxDepartmentAttrName
              var depName = order.nxDepartmentEntity ? (order.nxDepartmentEntity.nxDepartmentAttrName || order.nxDepartmentEntity.nxDepartmentName || '') : '';
              customerName = order.nxDoRequestDistributerName + (depName ? depName : '');
            } else if (order.gbDepartmentEntity !== null) {
              customerName = order.gbDepartmentEntity.gbDepartmentAttrName;
            } else if (order.nxDepartmentEntity !== null) {
              customerName = order.nxDepartmentEntity.nxDepartmentAttrName;
            }
            
            if (customerName) {
              that.printCustomers([order]);
            }
            
            // 刷新数据
            if (that.data.showType === 'shelf') {
              that.refreshShelfData();
            } else {
              that.refreshCategoryData();
            }
          } else {
            wx.showToast({
              title: res.result.msg || '保存失败',
              icon: 'none'
            });
          }
        }).catch(err => {
          load.hideLoading();
          console.error('订单出库失败:', err);
          wx.showToast({
            title: '保存失败',
            icon: 'none'
          });
        });
      } else if (that.data.disInfo && that.data.disInfo.nxDistributerBusinessTypeId > 1) {
        // 根据 disInfo.nxDistributerBusinessTypeId 判断使用哪个接口
        // 如果 > 1，说明是货架配送商，使用 pickerGiveOrderWeightUpdateShelfStock（单个订单接口，需要 shelfId）
        // 货架配送商：使用 pickerGiveOrderWeightUpdateShelfStock 接口（需要 shelfId）
        // 如果是按分类显示（showType === 'type'），没有 shelfId，传 -1
        // 如果是按货架显示（showType === 'shelf'），使用实际的 shelfId
        var shelfId = null;
        if (that.data.showType === 'type') {
          shelfId = -1; // 按分类显示时，没有 shelfId，传 -1
        } else {
          shelfId = that.data.currentShelfId || that.data.selectedShelfId || -1; // 按货架显示时，使用实际的 shelfId
        }
        
        pickerGiveOrderWeightUpdateShelfStock({
          orderId: order.nxDepartmentOrdersId,
          orderWeight: String(weightValue),
          pickerUserId: that.data.userInfo.nxWeightUserId,
          shelfId: shelfId
        }).then(res => {
          load.hideLoading();
          if (res.result.code == 0) {
            console.log("订单出库成功，订单ID:", order.nxDepartmentOrdersId, "重量:", weightValue, "shelfId:", shelfId);
            
            // 从弹窗中移除已完成的订单
            const item = that.data.item;
            if (item && item.nxDepartmentOrdersEntities) {
              const originalLength = item.nxDepartmentOrdersEntities.length;
              item.nxDepartmentOrdersEntities = item.nxDepartmentOrdersEntities.filter(ord => {
                return ord.nxDepartmentOrdersId !== order.nxDepartmentOrdersId;
              });
              
              console.log(`已移除 1 个已完成的订单，剩余 ${item.nxDepartmentOrdersEntities.length} 个订单`);
              
              that.setData({
                item: item
              });
            }
            
            // 如果商品下的订单数量为0，则关闭弹窗
            if (item.nxDepartmentOrdersEntities && item.nxDepartmentOrdersEntities.length === 0) {
              that.setData({
                showDisOutGoods: false
              });
            } else {
              console.log(`弹窗中还有 ${item.nxDepartmentOrdersEntities.length} 个订单，保持弹窗打开`);
            }
            
            // 打印订单信息（单个订单）
            var customerName = '';
            if (order.nxDoRequestDisId != null && order.nxDoRequestDisId !== -1 && order.nxDoRequestDistributerName) {
              // 协作订单：协作商名称 + nxDepartmentAttrName
              var depName = order.nxDepartmentEntity ? (order.nxDepartmentEntity.nxDepartmentAttrName || order.nxDepartmentEntity.nxDepartmentName || '') : '';
              customerName = order.nxDoRequestDistributerName + (depName ? depName : '');
            } else if (order.gbDepartmentEntity !== null) {
              customerName = order.gbDepartmentEntity.gbDepartmentAttrName;
            } else if (order.nxDepartmentEntity !== null) {
              customerName = order.nxDepartmentEntity.nxDepartmentAttrName;
            } 
            
            if (customerName) {
              that.printCustomers([order]);
            }
            
            // 刷新数据
            if (that.data.showType === 'shelf') {
              that.refreshShelfData();
            } else {
              that.refreshCategoryData();
            }
          } else {
            wx.showToast({
              title: res.result.msg || '保存失败',
              icon: 'none'
            });
          }
        }).catch(err => {
          load.hideLoading();
          console.error('订单出库失败:', err);
          wx.showToast({
            title: '保存失败',
            icon: 'none'
          });
        });
      } else {
        // 非货架配送商：使用单个订单接口
        pickerGiveOrderWeight({
          orderId: order.nxDepartmentOrdersId,
          orderWeight: String(weightValue),
          pickerUserId: that.data.userInfo.nxWeightUserId
        }).then(res => {
          load.hideLoading();
          if (res.result.code == 0) {
            console.log("订单出库成功，订单ID:", order.nxDepartmentOrdersId, "重量:", weightValue);
            
            // 从弹窗中移除已完成的订单
            const item = that.data.item;
            if (item && item.nxDepartmentOrdersEntities) {
              const originalLength = item.nxDepartmentOrdersEntities.length;
              item.nxDepartmentOrdersEntities = item.nxDepartmentOrdersEntities.filter(ord => {
                return ord.nxDepartmentOrdersId !== order.nxDepartmentOrdersId;
              });
              
              console.log(`已移除 1 个已完成的订单，剩余 ${item.nxDepartmentOrdersEntities.length} 个订单`);
              
              that.setData({
                item: item
              });
            }
            
            // 如果商品下的订单数量为0，则关闭弹窗
            if (item.nxDepartmentOrdersEntities && item.nxDepartmentOrdersEntities.length === 0) {
              that.setData({
                showDisOutGoods: false
              });
            } else {
              console.log(`弹窗中还有 ${item.nxDepartmentOrdersEntities.length} 个订单，保持弹窗打开`);
            }
            
            // 打印订单信息（单个订单）
            var customerName = '';
            if (order.nxDoRequestDisId != null && order.nxDoRequestDisId !== -1 && order.nxDoRequestDistributerName) {
              // 协作订单：协作商名称 + nxDepartmentAttrName
              var depName = order.nxDepartmentEntity ? (order.nxDepartmentEntity.nxDepartmentAttrName || order.nxDepartmentEntity.nxDepartmentName || '') : '';
              customerName = order.nxDoRequestDistributerName + (depName ? depName : '');
            } else if (order.gbDepartmentEntity !== null) {
              customerName = order.gbDepartmentEntity.gbDepartmentAttrName;
            } else if (order.nxDepartmentEntity !== null) {
              customerName = order.nxDepartmentEntity.nxDepartmentAttrName;
            }
            if (customerName) {
              that.printCustomers([order]);
            }
            
            // 刷新数据
            if (that.data.showType === 'shelf') {
              that.refreshShelfData();
            } else {
              that.refreshCategoryData();
            }
          } else {
            wx.showToast({
              title: res.result.msg || '保存失败',
              icon: 'none'
            });
          }
        }).catch(err => {
          load.hideLoading();
          console.error('订单出库失败:', err);
          wx.showToast({
            title: '保存失败',
            icon: 'none'
          });
        });
      }
    },

    // 检查弹窗中是否还有未完成的订单
    checkRemainingOrders() {
      const item = this.data.item;
      if (!item || !item.nxDepartmentOrdersEntities) {
        return false;
      }
      
      // 检查是否还有未完成的订单（nxDoWeight 为 null、undefined、0 或空字符串的订单）
      const remainingOrders = item.nxDepartmentOrdersEntities.filter(order => {
        const weight = order.nxDoWeight;
        return weight === null || weight === undefined || weight === 0 || weight === '' || weight === '0';
      });
      
      console.log(`弹窗中剩余未完成订单数: ${remainingOrders.length}，总订单数: ${item.nxDepartmentOrdersEntities.length}`);
      return remainingOrders.length > 0;
    },

    // 刷新货架数据（局部刷新，不显示loading）
    refreshShelfData() {
      var that = this;
      
      // 1. 快速更新统计数据（不显示loading）
      that.refreshStatistics().then(() => {
        // 2. 更新货架列表的 goodsCount（获取最新的商品数量）
        that.updateShelfGoodsCount().then(() => {
          // 3. 刷新已加载的货架商品数据
          that.refreshLoadedShelves();
        });
      });
    },

    // 更新货架列表的 newOrderCount
    updateShelfGoodsCount() {
      var that = this;
      return new Promise((resolve) => {
        // 注意：nxDepIds 和 gbDepIds 需要转换为 String 类型
        const nxDepIdsStr = (this.data.outNxDepIds && this.data.outNxDepIds.length > 0) 
          ? this.data.outNxDepIds.join(',') 
          : "0";
        const gbDepIdsStr = (this.data.outGbDepIds && this.data.outGbDepIds.length > 0) 
          ? this.data.outGbDepIds.join(',') 
          : "0";
        
        stockerGetShelfListWithDepIds({
          nxDepIds: nxDepIdsStr,
          gbDepIds: gbDepIdsStr,
          nxDisId: this.data.disId
        }).then(res => {
          if (res.result.code == 0) {
            const newShelfList = res.result.data.shelfList || [];
            const shelfArr = this.data.shelfArr;
            
            // 更新每个货架的 goodsCount，保留已加载的商品数据
            newShelfList.forEach(newShelf => {
              const existingShelfIndex = shelfArr.findIndex(s => 
                s.nxDistributerGoodsShelfId === newShelf.nxDistributerGoodsShelfId
              );
              
              if (existingShelfIndex !== -1) {
                // 更新 newOrderCount 和 hasGoods，保留其他数据
                // 只有当 newShelf 中存在这些字段时才更新，避免设置为 undefined
                if (newShelf.newOrderCount !== undefined) {
                  shelfArr[existingShelfIndex].newOrderCount = newShelf.newOrderCount;
                }
                if (newShelf.hasGoods !== undefined) {
                  shelfArr[existingShelfIndex].hasGoods = newShelf.hasGoods;
                }
              }
            });
            
            // 使用路径更新方式，只更新 goodsCount，避免更新整个数组
            const updateData = {};
            shelfArr.forEach((shelf, index) => {
              // 只更新存在的字段，避免设置 undefined
              if (shelf.newOrderCount !== undefined) {
                updateData[`shelfArr[${index}].newOrderCount`] = shelf.newOrderCount;
              }
              if (shelf.hasGoods !== undefined) {
                updateData[`shelfArr[${index}].hasGoods`] = shelf.hasGoods;
              }
            });
            
            this.setData(updateData);
            console.log('货架 newOrderCount 已更新');
          }
          resolve();
        }).catch(err => {
          console.error('更新货架 newOrderCount 失败:', err);
          resolve(); // 即使失败也继续
        });
      });
    },

    // 刷新统计数据（货架和分类共用）
    refreshStatistics() {
      // 注意：nxDepIds 和 gbDepIds 需要转换为 String 类型
      const nxDepIdsStr = (this.data.outNxDepIds && this.data.outNxDepIds.length > 0) 
        ? this.data.outNxDepIds.join(',') 
        : "0";
      const gbDepIdsStr = (this.data.outGbDepIds && this.data.outGbDepIds.length > 0) 
        ? this.data.outGbDepIds.join(',') 
        : "0";
      
      const params = {
        nxDepIds: nxDepIdsStr,
        gbDepIds: gbDepIdsStr,
        nxDisId: this.data.disId
      };
      
      // 根据显示类型选择不同的统计接口
      const apiMethod = this.data.showType === 'shelf' 
        ? stockerGetShelfStatistics 
        : stockerGetCategoryStatistics;
      
      // 直接返回 Promise，避免 Promise 警告
      return apiMethod(params).then(res => {
        if (res.result.code == 0) {
          this.setData({
            waitDepNx: res.result.data.waitDepNx || [],
            waitDepGb: res.result.data.waitDepGb || [],
            depOrdersWait: res.result.data.depOrdersWait || 0,
          });
          
          // 更新tabBar计数
          this.getTabBar().setData({
            stockCount: res.result.data.stockCount || 0,
            depCount: res.result.data.depCount || 0,
          });
        }
      }).catch(err => {
        console.error('刷新统计数据失败:', err);
        // 即使失败也不抛出错误，让调用链继续
      });
    },

    // 刷新已加载的货架商品数据（优化：只刷新当前选中的货架，而不是所有已加载的货架）
    refreshLoadedShelves() {
      const shelfArr = this.data.shelfArr;
      const clickedIndex = this.data.clickedLeftMenuIndex;
      const selectedSub = this.data.selectedSub;
      
      // 优先刷新当前选中的货架（用户正在操作的）
      const targetIndex = clickedIndex !== null ? clickedIndex : (selectedSub !== null && selectedSub >= 0 ? selectedSub : null);
      
      if (targetIndex !== null && targetIndex < shelfArr.length) {
        const targetShelf = shelfArr[targetIndex];
        if (targetShelf && targetShelf.loaded) {
          // 只刷新当前选中的货架
          this.loadShelfGoodsDetail(targetShelf.nxDistributerGoodsShelfId, targetIndex, true).then(() => {
            // 检查锁住的货架是否变空了（在移除之前检查）
            this.checkAndUnlockEmptyShelf();
            
            // 移除已空的货架
            this.removeEmptyShelves();
            
            // 如果商品数量不够10个，自动加载更多
            const currentCount = this.countTotalGoods();
            if (currentCount < 10) {
              this.loadGoodsUntilMinCount(10);
            } else {
              // 延迟计算，确保 DOM 渲染完成
              setTimeout(() => {
                this.calcShelfOffsetTops();
              }, 200);
            }
          }).catch(err => {
            console.error('刷新货架商品数据失败:', err);
            this.calcShelfOffsetTops();
          });
        } else {
          // 如果目标货架未加载，直接执行后续逻辑
          this.checkAndUnlockEmptyShelf();
          this.removeEmptyShelves();
          this.calcShelfOffsetTops();
        }
      } else {
        // 如果没有选中的货架，只执行清理和计算逻辑，不刷新数据
        this.checkAndUnlockEmptyShelf();
        this.removeEmptyShelves();
        this.calcShelfOffsetTops();
      }
    },

    // 移除已空的货架
    removeEmptyShelves() {
      const clickedIndex = this.data.clickedLeftMenuIndex;
      let shouldUnlock = false;
      
      const shelfArr = this.data.shelfArr.filter((shelf, index) => {
        // 如果货架已加载且为空，则移除
        if (shelf.loaded && shelf.isEmpty) {
          // 如果被移除的是当前锁住的货架，需要解除锁住状态
          if (clickedIndex !== null && index === clickedIndex) {
            shouldUnlock = true;
            console.log(`[removeEmptyShelves] 🔓 锁住的货架[${index}]已为空，自动解除锁住状态`);
          }
          return false;
        }
        return true;
      });
      
      if (shelfArr.length !== this.data.shelfArr.length) {
        console.log(`移除空货架，从${this.data.shelfArr.length}个减少到${shelfArr.length}个`);
        const updateData = { 
          shelfArr: shelfArr 
        };
        
        // 如果锁住的货架被移除了，解除锁住状态
        if (shouldUnlock) {
          updateData.clickedLeftMenuIndex = null;
          updateData.canClickGoods = false;
        }
        
        this.setData(updateData);
        
        if (shouldUnlock) {
          wx.showToast({
            title: '该货架已无商品，已自动解除锁定',
            icon: 'none',
            duration: 2000
          });
        }
      }
    },

    // ========== 分类商品刷新方法 ==========
    
    // 刷新分类数据（局部刷新，不显示loading）
    refreshCategoryData() {
      var that = this;
      
      // 1. 快速更新统计数据（不显示loading）
      that.refreshStatistics().then(() => {
        // 2. 更新分类列表的 goodsCount（获取最新的商品数量）
        that.updateCategoryGoodsCount().then(() => {
          // 3. 刷新已加载的分类商品数据
          that.refreshLoadedCategories();
        });
      });
    },

    // 更新分类列表的 newOrderCount
    updateCategoryGoodsCount() {
      var that = this;
      return new Promise((resolve) => {
        // 注意：nxDepIds 和 gbDepIds 需要转换为 String 类型
        const nxDepIdsStr = (this.data.outNxDepIds && this.data.outNxDepIds.length > 0) 
          ? this.data.outNxDepIds.join(',') 
          : "0";
        const gbDepIdsStr = (this.data.outGbDepIds && this.data.outGbDepIds.length > 0) 
          ? this.data.outGbDepIds.join(',') 
          : "0";
        
        stockerGetCategoryListWithDepIds({
          nxDepIds: nxDepIdsStr,
          gbDepIds: gbDepIdsStr,
          nxDisId: this.data.disId,
          supplierId: this.data.supplierId
        }).then(res => {
          if (res.result.code == 0) {
            const newCategoryList = res.result.data.categoryList || [];
            const grandList = this.data.grandList;
            
            // 更新每个分类的 goodsCount，保留已加载的商品数据
            newCategoryList.forEach(newCategory => {
              const existingCategoryIndex = grandList.findIndex(c => 
                c.nxDistributerFatherGoodsId === newCategory.nxDistributerFatherGoodsId
              );
              
              if (existingCategoryIndex !== -1) {
                // 更新 newOrderCount 和 hasGoods，保留其他数据
                // 只有当 newCategory 中存在这些字段时才更新，避免设置为 undefined
                if (newCategory.newOrderCount !== undefined) {
                  grandList[existingCategoryIndex].newOrderCount = newCategory.newOrderCount;
                }
                if (newCategory.hasGoods !== undefined) {
                  grandList[existingCategoryIndex].hasGoods = newCategory.hasGoods;
                }
              }
            });
            
            // 使用路径更新方式，只更新 goodsCount，避免更新整个数组
            const updateData = {};
            grandList.forEach((category, index) => {
              // 只更新存在的字段，避免设置 undefined
              if (category.newOrderCount !== undefined) {
                updateData[`grandList[${index}].newOrderCount`] = category.newOrderCount;
              }
              if (category.hasGoods !== undefined) {
                updateData[`grandList[${index}].hasGoods`] = category.hasGoods;
              }
            });
            
            this.setData(updateData);
            console.log('分类 newOrderCount 已更新');
          }
          resolve();
        }).catch(err => {
          console.error('更新分类 newOrderCount 失败:', err);
          resolve(); // 即使失败也继续
        });
      });
    },

    // 刷新已加载的分类商品数据（优化：只刷新当前选中的分类，而不是所有已加载的分类）
    refreshLoadedCategories() {
      const grandList = this.data.grandList;
      const clickedIndex = this.data.clickedLeftMenuIndex;
      const selectedSub = this.data.selectedSub;
      
      // 优先刷新当前选中的分类（用户正在操作的）
      const targetIndex = clickedIndex !== null ? clickedIndex : (selectedSub !== null && selectedSub >= 0 ? selectedSub : null);
      
      if (targetIndex !== null && targetIndex < grandList.length) {
        const targetCategory = grandList[targetIndex];
        if (targetCategory && targetCategory.loaded) {
          // 只刷新当前选中的分类
          this.loadCategoryGoodsDetail(targetCategory.nxDistributerFatherGoodsId, targetIndex, true).then(() => {
            // 检查锁住的分类是否变空了（在移除之前检查）
            this.checkAndUnlockEmptyCategory();
            
            // 移除已空的分类
            this.removeEmptyCategories();
            
            // 如果商品数量不够10个，自动加载更多
            const currentCount = this.countCategoryTotalGoods();
            if (currentCount < 10) {
              this.loadCategoryGoodsUntilMinCount(10);
            } else {
              // 延迟计算，确保 DOM 渲染完成
              setTimeout(() => {
                this.calcCategoryOffsetTops();
              }, 200);
            }
          }).catch(err => {
            console.error('刷新分类商品数据失败:', err);
            this.calcCategoryOffsetTops();
          });
        } else {
          // 如果目标分类未加载，直接执行后续逻辑
          this.checkAndUnlockEmptyCategory();
          this.removeEmptyCategories();
          this.calcCategoryOffsetTops();
        }
      } else {
        // 如果没有选中的分类，只执行清理和计算逻辑，不刷新数据
        this.checkAndUnlockEmptyCategory();
        this.removeEmptyCategories();
        this.calcCategoryOffsetTops();
      }
    },

    // 检查锁住的分类是否变空，如果变空则解除锁住状态
    checkAndUnlockEmptyCategory() {
      const clickedIndex = this.data.clickedLeftMenuIndex;
      if (clickedIndex === null) return; // 没有锁住的分类，不需要检查
      
      const grandList = this.data.grandList;
      if (clickedIndex >= 0 && clickedIndex < grandList.length) {
        const category = grandList[clickedIndex];
        // 检查分类是否已加载且为空
        if (category.loaded && category.isEmpty) {
          console.log(`[checkAndUnlockEmptyCategory] 🔓 锁住的分类[${clickedIndex}]已变空，自动解除锁住状态`);
          this.setData({
            clickedLeftMenuIndex: null,
            canClickGoods: false
          });
          wx.showToast({
            title: '该分类已无商品，已自动解除锁定',
            icon: 'none',
            duration: 2000
          });
        }
      }
    },

    // 检查锁住的货架是否变空，如果变空则解除锁住状态
    checkAndUnlockEmptyShelf() {
      const clickedIndex = this.data.clickedLeftMenuIndex;
      if (clickedIndex === null) return; // 没有锁住的货架，不需要检查
      
      const shelfArr = this.data.shelfArr;
      if (clickedIndex >= 0 && clickedIndex < shelfArr.length) {
        const shelf = shelfArr[clickedIndex];
        // 检查货架是否已加载且为空
        if (shelf.loaded && shelf.isEmpty) {
          console.log(`[checkAndUnlockEmptyShelf] 🔓 锁住的货架[${clickedIndex}]已变空，自动解除锁住状态`);
          this.setData({
            clickedLeftMenuIndex: null,
            canClickGoods: false
          });
          wx.showToast({
            title: '该货架已无商品，已自动解除锁定',
            icon: 'none',
            duration: 2000
          });
        }
      }
    },

    // 移除已空的分类
    removeEmptyCategories() {
      const clickedIndex = this.data.clickedLeftMenuIndex;
      let shouldUnlock = false;
      
      const grandList = this.data.grandList.filter((category, index) => {
        // 如果分类已加载且为空，则移除
        if (category.loaded && category.isEmpty) {
          // 如果被移除的是当前锁住的分类，需要解除锁住状态
          if (clickedIndex !== null && index === clickedIndex) {
            shouldUnlock = true;
            console.log(`[removeEmptyCategories] 🔓 锁住的分类[${index}]已为空，自动解除锁住状态`);
          }
          return false;
        }
        return true;
      });
      
      if (grandList.length !== this.data.grandList.length) {
        console.log(`移除空分类，从${this.data.grandList.length}个减少到${grandList.length}个`);
        const updateData = { 
          grandList: grandList 
        };
        
        // 如果锁住的分类被移除了，解除锁住状态
        if (shouldUnlock) {
          updateData.clickedLeftMenuIndex = null;
          updateData.canClickGoods = false;
        }
        
        this.setData(updateData);
        
        if (shouldUnlock) {
          wx.showToast({
            title: '该分类已无商品，已自动解除锁定',
            icon: 'none',
            duration: 2000
          });
        }
      }
    },

    toWaitDep(e) {
      console.log("ddd")
      wx.setStorageSync('showType', this.data.showType);
      wx.navigateTo({
        url: '../../../subPackage/pages/prepare/orderDepList/orderDepList?disId=' + this.data.disId
        +'&supplierId=' + this.data.supplierId ,
      })
    },


    toEditHome() {
      wx.setStorageSync('showType', this.data.showType);
      if(this.data.userInfo.nxWuAdmin == 0){
        wx.navigateTo({
          url: '../../../subPackage/pages/mangement/homePage/homePage',
        })
      }
     
    },

    toLand() {
      wx.setStorageSync('showType', this.data.showType);
      wx.navigateTo({
        url: '../../../subPackage/pages/prepare/land/land',
      })

    },



    toPrint() {
      console.log("toproiint");
      wx.setStorageSync('showType', this.data.showType);
      wx.navigateTo({
        url: '../../../subPackage/pages/prepare/preparePrint/preparePrint?disId=' + this.data.disId ,
      })
    },


    toWeightPage() {
      wx.setStorageSync('showType', this.data.showType);
      wx.navigateTo({
        url: '../../../subPackage/pages/prepare/weightPage/weightPage?disId=' + this.data.disId 
      })
    },

    onNavButtonTap() {
      console.log("ddd")
      wx.navigateTo({
        url: '../../../subPackage/pages/management/homePage/homePage',
      })
     },

    onRightScroll(e) {
      const query = wx.createSelectorQuery();
      query.selectAll('.shelf-section').boundingClientRect();
      query.selectViewport().scrollOffset();

      query.exec(res => {
        const items = res[0];
        const scrollTop = res[1].scrollTop;
        
        // 计算顶部内容的高度（导航栏 + 按钮栏 + 其他顶部内容）
        const topContentHeight = this.data.navBarHeight + this.data.viewBarHeight;
        
        // 找到第一个完全进入视图的商品
        let currentIndex = -1;
        for (let i = 0; i < items.length; i++) {
          const item = items[i];
          // 考虑顶部内容的高度，调整判断条件
          if (item.top >= topContentHeight && item.top < (topContentHeight + 200) && item.bottom > topContentHeight) {
            currentIndex = i;
            break;
          }
        }

        if (currentIndex !== -1) {
          const currentShelfId = this.data.shelfGoodsArr[currentIndex].nxDgsgShelfId;
          const shelfIndex = this.data.shelfArr.findIndex(
            s => s.nxDistributerGoodsShelfId === currentShelfId
          );
          
          if (shelfIndex !== -1 && currentShelfId !== this.data.selectedShelfId) {
            this.setData({
              selectedSub: shelfIndex,
              selectedShelfId: currentShelfId,
              leftScrollIntoView: `left-shelf-${shelfIndex}`
            });
          }
        }
      });
    },

    // 打印订单信息（可选功能，不强制）
    printCustomers(orderArray) {
      console.log('printCustomers 被调用，订单数量:', orderArray.length);
      var that = this;
      
      var app = getApp();
      
      // 检查全局数据是否存在
      if (!app.globalData) {
        app.globalData = {};
      }
      if (!app.globalData.BLEInformation) {
        app.globalData.BLEInformation = {};
      }
      
      // 尝试从缓存中恢复打印机信息
      if (!app.globalData.BLEInformation.deviceId) {
        const cachedDeviceInfo = wx.getStorageSync('bleDeviceInfo');
        if (cachedDeviceInfo && cachedDeviceInfo.deviceId) {
          console.log('从缓存恢复打印机信息:', cachedDeviceInfo);
          app.globalData.BLEInformation = cachedDeviceInfo;
        }
      }
      
      // 如果没有打印机，静默跳过，不提示错误
      if (!app.globalData.BLEInformation || !app.globalData.BLEInformation.deviceId) {
        console.log('未设置打印机，跳过打印功能');
        return; // 直接返回，不提示错误
      }
      
      console.log('=== 打印流程开始 ===');
      wx.showLoading({
        title: '连接打印机...',
      });
      
      wx.openBluetoothAdapter({
        success: function(res) {
          setTimeout(() => {
            wx.createBLEConnection({
              deviceId: app.globalData.BLEInformation.deviceId,
              success: function(res) {
                that.discoverAndCacheWritableChar(orderArray);
              },
              fail: function(err) {
                // 如果是已连接错误，直接使用现有连接
                if (err.errCode === 1509007 || err.errMsg.indexOf('already connect') !== -1) {
                  console.log('设备已连接，直接使用现有连接');
                  app.globalData.BLEInformation.isConnected = true;
                  that.discoverAndCacheWritableChar(orderArray);
                } else {
                  console.error('蓝牙连接失败:', err);
                  wx.hideLoading();
                  wx.showModal({
                    title: '提示',
                    content: '打印机连接失败，请重新设置打印机',
                    confirmText: '去设置',
                    success: function(res) {
                      if (res.confirm) {
                        wx.navigateTo({
                          url: '../../printer/printer',
                        });
                      }
                    }
                  });
                }
              }
            });
          }, 500);
        },
        fail: function(err) {
          console.error('蓝牙适配器初始化失败:', err);
          wx.hideLoading();
          wx.showToast({
            title: '请打开蓝牙',
            icon: 'none'
          });
        }
      });
    },

    // 发现并缓存可写特征值
    discoverAndCacheWritableChar(orderArray) {
      var that = this;
      var app = getApp();
      
      wx.getBLEDeviceServices({
        deviceId: app.globalData.BLEInformation.deviceId,
        success: function(res) {
          var services = res.services || [];
          var targetServices = services.filter(function(s) {
            return /fff0/i.test(s.uuid) || /ffe0/i.test(s.uuid) || /180f/i.test(s.uuid) || /fff2/i.test(s.uuid);
          });
          
          var service = targetServices[0] || services[0];
          if (!service) {
            wx.hideLoading();
            wx.showToast({
              title: '未发现可用服务',
              icon: 'none'
            });
            return;
          }
          
          wx.getBLEDeviceCharacteristics({
            deviceId: app.globalData.BLEInformation.deviceId,
            serviceId: service.uuid,
            success: function(chrRes) {
              var chs = chrRes.characteristics || [];
              
              var writable = null;
              for (var i = 0; i < chs.length; i++) {
                if (chs[i].properties.writeNoResponse) {
                  writable = chs[i];
                  break;
                }
              }
              
              if (!writable) {
                for (var i = 0; i < chs.length; i++) {
                  if (chs[i].properties.write) {
                    writable = chs[i];
                    break;
                  }
                }
              }
              
              if (!writable) {
                wx.hideLoading();
                wx.showToast({
                  title: '未发现可写特征',
                  icon: 'none'
                });
                return;
              }
              
              app.globalData.BLEInformation.writeServiceId = service.uuid;
              app.globalData.BLEInformation.writeCharaterId = writable.uuid;
              
              wx.setStorageSync('bleDeviceInfo', app.globalData.BLEInformation);
              
              console.log('特征发现完成');
              wx.hideLoading();
              that.doPrint(orderArray);
            }
          });
        }
      });
    },

    // 执行打印
    doPrint(orderArray) {
      console.log('doPrint 开始执行，订单数量:', orderArray.length);
      var that = this;
      var app = getApp();
      
      if (!app.globalData.BLEInformation.writeCharaterId || !app.globalData.BLEInformation.writeServiceId) {
        wx.showToast({
          title: '打印机特征值缺失',
          icon: 'none'
        });
        return;
      }

      // ========== 使用新的标签打印工具类 ==========
      const labelPrinter = require('../../../utils/labelPrinter.js');
      
      try {
        // 生成打印数据
        const printData = labelPrinter.quickPrint(orderArray, {
          paperSizeId: wx.getStorageSync('paperSize') || 1,
          goodsItem: that.data.item,
          printRemark: true
        });
        
        if (!printData || printData.length === 0) {
          console.error('[doPrint] 打印数据为空，请检查打印内容');
          wx.showToast({
            title: '打印数据为空',
            icon: 'none'
          });
          return;
        }
        
        console.log('[doPrint] 打印数据生成成功，长度:', printData.length);
        
        // 发送打印数据
        that.reliableSendPrintData(printData);
      } catch (error) {
        console.error('[doPrint] 打印数据生成失败:', error);
        wx.showToast({
          title: '打印数据生成失败',
          icon: 'none'
        });
      }
      // ========== 新的工具类代码结束 ==========
      
      /* ========== 原有代码已屏蔽（保留作为备份） ==========
      var tsc = require("../../../utils/GPutils/tsc.js").jpPrinter;
      var command = tsc.createNew();
      
      var cachedPaperSize = wx.getStorageSync('paperSize') || 1;
      var sizes = {
        1: { width: 40, height: 30 },
        2: { width: 40, height: 60 },
        3: { width: 50, height: 80 }
      };
      var paperSizeMM = sizes[cachedPaperSize] || sizes[1];
      
      var isVertical = (paperSizeMM.height >= 60);
      
      command.setSize(paperSizeMM.width, paperSizeMM.height);
      command.setGap(2);
      command.setDirection(0);
      command.setReference(0, 0);
      command.setCls();
      
      // TSC 打印机常用字体：TSS24.BF2（24点字体）、TSS32.BF2（32点字体）、TSS48.BF2（48点字体）
      // 如果打印机不支持 TSS24.BF2，可以尝试：TSS24、TSS32、TSS48 等
      var fontName = "TSS24.BF2";
      var scale = paperSizeMM.height <= 30 ? 3 : 2;
      var rotation = paperSizeMM.height <= 30 ? 0 : 270;
      var startX = paperSizeMM.height <= 30 ? 16 : 0;
      var startY = Math.floor(2 * (203 / 25.4));
      var lineHeight = 30;
      
      var DPI = 203;
      var DPMM = DPI / 25.4; // 每毫米的点数，约 8 点/mm
      
      console.log('打印参数：字体=', fontName, '旋转=', rotation, '缩放=', scale, '起始Y=', startY, 'DPI=', DPI, 'DPMM=', DPMM);
      
      if (paperSizeMM.height <= 30) {
        startX = Math.floor(2 * DPMM);
        startY = Math.floor(2 * DPMM);
        lineHeight = 80;
      } else if (isVertical) {
        startY = Math.floor(8 * DPMM);
      }
      
      console.log('标签尺寸:', paperSizeMM.width, 'x', paperSizeMM.height, 'mm');
      
      if (isVertical) {
        // 垂直模式：每个订单占一行，y 坐标递增
        // 注意：在 TSC 中，当 rotation = 270 时，y 坐标从标签底部开始计算
        var labelHeightPoints = Math.floor(paperSizeMM.height * DPMM); // 标签高度（点数）
        var verticalLineHeight = Math.floor(60 * DPMM); // 每行高度约 60 点（约 7.5mm）
        
        // y 坐标从标签底部开始，所以需要从 labelHeightPoints 开始递减
        // 或者从底部向上计算：y = labelHeightPoints - 偏移量
        // 但更简单的方式是：从顶部开始，但理解 y 的含义是从底部开始
        // 实际上，在 rotation = 270 时，y 坐标系统是从底部开始的
        // 所以第一个订单应该在底部附近，最后一个订单在顶部附近
        // 但为了简化，我们从顶部开始，y 坐标从 0 开始递增
        // 如果打印机要求从底部开始，我们需要反转计算
        
        // 从标签底部开始计算 y 坐标
        // 第一个订单在底部，y 坐标应该较大（接近 labelHeightPoints）
        // 最后一个订单在顶部，y 坐标应该较小（接近 0）
        // 但为了保持逻辑一致，我们从底部开始，y 坐标递减
        var currentY = labelHeightPoints - Math.floor(8 * DPMM); // 从底部向上偏移 8mm
        
        // 调试：打印商品对象信息
        console.log('商品对象 (that.data.item) 键名:', that.data.item ? Object.keys(that.data.item) : 'item 不存在');
        if (that.data.item && that.data.item.nxDgGoodsName) {
          console.log('  - 商品名称 (that.data.item.nxDgGoodsName):', that.data.item.nxDgGoodsName);
        }
        
        for (var orderIdx = 0; orderIdx < orderArray.length; orderIdx++) {
          var order = orderArray[orderIdx];
          
          // 调试：打印订单对象的键名
          console.log('订单[' + orderIdx + '] 对象键名:', Object.keys(order));
          if (order.gbDepartmentEntity) {
            console.log('  - gbDepartmentEntity 键名:', Object.keys(order.gbDepartmentEntity));
          }
          if (order.nxDepartmentEntity) {
            console.log('  - nxDepartmentEntity 键名:', Object.keys(order.nxDepartmentEntity));
          }
          if (order.nxDistributerGoodsEntity) {
            console.log('  - nxDistributerGoodsEntity 键名:', Object.keys(order.nxDistributerGoodsEntity));
          }
          if (order.nxDepartmentDisGoodsEntity) {
            console.log('  - nxDepartmentDisGoodsEntity 键名:', Object.keys(order.nxDepartmentDisGoodsEntity));
            console.log('  - nxDepartmentDisGoodsEntity 内容:', JSON.stringify(order.nxDepartmentDisGoodsEntity).substring(0, 500));
            if (order.nxDepartmentDisGoodsEntity.nxDistributerGoodsEntity) {
              console.log('    - nxDepartmentDisGoodsEntity.nxDistributerGoodsEntity 键名:', Object.keys(order.nxDepartmentDisGoodsEntity.nxDistributerGoodsEntity));
              console.log('    - nxDepartmentDisGoodsEntity.nxDistributerGoodsEntity 内容:', JSON.stringify(order.nxDepartmentDisGoodsEntity.nxDistributerGoodsEntity).substring(0, 300));
            }
          }
          
          var customerName = '';
          // 协作订单：协作商名称 + nxDepartmentAttrName
          if (order.nxDoRequestDisId != null && order.nxDoRequestDisId !== -1 && order.nxDoRequestDistributerName) {
            var depName = order.nxDepartmentEntity ? (order.nxDepartmentEntity.nxDepartmentAttrName || order.nxDepartmentEntity.nxDepartmentName || '') : '';
            customerName = order.nxDoRequestDistributerName + (depName ? depName : '');
          } else if (order.gbDepartmentEntity) {
            // 优先使用 nxDepartmentAttrName/gbDepartmentAttrName，如果没有则使用 nxDepartmentName/gbDepartmentName
            customerName = order.gbDepartmentEntity.gbDepartmentAttrName || 
                          order.gbDepartmentEntity.gbDepartmentName || '';
            if (order.gbDepartmentEntity.fatherGbDepartmentEntity && customerName) {
              var fatherName = order.gbDepartmentEntity.fatherGbDepartmentEntity.gbDepartmentName || 
                              order.gbDepartmentEntity.fatherGbDepartmentEntity.gbDepartmentAttrName || '';
              if (fatherName) {
                customerName = fatherName + '.' + customerName;
              }
            }
          } else if (order.nxDepartmentEntity) {
            // 优先使用 nxDepartmentAttrName，如果没有则使用 nxDepartmentName
            customerName = order.nxDepartmentEntity.nxDepartmentAttrName || 
                          order.nxDepartmentEntity.nxDepartmentName || '';
            if (order.nxDepartmentEntity.fatherDepartmentEntity && customerName) {
              var fatherName = order.nxDepartmentEntity.fatherDepartmentEntity.nxDepartmentName || 
                              order.nxDepartmentEntity.fatherDepartmentEntity.nxDepartmentAttrName || '';
              if (fatherName) {
                customerName = fatherName + '.' + customerName;
              }
            }
          }
          var goodsName = '';
          // 商品名称在商品对象中，不在订单对象中
          // 从 this.data.item 获取商品名称（这是商品对象，包含 nxDgGoodsName）
          if (that.data.item && that.data.item.nxDgGoodsName) {
            goodsName = that.data.item.nxDgGoodsName;
          } else {
            // 备用方案：尝试从订单对象中查找
          if (order.nxDistributerGoodsEntity) {
            goodsName = order.nxDistributerGoodsEntity.nxDgGoodsName || '';
            } else if (order.nxDepartmentDisGoodsEntity) {
              if (order.nxDepartmentDisGoodsEntity.nxDistributerGoodsEntity) {
                goodsName = order.nxDepartmentDisGoodsEntity.nxDistributerGoodsEntity.nxDgGoodsName || '';
              } else if (order.nxDepartmentDisGoodsEntity.nxDgGoodsName) {
                goodsName = order.nxDepartmentDisGoodsEntity.nxDgGoodsName;
              }
            } else if (order.nxDgGoodsName) {
              goodsName = order.nxDgGoodsName;
            }
          }
          
          var quantity = order.nxDoWeight || 0;
          var remark = order.nxDoRemark || '';
          var standard = order.nxDoPrintStandard || '';
          
          // 垂直模式下，标签是竖着的，rotation = 270
          // 在 TSC 中，当 rotation = 270 时：
          // - x 坐标表示垂直方向的位置（从上到下，标签的宽度方向）
          // - y 坐标表示水平方向的位置（从左到右，标签的高度方向）
          // 所以要让部门名称和商品名称在同一行（水平对齐），它们应该使用相同的 y 坐标
          
          var labelWidthPoints = Math.floor(paperSizeMM.width * DPMM);
          var labelHeightPoints = Math.floor(paperSizeMM.height * DPMM);
          
          // 垂直模式（4x6 竖版）：标签是竖着的，rotation = 270
          // 在 TSC 中，无论 rotation 是多少，坐标系统都是：
          // - x：水平方向的位置（从左到右，标签的宽度方向）
          // - y：垂直方向的位置（从上到下，标签的高度方向）
          // 当 rotation = 270 时，文字旋转了 270 度，但坐标系统不变
          // 
          // 要让部门名称和商品名称在同一行（水平对齐），它们应该使用相同的 y 坐标
          // 要让它们在不同列（垂直对齐），它们应该使用不同的 x 坐标
          
          var labelWidthPoints = Math.floor(paperSizeMM.width * DPMM);
          
          // x 坐标：水平方向的位置（从左到右），用于让内容在不同列显示
          var x1 = Math.floor(2 * DPMM); // 左边距 2mm
          var x2 = Math.floor(labelWidthPoints * 0.4); // 40% 位置（商品名称）
          var x3 = Math.floor(labelWidthPoints * 0.6); // 60% 位置
          var x4 = Math.floor(labelWidthPoints * 0.85); // 85% 位置
          
          // y 坐标：垂直方向的位置（从底部开始），所有内容使用相同的 y 确保在同一行
          var y = currentY; // 部门名称、商品名称、数量等使用相同的 y 坐标，确保在同一行
          
          console.log('垂直模式打印：订单[' + orderIdx + '] x1=' + x1 + ', x2=' + x2 + ', x3=' + x3 + ', y=' + y);
          console.log('  - 部门名称:', customerName, '(长度:', customerName ? customerName.length : 0, ')');
          console.log('  - 商品名称:', goodsName, '(长度:', goodsName ? goodsName.length : 0, ')');
          console.log('  - 数量:', quantity, '单位:', standard);
          console.log('  - 备注:', remark);
          
          // 确保文字内容不为空才打印，所有内容使用相同的 y 坐标确保在同一行
          if (customerName && customerName.trim()) {
            // 部门名称使用更大的字体
            // 使用 TSS24.BF2 但增大 scale 来放大字体（更可靠，因为 TSS32 可能不支持）
            var departmentFontName = "TSS24.BF2"; // 使用24点字体
            var departmentScale = scale + 2; // 增大 scale 来放大字体（从 2 改为 4）
            
            console.log('  ✓ 打印部门名称:', customerName);
            console.log('  - 使用字体:', departmentFontName, '坐标: x=' + x1 + ', y=' + y);
            console.log('  - 使用更大的 scale:', departmentScale, '(默认 scale=' + scale + ')');
            console.log('  - 通过增大 scale 来放大字体，比使用 TSS32 更可靠');
            
            command.setText(x1, y, departmentFontName, rotation, departmentScale, departmentScale, customerName);
            console.log('  - 已设置部门名称打印命令，字体放大');
          } else {
            console.log('  ✗ 跳过部门名称（为空）');
          }
          
          if (goodsName && goodsName.trim()) {
            console.log('  ✓ 打印商品名称:', goodsName);
          command.setText(x2, y, fontName, rotation, scale, scale, goodsName);
          } else {
            console.log('  ✗ 跳过商品名称（为空）');
          }
          
          if (quantity || standard) {
            var quantityText = '数量：' + (quantity || 0) + (standard ? standard : '');
            console.log('  ✓ 打印数量:', quantityText);
            command.setText(x3, y, fontName, rotation, scale, scale, quantityText);
          } else {
            console.log('  ✗ 跳过数量（为空）');
          }
          
          if (paperSizeMM.height === 80 && remark && remark.trim()) {
            console.log('  ✓ 打印备注:', remark);
            command.setText(x4, y, fontName, rotation, scale, scale, '备注：' + remark);
          }
          
          // 下一个订单的 y 坐标递减（从底部向上）
          currentY -= verticalLineHeight;
          
          // 如果超出标签顶部，停止打印
          // 从底部开始，y 坐标递减，所以如果 currentY < 某个最小值，就停止
          var minY = Math.floor(2 * DPMM); // 最小 y 坐标（距离顶部 2mm）
          if (currentY < minY) {
            console.warn('垂直模式：订单数量过多，超出标签高度，停止打印后续订单');
            break;
          }
        }
      } else {
        // 非垂直模式（小标签，如 40x30mm）：每行打印一个订单的信息
        for (var i = 0; i < orderArray.length; i++) {
          var order = orderArray[i];
          var customerName = '';
          // 协作订单：协作商名称 + nxDepartmentAttrName
          if (order.nxDoRequestDisId != null && order.nxDoRequestDisId !== -1 && order.nxDoRequestDistributerName) {
            var depName = order.nxDepartmentEntity ? (order.nxDepartmentEntity.nxDepartmentAttrName || order.nxDepartmentEntity.nxDepartmentName || '') : '';
            customerName = order.nxDoRequestDistributerName + (depName ? depName : '');
          } else if (order.gbDepartmentEntity) {
            // 优先使用 nxDepartmentAttrName/gbDepartmentAttrName，如果没有则使用 nxDepartmentName/gbDepartmentName
            customerName = order.gbDepartmentEntity.gbDepartmentAttrName || 
                          order.gbDepartmentEntity.gbDepartmentName || '';
            if (order.gbDepartmentEntity.fatherGbDepartmentEntity && customerName) {
              var fatherName = order.gbDepartmentEntity.fatherGbDepartmentEntity.gbDepartmentName || 
                              order.gbDepartmentEntity.fatherGbDepartmentEntity.gbDepartmentAttrName || '';
              if (fatherName) {
                customerName = fatherName + '.' + customerName;
              }
            }
          } else if (order.nxDepartmentEntity) {
            // 优先使用 nxDepartmentAttrName，如果没有则使用 nxDepartmentName
            customerName = order.nxDepartmentEntity.nxDepartmentAttrName || 
                          order.nxDepartmentEntity.nxDepartmentName || '';
            if (order.nxDepartmentEntity.fatherDepartmentEntity && customerName) {
              var fatherName = order.nxDepartmentEntity.fatherDepartmentEntity.nxDepartmentName || 
                              order.nxDepartmentEntity.fatherDepartmentEntity.nxDepartmentAttrName || '';
              if (fatherName) {
                customerName = fatherName + '.' + customerName;
              }
            }
          } 
          var goodsName = '';
          // 商品名称在商品对象中，不在订单对象中
          // 从 this.data.item 获取商品名称（这是商品对象，包含 nxDgGoodsName）
          if (that.data.item && that.data.item.nxDgGoodsName) {
            goodsName = that.data.item.nxDgGoodsName;
          } else {
            // 备用方案：尝试从订单对象中查找
            if (order.nxDistributerGoodsEntity) {
              goodsName = order.nxDistributerGoodsEntity.nxDgGoodsName || '';
            } else if (order.nxDepartmentDisGoodsEntity) {
              if (order.nxDepartmentDisGoodsEntity.nxDistributerGoodsEntity) {
                goodsName = order.nxDepartmentDisGoodsEntity.nxDistributerGoodsEntity.nxDgGoodsName || '';
              } else if (order.nxDepartmentDisGoodsEntity.nxDgGoodsName) {
                goodsName = order.nxDepartmentDisGoodsEntity.nxDgGoodsName;
              }
            } else if (order.nxDgGoodsName) {
              goodsName = order.nxDgGoodsName;
            }
          }
          
          var quantity = order.nxDoWeight || 0;
          var standard = order.nxDoPrintStandard || '';
          var remark = order.nxDoRemark || '';
          
          // 计算当前行的 y 坐标
          var printY = startY + i * lineHeight;
          
          // 构建打印内容：客户名称 + 商品名称 + 数量
          var printContent = '';
          if (customerName) {
            printContent += customerName;
          }
          if (goodsName) {
            if (printContent) printContent += ' ';
            printContent += goodsName;
          }
          if (quantity || standard) {
            if (printContent) printContent += ' ';
            printContent += (quantity || 0) + (standard || '');
          }
          if (remark && paperSizeMM.height >= 60) {
            if (printContent) printContent += ' ';
            printContent += '备注:' + remark;
          }
          
          // 只有当有内容时才打印
          if (printContent) {
            console.log('非垂直模式：打印内容[' + i + ']:', printContent, '位置: x=' + startX + ', y=' + printY);
            command.setText(startX, printY, fontName, rotation, scale, scale, printContent);
          }
          
          // 如果超出标签高度，停止打印
          var maxY = Math.floor(paperSizeMM.height * DPMM);
          if (printY + lineHeight > maxY) {
            console.warn('非垂直模式：订单数量过多，超出标签高度，停止打印后续订单');
            break;
          }
        }
      }
      
      // 确保有内容才打印
      command.setPagePrint();
      var buff = command.getData();
      console.log('打印数据生成成功，长度:', buff.length);
      
      // 调试：打印命令内容（仅前 200 字节）
      if (buff.length > 0) {
        var debugStr = '';
        var debugLen = Math.min(200, buff.length);
        for (var i = 0; i < debugLen; i++) {
          if (buff[i] >= 32 && buff[i] <= 126) {
            debugStr += String.fromCharCode(buff[i]);
          } else {
            debugStr += '[' + buff[i] + ']';
          }
        }
        console.log('打印命令预览（前200字节）:', debugStr);
      }
      
      if (buff.length === 0) {
        console.error('打印数据为空，请检查打印内容');
        wx.showToast({
          title: '打印数据为空',
          icon: 'none'
        });
        return;
      }
      
      this.reliableSendPrintData(buff);
      */ // ========== 原有代码结束 ==========
    },

    // 延迟函数
    delay(ms) {
      return new Promise(function(resolve) {
        setTimeout(resolve, ms);
      });
    },

    // 可靠的发送方法
    async reliableSendPrintData(buff) {
      var that = this;
      var app = getApp();
      var oneTimeData = 20;
      var totalChunks = Math.ceil(buff.length / oneTimeData);
      
      try {
        for (var i = 0; i < totalChunks; i++) {
          var chunkStart = i * oneTimeData;
          var chunkEnd = Math.min(chunkStart + oneTimeData, buff.length);
          var chunkSize = chunkEnd - chunkStart;
          
          if (chunkSize === 0) continue;
          
          var buf = new ArrayBuffer(chunkSize);
          var dataView = new DataView(buf);
          
          for (var j = 0; j < chunkSize; j++) {
            dataView.setUint8(j, buff[chunkStart + j]);
          }
          
          await that.sendSingleChunk(buf);
          
          if (i < totalChunks - 1) {
            await that.delay(15);
          }
        }
        
        console.log('✅ 所有数据发送完成');
        wx.showToast({
          title: '打印完成',
          icon: 'success'
        });
        
        // 打印完成后断开蓝牙连接，释放打印机资源供其他用户使用
        console.log('📴 准备在500ms后断开标签打印机连接，释放资源供其他用户使用');
        setTimeout(function() {
          console.log('📴 开始断开标签打印机连接...');
          that._closeLabelPrinterConnection();
        }, 500); // 延迟500ms后断开连接，确保打印机有时间处理数据
      } catch (error) {
        console.error('发送数据失败:', error);
        wx.showToast({
          title: '打印失败',
          icon: 'none'
        });
      }
    },

    // 发送单个数据包
    sendSingleChunk(buf) {
      var that = this;
      var app = getApp();
      
      return new Promise(function(resolve, reject) {
        wx.writeBLECharacteristicValue({
          deviceId: app.globalData.BLEInformation.deviceId,
          serviceId: app.globalData.BLEInformation.writeServiceId,
          characteristicId: app.globalData.BLEInformation.writeCharaterId,
          value: buf,
          success: function(res) {
            resolve(res);
          },
          fail: function(e) {
            console.error('数据包发送失败:', e);
            reject(e);
          }
        });
      });
    },

    // 断开标签打印机连接
    _closeLabelPrinterConnection() {
      var that = this;
      var app = getApp();
      
      // 使用全局变量中的设备信息
      var deviceId = app.globalData.BLEInformation && app.globalData.BLEInformation.deviceId;
      
      if (deviceId) {
        console.log('📴 准备断开标签打印机连接，deviceId:', deviceId);
        wx.closeBLEConnection({
          deviceId: deviceId,
          success: function(res) {
            console.log('✅ 标签打印机连接已断开');
            // 清除连接状态标记
            if (app.globalData.BLEInformation) {
              app.globalData.BLEInformation.isConnected = false;
            }
          },
          fail: function(err) {
            console.log('⚠️ 断开标签打印机连接失败:', err);
            // 即使断开失败，也清除连接状态标记
            if (app.globalData.BLEInformation) {
              app.globalData.BLEInformation.isConnected = false;
            }
          }
        });
      } else {
        console.log('⚠️ 标签打印机信息不存在，无需断开连接');
      }
    },
  



  onNavButtonTap(){
    wx.navigateTo({
      url: '../../disUserEdit/disUserEdit',
    })

    
  },


  }
})