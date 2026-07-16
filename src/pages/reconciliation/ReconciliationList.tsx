import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Table, Select, Button, Space, Tag, Typography, Row, Col, message, Modal } from 'antd';
import { ReloadOutlined, EyeOutlined, CheckCircleOutlined, ExclamationCircleOutlined, DownloadOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { reconciliationList } from '../../data/mockData';
import { RECON_STATUS_MAP } from '../../types';
import type { ReconciliationDTO, ReconStatus } from '../../types';

const { Title, Text } = Typography;

export default function ReconciliationList() {
  const navigate = useNavigate();
  const [filters, setFilters] = useState({ dealerName: '', statuses: [] as string[], period: '' });

  const filtered = useMemo(() => {
    let r = [...reconciliationList];
    if (filters.dealerName) r = r.filter((i) => i.dealerName.includes(filters.dealerName));
    if (filters.statuses.length > 0) r = r.filter((i) => filters.statuses.includes(i.reconStatus));
    if (filters.period) r = r.filter((i) => i.reconPeriod === filters.period);
    return r;
  }, [filters]);

  const columns: ColumnsType<ReconciliationDTO> = [
    { title: '对账单号', dataIndex: 'reconNo', width: 160, render: (v: string) => <span style={{ fontFamily: 'monospace', fontWeight: 500, color: '#FF6B00' }}>{v}</span> },
    { title: '经销商', dataIndex: 'dealerName', width: 140 },
    { title: '对账周期', dataIndex: 'reconPeriod', width: 90 },
    { title: '应收总额', dataIndex: 'receivableAmount', width: 110, align: 'right', sorter: (a, b) => a.receivableAmount - b.receivableAmount, render: (v: number) => <strong>¥{v.toLocaleString()}</strong> },
    { title: '实收总额', dataIndex: 'receivedAmount', width: 110, align: 'right', render: (v: number) => <span style={{ color: '#16A34A' }}>¥{v.toLocaleString()}</span> },
    { title: '差异金额', dataIndex: 'diffAmount', width: 110, align: 'right', render: (v: number) => v > 0 ? <span style={{ color: '#E11D48', fontWeight: 500 }}>¥{v.toLocaleString()}</span> : <Text type="secondary">¥0</Text> },
    { title: '对账状态', dataIndex: 'reconStatus', width: 90, render: (s: ReconStatus) => { const i = RECON_STATUS_MAP[s]; return <Tag color={i?.color}>{i?.label}</Tag>; } },
    { title: '生成时间', dataIndex: 'createTime', width: 160, render: (t: string) => t.replace('T', ' ').substring(0, 16) },
    { title: '操作', key: 'actions', width: 200, render: (_: unknown, r: ReconciliationDTO) => (
      <Space size="small">
        <Button size="small" icon={<EyeOutlined />} onClick={() => Modal.info({ title: `对账单 ${r.reconNo}`, content: <div><p>应收: ¥{r.receivableAmount.toLocaleString()}</p><p>实收: ¥{r.receivedAmount.toLocaleString()}</p><p>差异: ¥{r.diffAmount.toLocaleString()}（{r.diffOrderCount}笔）</p></div> })}>明细</Button>
        {r.reconStatus === 'PENDING_CONFIRM' && <Button size="small" type="primary" icon={<CheckCircleOutlined />} onClick={() => message.success('对账单已确认')}>确认</Button>}
        {r.diffAmount > 0 && r.reconStatus !== 'CLOSED' && <Button size="small" icon={<ExclamationCircleOutlined />} onClick={() => navigate('/reconciliation/differences')}>标记差异</Button>}
      </Space>
    )},
  ];

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={4} style={{ margin: 0 }}>对账单管理</Title>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={() => setFilters({ dealerName: '', statuses: [], period: '' })}>重置</Button>
          <Button type="primary" icon={<DownloadOutlined />} onClick={() => message.success('导出任务已创建')}>导出对账单</Button>
        </Space>
      </div>
      <Card size="small" style={{ marginBottom: 16 }}>
        <Row gutter={[16, 12]}>
          <Col span={6}><Select placeholder="经销商" style={{ width: '100%' }} showSearch value={filters.dealerName || undefined} onChange={(v) => setFilters((f) => ({ ...f, dealerName: v || '' }))} allowClear options={reconciliationList.map((r) => ({ value: r.dealerName, label: r.dealerName }))} /></Col>
          <Col span={6}><Select mode="multiple" placeholder="对账状态" style={{ width: '100%' }} value={filters.statuses} onChange={(v) => setFilters((f) => ({ ...f, statuses: v }))} options={Object.entries(RECON_STATUS_MAP).map(([k, v]) => ({ value: k, label: v.label }))} /></Col>
          <Col span={4}><Select placeholder="对账周期" style={{ width: '100%' }} value={filters.period || undefined} onChange={(v) => setFilters((f) => ({ ...f, period: v || '' }))} allowClear options={['2026-07', '2026-06', '2026-05'].map((p) => ({ value: p, label: p }))} /></Col>
        </Row>
      </Card>
      <Card><Table rowKey="reconNo" columns={columns} dataSource={filtered} scroll={{ x: 1100 }} size="middle" pagination={{ defaultPageSize: 20, showTotal: (t) => `共 ${t} 条` }} /></Card>
    </div>
  );
}
