# OMS 订单管理页面相关

> 本文档是业务逻辑说明，请严格按照以下规则生成 Mock 数据和实现状态推导。

---

## 一、核心数据模型（三层结构）

```
Order（订单）
 ├── shortagePolicy: "SPLIT" | "HOLD"    // 缺件处理策略，在"排单中"阶段确定
 ├── packages: Package[]                  // 1:N 关系
 │
 └── Package（包裹）
      ├── packageType: "ORIGINAL" | "SUPPLEMENT"  // 原始包裹 / 补发包裹
      ├── status: string                           // 包裹自身状态
      ├── lineItems: LineItem[]                    // 1:N 关系
      │
      └── LineItem（配件行项）
           ├── stockStatus: "IN_STOCK" | "OUT_OF_STOCK" | "PURCHASING"
           └── supplierInfo?: {                    // 仅 OUT_OF_STOCK/PURCHASING 时有值
                 supplierName: string
                 expectedArrivalDate: string
                 trackingNumber?: string
               }
```

**铁律：上层状态必须由下层聚合推导，严禁独立 Mock 各层状态。**

---

## 二、状态枚举定义

### 2.1 订单主状态（7 + 1 个）

| 状态 | 含义 |
|------|------|
| PENDING_REVIEW | 待审核 |
| SCHEDULING | 排单中（此阶段确定 shortagePolicy） |
| PICKING | 拣货中 |
| READY_TO_SHIP | 待发货（所有包裹库存充足） |
| PARTIALLY_SHIPPED | 部分发货（仅 SPLIT 策略下出现） |
| IN_TRANSIT | 运输中（所有包裹均已发出） |
| DELIVERED | 已签收（所有包裹均已签收） |
| COMPLETED | 已完成（所有包裹终态确认） |

### 2.2 包裹状态

| 状态 | 含义 |
|------|------|
| PENDING | 待处理 |
| PICKING | 拣货中 |
| READY | 待发货（该包裹内所有行项有货） |
| WAITING_RESTOCK | 待补货（该包裹内有行项缺货/采购中） |
| SHIPPED | 已发货 |
| DELIVERED | 已签收 |
| COMPLETED | 已完成 |

### 2.3 行项库存状态

| 状态 | 含义 |
|------|------|
| IN_STOCK | 仓库有现货 |
| OUT_OF_STOCK | 无库存，等待供应商发货 |
| PURCHASING | 已下单采购，在途 |

---

## 三、状态推导规则（自底向上）

### 3.1 包裹状态 ← 由行项状态推导

```
IF 该包裹所有 lineItems.stockStatus == "IN_STOCK":
    package.status = READY
ELIF 存在 lineItems.stockStatus in ["OUT_OF_STOCK", "PURCHASING"]:
    package.status = WAITING_RESTOCK
ELSE:
    package.status = PICKING
```

### 3.2 订单主状态 ← 由所有包裹状态聚合推导

**通用聚合原则（木桶效应）：**
- 订单主状态 = 所有子包裹中"最靠前"（最早期）的状态所对应的订单级别映射
- 仅当 **全部** 包裹都到达某终态时，订单才进入对应终态

**具体映射表：**

| 包裹状态集合情况 | 订单主状态 |
|------------------|-----------|
| 任一包裹 PENDING | SCHEDULING |
| 任一包裹 PICKING，其余 ≥ PICKING | PICKING |
| 所有包裹 READY | READY_TO_SHIP |
| **SPLIT 策略下**：至少一个 ORIGINAL 包裹 SHIPPED，且仍有包裹未 SHIPPED | **PARTIALLY_SHIPPED** |
| 所有包裹 SHIPPED | IN_TRANSIT |
| 所有包裹 DELIVERED | DELIVERED |
| 所有包裹 COMPLETED | COMPLETED |

**关键约束：**
- `PARTIALLY_SHIPPED` 仅在 `shortagePolicy == "SPLIT"` 时可能出现
- `HOLD` 策略下不会出现部分发货，必须等所有包裹就绪后统一发货

---

## 四、两种缺件策略的完整行为差异

### 4.1 SPLIT（拆包模式）

- **触发时机**：排单中发现部分行项缺货，决策为拆分发货
- **包裹生成**：
  - 有货行项 → 归入 ORIGINAL 包裹，独立进入履约流程
  - 缺货行项 → 归入 SUPPLEMENT 包裹，等待供应商到货后独立发货
- **核心特征**：ORIGINAL 和 SUPPLEMENT 是 **并行独立履约单元**，互不等待
- **订单主状态**：实时聚合所有包裹状态，支持出现 PARTIALLY_SHIPPED 过渡态
- **供应商信息展示**：SUPPLEMENT 包裹的行项需透出 supplierInfo

### 4.2 HOLD（整单挂起模式）

- **触发时机**：排单中发现缺货，决策为等待齐备后统一发货
- **包裹生成**：保持原始包裹结构不变，不拆分
- **核心特征**：所有行项等待缺货行项到齐后，整体进入 READY → SHIPPED
- **订单主状态上限**：在缺货行项变为 IN_STOCK 之前，订单主状态锁定在 PICKING，不会进入 READY_TO_SHIP
- **供应商信息展示**：缺货行项需透出 supplierInfo

---

## 五、Mock 数据生成校验清单

生成每条订单数据时，**必须按以下顺序执行**：

1. ✅ 先生成 LineItem，确定每个行项的 `stockStatus`
2. ✅ 根据 `shortagePolicy` 决定包裹拆分方式：
   - SPLIT → 按库存状态拆分为 ORIGINAL + SUPPLEMENT
   - HOLD → 保持单一/原始包裹结构
3. ✅ 由 LineItem 状态推导每个 Package 的 status
4. ✅ 由所有 Package 状态聚合推导 Order 主状态
5. ✅ 校验：若 strategy=HOLD，订单主状态不得出现 PARTIALLY_SHIPPED
6. ✅ 校验：若 strategy=SPLIT，ORIGINAL 和 SUPPLEMENT 包裹的状态可以不同步
7. ✅ 校验：supplierInfo 仅在行项 stockStatus ≠ IN_STOCK 时存在
8. ✅ 校验：订单主状态与包裹状态集合的逻辑一致性（对照第三节的映射表）

---

## 六、常见错误示例（禁止出现）

| ❌ 错误 | ✅ 正确 |
|---------|--------|
| 订单 IN_TRANSIT，但某个包裹还在 PICKING | 订单应为 PICKING（取最靠前状态） |
| 订单 HOLD 策略，出现 PARTIALLY_SHIPPED | HOLD 不允许部分发货 |
| 行项 IN_STOCK，却有 supplierInfo | 有货行项不需要供应商信息 |
| SPLIT 策略下 ORIGINAL 包裹等待 SUPPLEMENT 才发货 | 两者并行，互不等待 |
| 所有包裹 DELIVERED，订单还是 IN_TRANSIT | 应聚合为 DELIVERED |
| 随机给订单赋状态，不看包裹状态 | 必须自底向上推导 |

