# 货架库存损耗管理 - API接口文档

## 概述

本文档描述了NX系统中货架库存损耗管理的3个核心接口，用于处理库存的损耗、退货和废弃操作。

所有接口都采用 **FIFO（先进先出）** 原则扣减库存，确保成本核算准确。

---

## 接口列表

### 1. 添加损耗记录

#### 接口信息
- **URL**: `/api/nxdistributergoodsshelfstockreduce/addLoss`
- **请求方式**: `POST`
- **功能**: 记录商品损耗，按FIFO扣减库存并计算成本

#### 请求参数

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| disId | Integer | 是 | 批发商ID |
| disGoodsId | Integer | 是 | 商品ID |
| weight | String | 是 | 损耗重量 |
| userId | Integer | 是 | 操作用户ID |

#### 业务逻辑

1. 查询该商品的所有库存批次（按入库日期排序，FIFO）
2. 从最早的批次开始扣减，直到满足损耗重量
3. 更新每个批次的剩余重量和剩余金额
4. 创建损耗扣减记录（type=3）
5. 计算总损耗成本

#### 返回示例

**成功响应**：
```json
{
  "code": 0,
  "msg": "success",
  "data": {
    "totalWeight": "5.5",
    "totalCost": "27.5"
  }
}
```

**失败响应**：
```json
{
  "code": 500,
  "msg": "库存不足，还差2.5无法损耗"
}
```

#### 扣减记录字段说明

创建的 `NxDistributerGoodsShelfStockReduceEntity` 记录包含：
- `nxDgssrType`: 3（损耗类型）
- `nxDgssrCostWeight`: 损耗重量
- `nxDgssrCostSubtotal`: 损耗成本
- `nxDgssrLossWeight`: 损耗重量（同costWeight）
- `nxDgssrLossSubtotal`: 损耗成本（同costSubtotal）
- `nxDgssrDate`: 损耗日期
- `nxDgssrMonth`: 损耗月份
- `nxDgssrWeek`: 损耗周

---

### 2. 添加退货记录

#### 接口信息
- **URL**: `/api/nxdistributergoodsshelfstockreduce/addReturn`
- **请求方式**: `POST`
- **功能**: 记录商品退货，按FIFO扣减库存并计算成本

#### 请求参数

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| disId | Integer | 是 | 批发商ID |
| disGoodsId | Integer | 是 | 商品ID |
| weight | String | 是 | 退货重量 |
| userId | Integer | 是 | 操作用户ID |

#### 业务逻辑

1. 查询该商品的所有库存批次（按入库日期排序，FIFO）
2. 从最早的批次开始扣减，直到满足退货重量
3. 更新每个批次的剩余重量和剩余金额
4. 创建退货扣减记录（type=4）
5. 计算总退货成本

#### 返回示例

**成功响应**：
```json
{
  "code": 0,
  "msg": "success",
  "data": {
    "totalWeight": "10.0",
    "totalCost": "50.0"
  }
}
```

**失败响应**：
```json
{
  "code": 500,
  "msg": "库存不足，还差3.0无法退货"
}
```

#### 扣减记录字段说明

创建的 `NxDistributerGoodsShelfStockReduceEntity` 记录包含：
- `nxDgssrType`: 4（退货类型）
- `nxDgssrCostWeight`: 退货重量
- `nxDgssrCostSubtotal`: 退货成本
- `nxDgssrReturnWeight`: 退货重量（同costWeight）
- `nxDgssrReturnSubtotal`: 退货成本（同costSubtotal）
- `nxDgssrDate`: 退货日期
- `nxDgssrMonth`: 退货月份
- `nxDgssrWeek`: 退货周

---

### 3. 添加废弃记录

#### 接口信息
- **URL**: `/api/nxdistributergoodsshelfstockreduce/addWaste`
- **请求方式**: `POST`
- **功能**: 记录商品废弃，按FIFO扣减库存并计算成本

#### 请求参数

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| disId | Integer | 是 | 批发商ID |
| disGoodsId | Integer | 是 | 商品ID |
| weight | String | 是 | 废弃重量 |
| userId | Integer | 是 | 操作用户ID |

#### 业务逻辑

