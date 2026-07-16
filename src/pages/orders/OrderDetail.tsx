import { useParams, useNavigate } from 'react-router-dom';
import {
  Card,
  Descriptions,
  Table,
  Tag,
  Steps,
  Timeline,
  Space,
  Button,
  Typography,
  Row,
  Col,
  Breadcrumb,
  Tooltip,
  Affix,
} from 'antd';
import {
  ArrowLeftOutlined,
  EditOutlined,
  CloseCircleOutlined,
  CheckCircleOutlined,
  ScheduleOutlined,
  PrinterOutlined,
  MessageOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { mockOrders, mockOperationLogs, mockDeliveryNotes } from '../../data/mockData';
import {
  ORDER_STATUS_MAP,
  BIZ_TYPE_MAP,
  URGENCY_MAP,
  FULFILL_METHOD_MAP,
  ORDER_STATUS_STEPS,
} from '../../types';
import type { OrderDTO, OrderItem, OrderStatus } from '../../types';

const { Title, Text } = Typography;

export default function OrderDetail() {
  const { orderNo } = useParams<{ orderNo: string }>();
  const navigate = useNavigate();

  const order = mockOrders.find((o) => o.orderNo === orderNo);
  const deliveryNote = mockDeliveryNotes.find((dn) => dn.orderNo === orderNo);

  if (!order) {
    return (
      <div style={{ textAlign: 'center', padding: 80 }}>
        <Title level={3} type="secondary">订单未找到</Title>
        <Text type="secondary">订单号: {orderNo}</Text>
        <br />
        <Button
          type="link"
          onClick={() => navigate('/orders')}
          style={{ marginTop: 16 }}
        >
          返回订单列表
        </Button>
      </div>
    );
  }

  const currentStep = ORDER_STATUS_STEPS.indexOf(order.status);
  const isException = order.status === 'EXCEPTION';
  const isCompleted = order.status === 'COMPLETED';

  // 商品明细列
  const itemColumns: ColumnsType<OrderItem> = [
    {
      title: 'SKU编码',
      dataIndex: 'skuCode',
      key: 'skuCode',
      width: 140,
      render: (code: string) => <span style={{ fontFamily: 'monospace', fontSize: 13 }}>{code}</span>,
    },
    {
      title: '商品名称',
      dataIndex: 'skuName',
      key: 'skuName',
      width: 240,
    },
    {
      title: '单价',
      dataIndex: 'unitPrice',
      key: 'unitPrice',
      width: 100,
      align: 'right',
      render: (p: number) => `¥${p.toLocaleString()}`,
    },
    {
      title: '数量',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 80,
      align: 'center',
    },
    {
      title: '缺件数',
      dataIndex: 'shortageQty',
      key: 'shortageQty',
      width: 80,
      align: 'center',
      render: (qty: number) =>
        qty > 0 ? <Tag color="error">{qty}</Tag> : <span style={{ color: '#8C8C8C' }}>-</span>,
    },
    {
      title: '小计',
      dataIndex: 'subtotal',
      key: 'subtotal',
      width: 120,
      align: 'right',
      render: (s: number) => (
        <span style={{ fontWeight: 500 }}>¥{s.toLocaleString()}</span>
      ),
    },
  ];

  return (
    <div>
      {/* 面包屑导航 */}
      <Breadcrumb
        style={{ marginBottom: 16 }}
        items={[
          { title: <a onClick={() => navigate('/orders')}>订单管理</a> },
          { title: `订单详情 ${order.orderNo}` },
        ]}
      />

      {/* 头部信息卡 + 状态进度条 */}
      <Card style={{ marginBottom: 16 }}>
        <Row align="middle" gutter={24}>
          <Col flex="auto">
            <Space size="large" align="start">
              <Button
                icon={<ArrowLeftOutlined />}
                onClick={() => navigate('/orders')}
                style={{ marginTop: 4 }}
              />
              <div>
                <Title level={4} style={{ margin: 0 }}>
                  订单 {order.orderNo}
                  {isException ? (
                    <Tag color="error" style={{ marginLeft: 12 }}>异常</Tag>
                  ) : isCompleted ? (
                    <Tag color="success" style={{ marginLeft: 12 }}>已完成</Tag>
                  ) : (
                    <Tag color="processing" style={{ marginLeft: 12 }}>进行中</Tag>
                  )}
                </Title>
                <Space size={16} style={{ marginTop: 8 }}>
                  <Text type="secondary">经销商: {order.dealerName}</Text>
                  <Text type="secondary">下单时间: {order.createTime.replace('T', ' ').substring(0, 16)}</Text>
                  <Tag color={URGENCY_MAP[order.urgencyLevel].color}>
                    {URGENCY_MAP[order.urgencyLevel].label}
                  </Tag>
                </Space>
              </div>
            </Space>
          </Col>
        </Row>

        {/* 状态进度条 */}
        <div style={{ marginTop: 24, padding: '0 40px' }}>
          <Steps
            current={isException ? -1 : isCompleted ? ORDER_STATUS_STEPS.length : currentStep}
            status={isException ? 'error' : undefined}
            size="small"
            items={ORDER_STATUS_STEPS.map((status) => ({
              title: ORDER_STATUS_MAP[status],
            }))}
          />
          {isException && (
            <div style={{ marginTop: 8, textAlign: 'center' }}>
              <Tag color="error" icon={<CloseCircleOutlined />}>
                订单异常 - 缺件问题待处理
              </Tag>
            </div>
          )}
        </div>
      </Card>

      {/* 主体区域：商品明细 + 侧边信息 */}
      <Row gutter={16}>
        {/* 左侧：商品明细 */}
        <Col span={17}>
          <Card title="商品明细" style={{ marginBottom: 16 }}>
            <Table
              rowKey="skuCode"
              columns={itemColumns}
              dataSource={order.items}
              pagination={false}
              size="middle"
              summary={() => (
                <Table.Summary.Row>
                  <Table.Summary.Cell index={0} colSpan={3}>
                    <Text strong>合计</Text>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={1} align="center">
                    <Text strong>
                      {order.items.reduce((sum, item) => sum + item.quantity, 0)}
                    </Text>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={2} align="center" />
                  <Table.Summary.Cell index={3} align="right">
                    <Text strong style={{ color: '#FF6B00', fontSize: 16 }}>
                      ¥{order.totalAmount.toLocaleString()}
                    </Text>
                  </Table.Summary.Cell>
                </Table.Summary.Row>
              )}
            />
          </Card>
        </Col>

        {/* 右侧：侧边信息面板 */}
        <Col span={7}>
          {/* 订单信息 */}
          <Card title="订单信息" size="small" style={{ marginBottom: 16 }}>
            <Descriptions column={1} size="small" colon={false}>
              <Descriptions.Item label="订单号">{order.orderNo}</Descriptions.Item>
              <Descriptions.Item label="业务流程">
                <Tag>{BIZ_TYPE_MAP[order.bizType]}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="时效等级">
                <Tag color={URGENCY_MAP[order.urgencyLevel].color}>
                  {URGENCY_MAP[order.urgencyLevel].label}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="履约方式">
                {FULFILL_METHOD_MAP[order.fulfillMethod]}
              </Descriptions.Item>
              <Descriptions.Item label="基地来源">{order.baseSource}</Descriptions.Item>
              <Descriptions.Item label="VIN码">
                <Tooltip title={order.vinCode}>
                  <span style={{ fontFamily: 'monospace', fontSize: 12 }}>
                    {order.vinCode.length > 17
                      ? order.vinCode.substring(0, 17) + '...'
                      : order.vinCode}
                  </span>
                </Tooltip>
              </Descriptions.Item>
              <Descriptions.Item label="缺件">
                {order.shortageFlag ? (
                  <Tag color="error">是</Tag>
                ) : (
                  <Tag color="success">否</Tag>
                )}
              </Descriptions.Item>
            </Descriptions>
          </Card>

          {/* 收货地址 */}
          <Card title="收货信息" size="small" style={{ marginBottom: 16 }}>
            <Descriptions column={1} size="small" colon={false}>
              <Descriptions.Item label="收货人">{order.receiverName}</Descriptions.Item>
              <Descriptions.Item label="电话">{order.receiverPhone}</Descriptions.Item>
              <Descriptions.Item label="地址">
                {order.receiverProvince} {order.receiverCity} {order.receiverDistrict} {order.receiverAddress}
              </Descriptions.Item>
            </Descriptions>
          </Card>

          {/* 物流信息 */}
          {order.trackingNo && (
            <Card title="物流信息" size="small" style={{ marginBottom: 16 }}>
              <Descriptions column={1} size="small" colon={false}>
                <Descriptions.Item label="物流公司">{order.logisticsCompany}</Descriptions.Item>
                <Descriptions.Item label="运单号">
                  <a style={{ fontFamily: 'monospace' }}>{order.trackingNo}</a>
                </Descriptions.Item>
              </Descriptions>
            </Card>
          )}

          {/* 电子交货单 */}
          {deliveryNote && (
            <Card title="电子交货单" size="small" style={{ marginBottom: 16, borderLeft: '3px solid #FF6B00' }}>
              <Descriptions column={1} size="small" colon={false}>
                <Descriptions.Item label="交货单号"><span style={{ fontFamily: 'monospace', fontWeight: 500 }}>{deliveryNote.noteNo}</span></Descriptions.Item>
                <Descriptions.Item label="仓库">{deliveryNote.warehouseName}</Descriptions.Item>
                <Descriptions.Item label="状态"><Tag color={deliveryNote.status === 'RECEIVED' ? '#16A34A' : deliveryNote.status === 'SHIPPED' ? '#0284C7' : '#FF6B00'}>{deliveryNote.status === 'GENERATED' ? '已生成' : deliveryNote.status === 'PRINTED' ? '已打印' : deliveryNote.status === 'SHIPPED' ? '已发货' : '已签收'}</Tag></Descriptions.Item>
                <Descriptions.Item label="总件数">{deliveryNote.totalQty} 件</Descriptions.Item>
                <Descriptions.Item label="操作员">{deliveryNote.operator}</Descriptions.Item>
              </Descriptions>
              <Table size="small" style={{ marginTop: 8 }} rowKey="skuCode" pagination={false} dataSource={deliveryNote.items}
                columns={[
                  { title: 'SKU', dataIndex: 'skuCode', width: 90, render: (c: string) => <span style={{ fontFamily: 'monospace', fontSize: 11 }}>{c}</span> },
                  { title: '应发', dataIndex: 'quantity', width: 40, align: 'center' },
                  { title: '实拣', dataIndex: 'pickedQty', width: 40, align: 'center', render: (v: number, _: any, i: number) => v < deliveryNote.items[i].quantity ? <span style={{ color: '#E11D48' }}>{v}</span> : <span style={{ color: '#16A34A' }}>{v}</span> },
                ]} />
            </Card>
          )}

          {/* 操作日志 */}
          <Card title="操作日志" size="small" style={{ marginBottom: 16 }}>
            <Timeline
              items={mockOperationLogs.slice(0, 6).map((log) => ({
                color: log.action.includes('异常') ? 'red' : log.action.includes('完成') || log.action.includes('签收') ? 'green' : '#FF6B00',
                children: (
                  <div>
                    <Text style={{ fontSize: 13 }}>{log.action}</Text>
                    <br />
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {log.operator}（{log.role}）
                    </Text>
                    <br />
                    <Text type="secondary" style={{ fontSize: 11 }}>
                      {log.time.replace('T', ' ').substring(0, 19)}
                    </Text>
                    {log.remark && (
                      <>
                        <br />
                        <Text type="secondary" italic style={{ fontSize: 11 }}>
                          {log.remark}
                        </Text>
                      </>
                    )}
                  </div>
                ),
              }))}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
}