---

## 七、前端展示要点

- 订单详情页的"订单主状态"标签 = 聚合结果，不是独立字段
- 包裹列表区：每个包裹卡片显示自身状态 + 内含行项明细
- 供应商协同信息：仅在对应行项/包裹涉及外部采购时展示，包含供应商名称、预计到货时间、物流单号（如有）
- 缺件策略标识：在订单头部区域展示当前策略（SPLIT / HOLD），便于用户理解为何出现部分发货或整单等待

---

## 八、多角色视图规范（user_role = multi）

> 订单详情页需同时服务多种角色，不同角色关注信息密度不同。**同一页面通过字段级权限控制实现差异化视图**，而非为每个角色开发独立页面。

### 8.1 角色矩阵

| 角色 | 关注焦点 | 可见模块 | 敏感字段 |
|------|----------|---------|---------|
| 经销商/客户 | 订单进度、物流追踪、预计到货 | 订单状态、包裹列表、物流详情、商品明细 | 隐藏采购成本价、供应商联系方式 |
| 仓库操作员 | 拣货任务、库存状态、发货操作 | 包裹列表（含库位号）、商品明细（含SKU/数量）、状态操作按钮 | 隐藏客户联系方式、财务信息 |
| 采购/供应链 | 缺货行项、供应商进度、补货时效 | 供应商信息、行项库存状态、采购单号 | 可见供应商成本价、联系方式 |
| 管理员 | 全局视图，所有信息 | 全部模块 | 全部可见 |

### 8.2 实现约束（给 Coding Agent）

```
// 字段级权限控制——每个字段需标注角色可见性
interface FieldPermission {
  field: string
  visibleTo: UserRole[]    // 仅列出可见角色
  hiddenFrom: UserRole[]   // 仅列出不可见角色（二选一使用）
}

// Mock 数据中每个字段附带权限标记
// 前端根据当前用户角色过滤渲染
```

**关键规则：**
- 商品明细模块：**所有角色均可见**（不可省略），但展示的字段深度因角色而异
- 物流详情模块：**经销商 + 管理员可见**，仓库操作员仅可见物流单号（不可见承运商联系方式）
- 供应商信息模块：**仅采购/供应链 + 管理员可见**（经销商仅可见脱敏后的供应商名称）

---

## 九、折叠交互规范（detail_level = collapse_default）

> 所有详情区块默认折叠，仅显示摘要行 + 状态徽章。用户点击展开查看完整信息。

### 9.1 折叠层级定义

```
订单详情页
│
├── 📋 订单基础信息 ──────── 默认展开（始终可见）
│
├── 📦 包裹列表 ──────────── 默认折叠
│   ├── 摘要行：包裹数量 + 各状态徽章汇总
│   └── 展开后：逐包裹卡片（含行项明细）
│
├── 🛒 商品明细 ──────────── 默认折叠（不可省略！）
│   ├── 摘要行：商品种类数 + 总数量 + 缺货数量标红
│   └── 展开后：完整商品列表（含图片/SKU/数量/库存状态/供应商信息）
│
├── 🚚 物流详情 ──────────── 默认折叠
│   ├── 摘要行：最新物流状态 + 运单号
│   └── 展开后：完整物流轨迹时间线
│
├── 🏭 供应商协同 ─────────── 默认折叠（仅涉及外部采购时显示）
│   ├── 摘要行：供应商名称 + 预计到货日
│   └── 展开后：采购单号、联系方式、物流追踪
│
└── 📝 操作日志 ──────────── 默认折叠
    ├── 摘要行：最近 1 条操作记录
    └── 展开后：完整操作时间线
```

### 9.2 折叠组件规范

```
// 每个折叠区块的摘要行必须包含：
interface CollapsibleSection {
  title: string              // 区块标题
  badge: StatusBadge[]       // 状态徽章（一眼识别）
  summary: string            // 一句话摘要
  defaultState: "collapsed"  // 固定为折叠
  expandIcon: "chevron-down"
}

// 摘要行示例（包裹列表折叠态）：
// ┌─────────────────────────────────────────┐
// │ 📦 包裹（3）  [已发货×1] [拣货中×1] [待补货×1]  ▼ │
// └─────────────────────────────────────────┘
```

**关键约束：**
- 折叠状态下，摘要行必须透出**关键状态数字/徽章**，用户无需展开即可掌握概况
- 展开动画使用 `max-height` 过渡，时长 200ms，ease-out
- 点击摘要行任意位置（非按钮区域）即触发展开/折叠

---

## 十、供应商信息混合展示规范（supplier_info_style = hybrid）

> "混合"指供应商信息同时存在两种展示形态：**行内摘要**（轻量） + **弹出详情卡**（完整），根据上下文自动切换。

### 10.1 两种形态

| 形态 | 触发场景 | 展示内容 | 视觉样式 |
|------|---------|---------|---------|
| **行内摘要** | 商品明细表格中、包裹卡片行项列表内 | 供应商名称 + 预计到货日 | 灰色小字 + 日历图标，跟随行项行尾 |
| **弹出详情卡** | 用户点击行内摘要时 | 完整信息：供应商名称、联系人、采购单号、预计到货日、物流单号、当前状态 | 浮层卡片，带阴影，宽度 320px |

### 10.2 行内摘要渲染规则

```
// 商品明细表格中的行内供应商信息
<tr>
  <td>刹车片 BP-2024</td>
  <td>×4</td>
  <td><span class="stock-out">缺货</span></td>
  <td class="supplier-inline">                        ← 行内摘要
    🏭 东方汽配 · 预计 07/22 到货
    <button class="btn-icon" onclick="showSupplierCard()">ℹ️</button>
  </td>
</tr>
```

### 10.3 弹出详情卡结构

```
┌──────────────────────────────────┐
│ 🏭 供应商信息                      │
├──────────────────────────────────┤
│ 供应商：东方汽配（浙江）有限公司       │
│ 联系人：王经理 · 138****5678        │
│ ─────────────────────────────── │
│ 采购单号：PO-20260715-0042        │
│ 采购日期：2026-07-15              │
│ 预计到货：2026-07-22（距今 5 天）    │
│ ─────────────────────────────── │
│ 物流状态：已发货                    │
│ 运单号：SF1234567890              │
│ [查看物流轨迹 →]                   │
└──────────────────────────────────┘
```

### 10.4 脱敏规则

```
// 经销商角色看到的弹出卡
supplierName: "东方汽配"              // 仅显示简称
contactPerson: "王**"                // 姓名脱敏
contactPhone: "138****5678"          // 手机号脱敏
costPrice: HIDDEN                   // 不展示

// 采购/管理员角色看到的弹出卡
supplierName: "东方汽配（浙江）有限公司"  // 全称
contactPerson: "王建国"               // 完整姓名
contactPhone: "13812345678"          // 完整手机号
costPrice: "¥45.00/件"              // 可见
```