1. 查询该商品的所有库存批次（按入库日期排序，FIFO）
2. 从最早的批次开始扣减，直到满足废弃重量
3. 更新每个批次的剩余重量和剩余金额
4. 创建废弃扣减记录（type=2）
5. 计算总废弃成本

#### 返回示例

**成功响应**：
```json
{
  "code": 0,
  "msg": "success",
  "data": {
    "totalWeight": "3.0",
    "totalCost": "15.0"
  }
}
```

**失败响应**：
```json
{
  "code": 500,
  "msg": "库存不足，还差1.5无法废弃"
}
```

#### 扣减记录字段说明

创建的 `NxDistributerGoodsShelfStockReduceEntity` 记录包含：
- `nxDgssrType`: 2（废弃类型）
- `nxDgssrCostWeight`: 废弃重量
- `nxDgssrCostSubtotal`: 废弃成本
- `nxDgssrWasteWeight`: 废弃重量（同costWeight）
- `nxDgssrWasteSubtotal`: 废弃成本（同costSubtotal）
- `nxDgssrDate`: 废弃日期
- `nxDgssrMonth`: 废弃月份
- `nxDgssrWeek`: 废弃周

---

## 通用说明

### FIFO扣减原则

所有3个接口都遵循 **先进先出（FIFO）** 原则：

1. **查询库存批次**：按 `nx_dgss_inventory_date`（入库日期）升序排序
2. **优先扣减最早批次**：从最早入库的批次开始扣减
3. **跨批次扣减**：如果单个批次不够，自动扣减下一个批次
4. **成本计算**：每个批次按其采购单价计算成本，累加得到总成本

### 库存更新

每次扣减都会更新库存批次的：
- `nx_dgss_rest_weight`: 剩余重量 = 原剩余重量 - 扣减重量
- `nx_dgss_rest_subtotal`: 剩余金额 = 剩余重量 × 采购单价

### 扣减记录类型

| type值 | 类型名称 | 说明 |
|--------|---------|------|
| 0 | 销售 | 订单出货（已有，在订单称重时创建） |
| 1 | 销售成本 | 成本扣减（已有） |
| 2 | 废弃 | 商品废弃（新增接口） |
| 3 | 损耗 | 商品损耗（新增接口） |
| 4 | 退货 | 商品退货（新增接口） |

### 错误处理

#### 库存不足
如果库存总量小于需要扣减的重量，接口会返回错误，并提示还差多少无法完成操作。

#### 没有库存
如果商品没有任何库存批次（或剩余重量都为0），接口会返回 "没有库存可以XXX"。

### 调用示例

#### JavaScript (前端调用)

```javascript
// 添加损耗
$.ajax({
    url: '/api/nxdistributergoodsshelfstockreduce/addLoss',
    type: 'POST',
    data: {
        disId: 56,
        disGoodsId: 22688,
        weight: '5.5',
        userId: 100000
    },
    success: function(res) {
        if(res.code === 0) {
            console.log('损耗成功，总成本：' + res.data.totalCost);
        } else {
            console.error('损耗失败：' + res.msg);
        }
    }
});

// 添加退货
$.ajax({
    url: '/api/nxdistributergoodsshelfstockreduce/addReturn',
    type: 'POST',
    data: {
        disId: 56,
        disGoodsId: 22688,
        weight: '10.0',
        userId: 100000
    },
    success: function(res) {
        if(res.code === 0) {
            console.log('退货成功，总成本：' + res.data.totalCost);
        } else {
            console.error('退货失败：' + res.msg);
        }
    }
});

// 添加废弃
$.ajax({
    url: '/api/nxdistributergoodsshelfstockreduce/addWaste',
    type: 'POST',
    data: {
        disId: 56,
        disGoodsId: 22688,
        weight: '3.0',
        userId: 100000
    },
    success: function(res) {
        if(res.code === 0) {
            console.log('废弃成功，总成本：' + res.data.totalCost);
        } else {
            console.error('废弃失败：' + res.msg);
        }
    }
});
```

---

## 数据库影响

### 影响的表

#### 1. `nx_distributer_goods_shelf_stock`（库存批次表）
- 更新字段：
  - `nx_dgss_rest_weight`: 剩余重量减少
  - `nx_dgss_rest_subtotal`: 剩余金额减少

