import { useState, useMemo } from 'react';
import { Card, Table, Select, DatePicker, Button, Space, Typography, Row, Col, message } from 'antd';
import { DownloadOutlined, ReloadOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { completionRateData } from '../../data/mockData';

const { Title } = Typography;
const { RangePicker } = DatePicker;

interface CompletionRow { base: string; totalOrders: number; achievedOrders: number; rate: number; overtimeOrders: number; avgOvertimeHours: number; }

export default function AnalyticsCompletionRate() {
  const [filters, setFilters] = useState({ dateRange: null as [dayjs.Dayjs, dayjs.Dayjs] | null, bases: [] as string[], bizTypes: [] as string[], urgency: [] as string[] });

  const columns: ColumnsType<CompletionRow> = [
    { title: '基地', dataIndex: 'base', key: 'base', width: 120 },
    { title: '总单量', dataIndex: 'totalOrders', key: 'totalOrders', width: 90, align: 'center', sorter: (a, b) => a.totalOrders - b.totalOrders },
    { title: '达成单量', dataIndex: 'achievedOrders', key: 'achievedOrders', width: 90, align: 'center' },
    { title: '达成率', dataIndex: 'rate', key: 'rate', width: 90, align: 'center', sorter: (a, b) => a.rate - b.rate, render: (v: number) => <span style={{ color: v > 95 ? '#16A34A' : v > 90 ? '#F59E0B' : '#E11D48', fontWeight: 500 }}>{v}%</span> },
    { title: '超时单量', dataIndex: 'overtimeOrders', key: 'overtimeOrders', width: 90, align: 'center', render: (v: number) => v > 0 ? <span style={{ color: '#E11D48' }}>{v}</span> : '-' },
    { title: '平均超时时长(h)', dataIndex: 'avgOvertimeHours', key: 'avgOvertimeHours', width: 130, align: 'center' },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={4} style={{ margin: 0 }}>达成率报表</Title>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={() => setFilters({ dateRange: null, bases: [], bizTypes: [], urgency: [] })}>重置</Button>
          <Button type="primary" icon={<DownloadOutlined />} onClick={() => message.success('导出任务已创建，请前往导出中心下载')}>导出 Excel</Button>
        </Space>
      </div>
      <Card size="small" style={{ marginBottom: 16 }}>
        <Row gutter={[16, 12]}>
          <Col span={5}><RangePicker style={{ width: '100%' }} placeholder={['开始日期', '结束日期']} value={filters.dateRange} onChange={(d) => setFilters((f) => ({ ...f, dateRange: d as [dayjs.Dayjs, dayjs.Dayjs] | null }))} /></Col>
          <Col span={4}><Select mode="multiple" placeholder="基地" style={{ width: '100%' }} value={filters.bases} onChange={(v) => setFilters((f) => ({ ...f, bases: v }))} options={['华东基地', '华南基地', '华北基地', '西南基地'].map((b) => ({ value: b, label: b }))} /></Col>
          <Col span={4}><Select mode="multiple" placeholder="业务流程" style={{ width: '100%' }} value={filters.bizTypes} onChange={(v) => setFilters((f) => ({ ...f, bizTypes: v }))} options={['常规', '预约', '定制', '400', '领用'].map((b) => ({ value: b, label: b }))} /></Col>
          <Col span={4}><Select mode="multiple" placeholder="时效等级" style={{ width: '100%' }} value={filters.urgency} onChange={(v) => setFilters((f) => ({ ...f, urgency: v }))} options={['普通', '紧急', '特急'].map((u) => ({ value: u, label: u }))} /></Col>
        </Row>
      </Card>
      <Card>
        <Table rowKey="base" columns={columns} dataSource={completionRateData} size="middle"
          pagination={false}
          summary={() => {
            const t = completionRateData.reduce((s, r) => ({ totalOrders: s.totalOrders + r.totalOrders, achievedOrders: s.achievedOrders + r.achievedOrders, overtimeOrders: s.overtimeOrders + r.overtimeOrders, avgOvertimeHours: s.avgOvertimeHours + r.avgOvertimeHours }), { totalOrders: 0, achievedOrders: 0, overtimeOrders: 0, avgOvertimeHours: 0 });
            return (<Table.Summary.Row><Table.Summary.Cell index={0}><strong>合计</strong></Table.Summary.Cell><Table.Summary.Cell index={1} align="center"><strong>{t.totalOrders}</strong></Table.Summary.Cell><Table.Summary.Cell index={2} align="center"><strong>{t.achievedOrders}</strong></Table.Summary.Cell><Table.Summary.Cell index={3} align="center"><strong>{(t.achievedOrders / t.totalOrders * 100).toFixed(1)}%</strong></Table.Summary.Cell><Table.Summary.Cell index={4} align="center"><strong>{t.overtimeOrders}</strong></Table.Summary.Cell><Table.Summary.Cell index={5} align="center"><strong>{(t.avgOvertimeHours / completionRateData.length).toFixed(1)}</strong></Table.Summary.Cell></Table.Summary.Row>);
          }} />
      </Card>
    </div>
  );
}
