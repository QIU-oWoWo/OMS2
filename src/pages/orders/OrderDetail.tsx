import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Descriptions, Table, Tag, Space, Button, Typography, Row, Col, Breadcrumb, Divider, Modal, message } from 'antd';
import { ArrowLeftOutlined, CarOutlined, InboxOutlined, ExclamationCircleOutlined, TruckOutlined, SplitCellsOutlined, DownOutlined, UpOutlined, ShoppingCartOutlined, SendOutlined, CheckCircleFilled, CalendarOutlined, CheckCircleOutlined, CloseCircleOutlined, PaperClipOutlined, FileProtectOutlined, AppstoreOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { mockOrders, mockDeliveryNotes, getOperationLogs, mockExceptions, getSplitShipmentData, getOrderParcels, mockAppointments, mockCustomOrders, mockCall400Orders } from '../../data/mockData';
import { ORDER_STATUS_MAP, ORDER_STATUS_COLOR_MAP, BIZ_TYPE_MAP, URGENCY_MAP, FULFILL_METHOD_MAP, EXCEPTION_TYPE_MAP, EXCEPTION_STATUS_MAP, SUPPLIER_STATUS_MAP, STOCK_STATUS_MAP, PACKAGE_STATUS_MAP, STATUS_COLORS, ORDER_FLOW_NODES, STATUS_TO_FLOW_NODE, APPOINT_STATUS_MAP, CUSTOM_TYPE_MAP, CUSTOM_APPROVAL_MAP, APPLY_REASON_MAP, FREE_TYPE_MAP, CALL400_APPROVAL_MAP } from '../../types';
import type { LineItem, AppointmentDTO, CustomOrderDTO, Call400DTO, AppointStatus, CustomApprovalStatus, OrderStatus } from '../../types';

const { Title, Text } = Typography;

// ========== 折叠区块 ==========

function CollapsibleSection({
  title, icon, badge, summary, defaultExpanded = false, children,
}: {
  title: string; icon?: React.ReactNode; badge?: React.ReactNode;
  summary: string; defaultExpanded?: boolean; children: React.ReactNode;
}) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  return (
    <div style={{ marginBottom: 12, background: '#FFF', borderRadius: 8, border: '1px solid #F0F0F0' }}>
      <div
        onClick={() => setExpanded(!expanded)}
        style={{ cursor: 'pointer', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 10, userSelect: 'none' }}
      >
        {icon}
        <Text strong style={{ fontSize: 14 }}>{title}</Text>
        {badge}
        <Text type="secondary" style={{ fontSize: 12, flex: 1 }}>{summary}</Text>
        {expanded ? <UpOutlined style={{ color: '#8C8C8C' }} /> : <DownOutlined style={{ color: '#8C8C8C' }} />}
      </div>
      {expanded && (
        <div style={{ padding: '0 16px 12px', borderTop: '1px solid #F0F0F0' }}>
          {children}
        </div>
      )}
    </div>
  );
}

// ========== 订单详情主体 ==========