#### 2. `nx_distributer_goods_shelf_stock_reduce`（库存扣减记录表）
- 新增记录：
  - 每次扣减操作会创建一条或多条记录
  - 记录包含扣减类型、重量、成本、操作人、时间等信息

### 数据示例

#### 扣减前的库存批次
```
批次ID: 100
入库日期: 2025-10-26
采购单价: 5.0
原始重量: 20.0
剩余重量: 20.0
剩余金额: 100.0
```

#### 执行损耗操作（重量=8.0）后
**库存批次更新**：
```
批次ID: 100
剩余重量: 12.0  (20.0 - 8.0)
剩余金额: 60.0   (12.0 × 5.0)
```

**创建扣减记录**：
```
扣减记录ID: 501
类型: 3 (损耗)
关联批次ID: 100
损耗重量: 8.0
损耗成本: 40.0  (8.0 × 5.0)
操作日期: 2025-10-27
操作用户: 100000
```

---

## 使用场景

### 1. 损耗（addLoss）
**使用场景**：
- 商品在搬运、存储过程中发生物理损耗
- 蔬菜水果的自然损耗（水分流失、腐烂等）
- 包装破损导致的重量减少

**示例**：土豆在储存过程中水分蒸发，重量从100斤减少到95斤，损耗5斤。

### 2. 退货（addReturn）
**使用场景**：
- 向供应商退回不合格商品
- 客户退货后退回供应商
- 商品质量问题需要退换

**示例**：采购的20斤青椒有5斤腐烂，退回给供应商。

### 3. 废弃（addWaste）
**使用场景**：
- 商品过期需要报废
- 质量严重问题无法退货，只能废弃
- 因卫生或安全问题需要销毁

**示例**：发现10斤西红柿已经完全腐烂，无法销售和退货，只能废弃处理。

---

## 注意事项

### 1. 库存不足处理
如果当前库存不足以满足操作重量，接口会返回错误，**不会部分扣减**。

**示例**：
- 当前库存：8.0斤
- 请求损耗：10.0斤
- 结果：操作失败，返回 "库存不足，还差2.0无法损耗"
- 库存状态：**不变**（8.0斤）

### 2. FIFO跨批次扣减
如果需要扣减的重量大于单个批次，会自动从多个批次扣减。

**示例**：
需要损耗15斤，当前有3个批次：
- 批次1（最早）：剩余10斤，单价4元 → 扣减10斤，成本40元
- 批次2：剩余8斤，单价5元 → 扣减5斤，成本25元
- 批次3（最新）：剩余12斤 → 不扣减

**结果**：
- 总扣减：15斤
- 总成本：65元（40+25）
- 创建2条扣减记录

### 3. 成本计算
成本按照每个批次的 **采购单价** 计算，不同批次的单价可能不同。

### 4. 日志输出
每个接口都会输出详细的日志，包括：
- 操作参数
- 查询到的库存批次数量
- 每个批次的扣减详情
- 最终结果

---

## 与订单销售扣减的区别

| 对比项 | 订单销售扣减（type=0/1） | 损耗/退货/废弃（type=2/3/4） |
|--------|------------------------|---------------------------|
| 触发方式 | 订单称重时自动触发 | 手动调用接口 |
| 关联对象 | 关联订单ID（nxDgssrNxDepOrderId） | 不关联订单 |
| 业务含义 | 正常销售出货 | 非销售的库存减少 |
| 收入影响 | 有销售收入 | 无销售收入，纯成本损失 |
| 字段填充 | produceWeight/produceSubtotal | lossWeight/wasteWeight/returnWeight |

---

## 统计查询支持

这3种类型的扣减记录可以在以下统计接口中查询：

### 1. 出货成本统计汇总
**接口**: `/api/nxdistributerpurchasegoods/getNxGoodsCostStatistics`

返回包含：
- 总出货成本
- 销售成本（type=1）
- 废弃成本（type=2）
- 损耗成本（type=3）
- 各类型的商品种类数

### 2. 出货商品列表
**接口**: `/api/nxdistributerpurchasegoods/getNxGoodsCostList`

