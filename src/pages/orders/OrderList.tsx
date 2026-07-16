import { useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Card, Tabs, Table, Input, Select, DatePicker, Button, Space, Tag, Badge,
  Switch, Tooltip, Row, Col, Typography, Dropdown, Checkbox, message, Modal,
  Drawer, InputNumber, Divider, List, Alert, Collapse,
} from 'antd';
import {
  SearchOutlined, DownloadOutlined, PrinterOutlined, FilterOutlined,
  ReloadOutlined, SettingOutlined, CheckCircleOutlined, ExclamationCircleOutlined,
  MoreOutlined, ThunderboltOutlined, AuditOutlined, PartitionOutlined,
  OrderedListOutlined, FileTextOutlined, PlusOutlined, DeleteOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { mockOrders, mockDeliveryNotes } from '../../data/mockData';
import {
  ORDER_STATUS_MAP, BIZ_TYPE_MAP, URGENCY_MAP, FULFILL_METHOD_MAP, ORDER_STATUS_STEPS,
} from '../../types';
import type { OrderDTO, OrderStatus } from '../../types';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { Panel } = Collapse;

const STATUS_TABS: { key: OrderStatus | 'ALL'; label: string }[] = [
  { key: 'ALL', label: '全部' }, { key: 'PENDING_REVIEW', label: '待审核' },
  { key: 'SCHEDULING', label: '排单中' }, { key: 'PICKING', label: '拣货中' },
  { key: 'READY_TO_SHIP', label: '待发货' }, { key: 'IN_TRANSIT', label: '运输中' },
  { key: 'DELIVERED', label: '已签收' }, { key: 'EXCEPTION', label: '异常' },
  { key: 'COMPLETED', label: '已完成' },
];

const ALL_COLUMNS = [
  { key: 'orderNo', title: '订单号', fixed: true }, { key: 'dealerName', title: '经销商' },
  { key: 'bizType', title: '业务流程' }, { key: 'urgencyLevel', title: '时效等级' },
  { key: 'fulfillMethod', title: '履约方式' }, { key: 'skuCount', title: 'SKU数量' },
  { key: 'totalAmount', title: '总金额' }, { key: 'createTime', title: '下单时间' },
  { key: 'status', title: '当前状态' }, { key: 'vinCode', title: 'VIN码' },
  { key: 'baseSource', title: '基地来源' }, { key: 'shortageFlag', title: '缺件' },
];

const CONFIG_CARDS = [
  { key: 'workflow', title: '自定义订单流程', desc: '状态节点顺序 + 启用/禁用', icon: <OrderedListOutlined />, color: '#7C3AED' },
  { key: 'auditRule', title: '审核规则', desc: '金额阈值/经销商免审/异常拦截', icon: <AuditOutlined />, color: '#16A34A' },
  { key: 'allocation', title: '分单策略', desc: '按基地负载/库存/距离分配', icon: <PartitionOutlined />, color: '#0284C7' },
  { key: 'dealerLimit', title: '经销商下单限制', desc: '月度/每日最大下单次数', icon: <SettingOutlined />, color: '#D97706' },
  { key: 'deliveryNote', title: '电子交货单', desc: '自动生成 + 关联订单', icon: <FileTextOutlined />, color: '#FF6B00' },
] as const;

type ConfigKey = typeof CONFIG_CARDS[number]['key'];

export default function OrderList() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialStatus = searchParams.get('status') as OrderStatus | null;
  const searchKeyword = searchParams.get('search') || '';

  const [activeTab, setActiveTab] = useState<OrderStatus | 'ALL'>(initialStatus || 'ALL');
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [showFilters, setShowFilters] = useState(true);
  const [visibleColumns, setVisibleColumns] = useState(ALL_COLUMNS.map((c) => c.key));
  const [activeDrawer, setActiveDrawer] = useState<ConfigKey | null>(null);
  const [filters, setFilters] = useState({
    orderNo: '', dealerName: '', dateRange: null as [dayjs.Dayjs, dayjs.Dayjs] | null,
    bizTypes: [] as string[], urgencyLevels: [] as string[], fulfillMethods: [] as string[],
    baseSource: '', vinCode: '', shortageOnly: false,
  });

  // ---- 各配置状态 ----
  const [workflow, setWorkflow] = useState({
    steps: ORDER_STATUS_STEPS.map((s) => ({ key: s as string, label: ORDER_STATUS_MAP[s], enabled: s !== 'COMPLETED' })),
    autoComplete: true,
  });

  const [auditRule, setAuditRule] = useState({
    autoAuditEnabled: true,
    amountThreshold: 5000,
    exemptDealerGrades: ['A级'] as string[],
    autoInterceptException: true,
    requireManagerApproval: true,
    managerThreshold: 20000,
  });

  const [allocation, setAllocation] = useState({
    strategy: 'LOAD_BALANCE' as 'LOAD_BALANCE' | 'NEAREST' | 'STOCK_FIRST',
    autoAllocate: true,
    allowManualOverride: true,
  });

  const [dealerLimits, setDealerLimits] = useState([
    { dealerId: 'DLR-001', dealerName: '杭州雅迪旗舰店', monthlyMax: 200, dailyMax: 50 },
    { dealerId: 'DLR-002', dealerName: '南京雅迪体验中心', monthlyMax: 180, dailyMax: 45 },
    { dealerId: 'DLR-003', dealerName: '合肥雅迪专卖店', monthlyMax: 150, dailyMax: 40 },
  ]);

  const filteredOrders = useMemo(() => {
    let result = [...mockOrders];
    // 全局搜索：支持订单号/VIN/手机号
    if (searchKeyword) {
      const kw = searchKeyword.toUpperCase();
      result = result.filter((o) =>
        o.orderNo.toUpperCase().includes(kw) ||
        o.vinCodes.some((v) => v.toUpperCase().includes(kw)) ||
        o.receiverPhone.includes(searchKeyword)
      );
    }
    if (activeTab !== 'ALL') result = result.filter((o) => o.status === activeTab);
    if (filters.orderNo) result = result.filter((o) => o.orderNo.includes(filters.orderNo.toUpperCase()) || o.orderNo.includes(filters.orderNo));
    if (filters.dealerName) result = result.filter((o) => o.dealerName.includes(filters.dealerName));
    if (filters.dateRange) { const [s, e] = filters.dateRange; result = result.filter((o) => dayjs(o.createTime).isAfter(s.startOf('day')) && dayjs(o.createTime).isBefore(e.endOf('day'))); }
    if (filters.bizTypes.length > 0) result = result.filter((o) => filters.bizTypes.includes(o.bizType));
    if (filters.urgencyLevels.length > 0) result = result.filter((o) => filters.urgencyLevels.includes(o.urgencyLevel));
    if (filters.fulfillMethods.length > 0) result = result.filter((o) => filters.fulfillMethods.includes(o.fulfillMethod));
    if (filters.baseSource) result = result.filter((o) => o.baseSource === filters.baseSource);
    if (filters.vinCode) result = result.filter((o) => o.vinCodes.some((v) => v.includes(filters.vinCode)));
    if (filters.shortageOnly) result = result.filter((o) => o.shortageFlag);
    return result;
  }, [activeTab, filters, searchKeyword]);

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { ALL: mockOrders.length };
    STATUS_TABS.forEach((t) => { if (t.key !== 'ALL') counts[t.key] = mockOrders.filter((o) => o.status === t.key).length; });
    return counts;
  }, []);

  const handleBatchAction = (action: string) => {
    if (selectedRowKeys.length === 0) { message.warning('请先选择订单'); return; }
    Modal.confirm({
      title: `确认${action}`,
      content: `确定要对选中的 ${selectedRowKeys.length} 个订单执行${action}操作吗？`,
      okText: '确认', cancelText: '取消',
      onOk: () => { message.success(`${action}操作已提交`); setSelectedRowKeys([]); },
    });
  };

  const handleExpedite = () => {
    if (selectedRowKeys.length === 0) { message.warning('请先选择需要加急的订单'); return; }
    Modal.confirm({
      title: '一键加急', icon: <ThunderboltOutlined style={{ color: '#FF6B00' }} />,
      content: `将对选中的 ${selectedRowKeys.length} 个订单标记为「特急」等级，优先处理。`,
      okText: '确认加急', cancelText: '取消',
      onOk: () => { message.success(`${selectedRowKeys.length} 个订单已加急，时效等级更新为特急`); setSelectedRowKeys([]); },
    });
  };

  const columns: ColumnsType<OrderDTO> = useMemo(() => {
    const all: ColumnsType<OrderDTO> = [
      { title: '订单号', dataIndex: 'orderNo', key: 'orderNo', fixed: 'left' as const, width: 180, sorter: (a, b) => a.orderNo.localeCompare(b.orderNo), render: (no: string) => (<a onClick={(e) => { e.stopPropagation(); navigate(`/orders/${no}`); }} style={{ color: '#FF6B00', fontWeight: 500 }}>{no}</a>) },
      { title: '经销商', dataIndex: 'dealerName', key: 'dealerName', width: 160, sorter: (a, b) => a.dealerName.localeCompare(b.dealerName) },
      { title: '业务流程', dataIndex: 'bizType', key: 'bizType', width: 90, render: (type: string) => { const colors: Record<string, string> = { REGULAR: '#16A34A', APPOINTMENT: '#0284C7', CUSTOM: '#7C3AED', REQUISITION: '#8C8C8C' }; return <Tag color={colors[type]}>{BIZ_TYPE_MAP[type as keyof typeof BIZ_TYPE_MAP]}</Tag>; } },
      { title: '时效等级', dataIndex: 'urgencyLevel', key: 'urgencyLevel', width: 90, render: (level: string) => { const info = URGENCY_MAP[level as keyof typeof URGENCY_MAP]; return <Tag color={info?.color}>{info?.label}</Tag>; } },
      { title: '履约方式', dataIndex: 'fulfillMethod', key: 'fulfillMethod', width: 90, render: (m: string) => FULFILL_METHOD_MAP[m as keyof typeof FULFILL_METHOD_MAP] },
      { title: 'SKU数量', dataIndex: 'skuCount', key: 'skuCount', width: 90, align: 'center' as const, sorter: (a, b) => a.skuCount - b.skuCount },
      { title: '总金额', dataIndex: 'totalAmount', key: 'totalAmount', width: 120, align: 'right' as const, sorter: (a, b) => a.totalAmount - b.totalAmount, render: (amount: number) => (<span style={{ fontWeight: 500 }}>¥{amount.toLocaleString()}</span>) },
      { title: '下单时间', dataIndex: 'createTime', key: 'createTime', width: 160, sorter: (a, b) => a.createTime.localeCompare(b.createTime), render: (t: string) => t.replace('T', ' ').substring(0, 16) },
      { title: '当前状态', dataIndex: 'status', key: 'status', width: 100, render: (s: OrderStatus) => (<Tag color={s === 'EXCEPTION' ? '#E11D48' : s === 'COMPLETED' ? '#16A34A' : '#FF6B00'}>{ORDER_STATUS_MAP[s]}</Tag>) },
      { title: 'VIN码', key: 'vinCode', width: 170, render: (_: unknown, record: OrderDTO) => (<Tooltip title={record.vinCodes.join(', ')}><span style={{ fontFamily: 'monospace', fontSize: 12 }}>{record.vinCodes[0]}{record.vinCodes.length > 1 ? <Tag style={{ marginLeft: 4, fontSize: 10 }}>+{record.vinCodes.length - 1}</Tag> : null}</span></Tooltip>) },
      { title: '基地来源', dataIndex: 'baseSource', key: 'baseSource', width: 100 },
      { title: '缺件', dataIndex: 'shortageFlag', key: 'shortageFlag', width: 60, align: 'center' as const, render: (flag: boolean) => flag ? <Tooltip title="有缺件"><ExclamationCircleOutlined style={{ color: '#E11D48', fontSize: 16 }} /></Tooltip> : null },
      { title: '操作', key: 'actions', fixed: 'right' as const, width: 120, render: (_: unknown, record: OrderDTO) => (<Space size="small"><a onClick={(e) => { e.stopPropagation(); navigate(`/orders/${record.orderNo}`); }} style={{ color: '#FF6B00' }}>查看</a><Dropdown menu={{ items: [{ key: 'audit', label: '审核', icon: <CheckCircleOutlined /> }, { key: 'schedule', label: '排单', icon: <CheckCircleOutlined /> }, { key: 'export', label: '导出', icon: <DownloadOutlined /> }, { key: 'print', label: '打印', icon: <PrinterOutlined /> }, { key: 'expedite', label: '加急', icon: <ThunderboltOutlined /> }] }} trigger={['click']}><a onClick={(e) => e.stopPropagation()}><MoreOutlined /></a></Dropdown></Space>) },
    ];
    return all.filter((col) => visibleColumns.includes(col.key as string));
  }, [navigate, visibleColumns]);

  const renderDrawerContent = () => {
    switch (activeDrawer) {
      case 'workflow':
        return (
          <div>
            <div style={{ marginBottom: 16 }}><Text strong>调整订单状态流程节点（启用/禁用）：</Text></div>
            <List size="small" dataSource={workflow.steps} renderItem={(step, idx) => (
              <List.Item actions={[<Switch key="en" size="small" checked={step.enabled} onChange={(v) => { setWorkflow((p) => ({ ...p, steps: p.steps.map((s, i) => i === idx ? { ...s, enabled: v } : s) })); }} />]}>
                <Space><Tag color="#FF6B00">{idx + 1}</Tag><Text delete={!step.enabled}>{step.label}</Text></Space>
              </List.Item>
            )} />
            <Divider /><div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><Text strong>订单完成后自动归档</Text><Switch checked={workflow.autoComplete} onChange={(v) => setWorkflow((p) => ({ ...p, autoComplete: v }))} /></div>
            <Alert style={{ marginTop: 16 }} message="禁用某节点后，订单将跳过该状态直接流转到下一启用节点" type="info" showIcon />
          </div>
        );
      case 'auditRule':
        return (
          <div>
            <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}><Text strong>启用自动审核</Text><Switch checked={auditRule.autoAuditEnabled} onChange={(v) => setAuditRule((p) => ({ ...p, autoAuditEnabled: v }))} /></div>
            <Divider style={{ margin: '12px 0' }} />
            <div style={{ marginBottom: 16 }}><Text>订单金额低于</Text><InputNumber min={0} style={{ width: 100, margin: '0 8px' }} value={auditRule.amountThreshold} onChange={(v) => setAuditRule((p) => ({ ...p, amountThreshold: v || 5000 }))} prefix="¥" /><Text>时自动审核通过</Text></div>
            <div style={{ marginBottom: 8 }}><Text strong>免审经销商等级：</Text></div>
            <Select mode="multiple" style={{ width: '100%' }} value={auditRule.exemptDealerGrades} onChange={(v) => setAuditRule((p) => ({ ...p, exemptDealerGrades: v }))} options={['A级', 'B级', 'C级', 'D级'].map((g) => ({ value: g, label: g }))} />
            <Divider />
            <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}><Text strong>异常订单自动拦截</Text><Switch checked={auditRule.autoInterceptException} onChange={(v) => setAuditRule((p) => ({ ...p, autoInterceptException: v }))} /></div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><Space><Text strong>大额订单需主管审批</Text><Text type="secondary">（金额超过¥{(auditRule.managerThreshold || 0).toLocaleString()}）</Text></Space><Switch checked={auditRule.requireManagerApproval} onChange={(v) => setAuditRule((p) => ({ ...p, requireManagerApproval: v }))} /></div>
            {auditRule.requireManagerApproval && <div style={{ marginTop: 12 }}><Text>审批阈值</Text><InputNumber min={0} style={{ width: 120, marginLeft: 8 }} value={auditRule.managerThreshold} onChange={(v) => setAuditRule((p) => ({ ...p, managerThreshold: v || 20000 }))} prefix="¥" /></div>}
          </div>
        );
      case 'allocation':
        return (
          <div>
            <div style={{ marginBottom: 16 }}><Text strong>分单策略选择：</Text></div>
            <Select style={{ width: '100%' }} value={allocation.strategy} onChange={(v) => setAllocation((p) => ({ ...p, strategy: v }))} options={[
              { value: 'LOAD_BALANCE', label: '按基地负载均衡分配' }, { value: 'NEAREST', label: '按距离最近仓库分配' }, { value: 'STOCK_FIRST', label: '按库存充足优先分配' },
            ]} />
            <Divider />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}><Text strong>自动分单</Text><Switch checked={allocation.autoAllocate} onChange={(v) => setAllocation((p) => ({ ...p, autoAllocate: v }))} /></div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><Text strong>允许人工覆盖分单结果</Text><Switch checked={allocation.allowManualOverride} onChange={(v) => setAllocation((p) => ({ ...p, allowManualOverride: v }))} /></div>
            <Alert style={{ marginTop: 16 }} message={`当前策略：${allocation.strategy === 'LOAD_BALANCE' ? '按基地负载均衡' : allocation.strategy === 'NEAREST' ? '按距离最近' : '按库存充足优先'}，${allocation.autoAllocate ? '自动执行' : '手动触发'}`} type="info" showIcon />
          </div>
        );
      case 'dealerLimit':
        return (
          <div>
            <div style={{ marginBottom: 8 }}><Text strong>特殊经销商下单次数限制配置：</Text></div>
            <Table size="small" rowKey="dealerId" pagination={false} dataSource={dealerLimits} columns={[
              { title: '经销商', dataIndex: 'dealerName', width: 140 },
              { title: '月度上限', dataIndex: 'monthlyMax', width: 80, render: (v: number, _: any, i: number) => <InputNumber size="small" min={0} value={v} onChange={(val) => { setDealerLimits((p) => p.map((d, idx) => idx === i ? { ...d, monthlyMax: val || 0 } : d)); }} /> },
              { title: '每日上限', dataIndex: 'dailyMax', width: 80, render: (v: number, _: any, i: number) => <InputNumber size="small" min={0} value={v} onChange={(val) => { setDealerLimits((p) => p.map((d, idx) => idx === i ? { ...d, dailyMax: val || 0 } : d)); }} /> },
              { title: '操作', width: 60, render: (_: any, __: any, i: number) => <Button size="small" danger icon={<DeleteOutlined />} onClick={() => setDealerLimits((p) => p.filter((_, idx) => idx !== i))} /> },
            ]} />
            <Button type="dashed" size="small" icon={<PlusOutlined />} block style={{ marginTop: 8 }} onClick={() => setDealerLimits((p) => [...p, { dealerId: `DLR-${String(p.length + 100).padStart(3, '0')}`, dealerName: '新经销商', monthlyMax: 100, dailyMax: 30 }])}>添加经销商限制</Button>
          </div>
        );
      case 'deliveryNote':
        return (
          <div>
            <div style={{ marginBottom: 16 }}><Text strong>电子交货单自动生成条件：</Text></div>
            <Collapse ghost size="small" items={[
              { key: 'condition', label: '自动生成条件', children: <ul style={{ paddingLeft: 16, fontSize: 13, color: '#595959' }}><li>订单状态达到「待发货」时自动生成</li><li>所有SKU拣货完毕（短缺数=0）</li><li>仓库管理员确认出库</li></ul> },
              { key: 'list', label: `最近交货单 (${mockDeliveryNotes.length} 条)`, children: (
                <List size="small" dataSource={mockDeliveryNotes.slice(0, 5)} renderItem={(dn) => (
                  <List.Item actions={[<a key="view" style={{ color: '#FF6B00' }} onClick={() => navigate(`/orders/${dn.orderNo}`)}>查看订单</a>]}>
                    <List.Item.Meta title={<span style={{ fontFamily: 'monospace', fontSize: 12 }}>{dn.noteNo}</span>} description={`订单 ${dn.orderNo} · ${dn.totalQty}件 · ${dn.warehouseName}`} />
                  </List.Item>
                )} />
              ) },
            ]} />
          </div>
        );
      default: return null;
    }
  };

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={4} style={{ margin: 0 }}>订单管理</Title>
        <Button icon={<ReloadOutlined />} onClick={() => setFilters({ orderNo: '', dealerName: '', dateRange: null, bizTypes: [], urgencyLevels: [], fulfillMethods: [], baseSource: '', vinCode: '', shortageOnly: false })}>重置</Button>
      </div>

      {/* ========== 订单配置入口 ========== */}
      <Card size="small" style={{ marginBottom: 16, background: '#FAFAFA' }}
        title={<Space><SettingOutlined /><Text strong style={{ fontSize: 14 }}>订单配置</Text></Space>}>
        <Row gutter={[12, 12]}>
          {CONFIG_CARDS.map((card) => (
            <Col xs={24} sm={12} md={Math.floor(24 / 5)} key={card.key}>
              <div onClick={() => setActiveDrawer(card.key)} style={{ cursor: 'pointer', padding: '14px 16px', borderRadius: 8, background: '#FFFFFF', border: '1px solid #F0F0F0', transition: 'all 0.2s', height: '100%' }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = card.color; e.currentTarget.style.boxShadow = `0 2px 8px ${card.color}20`; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#F0F0F0'; e.currentTarget.style.boxShadow = 'none'; }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 20, color: card.color }}>{card.icon}</span>
                  <div><Text strong style={{ fontSize: 13 }}>{card.title}</Text><br /><Text type="secondary" style={{ fontSize: 11 }}>{card.desc}</Text></div>
                </div>
              </div>
            </Col>
          ))}
        </Row>
      </Card>

      {/* 配置 Drawer */}
      <Drawer title={<Space>{CONFIG_CARDS.find((c) => c.key === activeDrawer)?.icon}<span>{CONFIG_CARDS.find((c) => c.key === activeDrawer)?.title}</span></Space>}
        open={activeDrawer !== null} onClose={() => setActiveDrawer(null)} width={480}
        extra={<Button type="primary" size="small" onClick={() => { message.success('配置已保存'); setActiveDrawer(null); }}>保存配置</Button>}>
        {renderDrawerContent()}
      </Drawer>

      {/* 状态 Tab */}
      <Card style={{ marginBottom: 16 }}>
        <Tabs activeKey={activeTab} onChange={(key) => { setActiveTab(key as OrderStatus | 'ALL'); setSelectedRowKeys([]); }}
          tabBarExtraContent={
            <Dropdown menu={{ items: ALL_COLUMNS.map((col) => ({ key: col.key, label: <Checkbox checked={visibleColumns.includes(col.key)} disabled={col.fixed}>{col.title}</Checkbox>, onClick: () => setVisibleColumns((p) => p.includes(col.key) ? p.filter((k) => k !== col.key) : [...p, col.key]) })) }} trigger={['click']}>
              <Button icon={<SettingOutlined />} size="small">列设置</Button>
            </Dropdown>}
          items={STATUS_TABS.map((tab) => ({ key: tab.key, label: (<Badge count={statusCounts[tab.key] || 0} overflowCount={999} color={tab.key === 'EXCEPTION' ? '#E11D48' : tab.key === 'ALL' ? '#FF6B00' : '#8C8C8C'} size="small"><span style={{ paddingRight: tab.key === 'ALL' ? 0 : 4 }}>{tab.label}</span></Badge>) }))} />
      </Card>

      {/* 筛选 */}
      {showFilters && (
        <Card size="small" style={{ marginBottom: 16 }}>
          <Row gutter={[16, 12]}>
            <Col span={4}><Input placeholder="订单号搜索" prefix={<SearchOutlined />} value={filters.orderNo} onChange={(e) => setFilters((f) => ({ ...f, orderNo: e.target.value }))} allowClear /></Col>
            <Col span={4}><Input placeholder="经销商搜索" value={filters.dealerName} onChange={(e) => setFilters((f) => ({ ...f, dealerName: e.target.value }))} allowClear /></Col>
            <Col span={5}><RangePicker style={{ width: '100%' }} placeholder={['开始日期', '结束日期']} value={filters.dateRange} onChange={(dates) => setFilters((f) => ({ ...f, dateRange: dates as [dayjs.Dayjs, dayjs.Dayjs] | null }))} /></Col>
            <Col span={4}><Select mode="multiple" placeholder="业务流程" style={{ width: '100%' }} value={filters.bizTypes} onChange={(vals) => setFilters((f) => ({ ...f, bizTypes: vals }))} options={Object.entries(BIZ_TYPE_MAP).map(([k, v]) => ({ value: k, label: v }))} maxTagCount={1} /></Col>
            <Col span={3}><Select mode="multiple" placeholder="时效等级" style={{ width: '100%' }} value={filters.urgencyLevels} onChange={(vals) => setFilters((f) => ({ ...f, urgencyLevels: vals }))} options={[{ value: 'CRITICAL', label: '特急' }, { value: 'URGENT', label: '紧急' }, { value: 'NORMAL', label: '普通' }]} maxTagCount={1} /></Col>
            <Col span={2}><Space><span style={{ fontSize: 13, color: '#595959' }}>仅缺件</span><Switch size="small" checked={filters.shortageOnly} onChange={(v) => setFilters((f) => ({ ...f, shortageOnly: v }))} /></Space></Col>
            <Col span={2}><Button onClick={() => setShowFilters(false)} icon={<FilterOutlined />}>收起</Button></Col>
          </Row>
        </Card>
      )}
      {!showFilters && <div style={{ marginBottom: 16 }}><Button onClick={() => setShowFilters(true)} icon={<FilterOutlined />}>展开筛选</Button></div>}

      {/* 批量操作 */}
      {selectedRowKeys.length > 0 && (
        <Card size="small" style={{ marginBottom: 16, background: '#FFF3E8', border: '1px solid #FFD6A5' }}>
          <Space wrap>
            <span>已选择 <span style={{ color: '#FF6B00', fontWeight: 500 }}>{selectedRowKeys.length}</span> 条订单</span>
            {activeTab === 'PENDING_REVIEW' && <Button size="small" type="primary" icon={<CheckCircleOutlined />} onClick={() => handleBatchAction('批量审核')}>批量审核</Button>}
            {activeTab === 'SCHEDULING' && <Button size="small" type="primary" onClick={() => handleBatchAction('批量排单')}>批量排单</Button>}
            {activeTab === 'READY_TO_SHIP' && <Button size="small" icon={<PrinterOutlined />} onClick={() => handleBatchAction('打印发货单')}>打印发货单</Button>}
            <Button size="small" icon={<ThunderboltOutlined />} onClick={handleExpedite} style={{ background: '#E11D48', color: '#FFFFFF', borderColor: '#E11D48' }}>一键加急</Button>
            <Button size="small" icon={<DownloadOutlined />} onClick={() => handleBatchAction('导出Excel')}>导出 Excel</Button>
            <a onClick={() => setSelectedRowKeys([])} style={{ color: '#8C8C8C' }}>取消选择</a>
          </Space>
        </Card>
      )}

      {/* 数据表格 */}
      <Card>
        <Table rowKey="orderNo" columns={columns} dataSource={filteredOrders}
          rowSelection={{ selectedRowKeys, onChange: setSelectedRowKeys }}
          scroll={{ x: 1400 }} size="middle"
          pagination={{ defaultPageSize: 20, showSizeChanger: true, pageSizeOptions: ['10', '20', '50', '100'], showTotal: (total, range) => `共 ${total} 条，${range[0]}-${range[1]}` }}
          onRow={(record) => ({ onClick: () => navigate(`/orders/${record.orderNo}`) })} />
      </Card>
    </div>
  );
}
