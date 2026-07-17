import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Table, Tag, Button, Space, Typography, Row, Col, Modal, Select, InputNumber, Switch, Alert, Divider, message, Descriptions, Collapse, DatePicker } from 'antd';
import { CarOutlined, LinkOutlined, ReloadOutlined, SettingOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { vehicleShippingPlans, mockOrders } from '../../data/mockData';

const { Title, Text } = Typography;
const { Panel } = Collapse;

export default function VehicleShipping() {
  const navigate = useNavigate();
  const [matchModal, setMatchModal] = useState<{ planNo: string; open: boolean } | null>(null);
  const [matchRule, setMatchRule] = useState({ autoMatch: true, sameDealer: true, timeWindow: 7, urgentPriority: true, allowManual: true });

  const columns: ColumnsType<typeof vehicleShippingPlans[number]> = [
    { title: '目的经销商', dataIndex: 'dealerName', width: 150 },
    { title: '整车车型', dataIndex: 'vehicleModel', width: 150 },
    { title: '车牌号', dataIndex: 'planNo', width: 120, render: (v: string) => <span style={{ fontFamily: 'monospace', fontWeight: 500 }}>{v.substring(0, 3)}·{v.substring(3, 8)}</span> },
    { title: '计划发车日', dataIndex: 'plannedShipDate', width: 110, sorter: (a, b) => a.plannedShipDate.localeCompare(b.plannedShipDate) },
    { title: '实际发车日', dataIndex: 'actualShipDate', width: 110, render: (v?: string) => v || <Text type="secondary">待定</Text> },
    { title: '路线', dataIndex: 'route', width: 120 },
    { title: '司机', dataIndex: 'driver', width: 80 },
    { title: '已匹配订单', dataIndex: 'matchedOrders', width: 150, render: (orders: string[]) => orders.length > 0 ? orders.map((o) => <Tag key={o} style={{ marginBottom: 4 }} color="purple"><a onClick={(e) => { e.stopPropagation(); navigate(`/orders/${o}`); }} style={{ color: '#7C3AED' }}>{o.substring(0, 16)}...</a></Tag>) : <Text type="secondary">未匹配</Text> },
    { title: '状态', dataIndex: 'status', width: 90, render: (s: string) => { const m: Record<string, { label: string; color: string }> = { PLANNED: { label: '已计划', color: '#0284C7' }, LOADING: { label: '装载中', color: '#FF6B00' }, IN_TRANSIT: { label: '运输中', color: '#7C3AED' }, ARRIVED: { label: '已到达', color: '#16A34A' } }; return <Tag color={m[s]?.color}>{m[s]?.label}</Tag>; } },
    { title: '操作', key: 'actions', width: 120, render: (_: unknown, r: typeof vehicleShippingPlans[number]) => (
      <Button size="small" type="primary" icon={<LinkOutlined />} onClick={(e) => { e.stopPropagation(); setMatchModal({ planNo: r.planNo, open: true }); }}>匹配订单</Button>
    )},
  ];

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <Title level={4} style={{ margin: 0 }}>整车发货计划</Title>
          <Text type="secondary" style={{ fontSize: 13 }}>数据来源于 TMS 系统，支持自动匹配配件订单 + 人工修改</Text>
        </div>
        <Button icon={<ReloadOutlined />} onClick={() => message.success('已刷新')}>刷新</Button>
      </div>

      {/* 匹配规则配置 */}
      <Card size="small" style={{ marginBottom: 16, background: '#FAFAFA' }}
        title={<Space><SettingOutlined /><Text strong style={{ fontSize: 14 }}>匹配规则配置</Text></Space>}>
        <Row gutter={[24, 12]}>
          <Col span={6}><div style={{ display: 'flex', justifyContent: 'space-between' }}><Text>自动匹配</Text><Switch size="small" checked={matchRule.autoMatch} onChange={(v) => setMatchRule((p) => ({ ...p, autoMatch: v }))} /></div></Col>
          <Col span={6}><div style={{ display: 'flex', justifyContent: 'space-between' }}><Text>同经销商优先匹配</Text><Switch size="small" checked={matchRule.sameDealer} onChange={(v) => setMatchRule((p) => ({ ...p, sameDealer: v }))} /></div></Col>
          <Col span={4}><Space><Text>匹配时间窗口:</Text><InputNumber size="small" min={1} max={30} value={matchRule.timeWindow} onChange={(v) => setMatchRule((p) => ({ ...p, timeWindow: v || 7 }))} /><Text>天</Text></Space></Col>
          <Col span={4}><div style={{ display: 'flex', justifyContent: 'space-between' }}><Text>紧急订单优先</Text><Switch size="small" checked={matchRule.urgentPriority} onChange={(v) => setMatchRule((p) => ({ ...p, urgentPriority: v }))} /></div></Col>
          <Col span={4}><div style={{ display: 'flex', justifyContent: 'space-between' }}><Text>允许人工修改</Text><Switch size="small" checked={matchRule.allowManual} onChange={(v) => setMatchRule((p) => ({ ...p, allowManual: v }))} /></div></Col>
        </Row>
        <Alert style={{ marginTop: 12 }} message={`当前策略：${matchRule.autoMatch ? '自动匹配' : '手动匹配'} → ${matchRule.sameDealer ? '同经销商优先' : '不限经销商'} → 发车前 ${matchRule.timeWindow} 天内的配件订单 → ${matchRule.urgentPriority ? '紧急订单优先' : '按时间顺序'}${matchRule.allowManual ? ' → 支持人工修改' : ''}`} type="info" showIcon />
      </Card>

      {/* 数据表格 */}
      <Card>
        <Table rowKey="planNo" columns={columns} dataSource={vehicleShippingPlans} scroll={{ x: 1600 }} size="middle"
          expandable={{
            expandedRowRender: (record) => (
              record.matchedOrders.length > 0 ? (
                <div style={{ padding: '8px 0' }}>
                  <Text strong style={{ marginBottom: 8, display: 'block' }}>已匹配配件订单详情：</Text>
                  <Table size="small" rowKey="orderNo" pagination={false}
                    dataSource={mockOrders.filter((o) => record.matchedOrders.includes(o.orderNo))}
                    columns={[
                      { title: '订单号', dataIndex: 'orderNo', width: 180, render: (v: string) => <a onClick={() => navigate(`/orders/${v}`)} style={{ fontFamily: 'monospace', color: '#FF6B00' }}>{v}</a> },
                      { title: 'SKU数', dataIndex: 'skuCount', width: 60, align: 'center' },
                      { title: '总金额', dataIndex: 'totalAmount', width: 100, align: 'right', render: (v: number) => <strong>¥{v.toLocaleString()}</strong> },
                      { title: '时效', dataIndex: 'urgencyLevel', width: 80, render: (v: string) => <Tag color={v === 'CRITICAL' ? '#E11D48' : v === 'URGENT' ? '#FF6B00' : '#8C8C8C'}>{v === 'CRITICAL' ? '特急' : v === 'URGENT' ? '紧急' : '普通'}</Tag> },
                      { title: '操作', key: 'act', width: 80, render: (_: any, r: any) => <Button size="small" danger onClick={() => message.success('已取消该订单匹配')}>移除</Button> },
                    ]} />
                </div>
              ) : <Text type="secondary">暂无匹配订单，剩余配额 {record.remainingCapacity} 件</Text>
            ),
          }}
          pagination={{ defaultPageSize: 20, showTotal: (t) => `共 ${t} 条计划` }} />
      </Card>

      {/* 匹配订单弹窗 */}
      <Modal title={`手动匹配订单到 ${matchModal?.planNo || ''}`} open={matchModal?.open || false} onCancel={() => setMatchModal(null)} onOk={() => { message.success('订单匹配成功'); setMatchModal(null); }} okText="确认匹配" cancelText="取消" width={640}>
        <Select showSearch style={{ width: '100%' }} placeholder="搜索并选择订单号进行匹配"
          options={mockOrders.filter((o) => ['READY_TO_SHIP', 'PICKING'].includes(o.status)).map((o) => ({ value: o.orderNo, label: `${o.orderNo} - ${o.dealerName} - ¥${o.totalAmount.toLocaleString()}` }))} />
      </Modal>
    </div>
  );
}