export default function OrderDetail() {
  const { orderNo } = useParams<{ orderNo: string }>();
  const navigate = useNavigate();

  const order = mockOrders.find((o) => o.orderNo === orderNo);

  // Hooks 必须在所有 early return 之前
  const [localStatus, setLocalStatus] = useState<OrderStatus | null>(null);

  if (!order) return (<div style={{ textAlign: 'center', padding: 80 }}><Title level={3} type="secondary">订单未找到</Title><Button type="link" onClick={() => navigate('/orders')}>返回订单列表</Button></div>);

  const deliveryNote = mockDeliveryNotes.find((dn) => dn.orderNo === orderNo);
  const operationLogs = getOperationLogs(order);
  const linkedExceptions = mockExceptions.filter((e) => e.orderNo === orderNo);
  const splitData = getSplitShipmentData(order.orderNo);
  const parcels = getOrderParcels(order.orderNo);
  const appointment = order.bizType === 'APPOINTMENT' ? mockAppointments.find((a) => a.orderNo === orderNo) : null;
  const customOrder = order.bizType === 'CUSTOM' ? mockCustomOrders.find((c) => c.orderNo === orderNo) : null;
  const call400Order = order.bizType === 'CALL_400' ? mockCall400Orders.find((c) => c.originOrderNo === orderNo) : null;
  const isSpecialType = ['APPOINTMENT', 'CUSTOM', 'CALL_400', 'REQUISITION'].includes(order.bizType);

  const displayStatus = localStatus || order.status;
  const isPendingReview = displayStatus === 'PENDING_REVIEW';

  // 订单状态判断（使用 localStatus 覆盖以支持模拟操作）
  const flowNodeIdx = STATUS_TO_FLOW_NODE[displayStatus];
  const isException = displayStatus === 'EXCEPTION_HOLD' || displayStatus === 'EXCEPTION' || displayStatus === 'RETURN_PROCESSING';
  const isTerminal = ['ORDER_TERMINATED', 'CANCELLED'].includes(displayStatus);
  const shippingMethod = order.shippingMethod;
  const shortagePolicy = order.shortagePolicy;

  // 商品明细（平铺所有行项）
  const pkgs = order.packages || [];
  const allLineItems: (LineItem & { packageLabel: string; packageType: string })[] = useMemo(() => {
    if (pkgs.length === 0) {
      return order.items.map((it) => ({
        ...it,
        stockStatus: 'IN_STOCK' as const,
        packageLabel: '包裹',
        packageType: 'ORIGINAL' as const,
      }));
    }
    return pkgs.flatMap((p, pkgIdx) =>
      p.lineItems.map((li) => ({
        ...li,
        packageLabel: `包裹${pkgIdx + 1}`,
        packageType: p.packageType,
      }))
    );
  }, [pkgs, order.items]);

  const shortageCount = allLineItems.filter((li) => li.stockStatus !== 'IN_STOCK').length;
  const hasExternalPurchase = pkgs.some((p) => p.lineItems.some((li) => li.stockStatus !== 'IN_STOCK'));

  const productColumns: ColumnsType<typeof allLineItems[number]> = [
    { title: 'SKU编码', dataIndex: 'skuCode', width: 120, render: (c: string) => <span style={{ fontFamily: 'monospace', fontSize: 12 }}>{c}</span> },
    { title: '商品名称', dataIndex: 'skuName', width: 200 },
    { title: '单价', dataIndex: 'unitPrice', width: 80, align: 'right', render: (p: number) => `¥${p.toLocaleString()}` },
    { title: '数量', dataIndex: 'quantity', width: 60, align: 'center' },
    {
      title: '库存状态', dataIndex: 'stockStatus', width: 90,
      render: (s: string) => {
        const info = STOCK_STATUS_MAP[s as keyof typeof STOCK_STATUS_MAP];
        return info ? <Tag color={info.color} style={{ margin: 0 }}>{info.label}</Tag> : <span>-</span>;
      },
    },
    { title: '所属包裹', dataIndex: 'packageLabel', width: 80, render: (l: string, r: typeof allLineItems[number]) => <Tag color={r.packageType === 'SUPPLEMENT' ? 'orange' : 'blue'} style={{ margin: 0, fontSize: 11 }}>{l}</Tag> },
    {
      title: '供应商', dataIndex: 'supplierInfo', width: 160,
      render: (si: typeof allLineItems[number]['supplierInfo']) => {
        if (!si) return <Text type="secondary">-</Text>;
        return <span style={{ fontSize: 11, color: STATUS_COLORS.warning }}>🏭 {si.supplierName} · 预计 {si.expectedArrivalDate} 到</span>;
      },
    },
  ];

  // 颜色映射
  const statusTagColor = (s: string) => {
    const c = ORDER_STATUS_COLOR_MAP[s as keyof typeof ORDER_STATUS_COLOR_MAP];
    if (c === STATUS_COLORS.error) return 'error';
    if (c === STATUS_COLORS.success) return 'success';
    if (c === STATUS_COLORS.warning) return 'warning';
    if (c === STATUS_COLORS.normal) return 'processing';
    return 'default';
  };

  const pkgStatusTagColor = (s: string) => {
    if (s === 'DELIVERED' || s === 'COMPLETED') return 'success';
    if (s === 'SHIPPED') return 'processing';
    if (s === 'WAITING_RESTOCK') return 'warning';
    return 'default';
  };

  const APPOINT_STATUS_COLORS: Record<string, string> = {
    PENDING_CONFIRM: '#F59E0B',
    CONFIRMED: '#0284C7',
    EXPIRED: '#8C8C8C',
    CANCELLED: '#E11D48',
    EXECUTED: '#16A34A',
  };

  // ========== 渲染：7节点主流程状态追踪器（包裹级状态指示） ==========
  const renderStatusBar = () => {
    if (flowNodeIdx < 0) return null;

    const totalNodes = ORDER_FLOW_NODES.length;
    const pkgs = (order.packages && order.packages.length > 0) ? order.packages : [{ packageId: 'default', packageType: 'ORIGINAL' as const, status: 'READY' as const, lineItems: order.items.map(it => ({ ...it, stockStatus: 'IN_STOCK' as const, shortageQty: 0 })), shippingMethod: order.shippingMethod }];
    const totalPkgCount = pkgs.length;

    // --- 各节点是否「全部包裹已完成」 ---
    const allPastStatus = (statuses: string[]) => pkgs.every(p => statuses.includes(p.status));
    const anyPastStatus = (statuses: string[]) => pkgs.some(p => statuses.includes(p.status));

    const nodeCompleted: boolean[] = [
      true,                                                      // 0 下单
      displayStatus !== 'PENDING_REVIEW',                        // 1 审核中
      !['PENDING_REVIEW', 'SCHEDULING'].includes(displayStatus), // 2 排单中
      allPastStatus(['READY', 'SHIPPED', 'DELIVERED', 'COMPLETED']), // 3 拣货中
      allPastStatus(['SHIPPED', 'DELIVERED', 'COMPLETED']),     // 4 待发货
      allPastStatus(['SHIPPED', 'DELIVERED', 'COMPLETED']),     // 5 运输中
      allPastStatus(['DELIVERED', 'COMPLETED']),                // 6 已签收/完成
    ];

    // 找到当前活跃节点（第一个未完成的）
    let activeIdx = flowNodeIdx;
    // 当前活跃节点所有包裹都已完成 → 推进到下一个未完成节点
    while (activeIdx < totalNodes - 1 && nodeCompleted[activeIdx]) {
      activeIdx++;
    }

    // --- 包裹→节点摘要映射（用于节点5/6下方包裹级说明） ---
    const getPkgStatusDot = (pkgStatus: string) => {
      if (['DELIVERED', 'COMPLETED'].includes(pkgStatus)) return { color: '#16A34A', char: '●' };
      if (pkgStatus === 'SHIPPED') return { color: '#FF6B00', char: '●' };
      return { color: '#BFBFBF', char: '○' };
    };
    const getPkgStatusLabel = (pkgStatus: string) => {
      if (['DELIVERED', 'COMPLETED'].includes(pkgStatus)) return '已签收';
      if (pkgStatus === 'SHIPPED') return '运输中';
      if (pkgStatus === 'WAITING_RESTOCK') return '待补货';
      if (pkgStatus === 'READY') return '待发货';
      if (pkgStatus === 'PICKING') return '拣货中';
      return '待处理';
    };

    // --- 各节点摘要文字 ---
    const getNodeSummary = (nodeIdx: number): string => {
      if (nodeIdx > activeIdx) return '';
      if (nodeIdx === 0) return order.createTime.replace('T', ' ').substring(5, 16);
      if (nodeIdx === 1) return order.createTime.replace('T', ' ').substring(5, 16);
      if (nodeIdx === 2) return totalPkgCount > 1 ? `拆为${totalPkgCount}包裹` : '整单发出';
      if (nodeIdx === 3) {
        const pickingNow = pkgs.filter(p => p.status === 'PICKING').length;
        return pickingNow === 0 ? '拣货已完成' : `${pickingNow}/${totalPkgCount}包裹拣货中`;
      }
      if (nodeIdx === 4) {
        const waitingNow = pkgs.filter(p => p.status === 'WAITING_RESTOCK').length;
        return waitingNow === 0 ? '全部包裹已发货' : `${waitingNow}包裹缺件等待`;
      }
      return '';
    };

    // Yadea 白橙配色
    const ORANGE = '#FF6B00';
    const ORANGE_GLOW = 'rgba(255,107,0,0.10)';
    const GRAY_LINE = '#E8E8E8';
    const GRAY_FUTURE = '#BFBFBF';
    const GREEN = '#16A34A';

    const summaries: string[] = Array.from({ length: totalNodes }, (_, i) => getNodeSummary(i));

    return (
      <div style={{ marginTop: 20 }}>
        {/* ===== 第1行：步骤圆点 + 连接线 ===== */}
        <div style={{ display: 'flex', alignItems: 'center' }}>
          {ORDER_FLOW_NODES.map((node, i) => {
            const isFirst = i === 0;
            const isLast = i === totalNodes - 1;
            const completed = i < activeIdx || (i === activeIdx && nodeCompleted[i]);
            const isActive = i === activeIdx && !nodeCompleted[i];
            const isFuture = i > activeIdx;
            const lineColor = completed ? ORANGE : GRAY_LINE;

            return (
              <div key={node.key} style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
                <div style={{ flex: 1, height: 2, background: isFirst ? 'transparent' : lineColor, transition: 'background 0.3s ease' }} />
                <div style={{
                  width: isActive ? 28 : 24, height: isActive ? 28 : 24,
                  borderRadius: '50%',
                  background: completed ? ORANGE : isActive ? ORANGE : '#FFF',
                  border: `2px solid ${isFuture ? GRAY_LINE : completed ? ORANGE : ORANGE}`,
                  boxShadow: isActive ? `0 0 0 6px ${ORANGE_GLOW}` : 'none',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.3s ease', flexShrink: 0,
                }}>
                  {completed ? (
                    <CheckCircleFilled style={{ color: '#FFF', fontSize: 13 }} />
                  ) : isActive ? (
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#FFF' }} />
                  ) : null}
                </div>
                <div style={{ flex: 1, height: 2, background: isLast ? 'transparent' : lineColor, transition: 'background 0.3s ease' }} />
              </div>
            );
          })}
        </div>

        {/* ===== 第2行：节点名称 + 摘要 ===== */}
        <div style={{ display: 'flex', marginTop: 10 }}>
          {ORDER_FLOW_NODES.map((node, i) => {
            const isActive = i === activeIdx && !nodeCompleted[i];
            const isFuture = i > activeIdx;
            const summary = summaries[i];

            return (
              <div key={node.key} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <span style={{ fontSize: isActive ? 13 : 12, fontWeight: isActive ? 600 : 400, color: isFuture ? GRAY_FUTURE : isActive ? '#1A1A1A' : '#595959', lineHeight: '18px', whiteSpace: 'nowrap' }}>
                  {node.label}
                </span>
                <span style={{ fontSize: 11, color: isFuture ? GRAY_FUTURE : '#8C8C8C', lineHeight: '16px', marginTop: 2, whiteSpace: 'nowrap', minHeight: 16 }}>
                  {summary || ''}
                </span>
              </div>
            );
          })}
        </div>

        {/* ===== 节点5(运输中)包裹级状态说明 — 仅活跃时展示 ===== */}
        {activeIdx === 5 && totalPkgCount > 1 && (
          <div style={{ display: 'flex', marginTop: 6 }}>
            {/* 前5个节点占位 */}
            {Array.from({ length: 5 }).map((_, i) => <div key={i} style={{ flex: 1 }} />)}
            {/* 节点5下方：每个包裹一行 */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
              {pkgs.map((p, pi) => {
                const dot = getPkgStatusDot(p.status);
                return (
                  <div key={pi} style={{ fontSize: 11, color: '#595959', whiteSpace: 'nowrap' }}>
                    <span style={{ color: dot.color, fontWeight: 700, marginRight: 3 }}>{dot.char}</span>
                    包裹{pi + 1} {getPkgStatusLabel(p.status)}
                  </div>
                );
              })}
            </div>
            {/* 节点6占位 */}
            <div style={{ flex: 1 }} />
          </div>
        )}

        {/* ===== 节点6(已签收/完成)包裹级状态说明 — 仅活跃时展示 ===== */}
        {activeIdx === 6 && totalPkgCount > 1 && (
          <div style={{ display: 'flex', marginTop: 4 }}>
            {/* 前6个节点占位 */}
            {Array.from({ length: 6 }).map((_, i) => <div key={i} style={{ flex: 1 }} />)}
            {/* 节点6下方：每个包裹一行 */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
              {pkgs.map((p, pi) => {
                const dot = getPkgStatusDot(p.status);
                return (
                  <div key={pi} style={{ fontSize: 11, color: '#595959', whiteSpace: 'nowrap' }}>
                    <span style={{ color: dot.color, fontWeight: 700, marginRight: 3 }}>{dot.char}</span>
                    包裹{pi + 1} {getPkgStatusLabel(p.status)}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ===== 缺件/异常提示 ===== */}
        {(() => {
          const shortagePkgs = pkgs.filter(p => (p.lineItems || []).some((li: any) => li.stockStatus !== 'IN_STOCK'));
          if (shortagePkgs.length === 0) return null;
          if (activeIdx !== 3 && activeIdx !== 4) return null;
          const parts: string[] = [];
          shortagePkgs.forEach(p => {
            const shortItems = (p.lineItems || []).filter((li: any) => li.stockStatus !== 'IN_STOCK');
            const pkgIdx = pkgs.indexOf(p);
            shortItems.forEach((li: any) => {
              const eta = li.supplierInfo?.expectedArrivalDate || '待定';
              parts.push(`包裹${pkgIdx + 1} · ${li.skuCode} 缺货 / 供应商补货预计 ${eta}`);
            });
          });
          if (parts.length === 0) return null;
          return (
            <div style={{ marginTop: 10, padding: '8px 14px', background: '#FFF7E6', border: '1px solid #FFD591', borderRadius: 6, fontSize: 12, color: '#D46B08', display: 'flex', alignItems: 'flex-start', gap: 8, lineHeight: '20px' }}>
              <ExclamationCircleOutlined style={{ marginTop: 2, flexShrink: 0, fontSize: 13 }} />
              <span>{parts.join('  |  ')}</span>
            </div>
          );
        })()}
      </div>
    );
  };

  return (
    <div>
      <Breadcrumb style={{ marginBottom: 16 }} items={[{ title: <a onClick={() => navigate('/orders')}>订单管理</a> }, { title: `详情 ${order.orderNo}` }]} />

      {/* ========== 头部状态卡片 ========== */}
      <Card style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/orders')} style={{ marginTop: 4, flexShrink: 0 }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <Title level={4} style={{ margin: 0 }}>
              订单 {order.orderNo}
              <Tag color={statusTagColor(displayStatus)} style={{ marginLeft: 8, fontSize: 14, padding: '2px 12px', fontWeight: 600 }}>
                {ORDER_STATUS_MAP[displayStatus]}
              </Tag>
              {shortagePolicy && (
                <Tag style={{ marginLeft: 6, border: `1px solid ${shortagePolicy === 'SPLIT' ? STATUS_COLORS.normal : '#8C8C8C'}`, color: shortagePolicy === 'SPLIT' ? STATUS_COLORS.normal : '#8C8C8C', background: 'transparent', fontWeight: 600 }}>
                  {shortagePolicy === 'SPLIT' ? <><SplitCellsOutlined /> SPLIT 拆分发货</> : 'HOLD 整单挂起'}
                </Tag>
              )}
              {linkedExceptions.length > 0 && (
                <Tag color="error" style={{ marginLeft: 6 }}><ExclamationCircleOutlined /> {linkedExceptions.length}个异常</Tag>
              )}
              <Tag color={shippingMethod === 'WITH_VEHICLE' ? 'purple' : 'blue'}>{shippingMethod === 'WITH_VEHICLE' ? <><CarOutlined /> 随车</> : <><InboxOutlined /> 非随</>}</Tag>
            </Title>
            <Space size={16} style={{ marginTop: 8 }}>
              <Text type="secondary">经销商: {order.dealerName}</Text>
              <Text type="secondary">下单: {order.createTime.replace('T', ' ').substring(0, 16)}</Text>
              <Tag color={URGENCY_MAP[order.urgencyLevel].color}>{URGENCY_MAP[order.urgencyLevel].label}</Tag>
            </Space>

            {/* 状态流程条 */}
            {renderStatusBar()}

            {/* 异常/终止状态提示 */}
            {(isException || isTerminal) && (
              <div style={{ marginTop: 16 }}>
                <Tag color={isException ? 'error' : 'default'} style={{ fontSize: 13, padding: '4px 12px' }}>
                  {isException ? '⚠️ 订单履约已中断，当前处于异常状态' : '此订单已终止，不再继续履约'}
                </Tag>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* ========== 特殊订单类型专用模块（预约 / 定制 / 400 / 领用） ========== */}
      {isSpecialType && (
        <Card
          style={{
            marginBottom: 16,
            borderLeft: `4px solid ${
              order.bizType === 'APPOINTMENT' ? '#0284C7' :
              order.bizType === 'CUSTOM' ? '#7C3AED' :
              order.bizType === 'CALL_400' ? '#16A34A' : '#8C8C8C'
            }`,
          }}
          title={
            <Space>
              {order.bizType === 'APPOINTMENT' && <CalendarOutlined style={{ color: '#0284C7' }} />}
              {order.bizType === 'CUSTOM' && <AppstoreOutlined style={{ color: '#7C3AED' }} />}
              {order.bizType === 'CALL_400' && <FileProtectOutlined style={{ color: '#16A34A' }} />}
              {order.bizType === 'REQUISITION' && <ShoppingCartOutlined style={{ color: '#8C8C8C' }} />}
              <span>{BIZ_TYPE_MAP[order.bizType]}订单 - 专用信息</span>
              <Tag color={displayStatus === 'PENDING_REVIEW' ? '#F59E0B' : ORDER_STATUS_COLOR_MAP[displayStatus]}>
                {ORDER_STATUS_MAP[displayStatus]}
              </Tag>
            </Space>
          }
          extra={
            <Space>
              {isPendingReview ? (
                <>
                  <Button type="primary" size="small" icon={<CheckCircleOutlined />} onClick={() => {
                    Modal.confirm({
                      title: '审核通过',
                      content: `确认审核通过订单 ${order.orderNo}？通过后将进入排单阶段。`,
                      okText: '确认通过', cancelText: '取消',
                      onOk: () => { setLocalStatus('SCHEDULING'); message.success('订单审核已通过，进入排单阶段'); },
                    });
                  }}>审核通过</Button>
                  <Button size="small" danger icon={<CloseCircleOutlined />} onClick={() => {
                    Modal.confirm({
                      title: '审核拒绝',
                      content: `确认拒绝订单 ${order.orderNo}？拒绝后订单将终止。`,
                      okText: '确认拒绝', okButtonProps: { danger: true }, cancelText: '取消',
                      onOk: () => { setLocalStatus('ORDER_TERMINATED'); message.success('订单已拒绝，流程终止'); },
                    });
                  }}>审核拒绝</Button>
                  <Button size="small" danger icon={<CloseCircleOutlined />} disabled={isTerminal} onClick={() => {
                    Modal.confirm({
                      title: '终止订单',
                      content: `确认终止订单 ${order.orderNo}？终止后订单将不再继续履约。`,
                      okText: '确认终止', okButtonProps: { danger: true }, cancelText: '取消',
                      onOk: () => { setLocalStatus('ORDER_TERMINATED'); message.success('订单已终止'); },
                    });
                  }}>终止订单</Button>
                </>
              ) : (
                <Button size="small" danger icon={<CloseCircleOutlined />} disabled={isTerminal} onClick={() => {
                  Modal.confirm({
                    title: '终止订单',
                    content: `确认终止订单 ${order.orderNo}？终止后订单将不再继续履约。`,
                    okText: '确认终止', okButtonProps: { danger: true }, cancelText: '取消',
                    onOk: () => { setLocalStatus('ORDER_TERMINATED'); message.success('订单已终止'); },
                  });
                }}>终止订单</Button>
              )}
            </Space>
          }
        >
          {/* --- 预约单信息 --- */}
          {order.bizType === 'APPOINTMENT' && appointment && (
            <Descriptions column={4} size="small" colon={false} style={{ marginBottom: 0 }}>
              <Descriptions.Item label="预约单号"><span style={{ fontFamily: 'monospace' }}>{appointment.appointNo}</span></Descriptions.Item>
              <Descriptions.Item label="预约状态"><Tag color={APPOINT_STATUS_COLORS[appointment.appointStatus]}>{APPOINT_STATUS_MAP[appointment.appointStatus]}</Tag></Descriptions.Item>
              <Descriptions.Item label="预约发货日期"><Text strong>{appointment.appointDate}</Text></Descriptions.Item>
              <Descriptions.Item label="SKU种类数">{appointment.skuTypes} 种</Descriptions.Item>
              <Descriptions.Item label="经销商">{appointment.dealerName}</Descriptions.Item>
              <Descriptions.Item label="创建时间">{appointment.createTime.replace('T', ' ').substring(0, 16)}</Descriptions.Item>
              <Descriptions.Item label="预约备注" span={2}>{appointment.remark || <Text type="secondary">无</Text>}</Descriptions.Item>
            </Descriptions>
          )}
          {order.bizType === 'APPOINTMENT' && !appointment && (
            <Text type="secondary">暂无预约单数据</Text>
          )}

          {/* --- 定制订单信息 --- */}
          {order.bizType === 'CUSTOM' && customOrder && (
            <Row gutter={24}>
              <Col span={12}>
                <Descriptions column={2} size="small" colon={false}>
                  <Descriptions.Item label="定制单号"><span style={{ fontFamily: 'monospace' }}>{customOrder.customNo}</span></Descriptions.Item>
                  <Descriptions.Item label="定制类型"><Tag color={CUSTOM_TYPE_MAP[customOrder.customType]?.color}>{CUSTOM_TYPE_MAP[customOrder.customType]?.label}</Tag></Descriptions.Item>
                  <Descriptions.Item label="审批状态"><Tag color={CUSTOM_APPROVAL_MAP[customOrder.approvalStatus]?.color}>{CUSTOM_APPROVAL_MAP[customOrder.approvalStatus]?.label}</Tag></Descriptions.Item>
                  <Descriptions.Item label="预计完工">{customOrder.expectFinishDate}</Descriptions.Item>
                  <Descriptions.Item label="规格描述" span={2}>{customOrder.specDescription}</Descriptions.Item>
                  <Descriptions.Item label="工艺要求" span={2}>{customOrder.processRequirement || '无特殊工艺要求'}</Descriptions.Item>
                  <Descriptions.Item label="报价金额"><Text strong style={{ color: '#FF6B00' }}>¥{customOrder.quoteAmount.toLocaleString()}</Text></Descriptions.Item>
                  <Descriptions.Item label="VIN码"><span style={{ fontFamily: 'monospace', fontSize: 12 }}>{customOrder.vinCode}</span></Descriptions.Item>
                </Descriptions>
              </Col>
              <Col span={12}>
                <Descriptions column={1} size="small" colon={false}>
                  <Descriptions.Item label="材料费">¥{customOrder.materialCost.toLocaleString()}</Descriptions.Item>
                  <Descriptions.Item label="工时费">¥{customOrder.laborCost.toLocaleString()}</Descriptions.Item>
                  <Descriptions.Item label="加价系数">{customOrder.markupRate}%</Descriptions.Item>
                  {customOrder.attachments.length > 0 && (
                    <Descriptions.Item label="附件">{customOrder.attachments.map((a: string) => <Tag key={a} icon={<PaperClipOutlined />} color="blue" style={{ cursor: 'pointer' }}>{a}</Tag>)}</Descriptions.Item>
                  )}
                </Descriptions>
              </Col>
            </Row>
          )}
          {order.bizType === 'CUSTOM' && !customOrder && (
            <Text type="secondary">暂无定制订单数据</Text>
          )}

          {/* --- 400免费订单信息 --- */}
          {order.bizType === 'CALL_400' && call400Order && (
            <Descriptions column={4} size="small" colon={false} style={{ marginBottom: 0 }}>
              <Descriptions.Item label="400单号"><span style={{ fontFamily: 'monospace' }}>{call400Order.call400No}</span></Descriptions.Item>
              <Descriptions.Item label="投诉工单号"><span style={{ fontFamily: 'monospace', fontSize: 12 }}>{call400Order.complaintNo}</span></Descriptions.Item>
              <Descriptions.Item label="申请原因"><Tag>{APPLY_REASON_MAP[call400Order.applyReason]}</Tag></Descriptions.Item>
              <Descriptions.Item label="免费类型"><Tag color={FREE_TYPE_MAP[call400Order.freeType]?.color}>{FREE_TYPE_MAP[call400Order.freeType]?.label}</Tag></Descriptions.Item>
              <Descriptions.Item label="审批状态"><Tag color={CALL400_APPROVAL_MAP[call400Order.approvalStatus]?.color}>{CALL400_APPROVAL_MAP[call400Order.approvalStatus]?.label}</Tag></Descriptions.Item>
              <Descriptions.Item label="申请人">{call400Order.applicant}</Descriptions.Item>
              <Descriptions.Item label="经销商">{call400Order.dealerName}</Descriptions.Item>
              <Descriptions.Item label="创建时间">{call400Order.createTime.replace('T', ' ').substring(0, 16)}</Descriptions.Item>
              <Descriptions.Item label="补发商品" span={4}>
                {call400Order.items.map((item, idx) => (
                  <Tag key={idx} style={{ marginBottom: 4 }}>{item.skuName} × {item.quantity}</Tag>
                ))}
              </Descriptions.Item>
            </Descriptions>
          )}
          {order.bizType === 'CALL_400' && !call400Order && (
            <Text type="secondary">暂无400免费订单数据</Text>
          )}

          {/* --- 领用订单信息 --- */}
          {order.bizType === 'REQUISITION' && (
            <Descriptions column={3} size="small" colon={false} style={{ marginBottom: 0 }}>
              <Descriptions.Item label="领用经销商">{order.dealerName}</Descriptions.Item>
              <Descriptions.Item label="基地来源">{order.baseSource}</Descriptions.Item>
              <Descriptions.Item label="下单时间">{order.createTime.replace('T', ' ').substring(0, 16)}</Descriptions.Item>
              <Descriptions.Item label="SKU数量">{order.skuCount} 种</Descriptions.Item>
              <Descriptions.Item label="总金额"><Text strong style={{ color: '#FF6B00' }}>¥{order.totalAmount.toLocaleString()}</Text></Descriptions.Item>
              <Descriptions.Item label="收货地址">{order.receiverProvince} {order.receiverCity} {order.receiverDistrict} {order.receiverAddress}</Descriptions.Item>
            </Descriptions>
          )}
        </Card>
      )}

      {/* ========== 包裹列表（可折叠，物流内嵌） ========== */}
      {pkgs.length > 0 && (
        <CollapsibleSection
          icon={<InboxOutlined style={{ color: '#FF6B00' }} />}
          title="包裹列表"
          defaultExpanded
          badge={<Space size={4}>
            {(() => {
              const statusCounts = pkgs.reduce((acc, p) => { acc[p.status] = (acc[p.status] || 0) + 1; return acc; }, {} as Record<string, number>);
              return Object.entries(statusCounts).map(([s, c]) => (
                <Tag key={s} color={pkgStatusTagColor(s)} style={{ margin: 0, fontSize: 11 }}>
                  {PACKAGE_STATUS_MAP[s as keyof typeof PACKAGE_STATUS_MAP]} ×{c}
                </Tag>
              ));
            })()}
          </Space>}
          summary={`共 ${pkgs.length} 个包裹 · ${pkgs.reduce((s, p) => s + p.lineItems.reduce((ss, li) => ss + li.quantity, 0), 0)} 件`}
        >
          {pkgs.map((pkg, idx) => {
            const pkgColor = pkg.status === 'DELIVERED' || pkg.status === 'COMPLETED' ? STATUS_COLORS.success :
              pkg.status === 'SHIPPED' ? STATUS_COLORS.normal :
              pkg.status === 'WAITING_RESTOCK' ? STATUS_COLORS.warning : STATUS_COLORS.neutral;
            const isDelivered = ['DELIVERED', 'COMPLETED'].includes(pkg.status);
            const hasTracking = !!pkg.trackingNo;

            return (
              <div key={pkg.packageId || idx} style={{
                marginBottom: idx < pkgs.length - 1 ? 10 : 0,
                border: `1px solid ${isDelivered ? STATUS_COLORS.success : pkgColor}30`, borderRadius: 6, overflow: 'hidden',
              }}>
                {/* 包裹标签栏 */}
                <div style={{ padding: '10px 14px', background: `${pkgColor}08`, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <Tag color={pkg.packageType === 'SUPPLEMENT' ? 'orange' : 'blue'} style={{ margin: 0 }}>
                    包裹{idx + 1}
                  </Tag>
                  <Tag color={pkgStatusTagColor(pkg.status)} style={{ margin: 0 }}>{PACKAGE_STATUS_MAP[pkg.status]}</Tag>
                  <span style={{ color: '#D9D9D9', margin: '0 4px' }}>|</span>
                  <Text style={{ fontSize: 13 }}>
                    <Text type="secondary">{isDelivered ? '发货: ' : '预计发货: '}</Text>
                    <Text strong>{pkg.shipTime ? pkg.shipTime.replace('T', ' ').substring(0, 10) : '-'}</Text>
                  </Text>
                  <span style={{ color: '#D9D9D9', margin: '0 4px' }}>|</span>
                  <Text style={{ fontSize: 13 }}>
                    <Text type="secondary">{isDelivered ? '到货: ' : '预计到货: '}</Text>
                    <Text strong style={{ color: isDelivered ? STATUS_COLORS.success : undefined }}>
                      {pkg.estimatedArrival || '-'}
                    </Text>
                  </Text>
                  {hasTracking && (
                    <>
                      <span style={{ color: '#D9D9D9', margin: '0 4px' }}>|</span>
                      <TruckOutlined style={{ color: '#8C8C8C', fontSize: 12 }} />
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {pkg.logisticsCompany} · <span style={{ fontFamily: 'monospace' }}>{pkg.trackingNo}</span>
                      </Text>
                    </>
                  )}
                  <Text style={{ marginLeft: 'auto', fontSize: 11, color: '#8C8C8C' }}>
                    {pkg.lineItems.reduce((s, li) => s + li.quantity, 0)}件
                  </Text>
                </div>

                {/* 行项明细 */}
                <div style={{ padding: '6px 14px' }}>
                  <Table
                    rowKey="skuCode" size="small" pagination={false}
                    dataSource={pkg.lineItems}
                    columns={[
                      { title: 'SKU', dataIndex: 'skuCode', width: 100, render: (c: string) => <span style={{ fontFamily: 'monospace', fontSize: 11 }}>{c}</span> },
                      { title: '商品名称', dataIndex: 'skuName', width: 180, render: (n: string) => <span style={{ fontSize: 12 }}>{n}</span> },
                      { title: '数量', dataIndex: 'quantity', width: 50, align: 'center' as const },
                      {
                        title: '库存', dataIndex: 'stockStatus', width: 70,
                        render: (s: string) => {
                          const info = STOCK_STATUS_MAP[s as keyof typeof STOCK_STATUS_MAP];
                          return info ? <Tag color={info.color} style={{ margin: 0, fontSize: 10 }}>{info.label}</Tag> : null;
                        },
                      },
                    ]}
                  />
                </div>

                {/* 物流轨迹（内嵌到包裹卡片，数据驱动） */}
                {hasTracking && (
                  <div style={{ padding: '8px 14px', borderTop: '1px solid #F0F0F0', background: '#FAFAFA' }}>
                    <Text type="secondary" style={{ fontSize: 11, marginBottom: 6, display: 'block' }}>
                      <TruckOutlined /> 物流轨迹
                    </Text>
                    <div style={{ paddingLeft: 4 }}>
                      {pkg.trackingNodes && pkg.trackingNodes.length > 0 ? (
                        pkg.trackingNodes.map((n, ni) => {
                          const isLastNode = ni === pkg.trackingNodes!.length - 1;
                          const nodeColor = isLastNode && isDelivered ? STATUS_COLORS.success : '#FF6B00';
                          return (
                            <div key={ni} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                              <div style={{ textAlign: 'center', width: 14, flexShrink: 0 }}>
                                <div style={{ width: 8, height: 8, borderRadius: '50%', background: nodeColor, margin: '4px auto 0' }} />
                                {!isLastNode && <div style={{ width: 1, height: 20, background: '#E8E8E8', margin: '0 auto' }} />}
                              </div>
                              <div style={{ paddingBottom: isLastNode ? 0 : 4 }}>
                                <Text style={{ fontSize: 11 }}>{n.description}</Text>
                                <Text type="secondary" style={{ fontSize: 10, marginLeft: 8 }}>
                                  {n.time.replace('T', ' ').substring(5, 16)} · {n.location}
                                </Text>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        /* 兜底：无详细节点时显示简化信息 */
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                          <div style={{ textAlign: 'center', width: 14, flexShrink: 0 }}>
                            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#FF6B00', margin: '4px auto 0' }} />
                          </div>
                          <Text style={{ fontSize: 11 }}>
                            {isDelivered ? '已签收' : `运输中 · 预计 ${pkg.estimatedArrival || '-'} 送达`}
                          </Text>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 供应商物流状态（缺件包裹） */}
                {pkg.supplierStatus && (
                  <div style={{ padding: '8px 14px', borderTop: `1px dashed ${STATUS_COLORS.warning}40`, background: '#FFFBEB' }}>
                    <Text type="secondary" style={{ fontSize: 11, marginBottom: 4, display: 'block' }}>
                      <SendOutlined /> 供应商物流
                    </Text>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <Tag color={SUPPLIER_STATUS_MAP[pkg.supplierStatus].color} style={{ margin: 0 }}>
                        {SUPPLIER_STATUS_MAP[pkg.supplierStatus].label}
                      </Tag>
                      {pkg.supplierLogisticsCompany && (
                        <Text type="secondary" style={{ fontSize: 11 }}>
                          {pkg.supplierLogisticsCompany} · {pkg.supplierTrackingNo}
                          {pkg.supplierShipTime && ` · 发 ${pkg.supplierShipTime.replace('T', ' ').substring(0, 10)}`}
                          {pkg.supplierEstimatedArrival && ` · 到基地 ${pkg.supplierEstimatedArrival}`}
                        </Text>
                      )}
                    </div>
                    {/* 供应商物流节点 */}
                    {pkg.supplierTrackingNodes && pkg.supplierTrackingNodes.length > 0 && (
                      <div style={{ paddingLeft: 4, marginTop: 4 }}>
                        {pkg.supplierTrackingNodes.map((n, ni) => (
                          <div key={ni} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                            <div style={{ textAlign: 'center', width: 14, flexShrink: 0 }}>
                              <div style={{ width: 6, height: 6, borderRadius: '50%', background: n.description.includes('到达') ? STATUS_COLORS.success : '#8C8C8C', margin: '4px auto 0' }} />
                              {ni < pkg.supplierTrackingNodes!.length - 1 && <div style={{ width: 1, height: 14, background: '#F0F0F0', margin: '0 auto' }} />}
                            </div>
                            <div>
                              <Text style={{ fontSize: 10 }}>{n.description}</Text>
                              <Text type="secondary" style={{ fontSize: 9, marginLeft: 6 }}>{n.time.replace('T', ' ').substring(0, 16)} · {n.location}</Text>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </CollapsibleSection>
      )}

      {/* 主体：商品明细（始终展开） + 供应商协同 + 侧边栏 */}
      <Row gutter={16}>
        <Col span={17}>
          {/* 商品明细（始终展开，不可折叠） */}
          <Card
            title={<Space><ShoppingCartOutlined style={{ color: '#FF6B00' }} /><span>商品明细</span></Space>}
            size="small"
            style={{ marginBottom: 12 }}
            extra={
              <Space size={8}>
                {shortageCount > 0 && <Tag color="error" style={{ margin: 0 }}>缺 {shortageCount} 件</Tag>}
                <Text type="secondary" style={{ fontSize: 12 }}>
                  共 {allLineItems.length} 种 · {allLineItems.reduce((s, li) => s + li.quantity, 0)} 件
                </Text>
              </Space>
            }
          >
            {order.vinCodes.length > 0 && (
              <div style={{ marginBottom: 10 }}>
                <Text type="secondary" style={{ fontSize: 12 }}>关联车架号：</Text>
                {order.vinCodes.map((vin) => <Tag key={vin} color="purple" style={{ fontFamily: 'monospace', fontSize: 11 }}>{vin}</Tag>)}
              </div>
            )}
            <Table
              rowKey="skuCode" size="small" pagination={false}
              dataSource={allLineItems}
              columns={productColumns}
              rowClassName={(record) => record.stockStatus !== 'IN_STOCK' ? 'exception-row' : ''}
            />
            <Divider style={{ margin: '8px 0' }} />
            <div style={{ textAlign: 'right' }}>
              <Text type="secondary">合计：{order.items.reduce((s, i) => s + i.quantity, 0)} 件 · </Text>
              <Text strong style={{ color: '#FF6B00', fontSize: 16 }}>¥{order.totalAmount.toLocaleString()}</Text>
            </div>
          </Card>

          {/* 供应商协同（条件显示，默认折叠） */}
          {hasExternalPurchase && (
            <CollapsibleSection
              icon={<SendOutlined style={{ color: STATUS_COLORS.warning }} />}
              title="供应商协同"
              summary={`${allLineItems.filter((li) => li.stockStatus !== 'IN_STOCK').length} 个行项涉及外部采购`}
            >
              {allLineItems.filter((li) => li.stockStatus !== 'IN_STOCK' && li.supplierInfo).map((li, idx) => (
                <div key={idx} style={{
                  padding: '10px 14px', marginBottom: 8,
                  border: `1px solid ${STATUS_COLORS.warning}30`, borderRadius: 6,
                  background: '#FFFBEB',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                    <Text strong style={{ fontSize: 13 }}>{li.skuName}</Text>
                    <Tag color={STOCK_STATUS_MAP[li.stockStatus].color}>{STOCK_STATUS_MAP[li.stockStatus].label}</Tag>
                    <Tag color={li.packageType === 'SUPPLEMENT' ? 'orange' : 'blue'} style={{ margin: 0 }}>{li.packageLabel}</Tag>
                  </div>
                  {li.supplierInfo && (
                    <div style={{ marginTop: 6, padding: '8px 12px', background: '#FFF', borderRadius: 4, border: '1px solid #F0F0F0' }}>
                      <Row gutter={16}>
                        <Col span={8}><Text type="secondary" style={{ fontSize: 11 }}>供应商</Text><br /><Text style={{ fontSize: 13 }}>{li.supplierInfo.supplierName}</Text></Col>
                        <Col span={8}><Text type="secondary" style={{ fontSize: 11 }}>预计到货</Text><br /><Text strong style={{ fontSize: 13 }}>{li.supplierInfo.expectedArrivalDate}</Text></Col>
                        <Col span={8}><Text type="secondary" style={{ fontSize: 11 }}>运单号</Text><br /><Text style={{ fontSize: 13, fontFamily: 'monospace' }}>{li.supplierInfo.trackingNumber || '暂无'}</Text></Col>
                      </Row>
                    </div>
                  )}
                </div>
              ))}
            </CollapsibleSection>
          )}
        </Col>

        {/* ========== 右侧信息栏 ========== */}
        <Col span={7}>
          <Card title="订单信息" size="small" style={{ marginBottom: 16 }}>
            <Descriptions column={1} size="small" colon={false}>
              <Descriptions.Item label="订单号">{order.orderNo}</Descriptions.Item>
              <Descriptions.Item label="订单类型"><Tag>{BIZ_TYPE_MAP[order.bizType]}</Tag></Descriptions.Item>
              <Descriptions.Item label="时效等级"><Tag color={URGENCY_MAP[order.urgencyLevel].color}>{URGENCY_MAP[order.urgencyLevel].label}</Tag></Descriptions.Item>
              <Descriptions.Item label="履约方式">{FULFILL_METHOD_MAP[order.fulfillMethod]}</Descriptions.Item>
              <Descriptions.Item label="基地来源">{order.baseSource}</Descriptions.Item>
              <Descriptions.Item label="缺件策略">{shortagePolicy ? <Tag color={shortagePolicy === 'SPLIT' ? STATUS_COLORS.normal : '#8C8C8C'}>{shortagePolicy === 'SPLIT' ? '拆分发货' : '整单挂起'}</Tag> : <Text type="secondary">-</Text>}</Descriptions.Item>
            </Descriptions>
          </Card>
          <Card title="收货信息" size="small" style={{ marginBottom: 16 }}>
            <Descriptions column={1} size="small" colon={false}>
              <Descriptions.Item label="收货人">{order.receiverName}</Descriptions.Item>
              <Descriptions.Item label="电话">{order.receiverPhone}</Descriptions.Item>
              <Descriptions.Item label="地址">{order.receiverProvince} {order.receiverCity} {order.receiverDistrict} {order.receiverAddress}</Descriptions.Item>
            </Descriptions>
          </Card>
          {linkedExceptions.length > 0 && (
            <Card title={<Space><ExclamationCircleOutlined style={{ color: '#E11D48' }} />关联异常 ({linkedExceptions.length})</Space>} size="small" style={{ marginBottom: 16, borderLeft: '3px solid #E11D48' }}>
              {linkedExceptions.map((ex) => (
                <div key={ex.exceptionNo} style={{ marginBottom: 8, padding: '8px 10px', background: '#FFF1F0', borderRadius: 4, cursor: 'pointer' }} onClick={() => navigate('/exceptions')}>
                  <Space size={4}><Tag color={EXCEPTION_TYPE_MAP[ex.exceptionType]?.color}>{EXCEPTION_TYPE_MAP[ex.exceptionType]?.label}</Tag><Text style={{ fontSize: 12 }}>{ex.description.substring(0, 20)}...</Text></Space>
                  <Tag color={EXCEPTION_STATUS_MAP[ex.status] === '待处理' ? '#E11D48' : EXCEPTION_STATUS_MAP[ex.status] === '已解决' ? '#16A34A' : '#F59E0B'} style={{ float: 'right', fontSize: 11 }}>{EXCEPTION_STATUS_MAP[ex.status]}</Tag>
                </div>
              ))}
            </Card>
          )}
          {deliveryNote && (
            <Card title="电子交货单" size="small" style={{ marginBottom: 16, borderLeft: '3px solid #FF6B00' }}>
              <Descriptions column={1} size="small" colon={false}>
                <Descriptions.Item label="交货单号"><span style={{ fontFamily: 'monospace' }}>{deliveryNote.noteNo}</span></Descriptions.Item>
                <Descriptions.Item label="仓库">{deliveryNote.warehouseName}</Descriptions.Item>
                <Descriptions.Item label="状态"><Tag color={deliveryNote.status === 'RECEIVED' ? '#16A34A' : '#FF6B00'}>{deliveryNote.status === 'GENERATED' ? '已生成' : deliveryNote.status === 'SHIPPED' ? '已发货' : '已签收'}</Tag></Descriptions.Item>
                <Descriptions.Item label="总件数">{deliveryNote.totalQty} 件</Descriptions.Item>
              </Descriptions>
            </Card>
          )}
          <Card title="操作日志" size="small" style={{ marginBottom: 16 }}>
            <div>
              {operationLogs.map((log, i) => {
                const dotColor = log.action.includes('异常') ? 'red' : log.action.includes('签收') || log.action.includes('归档') ? 'green' : '#FF6B00';
                return (
                  <div key={i} style={{ display: 'flex', gap: 10, marginBottom: i < operationLogs.length - 1 ? 10 : 0 }}>
                    <div style={{ textAlign: 'center', width: 14, flexShrink: 0 }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: dotColor, marginTop: 4 }} />
                      {i < operationLogs.length - 1 && <div style={{ width: 1, height: 'calc(100% - 12px)', background: '#F0F0F0', margin: '0 auto' }} />}
                    </div>
                    <div>
                      <Text style={{ fontSize: 13 }}>{log.action}</Text><br />
                      <Text type="secondary" style={{ fontSize: 12 }}>{log.operator}（{log.role}）</Text><br />
                      <Text type="secondary" style={{ fontSize: 11 }}>{log.time.replace('T', ' ').substring(0, 19)}</Text>
                      {log.remark && <><br /><Text type="secondary" italic style={{ fontSize: 11 }}>{log.remark}</Text></>}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
