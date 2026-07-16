// ========== 订单相关类型 ==========

export type BizType = 'REGULAR' | 'APPOINTMENT' | 'CUSTOM' | 'CALL_400' | 'REQUISITION';
export type UrgencyLevel = 'NORMAL' | 'URGENT' | 'CRITICAL';
export type FulfillMethod = 'DIRECT_SHIP' | 'WAREHOUSE_SHIP' | 'TRANSFER';
export type OrderStatus =
  | 'PENDING_REVIEW'
  | 'SCHEDULING'
  | 'PICKING'
  | 'READY_TO_SHIP'
  | 'IN_TRANSIT'
  | 'DELIVERED'
  | 'EXCEPTION'
  | 'COMPLETED';

export interface OrderItem {
  skuCode: string;
  skuName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  shortageQty: number;
}

export interface OrderDTO {
  orderNo: string;
  dealerId: string;
  dealerName: string;
  bizType: BizType;
  urgencyLevel: UrgencyLevel;
  fulfillMethod: FulfillMethod;
  status: OrderStatus;
  vinCode: string;
  baseSource: string;
  shortageFlag: boolean;
  skuCount: number;
  totalAmount: number;
  createTime: string;
  receiverProvince: string;
  receiverCity: string;
  receiverDistrict: string;
  receiverAddress: string;
  receiverName: string;
  receiverPhone: string;
  items: OrderItem[];
  trackingNo?: string;
  logisticsCompany?: string;
}

// ========== 预约单相关类型 ==========

export type AppointStatus = 'PENDING_CONFIRM' | 'CONFIRMED' | 'EXPIRED' | 'CANCELLED' | 'EXECUTED';

export interface AppointmentDTO {
  appointNo: string;
  orderNo: string;
  dealerId: string;
  dealerName: string;
  appointDate: string;
  appointStatus: AppointStatus;
  skuTypes: number;
  remark: string;
  createTime: string;
}

// ========== 异常相关类型 ==========

export type ExceptionType = 'SHORTAGE' | 'DAMAGE' | 'WRONG_ITEM' | 'REJECTION' | 'TIMEOUT' | 'ADDRESS_ERROR' | 'OTHER';
export type Priority = 'P0' | 'P1' | 'P2' | 'P3';
export type ExceptionStatus = 'PENDING' | 'PROCESSING' | 'RESOLVED' | 'CLOSED';
export type ResponsibleParty = 'WAREHOUSE' | 'LOGISTICS' | 'SUPPLIER' | 'DEALER' | 'SYSTEM';

export interface ExceptionDTO {
  exceptionNo: string;
  orderNo: string;
  exceptionType: ExceptionType;
  priority: Priority;
  description: string;
  responsibleParty: ResponsibleParty;
  status: ExceptionStatus;
  discoverTime: string;
  deadline: string;
  handler: string;
}

// ========== 操作日志 ==========

export interface OperationLog {
  time: string;
  operator: string;
  role: string;
  action: string;
  remark?: string;
}

// ========== 状态标签映射 ==========

export const ORDER_STATUS_MAP: Record<OrderStatus, string> = {
  PENDING_REVIEW: '待审核',
  SCHEDULING: '排单中',
  PICKING: '拣货中',
  READY_TO_SHIP: '待发货',
  IN_TRANSIT: '运输中',
  DELIVERED: '已签收',
  EXCEPTION: '异常',
  COMPLETED: '已完成',
};

export const BIZ_TYPE_MAP: Record<BizType, string> = {
  REGULAR: '常规',
  APPOINTMENT: '预约',
  CUSTOM: '定制',
  CALL_400: '400',
  REQUISITION: '领用',
};

export const URGENCY_MAP: Record<UrgencyLevel, { label: string; color: string }> = {
  CRITICAL: { label: '特急', color: '#E11D48' },
  URGENT: { label: '紧急', color: '#FF6B00' },
  NORMAL: { label: '普通', color: '#8C8C8C' },
};

