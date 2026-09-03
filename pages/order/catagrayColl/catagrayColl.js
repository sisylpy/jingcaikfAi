const globalData = getApp().globalData;
var load = require('../../../lib/load.js');

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

// 防抖函数 - 用于优化 DOM 查询等耗时操作
function debounce(fn, delay) {
  let timer = null;
  return function () {
    const context = this;
    const args = arguments;
    if (timer) {
      clearTimeout(timer);
    }
    timer = setTimeout(() => {
      fn.apply(context, args);
    }, delay);
  };
}

// 二分查找：找到最后一个 offsetTop <= target 的索引
function binarySearchLastLessOrEqual(arr, target) {
  let left = 0;
  let right = arr.length - 1;
  let result = -1;
  
  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    if (arr[mid].top <= target) {
      result = mid;
      left = mid + 1; // 继续向右查找，找到最后一个
    } else {
      right = mid - 1;
    }
  }
  
  return result >= 0 ? arr[result].index : -1;
}

import apiUrl from '../../../config.js'

import {
 
  stockerGetCategoryListWithCollNxDisId,
  stockerGetCategoryGoodsDetailWithCooNxDisId,
  pickerGiveOrderWeight,
  sellerUpdateOrderWeight
} from '../../../lib/apiDepOrder'


Page({
  data:{
     
  // 分页参数
  currentPage: 1,
  limit: 15,            // 或者你喜欢的每页条数
  totalPages: 1,
  totalCount: 0,
  isLoading: false,
  positionId: '',       // 右侧滚动定位ID
  hasSelectedCustomer: false, // 是否有选择客户
  printOk: false,      // 打印机是否已连接
  // 滚动优化相关
  scrollTriggerThreshold: 80,  // 滚动触发阈值（rpx转px后约40-50px），增大阈值避免误判和频繁切换
  loadedOffsets: [],   // 已加载分类的 offsetTop 数组，用于二分查找 [{index, top}]
  _loadingNextCategory: false, // 全局加载锁，避免频繁触发加载
  },


  onLoad: function (options) {
      // 获取页面参数 supplierId
      const app = getApp();
      const navBarHeight = app.globalData.navBarHeight;
      const screenHeight = app.globalData.screenHeight;
      const screenWidth = app.globalData.screenWidth;
      const rpxRatio = 750 / screenWidth;
      const navBarHeightRpx = navBarHeight * rpxRatio;
      const contentHeight = (screenHeight - navBarHeight  ) * rpxRatio;

      this.setData({ 
        contentHeight: contentHeight,
        navBarHeight: navBarHeightRpx,
        leftMenuWidth: 100, // 左侧菜单宽度，单位 rpxpages/order/index/index
      });

      var printOk = false;
      if (app && app.BLEInformation) {
        printOk = app.BLEInformation.deviceId ? true : false;
      }

      this.setData({
        windowWidth: globalData.windowWidth * globalData.rpxR,
        windowHeight: globalData.windowHeight * globalData.rpxR,
        statusBarHeight: globalData.statusBarHeight * globalData.rpxR,
        url: apiUrl.server,
        scrollViewTop: 0,
        selectedSub: 0, // 选中的分类
        scrollHeight: 0, // 滚动视图的高度
        toView: 'position0', // 滚动视图跳转的位置
        scrollTopLeft: 0, //  左边滚动位置随着右边分类而滚动
        scrollTopRight: 0, // 右边滚动位置，用于精确控制滚动到顶部
        isProgrammaticScroll: false, // 标记是否是程序化滚动，防止 scrollToShelf 干扰
        requestDisId: options.requestDisId,
        nxDisId: options.disId,
        collNxDisName: options.collNxDisName,
        hasSelectedCustomer: false, // 初始化客户选择状态
        printOk: printOk, // 打印机连接状态
       
      })

      var value = wx.getStorageSync('userInfo');
      if (value) {
        this.setData({
          userInfo: value,
        })
      }


      this._initNxData();
    },
  


    /**
     * 获取部门 ID 字符串（辅助方法，抽取重复逻辑）
     */
    getDepIdsPayload() {
      const nxDepIdsStr = (this.data.outNxDepIds && this.data.outNxDepIds.length > 0) 
        ? this.data.outNxDepIds.join(',') 
        : "0";
      const gbDepIdsStr = (this.data.outGbDepIds && this.data.outGbDepIds.length > 0) 
        ? this.data.outGbDepIds.join(',') 
        : "0";
      return { nxDepIdsStr, gbDepIdsStr };
    },

    _initNxData() {
      var that = this;
      load.showLoading("获取数据中");
      stockerGetCategoryListWithCollNxDisId({
        nxDisId: this.data.nxDisId,
        requestDisId: this.data.requestDisId,
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
          console.log("分类列表:", categoryList);
          
          this.setData({
            grandList: categoryList,  // 使用 categoryList 而不是 grandArr
            
          });
          
          if (categoryList.length == 0) {
            console.log("rescategoryList", categoryList.length);
            that.setData({
              outNxDepNames: [],
              outNxDepIds: [],
              outGbDepIds: [],
              outGbDepNames: [],
            });
            
            wx.removeStorageSync('idsChangeStock');
          } else {
            // 智能加载商品，保证至少10个商品
            that.loadCategoryGoodsUntilMinCount(10);
          }

          that.scheduleCalcOffsets();
        } else {
          console.error("接口返回错误:", res.result);
          this.setData({
            goodsList: [],
            grandList: [],
            outNxDepIds: [],
            outNxDepNames: [],
            outGbDepIds: [],
            outGbDepNames: [],
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
        // 优化：使用路径更新，仅更新变更的分类
        const updateKey = `grandList[${categoryIndex}]`;
        this.setData({ [updateKey]: category });
        console.log(`加载分类商品详情：categoryId=${categoryId}, categoryIndex=${categoryIndex}`);
        return stockerGetCategoryGoodsDetailWithCooNxDisId({
          categoryId: categoryId,
          nxDisId: this.data.nxDisId,
          requestDisId: this.data.requestDisId

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
            
            // 打印接口返回的商品数量
            const goodsCount = newCategoryData.goodsList ? newCategoryData.goodsList.length : 0;
            console.log(`stockerGetCategoryGoodsDetailWithCooNxDisId 接口返回的商品数量: ${goodsCount}, categoryId: ${categoryId}, categoryIndex: ${categoryIndex}`);
            
            // 将新数据结构转换为前端期望的旧格式（兼容现有 WXML 模板）
            const convertedCategory = this.convertCategoryDataToOldFormat(newCategoryData);
            
            if (!convertedCategory) {
              console.error(`分类[${categoryIndex}]数据转换失败`);
              throw new Error('数据转换失败');
            }
            
            // 更新对应分类的商品数据
            // 保留原有的 newOrderCount 和 hasGoods 字段（从接口1获取的）
            const originalCategory = grandList[categoryIndex];
            
            // 先在本地更新数据保持同步
            const updatedCategory = {
              ...convertedCategory,
              newOrderCount: originalCategory.newOrderCount,  // 保留商品数量
              hasGoods: originalCategory.hasGoods,      // 保留是否有商品标记
              loaded: true,
              loading: false,
              isEmpty: !convertedCategory.nxDistributerGoodsEntities || 
                       convertedCategory.nxDistributerGoodsEntities.length === 0
            };
            grandList[categoryIndex] = updatedCategory;
            
            const convertedGoodsCount = convertedCategory.nxDistributerGoodsEntities ? convertedCategory.nxDistributerGoodsEntities.length : 0;
            console.log(`分类[${categoryIndex}]加载完成，接口返回商品数=${goodsCount}，转换后商品数=${convertedGoodsCount}，保留goodsCount=${originalCategory.newOrderCount}`);
            
            // 优化：使用路径更新，仅更新变更的分类，而不是全量更新 grandList
            // 这样数据量大时不会导致整个列表重新渲染，显著提升性能
            const updateKey = `grandList[${categoryIndex}]`;
            this.setData({
              [updateKey]: updatedCategory
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
            // 优化：使用路径更新，仅更新变更的分类
            const updateKey = `grandList[${categoryIndex}]`;
            this.setData({ [updateKey]: grandList[categoryIndex] });
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
                this.scheduleCalcOffsets();
                // 确保第一个分类被选中
                if (this.data.selectedSub === undefined || this.data.selectedSub === null) {
                  this.setData({
                    selectedSub: 0
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
              this.listenerScroll();
            }
          });
      } else {
        // 已经满足条件或没有更多分类
        if (categoryIndex >= this.data.grandList.length) {
          console.log("智能加载结束：所有分类都已加载或正在加载中");
        } else {
          console.log("智能加载结束：商品数已满足要求");
        }
        this.listenerScroll();
      }
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


    toBack(){
      wx.navigateBack({delta: 1});
    },

    toStock(){
      // 跳转到出库页面
      wx.navigateTo({
        url: '../stock/stock?disId=' + this.data.disId
      });
    },
    
    /**
     * 获取右边每个分类的头部偏移量（计算绝对位置）
     * 优化：使用 debounce 避免频繁触发，优化查找逻辑避免 O(n²)
     */
    listenerScroll() {
      // 判断分类数组是否为空
      if (!this.data.grandList || this.data.grandList.length === 0) {
        return;
      }
      
      // 只查询已加载的分类位置，减少查询数量
      // 优化：在 filter 时保留 index，避免后续 O(n²) 的 indexOf
      const loadedCategoriesWithIndex = [];
      this.data.grandList.forEach((category, index) => {
        if (category.loaded) {
          loadedCategoriesWithIndex.push({ category, index });
        }
      });
      
      if (loadedCategoriesWithIndex.length === 0) {
        return;
      }
      
      // 获取各分类容器距离顶部的距离（计算绝对位置）
      new Promise(resolve => {
        let query = wx.createSelectorQuery().in(this);
        // 1. 查询滚动容器的 scrollTop
        query.select('.scroll-content').scrollOffset();
        // 2. 查询容器位置（用于计算相对位置，保持与 _scrollToCategory 的计算一致）
        query.select('.scroll-content').boundingClientRect();
        // 3. 只查询已加载的分类
        loadedCategoriesWithIndex.forEach(({ index }) => {
          query.select(`#position${index}`).boundingClientRect();
        });
        query.exec(function (res) {
          resolve(res);
        });
      }).then(res => {
        if (!res || res.length === 0) return;
        
        // 第一个结果是滚动容器的 scrollTop
        const scrollOffset = res[0];
        const scrollTop = scrollOffset ? scrollOffset.scrollTop : 0;
        // 第二个结果是容器的 boundingClientRect
        const containerRect = res[1];
        const containerTop = containerRect ? containerRect.top : 0;
        // 后续结果是各个分类的 boundingClientRect
        const rects = res.slice(2);
        
        // 更新已加载分类的位置信息，并构建 offsetTop 数组用于二分查找
        const updateData = {};
        const loadedOffsets = [];
        
        loadedCategoriesWithIndex.forEach(({ category, index }, idx) => {
          if (idx < rects.length) {
            const rect = rects[idx];
            if (rect && rect.top !== undefined) {
              // 【修正】计算绝对位置：使用与 _scrollToCategory 一致的公式
              // 计算公式：当前滚动高度 + (元素距离屏幕顶部 - 容器距离屏幕顶部)
              // 这样保证计算的 offsetTop 与 _scrollToCategory 中的计算一致
              const absoluteTop = scrollTop + rect.top - containerTop;
              category.offsetTop = absoluteTop;
              // 使用路径更新方式，只更新 offsetTop，减少数据传输量
              updateData[`grandList[${index}].offsetTop`] = absoluteTop;
              // 构建用于二分查找的数组（按 top 排序）
              loadedOffsets.push({ index, top: absoluteTop });
            }
          }
        });
        
        // 按 top 排序，用于二分查找
        loadedOffsets.sort((a, b) => a.top - b.top);
        
        // 批量更新，减少 setData 调用
        if (Object.keys(updateData).length > 0) {
          updateData.loadedOffsets = loadedOffsets;
          this.setData(updateData);
        }
      });
    },
    
    /**
     * 调度计算 offsetTop（使用 debounce，避免频繁触发）
     */
    scheduleCalcOffsets() {
      if (!this._scheduleCalcOffsetsDebounced) {
        this._scheduleCalcOffsetsDebounced = debounce(() => {
          // 检查组件是否还存在（防止 detached 后执行）
          if (this && this.listenerScroll) {
            this.listenerScroll();
          }
        }, 250);
      }
      this._scheduleCalcOffsetsDebounced();
    },


    /**
     * 跳转滚动条位置
     * 点击类别时，该类应该被选中，右侧属于该类别的商品应该滚动到页面顶部
     */
    toScrollView(e) {
      const { index } = e.currentTarget.dataset;
      const { grandList } = this.data;
      
      console.log('toScrollView - 点击分类索引:', index);
      
      // 【立即锁定】在第一行代码就设置 isProgrammaticScroll: true，彻底屏蔽滚动监听对选中态的干扰
      this.setData({
        isProgrammaticScroll: true
      });
      
      // 检查索引是否有效
      if (index < 0 || index >= grandList.length) {
        console.warn('toScrollView - 无效的分类索引:', index);
        // 重置标志
        setTimeout(() => {
          this.setData({ isProgrammaticScroll: false });
        }, 500);
        return;
      }
      
      const category = grandList[index];
      
      // 先更新选中状态和左侧滚动位置
      let left_ = 0;
      if (index > 3) {
        left_ = (index - 3) * 50; // 左边侧栏item高度为50
      }
      
      // 立即更新选中状态，让左侧菜单显示选中效果
      this.setData({
        selectedSub: index,
        scrollTopLeft: left_
      });
      
      // 如果分类未加载，先加载该分类的商品
      if (!category.loaded) {
        console.log('toScrollView - 分类未加载，开始加载分类商品, index:', index);
        this.loadCategoryGoodsDetail(category.nxDistributerFatherGoodsId, index)
          .then(() => {
            // 加载完成后，等待 DOM 渲染完成，然后滚动
            // 增加等待时间，确保商品数据已完全渲染到 DOM
            console.log('toScrollView - 分类商品加载完成，等待 DOM 渲染后准备滚动');
            setTimeout(() => {
              this._scrollToCategory(index);
            }, 300); // 增加等待时间，确保 DOM 完全渲染
          })
          .catch(err => {
            console.error('toScrollView - 加载分类商品失败:', err);
            // 即使加载失败，也尝试滚动（可能元素已存在）
            setTimeout(() => {
              this._scrollToCategory(index);
            }, 300);
          });
      } else {
        // 分类已加载，直接滚动（不需要等待，立即滚动）
        console.log('toScrollView - 分类已加载，直接滚动');
        // 对于已加载的分类，立即执行滚动，不需要延迟
        this._scrollToCategory(index, 0, true);
      }
    },
    
    /**
     * 滚动到指定分类的位置（滚动到页面顶部）
     * @param {number} index 分类索引
     * @param {number} retryCount 重试次数（内部参数，避免无限重试）
     * @param {boolean} skipDelay 是否跳过初始延迟（用于已加载的分类，立即滚动）
     */
    _scrollToCategory(index, retryCount = 0, skipDelay = false) {
      const that = this;
      const MAX_RETRY = 3; // 最大重试次数
      
      // 查询元素位置的函数（提取出来，方便重试）
      const queryAndScroll = () => {
        // 查询 scroll-view 的滚动位置和目标元素的位置
        const query = wx.createSelectorQuery().in(this);
        
        // 1. 获取 scroll-view 的当前滚动位置
        query.select('.scroll-content').scrollOffset();
        
        // 2. 获取目标元素的位置（相对于视口）
        query.select(`#position${index}`).boundingClientRect();

        // 3. 【新增】获取 ScrollView 容器本身的位置（用于扣除头部高度）
        query.select('.scroll-content').boundingClientRect();
        
        query.exec((res) => {
          console.log('toScrollView - 查询元素位置结果:', res);
          
          // 检查数据完整性 (现在需要检查 3 个结果)
          if (!res || res.length < 3) {
            console.warn('toScrollView - 无法获取元素位置信息，使用 scroll-into-view 作为备选方案');
            // 如果查询失败，使用 scroll-into-view 作为备选方案
            // 注意：isProgrammaticScroll 已经在 toScrollView 方法开始时设置
            that.setData({
              toView: '' // 先清空
            }, () => {
              setTimeout(() => {
                that.setData({
                  toView: `position${index}`
                });
                // 滚动完成后重置标志
                setTimeout(() => {
                  that.setData({
                    isProgrammaticScroll: false,
                    toView: '' // 清空 toView
                  });
                }, 500);
              }, 50);
            });
            return;
          }
          
          const scrollOffset = res[0];  // 滚动条信息
          const targetRect = res[1];    // 商品分类标题信息
          const containerRect = res[2]; // ScrollView 容器信息
          
          console.log('toScrollView - scrollOffset:', scrollOffset, 'targetRect:', targetRect, 'containerRect:', containerRect);
          
          // 检查元素位置信息是否完整
          if (!scrollOffset) {
            console.warn('toScrollView - scrollOffset 不存在，使用 scroll-into-view 作为备选方案');
            // 使用 scroll-into-view 作为备选方案
            // 注意：isProgrammaticScroll 已经在 toScrollView 方法开始时设置
            that.setData({
              toView: '' // 先清空
            }, () => {
              setTimeout(() => {
                that.setData({
                  toView: `position${index}`
                });
                // 滚动完成后重置标志
                setTimeout(() => {
                  that.setData({
                    isProgrammaticScroll: false,
                    toView: '' // 清空 toView
                  });
                }, 500);
              }, 50);
            });
            return;
          }
          
          // 如果目标元素不存在或位置信息不完整，可能是 DOM 还没有渲染完成
          if (!targetRect || targetRect.top === undefined || targetRect.top === null) {
            console.warn('toScrollView - 目标元素位置信息不完整，targetRect:', targetRect, 'retryCount:', retryCount);
            
            // 如果重试次数未超过最大次数，则重试
            if (retryCount < MAX_RETRY) {
              console.log(`toScrollView - 目标元素可能还未渲染，${200 * (retryCount + 1)}ms 后重试 (${retryCount + 1}/${MAX_RETRY})`);
              setTimeout(() => {
                that._scrollToCategory(index, retryCount + 1);
              }, 200 * (retryCount + 1)); // 每次重试间隔递增
              return;
            } else {
              // 超过最大重试次数，使用 scroll-into-view 作为备选方案
              console.warn('toScrollView - 达到最大重试次数，使用 scroll-into-view 作为备选方案');
              // 注意：isProgrammaticScroll 已经在 toScrollView 方法开始时设置
              that.setData({
                toView: '' // 先清空
              }, () => {
                setTimeout(() => {
                  that.setData({
                    toView: `position${index}`
                  });
                  // 滚动完成后重置标志
                  setTimeout(() => {
                    that.setData({
                      isProgrammaticScroll: false,
                      toView: '' // 清空 toView
                    });
                  }, 500);
                }, 50);
              });
              return;
            }
          }
          
          const currentScrollTop = scrollOffset.scrollTop || 0;
          const targetTop = targetRect.top || 0;
          const containerTop = containerRect ? containerRect.top : 0; // 容器距离屏幕顶部的距离
          
          // 【详细日志】打印所有相关信息用于调试
          console.log('🔍 toScrollView - 详细位置信息:', {
            '当前滚动位置 (currentScrollTop)': currentScrollTop,
            '目标元素距离屏幕顶部 (targetRect.top)': targetTop,
            '容器距离屏幕顶部 (containerRect.top)': containerTop,
            '目标元素高度 (targetRect.height)': targetRect.height,
            '容器高度 (containerRect.height)': containerRect ? containerRect.height : 0,
            '目标元素 bottom': targetRect.bottom,
            '容器 bottom': containerRect ? containerRect.bottom : 0,
            '位置差异 (targetTop - containerTop)': targetTop - containerTop,
            '重试次数': retryCount
          });
          
          // 【验证】检查目标元素是否已经在正确位置（targetTop 应该接近 containerTop）
          // 如果 targetTop 与 containerTop 差异很大，说明元素位置可能还不稳定，需要重试
          const positionDiff = Math.abs(targetTop - containerTop);
          if (positionDiff > 50 && retryCount < MAX_RETRY) {
            console.warn(`toScrollView - 目标元素位置不稳定，差异 ${positionDiff}px，${200 * (retryCount + 1)}ms 后重试 (${retryCount + 1}/${MAX_RETRY})`);
            setTimeout(() => {
              that._scrollToCategory(index, retryCount + 1);
            }, 200 * (retryCount + 1));
            return;
          }
          
          // 【核心修正】计算目标元素相对于 scroll-view 内容顶部的绝对位置
          // 计算公式：当前滚动高度 + (元素距离屏幕顶部 - 容器距离屏幕顶部)
          // 这样就消除了导航栏、状态栏高度的影响
          // 
          // 说明：
          // - currentScrollTop: scroll-view 当前已滚动的高度
          // - targetTop: 目标元素距离手机屏幕顶部的距离（包含导航栏等）
          // - containerTop: scroll-view 容器距离手机屏幕顶部的距离（包含导航栏等）
          // - targetTop - containerTop: 目标元素相对于 scroll-view 容器顶部的距离
          // - 最终 absoluteTop = currentScrollTop + (targetTop - containerTop) 就是目标元素的绝对位置
          const relativeTop = targetTop - containerTop; // 元素相对于容器的顶部距离
          let absoluteTop = currentScrollTop + relativeTop;

          // 【可选优化】微调：减去一点点距离（例如 2px），防止边框紧贴顶部，视觉上更舒适
          // absoluteTop = absoluteTop > 2 ? absoluteTop - 2 : absoluteTop;
          
          console.log('📐 toScrollView - 滚动位置计算:', {
            '当前滚动位置': currentScrollTop,
            '目标元素相对容器顶部距离': relativeTop,
            '计算出的绝对滚动位置 (absoluteTop)': absoluteTop,
            '如果 absoluteTop = currentScrollTop + relativeTop': `${currentScrollTop} + ${relativeTop} = ${absoluteTop}`,
            '目标索引': index
          });
          
          // 【单一驱动】直接使用 scrollTop 驱动滚动，移除 toView 的干扰
          // 注意：isProgrammaticScroll 已经在 toScrollView 方法开始时设置，这里不需要重复设置
          that.setData({
            scrollTopRight: absoluteTop
          }, () => {
            console.log('✅ toScrollView - setData 完成，已设置 scrollTopRight: ' + absoluteTop);
            
            // 验证：延迟一点时间后再次查询，确认滚动是否正确
            setTimeout(() => {
              const verifyQuery = wx.createSelectorQuery().in(that);
              verifyQuery.select('.scroll-content').scrollOffset();
              verifyQuery.select(`#position${index}`).boundingClientRect();
              verifyQuery.select('.scroll-content').boundingClientRect();
              verifyQuery.exec((verifyRes) => {
                if (verifyRes && verifyRes.length >= 3) {
                  const verifyScrollTop = verifyRes[0] ? verifyRes[0].scrollTop : 0;
                  const verifyTargetTop = verifyRes[1] ? verifyRes[1].top : 0;
                  const verifyContainerTop = verifyRes[2] ? verifyRes[2].top : 0;
                  const verifyRelativeTop = verifyTargetTop - verifyContainerTop;
                  
                  console.log('🔍 toScrollView - 滚动后验证位置 (100ms后):', {
                    '实际滚动位置 (verifyScrollTop)': verifyScrollTop,
                    '设置的滚动位置 (absoluteTop)': absoluteTop,
                    '滚动位置差异': Math.abs(verifyScrollTop - absoluteTop),
                    '目标元素距离屏幕顶部 (verifyTargetTop)': verifyTargetTop,
                    '容器距离屏幕顶部 (verifyContainerTop)': verifyContainerTop,
                    '目标元素相对容器顶部距离 (verifyRelativeTop)': verifyRelativeTop,
                    '是否在正确位置 (relativeTop 应该接近 0，如果 > 0 说明元素在容器下方，< 0 说明在容器上方)': verifyRelativeTop,
                    '目标元素高度': verifyRes[1] ? verifyRes[1].height : 0,
                    '容器高度': verifyRes[2] ? verifyRes[2].height : 0
                  });
                }
              });
            }, 150);
            
            // 滚动完成后，延迟重置标志（等待滚动动画完成和 DOM 更新）
            // 先重新计算 offsetTop，确保 loadedOffsets 数组是最新的，然后再重置标志
            // 这样可以避免因为 offsetTop 不准确导致的选中状态错误
            // scroll-with-animation 的默认动画时间约为 300ms
            setTimeout(() => {
              // 直接调用 listenerScroll（不使用 debounce），立即更新 offsetTop
              // 这样可以确保在重置 isProgrammaticScroll 标志之前，loadedOffsets 数组已经是最新的
              that.listenerScroll();
              // 延迟一点时间再重置标志，确保 offsetTop 计算完成并已更新到 data 中
              setTimeout(() => {
                that.setData({
                  isProgrammaticScroll: false
                });
              }, 50);
            }, 350); // 等待滚动动画完成（scroll-with-animation 默认动画约 300ms）+ DOM 查询和更新时间（约 50ms）
          });
        }); // query.exec 回调结束
      }; // queryAndScroll 函数结束
      
      // 等待 DOM 渲染完成，使用 wx.nextTick 或 setTimeout
      // 如果 skipDelay 为 true（已加载的分类），立即执行，不需要延迟
      // 如果是重试，延迟时间较短；如果是首次加载分类后的滚动，延迟稍长确保 DOM 稳定
      if (skipDelay) {
        // 已加载的分类，立即执行滚动
        queryAndScroll();
      } else {
        const delay = retryCount === 0 ? 200 : 100; // 减少延迟时间
        setTimeout(() => {
          queryAndScroll();
        }, delay);
      }
    },

  
   

    showIsOut(e) {
      var item = e.currentTarget.dataset.item;
      this.setData({
        showDisOutGoods: true,
        item: item,
      })
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
      
      // 判断是否是供货商员工：supplierId 存在且不等于 -1，或者从缓存中获取 userType
      var supplierCustomer = wx.getStorageSync('supplierCustomer');
      var userType = supplierCustomer ? supplierCustomer.userType : null;
      var isSupplierEmployee = (that.data.supplierId && that.data.supplierId != -1) || (userType && userType != 1);
      
      // 调用接口，提交单个订单
      load.showLoading("保存数据中");
      
      var apiCall;
      if (isSupplierEmployee) {
        // 供货商员工使用 sellerUpdateOrderWeight 接口
        apiCall = sellerUpdateOrderWeight({
          orderId: order.nxDepartmentOrdersId,
          weight: String(weightValue),
          pickUserId: this.data.userInfo ? this.data.userInfo.nxWeightUserId : null
        });
      } else {
        // 配送商员工使用 pickerGiveOrderWeight 接口
        apiCall = pickerGiveOrderWeight({
          orderId: order.nxDepartmentOrdersId,
          orderWeight: String(weightValue),
          pickerUserId: this.data.userInfo.nxWeightUserId
        });
      }
      
      apiCall.then(res => {
          load.hideLoading();
          if (res.result.code == 0) { 
          console.log("订单出库成功，订单ID:", order.nxDepartmentOrdersId, "重量:", weightValue);
          
          // 从弹窗中移除已完成的订单
          const item = that.data.item;
          if (item && item.nxDepartmentOrdersEntities) {
            // 过滤掉已完成的订单
            const originalLength = item.nxDepartmentOrdersEntities.length;
            item.nxDepartmentOrdersEntities = item.nxDepartmentOrdersEntities.filter(ord => {
              return ord.nxDepartmentOrdersId !== order.nxDepartmentOrdersId;
            });
            
            console.log(`已移除 1 个已完成的订单，剩余 ${item.nxDepartmentOrdersEntities.length} 个订单`);
            
            // 更新 item 数据
            that.setData({
              item: item
            });
            
            // 如果商品下的订单数量为0，则关闭弹窗
            if (item.nxDepartmentOrdersEntities.length === 0) {
              that.setData({
                showDisOutGoods: false
              });
            } else {
              console.log(`弹窗中还有 ${item.nxDepartmentOrdersEntities.length} 个订单，保持弹窗打开`);
            }
          } else {
            // 如果没有订单数据，直接关闭弹窗
            that.setData({
              showDisOutGoods: false
            });
          }
          
          // 打印订单信息（单个订单）
          // 收集客户名称（协作订单：协作商名称 + nxDepartmentAttrName）
          var depName = order.nxDepartmentEntity ? (order.nxDepartmentEntity.nxDepartmentAttrName || order.nxDepartmentEntity.nxDepartmentName || '') : '';
          var customerName = (order.nxDoRequestDistributerName || '') + depName;
         
          
          if (customerName) {
            that.printCustomers([order]);  // 传入单个订单数组
            }
            
          // 刷新数据（不显示loading，因为已经 hideLoading 了）
            that._initNxData();
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
          title: '保存失败，请重试',
          icon: 'none'
        });
      });
    },


    /**
     * 取消按钮 - 关闭出货弹窗
     */
    cancle() {
      console.log('[catagray] cancle: 关闭出货弹窗');
      this.setData({
        showDisOutGoods: false
      });
    },

    // 设置打印机
    setPrint() {
      // 检查是否有缓存的客户信息
      var cachedCustomers = wx.getStorageSync('cachedCustomers') || [];
      
      if (cachedCustomers.length > 0) {
        // 如果有缓存的客户，打印测试
        wx.showToast({
          title: '正在测试打印...',
          icon: 'loading',
          duration: 1000
        });
        
        // 延迟一下再打印
        setTimeout(() => {
          this.printCustomers(cachedCustomers);
        }, 1000);
      } else {
        wx.showToast({
          title: '暂无客户信息',
          icon: 'none'
        });
      }
      
      // 跳转到打印机连接页面
      wx.navigateTo({
        url: '../../printer/printer',
      });
    },

    // 打印订单信息
    printCustomers(orderArray) {
      console.log('printCustomers 被调用，订单数量:', orderArray.length, '订单数据:', orderArray);
      var that = this;
      
      var app = getApp();
      
      // 初始化全局数据（如果不存在）
      if (!app.globalData) {
        app.globalData = {};
      }
      if (!app.globalData.BLEInformation) {
        app.globalData.BLEInformation = {};
      }
      
      // 如果缓存了蓝牙配置，从缓存中恢复打印机信息
      if (!app.globalData.BLEInformation.deviceId) {
        const cachedDeviceInfo = wx.getStorageSync('bleDeviceInfo');
        if (cachedDeviceInfo && cachedDeviceInfo.deviceId) {
          console.log('从缓存恢复打印机信息:', cachedDeviceInfo);
          app.globalData.BLEInformation = cachedDeviceInfo;
        }
      }
      
      // 检查蓝牙是否已连接（包括从缓存恢复的）
      console.log('检查蓝牙信息，BLEInformation:', app.globalData.BLEInformation);
      if (!app.globalData.BLEInformation || !app.globalData.BLEInformation.deviceId) {
        console.log('未设置打印机，跳过打印功能');
        return; // 直接返回，不提示错误（静默跳过）
      }
      
      console.log('=== 打印流程开始 ===');
      console.log('订单信息:', orderArray);
      console.log('当前 BLE 信息:', app.globalData.BLEInformation);
      
      // 先初始化蓝牙适配器
      console.log('步骤1: 显示加载提示');
      wx.showLoading({
        title: '连接打印机...',
      });
      
      console.log('步骤2: 初始化蓝牙适配器');
      wx.openBluetoothAdapter({
        success: function(res) {
          console.log('步骤3: 蓝牙适配器初始化成功');
          // 等待一下再连接
          setTimeout(() => {
            console.log('步骤4: 开始创建蓝牙连接，设备ID:', app.globalData.BLEInformation.deviceId);
            wx.createBLEConnection({
              deviceId: app.globalData.BLEInformation.deviceId,
              success: function(res) {
                console.log('步骤5: 蓝牙连接成功');
                console.log('步骤6: 开始发现服务和特征值');
                // 发现服务和特征值
                that.discoverAndCacheWritableChar(orderArray);
              },
              fail: function(err) {
                // 如果是已连接错误，直接使用现有连接
                if (err.errCode === 1509007 || err.errMsg.indexOf('already connect') !== -1) {
                  console.log('步骤5: 设备已连接，直接使用现有连接');
                  console.log('步骤6: 开始发现服务和特征值');
                  app.globalData.BLEInformation.isConnected = true;
                  // 发现服务和特征值
                  that.discoverAndCacheWritableChar(orderArray);
                } else {
                  console.error('步骤5失败: 蓝牙连接失败:', err);
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
          console.error('步骤3失败: 蓝牙适配器初始化失败:', err);
          wx.hideLoading();
          wx.showToast({
            title: '请打开蓝牙',
            icon: 'none'
          });
        }
      });
    },
    
    // 执行打印
    doPrint(orderArray) {
      console.log('doPrint 开始执行，订单数量:', orderArray.length);
      var that = this;
      var app = getApp();
      
      // 检查特征值
      console.log('设备信息:', app.globalData.BLEInformation);
      if (!app.globalData.BLEInformation.writeCharaterId || !app.globalData.BLEInformation.writeServiceId) {
        console.error('缺少特征值信息');
        console.log('writeCharaterId:', app.globalData.BLEInformation.writeCharaterId);
        console.log('writeServiceId:', app.globalData.BLEInformation.writeServiceId);
        wx.showToast({
          title: '打印机特征值缺失，请重新设置',
          icon: 'none'
        });
        return;
      }

      // 协作订单也统一使用二维码标签布局；二维码内容为 nxDepartmentOrdersId。
      try {
        const labelPrinter = require('../../../utils/labelPrinter.js');
        const printData = labelPrinter.quickPrint(orderArray, {
          paperSizeId: wx.getStorageSync('paperSize') || 1,
          goodsItem: that.data.item,
          printRemark: true
        });
        if (!printData || !printData.length) {
          wx.showToast({ title: '打印数据为空', icon: 'none' });
          return;
        }
        that.sendPrintData(printData);
        return;
      } catch (error) {
        console.error('[doPrint] 二维码标签生成失败:', error);
        wx.showToast({ title: '打印数据生成失败', icon: 'none' });
        return;
      }

      // 使用TSC命令打印（标签打印机）
      var tsc = require("../../../utils/GPutils/tsc.js").jpPrinter;
      var command = tsc.createNew();
      
      // 获取标签尺寸（高度已减去2mm间隙）
      var cachedPaperSize = wx.getStorageSync('paperSize') || 1;
      var sizes = {
        1: { width: 40, height: 30 },  // 32-2=30
        2: { width: 40, height: 60 },  // 62-2=60
        3: { width: 50, height: 80 }   // 82-2=80
      };
      var paperSizeMM = sizes[cachedPaperSize] || sizes[1];
      console.log('使用标签尺寸:', paperSizeMM.width, 'x', paperSizeMM.height, 'mm');
      
      // 根据标签尺寸调整参数
      var isVertical = (paperSizeMM.height >= 60);
      
      // 设置标签大小
      command.setSize(paperSizeMM.width, paperSizeMM.height);
      
      // 设置间隙（大多数间隙纸需要 >=2mm）
      command.setGap(2);
      
      // 设置方向
      command.setDirection(0);  // 使用方向0
      
      // 设置参考点
      command.setReference(0, 0);
      // 清除
      command.setCls();
      
      // 根据标签尺寸设置字体和位置
      var fontName = "TSS24.BF2";
      var scale = 2;  // 默认中尺寸和大尺寸
      var rotation = 0;  // 默认不旋转
      var startX = 0;
      var startY = 0;
      var lineHeight = 30;
      
      // DPI计算（203dpi标签机）
      var DPI = 203;
      var DPMM = DPI / 25.4;  // 点/mm
      var FONT_BASE = 24;
      var LINE_SP = 1.10;  // 行间距倍数
      
      // 根据标签尺寸调整 scale 和 startY
      if (paperSizeMM.height <= 30) {
        // 小标签 4*3cm
        scale = 3;
        rotation = 0;
        startX = Math.floor(2 * DPMM);  // 左边距2mm
        startY = Math.floor(2 * DPMM);  // 上边距2mm
        lineHeight = 80;
      } else if (isVertical) {
        // 竖版标签（4*6cm 和 5*8cm）- 使用rotation=270（参考安卓代码）
        scale = 2;
        rotation = 270;  // 旋转270度（Android用ROTATION_270）
        // 竖版布局：x改变（水平三列），y固定（垂直方向）
        // 根据高度设置y坐标
        if (paperSizeMM.height === 60) {
          // 4*6cm 竖版
          startY = 440;  // 参考安卓代码
        } else if (paperSizeMM.height === 80) {
          // 5*8cm 竖版
          startY = 550;  // 调整y坐标
        }
        startX = 40;   // 第一列x坐标（客户名称）
        lineHeight = 0;  // 不需要lineHeight
      }
      
      console.log('标签尺寸:', paperSizeMM.width, 'x', paperSizeMM.height, 'mm');
      console.log('订单数据:', orderArray);
      console.log('字体:', fontName, '放大倍数:', scale);
      console.log('起始位置:', startX, ',', startY);
      console.log('行高:', lineHeight);
      
      // 根据标签尺寸决定打印内容
      // 1号（4*3cm）：只打印客户名称
      // 2号和3号（4*6cm 和 5*8cm）：打印客户名称、商品名称、数量（3号还有备注）
      var printLines = [];
      
      if (paperSizeMM.height === 30) {
        // 1号小尺寸：只收集客户名称（每个订单一张标签）
        for (var i = 0; i < orderArray.length; i++) {
          var order = orderArray[i];
          console.log('处理第', i + 1, '个订单:', order);
          
          // 获取客户名称（协作订单：协作商名称 + nxDepartmentAttrName）
          var customerName = '';
          var depName = order.nxDepartmentEntity ? (order.nxDepartmentEntity.nxDepartmentAttrName || order.nxDepartmentEntity.nxDepartmentName || '') : '';
          customerName = (order.nxDoRequestDistributerName || '') + depName;
          console.log('客户名称:', customerName);
          
          // 小尺寸只打印客户名称
          printLines.push(customerName);
        }
      }
      // 中尺寸和大尺寸的printLines不需要填充，因为会在竖版逻辑中单独处理每个订单
      
      console.log('实际打印行数:', printLines.length);
      console.log('打印内容:', printLines);
      
      // 打印每一行
      if (isVertical) {
        // 竖版（rotation=270）：每个订单单独打印一行标签
        // 注意：orderArray 中每个订单会打印一张标签
        for (var orderIdx = 0; orderIdx < orderArray.length; orderIdx++) {
          var order = orderArray[orderIdx];
          
          // 获取当前订单的打印内容（协作订单：协作商名称 + nxDepartmentAttrName）
          var customerName = '';
          var depName = order.nxDepartmentEntity ? (order.nxDepartmentEntity.nxDepartmentAttrName || order.nxDepartmentEntity.nxDepartmentName || '') : '';
          customerName = (order.nxDoRequestDistributerName || '') + depName;
          
          // 商品名称在商品对象中，不在订单对象中
          // 从 this.data.item 获取商品名称（这是商品对象，包含 nxDgGoodsName）
          var goodsName = '';
          if (that.data.item && that.data.item.nxDgGoodsName) {
            goodsName = that.data.item.nxDgGoodsName;
          } else {
            // 备用方案：尝试从订单对象中查找
          if (order.nxDistributerGoodsEntity) {
            goodsName = order.nxDistributerGoodsEntity.nxDgGoodsName || '';
            }
          }
          
          var quantity = order.nxDoWeight || 0;
          var remark = order.nxDoRemark || '';
          var standard = order.nxDoPrintStandard || '';
          
          // DPI计算（203dpi标签机）
          var DPI = 203;
          var DPMM = DPI / 25.4;  // 点/mm
          var labelWidthPoints = Math.floor(paperSizeMM.width * DPMM);
          var labelHeightPoints = Math.floor(paperSizeMM.height * DPMM);
          
          // x 坐标：水平方向的位置（从左到右），用于让内容在不同列显示
          var x1 = Math.floor(2 * DPMM); // 左边距 2mm（第一列：客户名称）
          var x2 = Math.floor(labelWidthPoints * 0.4); // 40% 位置（第二列：商品名称）
          var x3 = Math.floor(labelWidthPoints * 0.6); // 60% 位置（第三列：数量）
          var x4 = Math.floor(labelWidthPoints * 0.85); // 85% 位置（第四列：备注，仅5*8cm）
          
          // y 坐标：垂直方向的位置（从底部开始），所有内容使用相同的 y 确保在同一行
          var y = labelHeightPoints - Math.floor(8 * DPMM); // 从底部向上偏移 8mm
          
          console.log('竖版 - 第一列（客户）:', customerName, '位置 (x=', x1, ', y=', y, ')');
          console.log('竖版 - 第二列（商品）:', goodsName, '位置 (x=', x2, ', y=', y, ')');
          console.log('竖版 - 第三列（数量）:', '数量：' + quantity + (standard || ''), '位置 (x=', x3, ', y=', y, ')');
          
          // 第一列：客户名称（使用更大的字体）
          if (customerName && customerName.trim()) {
            var departmentFontName = "TSS24.BF2"; // 使用24点字体
            var departmentScale = scale + 2; // 增大 scale 来放大字体（从 2 改为 4）
            command.setText(x1, y, departmentFontName, rotation, departmentScale, departmentScale, customerName);
          }
          
          // 第二列：商品名称（确保有内容才打印）
          if (goodsName && goodsName.trim()) {
          command.setText(x2, y, fontName, rotation, scale, scale, goodsName);
          }
          
          // 第三列：数量（确保有内容才打印）
          if (quantity || standard) {
            var quantityText = '数量：' + (quantity || 0) + (standard || '');
            command.setText(x3, y, fontName, rotation, scale, scale, quantityText);
          }
          
          // 第四列：备注（仅大尺寸且备注存在时）
          if (paperSizeMM.height === 80 && remark && remark.trim()) {
            console.log('竖版 - 第四列（备注）:', '备注：' + remark, '位置 (x=', x4, ', y=', y, ')');
            command.setText(x4, y, fontName, rotation, scale, scale, '备注：' + remark);
          }
        }
      } else {
        // 横版
        for (var i = 0; i < printLines.length; i++) {
          var content = printLines[i];
          var printY = startY + i * lineHeight;
          console.log('横版 - 添加文本:', content, '位置 (', startX, ',', printY, ')');
          console.log('setText 参数:', startX, printY, fontName, rotation, scale, scale, content);
          command.setText(startX, printY, fontName, rotation, scale, scale, content);
        }
      }
      
      console.log('调用 setPagePrint 生成打印数据');
      console.log('旋转角度 rotation =', rotation);
      // 打印
      command.setPagePrint();
      
      // 获取打印数据
      var buff = command.getData();
      console.log('打印数据生成成功，长度:', buff.length);
      console.log('打印数据前20字节:', Array.from(buff.slice(0, 20)));
      
      // 发送打印数据
      this.sendPrintData(buff);
    },

    // 发送打印数据（使用 async/await 可靠发送）
    sendPrintData(buff) {
      console.log('=== sendPrintData 方法开始执行 ===');
      console.log('数据长度:', buff.length);
      
      var that = this;
      
      // 调用内部可靠发送方法
      that.reliableSendPrintData(buff);
    },
    
    // 延迟函数
    delay(ms) {
      return new Promise(function(resolve) {
        setTimeout(resolve, ms);
      });
    },
    
    // 可靠的发送方法（使用 async/await）
    async reliableSendPrintData(buff) {
      var that = this;
      var app = getApp();
      var oneTimeData = 20;
      var totalChunks = Math.ceil(buff.length / oneTimeData);
      
      console.log('总数据长度:', buff.length, '分包数量:', totalChunks);
      console.log('写入特征ID:', app.globalData.BLEInformation.writeCharaterId);
      console.log('设备ID:', app.globalData.BLEInformation.deviceId);
      
      try {
        for (var i = 0; i < totalChunks; i++) {
          console.log('发送第', i + 1, '包，共', totalChunks, '包');
          
          // 计算本包数据大小
          var chunkStart = i * oneTimeData;
          var chunkEnd = Math.min(chunkStart + oneTimeData, buff.length);
          var chunkSize = chunkEnd - chunkStart;
          
          // 跳过空包
          if (chunkSize === 0) {
            console.log('跳过空包');
            continue;
          }
          
          console.log('步骤A: 准备创建数据包');
          var buf = new ArrayBuffer(chunkSize);
          var dataView = new DataView(buf);
          console.log('步骤B: 创建完整数据包，大小:', chunkSize);
          
          console.log('步骤C: 填充数据到 ArrayBuffer');
          for (var j = 0; j < chunkSize; j++) {
            dataView.setUint8(j, buff[chunkStart + j]);
          }
          console.log('步骤D: 数据包填充完成');
          
          // 发送数据包
          await that.sendSingleChunk(buf);
          
          // 延迟15ms（iOS需要）
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
        console.log('步骤E: 准备发送数据包，大小:', buf.byteLength);
        console.log('步骤F: 调用 wx.writeBLECharacteristicValue');
        console.log('设备ID:', app.globalData.BLEInformation.deviceId);
        console.log('服务ID:', app.globalData.BLEInformation.writeServiceId);
        console.log('特征值ID:', app.globalData.BLEInformation.writeCharaterId);
        
        wx.writeBLECharacteristicValue({
          deviceId: app.globalData.BLEInformation.deviceId,
          serviceId: app.globalData.BLEInformation.writeServiceId,
          characteristicId: app.globalData.BLEInformation.writeCharaterId,
          value: buf,
          success: function(res) {
            console.log('步骤G: 数据包发送成功');
            resolve(res);
          },
          fail: function(e) {
            console.log('步骤G失败: 打印失败');
            console.error('错误码:', e.errCode);
            console.error('错误信息:', e.errMsg);
            console.error('完整错误对象:', e);
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
              scrollTopLeft: shelfIndex > 3 ? (shelfIndex - 3) * 50 : 0
            });
          }
        }
      });
    },

    scrollToShelf(e) {
      // 使用节流处理滚动事件，减少触发频率
      // 优化：将节流时间从 150ms 增加到 200ms，使滚动更平滑，减少频繁更新
      if (!this._scrollToShelfThrottle) {
        this._scrollToShelfThrottle = throttle(this._handleScrollToShelf.bind(this), 200);
      }
      this._scrollToShelfThrottle(e);
    },
    
    /**
     * 处理滚动事件的核心逻辑
     */
    _handleScrollToShelf(e) {
      const scrollTop = e.detail.scrollTop; // 获取滚动位置
      const scrollHeight = e.detail.scrollHeight || 0; // 获取内容总高度
      const { grandList, selectedSub, isProgrammaticScroll, scrollTriggerThreshold } = this.data;
      
      if (!grandList || grandList.length === 0) {
        return;
      }
      
      // 如果是程序化滚动，跳过选中状态更新，避免干扰
      if (isProgrammaticScroll) {
        return;
      }
      
      // 优化：使用 scrollTriggerThreshold，增大阈值，避免因计算误差导致的误判和频繁切换
      // scrollTriggerThreshold 默认 80rpx，转换为 px 后约 40-50px
      const rpxRatio = 750 / getApp().globalData.screenWidth;
      const thresholdPx = scrollTriggerThreshold / rpxRatio;
      
      // 优化策略：使用二分查找快速定位当前滚动位置对应的分类
      // 从 loadedOffsets 数组中找到最后一个 top <= scrollTop + threshold 的分类
      let newIndex = -1;
      const { loadedOffsets } = this.data;
      
      if (loadedOffsets && loadedOffsets.length > 0) {
        // 使用二分查找，O(log n) 时间复杂度
        const target = scrollTop + thresholdPx * 0.5;
        const foundIndex = binarySearchLastLessOrEqual(loadedOffsets, target);
        if (foundIndex !== -1) {
          newIndex = foundIndex;
        }
      }
      
      // 如果二分查找没找到（可能数组为空或数据未准备好），使用备用逻辑
      if (newIndex === -1) {
        for (let i = grandList.length - 1; i >= 0; i--) {
        const category = grandList[i];
          if (category.loaded && category.offsetTop !== undefined) {
            if (category.offsetTop <= scrollTop + thresholdPx * 0.5) {
            newIndex = i;
              break;
          }
        }
      }
      }
      
      // 如果还是没找到（滚动位置在第一个分类之前），选中第一个分类
      if (newIndex === -1 && grandList.length > 0) {
        for (let i = 0; i < grandList.length; i++) {
          if (grandList[i].loaded) {
            newIndex = i;
            break;
          }
        }
      }
      
      // 关键优化：只有当索引真的发生变化时，才 setData
      // 只更新选中状态（高亮），不触发左侧菜单滚动，避免抖动和不稳定
      if (newIndex !== -1 && newIndex !== selectedSub) {
        // 计算左侧滚动位置,保持选中项在合适的位置
        let left_ = 0;
        if (newIndex > 3) {
          left_ = (newIndex - 3) * 50; // 50是每个分类项的高度
        }
        
        // 只更新 selectedSub 和 scrollTopLeft，不设置 toView，避免触发右侧滚动
        this.setData({
          selectedSub: newIndex,
          scrollTopLeft: left_
          // 移除 toView，避免触发右侧滚动导致不稳定
        });
      }
      
      // 滚动时，检查是否需要加载更多分类（只在接近底部时触发）
      this.checkAndLoadMoreCategories(scrollTop, scrollHeight);
    },
    
    /**
     * 检查并加载更多分类（优化：只在接近底部时触发，避免频繁请求）
     */
    checkAndLoadMoreCategories(scrollTop, scrollHeight) {
      // 加载锁：避免频繁触发加载
      if (this._loadingNextCategory) {
        return;
      }
      
      const grandList = this.data.grandList;
      if (!grandList || grandList.length === 0) {
        return;
      }
      
      // 优化：只在接近底部时触发加载（距离底部 300px 以内）
      const viewportHeight = this.data.contentHeight ? this.data.contentHeight / (750 / getApp().globalData.screenWidth) : 0;
      const distanceToBottom = scrollHeight - scrollTop - viewportHeight;
      
      // 如果距离底部还远，不触发加载
      if (distanceToBottom > 300 && scrollTop > 0) {
        return;
      }
      
      // 找到第一个未加载且未在加载中的分类
      const nextUnloadedIndex = grandList.findIndex(c => !c.loaded && !c.loading);
      
      if (nextUnloadedIndex !== -1) {
        // 设置加载锁
        this._loadingNextCategory = true;
        
        const category = grandList[nextUnloadedIndex];
        console.log(`[checkAndLoadMoreCategories] 接近底部，加载分类[${nextUnloadedIndex}]：${category.nxDfgFatherGoodsName}`);
        
        this.loadCategoryGoodsDetail(category.nxDistributerFatherGoodsId, nextUnloadedIndex)
          .then(() => {
            // 加载完成后，检查是否需要继续加载（保证至少10个商品）
            const currentCount = this.countCategoryTotalGoods();
            if (currentCount < 10) {
              this.loadCategoryGoodsUntilMinCount(10);
            } else {
              // 使用 debounce 版本，避免频繁触发
              this.scheduleCalcOffsets();
            }
            // 释放加载锁
            this._loadingNextCategory = false;
          })
          .catch(err => {
            console.error(`[checkAndLoadMoreCategories] 加载分类[${nextUnloadedIndex}]失败:`, err);
            // 加载失败也要释放锁
            this._loadingNextCategory = false;
          });
      } else {
        // 没有更多未加载的分类，释放锁（虽然可能本来就是 false）
        this._loadingNextCategory = false;
      }
    },

    // 发现并缓存可写特征值
    discoverAndCacheWritableChar(customerNames) {
      var that = this;
      var app = getApp();
      
      return new Promise(function(resolve, reject) {
        console.log('开始发现服务和特征...');
        
        wx.getBLEDeviceServices({
          deviceId: app.globalData.BLEInformation.deviceId,
          success: function(res) {
            console.log('获取服务列表成功:', res);
            var services = res.services || [];
            
            // 优先找含 FFF0、FFF2、180F 的服务
            var targetServices = services.filter(function(s) {
              return /fff0/i.test(s.uuid) || /ffe0/i.test(s.uuid) || /180f/i.test(s.uuid) || /fff2/i.test(s.uuid);
            });
            
            var service = targetServices[0] || services[0];
            
            if (!service) {
              reject(new Error('未发现可用服务'));
              return;
            }
            
            console.log('选择服务:', service.uuid);
            
            wx.getBLEDeviceCharacteristics({
              deviceId: app.globalData.BLEInformation.deviceId,
              serviceId: service.uuid,
              success: function(chrRes) {
                console.log('获取特征列表成功:', chrRes);
                var chs = chrRes.characteristics || [];
                
                // 优先选择 writeNoResponse，其次 write
                var writable = null;
                for (var i = 0; i < chs.length; i++) {
                  if (chs[i].properties.writeNoResponse) {
                    writable = chs[i];
                    console.log('找到 writeNoResponse 特征:', writable.uuid);
                    break;
                  }
                }
                
                if (!writable) {
                  for (var i = 0; i < chs.length; i++) {
                    if (chs[i].properties.write) {
                      writable = chs[i];
                      console.log('找到 write 特征:', writable.uuid);
                      break;
                    }
                  }
                }
                
                if (!writable) {
                  reject(new Error('未发现可写特征'));
                  return;
                }
                
                // 找一个 notify 特征备用
                var notifyChar = null;
                for (var i = 0; i < chs.length; i++) {
                  if (chs[i].properties.notify) {
                    notifyChar = chs[i];
                    console.log('找到 notify 特征:', notifyChar.uuid);
                    break;
                  }
                }
                
                // 更新全局数据
                app.globalData.BLEInformation.writeServiceId = service.uuid;
                app.globalData.BLEInformation.writeCharaterId = writable.uuid;
                
                if (notifyChar) {
                  app.globalData.BLEInformation.notifyCharaterId = notifyChar.uuid;
                  app.globalData.BLEInformation.notifyServiceId = service.uuid;
                }
                
                // 更新缓存
                wx.setStorageSync('bleDeviceInfo', app.globalData.BLEInformation);
                
                console.log('特征发现完成，可写特征ID:', writable.uuid);
                
                // 开启 notify（如果存在）
                that.ensureNotifyEnabled(app.globalData.BLEInformation.deviceId, service.uuid, notifyChar ? notifyChar.uuid : null)
                  .then(function() {
                    console.log('准备开始打印');
                    wx.hideLoading();
                    that.doPrint(customerNames);
                  })
                  .catch(function(e) {
                    console.error('开启 notify 失败，继续打印:', e);
                    wx.hideLoading();
                    that.doPrint(customerNames);
                  });
              },
              fail: reject
            });
          },
          fail: reject
        });
      });
    },
    
    // 确保 notify 已开启
    ensureNotifyEnabled(deviceId, serviceId, notifyCharId) {
      if (!notifyCharId) {
        console.log('没有 notify 特征，跳过开启');
        return Promise.resolve();
      }
      
      return new Promise(function(resolve, reject) {
        console.log('尝试开启 notify...');
        wx.notifyBLECharacteristicValueChange({
          deviceId: deviceId,
          serviceId: serviceId,
          characteristicId: notifyCharId,
          state: true,
          success: function() {
            console.log('notify 开启成功');
            resolve();
          },
          fail: function(e) {
            console.log('notify 开启失败，继续:', e);
            resolve(); // 即使失败也继续
          }
        });
      });
    },

  




})
