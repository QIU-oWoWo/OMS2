import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Descriptions, Table, Tag, Steps, Timeline, Space, Button, Typography, Row, Col, Breadcrumb, Statistic, Divider, Alert } from 'antd';
import { ArrowLeftOutlined, ClockCircleOutlined, CarOutlined, InboxOutlined, ExclamationCircleOutlined, CheckCircleOutlined, TruckOutlined, SplitCellsOutlined, DownOutlined, UpOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { mockOrders, mockDeliveryNotes, mockTrackingList, vehicleShippingPlans, supplierETAData, getOperationLogs, mockExceptions, getSplitShipmentData, getOrderParcels } from '../../data/mockData';
import { ORDER_STATUS_MAP, BIZ_TYPE_MAP, URGENCY_MAP, FULFILL_METHOD_MAP, ORDER_STATUS_STEPS, EXCEPTION_TYPE_MAP, EXCEPTION_STATUS_MAP, SUPPLIER_STATUS_MAP } from '../../types';
import type { OrderItem } from '../../types';

const { Title, Text } = Typography;

export default function OrderDetail() {
  const { orderNo } = useParams<{ orderNo: string }>();
  const navigate = useNavigate();

  const order = mockOrders.find((o) => o.orderNo === orderNo);
  const deliveryNote = mockDeliveryNotes.find((dn) => dn.orderNo === orderNo);
  const tracking = mockTrackingList.find((t) => t.orderNo === orderNo);
  const operationLogs = order ? getOperationLogs(order) : [];
  const linkedExceptions = mockExceptions.filter((e) => e.orderNo === orderNo);
  const splitData = order ? getSplitShipmentData(order.orderNo) : null;
  const parcels = order ? getOrderParcels(order.orderNo) : [];

  if (!order) return (<div style={{ textAlign: 'center', padding: 80 }}><Title level={3} type="secondary">订单未找到</Title><Button type="link" onClick={() => navigate('/orders')}>返回订单列表</Button></div>);

  const currentStep = ORDER_STATUS_STEPS.indexOf(order.status);
  const isShipped = ['IN_TRANSIT', 'DELIVERED', 'COMPLETED'].includes(order.status);
  const isUnshipped = ['PENDING_REVIEW', 'SCHEDULING', 'PICKING', 'READY_TO_SHIP'].includes(order.status);
  const isException = order.status === 'EXCEPTION';
  const shippingMethod = order.shippingMethod;
  const linkedPlan = order.linkedPlanNo ? vehicleShippingPlans.find((p) => p.planNo === order.linkedPlanNo) : undefined;
  const etaData = supplierETAData[order.orderNo] || [];
  const estimatedShipDate = dayjs().add(isUnshipped ? 3 : 0, 'day').format('YYYY-MM-DD');
  const [expanded, setExpanded] = useState<Set<number>>(new Set([0, 1]));

  const toggleExpanded = (idx: number) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx); else next.add(idx);
      return next;
    });
  };

  const itemColumns: ColumnsType<OrderItem> = [
    { title: 'SKU编码', dataIndex: 'skuCode', width: 130, render: (c: string) => <span style={{ fontFamily: 'monospace', fontSize: 13 }}>{c}</span> },
    { title: '商品名称', dataIndex: 'skuName', width: 220 },
    { title: '单价', dataIndex: 'unitPrice', width: 90, align: 'right', render: (p: number) => `¥${p.toLocaleString()}` },
    { title: '数量', dataIndex: 'quantity', width: 60, align: 'center' },
    { title: '缺件', dataIndex: 'shortageQty', width: 60, align: 'center', render: (q: number) => q > 0 ? <Tag color="error">{q}</Tag> : <span style={{ color: '#8C8C8C' }}>-</span> },
    { title: '小计', dataIndex: 'subtotal', width: 100, align: 'right', render: (s: number) => <span style={{ fontWeight: 500 }}>¥{s.toLocaleString()}</span> },
  ];

  return (
    <div>
      <Breadcrumb style={{ marginBottom: 16 }} items={[{ title: <a onClick={() => navigate('/orders')}>订单管理</a> }, { title: `详情 ${order.orderNo}` }]} />

      {/* 头部 + 状态进度条 */}
      <Card style={{ marginBottom: 16 }}>
        <Space size="large" align="start">
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/orders')} style={{ marginTop: 4 }} />
          <div>
            <Title level={4} style={{ margin: 0 }}>
              订单 {order.orderNo}
              {isException ? <Tag color="error">异常</Tag> : order.status === 'COMPLETED' ? <Tag color="success">已完成</Tag> : <Tag color="processing">进行中</Tag>}
              <Tag color={shippingMethod === 'WITH_VEHICLE' ? '#7C3AED' : '#0284C7'}>{shippingMethod === 'WITH_VEHICLE' ? <><CarOutlined /> 随车</> : <><InboxOutlined /> 非随</>}</Tag>
              {order.shortageFlag && <Tag color="error">缺件</Tag>}
              {splitData && <Tag color="orange" icon={<SplitCellsOutlined />}>拆分发货</Tag>}
            </Title>
            <Space size={16} style={{ marginTop: 8 }}>
              <Text type="secondary">经销商: {order.dealerName}</Text>
              <Text type="secondary">下单: {order.createTime.replace('T', ' ').substring(0, 16)}</Text>
              <Tag color={URGENCY_MAP[order.urgencyLevel].color}>{URGENCY_MAP[order.urgencyLevel].label}</Tag>
            </Space>
          </div>
        </Space>
        <div style={{ marginTop: 24, padding: '0 40px' }}>
          <Steps current={isException ? -1 : order.status === 'COMPLETED' ? ORDER_STATUS_STEPS.length : currentStep} status={isException ? 'error' : undefined} size="small"
            items={ORDER_STATUS_STEPS.map((s) => ({ title: ORDER_STATUS_MAP[s] }))} />
        </div>

        {/* 多包裹订单：各包裹独立状态流程 */}
        {parcels.length > 1 && (
          <div style={{ marginTop: 20, padding: '0 20px' }}>
            {parcels.map((pkg, idx) => {
              const steps = idx === 0
                ? ['待发货', '运输中', '已签收']
                : ['待补发', '运输中', '已签收'];
              const current = pkg.status === 'DELIVERED' ? 2 : pkg.status === 'IN_TRANSIT' ? 1 : 0;
              const color = pkg.status === 'DELIVERED' ? '#16A34A' : pkg.status === 'IN_TRANSIT' ? '#FF6B00' : '#F59E0B';
              return (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                  <Tag color={color} style={{ margin: 0, minWidth: 56, textAlign: 'center' }}>{pkg.label}</Tag>
                  <Steps
                    current={current}
                    size="small"
                    style={{ flex: 1 }}
                    status={current === 2 ? 'finish' : current === 1 ? 'process' : 'wait'}
                    items={steps.map((s) => ({ title: s }))}
                  />
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* ========== 发货与物流信息（按包裹维度） ========== */}
      {(isShipped || isUnshipped) && parcels.length > 0 && (
        <Card title={<Space><TruckOutlined />发货与物流信息</Space>} style={{ marginBottom: 16 }}>

          {parcels.map((pkg, idx) => {
            const pkgColor = pkg.status === 'DELIVERED' ? '#16A34A' : pkg.status === 'IN_TRANSIT' ? '#FF6B00' : '#F59E0B';
            const statusLabel = pkg.status === 'DELIVERED' ? '已签收' : pkg.status === 'IN_TRANSIT' ? '运输中'
              : (parcels.length > 1 && idx === 0 ? '待发货' : pkg.supplierStatus ? '待补发' : '待发货');
            const hasTracking = pkg.trackingNodes && pkg.trackingNodes.length > 0;
            const isDelivered = pkg.status === 'DELIVERED';
            const isPkgExpanded = expanded.has(idx);

            return (
              <div key={idx} style={{ marginBottom: idx < parcels.length - 1 ? 12 : 0, border: `1px solid ${pkgColor}30`, borderRadius: 6, overflow: 'hidden' }}>

                {/* 标题栏：标签 + 状态 + 关键统计 + 展开/收起 */}
                <div style={{ padding: '6px 12px', background: `${pkgColor}0A`, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                  <Tag color={pkgColor} style={{ margin: 0 }}>{pkg.label}</Tag>
                  <Tag color={pkgColor}>{statusLabel}</Tag>
                  <Divider type="vertical" style={{ margin: '0 2px' }} />
                  <Text style={{ fontSize: 13 }}>
                    <Text type="secondary">{isDelivered ? '发货: ' : '预计发货: '}</Text>
                    <Text strong>{pkg.shipTime.replace('T', ' ').substring(0, 10)}</Text>
                  </Text>
                  <Divider type="vertical" style={{ margin: '0 2px' }} />
                  <Text style={{ fontSize: 13 }}>
                    <Text type="secondary">{isDelivered ? '签收: ' : '预计到货: '}</Text>
                    <Text strong style={{ color: isDelivered ? '#16A34A' : undefined }}>
                      {isDelivered && hasTracking
                        ? pkg.trackingNodes![pkg.trackingNodes!.length - 1].time.replace('T', ' ').substring(0, 10)
                        : pkg.estimatedArrival}
                    </Text>
                  </Text>
                  <Divider type="vertical" style={{ margin: '0 2px' }} />
                  <Text style={{ fontSize: 13 }}>
                    {pkg.shippingMethod === 'WITH_VEHICLE' ? <><CarOutlined style={{ fontSize: 12 }} /> 随车</> : <><InboxOutlined style={{ fontSize: 12 }} /> 非随</>}
                  </Text>
                  <Text type="secondary" style={{ fontSize: 12, marginLeft: 'auto' }}>
                    {pkg.logisticsCompany} · <span style={{ fontFamily: 'monospace' }}>{pkg.trackingNo}</span> · {pkg.totalQty}件
                  </Text>
                  <Button
                    type="text" size="small"
                    icon={isPkgExpanded ? <UpOutlined /> : <DownOutlined />}
                    onClick={() => toggleExpanded(idx)}
                    style={{ color: pkgColor, padding: '0 4px' }}
                  >
                    {isPkgExpanded ? '收起' : '详情'}
                  </Button>
                </div>

                {/* 展开详情：物流轨迹 + 缺件/供应商信息 */}
                {isPkgExpanded && (
                  <>
                    {/* 物流轨迹（始终显示） */}
                    {hasTracking && (
                      <div style={{ padding: '4px 12px 8px', borderTop: '1px solid #F0F0F0' }}>
                        <Timeline style={{ margin: 0 }}
                          items={pkg.trackingNodes!.map((n, ni) => {
                            const isEstimated = pkg.status === 'PENDING';
                            const dotColor = n.description.includes('签收') ? 'green' : n.description.includes('配送') || n.description.includes('送达') ? '#FF6B00' : isEstimated ? '#BFBFBF' : 'gray';
                            return {
                              color: dotColor,
                              children: (
                                <div style={{ display: 'flex', gap: 12, alignItems: 'baseline', flexWrap: 'wrap' }}>
                                  <Text style={{ fontSize: 12, color: isEstimated ? '#8C8C8C' : undefined }}>
                                    {isEstimated ? '⏳ ' : ''}{n.description}
                                  </Text>
                                  <Text type="secondary" style={{ fontSize: 11 }}>{n.time.replace('T', ' ').substring(0, 16)}</Text>
                                  <Text type="secondary" style={{ fontSize: 11 }}>{n.location}</Text>
                                </div>
                              ),
                            };
                          })}
                        />
                      </div>
                    )}

                    {/* 缺件/供应商信息 */}
                    {pkg.supplierStatus && (
                      <div style={{ padding: '6px 12px', borderTop: `1px dashed ${SUPPLIER_STATUS_MAP[pkg.supplierStatus].color}40`, background: '#FAFAFA' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                          <Text strong style={{ fontSize: 12 }}>缺件配件: </Text>
                          <Tag color={SUPPLIER_STATUS_MAP[pkg.supplierStatus].color} style={{ margin: 0 }}>
                            {SUPPLIER_STATUS_MAP[pkg.supplierStatus].label}
                          </Tag>
                          {pkg.supplierStatus === 'PENDING' && (
                            <Text type="secondary" style={{ fontSize: 12 }}>
                              预计 {pkg.supplierEstimatedArrival} 前发货至基地
                            </Text>
                          )}
                          {pkg.supplierStatus !== 'PENDING' && (
                            <Text type="secondary" style={{ fontSize: 12 }}>
                              {pkg.supplierLogisticsCompany} · <span style={{ fontFamily: 'monospace', fontSize: 11 }}>{pkg.supplierTrackingNo}</span>
                              {' '}· 发 {pkg.supplierShipTime?.replace('T', ' ').substring(0, 10) || '-'}
                              {' '}· 到基地 {pkg.supplierEstimatedArrival || '-'}
                            </Text>
                          )}
                        </div>

                        {pkg.supplierTrackingNodes && pkg.supplierTrackingNodes.length > 0 && (
                          <Timeline style={{ margin: 0 }}
                            items={pkg.supplierTrackingNodes.map((n) => ({
                              color: n.description.includes('到达') ? 'green' : 'gray',
                              children: (
                                <div style={{ display: 'flex', gap: 8, alignItems: 'baseline' }}>
                                  <Text style={{ fontSize: 11 }}>{n.description}</Text>
                                  <Text type="secondary" style={{ fontSize: 10 }}>{n.time.replace('T', ' ').substring(0, 16)} · {n.location}</Text>
                                </div>
                              ),
                            }))}
                          />
                        )}

                        {parcels.length === 1 && (
                          <div style={{ marginTop: 4 }}>
                            <Text strong style={{ fontSize: 12 }}>基地发货预估: </Text>
                            <Text style={{ fontSize: 12, color: '#FF6B00' }}>
                              预计{pkg.shipTime.replace('T', ' ').substring(0, 10)}发 → {pkg.estimatedArrival}到
                            </Text>
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            );
          })}

          {/* 汇总行 */}
          {parcels.length > 1 && (
            <>
              <Divider style={{ margin: '10px 0' }} />
              <Row gutter={16}>
                <Col span={12}>
                  <Statistic title="总件数" value={parcels.reduce((s, p) => s + p.totalQty, 0)} suffix="件" valueStyle={{ fontSize: 15 }} />
                </Col>
                <Col span={12}>
                  <Statistic title="包裹数" value={parcels.length} prefix={<SplitCellsOutlined />} valueStyle={{ fontSize: 15, color: '#FF6B00' }} />
                </Col>
              </Row>
            </>
          )}
        </Card>
      )}

      {/* 主体：商品明细 + 拆分物流状态 */}
      <Row gutter={16}>
        <Col span={17}>
          <Card title="商品明细" style={{ marginBottom: 16 }}>
            {order.vinCodes.length > 0 && (
              <div style={{ marginBottom: 12 }}>
                <Text type="secondary" style={{ fontSize: 12 }}>关联车架号：</Text>
                {order.vinCodes.map((vin) => <Tag key={vin} color="purple" style={{ fontFamily: 'monospace', fontSize: 11 }}>{vin}</Tag>)}
              </div>
            )}

            {/* 按包裹分组显示商品明细 */}
            {parcels.length > 1 ? (
              <div>
                {parcels.map((pkg, idx) => {
                  const s = pkg.status;
                  const sColor = s === 'DELIVERED' ? '#16A34A' : s === 'IN_TRANSIT' ? '#FF6B00' : '#F59E0B';
                  const sLabel = s === 'DELIVERED' ? '已签收' : s === 'IN_TRANSIT' ? '运输中' : (idx === 0 ? '待发货' : '待补发');
                  return (
                    <Table key={idx} rowKey="skuCode" size="small" pagination={false}
                      style={idx === 0 ? undefined : { marginTop: 8 }}
                      title={() => <Tag color={idx === 0 ? 'blue' : 'orange'}>{pkg.label}</Tag>}
                      dataSource={pkg.items}
                      columns={[
                        { title: 'SKU', dataIndex: 'skuCode', width: 110, render: (c: string) => <span style={{ fontFamily: 'monospace', fontSize: 12 }}>{c}</span> },
                        { title: '商品名称', dataIndex: 'skuName', width: 200 },
                        { title: '数量', dataIndex: 'quantity', width: 60, align: 'center' },
                        { title: '物流状态', key: 'logistics', width: 100, render: () => <Tag color={sColor}>{sLabel}</Tag> },
                      ]} />
                  );
                })}
              </div>
            ) : (
              <Table rowKey="skuCode" columns={itemColumns} dataSource={order.items} pagination={false} size="middle" />
            )}

            {/* 合计行 */}
            <Divider style={{ margin: '8px 0' }} />
            <div style={{ textAlign: 'right' }}>
              <Text type="secondary">合计：{order.items.reduce((s, i) => s + i.quantity, 0)} 件 · </Text>
              <Text strong style={{ color: '#FF6B00', fontSize: 16 }}>¥{order.totalAmount.toLocaleString()}</Text>
              {parcels.length > 1 && <Tag color="orange" style={{ marginLeft: 8 }}>分{parcels.reduce((s, p) => s + p.totalQty, 0)}件 / {parcels.length}批</Tag>}
            </div>
          </Card>
        </Col>

        <Col span={7}>
          <Card title="订单信息" size="small" style={{ marginBottom: 16 }}>
            <Descriptions column={1} size="small" colon={false}>
              <Descriptions.Item label="订单号">{order.orderNo}</Descriptions.Item>
              <Descriptions.Item label="业务流程"><Tag>{BIZ_TYPE_MAP[order.bizType]}</Tag></Descriptions.Item>
              <Descriptions.Item label="时效等级"><Tag color={URGENCY_MAP[order.urgencyLevel].color}>{URGENCY_MAP[order.urgencyLevel].label}</Tag></Descriptions.Item>
              <Descriptions.Item label="履约方式">{FULFILL_METHOD_MAP[order.fulfillMethod]}</Descriptions.Item>
              <Descriptions.Item label="基地来源">{order.baseSource}</Descriptions.Item>
              <Descriptions.Item label="缺件">{order.shortageFlag ? <Tag color="error">是{parcels.length > 1 ? '(已拆分)' : ''}</Tag> : <Tag color="success">否</Tag>}</Descriptions.Item>
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
                  <Tag color={EXCEPTION_STATUS_MAP[ex.status] === '待处理' ? '#E11D48' : EXCEPTION_STATUS_MAP[ex.status] === '已解决' ? '#16A34A' : '#F59E0B'} style={{ float: 'right' }}>{EXCEPTION_STATUS_MAP[ex.status]}</Tag>
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
              <Table size="small" style={{ marginTop: 8 }} rowKey="skuCode" pagination={false} dataSource={deliveryNote.items}
                columns={[{ title: 'SKU', dataIndex: 'skuCode', width: 90, render: (c: string) => <span style={{ fontFamily: 'monospace', fontSize: 11 }}>{c}</span> }, { title: '应发', dataIndex: 'quantity', width: 40, align: 'center' }, { title: '实拣', dataIndex: 'pickedQty', width: 40, align: 'center', render: (v: number, _: any, i: number) => <span style={{ color: v < deliveryNote.items[i].quantity ? '#E11D48' : '#16A34A' }}>{v}</span> }]} />
            </Card>
          )}
          <Card title="操作日志" size="small" style={{ marginBottom: 16 }}>
            <Timeline items={operationLogs.map((log) => ({ color: log.action.includes('异常') ? 'red' : log.action.includes('签收') || log.action.includes('归档') ? 'green' : '#FF6B00', children: (<div><Text style={{ fontSize: 13 }}>{log.action}</Text><br /><Text type="secondary" style={{ fontSize: 12 }}>{log.operator}（{log.role}）</Text><br /><Text type="secondary" style={{ fontSize: 11 }}>{log.time.replace('T', ' ').substring(0, 19)}</Text>{log.remark && <><br /><Text type="secondary" italic style={{ fontSize: 11 }}>{log.remark}</Text></>}</div>) }))} />
          </Card>
        </Col>
      </Row>
    </div>
  );
}
