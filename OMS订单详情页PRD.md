# OMS 订单详情页 PRD

> **文档目的**：为另一个平台的订单详情页开发提供完整的参考规范，涵盖数据模型、页面构成、视觉规范和交互逻辑。
>
> **对应源码**：`src/pages/orders/OrderDetail.tsx`
>
> **版本**：v1.0 | **日期**：2026-07-17

---

## 目录

1. [页面概述](#一页面概述)
2. [核心数据模型](#二核心数据模型)
3. [页面整体布局](#三页面整体布局)
4. [模块一：头部状态卡片](#四模块一头部状态卡片)
5. [模块二：7节点流程状态追踪器](#五模块二7节点流程状态追踪器)
6. [模块三：包裹列表](#六模块三包裹列表)
7. [模块四：商品明细](#七模块四商品明细)
8. [模块五：供应商协同](#八模块五供应商协同)
9. [模块六：右侧信息栏](#九模块六右侧信息栏)
10. [状态推导规则](#十状态推导规则)
11. [视觉设计规范](#十一视觉设计规范)
12. [交互行为规范](#十二交互行为规范)
13. [完整组件树](#十三完整组件树)
14. [数据字段清单](#十四数据字段清单)

---

## 一、页面概述

### 1.1 页面路由

```
/orders/:orderNo
```

示例：`/orders/OMS202607160001`

### 1.2 页面功能

订单详情页是 OMS 系统的核心页面，用于展示单个订单的完整信息，包括：

- 订单基本信息和当前状态
- 履约进度（7节点流程追踪器）
- 包裹拆分与物流详情
- 商品明细（SKU级别）
- 供应商协同信息（缺件场景）
- 关联异常工单
- 电子交货单
- 操作日志（审计追溯）

### 1.3 数据来源

页面数据从以下数据源获取：

| 数据 | 来源 |
|------|------|
| 订单主体信息 | `mockOrders.find(o => o.orderNo === orderNo)` |
| 包裹列表 | `order.packages` |
| 物流轨迹 | `order.packages[].trackingNodes` |
| 关联异常 | `mockExceptions.filter(e => e.orderNo === orderNo)` |
| 操作日志 | `getOperationLogs(order)` |
| 电子交货单 | `mockDeliveryNotes.find(dn => dn.orderNo === orderNo)` |

---

## 二、核心数据模型

### 2.1 三层结构（Order → Package → LineItem）

```
Order（订单）
 ├── shortagePolicy: "SPLIT" | "HOLD"    // 缺件处理策略
 ├── packages: Package[]                  // 1:N 关系
 │
 └── Package（包裹）
      ├── packageType: "ORIGINAL" | "SUPPLEMENT"
      ├── status: PackageStatus
      ├── lineItems: LineItem[]           // 1:N 关系
      │
      └── LineItem（行项）
           ├── stockStatus: "IN_STOCK" | "OUT_OF_STOCK" | "PURCHASING"
           └── supplierInfo?: { supplierName, expectedArrivalDate, trackingNumber }
```

### 2.2 订单主状态（12个）

| 状态编码 | 显示名称 | 阶段 | 色值 |
|---------|---------|------|------|
| `PENDING_REVIEW` | 待审核 | 审核 | neutral `#6B7280` |
| `ORDER_TERMINATED` | 订单已终止 | 终止 | error `#DC2626` |
| `CANCELLED` | 已取消 | 终止 | neutral `#6B7280` |
| `SCHEDULING` | 排单中 | 履约 | normal `#4F46E5` |
| `PICKING` | 拣货中 | 履约 | normal `#4F46E5` |
| `READY_TO_SHIP` | 待发货 | 履约 | normal `#4F46E5` |
| `PARTIALLY_SHIPPED` | 部分发货 | 履约 | warning `#D97706` |
| `IN_TRANSIT` | 运输中 | 履约 | normal `#4F46E5` |
| `DELIVERED` | 已签收 | 履约 | success `#059669` |
| `COMPLETED` | 已完成 | 履约 | success `#059669` |
| `EXCEPTION_HOLD` | 异常挂起 | 异常 | error `#DC2626` |
| `RETURN_PROCESSING` | 退货处理中 | 异常 | warning `#D97706` |

### 2.3 包裹状态（7个）

| 状态 | 含义 |
|------|------|
| `PENDING` | 待处理 |
| `PICKING` | 拣货中 |
| `READY` | 待发货（包裹内所有行项有货） |
| `WAITING_RESTOCK` | 待补货（包裹内有行项缺货） |
| `SHIPPED` | 已发货 |
| `DELIVERED` | 已签收 |
| `COMPLETED` | 已完成 |

### 2.4 行项库存状态（3个）

| 状态 | 含义 | 颜色 |
|------|------|------|
| `IN_STOCK` | 有货 | success `#059669` |
| `OUT_OF_STOCK` | 缺货 | error `#DC2626` |
| `PURCHASING` | 采购中 | warning `#D97706` |

### 2.5 缺件策略

| 策略 | 含义 | 行为 |
|------|------|------|
| `SPLIT` | 拆分发货 | 有货行项→ORIGINAL包裹先发；缺货行项→SUPPLEMENT包裹后发 |
| `HOLD` | 整单挂起 | 等所有行项到齐后统一发货，不会出现部分发货 |

---

## 三、页面整体布局

页面采用**面包屑导航 + 纵向堆叠**的布局方式，整体分为以下区域：

```
┌─────────────────────────────────────────────────────┐
│ 面包屑：订单管理 > 详情 [orderNo]                      │
├─────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────┐ │
│ │          头部状态卡片（始终展开）                   │ │
│ │  - 订单号 + 状态标签 + 策略标签 + 异常数            │ │
│ │  - 经销商 / 下单时间 / 时效等级                    │ │
│ │  - 7节点流程状态追踪器                             │ │
│ └─────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────┐ │
│ │          包裹列表（可折叠，默认展开）                │ │
│ │  - 每个包裹一张卡片                               │ │
│ │  - 内含行项明细表 + 物流轨迹 + 供应商物流            │ │
│ └─────────────────────────────────────────────────┘ │
├──────────────────────────┬──────────────────────────┤
│ 左侧 (span=17)            │ 右侧 (span=7)             │
│ ┌──────────────────────┐ │ ┌──────────────────────┐ │
│ │ 商品明细（始终展开）   │ │ │ 订单信息卡片           │ │
│ │ - 行项汇总表格        │ │ │ - 订单号/业务流程/     │ │
│ │ - VIN码关联           │ │ │   时效等级/履约方式/    │ │
│ │ - 合计金额            │ │ │   基地来源/缺件策略     │ │
│ └──────────────────────┘ │ └──────────────────────┘ │
│                          │ ┌──────────────────────┐ │
│ ┌──────────────────────┐ │ │ 收货信息卡片           │ │
│ │ 供应商协同（条件折叠） │ │ │ - 收货人/电话/地址     │ │
│ │ - 缺件行项供应商信息   │ │ └──────────────────────┘ │
│ └──────────────────────┘ │ ┌──────────────────────┐ │
│                          │ │ 关联异常卡片（条件显示）│ │
│                          │ │ - 异常工单列表         │ │
│                          │ └──────────────────────┘ │
│                          │ ┌──────────────────────┐ │
│                          │ │ 电子交货单卡片（条件）  │ │
│                          │ │ - 交货单号/仓库/状态   │ │
│                          │ └──────────────────────┘ │
│                          │ ┌──────────────────────┐ │
│                          │ │ 操作日志卡片           │ │
│                          │ │ - 时间线展示           │ │
│                          │ └──────────────────────┘ │
└──────────────────────────┴──────────────────────────┘
```

---

## 四、模块一：头部状态卡片

### 4.1 位置与样式

- 位于面包屑下方，页面最顶部
- 使用 Ant Design `Card` 组件
- 白色背景，圆角 8px

### 4.2 显示内容

#### 第一行：返回按钮 + 订单号 + 状态标签组

```
[← 返回]  订单 OMS202607160001  [待审核] [SPLIT 拆分发货] [2个异常] [🚗 随车]
```

标签说明：

| 标签 | 数据来源 | 显示条件 |
|------|---------|---------|
| 状态标签（大号） | `order.status` → `ORDER_STATUS_MAP` | 始终显示 |
| 缺件策略标签 | `order.shortagePolicy` | `shortagePolicy` 有值时显示 |
| 异常数量标签 | `linkedExceptions.length` | > 0 时显示 |
| 运输方式标签 | `order.shippingMethod` | 始终显示：`WITH_VEHICLE`="随车"(紫色), `STANDALONE`="非随"(蓝色) |

#### 第二行：经销商 + 下单时间 + 时效等级

```
经销商: 杭州雅迪旗舰店  下单: 2026-07-16 09:30  [特急]
```

#### 第三行：7节点流程状态追踪器

（详见[第五章](#五模块二7节点流程状态追踪器)）

#### 异常/终止状态提示

- 异常状态（`EXCEPTION_HOLD` / `RETURN_PROCESSING`）：显示红色警告 Tag "⚠️ 订单履约已中断，当前处于异常状态"
- 终止状态（`ORDER_TERMINATED` / `CANCELLED`）：显示灰色 Tag "此订单已终止，不再继续履约"

### 4.3 状态标签颜色映射

```typescript
// 色值体系
const STATUS_COLORS = {
  neutral: '#6B7280',  // 待审核、已取消
  normal: '#4F46E5',   // 排单中、拣货中、待发货、运输中
  warning: '#D97706',  // 部分发货、退货处理中
  error: '#DC2626',    // 订单已终止、异常挂起
  success: '#059669',  // 已签收、已完成
};
```

---

## 五、模块二：7节点流程状态追踪器

### 5.1 节点定义

```typescript
const ORDER_FLOW_NODES = [
  { key: 'order_placed',    label: '下单' },
  { key: 'review_approved',  label: '审核中' },
  { key: 'scheduling_done',  label: '排单中' },
  { key: 'picking',          label: '拣货中' },
  { key: 'ready_to_ship',    label: '待发货' },
  { key: 'in_transit',       label: '运输中' },
  { key: 'delivered',        label: '已签收/完成' },
];
```

### 5.2 订单状态与流程节点映射

```typescript
const STATUS_TO_FLOW_NODE = {
  PENDING_REVIEW: 0,      // → 下单
  SCHEDULING: 1,          // → 审核中
  PICKING: 3,             // → 拣货中（跳过排单中节点）
  READY_TO_SHIP: 4,       // → 待发货
  PARTIALLY_SHIPPED: 5,   // → 运输中
  IN_TRANSIT: 5,          // → 运输中
  DELIVERED: 6,           // → 已签收/完成
  COMPLETED: 6,           // → 已签收/完成
  // 以下状态不显示流程条（返回 -1）
  EXCEPTION_HOLD: -1,
  RETURN_PROCESSING: -1,
  ORDER_TERMINATED: -1,
  CANCELLED: -1,
};
```

### 5.3 视觉渲染规则

#### 配色（雅迪白橙配色）

| 元素 | 颜色 |
|------|------|
| 已完成节点圆点/连线 | `#FF6B00`（橙色） |
| 当前激活节点圆点 | `#FF6B00`（橙色），带发光阴影 `0 0 0 6px rgba(255,107,0,0.10)` |
| 未来节点圆点边框 | `#E8E8E8`（浅灰） |
| 未来节点连线 | `#E8E8E8`（浅灰） |
| 已完成节点内部图标 | 白色 `CheckCircleFilled` |
| 激活节点内部 | 白色小圆点（10px） |

#### 节点状态类型

```
已完成 (i < activeIdx)：  橙色实心圆 + 白色勾号
激活中 (i === activeIdx)：橙色实心圆（28px，比普通大4px）+ 白色内圆点 + 发光阴影
未来 (i > activeIdx)：    白色空心圆 + 灰色边框
```

#### 第二行：节点名称 + 履约摘要

每个节点下方显示两行文字：

| 行 | 样式 |
|----|------|
| 节点名称 | 激活节点：13px / 粗体600 / `#1A1A1A`；未来节点：12px / 常规400 / `#BFBFBF` |
| 履约摘要 | 11px / `#8C8C8C`，未来节点为 `#BFBFBF` |

### 5.4 各节点履约摘要文本规则

| 节点 | 已完成时 | 激活时 | 未来时 |
|------|---------|--------|--------|
| 下单 | `order.createTime` 格式化 | — | — |
| 审核中 | `order.createTime` 格式化 | — | — |
| 排单中 | `"拆为N包裹"` 或 `"整单发出"` | — | 空 |
| 拣货中 | `"拣货已完成"` | `"N包裹缺件等待"` 或 `"N/M包裹拣货中"` | 空 |
| 待发货 | `"已发出"` | `"N包裹缺件等待"` 或 `"N包裹待发货"` | 空 |
| 运输中 | `"运输已完成"` | `"N/M包裹运输中"` | 空 |
| 已签收/完成 | `"N/N包裹已签收"` | — | 空 |

### 5.5 缺件/异常提示条

显示条件：激活节点为"拣货中"（idx=3）或"待发货"（idx=4）且有缺件包裹时

```
┌──────────────────────────────────────────────────────────────┐
│ ⚠️ 包裹2 · YD-FL-001 缺货 / 供应商补货预计 2026-07-22        │
│    包裹3 · YD-BT-002 缺货 / 供应商补货预计 2026-07-25        │
└──────────────────────────────────────────────────────────────┘
```

- 黄色背景 `#FFF7E6`，橙色边框 `#FFD591`
- 文字颜色 `#D46B08`，字号 12px

---

## 六、模块三：包裹列表

### 6.1 显示条件

`order.packages` 存在且长度 > 0 时显示。

### 6.2 折叠区块头部

使用 `CollapsibleSection` 组件（可折叠），默认展开。

#### 摘要行内容

```
📦 包裹列表  [已发货×1] [拣货中×1] [待补货×1]  共 3 个包裹 · 48 件  ▼
```

- 左侧图标：`InboxOutlined`，橙色 `#FF6B00`
- 状态徽章：统计各状态的包裹数量，使用对应颜色 Tag
- 右侧摘要：`共 N 个包裹 · M 件`

### 6.3 单个包裹卡片结构

每个包裹渲染为一张卡片，包含以下区域：

#### 6.3.1 包裹标签栏（始终显示）

```
┌──────────────────────────────────────────────────────────────┐
│ [包裹1] [已签收] | 发货: 2026-07-16 | 到货: 2026-07-18       │
│ 🚚 顺丰速运 · SF123456789012    │                        48件 │
└──────────────────────────────────────────────────────────────┘
```

**显示字段：**

| 字段 | 来源 | 说明 |
|------|------|------|
| 包裹编号 | 索引+1 | `包裹1`，SUPPLEMENT 类型用橙色 Tag |
| 包裹状态 | `pkg.status` → `PACKAGE_STATUS_MAP` | 颜色徽章 |
| 预计发货时间 | `pkg.shipTime` | 已发货显示"发货"，未发货显示"预计发货" |
| 预计到货时间 | `pkg.estimatedArrival` | 已签收时绿色高亮 |
| 物流公司+运单号 | `pkg.logisticsCompany` + `pkg.trackingNo` | 有运单号时显示 |
| 总件数 | `pkg.lineItems.reduce(...)` | 右对齐，灰色小字 |

**包裹卡片整体样式：**
- 已签收包裹：绿色边框 `#059669`，淡绿背景
- 其他包裹：按状态对应颜色，30%透明度边框

#### 6.3.2 行项明细表（始终显示）

包裹卡片内嵌一个小型 Table，列定义：

| 列 | 宽度 | 数据来源 |
|----|------|---------|
| SKU | 100px | `skuCode`（等宽字体） |
| 商品名称 | 180px | `skuName` |
| 数量 | 50px | `quantity`（居中） |
| 库存 | 70px | `stockStatus` → `STOCK_STATUS_MAP` Tag |

#### 6.3.3 物流轨迹（条件显示）

显示条件：包裹有 `trackingNo`（已发货/已签收）

```
┌──────────────────────────────────────────────────────────────┐
│ 🚚 物流轨迹                                                   │
│  ● 顺丰速运已揽收，快递员已收件    07-16 09:30 · 华东分拣中心  │
│  │                                                            │
│  ● 快件已到达分拣中心，正在分拣     07-16 10:45 · 华东分拣中心  │
│  │                                                            │
│  ● 快件已离开分拣中心，发往下一站   07-16 12:00 · 华东分拣中心  │
│  │                                                            │
│  ● 快件已到达南京转运中心           07-16 18:30 · 南京转运中心  │
│  │                                                            │
│  ● 已签收，签收人：本人（顺丰速运）  07-17 10:00 · 南京         │
└──────────────────────────────────────────────────────────────┘
```

**物流节点渲染规则：**

- 每个节点包含：圆点 + 竖线（非最后一个）+ 描述文字 + 时间 + 地点
- 最后一个节点且已签收：绿色圆点 `#059669`
- 其他节点：橙色圆点 `#FF6B00`
- 无详细节点时的兜底文案：`"已签收"` 或 `"运输中 · 预计 YYYY-MM-DD 送达"`

**数据来源：** `pkg.trackingNodes[]`，每个节点包含 `{ time, location, description }`

#### 6.3.4 供应商物流状态（条件显示）

显示条件：包裹有 `supplierStatus`（缺件包裹的补货物流）

```
┌──────────────────────────────────────────────────────────────┐
│ 📤 供应商物流                                                  │
│ [供应商已发货（在途至基地）] 圆通速递 · YT123456789012         │
│    · 发 2026-07-15 · 到基地 2026-07-20                        │
│                                                               │
│  ● 圆通速递已揽收                  07-15 14:00 · 发货地        │
│  │                                                            │
│  ● 快件在运输途中                  07-16 08:00 · 在途中转      │
│  │                                                            │
│  ● 快件已到达基地仓库              07-20 10:00 · 华东仓        │
└──────────────────────────────────────────────────────────────┘
```

**供应商物流状态枚举：**

| 状态 | 标签 | 颜色 |
|------|------|------|
| `PENDING` | 缺件，待供应商发货至基地 | 红色 `#E11D48` |
| `SHIPPED` | 供应商已发货（在途至基地） | 橙色 `#FF6B00` |
| `ARRIVED_AT_BASE` | 供应商已到货，基地待发 | 绿色 `#16A34A` |

**显示字段：**
- 供应商物流公司 + 运单号
- 供应商发货时间
- 供应商预计到基地时间
- 供应商物流轨迹节点（`supplierTrackingNodes[]`）

---

## 七、模块四：商品明细

### 7.1 位置与样式

- 位于页面左侧（`Col span={17}`）
- 使用 Ant Design `Card` 组件
- **始终展开，不可折叠**

### 7.2 卡片头部

```
🛒 商品明细                    [缺 3 件]  共 12 种 · 48 件
```

- 左侧标题图标：`ShoppingCartOutlined`，橙色 `#FF6B00`
- 缺件数：红色 Tag（仅 `shortageCount > 0` 时显示）
- 汇总文本：灰色，12px

### 7.3 VIN码关联行

显示条件：`order.vinCodes.length > 0`

```
关联车架号：[LSVAU2180N2012345] [LSVAU2190N2015678]
```

每个 VIN 码使用紫色 `Tag`，等宽字体。

### 7.4 商品明细表格

#### 列定义

| 列名 | 宽度 | 对齐 | 渲染方式 |
|------|------|------|---------|
| SKU编码 | 120px | 左 | 等宽字体 `monospace`，12px |
| 商品名称 | 200px | 左 | 普通文本 |
| 单价 | 80px | 右 | `¥{value.toLocaleString()}` |
| 数量 | 60px | 中 | 数字 |
| 库存状态 | 90px | 左 | `STOCK_STATUS_MAP` Tag（有货=绿/缺货=红/采购中=橙） |
| 所属包裹 | 80px | 左 | 蓝/橙 Tag，显示"包裹N" |
| 供应商 | 160px | 左 | 缺货时显示 `🏭 供应商名 · 预计 YYYY-MM-DD 到`，橙色文字 |

#### 数据源

商品明细是对**所有包裹行项的平铺汇总**：

```typescript
// 平铺逻辑
const allLineItems = packages.flatMap((p, pkgIdx) =>
  p.lineItems.map(li => ({
    ...li,
    packageLabel: `包裹${pkgIdx + 1}`,
    packageType: p.packageType,
  }))
);
```

若无 packages，则直接从 `order.items` 构建。

#### 异常行项高亮

`stockStatus !== 'IN_STOCK'` 的行添加 CSS class `exception-row`，背景色 `#FFFBEB`（浅黄色）。

### 7.5 合计行

```
合计：48 件 · ¥28,560
```

- 件数：`order.items.reduce((s, i) => s + i.quantity, 0)`
- 金额：橙色 `#FF6B00`，16px 加粗

---

## 八、模块五：供应商协同

### 8.1 显示条件

仅当存在外部采购行项（`stockStatus !== 'IN_STOCK'`）时显示。

### 8.2 折叠区块头部

使用 `CollapsibleSection`，默认折叠。

```
📤 供应商协同    N 个行项涉及外部采购  ▼
```

- 左侧图标：`SendOutlined`，警告色 `#D97706`

### 8.3 展开内容

每个涉及外部采购的行项渲染为一张卡片：

```
┌──────────────────────────────────────────────────────────────┐
│ 石墨烯电池 72V20AH  [缺货]  [包裹2]                            │
│ ┌──────────────────────────────────────────────────────────┐ │
│ │ 供应商          预计到货          运单号                    │ │
│ │ 东方汽配(浙江)   2026-07-22       SF123456789012           │ │
│ └──────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
```

**显示字段：**

| 字段 | 来源 |
|------|------|
| 商品名称 | `li.skuName` |
| 库存状态 | `li.stockStatus` → Tag |
| 所属包裹 | `li.packageLabel` → Tag |
| 供应商名称 | `li.supplierInfo.supplierName` |
| 预计到货日期 | `li.supplierInfo.expectedArrivalDate` |
| 运单号 | `li.supplierInfo.trackingNumber`（无则显示"暂无"） |

---

## 九、模块六：右侧信息栏

位于页面右侧（`Col span={7}`），纵向排列以下卡片：

### 9.1 订单信息卡片

| 字段 | 数据来源 | 渲染 |
|------|---------|------|
| 订单号 | `order.orderNo` | 普通文本 |
| 业务流程 | `order.bizType` → `BIZ_TYPE_MAP` | Tag |
| 时效等级 | `order.urgencyLevel` → `URGENCY_MAP` | 颜色 Tag |
| 履约方式 | `order.fulfillMethod` → `FULFILL_METHOD_MAP` | 文本 |
| 基地来源 | `order.baseSource` | 文本 |
| 缺件策略 | `order.shortagePolicy` | Tag（SPLIT=靛蓝/ HOLD=灰色），无则显示"-" |

### 9.2 收货信息卡片

| 字段 | 数据来源 |
|------|---------|
| 收货人 | `order.receiverName` |
| 电话 | `order.receiverPhone` |
| 地址 | `order.receiverProvince + order.receiverCity + order.receiverDistrict + order.receiverAddress` |

### 9.3 关联异常卡片（条件显示）

显示条件：`linkedExceptions.length > 0`

```
┌──────────────────────────────────────────┐
│ ⚠️ 关联异常 (2)                           │
├──────────────────────────────────────────┤
│ [开箱破损] 经销商开箱发现前刹车片...  [待处理] │
│ [物流丢件] 顺丰运单72小时无更新...    [处理中] │
└──────────────────────────────────────────┘
```

- 左侧红色边框 `3px solid #E11D48`
- 每个异常可点击跳转到异常管理页
- 显示：异常类型 Tag + 描述截断（20字）+ 状态 Tag

**状态颜色：**
- 待处理：`#E11D48`
- 已解决：`#16A34A`
- 其他：`#F59E0B`

### 9.4 电子交货单卡片（条件显示）

显示条件：`deliveryNote` 存在

```
┌──────────────────────────────────────────┐
│ 电子交货单                                │
├──────────────────────────────────────────┤
│ 交货单号：DN-2026070001                   │
│ 仓库：华东仓                               │
│ 状态：[已生成]                             │
│ 总件数：48 件                              │
└──────────────────────────────────────────┘
```

- 左侧橙色边框 `3px solid #FF6B00`

**交货单状态：**
- `GENERATED` → "已生成" (橙色)
- `SHIPPED` → "已发货" (橙色)
- `RECEIVED` → "已签收" (绿色)

### 9.5 操作日志卡片

时间线形式展示，每条日志包含：

| 元素 | 样式 |
|------|------|
| 时间线圆点颜色 | 异常相关=红色 / 签收归档=绿色 / 默认=橙色 `#FF6B00` |
| 操作描述 | 13px 正文 |
| 操作人（角色） | 12px 灰色 |
| 时间戳 | 11px 灰色 |
| 备注 | 11px 灰色斜体（有 remark 时显示） |

---

## 十、状态推导规则

### 10.1 核心原则

**上层状态由下层聚合推导，严禁独立赋值。** 即：
- LineItem.stockStatus → Package.status
- Package.status[] + shortagePolicy → Order.status

### 10.2 包裹状态推导（由行项）

```
IF 所有 lineItems.stockStatus == "IN_STOCK"
  → package.status = READY
ELIF 存在 lineItems.stockStatus in ["OUT_OF_STOCK", "PURCHASING"]
  → package.status = WAITING_RESTOCK
ELSE
  → package.status = PICKING
```

### 10.3 订单主状态推导（由包裹聚合）

采用**木桶效应**：订单状态取所有包裹中"最靠前"的状态。

| 包裹状态集合 | 订单主状态 |
|-------------|-----------|
| 任一包裹 `PENDING` | `SCHEDULING` |
| 任一包裹 `PICKING` | `PICKING` |
| 任一包裹 `WAITING_RESTOCK` + HOLD 策略 | `PICKING` |
| 所有包裹 `READY` | `READY_TO_SHIP` |
| SPLIT策略：ORIGINAL 已 SHIPPED + 仍有未 SHIPPED | `PARTIALLY_SHIPPED` |
| 所有包裹 `SHIPPED` 或更后 | `IN_TRANSIT` |
| 所有包裹 `DELIVERED` 或更后 | `DELIVERED` |
| 所有包裹 `COMPLETED` | `COMPLETED` |

### 10.4 关键约束

- `PARTIALLY_SHIPPED` 仅在 `SPLIT` 策略下出现
- `HOLD` 策略下不会出现部分发货
- 订单状态为 `EXCEPTION_HOLD` / `RETURN_PROCESSING` / `ORDER_TERMINATED` / `CANCELLED` 时不显示流程追踪器（`STATUS_TO_FLOW_NODE` 返回 -1）

---

## 十一、视觉设计规范

### 11.1 色值体系

| 类别 | 色值 | CSS 变量 | 用途 |
|------|------|---------|------|
| 中性灰 | `#6B7280` | `--status-neutral` | 待审核、已取消 |
| 靛蓝 | `#4F46E5` | `--status-normal` | 排单中、拣货中、待发货、运输中 |
| 琥珀 | `#D97706` | `--status-warning` | 部分发货、退货处理中、缺货 |
| 红色 | `#DC2626` | `--status-error` | 订单终止、异常挂起 |
| 翠绿 | `#059669` | `--status-success` | 已签收、已完成 |
| 橙色 | `#FF6B00` | — | 流程追踪器主色、品牌色 |

### 11.2 折叠区块组件规范

```typescript
interface CollapsibleSectionProps {
  title: string;              // 区块标题
  icon?: React.ReactNode;     // 标题前图标
  badge?: React.ReactNode;    // 状态徽章组
  summary: string;            // 右侧摘要文本
  defaultExpanded?: boolean;  // 默认是否展开
  children: React.ReactNode;  // 展开内容
}
```

**交互行为：**
- 点击标题行任意区域触发展开/折叠
- 右侧显示 `UpOutlined` / `DownOutlined` 箭头图标
- 样式：白色背景、圆角 8px、边框 `#F0F0F0`

### 11.3 状态徽章

```
// 大号状态徽章（头部使用）
font-size: 14px; padding: 2px 12px; font-weight: 600;

// 小号标签（表格/列表中使用）
font-size: 11-12px; margin: 0;
```

### 11.4 异常行项高亮

```css
.exception-row {
  background: #FFFBEB;  /* 浅黄色背景 */
}
```

---

## 十二、交互行为规范

### 12.1 页面导航

| 触发 | 行为 |
|------|------|
| 点击面包屑"订单管理" | `navigate('/orders')` |
| 点击返回按钮 `←` | `navigate('/orders')` |
| 点击关联异常工单 | `navigate('/exceptions')` |

### 12.2 折叠/展开

| 区块 | 默认状态 | 触发方式 |
|------|---------|---------|
| 包裹列表 | 展开 | 点击标题行 |
| 供应商协同 | 折叠 | 点击标题行 |

### 12.3 空状态处理

| 场景 | 展示 |
|------|------|
| 订单未找到 | 居中显示"订单未找到" + "返回订单列表"链接 |
| 无 packages | 不渲染包裹列表区块 |
| 无外部采购 | 不渲染供应商协同区块 |
| 无关联异常 | 不渲染关联异常卡片 |
| 无交货单 | 不渲染电子交货单卡片 |
| 异常/终止状态 | 不渲染流程追踪器 |

### 12.4 订单未找到页面

```
           订单未找到
      [返回订单列表]（链接按钮）
```

居中布局，使用 `Title level={3} type="secondary"`。

---

## 十三、完整组件树

```
<OrderDetail>                                  // 主页面组件
  ├── <Breadcrumb>                             // 面包屑导航
  │
  ├── <Card> (头部状态卡片)                      // 始终展开
  │     ├── 返回按钮 <ArrowLeftOutlined>
  │     ├── 订单号 + 状态 Tag + 策略 Tag + 异常 Tag + 运输方式 Tag
  │     ├── 经销商 / 下单时间 / 时效等级
  │     ├── 7节点流程状态追踪器（条件渲染）
  │     │     ├── 第1行：步骤圆点 + 连接线
  │     │     ├── 第2行：节点名称 + 履约摘要
  │     │     └── 缺件/异常提示条（条件渲染）
  │     └── 异常/终止状态提示（条件渲染）
  │
  ├── <CollapsibleSection> (包裹列表)            // 默认展开
  │     └── <包裹卡片> × N
  │           ├── 包裹标签栏（包裹编号/状态/发货时间/到货时间/物流/件数）
  │           ├── <Table> 行项明细（SKU/商品名/数量/库存状态）
  │           ├── 物流轨迹时间线（条件显示）
  │           └── 供应商物流状态（条件显示）
  │
  ├── <Row>
  │     ├── <Col span={17}> (左侧主体)
  │     │     ├── <Card> (商品明细)               // 始终展开，不可折叠
  │     │     │     ├── VIN码关联（条件显示）
  │     │     │     ├── <Table> 商品明细表（7列）
  │     │     │     └── 合计行
  │     │     │
  │     │     └── <CollapsibleSection> (供应商协同) // 条件显示，默认折叠
  │     │           └── 供应商信息卡片 × N
  │     │
  │     └── <Col span={7}> (右侧信息栏)
  │           ├── <Card> (订单信息)
  │           ├── <Card> (收货信息)
  │           ├── <Card> (关联异常 - 条件显示)
  │           ├── <Card> (电子交货单 - 条件显示)
  │           └── <Card> (操作日志 - 时间线)
  └── </Row>
```

---

## 十四、数据字段清单

### 14.1 OrderDTO（订单主体）

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `orderNo` | string | ✅ | 订单号 |
| `dealerId` | string | ✅ | 经销商ID |
| `dealerName` | string | ✅ | 经销商名称 |
| `bizType` | BizType | ✅ | 业务流程：REGULAR/APPOINTMENT/CUSTOM/REQUISITION |
| `urgencyLevel` | UrgencyLevel | ✅ | 时效等级：NORMAL/URGENT/CRITICAL |
| `fulfillMethod` | FulfillMethod | ✅ | 履约方式：DIRECT_SHIP/WAREHOUSE_SHIP |
| `status` | OrderStatus | ✅ | 订单主状态（12个枚举值） |
| `vinCodes` | string[] | ✅ | 关联车架号列表 |
| `baseSource` | string | ✅ | 基地来源（华东/华南/华北/西南） |
| `shortageFlag` | boolean | ✅ | 是否有缺件 |
| `shortagePolicy` | ShortagePolicy? | ❌ | 缺件策略：SPLIT/HOLD |
| `packages` | Package[]? | ❌ | 包裹列表 |
| `skuCount` | number | ✅ | SKU种类数 |
| `totalAmount` | number | ✅ | 订单总金额 |
| `createTime` | string | ✅ | 下单时间（ISO 8601） |
| `receiverProvince` | string | ✅ | 收货省份 |
| `receiverCity` | string | ✅ | 收货城市 |
| `receiverDistrict` | string | ✅ | 收货区县 |
| `receiverAddress` | string | ✅ | 收货详细地址 |
| `receiverName` | string | ✅ | 收货人姓名 |
| `receiverPhone` | string | ✅ | 收货人电话 |
| `items` | OrderItem[] | ✅ | 订单行项（向后兼容） |
| `shippingMethod` | string | ✅ | 运输方式：WITH_VEHICLE/STANDALONE |
| `linkedPlanNo` | string? | ❌ | 关联计划单号 |

### 14.2 Package（包裹）

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `packageId` | string | ✅ | 包裹唯一ID |
| `packageType` | PackageType | ✅ | ORIGINAL/SUPPLEMENT |
| `status` | PackageStatus | ✅ | 包裹状态（7个枚举值） |
| `lineItems` | LineItem[] | ✅ | 行项列表 |
| `trackingNo` | string? | ❌ | 运单号 |
| `logisticsCompany` | string? | ❌ | 物流公司 |
| `shipTime` | string? | ❌ | 发货时间 |
| `estimatedArrival` | string? | ❌ | 预计到货时间 |
| `shippingMethod` | string | ✅ | 运输方式 |
| `trackingNodes` | TrackingNode[]? | ❌ | 物流轨迹节点 |
| `supplierStatus` | SupplierLogisticsStatus? | ❌ | 供应商物流状态 |
| `supplierTrackingNo` | string? | ❌ | 供应商运单号 |
| `supplierLogisticsCompany` | string? | ❌ | 供应商物流公司 |
| `supplierShipTime` | string? | ❌ | 供应商发货时间 |
| `supplierEstimatedArrival` | string? | ❌ | 供应商预计到货 |
| `supplierTrackingNodes` | TrackingNode[]? | ❌ | 供应商物流轨迹 |

### 14.3 LineItem（行项）

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `skuCode` | string | ✅ | SKU编码 |
| `skuName` | string | ✅ | 商品名称 |
| `quantity` | number | ✅ | 订购数量 |
| `unitPrice` | number | ✅ | 单价 |
| `subtotal` | number | ✅ | 小计 |
| `shortageQty` | number | ✅ | 缺货数量 |
| `stockStatus` | StockStatus | ✅ | 库存状态：IN_STOCK/OUT_OF_STOCK/PURCHASING |
| `supplierInfo` | SupplierInfo? | ❌ | 供应商信息（缺货时填充） |
| `belongsToPackageId` | string? | ❌ | 所属包裹ID |

### 14.4 SupplierInfo（供应商信息）

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `supplierName` | string | ✅ | 供应商名称 |
| `expectedArrivalDate` | string | ✅ | 预计到货日期 |
| `trackingNumber` | string? | ❌ | 供应商运单号 |

### 14.5 TrackingNode（物流节点）

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `time` | string | ✅ | 时间（ISO 8601） |
| `location` | string | ✅ | 地点 |
| `description` | string | ✅ | 事件描述 |

### 14.6 OperationLog（操作日志）

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `time` | string | ✅ | 操作时间 |
| `operator` | string | ✅ | 操作人姓名 |
| `role` | string | ✅ | 操作人角色 |
| `action` | string | ✅ | 操作描述 |
| `remark` | string? | ❌ | 备注 |

### 14.7 ExceptionDTO（关联异常）

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `exceptionNo` | string | ✅ | 异常工单号 |
| `orderNo` | string | ✅ | 关联订单号 |
| `exceptionType` | ExceptionType | ✅ | 异常类型 |
| `description` | string | ✅ | 异常描述 |
| `status` | ExceptionStatus | ✅ | 工单状态 |
| `responsibleParty` | ResponsibleParty | ✅ | 责任方 |
| `priority` | Priority | ✅ | 优先级：P0-P3 |
| `handler` | string | ✅ | 处理人 |

### 14.8 DeliveryNoteDTO（电子交货单）

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `noteNo` | string | ✅ | 交货单号 |
| `orderNo` | string | ✅ | 关联订单号 |
| `warehouseName` | string | ✅ | 仓库名称 |
| `status` | string | ✅ | 状态：GENERATED/SHIPPED/RECEIVED |
| `totalQty` | number | ✅ | 总件数 |

---

## 附录A：状态枚举速查表

### 订单状态 → 流程节点索引

```
PENDING_REVIEW    → 0 (下单)
SCHEDULING        → 1 (审核中)
PICKING           → 3 (拣货中)
READY_TO_SHIP     → 4 (待发货)
PARTIALLY_SHIPPED → 5 (运输中)
IN_TRANSIT        → 5 (运输中)
DELIVERED         → 6 (已签收/完成)
COMPLETED         → 6 (已签收/完成)
其他异常状态       → -1 (不显示流程条)
```

### 包裹状态颜色

```
PENDING         → default (灰色)
PICKING         → processing (蓝色)
READY           → processing (蓝色)
WAITING_RESTOCK → warning (橙色)
SHIPPED         → processing (蓝色)
DELIVERED       → success (绿色)
COMPLETED       → success (绿色)
```

### 行项库存状态

```
IN_STOCK     → 有货   / success 绿色
OUT_OF_STOCK → 缺货   / error   红色
PURCHASING   → 采购中 / warning 橙色
```

---

## 附录B：技术实现备注

1. **UI框架**：Ant Design (antd)，使用 `Card`、`Table`、`Tag`、`Descriptions`、`Breadcrumb`、`Row/Col`、`Divider` 等组件
2. **路由**：React Router v6，使用 `useParams` 获取 `orderNo`，`useNavigate` 进行页面跳转
3. **状态管理**：组件内 `useState` + `useMemo`
4. **样式方案**：内联样式（style 属性）+ 全局 CSS（`src/index.css`）
5. **主题色**：`#FF6B00`（橙色），用于流程追踪器、品牌色标识
6. **数据 Mock**：`src/data/mockData.ts` 提供模拟数据，实际对接时应替换为 API 调用