---

## 十一、视觉强调规范（visual_emphasis = yes）

> 通过色彩、徽章、进度指示器等视觉手段，让用户一眼识别订单关键状态。

### 11.1 状态色值体系

| 类别 | 色值 | 用途 | CSS 变量名 |
|------|------|------|-----------|
| 正常流转 | `#4F46E5`（靛蓝） | 正常状态标签、进度条填充 | `--status-normal` |
| 异常/警告 | `#D97706`（琥珀） | 缺货、等待补货、延迟 | `--status-warning` |
| 错误/阻断 | `#DC2626`（红色） | 异常终止、超时 | `--status-error` |
| 成功/完成 | `#059669`（翠绿） | 已签收、已完成 | `--status-success` |
| 中性/待处理 | `#6B7280`（灰色） | 待审核、待处理 | `--status-neutral` |

### 11.2 状态徽章组件

```
// 徽章样式规范
.badge {
  display: inline-flex;
  align-items: center;
  padding: 2px 10px;
  border-radius: 9999px;     // 全圆角胶囊形
  font-size: 12px;
  font-weight: 600;
  line-height: 20px;
}

// 各状态徽章配色
.badge--normal    { background: #EEF2FF; color: #4F46E5; }   // 正常
.badge--warning   { background: #FEF3C7; color: #D97706; }   // 警告
.badge--error     { background: #FEE2E2; color: #DC2626; }   // 错误
.badge--success   { background: #ECFDF5; color: #059669; }   // 成功
.badge--neutral   { background: #F3F4F6; color: #6B7280; }   // 中性
```

### 11.3 订单头部状态卡片（视觉强调重点区域）

```
┌──────────────────────────────────────────────────────────┐
│                                                          │
│  订单号：ORD-20260717-0001                               │
│                                                          │
│  ┌────────────────────────┐                              │
│  │    ● 部分发货           │  ← 大号状态标签（24px）       │
│  │    PARTIALLY_SHIPPED   │     背景色 = --status-warning │
│  └────────────────────────┘                              │
│                                                          │
│  策略：[SPLIT 拆分发货]  ← 策略徽章（靛蓝描边）             │
│                                                          │
│  ████████████░░░░░░░░  60%  ← 履约进度条                  │
│  已发 2/3 包裹                                             │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

### 11.4 进度条规则

```
// 履约进度 = 已进入终态（SHIPPED/DELIVERED/COMPLETED）的包裹数 / 总包裹数
progressPercent = (completedPackages.length / totalPackages.length) * 100

// 进度条颜色
progress < 50%  → --status-warning（琥珀）
progress 50-99% → --status-normal（靛蓝）
progress = 100% → --status-success（翠绿）
```

### 11.5 缺货数量标红规则

```
// 商品明细摘要行中
// 缺货数量 > 0 时，数字使用红色加粗
.shortage-count {
  color: #DC2626;
  font-weight: 700;
}

// 示例：摘要行
// 🛒 商品明细：共 12 种配件 · 48 件 · 缺货 3 件（红色高亮）
```

---

## 十二、商品明细模块规范（不可省略 + 物流详情兼容）

> **商品明细是必选模块**，任何角色、任何订单状态下都必须存在。同时必须与物流详情模块在数据层和展示层保持兼容。

### 12.1 商品明细模块数据结构

```
// 商品明细模块独立于包裹结构，是对所有行项的"平铺汇总视图"
interface ProductDetailModule {
  summary: {
    totalSKUCount: number       // 商品种类数
    totalQuantity: number       // 总件数
    shortageQuantity: number    // 缺货件数（> 0 时标红）
    inStockQuantity: number     // 有货件数
  }

  items: ProductDetailItem[]    // 平铺后的所有行项
}

interface ProductDetailItem {
  lineItemId: string            // 关联原始行项 ID
  productName: string           // 商品名称
  productImage?: string         // 商品缩略图 URL
  sku: string                   // SKU 编码
  quantity: number              // 订购数量
  unitPrice: number             // 单价（角色权限控制可见性）
  stockStatus: "IN_STOCK" | "OUT_OF_STOCK" | "PURCHASING"
  belongsToPackageId: string    // ⚡ 关联包裹 ID（兼容物流详情的关键）
  belongsToPackageType: "ORIGINAL" | "SUPPLEMENT"
  supplierInfo?: SupplierInfo   // 缺货/采购中时才有值
  warehouseLocation?: string    // 库位号（仓库角色可见）
}
```

### 12.2 物流详情模块数据结构

```
interface LogisticsDetailModule {
  shipments: ShipmentInfo[]     // 物流单列表（按包裹维度）
}

interface ShipmentInfo {
  packageId: string             // ⚡ 关联包裹 ID（与商品明细关联的关键）
  packageType: "ORIGINAL" | "SUPPLEMENT"
  trackingNumber: string        // 运单号
  carrier: string               // 承运商名称
  carrierPhone?: string         // 承运商电话（角色权限控制）
  status: string                // 物流状态
  estimatedDelivery: string     // 预计送达时间
  timeline: LogisticsEvent[]    // 物流轨迹事件列表
}

interface LogisticsEvent {
  timestamp: string             // ISO 8601
  description: string           // 事件描述
  location: string              // 地点
  type: "PICKUP" | "TRANSIT" | "DELIVERY" | "EXCEPTION"
}
```

### 12.3 兼容性约束（商品明细 ↔ 物流详情）

**核心兼容机制：通过 `packageId` 双向关联。**

```
商品明细 item.belongsToPackageId  ←→  物流详情 shipment.packageId
         ↓                                    ↓
  点击商品可定位到所属包裹的物流信息      点击物流单可定位到包含的商品
```

**具体兼容规则：**

| 场景 | 商品明细行为 | 物流详情行为 | 兼容要求 |
|------|------------|------------|---------|
| SPLIT 策略，ORIGINAL 包裹已发货 | 有货行项显示"已发货"状态标签 | 显示该包裹运单号 + 轨迹 | 行项 `belongsToPackageId` 必须与物流 `packageId` 一致 |
| SPLIT 策略，SUPPLEMENT 包裹待补货 | 缺货行项显示供应商信息 + "待补货" | 该包裹暂无运单号（灰显"待发货"） | 物流模块优雅处理无运单号场景 |
| HOLD 策略，整单待发 | 所有行项统一显示"待发货" | 无运单号或单运单号 | 两模块同步显示等待状态 |
| 行项缺货采购中 | 行项显示 PURCHASING + 供应商摘要 | 若供应商已发货，显示供应商侧物流 | 供应商物流 ≠ 客户物流，分开展示 |

### 12.4 交叉导航交互

```
// 从商品明细跳转到物流详情
用户点击商品明细中某个行项的"包裹编号"
  → 自动展开物流详情区块
  → 滚动到对应 packageId 的物流卡片
  → 高亮该卡片 2 秒

