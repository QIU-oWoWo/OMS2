import type { OrderDTO, AppointmentDTO, ExceptionDTO, OperationLog } from '../types';

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

// ========== 导出数据 ==========

export const mockOrders = generateOrders();
export const mockAppointments = generateAppointments(mockOrders);
export const mockExceptions = generateExceptions(mockOrders);
export const mockOperationLogs = generateOperationLogs();

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
