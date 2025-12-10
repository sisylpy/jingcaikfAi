-- 查询订单表中有订单，但对应的部门在部门表中已被删除的记录
-- ⚠️ 注意：请根据实际数据库表名和字段名修改以下 SQL
-- 常见的表名可能是：nx_department_orders, nxDepartmentOrders, department_orders 等
-- 常见的字段名可能是：nx_do_dep_id, nxDoDepId, dep_id, department_id 等

-- ============================================
-- 方案1：使用 LEFT JOIN（推荐）
-- ============================================
-- 请修改以下表名和字段名：
-- - 订单表名：可能是 nx_department_orders 或 nxDepartmentOrders
-- - 部门表名：可能是 nx_department 或 nxDepartment 或 department
-- - 订单表的部门ID字段：可能是 nx_do_dep_id 或 nxDoDepId 或 dep_id
-- - 部门表的主键字段：可能是 nx_department_id 或 nxDepartmentId 或 department_id
-- - 订单表的主键字段：可能是 nx_department_orders_id 或 nxDepartmentOrdersId

SELECT 
    o.*  -- 或者指定具体字段，如：o.nx_department_orders_id, o.nx_do_dep_id, o.nx_do_quantity 等
FROM 
    nx_department_orders o  -- ⚠️ 请修改为实际的订单表名
LEFT JOIN 
    nx_department d ON o.nx_do_dep_id = d.nx_department_id  -- ⚠️ 请修改为实际的字段名
WHERE 
    d.nx_department_id IS NULL  -- ⚠️ 请修改为实际的部门表主键字段名
    AND o.nx_do_dep_id IS NOT NULL;  -- ⚠️ 请修改为实际的订单表部门ID字段名

-- ============================================
-- 方案2：使用 NOT EXISTS（性能可能更好）
-- ============================================
SELECT 
    o.*
FROM 
    nx_department_orders o  -- ⚠️ 请修改为实际的订单表名
WHERE 
    o.nx_do_dep_id IS NOT NULL  -- ⚠️ 请修改为实际的订单表部门ID字段名
    AND NOT EXISTS (
        SELECT 1 
        FROM nx_department d  -- ⚠️ 请修改为实际的部门表名
        WHERE d.nx_department_id = o.nx_do_dep_id  -- ⚠️ 请修改为实际的字段名
    );

-- ============================================
-- 方案3：使用 NOT IN（注意 NULL 值处理）
-- ============================================
SELECT 
    o.*
FROM 
    nx_department_orders o  -- ⚠️ 请修改为实际的订单表名
WHERE 
    o.nx_do_dep_id IS NOT NULL  -- ⚠️ 请修改为实际的订单表部门ID字段名
    AND o.nx_do_dep_id NOT IN (  -- ⚠️ 请修改为实际的订单表部门ID字段名
        SELECT nx_department_id  -- ⚠️ 请修改为实际的部门表主键字段名
        FROM nx_department  -- ⚠️ 请修改为实际的部门表名
        WHERE nx_department_id IS NOT NULL  -- ⚠️ 请修改为实际的部门表主键字段名
    );

-- ============================================
-- 统计查询：统计有多少订单的部门已被删除
-- ============================================
SELECT 
    COUNT(*) AS 受影响订单数,
    COUNT(DISTINCT o.nx_do_dep_id) AS 已删除部门数  -- ⚠️ 请修改为实际的订单表部门ID字段名
FROM 
    nx_department_orders o  -- ⚠️ 请修改为实际的订单表名
LEFT JOIN 
    nx_department d ON o.nx_do_dep_id = d.nx_department_id  -- ⚠️ 请修改为实际的字段名
WHERE 
    d.nx_department_id IS NULL  -- ⚠️ 请修改为实际的部门表主键字段名
    AND o.nx_do_dep_id IS NOT NULL;  -- ⚠️ 请修改为实际的订单表部门ID字段名

-- ============================================
-- 按已删除部门分组统计
-- ============================================
SELECT 
    o.nx_do_dep_id AS 已删除的部门ID,  -- ⚠️ 请修改为实际的订单表部门ID字段名
    COUNT(*) AS 订单数量,
    SUM(CASE WHEN o.nx_do_weight IS NULL OR o.nx_do_weight = 0 THEN 1 ELSE 0 END) AS 未出货订单数,  -- ⚠️ 请修改为实际的出货数量字段名
    SUM(CASE WHEN o.nx_do_weight IS NOT NULL AND o.nx_do_weight > 0 THEN 1 ELSE 0 END) AS 已出货订单数  -- ⚠️ 请修改为实际的出货数量字段名
FROM 
    nx_department_orders o  -- ⚠️ 请修改为实际的订单表名
LEFT JOIN 
    nx_department d ON o.nx_do_dep_id = d.nx_department_id  -- ⚠️ 请修改为实际的字段名
WHERE 
    d.nx_department_id IS NULL  -- ⚠️ 请修改为实际的部门表主键字段名
    AND o.nx_do_dep_id IS NOT NULL  -- ⚠️ 请修改为实际的订单表部门ID字段名
GROUP BY 
    o.nx_do_dep_id  -- ⚠️ 请修改为实际的订单表部门ID字段名
ORDER BY 
    订单数量 DESC;