// 从物流详情跳转到商品明细
用户点击物流卡片中的"包含商品"链接
  → 自动展开商品明细区块
  → 过滤显示该包裹包含的行项（带"该包裹"标签）
```

### 12.5 两模块在页面中的布局关系

```
┌───────────────────────────────────────────┐
│ 📋 订单基础信息（始终展开）                  │
├───────────────────────────────────────────┤
│ 📦 包裹列表 [默认折叠]                      │
│    → 包裹维度视图，每个包裹含行项子列表        │
├───────────────────────────────────────────┤
│ 🛒 商品明细 [默认折叠] ← 不可省略           │
│    → 行项维度平铺视图，跨包裹汇总             │
│    → 每个行项标注 belongsToPackageId         │
├───────────────────────────────────────────┤
│ 🚚 物流详情 [默认折叠]                      │
│    → 包裹维度物流视图                        │
│    → 每个物流单关联 packageId                │
│    → 与商品明细通过 packageId 双向导航        │
├───────────────────────────────────────────┤
│ 🏭 供应商协同 [默认折叠，有外部采购时显示]     │
├───────────────────────────────────────────┤
│ 📝 操作日志 [默认折叠]                      │
└───────────────────────────────────────────┘
```

**注意：** 包裹列表、商品明细、物流详情三个模块虽然都涉及"行项"信息，但视角不同：
- **包裹列表** = 以包裹为容器组织行项（运维视角）
- **商品明细** = 以行项为主体平铺展示（商品视角）
- **物流详情** = 以包裹为容器展示物流轨迹（物流视角）

三者通过 `packageId` 关联，但各自独立渲染，不互相嵌套。

---

## 十三、完整页面组件树（给 Coding Agent 的组件拆分参考）

```
<OrderDetailPage>
  ├── <OrderHeaderCard>               // 订单头部：状态标签 + 策略徽章 + 进度条
  │     ├── <StatusBadge size="lg" />
  │     ├── <PolicyBadge />
  │     └── <ProgressBar />
  │
  ├── <CollapsibleSection title="包裹列表" badge={packageStatusBadges}>
  │     └── <PackageCard /> × N
  │           ├── <PackageStatusBadge />
  │           └── <LineItemList items={package.lineItems} />
  │
  ├── <CollapsibleSection title="商品明细" badge={productSummaryBadges} required>
  │     ├── <ProductSummary />        // 摘要：种类数 + 件数 + 缺货数
  │     └── <ProductDetailTable items={allLineItems} />
  │           └── <SupplierInlineInfo />  // 行内供应商摘要（hybrid 模式）
  │
  ├── <CollapsibleSection title="物流详情" badge={logisticsBadges}>
  │     └── <ShipmentCard /> × N
  │           ├── <TrackingInfo />
  │           └── <LogisticsTimeline events={shipment.timeline} />
  │
  ├── <CollapsibleSection title="供应商协同" visible={hasExternalPurchase}>
  │     └── <SupplierDetailCard />    // 弹出式详情卡（hybrid 模式）
  │
  └── <CollapsibleSection title="操作日志" badge={latestOperation}>
        └── <OperationTimeline />

// 弹出层
<SupplierPopupCard />                 // 供应商详情弹出卡（由行内摘要触发）
```

---

## 十四、异常处理流程与状态关联

> 订单在履约全链路中可能触发多种异常。异常处理不是"旁路"，而是**嵌入主状态机的关键节点**——异常一旦发生，订单/包裹状态必须反映异常阶段，且处理结果直接驱动后续状态流转。

### 14.1 异常类型枚举

基于业务现状梳理出 **5 类售后异常 + 2 类履约异常**，共 7 种：

| 异常类型编码 | 异常名称 | 触发时机 | 触发来源 | 影响层级 |
|-------------|---------|---------|---------|---------|
| `DAMAGE_ON_OPEN` | 开箱破损 | 经销商收货后开箱发现配件破损 | 经销商发起 | 包裹级 → 订单级 |
| `NEW_PART_RETURN` | 新件退回 | 经销商已拆封但未安装的配件退回基地 | 经销商发起 | 包裹级 → 订单级 |
| `PAINT_COLOR_MISMATCH` | 烤漆件色差 | 已拆封或已安装后发现颜色不一致 | 经销商发起 | 行项级 → 包裹级 |
| `LOGISTICS_LOST` | 物流丢件 | 运输过程中包裹丢失 | 物流商/系统检测 | 包裹级 → 订单级 |
| `WRONG_OR_MISSING_ITEM` | 错发/漏发 | 经销商收货后发现配件与订购不一致 | 经销商发起 | 行项级 → 包裹级 |
| `STOCK_SHORTAGE` | 库存缺货 | 排单/拣货时发现实际库存不足 | 仓库/系统检测 | 行项级 → 包裹级 |
| `SUPPLIER_DELAY` | 供应商延迟 | 采购件超过预计到货日仍未到达 | 系统自动检测 | 行项级 → 包裹级 |

### 14.2 异常工单数据模型

每个异常事件生成一个**异常处理工单（ExceptionTicket）**，与订单/包裹/行项关联：

```
interface ExceptionTicket {
  ticketId: string                    // 工单唯一ID，如 "EXC-20260717-0042"
  orderId: string                     // 关联订单ID（必填）
  packageId?: string                  // 关联包裹ID（包裹级/行项级异常时必填）
  lineItemId?: string                 // 关联行项ID（行项级异常时必填）

  exceptionType: ExceptionType        // 异常类型编码（见 14.1）
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"  // 严重等级

  status: TicketStatus                // 工单状态（见 14.3）
  createdAt: string                   // ISO 8601
  updatedAt: string                   // ISO 8601
  resolvedAt?: string                 // ISO 8601，解决时间

  reporter: {                         // 发起人
    role: "DEALER" | "WAREHOUSE" | "CUSTOMER_SERVICE" | "SYSTEM"
    name: string
    contact?: string
  }

  description: string                 // 异常描述
  evidenceImages?: string[]           // 凭证图片URL列表
  resolution?: ExceptionResolution    // 处理结果（仅终态时有值）

  relatedTickets?: string[]           // 关联工单ID（如同一订单多次异常）
}

interface ExceptionResolution {
  action: ResolutionAction            // 处理动作
  resultDescription: string           // 处理结果描述
  compensationAmount?: number         // 补偿金额（如有）
  replacementTrackingNumber?: string  // 补发运单号（如有）
  refundAmount?: number               // 退款金额（如有）
  resolvedBy: string                  // 处理人
}

type ResolutionAction =
  | "RESEND"              // 补发
  | "REFUND"              // 退款
  | "REPLACE"             // 换货
  | "COMPENSATE"          // 补偿（不退货）
  | "RETURN_AND_REFUND"   // 退货退款
  | "CANCEL_LINE_ITEM"    // 取消该行项
  | "ESCALATE"            // 升级处理
  | "CLOSE_NO_ACTION"     // 关闭（无需处理）
