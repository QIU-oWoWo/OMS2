import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Descriptions, Table, Tag, Space, Button, Typography, Row, Col, Breadcrumb, Divider } from 'antd';
import { ArrowLeftOutlined, CarOutlined, InboxOutlined, ExclamationCircleOutlined, TruckOutlined, SplitCellsOutlined, DownOutlined, UpOutlined, ShoppingCartOutlined, SendOutlined, CheckCircleFilled } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { mockOrders, mockDeliveryNotes, getOperationLogs, mockExceptions, getSplitShipmentData, getOrderParcels } from '../../data/mockData';
import { ORDER_STATUS_MAP, ORDER_STATUS_COLOR_MAP, BIZ_TYPE_MAP, URGENCY_MAP, FULFILL_METHOD_MAP, EXCEPTION_TYPE_MAP, EXCEPTION_STATUS_MAP, SUPPLIER_STATUS_MAP, STOCK_STATUS_MAP, PACKAGE_STATUS_MAP, STATUS_COLORS, ORDER_FLOW_NODES, STATUS_TO_FLOW_NODE } from '../../types';
import type { LineItem } from '../../types';

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
  const deliveryNote = mockDeliveryNotes.find((dn) => dn.orderNo === orderNo);
  const operationLogs = order ? getOperationLogs(order) : [];
  const linkedExceptions = mockExceptions.filter((e) => e.orderNo === orderNo);
  const splitData = order ? getSplitShipmentData(order.orderNo) : null;
  const parcels = order ? getOrderParcels(order.orderNo) : [];

  if (!order) return (<div style={{ textAlign: 'center', padding: 80 }}><Title level={3} type="secondary">订单未找到</Title><Button type="link" onClick={() => navigate('/orders')}>返回订单列表</Button></div>);

  // 订单状态判断
  const flowNodeIdx = STATUS_TO_FLOW_NODE[order.status];
  const isException = order.status === 'EXCEPTION_HOLD' || order.status === 'EXCEPTION' || order.status === 'RETURN_PROCESSING';
  const isTerminal = ['ORDER_TERMINATED', 'CANCELLED'].includes(order.status);
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

  // ========== 渲染：7节点主流程状态追踪器（雅迪白橙配色，数据驱动） ==========
  const renderStatusBar = () => {
    const activeIdx = flowNodeIdx;
    if (activeIdx < 0) return null;

    const totalNodes = ORDER_FLOW_NODES.length;
    const pkgs = order.packages || [];
    const totalPkgCount = pkgs.length;
    const sp = order.shortagePolicy;

    // --- 包裹状态统计 ---
    const deliveredCount = pkgs.filter(p => ['DELIVERED', 'COMPLETED'].includes(p.status)).length;
    const shippedCount = pkgs.filter(p => ['SHIPPED', 'DELIVERED', 'COMPLETED'].includes(p.status)).length;
    const inTransitCount = pkgs.filter(p => p.status === 'SHIPPED').length;
    const readyCount = pkgs.filter(p => p.status === 'READY').length;
    const pickingCount = pkgs.filter(p => p.status === 'PICKING').length;
    const waitingRestockCount = pkgs.filter(p => p.status === 'WAITING_RESTOCK').length;

    // 缺件包裹
    const shortagePkgs = pkgs.filter(p =>
      p.lineItems.some(li => li.stockStatus !== 'IN_STOCK')
    );

    // --- 各节点履约摘要（仅轻量文本，严禁大段业务解释） ---
    const getNodeSummary = (nodeIdx: number): string => {
      const isPast = nodeIdx < activeIdx;
      const isActive = nodeIdx === activeIdx;

      switch (nodeIdx) {
        case 0: // 下单
          return order.createTime.replace('T', ' ').substring(5, 16);
        case 1: // 审核通过
          return order.createTime.replace('T', ' ').substring(5, 16);
        case 2: { // 排单完成
          if (!isPast && !isActive) return '';
          if (totalPkgCount > 1) return `拆为${totalPkgCount}包裹`;
          return '整单发出';
        }
        case 3: { // 拣货中
          if (!isPast && !isActive) return '';
          if (isActive && waitingRestockCount > 0) return `${waitingRestockCount}包裹缺件等待`;
          if (isActive && pickingCount > 0) return `${pickingCount}/${totalPkgCount}包裹拣货中`;
          if (isPast) return '拣货已完成';
          return '';
        }
        case 4: { // 待发货
          if (!isPast && !isActive) return '';
          if (isActive && waitingRestockCount > 0) return `${waitingRestockCount}包裹缺件等待`;
          if (isActive && readyCount > 0) return `${readyCount}包裹待发货`;
          if (isPast) return '已发出';
          return '';
        }
        case 5: { // 运输中
          if (!isPast && !isActive) return '';
          if (isActive && shippedCount > 0 && deliveredCount < totalPkgCount)
            return `${shippedCount}/${totalPkgCount}包裹运输中`;
          if (isPast) return '运输已完成';
          return '';
        }
        case 6: { // 已签收/完成
          if (!isPast && !isActive) return '';
          if (deliveredCount === totalPkgCount && totalPkgCount > 0)
            return `${totalPkgCount}/${totalPkgCount}包裹已签收`;
          if (deliveredCount > 0) return `${deliveredCount}/${totalPkgCount}包裹已签收`;
          return '';
        }
        default:
          return '';
      }
    };

    // --- 缺件/异常提示（仅显示在拣货中或待发货节点正下方） ---
    const buildExceptionAlert = (): string | null => {
      if (shortagePkgs.length === 0) return null;
      const parts: string[] = [];
      shortagePkgs.forEach(p => {
        const shortItems = p.lineItems.filter(li => li.stockStatus !== 'IN_STOCK');
        const pkgIdx = pkgs.indexOf(p);
        const pkgLabel = `包裹${pkgIdx + 1}`;
        shortItems.forEach(li => {
          const eta = li.supplierInfo?.expectedArrivalDate || '待定';
          parts.push(`${pkgLabel} · ${li.skuCode} 缺货 / 供应商补货预计 ${eta}`);
        });
      });
      return parts.length > 0 ? parts.join('  |  ') : null;
    };

    const exceptionAlert = (activeIdx === 3 || activeIdx === 4) ? buildExceptionAlert() : null;

    // Yadea 白橙配色常量
    const ORANGE = '#FF6B00';
    const ORANGE_GLOW = 'rgba(255,107,0,0.10)';
    const GRAY_LINE = '#E8E8E8';
    const GRAY_FUTURE = '#BFBFBF';

    // 预计算各节点摘要
    const summaries: string[] = Array.from({ length: totalNodes }, (_, i) => getNodeSummary(i));

    return (
      <div style={{ marginTop: 20 }}>
        {/* ===== 第1行：步骤圆点 + 连接线（每列flex:1，圆点居中，左/右半线连接） ===== */}
        <div style={{ display: 'flex', alignItems: 'center' }}>
          {ORDER_FLOW_NODES.map((node, i) => {
            const isFirst = i === 0;
            const isLast = i === totalNodes - 1;
            const isCompleted = i < activeIdx;
            const isActive = i === activeIdx;
            const isFuture = i > activeIdx;
            const lineColor = isCompleted ? ORANGE : GRAY_LINE;

            return (
              <div key={node.key} style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
                {/* 左半连接线（首节点隐藏） */}
                <div style={{
                  flex: 1, height: 2,
                  background: isFirst ? 'transparent' : lineColor,
                  transition: 'background 0.3s ease',
                }} />
                {/* 圆点 */}
                <div style={{
                  width: isActive ? 28 : 24,
                  height: isActive ? 28 : 24,
                  borderRadius: '50%',
                  background: isCompleted || isActive ? ORANGE : '#FFF',
                  border: `2px solid ${isFuture ? GRAY_LINE : ORANGE}`,
                  boxShadow: isActive ? `0 0 0 6px ${ORANGE_GLOW}` : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.3s ease',
                  flexShrink: 0,
                }}>
                  {isCompleted ? (
                    <CheckCircleFilled style={{ color: '#FFF', fontSize: 13 }} />
                  ) : isActive ? (
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#FFF' }} />
                  ) : null}
                </div>
                {/* 右半连接线（末节点隐藏） */}
                <div style={{
                  flex: 1, height: 2,
                  background: isLast ? 'transparent' : lineColor,
                  transition: 'background 0.3s ease',
                }} />
              </div>
            );
          })}
        </div>

        {/* ===== 第2行：节点名称（第一行辅助文字） + 履约摘要（第二行辅助文字） ===== */}
        <div style={{ display: 'flex', marginTop: 10 }}>
          {ORDER_FLOW_NODES.map((node, i) => {
            const isActive = i === activeIdx;
            const isFuture = i > activeIdx;
            const summary = summaries[i];

            return (
              <div key={node.key} style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
              }}>
                {/* 节点名称 */}
                <span style={{
                  fontSize: isActive ? 13 : 12,
                  fontWeight: isActive ? 600 : 400,
                  color: isFuture ? GRAY_FUTURE : isActive ? '#1A1A1A' : '#595959',
                  lineHeight: '18px',
                  whiteSpace: 'nowrap',
                }}>
                  {node.label}
                </span>
                {/* 履约摘要 */}
                <span style={{
                  fontSize: 11,
                  color: isFuture ? GRAY_FUTURE : '#8C8C8C',
                  lineHeight: '16px',
                  marginTop: 2,
                  whiteSpace: 'nowrap',
                  minHeight: 16,
                }}>
                  {summary || ''}
                </span>
              </div>
            );
          })}
        </div>

        {/* ===== 缺件/异常提示（渲染在激活节点正下方） ===== */}
        {exceptionAlert && (
          <div style={{
            marginTop: 10,
            padding: '8px 14px',
            background: '#FFF7E6',
            border: '1px solid #FFD591',
            borderRadius: 6,
            fontSize: 12,
            color: '#D46B08',
            display: 'flex',
            alignItems: 'flex-start',
            gap: 8,
            lineHeight: '20px',
          }}>
            <ExclamationCircleOutlined style={{ marginTop: 2, flexShrink: 0, fontSize: 13 }} />
            <span>{exceptionAlert}</span>
          </div>
        )}
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
              <Tag color={statusTagColor(order.status)} style={{ marginLeft: 8, fontSize: 14, padding: '2px 12px', fontWeight: 600 }}>
                {ORDER_STATUS_MAP[order.status]}
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
              <Descriptions.Item label="业务流程"><Tag>{BIZ_TYPE_MAP[order.bizType]}</Tag></Descriptions.Item>
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
