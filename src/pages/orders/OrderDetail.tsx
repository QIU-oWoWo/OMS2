import { useParams, useNavigate } from 'react-router-dom';
import { Card, Descriptions, Table, Tag, Steps, Timeline, Space, Button, Typography, Row, Col, Breadcrumb, Statistic, Divider, Alert } from 'antd';
import { ArrowLeftOutlined, ClockCircleOutlined, CarOutlined, InboxOutlined, ExclamationCircleOutlined, CheckCircleOutlined, TruckOutlined, SplitCellsOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { mockOrders, mockDeliveryNotes, mockTrackingList, vehicleShippingPlans, supplierETAData, getOperationLogs, mockExceptions, getSplitShipmentData } from '../../data/mockData';
import { ORDER_STATUS_MAP, BIZ_TYPE_MAP, URGENCY_MAP, FULFILL_METHOD_MAP, ORDER_STATUS_STEPS, EXCEPTION_TYPE_MAP, EXCEPTION_STATUS_MAP } from '../../types';
import type { OrderItem, OrderStatus } from '../../types';

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

  if (!order) return (<div style={{ textAlign: 'center', padding: 80 }}><Title level={3} type="secondary">订单未找到</Title><Button type="link" onClick={() => navigate('/orders')}>返回订单列表</Button></div>);

  const currentStep = ORDER_STATUS_STEPS.indexOf(order.status);
  const isShipped = ['IN_TRANSIT', 'DELIVERED', 'COMPLETED'].includes(order.status);
  const isUnshipped = ['PENDING_REVIEW', 'SCHEDULING', 'PICKING', 'READY_TO_SHIP'].includes(order.status);
  const isException = order.status === 'EXCEPTION';
  const shippingMethod = order.shippingMethod;
  const linkedPlan = order.linkedPlanNo ? vehicleShippingPlans.find((p) => p.planNo === order.linkedPlanNo) : undefined;
  const etaData = supplierETAData[order.orderNo] || [];
  const estimatedShipDate = dayjs().add(isUnshipped ? 3 : 0, 'day').format('YYYY-MM-DD');

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
      </Card>

      {/* ========== 物流/发货 + 缺件ETA（统一放状态流程下方） ========== */}
      {(isShipped || isUnshipped) && (
        <Card title={<Space><TruckOutlined />发货与物流信息</Space>} style={{ marginBottom: 16 }}>
          {/* 随车/非随标签 */}
          {isShipped && (
            <Alert
              message={shippingMethod === 'WITH_VEHICLE'
                ? <Space><CarOutlined />随车发货 — {linkedPlan?.planNo || '未关联计划'} · {linkedPlan?.vehicleModel || ''} · {linkedPlan?.route || ''}</Space>
                : <Space><InboxOutlined />非随发货 — {order.logisticsCompany || '-'} · 运单号: {order.trackingNo || '-'}</Space>}
              type="info" showIcon={false} style={{ marginBottom: 12 }} />
          )}

          {/* 拆分发货详情 */}
          {splitData && (
            <Alert message={<Space><SplitCellsOutlined />拆分发货 — 有货件先行，缺件补发随后</Space>} type="warning" showIcon style={{ marginBottom: 12 }}
              description={
                <Row gutter={16} style={{ marginTop: 8 }}>
                  <Col span={12}>
                    <Card size="small" style={{ background: '#F6FFED' }}>
                      <Text strong style={{ color: '#16A34A' }}>{splitData.primary.label}</Text>
                      <Descriptions column={1} size="small" style={{ marginTop: 4 }}>
                        <Descriptions.Item label="运单号"><span style={{ fontFamily: 'monospace', fontSize: 12 }}>{splitData.primary.trackingNo}</span></Descriptions.Item>
                        <Descriptions.Item label="状态"><Tag color={splitData.primary.status === 'DELIVERED' ? '#16A34A' : '#FF6B00'}>{splitData.primary.status === 'DELIVERED' ? '已签收' : '运输中'}</Tag></Descriptions.Item>
                        <Descriptions.Item label="件数">{splitData.primary.totalQty} 件</Descriptions.Item>
                      </Descriptions>
                    </Card>
                  </Col>
                  <Col span={12}>
                    <Card size="small" style={{ background: '#FFFBE6' }}>
                      <Text strong style={{ color: '#D97706' }}>{splitData.secondary.label}</Text>
                      <Descriptions column={1} size="small" style={{ marginTop: 4 }}>
                        <Descriptions.Item label="运单号"><span style={{ fontFamily: 'monospace', fontSize: 12 }}>{splitData.secondary.trackingNo}</span></Descriptions.Item>
                        <Descriptions.Item label="状态"><Tag color={splitData.secondary.status === 'DELIVERED' ? '#16A34A' : splitData.secondary.status === 'IN_TRANSIT' ? '#FF6B00' : '#F59E0B'}>{splitData.secondary.status === 'DELIVERED' ? '已签收' : splitData.secondary.status === 'IN_TRANSIT' ? '运输中' : '待补发'}</Tag></Descriptions.Item>
                        <Descriptions.Item label="件数">{splitData.secondary.totalQty} 件</Descriptions.Item>
                      </Descriptions>
                    </Card>
                  </Col>
                </Row>
              } />
          )}

          {/* 未发货缺件ETA — 挪到上面 */}
          {isUnshipped && etaData.length > 0 && (
            <Card title={<Space><ClockCircleOutlined />缺件配件到货预估</Space>} size="small" style={{ marginBottom: 12, borderLeft: '3px solid #F59E0B' }}>
              <Table size="small" rowKey="skuCode" pagination={false} dataSource={etaData}
                columns={[
                  { title: 'SKU', dataIndex: 'skuCode', width: 100, render: (c: string) => <span style={{ fontFamily: 'monospace', fontSize: 12 }}>{c}</span> },
                  { title: '名称', dataIndex: 'skuName', width: 120 },
                  { title: '缺少数', dataIndex: 'shortageQty', width: 60, align: 'center', render: (v: number) => <Tag color="error">{v}</Tag> },
                  { title: '供应商', dataIndex: 'supplier', width: 80 },
                  { title: '预计到货', dataIndex: 'estimatedArrival', width: 140, render: (t: string) => <span style={{ fontWeight: 500, color: '#F59E0B' }}>{t.replace('T', ' ').substring(0, 16)}</span> },
                  { title: '物流单号', dataIndex: 'reason', width: 90, render: () => <Text type="secondary">—</Text> },
                ]} />
              <Alert message="以上配件由供应商发货至基地仓库，到货后方可拣货发出。也可选择拆分发货，有货件先行。" type="warning" showIcon style={{ marginTop: 8 }} />
            </Card>
          )}

          {/* 统计行 — 4个维度同行 */}
          <Divider style={{ margin: '12px 0' }} />
          <Row gutter={16}>
            <Col span={6}>
              <Statistic title="发货时间" value={isShipped ? order.createTime.replace('T', ' ').substring(0, 10) : estimatedShipDate}
                prefix={<CheckCircleOutlined />} valueStyle={{ fontSize: 16, color: isShipped ? '#16A34A' : '#FF6B00' }} />
            </Col>
            <Col span={6}>
              {isShipped && tracking?.trackStatus === 'DELIVERED'
                ? <Statistic title="签收时间" value={(tracking?.nodes[tracking.nodes.length - 1]?.time || '').replace('T', ' ').substring(0, 10)} prefix={<CheckCircleOutlined />} valueStyle={{ fontSize: 16, color: '#16A34A' }} />
                : <Statistic title="预计到货时间" value="—" prefix={<ClockCircleOutlined />} valueStyle={{ fontSize: 16, color: '#8C8C8C' }} />
              }
            </Col>
            <Col span={6}>
              <Statistic title="发货方式" value={shippingMethod === 'WITH_VEHICLE' ? '随车' : '非随'}
                prefix={shippingMethod === 'WITH_VEHICLE' ? <CarOutlined /> : <InboxOutlined />} valueStyle={{ fontSize: 16 }} />
            </Col>
            <Col span={6}>
              <Statistic title="拆分单数" value={splitData ? 2 : 1}
                prefix={splitData ? <SplitCellsOutlined /> : <InboxOutlined />}
                valueStyle={{ fontSize: 16, color: splitData ? '#FF6B00' : '#8C8C8C' }} />
            </Col>
          </Row>
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

            {/* 拆分发货：按批次分组显示 */}
            {splitData ? (
              <div>
                <Table rowKey="skuCode" size="small" pagination={false}
                  title={() => <Tag color="blue">{splitData.primary.label}</Tag>}
                  dataSource={splitData.primary.items}
                  columns={[
                    { title: 'SKU', dataIndex: 'skuCode', width: 110, render: (c: string) => <span style={{ fontFamily: 'monospace', fontSize: 12 }}>{c}</span> },
                    { title: '商品名称', dataIndex: 'skuName', width: 200 },
                    { title: '数量', dataIndex: 'quantity', width: 60, align: 'center' },
                    { title: '物流状态', key: 'logistics', width: 100, render: () => <Tag color={splitData.primary.status === 'DELIVERED' ? '#16A34A' : '#FF6B00'}>{splitData.primary.status === 'DELIVERED' ? '已签收' : '运输中'}</Tag> },
                  ]} />
                <Table rowKey="skuCode" size="small" pagination={false} style={{ marginTop: 8 }}
                  title={() => <Tag color="orange">{splitData.secondary.label}</Tag>}
                  dataSource={splitData.secondary.items}
                  columns={[
                    { title: 'SKU', dataIndex: 'skuCode', width: 110, render: (c: string) => <span style={{ fontFamily: 'monospace', fontSize: 12 }}>{c}</span> },
                    { title: '商品名称', dataIndex: 'skuName', width: 200 },
                    { title: '数量', dataIndex: 'quantity', width: 60, align: 'center' },
                    { title: '物流状态', key: 'logistics', width: 100, render: () => <Tag color={splitData.secondary.status === 'DELIVERED' ? '#16A34A' : splitData.secondary.status === 'IN_TRANSIT' ? '#FF6B00' : '#F59E0B'}>{splitData.secondary.status === 'DELIVERED' ? '已签收' : splitData.secondary.status === 'IN_TRANSIT' ? '运输中' : '待补发'}</Tag> },
                  ]} />
              </div>
            ) : (
              <Table rowKey="skuCode" columns={itemColumns} dataSource={order.items} pagination={false} size="middle" />
            )}

            {/* 合计行 */}
            <Divider style={{ margin: '8px 0' }} />
            <div style={{ textAlign: 'right' }}>
              <Text type="secondary">合计：{order.items.reduce((s, i) => s + i.quantity, 0)} 件 · </Text>
              <Text strong style={{ color: '#FF6B00', fontSize: 16 }}>¥{order.totalAmount.toLocaleString()}</Text>
              {splitData && <Tag color="orange" style={{ marginLeft: 8 }}>分{splitData.primary.totalQty + splitData.secondary.totalQty}件 / 2批</Tag>}
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
              <Descriptions.Item label="缺件">{order.shortageFlag ? <Tag color="error">是{splitData ? '(已拆分)' : ''}</Tag> : <Tag color="success">否</Tag>}</Descriptions.Item>
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