```

### 14.3 异常工单状态机

```
CREATED（已创建）
  │
  ├──→ INVESTIGATING（调查中）──→ PENDING_APPROVAL（待审批）──→ APPROVED（已批准）──→ EXECUTING（执行中）──→ RESOLVED（已解决）
  │                                                                                                          │
  │                                                                  ┌───────────────────────────────────────┘
  │                                                                  ↓
  │                                                          REJECTED（已驳回）──→ INVESTIGATING（重新调查）
  │
  └──→ CLOSED（已关闭）←── 任何阶段均可关闭（确认无需处理时）
```

| 工单状态 | 含义 | 允许操作 |
|---------|------|---------|
| CREATED | 异常已上报，待分配处理人 | 分配处理人、补充凭证 |
| INVESTIGATING | 处理人正在核实异常原因 | 上传调查结果、提交处理方案 |
| PENDING_APPROVAL | 处理方案已提交，等待主管审批 | 审批通过/驳回 |
| APPROVED | 方案已批准，待执行 | 开始执行 |
| EXECUTING | 正在执行处理方案（补发/退款等） | 确认执行完成 |
| RESOLVED | 异常已解决，工单归档 | 仅查看 |
| REJECTED | 方案被驳回，需重新调查 | 修改方案后重新提交 |
| CLOSED | 确认无需处理，工单关闭 | 仅查看 |

### 14.4 异常对订单/包裹状态的影响规则

**核心原则：异常不阻断正常状态流转，但在订单上叠加"异常标记"。**

#### 14.4.1 状态叠加机制

```
// 订单新增字段
interface Order {
  // ...原有字段...
  exceptionSummary?: ExceptionSummary   // 异常摘要（有异常时才有值）
}

interface ExceptionSummary {
  hasActiveException: boolean           // 是否有未解决的异常
  activeTicketCount: number             // 未解决工单数
  tickets: ExceptionTicketBrief[]       // 工单简要列表
  highestSeverity: Severity             // 最高严重等级
}

interface ExceptionTicketBrief {
  ticketId: string
  exceptionType: ExceptionType
  status: TicketStatus
  severity: Severity
}
```

#### 14.4.2 异常对各层级状态的具体影响

| 异常类型 | 对行项状态的影响 | 对包裹状态的影响 | 对订单主状态的影响 | 是否阻断正常流转 |
|---------|----------------|----------------|------------------|----------------|
| DAMAGE_ON_OPEN | 标记为 `DAMAGED` | 增加 `exceptionFlag=true` | 订单状态不变，但头部显示异常徽章 | ❌ 不阻断（签收后发生） |
| NEW_PART_RETURN | 标记为 `RETURNING` | 增加 `exceptionFlag=true` | 若全部行项退回 → 订单进入 `RETURN_PROCESSING` | ⚠️ 条件阻断 |
| PAINT_COLOR_MISMATCH | 标记为 `COLOR_ISSUE` | 增加 `exceptionFlag=true` | 订单状态不变，但头部显示异常徽章 | ❌ 不阻断 |
| LOGISTICS_LOST | 保持原状态 | 变为 `LOST` | 若所有包裹 LOST → 订单进入 `EXCEPTION_HOLD` | ✅ 阻断 |
| WRONG_OR_MISSING_ITEM | 标记为 `DISPUTED` | 增加 `exceptionFlag=true` | 订单状态不变，但头部显示异常徽章 | ❌ 不阻断（签收后发生） |
| STOCK_SHORTAGE | stockStatus → `OUT_OF_STOCK` | → `WAITING_RESTOCK` | 取决于 shortagePolicy（SPLIT/HOLD） | ⚠️ 策略相关 |
| SUPPLIER_DELAY | stockStatus 保持 `PURCHASING` | 保持 `WAITING_RESTOCK` | 订单状态不变，但超时预警标红 | ❌ 不阻断 |

#### 14.4.3 新增订单状态（异常相关）

在原有 8 个订单主状态基础上，新增 2 个异常相关状态：

| 新增状态 | 含义 | 触发条件 |
|---------|------|---------|
| EXCEPTION_HOLD | 异常挂起 | 所有包裹均因异常无法继续履约（如全部丢失） |
| RETURN_PROCESSING | 退货处理中 | 订单触发了退货流程（新件退回/换货等） |

**更新后的完整订单主状态枚举（10 个）：**

```
PENDING_REVIEW → SCHEDULING → PICKING → READY_TO_SHIP → PARTIALLY_SHIPPED → IN_TRANSIT → DELIVERED → COMPLETED
                                        ↘ EXCEPTION_HOLD（任意阶段可进入）
DELIVERED / COMPLETED → RETURN_PROCESSING（签收后可进入）
```

### 14.5 异常处理在主状态机中的嵌入位置

```
                        ┌─────────────────────────────────────────────────────────┐
                        │              异常处理嵌入点                               │
                        ├─────────────────────────────────────────────────────────┤
                        │                                                         │
  PENDING_REVIEW        │                                                         │
       ↓                │                                                         │
  SCHEDULING ──────────→│ ① 排单时发现缺货 → 创建 STOCK_SHORTAGE 工单             │
       ↓                │    → 决定 shortagePolicy (SPLIT/HOLD)                   │
  PICKING ────────────→│ ② 拣货时发现实物不符 → 创建 WRONG_OR_MISSING_ITEM 工单   │
       ↓                │    → 包裹标记 exceptionFlag                             │
  READY_TO_SHIP         │                                                         │
       ↓                │                                                         │
  IN_TRANSIT ─────────→│ ③ 物流超时/丢件 → 创建 LOGISTICS_LOST 工单              │
       ↓                │    → 包裹状态 → LOST                                    │
       ↓                │    → 若全部丢失 → 订单 → EXCEPTION_HOLD                 │
  DELIVERED ──────────→│ ④ 签收后开箱异常 → 创建 DAMAGE_ON_OPEN /               │
       ↓                │    PAINT_COLOR_MISMATCH / WRONG_OR_MISSING_ITEM 工单    │
       ↓                │    → 经销商可申请 → RETURN_PROCESSING                   │
  COMPLETED             │                                                         │
                        │                                                         │
  任意阶段 ───────────→│ ⑤ 供应商延迟 → 创建 SUPPLIER_DELAY 工单                 │
                        │    → 行项/包裹保持 WAITING_RESTOCK，超时预警             │
                        └─────────────────────────────────────────────────────────┘