export const FULFILL_METHOD_MAP: Record<FulfillMethod, string> = {
  DIRECT_SHIP: '直发',
  WAREHOUSE_SHIP: '仓发',
  TRANSFER: '调拨',
};

export const EXCEPTION_TYPE_MAP: Record<ExceptionType, { label: string; color: string }> = {
  SHORTAGE: { label: '缺货', color: '#E11D48' },
  DAMAGE: { label: '破损', color: '#D97706' },
  WRONG_ITEM: { label: '错发', color: '#7C3AED' },
  REJECTION: { label: '拒收', color: '#DC2626' },
  TIMEOUT: { label: '超时', color: '#F59E0B' },
  ADDRESS_ERROR: { label: '地址异常', color: '#0891B2' },
  OTHER: { label: '其他', color: '#6B7280' },
};

export const PRIORITY_MAP: Record<Priority, { label: string; color: string }> = {
  P0: { label: 'P0-紧急', color: '#E11D48' },
  P1: { label: 'P1-高', color: '#FF6B00' },
  P2: { label: 'P2-中', color: '#0284C7' },
  P3: { label: 'P3-低', color: '#8C8C8C' },
};

export const EXCEPTION_STATUS_MAP: Record<ExceptionStatus, string> = {
  PENDING: '待处理',
  PROCESSING: '处理中',
  RESOLVED: '已解决',
  CLOSED: '已关闭',
};

export const APPOINT_STATUS_MAP: Record<AppointStatus, string> = {
  PENDING_CONFIRM: '待确认',
  CONFIRMED: '已确认',
  EXPIRED: '已到期',
  CANCELLED: '已取消',
  EXECUTED: '已执行',
};

export const ORDER_STATUS_STEPS: OrderStatus[] = [
  'PENDING_REVIEW',
  'SCHEDULING',
  'PICKING',
  'READY_TO_SHIP',
  'IN_TRANSIT',
  'DELIVERED',
  'COMPLETED',
];

// ========== 定制订单相关类型 ==========

export type CustomType = 'MODIFICATION' | 'SPECIAL_MATERIAL' | 'SIZE_CUSTOM' | 'KIT_ASSEMBLY';
export type CustomApprovalStatus =
  | 'DRAFT'
  | 'TECH_REVIEW'
  | 'QUOTE_PENDING'
  | 'IN_PRODUCTION'
  | 'COMPLETED'
  | 'REJECTED';

export const CUSTOM_TYPE_MAP: Record<CustomType, { label: string; color: string }> = {
  MODIFICATION: { label: '改型加工', color: '#7C3AED' },
  SPECIAL_MATERIAL: { label: '特殊材质', color: '#0284C7' },
  SIZE_CUSTOM: { label: '尺寸定制', color: '#D97706' },
  KIT_ASSEMBLY: { label: '套件组装', color: '#16A34A' },
};

export const CUSTOM_APPROVAL_MAP: Record<CustomApprovalStatus, { label: string; color: string }> = {
  DRAFT: { label: '待提交', color: '#8C8C8C' },
  TECH_REVIEW: { label: '技术评审中', color: '#0284C7' },
  QUOTE_PENDING: { label: '报价待确认', color: '#F59E0B' },
  IN_PRODUCTION: { label: '生产中', color: '#FF6B00' },
  COMPLETED: { label: '已完成', color: '#16A34A' },
  REJECTED: { label: '已拒绝', color: '#E11D48' },
};

export interface CustomOrderDTO {
  customNo: string;
  orderNo: string;
  dealerId: string;
  dealerName: string;
  customType: CustomType;
  specDescription: string;
  processRequirement: string;
  expectFinishDate: string;
  approvalStatus: CustomApprovalStatus;
  quoteAmount: number;
  attachments: string[];
  vinCode: string;
  materialCost: number;
  laborCost: number;
  markupRate: number;
  createTime: string;
}

