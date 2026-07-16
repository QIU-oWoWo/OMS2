import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card, Table, Tag, Button, Space, Typography, Row, Col, Select, message, Modal, Drawer,
  Switch, Divider, Alert, Collapse, Steps,
} from 'antd';
import {
  ReloadOutlined, EyeOutlined, RedoOutlined, CloseCircleOutlined,
  SettingOutlined, CheckCircleOutlined, AuditOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Panel } = Collapse;

// ========== 模拟开票数据 ==========
const invoiceTypes = ['VAT_SPECIAL', 'VAT_NORMAL', 'E_INVOICE'] as const;
const invoiceStatuses = ['PENDING', 'ISSUING', 'ISSUED', 'CANCELLED', 'FAILED'] as const;
const triggerModes = ['AUTO', 'MANUAL'] as const;

const TYPE_MAP: Record<string, { label: string; color: string }> = {
  VAT_SPECIAL: { label: '增值税专票', color: '#E11D48' },
  VAT_NORMAL: { label: '增值税普票', color: '#0284C7' },
  E_INVOICE: { label: '电子发票', color: '#16A34A' },
};
const STATUS_MAP: Record<string, { label: string; color: string }> = {
  PENDING: { label: '待开具', color: '#8C8C8C' },
  ISSUING: { label: '开具中', color: '#FF6B00' },
  ISSUED: { label: '已开具', color: '#16A34A' },
  CANCELLED: { label: '已作废', color: '#E11D48' },
  FAILED: { label: '开具失败', color: '#E11D48' },
};

const mockInvoices = Array.from({ length: 8 }, (_, i) => ({
  invoiceNo: `INV202607${String(16 - i).padStart(2, '0')}${String(i + 1).padStart(4, '0')}`,
  orderNo: `OMS2026070${String(100 + i * 30).substring(0, 3)}${String(i + 1).padStart(4, '0')}`,
  dealerName: ['杭州雅迪旗舰店', '南京雅迪体验中心', '合肥雅迪专卖店', '郑州雅迪旗舰店'][i % 4],
  invoiceType: invoiceTypes[i % 3],
  invoiceAmount: Math.round([12580, 8900, 15600, 4200, 22800, 6800, 31000, 5200][i] * 100) / 100,
  invoiceStatus: invoiceStatuses[i % 5],
  triggerMode: triggerModes[i % 2],
  invoiceTime: new Date(2026, 6, 16 - i, 9 + i, 30).toISOString(),
}));