```

### 14.6 异常工单与订单详情页的关联展示

#### 14.6.1 页面新增区块

在组件树中新增 `<ExceptionPanel>` 区块，位于"操作日志"上方：

```
├── ⚠️ 异常处理 [默认折叠，有活跃异常时默认展开 + 脉冲动画]
│   ├── 摘要行：活跃工单数 + 最高严重等级徽章
│   └── 展开后：工单卡片列表
│         ├── <TicketCard /> × N
│         │     ├── 工单号 + 异常类型标签 + 严重等级
│         │     ├── 当前状态徽章 + 处理进度条
│         │     ├── 关联信息：包裹编号 / 行项名称（可点击跳转）
│         │     ├── 凭证图片缩略图（点击查看大图）
│         │     └── 处理结果摘要（仅终态时显示）
│         └── <CreateTicketButton />  // 管理员/客服可见
```

#### 14.6.2 异常标记在其他模块中的透出

| 模块 | 异常透出方式 |
|------|------------|
| 订单头部状态卡片 | 有活跃异常时，状态标签右侧追加 ⚠️ 异常徽章 + 工单数 |
| 包裹卡片 | 有异常的包裹卡片左上角显示橙色三角警告图标 |
| 商品明细表格 | 涉及异常的行项行背景色变为浅黄 `#FFFBEB`，行尾追加"查看工单"链接 |
| 物流详情 | 物流轨迹中出现异常事件时，该节点使用红色圆点 + 工单号链接 |
| 操作日志 | 异常工单的创建/状态变更自动记录为操作日志条目 |

### 14.7 Mock 数据生成校验清单（异常部分）

生成包含异常的订单数据时，**在原有 8 步校验基础上追加**：

9. ✅ 校验：异常工单的 `orderId` / `packageId` / `lineItemId` 必须指向真实存在的实体
10. ✅ 校验：工单状态与订单/包裹状态的兼容性（如订单已 COMPLETED 时不应出现 CREATED 状态的 LOGISTICS_LOST 工单）
11. ✅ 校验：`exceptionSummary.hasActiveException == true` 当且仅当存在非终态（非 RESOLVED/CLOSED）工单
12. ✅ 校验：订单状态为 EXCEPTION_HOLD 时，至少有一个包裹状态为 LOST 或所有包裹均有 CRITICAL 级别工单
13. ✅ 校验：订单状态为 RETURN_PROCESSING 时，至少有一个工单的 resolution.action ∈ {REFUND, REPLACE, RETURN_AND_REFUND}
14. ✅ 校验：签收后异常（DAMAGE_ON_OPEN / PAINT_COLOR_MISMATCH / WRONG_OR_MISSING_ITEM）仅在订单 ≥ DELIVERED 时出现

---

## 十五、特殊订单审核流程与状态扩展

> 除常规经销商订单外，系统中还存在**预约单、定制订单、400免费订单、部门领用单**等特殊类型。这些订单在进入正常履约流程前，需要经过**审核环节**。审核结果直接影响订单生命周期。

### 15.1 需要审核的订单类型

| 订单类型 | 订单类型编码 | 审核必要性 | 审核要点 | 审核角色 |
|---------|------------|-----------|---------|---------|
| 预约单 | `PRE_ORDER` | ✅ 必须审核 | 预约时间合理性、库存预留可行性、经销商信用 | 运营主管 |
| 定制订单 | `CUSTOMIZED` | ✅ 必须审核 | 定制需求可行性、供应商产能确认、价格核算、交期承诺 | 产品经理 + 采购主管 |
| 400免费订单 | `FREE_400` | ✅ 必须审核 | 投诉真实性验证、免费发放合规性、金额审批权限 | 客服主管 + 财务 |
| 部门领用单 | `INTERNAL_USE` | ✅ 必须审核 | 领用事由合理性、预算额度、审批权限 | 部门负责人 + 行政 |
| 常规经销商订单 | `STANDARD` | ❌ 免审核 | — | — |
| 直发订单 | `DIRECT_SHIP` | ⚠️ 条件审核 | 仅首次合作的供应商需审核 | 采购主管 |

### 15.2 审核状态机

```
                    ┌─────────────────────────────────────────────────────┐
                    │              审核子状态机                            │
                    └─────────────────────────────────────────────────────┘

SUBMITTED（已提交）
    │
    ↓
PENDING_REVIEW（待审核） ←── 订单创建后自动进入（针对需审核类型）
    │
    ├──→ REVIEW_APPROVED（审核通过）──→ 进入正常履约流程（SCHEDULING）
    │
    ├──→ REVIEW_REJECTED（审核不通过）──→ ORDER_TERMINATED（订单终止）
    │                                         │
    │                                         ↓
    │                                    通知发起人 + 记录终止原因
    │
    ├──→ REVIEW_RETURNED（审核退回补充材料）──→ SUBMITTED（重新提交）
    │                                              ↑
    │                                              │
    │                                     发起人补充后重新提交
    │
    └──→ REVIEW_EXPIRED（审核超时）──→ ORDER_TERMINATED（订单自动终止）
                                            │
                                            ↓
                                      超时阈值：72小时未处理
```

### 15.3 审核状态详细定义

| 审核状态 | 含义 | 对订单主状态的影响 | 允许操作 |
|---------|------|------------------|---------|
| SUBMITTED | 订单已提交，尚未进入审核队列 | 订单主状态 = PENDING_REVIEW | 发起人可撤回/修改 |
| PENDING_REVIEW | 已进入审核队列，等待审核人处理 | 订单主状态 = PENDING_REVIEW | 审核人可审批/驳回/退回 |
| REVIEW_APPROVED | 审核通过 | 订单主状态自动流转至 SCHEDULING | 自动触发，无需人工 |
| REVIEW_REJECTED | 审核不通过 | 订单主状态 → ORDER_TERMINATED | 审核人填写驳回原因 |
| REVIEW_RETURNED | 审核退回，要求补充材料 | 订单主状态保持 PENDING_REVIEW | 发起人补充后重新提交 |
| REVIEW_EXPIRED | 超过72小时未审核，自动过期 | 订单主状态 → ORDER_TERMINATED | 系统自动触发 |

### 15.4 新增订单主状态（审核 + 终止相关）

在原有 10 个状态基础上，新增 2 个：

| 新增状态 | 含义 | 触发条件 |
|---------|------|---------|
| ORDER_TERMINATED | 订单已终止 | 审核不通过 / 审核超时 / 主动取消 |
| CANCELLED | 订单已取消 | 发起人主动取消（审核前/审核中均可） |

**更新后的完整订单主状态枚举（12 个）：**

```
[审核阶段]
  PENDING_REVIEW → REVIEW_APPROVED → SCHEDULING → ...正常流转...
  PENDING_REVIEW → REVIEW_REJECTED → ORDER_TERMINATED
  PENDING_REVIEW → REVIEW_EXPIRED → ORDER_TERMINATED
  PENDING_REVIEW → CANCELLED（发起人主动取消）

[正常履约阶段]
  SCHEDULING → PICKING → READY_TO_SHIP → PARTIALLY_SHIPPED → IN_TRANSIT → DELIVERED → COMPLETED

[异常阶段]
  任意阶段 → EXCEPTION_HOLD
  DELIVERED / COMPLETED → RETURN_PROCESSING
```

