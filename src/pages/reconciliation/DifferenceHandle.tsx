import { useState, useMemo } from 'react';
import { Card, Table, Tag, Button, Space, Typography, Row, Col, Select, message, Modal, Statistic } from 'antd';
import { ReloadOutlined, EditOutlined, CheckCircleOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { differenceList } from '../../data/mockData';

const { Title } = Typography;

interface DiffRow { diffNo: string; reconNo: string; orderNo: string; dealerName: string; diffReason: string; diffAmount: number; processStatus: string; handler: string; createTime: string; }

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  PENDING: { label: '待处理', color: '#E11D48' },
  ADJUSTED: { label: '已调整', color: '#16A34A' },
  SUPPLEMENT: { label: '已补录', color: '#0284C7' },
  WRITE_OFF: { label: '已冲销', color: '#7C3AED' },
  SUSPENDED: { label: '已挂起', color: '#F59E0B' },
};

const REASONS = ['价格错误', '漏单', '退货未扣', '重复计费', '其他'];

export default function DifferenceHandle() {
  const [filters, setFilters] = useState({ dealerName: '', reasons: [] as string[], statuses: [] as string[] });
  const filtered = useMemo(() => {
    let r = [...differenceList];
    if (filters.dealerName) r = r.filter((i) => i.dealerName.includes(filters.dealerName));
    if (filters.reasons.length > 0) r = r.filter((i) => filters.reasons.includes(i.diffReason));
    if (filters.statuses.length > 0) r = r.filter((i) => filters.statuses.includes(i.processStatus));
    return r;
  }, [filters]);

  const columns: ColumnsType<DiffRow> = [
    { title: '差异编号', dataIndex: 'diffNo', width: 110 },
    { title: '对账单号', dataIndex: 'reconNo', width: 150, render: (v: string) => <span style={{ fontFamily: 'monospace', fontSize: 12 }}>{v}</span> },
    { title: '订单号', dataIndex: 'orderNo', width: 170, render: (v: string) => <span style={{ fontFamily: 'monospace', fontSize: 12 }}>{v}</span> },
    { title: '经销商', dataIndex: 'dealerName', width: 140 },
    { title: '差异原因', dataIndex: 'diffReason', width: 90, render: (r: string) => <Tag>{r}</Tag> },
    { title: '差异金额', dataIndex: 'diffAmount', width: 100, align: 'right', render: (v: number) => <span style={{ color: '#E11D48', fontWeight: 500 }}>¥{v.toLocaleString()}</span> },
    { title: '处理状态', dataIndex: 'processStatus', width: 90, render: (s: string) => { const i = STATUS_MAP[s]; return <Tag color={i?.color}>{i?.label}</Tag>; } },
    { title: '处理人', dataIndex: 'handler', width: 80 },
    { title: '操作', key: 'actions', width: 180, render: (_: unknown, r: DiffRow) => (
      <Space size="small">
        {r.processStatus === 'PENDING' && (
          <>
            <Button size="small" type="primary" icon={<EditOutlined />} onClick={() => message.success('已标记为调整')}>调整</Button>
            <Button size="small" icon={<CheckCircleOutlined />} onClick={() => message.success('已冲销')}>冲销</Button>
          </>
        )}
        <Button size="small" onClick={() => Modal.info({ title: `差异详情 ${r.diffNo}`, content: `原因: ${r.diffReason}\n金额: ¥${r.diffAmount.toLocaleString()}\n状态: ${STATUS_MAP[r.processStatus]?.label}` })}>详情</Button>
      </Space>
    )},
  ];

  const totalDiff = differenceList.filter((d) => d.processStatus === 'PENDING').reduce((s, d) => s + d.diffAmount, 0);

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={4} style={{ margin: 0 }}>差异处理</Title>
        <Button icon={<ReloadOutlined />} onClick={() => setFilters({ dealerName: '', reasons: [], statuses: [] })}>重置</Button>
      </div>
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col span={6}><Card size="small"><Statistic title="待处理差异总额" value={totalDiff} prefix="¥" valueStyle={{ color: '#E11D48', fontSize: 20 }} /></Card></Col>
        <Col span={6}><Card size="small"><Statistic title="待处理笔数" value={differenceList.filter((d) => d.processStatus === 'PENDING').length} suffix="笔" /></Card></Col>
        <Col span={6}><Card size="small"><Statistic title="差异归因 TOP1" value="价格错误" /></Card></Col>
        <Col span={6}><Card size="small"><Statistic title="本月累计差异" value={differenceList.reduce((s, d) => s + d.diffAmount, 0)} prefix="¥" /></Card></Col>
      </Row>
      <Card size="small" style={{ marginBottom: 16 }}>
        <Row gutter={[16, 12]}>
          <Col span={6}><Select placeholder="经销商" style={{ width: '100%' }} value={filters.dealerName || undefined} onChange={(v) => setFilters((f) => ({ ...f, dealerName: v || '' }))} allowClear options={differenceList.map((d) => ({ value: d.dealerName, label: d.dealerName }))} /></Col>
          <Col span={6}><Select mode="multiple" placeholder="差异原因" style={{ width: '100%' }} value={filters.reasons} onChange={(v) => setFilters((f) => ({ ...f, reasons: v }))} options={REASONS.map((r) => ({ value: r, label: r }))} /></Col>
          <Col span={6}><Select mode="multiple" placeholder="处理状态" style={{ width: '100%' }} value={filters.statuses} onChange={(v) => setFilters((f) => ({ ...f, statuses: v }))} options={Object.entries(STATUS_MAP).map(([k, v]) => ({ value: k, label: v.label }))} /></Col>
        </Row>
      </Card>
      <Card><Table rowKey="diffNo" columns={columns} dataSource={filtered} scroll={{ x: 1100 }} size="middle" pagination={{ defaultPageSize: 20, showTotal: (t) => `共 ${t} 条` }} /></Card>
    </div>
  );
}
