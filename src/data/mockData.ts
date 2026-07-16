import type {
  OrderDTO, AppointmentDTO, ExceptionDTO, OperationLog,
  CustomOrderDTO, Call400DTO, TrackingDTO, TrackingNode, ProductDTO,
  TrackStatus, InventoryShareDTO,
} from '../types';

// ========== 雅迪配件商品池 ==========
const YADI_PARTS = [
  { skuCode: 'YD-BP-001', skuName: '前刹车片总成（雅迪冠能系列）', unitPrice: 320 },
  { skuCode: 'YD-BP-002', skuName: '后刹车片总成（雅迪DE系列）', unitPrice: 280 },
  { skuCode: 'YD-FL-001', skuName: '空气滤芯（雅迪全系通用）', unitPrice: 45 },
  { skuCode: 'YD-FL-002', skuName: '机油滤芯（雅迪电喷专用）', unitPrice: 35 },
  { skuCode: 'YD-CH-001', skuName: '428H传动链条（120节）', unitPrice: 128 },
  { skuCode: 'YD-CH-002', skuName: '520H加强型链条（130节）', unitPrice: 185 },
  { skuCode: 'YD-BT-001', skuName: '雅迪原装蓄电池 12V7AH', unitPrice: 168 },
  { skuCode: 'YD-BT-002', skuName: '石墨烯电池 72V20AH', unitPrice: 1280 },
  { skuCode: 'YD-MT-001', skuName: '轮毂电机 500W（雅迪冠能）', unitPrice: 850 },
  { skuCode: 'YD-MT-002', skuName: '轮毂电机 800W（雅迪DE）', unitPrice: 1050 },
  { skuCode: 'YD-CT-001', skuName: '智能控制器 48V/60V通用', unitPrice: 380 },
  { skuCode: 'YD-CT-002', skuName: '正弦波控制器 72V', unitPrice: 520 },
  { skuCode: 'YD-LT-001', skuName: 'LED前大灯总成（雅迪冠能）', unitPrice: 220 },
  { skuCode: 'YD-LT-002', skuName: 'LED尾灯总成（雅迪全系通用）', unitPrice: 95 },
  { skuCode: 'YD-SH-001', skuName: '后减震器（油压可调）', unitPrice: 340 },
  { skuCode: 'YD-SH-002', skuName: '前减震器总成（倒置式）', unitPrice: 480 },
  { skuCode: 'YD-TR-001', skuName: '前后轮胎套装（3.00-10真空胎）', unitPrice: 420 },
  { skuCode: 'YD-BK-001', skuName: '车身外壳套件（雅迪DE8）', unitPrice: 680 },
  { skuCode: 'YD-CG-001', skuName: '充电器 72V3A智能快充', unitPrice: 150 },
  { skuCode: 'YD-MR-001', skuName: '后视镜总成（防眩光）', unitPrice: 75 },
];

// ========== 经销商池 ==========
const DEALERS = [
  { dealerId: 'DLR-001', dealerName: '杭州雅迪旗舰店', province: '浙江省', city: '杭州市', district: '余杭区' },
  { dealerId: 'DLR-002', dealerName: '南京雅迪体验中心', province: '江苏省', city: '南京市', district: '江宁区' },
  { dealerId: 'DLR-003', dealerName: '合肥雅迪专卖店', province: '安徽省', city: '合肥市', district: '蜀山区' },
  { dealerId: 'DLR-004', dealerName: '郑州雅迪旗舰店', province: '河南省', city: '郑州市', district: '金水区' },
  { dealerId: 'DLR-005', dealerName: '武汉雅迪服务中心', province: '湖北省', city: '武汉市', district: '洪山区' },
  { dealerId: 'DLR-006', dealerName: '长沙雅迪旗舰店', province: '湖南省', city: '长沙市', district: '岳麓区' },
  { dealerId: 'DLR-007', dealerName: '成都雅迪体验店', province: '四川省', city: '成都市', district: '武侯区' },
  { dealerId: 'DLR-008', dealerName: '广州雅迪旗舰店', province: '广东省', city: '广州市', district: '白云区' },
];

// ========== 操作员池 ==========
const OPERATORS = [
  { name: '张建国', role: '运营主管' },
  { name: '李明辉', role: '仓管员' },
  { name: '王丽华', role: '客服专员' },
  { name: '赵志强', role: '运营专员' },
  { name: '陈晓芳', role: '仓管员' },
  { name: '刘伟明', role: '系统管理员' },
];

// ========== Helper 函数 ==========

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomPick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomPickN<T>(arr: T[], n: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
}

function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const h = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  const s = String(date.getSeconds()).padStart(2, '0');
  return `${y}-${m}-${d}T${h}:${min}:${s}+08:00`;
}