可按类型筛选：
- `type="sales"` - 查询销售记录
- `type="waste"` - 查询废弃记录
- `type="loss"` - 查询损耗记录
- 不传type - 查询全部

---

## 测试建议

### 测试步骤

1. **准备测试数据**：
   - 确保商品有库存批次（通过接收采购商品创建）
   - 记录当前库存的剩余重量和金额

2. **执行损耗操作**：
   ```
   POST /api/nxdistributergoodsshelfstockreduce/addLoss
   disId=56&disGoodsId=22688&weight=5.0&userId=100000
   ```

3. **验证结果**：
   - 检查返回的 `totalCost` 是否正确
   - 查询库存批次，确认剩余重量和金额已更新
   - 查询扣减记录表，确认记录已创建
   - 调用统计接口，确认损耗统计正确

4. **测试边界情况**：
   - 扣减重量 = 库存重量（刚好扣完）
   - 扣减重量 > 库存重量（库存不足）
   - 库存为0时操作（应该报错）
   - 跨多个批次扣减

### SQL验证查询

```sql
-- 查看商品的库存批次
SELECT 
    nx_distributer_goods_shelf_stock_id AS '批次ID',
    nx_dgss_inventory_date AS '入库日期',
    nx_dgss_price AS '单价',
    nx_dgss_weight AS '原始重量',
    nx_dgss_rest_weight AS '剩余重量',
    nx_dgss_rest_subtotal AS '剩余金额'
FROM nx_distributer_goods_shelf_stock
WHERE nx_dgss_nx_dis_goods_id = 22688
    AND nx_dgss_rest_weight > 0
ORDER BY nx_dgss_inventory_date ASC;

-- 查看扣减记录
SELECT 
    nx_distributer_goods_shelf_stock_reduce_id AS '记录ID',
    nx_dgssr_type AS '类型',
    nx_dgssr_date AS '日期',
    nx_dgssr_cost_weight AS '成本重量',
    nx_dgssr_cost_subtotal AS '成本金额',
    nx_dgssr_loss_weight AS '损耗重量',
    nx_dgssr_waste_weight AS '废弃重量',
    nx_dgssr_return_weight AS '退货重量'
FROM nx_distributer_goods_shelf_stock_reduce
WHERE nx_dgssr_nx_dis_goods_id = 22688
ORDER BY nx_dgssr_full_time DESC
LIMIT 10;
```

---

## 技术实现细节

### 关键代码逻辑

```java
// 1. 查询库存批次（FIFO排序）
Map<String, Object> map = new HashMap<>();
map.put("disGoodsId", disGoodsId);
map.put("restWeight", 0);  // 只查询有剩余重量的批次
List<NxDistributerGoodsShelfStockEntity> stockEntities = 
    nxDistributerGoodsShelfStockService.queryShelfStockListByParams(map);

// 2. FIFO扣减循环
BigDecimal remainingWeight = needWeight;
for (NxDistributerGoodsShelfStockEntity stockEntity : stockEntities) {
    // 计算本批次可扣减的重量
    BigDecimal deductWeight = Math.min(remainingWeight, stockRestWeight);
    
    // 计算本批次成本
    BigDecimal batchCost = deductWeight × stockPrice;
    
    // 更新库存剩余
    stockEntity.setNxDgssRestWeight(stockRestWeight - deductWeight);
    stockEntity.setNxDgssRestSubtotal(newRestWeight × stockPrice);
    
    // 创建扣减记录
    // ...
    
    remainingWeight -= deductWeight;
    if (remainingWeight <= 0) break;
}
```

### 数据库事务
建议在调用这些接口时使用事务处理，确保库存更新和扣减记录创建的原子性。

---

## 版本历史

| 版本 | 日期 | 修改内容 | 作者 |
|------|------|---------|------|
| 1.0 | 2025-10-27 | 初始版本，新增损耗、退货、废弃3个接口 | AI Assistant |

---

## 相关文档

- [采购日期统计接口对比说明.md](./采购日期统计接口对比说明.md) - 包含出货成本统计接口文档
- [货架管理-API接口文档.md](./货架管理-API接口文档.md) - 货架管理相关接口

---

**备注**：所有接口都已添加详细的日志输出，便于调试和问题排查。

