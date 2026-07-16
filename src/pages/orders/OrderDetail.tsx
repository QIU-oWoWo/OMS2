import { useParams, useNavigate } from 'react-router-dom';
import { Card, Descriptions, Table, Tag, Steps, Timeline, Space, Button, Typography, Row, Col, Breadcrumb, Tooltip, Alert, Statistic, Divider } from 'antd';
import { ArrowLeftOutlined, EnvironmentOutlined, ClockCircleOutlined, CarOutlined, InboxOutlined, ExclamationCircleOutlined, CheckCircleOutlined, TruckOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { mockOrders, mockDeliveryNotes, mockTrackingList, vehicleShippingPlans, supplierETAData, getOperationLogs } from '../../data/mockData';
import { ORDER_STATUS_MAP, BIZ_TYPE_MAP, URGENCY_MAP, FULFILL_METHOD_MAP, ORDER_STATUS_STEPS } from '../../types';
import type { OrderDTO, OrderItem, OrderStatus } from '../../types';

const { Title, Text } = Typography;

const REASON_MAP: Record<string, { label: string; color: string }> = {
  SUPPLIER_PENDING: { label: '供应商未发货', color: '#E11D48' },
  IN_TRANSIT: { label: '在途运输中', color: '#F59E0B' },
  CUSTOMS: { label: '通关中', color: '#7C3AED' },
  PRODUCTION: { label: '生产中', color: '#0284C7' },
};

export default function OrderDetail() {
  const { orderNo } = useParams<{ orderNo: string }>();
  const navigate = useNavigate();

  const order = mockOrders.find((o) => o.orderNo === orderNo);
  const deliveryNote = mockDeliveryNotes.find((dn) => dn.orderNo === orderNo);
  const tracking = mockTrackingList.find((t) => t.orderNo === orderNo);
  const operationLogs = order ? getOperationLogs(order) : [];

  if (!order) {
    return (<div style={{ textAlign: 'center', padding: 80 }}><Title level={3} type="secondary">订单未找到</Title><Button type="link" onClick={() => navigate('/orders')}>返回订单列表</Button></div>);
  }

  const currentStep = ORDER_STATUS_STEPS.indexOf(order.status);
  const isShipped = ['IN_TRANSIT', 'DELIVERED', 'COMPLETED'].includes(order.status);
  const isUnshipped = ['PENDING_REVIEW', 'SCHEDULING', 'PICKING', 'READY_TO_SHIP'].includes(order.status);
  const isException = order.status === 'EXCEPTION';

  // 使用订单自身的 shippingMethod
  const shippingMethod = order.shippingMethod;
  const linkedPlan = order.linkedPlanNo ? vehicleShippingPlans.find((p) => p.planNo === order.linkedPlanNo) : undefined;

  // 缺件ETA
  const etaData = supplierETAData[order.orderNo] || [];
  const estimatedShipDate = isUnshipped ? dayjs().add(3, 'day').format('YYYY-MM-DD') : order.createTime.replace('T', ' ').substring(0, 10);

  const itemColumns: ColumnsType<OrderItem> = [
    { title: 'SKU编码', dataIndex: 'skuCode', width: 140, render: (c: string) => <span style={{ fontFamily: 'monospace', fontSize: 13 }}>{c}</span> },
    { title: '商品名称', dataIndex: 'skuName', width: 240 },
    { title: '单价', dataIndex: 'unitPrice', width: 100, align: 'right', render: (p: number) => `¥${p.toLocaleString()}` },
    { title: '数量', dataIndex: 'quantity', width: 80, align: 'center' },
    { title: '缺件', dataIndex: 'shortageQty', width: 80, align: 'center', render: (q: number) => q > 0 ? <Tag color="error">{q}</Tag> : <span style={{ color: '#8C8C8C' }}>-</span> },
    { title: '小计', dataIndex: 'subtotal', width: 120, align: 'right', render: (s: number) => <span style={{ fontWeight: 500 }}>¥{s.toLocaleString()}</span> },
  ];

  return (
    <div>
      <Breadcrumb style={{ marginBottom: 16 }} items={[{ title: <a onClick={() => navigate('/orders')}>订单管理</a> }, { title: `详情 ${order.orderNo}` }]} />

      {/* 头部信息卡 */}
      <Card style={{ marginBottom: 16 }}>
        <Row align="middle" gutter={24}>
          <Col flex="auto">
            <Space size="large" align="start">
              <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/orders')} style={{ marginTop: 4 }} />
              <div>
                <Title level={4} style={{ margin: 0 }}>
                  订单 {order.orderNo}
                  {isException ? <Tag color="error" style={{ marginLeft: 12 }}>异常</Tag> : order.status === 'COMPLETED' ? <Tag color="success" style={{ marginLeft: 12 }}>已完成</Tag> : <Tag color="processing" style={{ marginLeft: 12 }}>进行中</Tag>}
                  <Tag color={shippingMethod === 'WITH_VEHICLE' ? '#7C3AED' : '#0284C7'} style={{ marginLeft: 8 }}>
                    {shippingMethod === 'WITH_VEHICLE' ? <><CarOutlined /> 随车发货</> : <><InboxOutlined /> 非随发货</>}
                  </Tag>
                </Title>
                <Space size={16} style={{ marginTop: 8 }}>
                  <Text type="secondary">经销商: {order.dealerName}</Text>
                  <Text type="secondary">下单: {order.createTime.replace('T', ' ').substring(0, 16)}</Text>
                  <Tag color={URGENCY_MAP[order.urgencyLevel].color}>{URGENCY_MAP[order.urgencyLevel].label}</Tag>
                </Space>
              </div>
            </Space>
          </Col>
        </Row>
        <div style={{ marginTop: 24, padding: '0 40px' }}>
          <Steps current={isException ? -1 : order.status === 'COMPLETED' ? ORDER_STATUS_STEPS.length : currentStep} status={isException ? 'error' : undefined} size="small"
            items={ORDER_STATUS_STEPS.map((s) => ({ title: ORDER_STATUS_MAP[s] }))} />
        </div>
      </Card>

      <Row gutter={16}>
        {/* 左侧：商品明细 + 物流/ETA */}
        <Col span={17}>
          <Card title="商品明细" style={{ marginBottom: 16 }}>
            <Table rowKey="skuCode" columns={itemColumns} dataSource={order.items} pagination={false} size="middle"
              summary={() => (<Table.Summary.Row><Table.Summary.Cell index={0} colSpan={3}><Text strong>合计</Text></Table.Summary.Cell><Table.Summary.Cell index={1} align="center"><Text strong>{order.items.reduce((s, i) => s + i.quantity, 0)}</Text></Table.Summary.Cell><Table.Summary.Cell index={2} align="center" /><Table.Summary.Cell index={3} align="right"><Text strong style={{ color: '#FF6B00', fontSize: 16 }}>¥{order.totalAmount.toLocaleString()}</Text></Table.Summary.Cell></Table.Summary.Row>)} />
          </Card>

          {/* 已发订单：物流/配送信息 */}
          {isShipped && (
            <Card title={<Space><TruckOutlined />物流/配送信息</Space>} style={{ marginBottom: 16 }}>
              {shippingMethod === 'WITH_VEHICLE' && linkedPlan ? (
                <div>
                  <Alert message={<Space><CarOutlined />随车发货</Space>} description={
                    <Descriptions column={2} size="small" colon={false}>
                      <Descriptions.Item label="整车计划编号"><a onClick={() => navigate('/orders/vehicle-shipping')} style={{ fontFamily: 'monospace' }}>{linkedPlan.planNo}</a></Descriptions.Item>
                      <Descriptions.Item label="发车状态"><Tag color={linkedPlan.status === 'ARRIVED' ? '#16A34A' : linkedPlan.status === 'IN_TRANSIT' ? '#FF6B00' : '#0284C7'}>{linkedPlan.status === 'PLANNED' ? '已计划' : linkedPlan.status === 'LOADING' ? '装载中' : linkedPlan.status === 'IN_TRANSIT' ? '运输中' : '已到达'}</Tag></Descriptions.Item>
                      <Descriptions.Item label="整车车型">{linkedPlan.vehicleModel}</Descriptions.Item>
                      <Descriptions.Item label="整车数量">{linkedPlan.vehicleCount} 辆</Descriptions.Item>
                      <Descriptions.Item label="计划发车日期">{linkedPlan.plannedShipDate}</Descriptions.Item>
                      <Descriptions.Item label="实际发车日期">{linkedPlan.actualShipDate || '-'}</Descriptions.Item>
                      <Descriptions.Item label="路线">{linkedPlan.route}</Descriptions.Item>
                      <Descriptions.Item label="司机">{linkedPlan.driver}</Descriptions.Item>
                    </Descriptions>
                  } type="info" showIcon={false} />
                  <div style={{ marginTop: 12, textAlign: 'right' }}>
                    <Button size="small" type="link" onClick={() => navigate('/orders/vehicle-shipping')}>查看整车计划 →</Button>
                  </div>
                </div>
              ) : (
                <div>
                  <Alert message={<Space><InboxOutlined />非随发货（独立快递）</Space>} type="info" showIcon={false} style={{ marginBottom: 12 }} />
                  <Descriptions column={2} size="small" colon={false}>
                    <Descriptions.Item label="物流公司">{order.logisticsCompany || '-'}</Descriptions.Item>
                    <Descriptions.Item label="运单号">{order.trackingNo ? <a onClick={() => navigate(`/exceptions/logistics/${order.trackingNo}`)} style={{ fontFamily: 'monospace' }}>{order.trackingNo}</a> : '-'}</Descriptions.Item>
                  </Descriptions>
                  {tracking && (
                    <div style={{ marginTop: 12 }}>
                      <Text strong style={{ fontSize: 13 }}>最新轨迹：</Text>
                      <Timeline style={{ marginTop: 8 }} items={tracking.nodes.slice(-3).map((n) => ({ color: '#FF6B00', children: <div><Text style={{ fontSize: 12 }}>{n.description}</Text><br /><Text type="secondary" style={{ fontSize: 11 }}>{n.time.replace('T', ' ').substring(0, 16)} · {n.location}</Text></div> }))} />
                    </div>
                  )}
                  <div style={{ marginTop: 8, textAlign: 'right' }}>
                    {order.trackingNo && <Button size="small" type="link" onClick={() => navigate(`/exceptions/logistics/${order.trackingNo}`)}>查看完整轨迹 →</Button>}
                  </div>
                </div>
              )}
              <Divider style={{ margin: '12px 0' }} />
              <Row gutter={16}>
                <Col span={12}><Statistic title={tracking?.trackStatus === 'DELIVERED' ? '签收时间' : '预计到货时间'} value={tracking?.trackStatus === 'DELIVERED' ? (tracking?.nodes[tracking.nodes.length - 1]?.time || '').replace('T', ' ').substring(0, 10) : '—'} prefix={<ClockCircleOutlined />} valueStyle={{ fontSize: 18 }} /></Col>
                <Col span={12}><Statistic title="发货时间" value={order.createTime.replace('T', ' ').substring(0, 16).split('T')[0]} prefix={<CheckCircleOutlined />} valueStyle={{ fontSize: 18, color: '#16A34A' }} /></Col>
              </Row>
            </Card>
          )}

          {/* 未发订单：缺件ETA + 预计时间 */}
          {isUnshipped && (
            <Card title={<Space><ClockCircleOutlined />未发配件到货预估</Space>} style={{ marginBottom: 16, borderLeft: '3px solid #F59E0B' }}>
              {etaData.length > 0 ? (
                <div>
                  <Text strong style={{ fontSize: 13, color: '#E11D48' }}>缺件/待补配件：</Text>
                  <Table size="small" style={{ marginTop: 8, marginBottom: 16 }} rowKey="skuCode" pagination={false}
                    dataSource={etaData}
                    columns={[
                      { title: 'SKU', dataIndex: 'skuCode', width: 100, render: (c: string) => <span style={{ fontFamily: 'monospace', fontSize: 12 }}>{c}</span> },
                      { title: '名称', dataIndex: 'skuName', width: 120 },
                      { title: '缺少数', dataIndex: 'shortageQty', width: 60, align: 'center', render: (v: number) => <Tag color="error">{v}</Tag> },
                      { title: '供应商', dataIndex: 'supplier', width: 80 },
                      { title: '预计到货', dataIndex: 'estimatedArrival', width: 140, render: (t: string) => <span style={{ fontWeight: 500, color: '#F59E0B' }}>{t.replace('T', ' ').substring(0, 16)}</span> },
                      { title: '物流单号', dataIndex: 'reason', width: 100, render: () => <Text type="secondary">—</Text> },
                    ]} />
                  <Alert message="以上配件由供应商发货至基地仓库，到货后方可拣货发出" type="warning" showIcon style={{ marginBottom: 16 }} />
                </div>
              ) : (
                <Alert message="当前无缺件，等待仓库排单拣货" type="success" showIcon style={{ marginBottom: 16 }} />
              )}
              <Row gutter={16}>
                <Col span={8}><Statistic title="预计发货时间" value={estimatedShipDate} prefix={<ClockCircleOutlined />} valueStyle={{ color: '#FF6B00', fontSize: 16 }} /></Col>
                <Col span={8}><Statistic title="预计到货时间" value="—" prefix={<EnvironmentOutlined />} valueStyle={{ color: '#8C8C8C', fontSize: 16 }} /></Col>
                <Col span={8}><Statistic title="发货方式" value={shippingMethod === 'WITH_VEHICLE' ? '随车' : '非随'} prefix={shippingMethod === 'WITH_VEHICLE' ? <CarOutlined /> : <InboxOutlined />} valueStyle={{ fontSize: 16 }} /></Col>
              </Row>
            </Card>
          )}
        </Col>

        {/* 右侧面板 */}
        <Col span={7}>
          <Card title="订单信息" size="small" style={{ marginBottom: 16 }}>
            <Descriptions column={1} size="small" colon={false}>
              <Descriptions.Item label="订单号">{order.orderNo}</Descriptions.Item>
              <Descriptions.Item label="业务流程"><Tag>{BIZ_TYPE_MAP[order.bizType]}</Tag></Descriptions.Item>
              <Descriptions.Item label="时效等级"><Tag color={URGENCY_MAP[order.urgencyLevel].color}>{URGENCY_MAP[order.urgencyLevel].label}</Tag></Descriptions.Item>
              <Descriptions.Item label="履约方式">{FULFILL_METHOD_MAP[order.fulfillMethod]}</Descriptions.Item>
              <Descriptions.Item label="基地来源">{order.baseSource}</Descriptions.Item>
              <Descriptions.Item label="缺件">{order.shortageFlag ? <Tag color="error">是</Tag> : <Tag color="success">否</Tag>}</Descriptions.Item>
            </Descriptions>
          </Card>

          <Card title="收货信息" size="small" style={{ marginBottom: 16 }}>
            <Descriptions column={1} size="small" colon={false}>
              <Descriptions.Item label="收货人">{order.receiverName}</Descriptions.Item>
              <Descriptions.Item label="电话">{order.receiverPhone}</Descriptions.Item>
              <Descriptions.Item label="地址">{order.receiverProvince} {order.receiverCity} {order.receiverDistrict} {order.receiverAddress}</Descriptions.Item>
            </Descriptions>
          </Card>

          {/* 发货方式信息 */}
          <Card title={<Space><TruckOutlined />发货方式</Space>} size="small" style={{ marginBottom: 16, borderLeft: `3px solid ${shippingMethod === 'WITH_VEHICLE' ? '#7C3AED' : '#0284C7'}` }}>
            <div style={{ textAlign: 'center', padding: '12px 0' }}>
              <div style={{ fontSize: 36 }}>{shippingMethod === 'WITH_VEHICLE' ? <CarOutlined style={{ color: '#7C3AED' }} /> : <InboxOutlined style={{ color: '#0284C7' }} />}</div>
              <Title level={5} style={{ margin: '8px 0 4px', color: shippingMethod === 'WITH_VEHICLE' ? '#7C3AED' : '#0284C7' }}>{shippingMethod === 'WITH_VEHICLE' ? '随车发货' : '非随发货'}</Title>
              <Text type="secondary" style={{ fontSize: 12 }}>
                {shippingMethod === 'WITH_VEHICLE' ? '配件随整车一起发往经销商' : '配件通过快递/物流独立发出'}
              </Text>
              {linkedPlan && (
                <div style={{ marginTop: 8 }}>
                  <Tag color="purple">关联计划: {linkedPlan.planNo}</Tag>
                </div>
              )}
            </div>
          </Card>

          {/* 电子交货单 */}
          {deliveryNote && (
            <Card title="电子交货单" size="small" style={{ marginBottom: 16, borderLeft: '3px solid #FF6B00' }}>
              <Descriptions column={1} size="small" colon={false}>
                <Descriptions.Item label="交货单号"><span style={{ fontFamily: 'monospace', fontWeight: 500 }}>{deliveryNote.noteNo}</span></Descriptions.Item>
                <Descriptions.Item label="仓库">{deliveryNote.warehouseName}</Descriptions.Item>
                <Descriptions.Item label="状态"><Tag color={deliveryNote.status === 'RECEIVED' ? '#16A34A' : '#FF6B00'}>{deliveryNote.status === 'GENERATED' ? '已生成' : deliveryNote.status === 'PRINTED' ? '已打印' : deliveryNote.status === 'SHIPPED' ? '已发货' : '已签收'}</Tag></Descriptions.Item>
                <Descriptions.Item label="总件数">{deliveryNote.totalQty} 件</Descriptions.Item>
              </Descriptions>
              <Table size="small" style={{ marginTop: 8 }} rowKey="skuCode" pagination={false} dataSource={deliveryNote.items}
                columns={[
                  { title: 'SKU', dataIndex: 'skuCode', width: 90, render: (c: string) => <span style={{ fontFamily: 'monospace', fontSize: 11 }}>{c}</span> },
                  { title: '应发', dataIndex: 'quantity', width: 40, align: 'center' },
                  { title: '实拣', dataIndex: 'pickedQty', width: 40, align: 'center', render: (v: number, _: any, i: number) => <span style={{ color: v < deliveryNote.items[i].quantity ? '#E11D48' : '#16A34A' }}>{v}</span> },
                ]} />
            </Card>
          )}

          {/* 操作日志 */}
          <Card title="操作日志" size="small" style={{ marginBottom: 16 }}>
            <Timeline items={operationLogs.map((log) => ({ color: log.action.includes('异常') ? 'red' : log.action.includes('签收') || log.action.includes('归档') ? 'green' : '#FF6B00', children: (<div><Text style={{ fontSize: 13 }}>{log.action}</Text><br /><Text type="secondary" style={{ fontSize: 12 }}>{log.operator}（{log.role}）</Text><br /><Text type="secondary" style={{ fontSize: 11 }}>{log.time.replace('T', ' ').substring(0, 19)}</Text>{log.remark && <><br /><Text type="secondary" italic style={{ fontSize: 11 }}>{log.remark}</Text></>}</div>) }))} />
          </Card>
        </Col>
      </Row>
    </div>
  );
}