function formatDateShort(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// ========== 生成订单数据 ==========

export function generateOrders(): OrderDTO[] {
  const statuses = [
    'PENDING_REVIEW', 'SCHEDULING', 'PICKING', 'READY_TO_SHIP',
    'IN_TRANSIT', 'DELIVERED', 'EXCEPTION', 'COMPLETED',
  ] as const;
  const bizTypes = ['REGULAR', 'APPOINTMENT', 'CUSTOM', 'REQUISITION'] as const;
  const urgencies = ['NORMAL', 'URGENT', 'CRITICAL'] as const;
  const methods = ['DIRECT_SHIP', 'WAREHOUSE_SHIP', 'TRANSFER'] as const;
  const bases = ['华东基地', '华南基地', '华北基地', '西南基地'];
  const vins = [
    'LSVAU2180N2012345', 'LSVAU2190N2015678', 'LSVAU2200N2018901',
    'LSVAU2210N2021123', 'LSVAU2220N2024456', 'LSVAU2230N2027789',
    'LSVAU2240N2030012', 'LSVAU2250N2033345',
  ];

  const orders: OrderDTO[] = [];

  for (let i = 0; i < 30; i++) {
    const dealer = randomPick(DEALERS);
    const status = randomPick(statuses);
    const itemsCount = randomInt(1, 5);
    const items = randomPickN(YADI_PARTS, itemsCount).map((part) => {
      const qty = randomInt(1, 10);
      const shortageQty = Math.random() > 0.8 ? randomInt(1, qty) : 0;
      return {
        skuCode: part.skuCode,
        skuName: part.skuName,
        quantity: qty,
        unitPrice: part.unitPrice,
        subtotal: part.unitPrice * qty,
        shortageQty,
      };
    });

    const totalAmount = items.reduce((sum, item) => sum + item.subtotal, 0);
    const shortageFlag = items.some((item) => item.shortageQty > 0);
    const createDate = new Date(2026, 6, randomInt(1, 16), randomInt(8, 18), randomInt(0, 59), randomInt(0, 59));
    const orderNo = `OMS${String(20260716 - randomInt(0, 999)).padStart(6, '0')}${String(i + 1).padStart(4, '0')}`;

    orders.push({
      orderNo,
      dealerId: dealer.dealerId,
      dealerName: dealer.dealerName,
      bizType: randomPick(bizTypes),
      urgencyLevel: randomPick(urgencies),
      fulfillMethod: randomPick(methods),
      status,
      vinCode: randomPick(vins),
      baseSource: randomPick(bases),
      shortageFlag,
      skuCount: items.length,
      totalAmount: Math.round(totalAmount * 100) / 100,
      createTime: formatDate(createDate),
      receiverProvince: dealer.province,
      receiverCity: dealer.city,
      receiverDistrict: dealer.district,
      receiverAddress: `${dealer.district}雅迪大道${randomInt(1, 200)}号`,
      receiverName: `${randomPick(['张', '李', '王', '赵', '陈', '刘'])}${randomPick(['伟', '强', '明', '华', '军', '磊'])}`,
      receiverPhone: `1${randomInt(30, 99)}${String(randomInt(10000000, 99999999))}`,
      items,
      trackingNo: ['IN_TRANSIT', 'DELIVERED', 'COMPLETED'].includes(status) ? `SF${String(randomInt(100000000000, 999999999999))}` : undefined,
      logisticsCompany: ['IN_TRANSIT', 'DELIVERED', 'COMPLETED'].includes(status) ? randomPick(['顺丰速运', '京东物流', '德邦快递', '中通快递']) : undefined,
    });
  }

  // 确保各状态都有覆盖
  const orderedStatuses: typeof statuses = [
    'PENDING_REVIEW', 'PENDING_REVIEW', 'PENDING_REVIEW',
    'SCHEDULING', 'SCHEDULING',
    'PICKING', 'PICKING',
    'READY_TO_SHIP', 'READY_TO_SHIP',
    'IN_TRANSIT', 'IN_TRANSIT', 'IN_TRANSIT',
    'DELIVERED', 'DELIVERED',
    'EXCEPTION', 'EXCEPTION',
    'COMPLETED', 'COMPLETED', 'COMPLETED',
  ];

  orders.forEach((order, index) => {
    order.status = orderedStatuses[index % orderedStatuses.length];
  });

  return orders.sort((a, b) => b.createTime.localeCompare(a.createTime));
}

// ========== 生成预约单数据 ==========

export function generateAppointments(orders: OrderDTO[]): AppointmentDTO[] {
  const statuses = ['PENDING_CONFIRM', 'CONFIRMED', 'EXPIRED', 'CANCELLED', 'EXECUTED'] as const;

  return Array.from({ length: 8 }, (_, i) => {
    const order = orders[i * 3 + 1] || randomPick(orders);
    const appointDate = new Date(2026, 6, randomInt(17, 31));
    const createDate = new Date(2026, 6, randomInt(1, 15), randomInt(8, 18));

    return {
      appointNo: `APT202607${String(16 + i).padStart(2, '0')}${String(i + 1).padStart(4, '0')}`,
      orderNo: order.orderNo,
      dealerId: order.dealerId,
      dealerName: order.dealerName,
      appointDate: formatDateShort(appointDate),
      appointStatus: statuses[i % statuses.length],
      skuTypes: randomInt(1, 6),
      remark: randomPick(['新品上市前铺货', '季节性备货', '促销活动备货', '经销商周年庆备货', '旺季提前备货', '']),
      createTime: formatDate(createDate),
    };
  });
}

// ========== 生成异常数据 ==========

export function generateExceptions(orders: OrderDTO[]): ExceptionDTO[] {
  const types = ['SHORTAGE', 'DAMAGE', 'WRONG_ITEM', 'REJECTION', 'TIMEOUT', 'ADDRESS_ERROR', 'OTHER'] as const;
  const priorities = ['P0', 'P1', 'P2', 'P3'] as const;
  const statuses = ['PENDING', 'PROCESSING', 'RESOLVED', 'CLOSED'] as const;
  const parties = ['WAREHOUSE', 'LOGISTICS', 'SUPPLIER', 'DEALER', 'SYSTEM'] as const;
  const handlers = ['张建国', '李明辉', '王丽华', '赵志强'];

  const descriptions = [
    'SKU YD-BP-001 实发数量少于应发 2 件',
    '外包装破损，配件表面有划痕',
    '发错规格，应为YD-FL-001实际收到YD-FL-002',
    '客户拒收，商品与预期不符',
    '订单超过48小时未审核',
    '收货地址信息不完整，无法配送',
    '物流信息超过72小时未更新',
  ];

  return Array.from({ length: 10 }, (_, i) => {
    const order = orders[randomInt(0, orders.length - 1)];
    const discoverDate = new Date(2026, 6, randomInt(10, 16), randomInt(8, 18), randomInt(0, 59));
    const deadline = new Date(discoverDate);
    deadline.setHours(deadline.getHours() + randomInt(2, 48));

    return {
      exceptionNo: `EXC202607${String(16 - i).padStart(2, '0')}${String(i + 1).padStart(4, '0')}`,
      orderNo: order.orderNo,
      exceptionType: types[i % types.length],
      priority: priorities[i % priorities.length],
      description: descriptions[i % descriptions.length],
      responsibleParty: randomPick(parties),
      status: statuses[i % statuses.length],
      discoverTime: formatDate(discoverDate),
      deadline: formatDate(deadline),
      handler: randomPick(handlers),
    };
  });
}

// ========== 生成操作日志 ==========

export function generateOperationLogs(): OperationLog[] {
  const actions = [
    '创建订单', '审核通过', '发起拣货', '拣货完成', '确认发货',
    '物流揽收', '标记异常', '异常处理完成', '确认签收', '订单归档',
  ];

  return Array.from({ length: 8 }, (_, i) => {
    const op = randomPick(OPERATORS);
    const logDate = new Date(2026, 6, 16, 8 + i, randomInt(0, 59), randomInt(0, 59));

    return {
      time: formatDate(logDate),
      operator: op.name,
      role: op.role,
      action: actions[i],
      remark: i === 6 ? '实发数量不足，已通知仓库补发' : undefined,
    };
  }).sort((a, b) => b.time.localeCompare(a.time));
}

// ========== 生成定制订单数据 ==========

export function generateCustomOrders(orders: OrderDTO[]): CustomOrderDTO[] {
  const types = ['MODIFICATION', 'SPECIAL_MATERIAL', 'SIZE_CUSTOM', 'KIT_ASSEMBLY'] as const;
  const statuses = ['DRAFT', 'TECH_REVIEW', 'QUOTE_PENDING', 'IN_PRODUCTION', 'COMPLETED', 'REJECTED'] as const;
  const specs = [
    '加长型刹车卡钳支架，厚度增加5mm',
    '碳纤维材质前挡泥板，轻量化定制',
    '非标尺寸后轮毂15寸改装件',
    '冠能DE8性能升级套件（刹车+减震+控制器）',
    '定制车身贴花+喷涂方案（雅迪赛车涂装）',
    '加宽型后平叉总成，适配120/70-12轮胎',
    '48V→72V电压升级套件（电机+控制器+电池仓）',
    '定制LED矩阵大灯模组（含日行灯功能）',
  ];

  return Array.from({ length: 8 }, (_, i) => {
    const order = orders[i * 2 + 2] || randomPick(orders);
    const materialCost = randomInt(200, 3000);
    const laborCost = randomInt(100, 800);
    const markupRate = 1 + randomInt(10, 35) / 100;
    const createDate = new Date(2026, 6, randomInt(1, 14), randomInt(8, 18));
    const finishDate = new Date(2026, 6, randomInt(18, 31));

    return {
      customNo: `CST202607${String(16 - i).padStart(2, '0')}${String(i + 1).padStart(4, '0')}`,
      orderNo: order.orderNo,
      dealerId: order.dealerId,
      dealerName: order.dealerName,
      customType: types[i % types.length],
      specDescription: specs[i],
      processRequirement: randomPick(['数控加工+热处理', '3D打印成型', '手工焊接+表面喷塑', 'CNC精密加工+阳极氧化', '']),
      expectFinishDate: formatDateShort(finishDate),
      approvalStatus: statuses[i % statuses.length],
      quoteAmount: Math.round((materialCost + laborCost) * markupRate * 100) / 100,
      attachments: i % 3 === 0 ? ['drawing_v2.pdf', 'spec_sheet.xlsx'] : [],
      vinCode: order.vinCode,
      materialCost,
      laborCost,
      markupRate: Math.round((markupRate - 1) * 100),
      createTime: formatDate(createDate),
    };
  });
}

// ========== 生成400免费订单数据 ==========

export function generateCall400Orders(orders: OrderDTO[]): Call400DTO[] {
  const reasons = ['QUALITY_ISSUE', 'WRONG_ITEM', 'TRANSPORT_DAMAGE', 'SHORTAGE', 'OTHER'] as const;
  const freeTypes = ['RESHIP', 'EXCHANGE', 'GIFT_COMPENSATION'] as const;
  const statuses = ['PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'SHIPPED'] as const;
  const applicants = ['王五', '陈静', '周明', '林小红'];
  const parts = [
    { skuCode: 'YD-BP-001', skuName: '前刹车片总成' },
    { skuCode: 'YD-FL-001', skuName: '空气滤芯' },
    { skuCode: 'YD-LT-002', skuName: 'LED尾灯总成' },
    { skuCode: 'YD-MR-001', skuName: '后视镜总成' },
    { skuCode: 'YD-CG-001', skuName: '充电器' },
  ];

  return Array.from({ length: 8 }, (_, i) => {
    const order = orders[i * 3 + 1] || randomPick(orders);
    const createDate = new Date(2026, 6, randomInt(10, 16), randomInt(8, 18));

    return {
      call400No: `C400202607${String(16 - i).padStart(2, '0')}${String(i + 1).padStart(4, '0')}`,
      originOrderNo: order.orderNo,
      complaintNo: `CMP202607${String(15 - i).padStart(2, '0')}${String(i + 12).padStart(4, '0')}`,
      dealerId: order.dealerId,
      dealerName: order.dealerName,
      applyReason: reasons[i % reasons.length],
      freeType: freeTypes[i % freeTypes.length],
      approvalStatus: statuses[i % statuses.length],
      applicant: randomPick(applicants),
      items: [
        {
          skuCode: parts[i % parts.length].skuCode,
          skuName: parts[i % parts.length].skuName,
          quantity: randomInt(1, 3),
        },
      ],
      createTime: formatDate(createDate),
    };
  });
}

// ========== 生成运单数据 ==========

export function generateTrackingData(orders: OrderDTO[]): TrackingDTO[] {
  const logisticsCompanies = ['顺丰速运', '京东物流', '德邦快递', '中通快递', '圆通速递'];
  const warehouses = ['华东仓', '华南仓', '华北仓', '西南仓'];
  const shippedOrders = orders.filter((o) =>
    ['IN_TRANSIT', 'DELIVERED', 'COMPLETED'].includes(o.status)
  );

  return shippedOrders.slice(0, 10).map((order, i) => {
    const trackStatus = order.status === 'IN_TRANSIT' ? 'IN_TRANSIT'
      : order.status === 'DELIVERED' ? 'DELIVERED'
      : 'DELIVERED';

    const baseDate = new Date(2026, 6, 16 - i);
    const nodes: TrackingNode[] = [
      { time: formatDate(new Date(baseDate.getTime() - 4 * 3600000)), location: warehouses[i % 4], description: '快件已发往分拣中心' },
      { time: formatDate(new Date(baseDate.getTime() - 3 * 3600000)), location: warehouses[i % 4], description: '快件已离开仓库，发往中转站' },
      { time: formatDate(new Date(baseDate.getTime() - 24 * 3600000)), location: i % 2 === 0 ? '杭州中转站' : '南京中转站', description: '快件到达中转站' },
      { time: formatDate(new Date(baseDate.getTime() - 18 * 3600000)), location: i % 2 === 0 ? '杭州中转站' : '南京中转站', description: '快件已发往目的地' },
      { time: formatDate(new Date(baseDate.getTime() - 8 * 3600000)), location: order.receiverCity + '集散中心', description: '快件到达目的地城市' },
      { time: formatDate(new Date(baseDate.getTime() - 4 * 3600000)), location: order.receiverCity + order.receiverDistrict, description: '快件派送中，快递员正在为您配送' },
    ];

    if (trackStatus === 'DELIVERED') {
      nodes.push({ time: formatDate(baseDate), location: order.receiverCity + order.receiverDistrict, description: '快件已签收，签收人：' + order.receiverName });
    }

    return {
      trackingNo: order.trackingNo || `SF${String(randomInt(100000000000, 999999999999))}`,
      orderNo: order.orderNo,
      logisticsCompany: logisticsCompanies[i % logisticsCompanies.length],
      warehouseName: warehouses[i % 4],
      receiverAddress: `${order.receiverProvince}${order.receiverCity}${order.receiverDistrict}${order.receiverAddress}`,
      trackStatus: trackStatus as TrackStatus,
      lastUpdateTime: formatDate(new Date(baseDate.getTime() - (trackStatus === 'DELIVERED' ? 0 : 4 * 3600000))),
      nodes,
      estimatedDelivery: trackStatus !== 'DELIVERED' ? formatDate(new Date(baseDate.getTime() + 8 * 3600000)) : undefined,
    };
  });
}

// ========== 生成商品数据 ==========

interface PartPoolItem {
  skuCode: string;
  skuName: string;
  unitPrice: number;
  category: string;
  spec: string;
  unit: string;
  brand: string;
}

const PART_POOL: PartPoolItem[] = [
  { skuCode: 'YD-BP-001', skuName: '前刹车片总成（雅迪冠能系列）', unitPrice: 320, category: '制动系统 > 刹车片 > 前刹车片', spec: '适用于大众MQB平台，厚度18.2mm', unit: '套', brand: 'BOSCH' },
  { skuCode: 'YD-BP-002', skuName: '后刹车片总成（雅迪DE系列）', unitPrice: 280, category: '制动系统 > 刹车片 > 后刹车片', spec: '陶瓷配方，适配DE3/DE8', unit: '套', brand: 'BOSCH' },
  { skuCode: 'YD-FL-001', skuName: '空气滤芯（雅迪全系通用）', unitPrice: 45, category: '动力系统 > 滤清器 > 空气滤芯', spec: '纸质滤芯，过滤精度5μm', unit: '个', brand: 'MANN' },
  { skuCode: 'YD-FL-002', skuName: '机油滤芯（雅迪电喷专用）', unitPrice: 35, category: '动力系统 > 滤清器 > 机油滤芯', spec: '旋装式，螺纹M20×1.5', unit: '个', brand: 'MANN' },
  { skuCode: 'YD-CH-001', skuName: '428H传动链条（120节）', unitPrice: 128, category: '传动系统 > 链条 > 428H系列', spec: '节距12.7mm，抗拉强度18kN', unit: '条', brand: 'DID' },
  { skuCode: 'YD-CH-002', skuName: '520H加强型链条（130节）', unitPrice: 185, category: '传动系统 > 链条 > 520H系列', spec: '节距15.875mm，油封链', unit: '条', brand: 'RK' },
  { skuCode: 'YD-BT-001', skuName: '雅迪原装蓄电池 12V7AH', unitPrice: 168, category: '电气系统 > 蓄电池 > 12V系列', spec: '免维护铅酸电池，尺寸150×87×93mm', unit: '个', brand: 'YUASA' },
  { skuCode: 'YD-BT-002', skuName: '石墨烯电池 72V20AH', unitPrice: 1280, category: '电气系统 > 蓄电池 > 72V系列', spec: '石墨烯技术，循环寿命800次', unit: '组', brand: '雅迪原厂' },
  { skuCode: 'YD-MT-001', skuName: '轮毂电机 500W（雅迪冠能）', unitPrice: 850, category: '动力系统 > 电机 > 500W系列', spec: '无刷直流，额定转速480rpm', unit: '台', brand: '博世' },
  { skuCode: 'YD-MT-002', skuName: '轮毂电机 800W（雅迪DE）', unitPrice: 1050, category: '动力系统 > 电机 > 800W系列', spec: '无刷直流，额定转速520rpm', unit: '台', brand: '全顺' },
  { skuCode: 'YD-CT-001', skuName: '智能控制器 48V/60V通用', unitPrice: 380, category: '电气系统 > 控制器 > 通用型', spec: '正弦波控制，限流35A', unit: '个', brand: '凯利' },
  { skuCode: 'YD-CT-002', skuName: '正弦波控制器 72V', unitPrice: 520, category: '电气系统 > 控制器 > 72V系列', spec: '正弦波控制，限流50A，支持APP调参', unit: '个', brand: '远驱' },
  { skuCode: 'YD-LT-001', skuName: 'LED前大灯总成（雅迪冠能）', unitPrice: 220, category: '车身部件 > 灯具 > 前大灯', spec: '功率35W，色温6000K，IP67防水', unit: '个', brand: '欧司朗' },
  { skuCode: 'YD-LT-002', skuName: 'LED尾灯总成（雅迪全系通用）', unitPrice: 95, category: '车身部件 > 灯具 > 尾灯', spec: 'LED光源，含刹车灯+转向灯', unit: '个', brand: '雅迪原厂' },
  { skuCode: 'YD-SH-001', skuName: '后减震器（油压可调）', unitPrice: 340, category: '底盘系统 > 减震器 > 后减震', spec: '油压阻尼，预载可调，行程80mm', unit: '对', brand: 'KYB' },
  { skuCode: 'YD-SH-002', skuName: '前减震器总成（倒置式）', unitPrice: 480, category: '底盘系统 > 减震器 > 前减震', spec: '倒置式结构，管径41mm，行程120mm', unit: '对', brand: 'SHOWA' },
  { skuCode: 'YD-TR-001', skuName: '前后轮胎套装（3.00-10真空胎）', unitPrice: 420, category: '底盘系统 > 轮胎 > 10寸系列', spec: '真空胎，花纹C6011，速度级别J', unit: '套', brand: '正新' },
  { skuCode: 'YD-BK-001', skuName: '车身外壳套件（雅迪DE8）', unitPrice: 680, category: '车身部件 > 外观件 > DE8系列', spec: 'ABS材质，含前脸+侧板+尾板', unit: '套', brand: '雅迪原厂' },
  { skuCode: 'YD-CG-001', skuName: '充电器 72V3A智能快充', unitPrice: 150, category: '电气系统 > 充电器 > 72V系列', spec: '输入AC220V，输出DC72V3A，充满自停', unit: '个', brand: '雅迪原厂' },
  { skuCode: 'YD-MR-001', skuName: '后视镜总成（防眩光）', unitPrice: 75, category: '车身部件 > 后视镜 > 通用型', spec: '蓝光防眩，万向调节，M10螺纹', unit: '对', brand: '雅迪原厂' },
];

export function generateProducts(): ProductDTO[] {
  const statuses = ['ON_SHELF', 'ON_SHELF', 'ON_SHELF', 'ON_SHELF', 'ON_SHELF', 'OFF_SHELF', 'DISABLED'] as const;
  const bases = ['华东基地', '华南基地', '华北基地', '西南基地'];
  const packages = ['散装', '盒装', '套装'];

  return PART_POOL.map((part, i) => {
    const updateDate = new Date(2026, 6, randomInt(1, 16), randomInt(8, 18));
    return {
      skuCode: part.skuCode,
      skuName: part.skuName,
      categoryPath: part.category,
      specification: part.spec,
      unit: part.unit,
      brand: part.brand,
      basePrice: part.unitPrice,
      costPrice: Math.round(part.unitPrice * randomInt(45, 70) / 100 * 100) / 100,
      suggestRetailPrice: Math.round(part.unitPrice * 1.5 * 100) / 100,
      packageType: randomPick(packages),
      weightKg: Math.round(randomInt(50, 800) / 100 * 10) / 10,
      volumeCm3: randomInt(200, 8000),
      barcode: `690${String(randomInt(1000000000, 9999999999))}`,
      baseSource: randomPick(bases),
      vehicleModelCount: randomInt(0, 25),
      substituteSkuCodes: i % 4 === 0 ? [PART_POOL[(i + 1) % PART_POOL.length].skuCode] : [],
      certificateTemplateId: i % 3 === 0 ? `CERT-${String(i + 1).padStart(3, '0')}` : '',
      status: statuses[i % statuses.length],
      updateTime: formatDate(updateDate),
    };
  });
}

// ========== 导出数据 ==========

export const mockOrders = generateOrders();
export const mockAppointments = generateAppointments(mockOrders);
export const mockExceptions = generateExceptions(mockOrders);
export const mockOperationLogs = generateOperationLogs();
export const mockCustomOrders = generateCustomOrders(mockOrders);
export const mockCall400Orders = generateCall400Orders(mockOrders);
export const mockTrackingList = generateTrackingData(mockOrders);
export const mockProducts = generateProducts();

// ========== 生成电子交货单数据 ==========

export const mockDeliveryNotes = mockOrders
  .filter((o) => ['READY_TO_SHIP', 'IN_TRANSIT', 'DELIVERED', 'COMPLETED'].includes(o.status))
  .slice(0, 8)
  .map((order, i) => ({
    noteNo: `DN-202607${String(i + 1).padStart(4, '0')}`,
    orderNo: order.orderNo,
    warehouseName: randomPick(['华东仓', '华南仓', '华北仓', '西南仓']),
    status: (order.status === 'COMPLETED' || order.status === 'DELIVERED') ? 'RECEIVED' as const : order.status === 'IN_TRANSIT' ? 'SHIPPED' as const : 'GENERATED' as const,
    generateTime: order.createTime,
    items: order.items.map((it) => ({ skuCode: it.skuCode, skuName: it.skuName, quantity: it.quantity, pickedQty: it.quantity - it.shortageQty })),
    totalQty: order.items.reduce((s, it) => s + it.quantity, 0),
    operator: '李明辉',
  }));

// ========== 生成库存共享数据 ==========

export function generateInventoryShares(): InventoryShareDTO[] {
  const shareDealers = [
    { id: 'DLR-001', name: '杭州雅迪旗舰店' },
    { id: 'DLR-003', name: '合肥雅迪专卖店' },
    { id: 'DLR-005', name: '武汉雅迪服务中心' },
    { id: 'DLR-007', name: '成都雅迪体验店' },
    { id: 'DLR-101', name: '绍兴二网经销商A' },
    { id: 'DLR-102', name: '镇江二网经销商B' },
  ];
  const statuses = ['PENDING_APPROVAL', 'ACTIVE', 'ACTIVE', 'ACTIVE', 'COMPLETED', 'CANCELLED', 'RETURNED'] as const;

  return Array.from({ length: 7 }, (_, i) => {
    const from = shareDealers[i % 4];
    const to = shareDealers[(i + 1) % 6];
    const items = [
      { skuCode: randomPick(['YD-BP-001', 'YD-FL-002', 'YD-CH-001', 'YD-LT-001']), skuName: randomPick(['前刹车片总成', '机油滤芯', '428H传动链条', 'LED前大灯总成']), quantity: randomInt(5, 30), unitPrice: randomInt(35, 320) },
    ];
    const total = items.reduce((s, it) => s + it.quantity * it.unitPrice, 0);
    const createDate = new Date(2026, 6, randomInt(5, 16), randomInt(8, 18));

    return {
      shareNo: `SHR202607${String(16 - i).padStart(2, '0')}${String(i + 1).padStart(4, '0')}`,
      fromDealerId: from.id,
      fromDealerName: from.name,
      toDealerId: to.id,
      toDealerName: to.name,
      items,
      totalAmount: Math.round(total * 100) / 100,
      status: statuses[i],
      qualityCert: i < 5 ? `QC-2026-${String(7000 + i)}` : '',
      qualityCertStatus: i < 5 ? 'VERIFIED' : i === 5 ? 'PENDING' : 'FAILED',
      createTime: formatDate(createDate),
      updateTime: formatDate(new Date(createDate.getTime() + randomInt(1, 48) * 3600000)),
      remark: randomPick(['常规库存共享', '旺季备货调拨', '新品推广共享', '换季清仓共享', '紧急补货请求', '']),
    };
  });
}

export const mockInventoryShares = generateInventoryShares();

// ========== 仪表盘统计数据 ==========

export const dashboardStats = {
  todayOrders: { value: 47, trend: 12.5 },
  pendingReview: { value: 8, trend: -3.2 },
  unhandledExceptions: { value: 5, trend: 25.0 },
  todayShipRate: { value: 78.5, trend: 5.3 },
  weeklyAchievement: { value: 92.1, trend: -1.8 },
};

// ========== 趋势图数据 ==========

export const trendData = (() => {
  const days = ['07/10', '07/11', '07/12', '07/13', '07/14', '07/15', '07/16'];
  return days.map((day) => ({
    date: day,
    新增订单: randomInt(30, 60),
    完成订单: randomInt(25, 55),
    异常订单: randomInt(1, 8),
  }));
})();

// ========== 异常预警汇总 ==========

export const alertExceptions = mockExceptions.slice(0, 10).map((ex) => ({
  ...ex,
  key: ex.exceptionNo,
}));

// ========== 经销商月度统计 ==========

export const dealerMonthlyStats = [
  { dealer: '杭州雅迪旗舰店', orders: 145, amount: 285600, achievement: 95.2 },
  { dealer: '南京雅迪体验中心', orders: 132, amount: 258400, achievement: 93.8 },
  { dealer: '合肥雅迪专卖店', orders: 118, amount: 221500, achievement: 91.5 },
  { dealer: '郑州雅迪旗舰店', orders: 156, amount: 302100, achievement: 96.7 },
  { dealer: '武汉雅迪服务中心', orders: 98, amount: 186200, achievement: 88.9 },
  { dealer: '长沙雅迪旗舰店', orders: 112, amount: 215800, achievement: 90.3 },
  { dealer: '成都雅迪体验店', orders: 125, amount: 242600, achievement: 94.1 },
  { dealer: '广州雅迪旗舰店', orders: 138, amount: 271300, achievement: 95.8 },
];

// ========== 数据分析 v2 - 订单量预测 ==========

export const forecastKpis = {
  todayOrders: { value: 47, trend: 8.5 },
  monthTotal: { value: 842, trend: 12.3 },
  growthRate: { value: 15.8, trend: 3.2 },
  tomorrowPrediction: { value: 52, confidence: '±6' },
};

// 近30天实际 vs 预测
export const orderHistory30 = Array.from({ length: 30 }, (_, i) => {
  const actual = randomInt(30, 65);
  return { date: `07/${String(i + 1).padStart(2, '0')}`, actual, predicted: actual + randomInt(-6, 8) };
});

// 未来7天预测
export const forecast7Days = Array.from({ length: 7 }, (_, i) => ({
  date: `07/${String(17 + i).padStart(2, '0')}`,
  predicted: randomInt(40, 60),
  lowerBound: randomInt(32, 45),
  upperBound: randomInt(55, 72),
}));

// 节假日/促销影响系数
export const eventImpact = [
  { event: '春节', period: '1月下旬-2月上旬', impactCoefficient: 0.35, effect: '订单量骤降70%' },
  { event: '国庆黄金周', period: '10月1-7日', impactCoefficient: 0.60, effect: '订单量下降40%' },
  { event: '618大促', period: '6月1-18日', impactCoefficient: 1.85, effect: '订单量增长85%' },
  { event: '双11', period: '11月1-11日', impactCoefficient: 1.60, effect: '订单量增长60%' },
  { event: '雅迪品牌日', period: '3月15日', impactCoefficient: 2.20, effect: '订单量增长120%' },
  { event: '开学季', period: '8月下旬-9月上旬', impactCoefficient: 1.45, effect: '订单量增长45%' },
  { event: '夏季骑行季', period: '5-7月', impactCoefficient: 1.30, effect: '订单量增长30%' },
];

// ========== 数据分析 v2 - 客户购买行为 ==========

export const behaviorKpis = {
  repurchaseRate: { value: 42.5, trend: 3.8 },
  avgOrderValue: { value: 4850, trend: 5.2 },
  activeDealers: { value: 128, trend: 8.0 },
  skuActiveRate: { value: 68.3, trend: -2.1 },
};

export const repurchaseTrend = [
  { month: '1月', rate: 38.2 }, { month: '2月', rate: 36.5 }, { month: '3月', rate: 40.1 },
  { month: '4月', rate: 41.8 }, { month: '5月', rate: 43.2 }, { month: '6月', rate: 42.5 },
  { month: '7月', rate: 42.5 },
];

export const avgOrderDistribution = [
  { range: '<1000元', count: 12 }, { range: '1000-3000元', count: 28 }, { range: '3000-5000元', count: 35 },
  { range: '5000-10000元', count: 22 }, { range: '10000-20000元', count: 18 }, { range: '>20000元', count: 13 },
];

export const categoryPreference = [
  { category: '制动系统', sales: 2850, share: 22.5, growth: 8.2 },
  { category: '电气系统', sales: 3200, share: 25.3, growth: 15.1 },
  { category: '传动系统', sales: 1800, share: 14.2, growth: -3.5 },
  { category: '底盘系统', sales: 2100, share: 16.6, growth: 5.8 },
  { category: '车身部件', sales: 1650, share: 13.0, growth: 2.1 },
  { category: '动力系统', sales: 1062, share: 8.4, growth: 12.6 },
];

// 经销商RFM分层
export const dealerRFM = [
  { dealer: '杭州雅迪旗舰店', frequency: 145, monetary: 285600, recency: '1天前', tier: '高价值' },
  { dealer: '郑州雅迪旗舰店', frequency: 156, monetary: 302100, recency: '2天前', tier: '高价值' },
  { dealer: '广州雅迪旗舰店', frequency: 138, monetary: 271300, recency: '3天前', tier: '高价值' },
  { dealer: '南京雅迪体验中心', frequency: 132, monetary: 258400, recency: '1天前', tier: '高价值' },
  { dealer: '成都雅迪体验店', frequency: 125, monetary: 242600, recency: '5天前', tier: '中价值' },
  { dealer: '合肥雅迪专卖店', frequency: 118, monetary: 221500, recency: '3天前', tier: '中价值' },
  { dealer: '长沙雅迪旗舰店', frequency: 112, monetary: 215800, recency: '7天前', tier: '中价值' },
  { dealer: '武汉雅迪服务中心', frequency: 98, monetary: 186200, recency: '4天前', tier: '低价值' },
];

// ========== 数据分析 v2 - 履约效率 ==========

export const fulfillmentKpis = {
  avgProcessHours: { value: 8.5, trend: -5.5 },
  avgDeliveryHours: { value: 22.3, trend: -8.0 },
  exceptionRate: { value: 4.2, trend: -1.5 },
  onTimeRate: { value: 93.5, trend: 2.8 },
};

export const stageTimeDetail = [
  { stage: '审核', 华东基地: 2.1, 华南基地: 2.5, 华北基地: 3.0, 西南基地: 2.8 },
  { stage: '排单', 华东基地: 4.2, 华南基地: 5.1, 华北基地: 4.8, 西南基地: 5.5 },
  { stage: '拣货', 华东基地: 8.5, 华南基地: 9.2, 华北基地: 10.1, 西南基地: 9.8 },
  { stage: '发货', 华东基地: 6.3, 华南基地: 7.0, 华北基地: 7.5, 西南基地: 8.2 },
  { stage: '运输', 华东基地: 18.2, 华南基地: 22.5, 华北基地: 20.1, 西南基地: 25.3 },
  { stage: '签收', 华东基地: 3.2, 华南基地: 3.8, 华北基地: 4.0, 西南基地: 4.5 },
];

export const deliveryDistribution = [
  { period: '24h内', 华东基地: 35, 华南基地: 28, 华北基地: 25, 西南基地: 20 },
  { period: '24-48h', 华东基地: 40, 华南基地: 38, 华北基地: 35, 西南基地: 32 },
  { period: '48-72h', 华东基地: 18, 华南基地: 22, 华北基地: 25, 西南基地: 28 },
  { period: '72h以上', 华东基地: 7, 华南基地: 12, 华北基地: 15, 西南基地: 20 },
];

export const exceptionRateTrend = Array.from({ length: 30 }, (_, i) => ({
  date: `07/${String(i + 1).padStart(2, '0')}`,
  缺货: randomInt(0, 3),
  破损: randomInt(0, 2),
  超时: randomInt(0, 2),
  其他: randomInt(0, 1),
}));

export const logisticsRanking = [
  { company: '顺丰速运', avgHours: 18.5, onTimeRate: 97.2, orderCount: 420 },
  { company: '京东物流', avgHours: 20.1, onTimeRate: 95.8, orderCount: 350 },
  { company: '德邦快递', avgHours: 24.3, onTimeRate: 92.5, orderCount: 280 },
  { company: '中通快递', avgHours: 28.7, onTimeRate: 89.1, orderCount: 200 },
  { company: '圆通速递', avgHours: 32.0, onTimeRate: 85.3, orderCount: 150 },
];

// ========== 数据分析 v2 - 三包与经营数据 ==========

export const warrantyBizKpis = {
  monthWarrantyDone: { value: 285, trend: 5.2 },
  monthNonWarrantyDone: { value: 1520, trend: 12.8 },
  warrantyRatio: { value: 15.8, trend: -2.1 },
  tier2OrderRatio: { value: 32.5, trend: 8.3 },
};

// 月/季/年 三包与非三包完成量（含二网拆分）
export const warrantyCompletionTrend = [
  { period: '2026-01', 三包完成: 260, 非三包完成: 1380, 二网三包: 72, 二网非三包: 420 },
  { period: '2026-02', 三包完成: 230, 非三包完成: 1250, 二网三包: 58, 二网非三包: 380 },
  { period: '2026-03', 三包完成: 290, 非三包完成: 1480, 二网三包: 85, 二网非三包: 460 },
  { period: '2026-04', 三包完成: 275, 非三包完成: 1420, 二网三包: 80, 二网非三包: 440 },
  { period: '2026-05', 三包完成: 300, 非三包完成: 1550, 二网三包: 95, 二网非三包: 500 },
  { period: '2026-06', 三包完成: 280, 非三包完成: 1500, 二网三包: 88, 二网非三包: 480 },
  { period: '2026-07', 三包完成: 285, 非三包完成: 1520, 二网三包: 90, 二网非三包: 500 },
];

// 季度汇总
export const quarterlyWarranty = [
  { quarter: 'Q1', 三包完成: 780, 非三包完成: 4110, 二网三包: 215, 二网非三包: 1260 },
  { quarter: 'Q2', 三包完成: 855, 非三包完成: 4470, 二网三包: 263, 二网非三包: 1420 },
  { quarter: 'Q3(至7月)', 三包完成: 285, 非三包完成: 1520, 二网三包: 90, 二网非三包: 500 },
];

// 下单习惯 - 按小时分布
export const hourlyOrders = [
  { hour: '0-2时', count: 8 }, { hour: '2-4时', count: 3 }, { hour: '4-6时', count: 5 },
  { hour: '6-8时', count: 42 }, { hour: '8-10时', count: 128 }, { hour: '10-12时', count: 145 },
  { hour: '12-14时', count: 95 }, { hour: '14-16时', count: 132 }, { hour: '16-18时', count: 118 },
  { hour: '18-20时', count: 65 }, { hour: '20-22时', count: 35 }, { hour: '22-24时', count: 15 },
];

// 下单习惯 - 按周几分布
export const weeklyOrders = [
  { day: '周一', count: 135 }, { day: '周二', count: 148 }, { day: '周三', count: 155 },
  { day: '周四', count: 142 }, { day: '周五', count: 138 }, { day: '周六', count: 72 }, { day: '周日', count: 52 },
];

// 周边热销（模拟以杭州为中心）
export const nearbyHotSkus = [
  { rank: 1, skuCode: 'YD-BP-001', skuName: '前刹车片总成', sales: 320, growth: 15.2, area: '杭州周边' },
  { rank: 2, skuCode: 'YD-FL-001', skuName: '空气滤芯', sales: 285, growth: 8.5, area: '杭州周边' },
  { rank: 3, skuCode: 'YD-BT-002', skuName: '石墨烯电池', sales: 250, growth: 22.1, area: '杭州周边' },
  { rank: 4, skuCode: 'YD-CH-001', skuName: '传动链条', sales: 210, growth: -3.2, area: '杭州周边' },
  { rank: 5, skuCode: 'YD-MT-002', skuName: '轮毂电机 800W', sales: 185, growth: 12.8, area: '杭州周边' },
  { rank: 6, skuCode: 'YD-LT-001', skuName: 'LED前大灯总成', sales: 160, growth: 5.5, area: '杭州周边' },
  { rank: 7, skuCode: 'YD-CT-002', skuName: '正弦波控制器', sales: 145, growth: 18.3, area: '杭州周边' },
  { rank: 8, skuCode: 'YD-SH-001', skuName: '后减震器', sales: 130, growth: -1.8, area: '杭州周边' },
  { rank: 9, skuCode: 'YD-TR-001', skuName: '轮胎套装', sales: 115, growth: 7.2, area: '杭州周边' },
  { rank: 10, skuCode: 'YD-CG-001', skuName: '充电器', sales: 98, growth: 10.5, area: '杭州周边' },
];

// 区域排行
export const regionRanking = [
  { region: '浙江省', orders: 485, amount: 1285000, growth: 12.5, share: 18.2 },
  { region: '江苏省', orders: 420, amount: 1120000, growth: 8.3, share: 15.8 },
  { region: '安徽省', orders: 350, amount: 920000, growth: 15.1, share: 13.2 },
  { region: '河南省', orders: 380, amount: 1010000, growth: 10.8, share: 14.3 },
  { region: '湖北省', orders: 290, amount: 760000, growth: -2.5, share: 10.9 },
  { region: '湖南省', orders: 270, amount: 710000, growth: 5.8, share: 10.1 },
  { region: '四川省', orders: 250, amount: 680000, growth: 18.2, share: 9.4 },
  { region: '广东省', orders: 215, amount: 580000, growth: -5.2, share: 8.1 },
];

// 热销SKU TOP20
export const hotSalesSkus = Array.from({ length: 20 }, (_, i) => {
  const names = ['前刹车片总成', '空气滤芯', '传动链条', '石墨烯电池', '轮毂电机', 'LED大灯', '控制器', '减震器', '轮胎套装', '充电器', '后视镜', '蓄电池', '机油滤芯', '尾灯总成', '车身外壳', '加强链条', '前减震器', '防眩后视镜', '快充充电器', '电池组'];
  const suppliers = ['BOSCH', 'MANN', 'DID', '雅迪原厂', '全顺', '欧司朗', '凯利', 'KYB', '正新', 'YUASA'];
  return {
    rank: i + 1,
    skuCode: `YD-XX-${String(i + 1).padStart(3, '0')}`,
    skuName: names[i],
    salesVolume: randomInt(120, 450),
    salesAmount: randomInt(15000, 180000),
    growth: Math.round(randomInt(-150, 250) / 10) * 10 / 10,
    supplier: randomPick(suppliers),
  };
});

// ========== 对账中心数据 ==========

export const reconciliationList = [
  { reconNo: 'RCN202607001', dealerId: 'DLR-001', dealerName: '杭州雅迪旗舰店', reconPeriod: '2026-07', receivableAmount: 285600, receivedAmount: 280500, diffAmount: 5100, orderCount: 145, diffOrderCount: 3, reconStatus: 'HAS_DIFFERENCE' as ReconStatus, createTime: '2026-07-16T08:00:00+08:00', items: [{ orderNo: 'OMS2026070100001', orderAmount: 3200, paidAmount: 3000, diffAmount: 200, hasDifference: true }, { orderNo: 'OMS2026070100002', orderAmount: 1800, paidAmount: 1800, diffAmount: 0, hasDifference: false }] },
  { reconNo: 'RCN202607002', dealerId: 'DLR-002', dealerName: '南京雅迪体验中心', reconPeriod: '2026-07', receivableAmount: 258400, receivedAmount: 258400, diffAmount: 0, orderCount: 132, diffOrderCount: 0, reconStatus: 'CONFIRMED' as ReconStatus, createTime: '2026-07-15T16:00:00+08:00', items: [] },
  { reconNo: 'RCN202607003', dealerId: 'DLR-003', dealerName: '合肥雅迪专卖店', reconPeriod: '2026-07', receivableAmount: 221500, receivedAmount: 218200, diffAmount: 3300, orderCount: 118, diffOrderCount: 2, reconStatus: 'PENDING_CONFIRM' as ReconStatus, createTime: '2026-07-16T09:30:00+08:00', items: [] },
  { reconNo: 'RCN202606001', dealerId: 'DLR-001', dealerName: '杭州雅迪旗舰店', reconPeriod: '2026-06', receivableAmount: 310200, receivedAmount: 310200, diffAmount: 0, orderCount: 158, diffOrderCount: 0, reconStatus: 'CLOSED' as ReconStatus, createTime: '2026-07-01T10:00:00+08:00', items: [] },
  { reconNo: 'RCN202606002', dealerId: 'DLR-004', dealerName: '郑州雅迪旗舰店', reconPeriod: '2026-06', receivableAmount: 302100, receivedAmount: 295000, diffAmount: 7100, orderCount: 156, diffOrderCount: 5, reconStatus: 'HAS_DIFFERENCE' as ReconStatus, createTime: '2026-07-02T14:00:00+08:00', items: [] },
];

export const differenceList = [
  { diffNo: 'DIF-001', reconNo: 'RCN202607001', orderNo: 'OMS2026070100001', dealerName: '杭州雅迪旗舰店', diffReason: '退货未扣除', diffAmount: 200, processStatus: 'PENDING' as const, handler: '张建国', createTime: '2026-07-16T10:00:00+08:00' },
  { diffNo: 'DIF-002', reconNo: 'RCN202607001', orderNo: 'OMS2026070100003', dealerName: '杭州雅迪旗舰店', diffReason: '价格差异', diffAmount: 4900, processStatus: 'ADJUSTED' as const, handler: '赵志强', createTime: '2026-07-16T09:00:00+08:00' },
  { diffNo: 'DIF-003', reconNo: 'RCN202606002', orderNo: 'OMS2026060100012', dealerName: '郑州雅迪旗舰店', diffReason: '漏单', diffAmount: 7100, processStatus: 'SUPPLEMENT' as const, handler: '王丽华', createTime: '2026-07-03T11:00:00+08:00' },
  { diffNo: 'DIF-004', reconNo: 'RCN202607003', orderNo: 'OMS2026070500008', dealerName: '合肥雅迪专卖店', diffReason: '价格差异', diffAmount: 3300, processStatus: 'PENDING' as const, handler: '张建国', createTime: '2026-07-16T11:30:00+08:00' },
];

export const paymentRecords = [
  { paymentNo: 'PAY-001', dealerName: '杭州雅迪旗舰店', paymentAmount: 150000, verifiedAmount: 120000, remainAmount: 30000, paymentDate: '2026-07-15', bankRefNo: 'BANK20260715001', status: 'PARTIAL' as const },
  { paymentNo: 'PAY-002', dealerName: '南京雅迪体验中心', paymentAmount: 258400, verifiedAmount: 258400, remainAmount: 0, paymentDate: '2026-07-14', bankRefNo: 'BANK20260714002', status: 'VERIFIED' as const },
  { paymentNo: 'PAY-003', dealerName: '郑州雅迪旗舰店', paymentAmount: 200000, verifiedAmount: 0, remainAmount: 200000, paymentDate: '2026-07-16', bankRefNo: 'BANK20260716003', status: 'UNVERIFIED' as const },
  { paymentNo: 'PAY-004', dealerName: '武汉雅迪服务中心', paymentAmount: 186200, verifiedAmount: 150000, remainAmount: 36200, paymentDate: '2026-07-13', bankRefNo: 'BANK20260713004', status: 'PARTIAL' as const },
];

export const agingData = [
  { dealer: '杭州雅迪旗舰店', within30: 280500, days30to60: 5100, days60to90: 0, over90: 0 },
  { dealer: '郑州雅迪旗舰店', within30: 250000, days30to60: 45000, days60to90: 7100, over90: 0 },
  { dealer: '武汉雅迪服务中心', within30: 150000, days30to60: 30000, days60to90: 6200, over90: 0 },
  { dealer: '长沙雅迪旗舰店', within30: 180000, days30to60: 28000, days60to90: 7800, over90: 0 },
];

export const paymentTrend = [
  { month: '1月', amount: 820000 }, { month: '2月', amount: 760000 }, { month: '3月', amount: 910000 },
  { month: '4月', amount: 880000 }, { month: '5月', amount: 950000 }, { month: '6月', amount: 1020000 },
  { month: '7月', amount: 980000 },
];

// ========== 系统设置数据 ==========

export const priceRules = [
  { ruleNo: 'PRC-001', dealerGrade: 'A级', discountRate: 0.85, region: '全国', effectiveDate: '2026-07-01', status: 'ACTIVE' as const },
  { ruleNo: 'PRC-002', dealerGrade: 'B级', discountRate: 0.90, region: '全国', effectiveDate: '2026-07-01', status: 'ACTIVE' as const },
  { ruleNo: 'PRC-003', dealerGrade: 'C级', discountRate: 0.95, region: '全国', effectiveDate: '2026-07-01', status: 'ACTIVE' as const },
  { ruleNo: 'PRC-004', dealerGrade: 'D级', discountRate: 0.98, region: '全国', effectiveDate: '2026-07-01', status: 'ACTIVE' as const },
  { ruleNo: 'PRC-005', dealerGrade: 'A级', discountRate: 0.80, region: '华东', effectiveDate: '2026-08-01', status: 'PENDING' as const },
];

export const promotions: Promotion[] = [
  { promoNo: 'PROMO-001', promoName: '夏日配件节', type: 'FULL_REDUCTION', startDate: '2026-07-01', endDate: '2026-08-31', status: 'ACTIVE', applicableSkus: ['YD-BP-001', 'YD-FL-001', 'YD-CH-001'] },
  { promoNo: 'PROMO-002', promoName: '新店开业特惠', type: 'DISCOUNT', startDate: '2026-07-15', endDate: '2026-08-15', status: 'ACTIVE', applicableSkus: ['YD-BT-002', 'YD-MT-002'] },
  { promoNo: 'PROMO-003', promoName: '电池以旧换新', type: 'BUY_GIFT', startDate: '2026-08-01', endDate: '2026-09-30', status: 'DRAFT', applicableSkus: ['YD-BT-001', 'YD-BT-002'] },
  { promoNo: 'PROMO-004', promoName: '春季保养套餐', type: 'COMBO', startDate: '2026-03-01', endDate: '2026-05-31', status: 'EXPIRED', applicableSkus: ['YD-FL-001', 'YD-FL-002', 'YD-BP-001'] },
];

export const baseConfigs: BaseConfig[] = [
  { baseCode: 'BASE-EAST', baseName: '华东基地', region: '华东', manager: '周明', phone: '13800001001', warehouseCount: 3, slaHours: 48, status: 'ACTIVE' },
  { baseCode: 'BASE-SOUTH', baseName: '华南基地', region: '华南', manager: '吴强', phone: '13800001002', warehouseCount: 2, slaHours: 72, status: 'ACTIVE' },
  { baseCode: 'BASE-NORTH', baseName: '华北基地', region: '华北', manager: '郑军', phone: '13800001003', warehouseCount: 2, slaHours: 72, status: 'ACTIVE' },
  { baseCode: 'BASE-WEST', baseName: '西南基地', region: '西南', manager: '冯磊', phone: '13800001004', warehouseCount: 1, slaHours: 96, status: 'ACTIVE' },
];

export const logisticsProviders: LogisticsProvider[] = [
  { providerCode: 'LOG-SF', providerName: '顺丰速运', contact: '王经理', phone: '95338', serviceArea: '全国', apiStatus: 'CONNECTED', status: 'ACTIVE' },
  { providerCode: 'LOG-JD', providerName: '京东物流', contact: '李经理', phone: '950616', serviceArea: '全国', apiStatus: 'CONNECTED', status: 'ACTIVE' },
  { providerCode: 'LOG-DB', providerName: '德邦快递', contact: '赵经理', phone: '95353', serviceArea: '全国', apiStatus: 'CONNECTED', status: 'ACTIVE' },
  { providerCode: 'LOG-ZT', providerName: '中通快递', contact: '陈经理', phone: '95311', serviceArea: '全国', apiStatus: 'DISCONNECTED', status: 'ACTIVE' },
  { providerCode: 'LOG-YT', providerName: '圆通速递', contact: '林经理', phone: '95554', serviceArea: '华东/华南', apiStatus: 'ERROR', status: 'ACTIVE' },
];

export const systemUsers: SystemUser[] = [
  { userId: 'U-001', username: 'zhangjianguo', realName: '张建国', role: '运营主管', department: '运营部', status: 'ENABLED', lastLoginTime: '2026-07-16T09:00:00+08:00' },
  { userId: 'U-002', username: 'liminghui', realName: '李明辉', role: '仓管员', department: '仓储部', status: 'ENABLED', lastLoginTime: '2026-07-16T08:30:00+08:00' },
  { userId: 'U-003', username: 'wanglihua', realName: '王丽华', role: '客服专员', department: '客服部', status: 'ENABLED', lastLoginTime: '2026-07-16T10:00:00+08:00' },
  { userId: 'U-004', username: 'zhaozhiqiang', realName: '赵志强', role: '运营专员', department: '运营部', status: 'ENABLED', lastLoginTime: '2026-07-15T17:00:00+08:00' },
  { userId: 'U-005', username: 'chenxiaofang', realName: '陈晓芳', role: '仓管员', department: '仓储部', status: 'DISABLED', lastLoginTime: '2026-07-01T12:00:00+08:00' },
];

export const roles: Role[] = [
  { roleId: 'R-001', roleName: '运营主管', userCount: 3, permissions: ['dashboard:view', 'orders:*', 'exceptions:*', 'products:*', 'analytics:*', 'reconciliation:*', 'settings:view'], dataScope: '全部' },
  { roleId: 'R-002', roleName: '仓管员', userCount: 8, permissions: ['dashboard:view', 'orders:view', 'exceptions:view', 'exceptions:handle', 'products:view'], dataScope: '所属基地' },
  { roleId: 'R-003', roleName: '客服专员', userCount: 5, permissions: ['orders:view', 'orders:call400', 'exceptions:view'], dataScope: '全部' },
  { roleId: 'R-004', roleName: '数据分析师', userCount: 2, permissions: ['dashboard:view', 'analytics:*'], dataScope: '全部' },
  { roleId: 'R-005', roleName: '系统管理员', userCount: 1, permissions: ['*'], dataScope: '全部' },
];

export const auditLogs: AuditLog[] = Array.from({ length: 10 }, (_, i) => ({
  logId: `LOG-${String(i + 1).padStart(4, '0')}`,
  operator: randomPick(['张建国', '李明辉', '王丽华', '赵志强', '系统']),
  module: randomPick(['订单管理', '异常中心', '商品管理', '系统设置', '对账中心']),
  actionType: randomPick(['新增', '编辑', '删除', '导出', '审批', '登录']),
  target: randomPick(['OMS2026070100001', 'YD-BP-001', '用户-张建国', '价格策略PRC-001', '角色-运营主管']),
  changes: JSON.stringify({ before: { status: 'PENDING' }, after: { status: 'APPROVED' } }),
  ipAddress: `192.168.${randomInt(1, 255)}.${randomInt(1, 255)}`,
  createTime: formatDate(new Date(2026, 6, 16, randomInt(8, 17), randomInt(0, 59))),
}));

export const systemParams = [
  { paramKey: 'autoAudit', paramName: '订单自动审核', paramValue: false, defaultValue: '关闭', description: '满足条件的订单自动通过审核', type: 'SWITCH' as const },
  { paramKey: 'autoEscalate', paramName: '异常自动升级', paramValue: true, defaultValue: '开启', description: '超时未处理的异常自动升级', type: 'SWITCH' as const },
  { paramKey: 'invoiceDelay', paramName: '开票延迟天数', paramValue: 3, defaultValue: '3', description: '签收后N天自动开票', type: 'NUMBER' as const },
  { paramKey: 'appointRemind', paramName: '预约到期提醒', paramValue: 3, defaultValue: '3', description: '提前N天发送提醒', type: 'NUMBER' as const },
  { paramKey: 'pageSize', paramName: '表格默认每页条数', paramValue: 20, defaultValue: '20', description: '列表页默认分页大小', type: 'NUMBER' as const },
  { paramKey: 'exportLimit', paramName: '数据导出上限', paramValue: 50000, defaultValue: '50000', description: '单次导出最大行数', type: 'NUMBER' as const },
  { paramKey: 'diffThreshold', paramName: '差异审批阈值', paramValue: 5000, defaultValue: '5000', description: '差异金额超过此值需审批', type: 'NUMBER' as const },
  { paramKey: 'shareFeeRate', paramName: '库存共享服务费率', paramValue: 2, defaultValue: '2', description: '共享金额的服务费百分比', type: 'NUMBER' as const },
];

// ========== 整车发货计划数据 ==========

export const vehicleShippingPlans = [
  { planNo: 'VSP-20260701', vehicleModel: '雅迪冠能DE8', vehicleCount: 18, dealerName: '杭州雅迪旗舰店', dealerId: 'DLR-001', plannedShipDate: '2026-07-18', actualShipDate: undefined, route: '华东线-沪杭段', driver: '王建国', matchedOrders: ['OMS2026070100001', 'OMS2026070300003'], remainingCapacity: 8, status: 'PLANNED' as const },
  { planNo: 'VSP-20260702', vehicleModel: '雅迪冠能DE3', vehicleCount: 12, dealerName: '南京雅迪体验中心', dealerId: 'DLR-002', plannedShipDate: '2026-07-17', actualShipDate: '2026-07-17', route: '华东线-宁镇段', driver: '李强', matchedOrders: ['OMS2026070200005'], remainingCapacity: 5, status: 'IN_TRANSIT' as const },
  { planNo: 'VSP-20260703', vehicleModel: '雅迪DE8+冠能混合', vehicleCount: 22, dealerName: '合肥雅迪专卖店', dealerId: 'DLR-003', plannedShipDate: '2026-07-19', actualShipDate: undefined, route: '华东线-皖中段', driver: '张明', matchedOrders: ['OMS2026070400007', 'OMS2026070600009'], remainingCapacity: 10, status: 'LOADING' as const },
  { planNo: 'VSP-20260704', vehicleModel: '雅迪冠能DE8', vehicleCount: 15, dealerName: '郑州雅迪旗舰店', dealerId: 'DLR-004', plannedShipDate: '2026-07-20', actualShipDate: undefined, route: '华中线-豫中段', driver: '赵伟', matchedOrders: [], remainingCapacity: 15, status: 'PLANNED' as const },
  { planNo: 'VSP-20260705', vehicleModel: '雅迪DE3', vehicleCount: 10, dealerName: '武汉雅迪服务中心', dealerId: 'DLR-005', plannedShipDate: '2026-07-18', actualShipDate: '2026-07-18', route: '华中线-鄂东段', driver: '陈军', matchedOrders: ['OMS2026070500011'], remainingCapacity: 4, status: 'ARRIVED' as const },
  { planNo: 'VSP-20260706', vehicleModel: '雅迪冠能DE8', vehicleCount: 20, dealerName: '杭州雅迪旗舰店', dealerId: 'DLR-001', plannedShipDate: '2026-07-22', actualShipDate: undefined, route: '华东线-沪杭段', driver: '刘磊', matchedOrders: [], remainingCapacity: 20, status: 'PLANNED' as const },
];

// ========== 供应商缺件ETA数据 ==========

export const supplierETAData: Record<string, { skuCode: string; skuName: string; shortageQty: number; supplier: string; estimatedArrival: string; reason: string }[]> = {};
mockOrders.filter((o) => ['PENDING_REVIEW', 'SCHEDULING', 'PICKING', 'READY_TO_SHIP'].includes(o.status)).slice(0, 8).forEach((order) => {
  const shortageItems = order.items.filter((it) => it.shortageQty > 0);
  if (shortageItems.length > 0 || Math.random() > 0.4) {
    const items = shortageItems.length > 0 ? shortageItems : [order.items[0]];
    supplierETAData[order.orderNo] = items.map((it) => ({
      skuCode: it.skuCode, skuName: it.skuName,
      shortageQty: it.shortageQty || randomInt(1, 5),
      supplier: randomPick(['BOSCH', 'MANN', 'DID', '博世', '全顺', '凯利', '雅迪原厂']),
      estimatedArrival: formatDate(new Date(2026, 6, randomInt(17, 25), randomInt(8, 18))),
      reason: randomPick(['SUPPLIER_PENDING', 'IN_TRANSIT', 'CUSTOMS', 'PRODUCTION']),
    }));
  }
});
