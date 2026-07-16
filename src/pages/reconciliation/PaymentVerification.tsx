import { useState, useMemo } from 'react';
import { Card, Table, Tag, Button, Space, Typography, Row, Col, Select, Input, Switch, message, Statistic } from 'antd';
import { ReloadOutlined, CheckCircleOutlined, UndoOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { paymentRecords } from '../../data/mockData';

const { Title, Text } = Typography;

interface PaymentRow { paymentNo: string; dealerName: string; paymentAmount: number; verifiedAmount: number; remainAmount: number; paymentDate: string; bankRefNo: string; status: string; }

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  VERIFIED: { label: '已核销', color: '#16A34A' },
  PARTIAL: { label: '部分核销', color: '#F59E0B' },
  UNVERIFIED: { label: '未核销', color: '#E11D48' },
};

export default function PaymentVerification() {
  const [filters, setFilters] = useState({ dealerName: '', statuses: [] as string[], autoVerify: true });
  const filtered = useMemo(() => {
    let r = [...paymentRecords];
    if (filters.dealerName) r = r.filter((i) => i.dealerName.includes(filters.dealerName));
    if (filters.statuses.length > 0) r = r.filter((i) => filters.statuses.includes(i.status));
    return r;
  }, [filters]);

  const columns: ColumnsType<PaymentRow> = [
    { title: '回款编号', dataIndex: 'paymentNo', width: 130, render: (v: string) => <span style={{ fontFamily: 'monospace', fontSize: 12 }}>{v}</span> },
    { title: '经销商', dataIndex: 'dealerName', width: 140 },
    { title: '回款金额', dataIndex: 'paymentAmount', width: 110, align: 'right', sorter: (a, b) => a.paymentAmount - b.paymentAmount, render: (v: number) => <strong>¥{v.toLocaleString()}</strong> },
    { title: '已核销', dataIndex: 'verifiedAmount', width: 110, align: 'right', render: (v: number) => <span style={{ color: '#16A34A' }}>¥{v.toLocaleString()}</span> },
    { title: '待核销', dataIndex: 'remainAmount', width: 110, align: 'right', render: (v: number) => v > 0 ? <span style={{ color: '#E11D48', fontWeight: 500 }}>¥{v.toLocaleString()}</span> : <Text type="secondary">¥0</Text> },
    { title: '回款日期', dataIndex: 'paymentDate', width: 100 },
    { title: '银行流水号', dataIndex: 'bankRefNo', width: 150, render: (v: string) => <span style={{ fontFamily: 'monospace', fontSize: 12 }}>{v}</span> },
    { title: '状态', dataIndex: 'status', width: 90, render: (s: string) => { const i = STATUS_MAP[s]; return <Tag color={i?.color}>{i?.label}</Tag>; } },
    { title: '操作', key: 'actions', width: 150, render: (_: unknown, r: PaymentRow) => (
      <Space size="small">
        {r.status !== 'VERIFIED' && <Button size="small" type="primary" icon={<CheckCircleOutlined />} onClick={() => message.success(`回款 ${r.paymentNo} 核销成功`)}>核销</Button>}
        {r.status === 'VERIFIED' && <Button size="small" icon={<UndoOutlined />} onClick={() => message.success('核销已撤销')}>撤销</Button>}
      </Space>
    )},
  ];

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={4} style={{ margin: 0 }}>回款核销</Title>
        <Button icon={<ReloadOutlined />} onClick={() => setFilters({ dealerName: '', statuses: [], autoVerify: true })}>重置</Button>
      </div>
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col span={6}><Card size="small"><Statistic title="本月回款总额" value={paymentRecords.reduce((s, p) => s + p.paymentAmount, 0)} prefix="¥" /></Card></Col>
        <Col span={6}><Card size="small"><Statistic title="已核销金额" value={paymentRecords.reduce((s, p) => s + p.verifiedAmount, 0)} prefix="¥" valueStyle={{ color: '#16A34A' }} /></Card></Col>
        <Col span={6}><Card size="small"><Statistic title="待核销金额" value={paymentRecords.reduce((s, p) => s + p.remainAmount, 0)} prefix="¥" valueStyle={{ color: '#E11D48' }} /></Card></Col>
        <Col span={6}><Card size="small"><Statistic title="自动核销" value={filters.autoVerify ? '已开启' : '已关闭'} valueStyle={{ color: filters.autoVerify ? '#16A34A' : '#8C8C8C', fontSize: 18 }} suffix={<Switch size="small" checked={filters.autoVerify} onChange={(v) => setFilters((f) => ({ ...f, autoVerify: v }))} />} /></Card></Col>
      </Row>
      <Card size="small" style={{ marginBottom: 16 }}>
        <Row gutter={[16, 12]}>
          <Col span={6}><Select placeholder="经销商" style={{ width: '100%' }} showSearch value={filters.dealerName || undefined} onChange={(v) => setFilters((f) => ({ ...f, dealerName: v || '' }))} allowClear options={paymentRecords.map((p) => ({ value: p.dealerName, label: p.dealerName }))} /></Col>
          <Col span={6}><Select mode="multiple" placeholder="核销状态" style={{ width: '100%' }} value={filters.statuses} onChange={(v) => setFilters((f) => ({ ...f, statuses: v }))} options={Object.entries(STATUS_MAP).map(([k, v]) => ({ value: k, label: v.label }))} /></Col>
        </Row>
      </Card>
      <Card><Table rowKey="paymentNo" columns={columns} dataSource={filtered} scroll={{ x: 1100 }} size="middle" pagination={{ defaultPageSize: 20, showTotal: (t) => `共 ${t} 条` }} /></Card>
    </div>
  );
}