export default function InvoiceList() {
  const navigate = useNavigate();
  const [workflowOpen, setWorkflowOpen] = useState(false);
  const [filters, setFilters] = useState({ types: [] as string[], statuses: [] as string[], modes: [] as string[] });

  // 审批流配置
  const [workflow, setWorkflow] = useState({
    enabled: true,
    nodes: [
      { role: '运营专员', action: '初审', autoPass: false, autoRule: '金额 < ¥5,000' },
      { role: '运营主管', action: '复核', autoPass: false, autoRule: '金额 < ¥20,000' },
      { role: '财务经理', action: '终审', autoPass: true, autoRule: '金额 ≥ ¥20,000 时触发' },
    ],
    autoInvoiceDelay: 3,
    retryOnFail: true,
  });

  const filtered = useMemo(() => {
    let r = [...mockInvoices];
    if (filters.types.length > 0) r = r.filter((i) => filters.types.includes(i.invoiceType));
    if (filters.statuses.length > 0) r = r.filter((i) => filters.statuses.includes(i.invoiceStatus));
    if (filters.modes.length > 0) r = r.filter((i) => filters.modes.includes(i.triggerMode));
    return r;
  }, [filters]);

  const columns: ColumnsType<typeof mockInvoices[number]> = [
    { title: '开票单号', dataIndex: 'invoiceNo', width: 160, render: (v: string) => <span style={{ fontFamily: 'monospace', fontWeight: 500, color: '#FF6B00' }}>{v}</span> },
    { title: '关联订单号', dataIndex: 'orderNo', width: 180, render: (v: string) => <a onClick={(e) => { e.stopPropagation(); navigate(`/orders/${v}`); }} style={{ fontFamily: 'monospace', color: '#0284C7' }}>{v}</a> },
    { title: '经销商', dataIndex: 'dealerName', width: 140 },
    { title: '开票类型', dataIndex: 'invoiceType', width: 110, render: (t: string) => { const i = TYPE_MAP[t]; return <Tag color={i?.color}>{i?.label}</Tag>; } },
    { title: '开票金额', dataIndex: 'invoiceAmount', width: 110, align: 'right', sorter: (a, b) => a.invoiceAmount - b.invoiceAmount, render: (v: number) => <strong>¥{v.toLocaleString()}</strong> },
    { title: '开票状态', dataIndex: 'invoiceStatus', width: 90, render: (s: string) => { const i = STATUS_MAP[s]; return <Tag color={i?.color}>{i?.label}</Tag>; } },
    { title: '触发方式', dataIndex: 'triggerMode', width: 90, render: (m: string) => <Tag color={m === 'AUTO' ? '#16A34A' : '#FF6B00'}>{m === 'AUTO' ? '自动触发' : '手动补开'}</Tag> },
    { title: '开票时间', dataIndex: 'invoiceTime', width: 160, render: (t: string) => dayjs(t).format('YYYY-MM-DD HH:mm') },
    { title: '操作', key: 'actions', width: 150, render: (_: unknown, r: typeof mockInvoices[number]) => (
      <Space size="small">
        <Button size="small" icon={<EyeOutlined />}>查看</Button>
        {r.invoiceStatus === 'FAILED' && <Button size="small" type="primary" icon={<RedoOutlined />} onClick={() => message.success('已重新提交')}>重开</Button>}
        {r.invoiceStatus === 'ISSUED' && <Button size="small" danger icon={<CloseCircleOutlined />} onClick={() => Modal.confirm({ title: '确认作废', content: `确定作废开票单 ${r.invoiceNo}？`, okButtonProps: { danger: true }, onOk: () => message.success('已作废') })}>作废</Button>}
      </Space>
    )},
  ];

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={4} style={{ margin: 0 }}>开票管理</Title>
        <Space>
          <Button icon={<SettingOutlined />} onClick={() => setWorkflowOpen(true)}>审批流配置</Button>
          <Button icon={<ReloadOutlined />} onClick={() => setFilters({ types: [], statuses: [], modes: [] })}>重置</Button>
        </Space>
      </div>

      {/* 自动规则提示 */}
      <Alert message={<Space><CheckCircleOutlined style={{ color: '#16A34A' }} />系统自动规则：订单签收后 {workflow.autoInvoiceDelay} 天自动触发开票，异常开票需人工处理</Space>} type="info" showIcon={false} style={{ marginBottom: 16 }} />

      <Card size="small" style={{ marginBottom: 16 }}>
        <Row gutter={[16, 12]}>
          <Col span={6}><Select mode="multiple" placeholder="开票类型" style={{ width: '100%' }} value={filters.types} onChange={(v) => setFilters((f) => ({ ...f, types: v }))} options={Object.entries(TYPE_MAP).map(([k, v]) => ({ value: k, label: v.label }))} /></Col>
          <Col span={6}><Select mode="multiple" placeholder="开票状态" style={{ width: '100%' }} value={filters.statuses} onChange={(v) => setFilters((f) => ({ ...f, statuses: v }))} options={Object.entries(STATUS_MAP).map(([k, v]) => ({ value: k, label: v.label }))} /></Col>
          <Col span={6}><Select mode="multiple" placeholder="触发方式" style={{ width: '100%' }} value={filters.modes} onChange={(v) => setFilters((f) => ({ ...f, modes: v }))} options={[{ value: 'AUTO', label: '自动触发' }, { value: 'MANUAL', label: '手动补开' }]} /></Col>
        </Row>
      </Card>

      <Card>
        <Table rowKey="invoiceNo" columns={columns} dataSource={filtered} scroll={{ x: 1200 }} size="middle"
          pagination={{ defaultPageSize: 20, showTotal: (t) => `共 ${t} 条` }} />
      </Card>

      {/* 审批流程配置 Drawer */}
      <Drawer title={<Space><AuditOutlined />开票审批流程配置</Space>} open={workflowOpen} onClose={() => setWorkflowOpen(false)} width={520}
        extra={<Button type="primary" size="small" onClick={() => { message.success('审批流已保存'); setWorkflowOpen(false); }}>保存配置</Button>}>
        <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
          <Text strong>启用审批流</Text>
          <Switch checked={workflow.enabled} onChange={(v) => setWorkflow((p) => ({ ...p, enabled: v }))} />
        </div>
        <Divider style={{ margin: '12px 0' }} />

        <Text strong style={{ marginBottom: 12, display: 'block' }}>审批节点配置：</Text>
        <Steps direction="vertical" size="small" current={-1}
          items={workflow.nodes.map((node, i) => ({
            title: <Space><Tag color="#FF6B00">{node.role}</Tag><Text strong>{node.action}</Text></Space>,
            description: (
              <div style={{ marginTop: 4 }}>
                <div><Text type="secondary">自动通过规则：</Text><Tag>{node.autoRule}</Tag></div>
                <div style={{ marginTop: 4 }}><Switch size="small" checked={node.autoPass} onChange={(v) => { setWorkflow((p) => ({ ...p, nodes: p.nodes.map((n, idx) => idx === i ? { ...n, autoPass: v } : n) })); }} /> <Text type="secondary">自动通过</Text></div>
              </div>
            ),
          }))} />

        <Divider style={{ margin: '16px 0' }} />

        <Alert message={
          <div>
            <Text strong>当前审批流：</Text>
            {workflow.nodes.map((n) => n.role).join(' → ')}
            <br />
            <Text type="secondary" style={{ fontSize: 12 }}>
              签收后 {workflow.autoInvoiceDelay} 天自动触发 · 失败自动重试: {workflow.retryOnFail ? '开启' : '关闭'}
            </Text>
          </div>
        } type="info" showIcon />
      </Drawer>
    </div>
  );
}