// ========== 400免费订单相关类型 ==========

export type ApplyReason = 'QUALITY_ISSUE' | 'WRONG_ITEM' | 'TRANSPORT_DAMAGE' | 'SHORTAGE' | 'OTHER';
export type FreeType = 'RESHIP' | 'EXCHANGE' | 'GIFT_COMPENSATION';
export type Call400ApprovalStatus = 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED' | 'SHIPPED';

export const APPLY_REASON_MAP: Record<ApplyReason, string> = {
  QUALITY_ISSUE: '质量问题',
  WRONG_ITEM: '错发补发',
  TRANSPORT_DAMAGE: '运输破损',
  SHORTAGE: '缺件补发',
  OTHER: '其他',
};

export const FREE_TYPE_MAP: Record<FreeType, { label: string; color: string }> = {
  RESHIP: { label: '补发', color: '#0284C7' },
  EXCHANGE: { label: '换货', color: '#7C3AED' },
  GIFT_COMPENSATION: { label: '赠品补偿', color: '#16A34A' },
};

export const CALL400_APPROVAL_MAP: Record<Call400ApprovalStatus, { label: string; color: string }> = {
  PENDING_APPROVAL: { label: '待审批', color: '#F59E0B' },
  APPROVED: { label: '已通过', color: '#16A34A' },
  REJECTED: { label: '已拒绝', color: '#E11D48' },
  SHIPPED: { label: '已发货', color: '#0284C7' },
};

export interface Call400DTO {
  call400No: string;
  originOrderNo: string;
  complaintNo: string;
  dealerId: string;
  dealerName: string;
  applyReason: ApplyReason;
  freeType: FreeType;
  approvalStatus: Call400ApprovalStatus;
  applicant: string;
  items: { skuCode: string; skuName: string; quantity: number }[];
  createTime: string;
}

// ========== 运单/物流相关类型 ==========

export type TrackStatus = 'PICKED_UP' | 'IN_TRANSIT' | 'DELIVERING' | 'DELIVERED' | 'EXCEPTION';

export const TRACK_STATUS_MAP: Record<TrackStatus, { label: string; color: string }> = {
  PICKED_UP: { label: '已揽收', color: '#0284C7' },
  IN_TRANSIT: { label: '运输中', color: '#FF6B00' },
  DELIVERING: { label: '派送中', color: '#7C3AED' },
  DELIVERED: { label: '已签收', color: '#16A34A' },
  EXCEPTION: { label: '异常', color: '#E11D48' },
};

export interface TrackingNode {
  time: string;
  location: string;
  description: string;
}

export interface TrackingDTO {
  trackingNo: string;
  orderNo: string;
  logisticsCompany: string;
  warehouseName: string;
  receiverAddress: string;
  trackStatus: TrackStatus;
  lastUpdateTime: string;
  nodes: TrackingNode[];
  estimatedDelivery?: string;
}

// ========== 商品相关类型 ==========

export type ProductStatus = 'ON_SHELF' | 'OFF_SHELF' | 'DISABLED';

export const PRODUCT_STATUS_MAP: Record<ProductStatus, { label: string; color: string }> = {
  ON_SHELF: { label: '上架', color: '#16A34A' },
  OFF_SHELF: { label: '下架', color: '#8C8C8C' },
  DISABLED: { label: '停用', color: '#E11D48' },
};

export interface ProductDTO {
  skuCode: string;
  skuName: string;
  categoryPath: string;
  specification: string;
  unit: string;
  brand: string;
  basePrice: number;
  costPrice: number;
  suggestRetailPrice: number;
  packageType: string;
  weightKg: number;
  volumeCm3: number;
  barcode: string;
  baseSource: string;
  vehicleModelCount: number;
  substituteSkuCodes: string[];
  certificateTemplateId: string;
  status: ProductStatus;
  updateTime: string;
}