### 15.5 各特殊订单类型的审核差异化规则

#### 15.5.1 预约单（PRE_ORDER）

```
// 预约单额外字段
interface PreOrderExtension {
  appointmentDate: string           // 预约提货/配送日期
  reservationExpiryDate: string     // 库存预留截止日期
  dealerCreditCheck: boolean        // 经销商信用校验结果
  prepaymentRequired: boolean       // 是否需要预付款
  prepaymentStatus?: "UNPAID" | "PAID" | "REFUNDED"
}

// 审核关注点
审核规则：
  1. 预约日期是否在合理范围内（不早于T+3，不晚于T+90）
  2. 经销商信用额度是否充足
  3. 预约配件是否为可售状态（非淘汰/非停产）
  
// 审核不通过后
→ ORDER_TERMINATED，终止原因 = "预约条件不满足"
→ 释放已预留库存
→ 通知经销商可修改后重新提交
```

#### 15.5.2 定制订单（CUSTOMIZED）

```
// 定制订单额外字段
interface CustomizedOrderExtension {
  customizationSpec: {              // 定制规格
    type: "FRAME_NUMBER" | "MOTOR_CUSTOM" | "OTHER"
    description: string
    specAttachments?: string[]      // 规格附件（图纸等）
  }
  supplierConfirmation: {           // 供应商确认信息（审核后填充）
    supplierName: string
    confirmedDeliveryDate: string
    productionBatchNo?: string      // 生产批次号
    unitCost: number                // 定制单价
  }
  isNonResalable: true              // 定制品不可二次销售（固定为true）
  cancellationPenalty?: number      // 取消违约金比例（审核通过后生效）
}

// 审核关注点
审核规则：
  1. 定制规格是否清晰可执行
  2. 供应商是否已确认可生产（需附供应商确认函）
  3. 价格核算是否经过财务复核
  4. 交期承诺是否在合理范围
  
// 审核通过后
→ 锁定定制需求，通知供应商排产
→ 订单进入 SCHEDULING，但包裹生成延迟至供应商确认交货日

// 审核不通过后
→ ORDER_TERMINATED，终止原因 = "定制需求不可行"
→ 由于定制品不可二次销售，需在终止前确认是否已产生生产成本
→ 若已产生成本，需走费用审批流程后再终止
```

#### 15.5.3 400免费订单（FREE_400）

```
// 400免费订单额外字段
interface Free400OrderExtension {
  complaintTicketId: string         // 关联投诉工单ID
  complaintCategory: string         // 投诉类别
  freeReason: "COMPENSATION" | "APPEASEMENT" | "QUALITY_ISSUE" | "OTHER"
  approvalChain: ApprovalNode[]     // 审批链（多级审批）
  maxFreeAmount: number             // 本次免费额度上限
  actualFreeAmount: number          // 实际免费金额
  recipientVerification: {          // 收件人验证
    verifiedIdentity: boolean
    verificationMethod: "PHONE" | "ONLINE" | "DOCUMENT"
  }
}

interface ApprovalNode {
  approverRole: string              // 审批角色
  approverName: string
  status: "PENDING" | "APPROVED" | "REJECTED"
  approvedAt?: string
  comment?: string
}

// 审核关注点
审核规则（多级审批）：
  Level 1 - 客服主管：投诉事实核查 + 免费发放合理性
  Level 2 - 财务审批：金额 ≤ 500元 → 客服主管终审
                      金额 > 500元 → 需财务总监加审
  
// 审核通过后
→ 订单进入 SCHEDULING，标记为 FREE_ORDER（不计入经销商账单）
→ 包裹正常生成和履约

// 审核不通过后
→ ORDER_TERMINATED，终止原因 = "免费申请未通过"
→ 关联投诉工单更新处理备注
→ 通知400客服跟进替代方案
```

#### 15.5.4 部门领用单（INTERNAL_USE）

```
// 部门领用单额外字段
interface InternalUseOrderExtension {
  requestingDepartment: string      // 申请部门
  usePurpose: "SAMPLE" | "TESTING" | "DISPLAY" | "OTHER"
  budgetCode: string                // 预算科目编码
  budgetRemaining: number           // 该科目剩余预算
  returnRequired: boolean           // 是否需要归还
  expectedReturnDate?: string       // 预计归还日期
}

// 审核关注点
审核规则：
  1. 领用事由是否合理
  2. 预算科目余额是否充足
  3. 部门负责人是否已签字确认
  
// 审核通过后
→ 订单进入 SCHEDULING，标记为 INTERNAL（不走经销商结算）
→ 库存扣减计入部门领用台账

// 审核不通过后
→ ORDER_TERMINATED，终止原因 = "领用申请未通过"
→ 通知申请人修改后重新提交
```

### 15.6 审核流程在订单详情页的展示

#### 15.6.1 审核信息区块

在组件树中新增 `<ReviewPanel>` 区块，位于"订单基础信息"下方：

```
<OrderDetailPage>
  ├── <OrderHeaderCard>
  ├── <ReviewPanel visible={order.requiresReview}>    ← 新增
  │     ├── 审核状态徽章（大号）
  │     ├── 审核进度条（多级审批时显示当前在第几级）
  │     ├── 审核时间线
  │     │     ├── 提交时间
  │     │     ├── 各级审批人 + 状态 + 时间 + 意见
  │     │     └── 最终结果
  │     ├── 驳回原因展示（REJECTED 时红色高亮）
  │     ├── 补充材料入口（RETURNED 时显示）
  │     └── 关联信息（投诉工单/定制规格/预算科目等）
  │
  ├── <CollapsibleSection title="包裹列表" ...>
  └── ...其余模块
```

#### 15.6.2 审核状态在订单头部的透出

```
// 审核中的订单头部
┌──────────────────────────────────────────────────────────┐
│  订单号：ORD-20260717-0088  类型：[400免费订单]           │
│                                                          │
│  ┌────────────────────────┐                              │
│  │    ● 待审核             │  ← --status-neutral 灰色     │
│  │    PENDING_REVIEW      │                              │
│  └────────────────────────┘                              │
│                                                          │
│  审核进度：████░░░░░░  Level 1/2 · 客服主管审批中          │
│  提交时间：2026-07-17 09:30                               │
│  关联投诉：CMP-20260716-0023                              │
│                                                          │
└──────────────────────────────────────────────────────────┘

// 审核不通过的订单头部
┌──────────────────────────────────────────────────────────┐
│  订单号：ORD-20260717-0088  类型：[定制订单]              │
│                                                          │
│  ┌────────────────────────┐                              │
│  │    ✕ 订单已终止         │  ← --status-error 红色       │
│  │    ORDER_TERMINATED    │                              │
│  └────────────────────────┘                              │
│                                                          │
│  终止原因：定制需求不可行 — 供应商无法在承诺交期内生产       │
│  审核人：张经理 · 2026-07-17 14:20                        │
│  [查看审核详情 →]                                         │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

### 15.7 审核 + 异常 + 正常流转的状态全局视图

```
                          ┌─────────────────────────────────────────────┐
                          │         订单全生命周期状态流转                 │
                          └─────────────────────────────────────────────┘

[审核阶段]                    [正常履约阶段]                    [异常/终止]
                                  
PENDING_REVIEW ──审核通过──→ SCHEDULING ──→ PICKING ──→ READY_TO_SHIP
     │                           │              │              │
     ├──审核不通过──→ ORDER_TERMINATED           │              ↓
     │                           │              │       PARTIALLY_SHIPPED
     ├──审核超时──→ ORDER_TERMINATED            │              │
     │                           │              │              ↓
     ├──主动取消──→ CANCELLED    │              │         IN_TRANSIT
     │                           │              │              │
     └──退回补充──→ SUBMITTED    │              │              ↓
                                  │              │         DELIVERED
                                  │              │              │
                                  ↓              ↓              ↓
                            任意阶段均可进入 → EXCEPTION_HOLD   ↓
                                                                ↓
                                                        RETURN_PROCESSING
                                                                │
                                                                ↓
                                                           COMPLETED
```

### 15.8 Mock 数据生成校验清单（审核部分）

生成包含审核流程的订单数据时，**在已有校验基础上追加**：

15. ✅ 校验：`orderType == STANDARD` 的订单不应有审核记录（无 ReviewPanel 数据）
16. ✅ 校验：`orderType ∈ {PRE_ORDER, CUSTOMIZED, FREE_400, INTERNAL_USE}` 必须有审核记录
17. ✅ 校验：审核状态为 REVIEW_APPROVED 时，订单主状态必须 ≥ SCHEDULING
18. ✅ 校验：审核状态为 REVIEW_REJECTED / REVIEW_EXPIRED 时，订单主状态必须 = ORDER_TERMINATED
19. ✅ 校验：400免费订单的 `approvalChain` 长度与金额阈值匹配（≤500 一级，>500 两级）
20. ✅ 校验：定制订单审核通过后，必须有 `supplierConfirmation` 数据
21. ✅ 校验：ORDER_TERMINATED 的订单不应有任何包裹处于 SHIPPED/DELIVERED 状态
22. ✅ 校验：CANCELLED 状态的订单可以出现在审核阶段的任何节点

---

## 十六、更新后的完整订单主状态枚举（最终版）

> 综合正常履约、异常处理、审核流程三个维度，订单主状态最终定义为 **12 个**。

| # | 状态编码 | 显示名称 | 所属阶段 | 色值分类 |
|---|---------|---------|---------|---------|
| 1 | PENDING_REVIEW | 待审核 | 审核阶段 | neutral `#6B7280` |
| 2 | ORDER_TERMINATED | 订单已终止 | 终止 | error `#DC2626` |
| 3 | CANCELLED | 已取消 | 终止 | neutral `#6B7280` |
| 4 | SCHEDULING | 排单中 | 履约阶段 | normal `#4F46E5` |
| 5 | PICKING | 拣货中 | 履约阶段 | normal `#4F46E5` |
| 6 | READY_TO_SHIP | 待发货 | 履约阶段 | normal `#4F46E5` |
| 7 | PARTIALLY_SHIPPED | 部分发货 | 履约阶段 | warning `#D97706` |
| 8 | IN_TRANSIT | 运输中 | 履约阶段 | normal `#4F46E5` |
| 9 | DELIVERED | 已签收 | 履约阶段 | success `#059669` |
| 10 | COMPLETED | 已完成 | 履约阶段 | success `#059669` |
| 11 | EXCEPTION_HOLD | 异常挂起 | 异常阶段 | error `#DC2626` |
| 12 | RETURN_PROCESSING | 退货处理中 | 异常阶段 | warning `#D97706` |

**铁律重申：以上所有状态均由子包裹状态 + 审核状态 + 异常工单状态联合推导得出，严禁直接赋值。**

---

## 十七、更新后的完整页面组件树（最终版）

```
<OrderDetailPage>
  ├── <OrderHeaderCard>               // 订单头部：状态标签 + 策略徽章 + 进度条 + 异常徽章
  │     ├── <StatusBadge size="lg" />
  │     ├── <PolicyBadge />
  │     ├── <ProgressBar />
  │     └── <ExceptionBadge count={activeTicketCount} />   ← 新增
  │
  ├── <ReviewPanel visible={requiresReview}>               ← 新增：审核面板
  │     ├── <ReviewStatusBadge size="lg" />
  │     ├── <ApprovalProgressBar level={currentLevel} total={totalLevels} />
  │     ├── <ReviewTimeline events={reviewEvents} />
  │     ├── <RejectionNotice reason={rejectionReason} />   // REJECTED 时显示
  │     └── <SupplementMaterialEntry />                     // RETURNED 时显示
  │
  ├── <CollapsibleSection title="包裹列表" badge={packageStatusBadges}>
  │     └── <PackageCard /> × N
  │           ├── <PackageStatusBadge />
  │           ├── <ExceptionWarningIcon visible={exceptionFlag} />   ← 新增
  │           └── <LineItemList items={package.lineItems} />
  │
  ├── <CollapsibleSection title="商品明细" badge={productSummaryBadges} required>
  │     ├── <ProductSummary />
  │     └── <ProductDetailTable items={allLineItems} />
  │           ├── <SupplierInlineInfo />
  │           └── <ExceptionRowHighlight />                 ← 新增：异常行项高亮
  │
  ├── <CollapsibleSection title="物流详情" badge={logisticsBadges}>
  │     └── <ShipmentCard /> × N
  │           ├── <TrackingInfo />
  │           └── <LogisticsTimeline events={shipment.timeline} />
  │                 └── <ExceptionEventNode />              ← 新增：物流异常节点
  │
  ├── <CollapsibleSection title="供应商协同" visible={hasExternalPurchase}>
  │     └── <SupplierDetailCard />
  │
  ├── <CollapsibleSection title="异常处理" defaultExpanded={hasActiveException}>  ← 新增
  │     ├── <TicketCard /> × N
  │     │     ├── <TicketStatusBadge />
  │     │     ├── <RelatedEntityLink />                     // 跳转包裹/行项
  │     │     ├── <EvidenceImageGallery />
  │     │     └── <ResolutionSummary />
  │     └── <CreateTicketButton />
  │
  └── <CollapsibleSection title="操作日志" badge={latestOperation}>
        └── <OperationTimeline />                           // 含审核+异常事件

// 弹出层
<SupplierPopupCard />
<EvidenceImageLightbox />                                   ← 新增：凭证大图预览
<TicketDetailDrawer />                                      ← 新增：工单详情侧抽屉
```
