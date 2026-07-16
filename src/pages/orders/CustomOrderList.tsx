import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card, Table, Input, Select, DatePicker, Button, Space, Tag, Typography, Row, Col, Modal, message,
} from 'antd';
import { SearchOutlined, ReloadOutlined, EyeOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { mockCustomOrders } from '../../data/mockData';
import { CUSTOM_TYPE_MAP, CUSTOM_APPROVAL_MAP } from '../../types';
import type { CustomOrderDTO, CustomType, CustomApprovalStatus } from '../../types';

const { Title } = Typography;
const { RangePicker } = DatePicker;

export default function CustomOrderList() {
  const navigate = useNavigate();
  const [filters, setFilters] = useState({
    customNo: '', dealerName: '', customTypes: [] as string[],
    approvalStatuses: [] as string[], dateRange: null as [dayjs.Dayjs, dayjs.Dayjs] | null,
  });

  const filtered = useMemo(() => {
    let result = [...mockCustomOrders];
    if (filters.customNo) result = result.filter((o) => o.customNo.includes(filters.customNo));
    if (filters.dealerName) result = result.filter((o) => o.dealerName.includes(filters.dealerName));
    if (filters.customTypes.length > 0) result = result.filter((o) => filters.customTypes.includes(o.customType));
    if (filters.approvalStatuses.length > 0) result = result.filter((o) => filters.approvalStatuses.includes(o.approvalStatus));
    if (filters.dateRange) {
      const [s, e] = filters.dateRange;
      result = result.filter((o) => dayjs(o.createTime).isAfter(s.startOf('day')) && dayjs(o.createTime).isBefore(e.endOf('day')));
    }
    return result;
  }, [filters]);

  const columns: ColumnsType<CustomOrderDTO> = [
    { title: '定制单号', dataIndex: 'customNo', key: 'customNo', width: 180, render: (no: string) => (<a onClick={(e) => { e.stopPropagation(); navigate(`/orders/custom/${no}`); }} style={{ color: '#FF6B00', fontWeight: 500 }}>{no}</a>) },
    { title: '关联订单号', dataIndex: 'orderNo', key: 'orderNo', width: 180, render: (no: string) => (<a onClick={(e) => { e.stopPropagation(); navigate(`/orders/${no}`); }} style={{ color: '#0284C7' }}>{no}</a>) },
    { title: '经销商', dataIndex: 'dealerName', key: 'dealerName', width: 150 },
    { title: '定制类型', dataIndex: 'customType', key: 'customType', width: 100, render: (t: CustomType) => { const info = CUSTOM_TYPE_MAP[t]; return <Tag color={info?.color}>{info?.label}</Tag>; } },
    { title: '定制规格摘要', dataIndex: 'specDescription', key: 'specDescription', width: 220, ellipsis: true },
    { title: '预计完工日期', dataIndex: 'expectFinishDate', key: 'expectFinishDate', width: 120, sorter: (a, b) => a.expectFinishDate.localeCompare(b.expectFinishDate) },
    { title: '审批状态', dataIndex: 'approvalStatus', key: 'approvalStatus', width: 110, render: (s: CustomApprovalStatus) => { const info = CUSTOM_APPROVAL_MAP[s]; return <Tag color={info?.color}>{info?.label}</Tag>; } },
    { title: '报价金额', dataIndex: 'quoteAmount', key: 'quoteAmount', width: 110, align: 'right', sorter: (a, b) => a.quoteAmount - b.quoteAmount, render: (v: number) => <span style={{ fontWeight: 500 }}>¥{v.toLocaleString()}</span> },
    { title: '创建时间', dataIndex: 'createTime', key: 'createTime', width: 160, sorter: (a, b) => a.createTime.localeCompare(b.createTime), render: (t: string) => t.replace('T', ' ').substring(0, 16) },
    { title: '操作', key: 'actions', fixed: 'right' as const, width: 160, render: (_: unknown, record: CustomOrderDTO) => (
      <Space size="small">
        <Button size="small" type="primary" icon={<EyeOutlined />} onClick={(e) => { e.stopPropagation(); navigate(`/orders/custom/${record.customNo}`); }}>查看</Button>
        {record.approvalStatus === 'DRAFT' && <Button size="small" icon={<CheckCircleOutlined />} onClick={(e) => { e.stopPropagation(); message.success('已提交技术评审'); }}>提交评审</Button>}
        {record.approvalStatus === 'QUOTE_PENDING' && <Button size="small" onClick={(e) => { e.stopPropagation(); Modal.confirm({ title: '确认报价', content: `确认接受 ¥${record.quoteAmount.toLocaleString()}？`, onOk: () => message.success('报价已确认') }); }}>确认报价</Button>}
      </Space>
    )},
  ];

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={4} style={{ margin: 0 }}>定制订单管理</Title>
        <Button icon={<ReloadOutlined />} onClick={() => setFilters({ customNo: '', dealerName: '', customTypes: [], approvalStatuses: [], dateRange: null })}>重置</Button>
      </div>
      <Card size="small" style={{ marginBottom: 16 }}>
        <Row gutter={[16, 12]}>
          <Col span={4}><Input placeholder="定制单号搜索" prefix={<SearchOutlined />} value={filters.customNo} onChange={(e) => setFilters((f) => ({ ...f, customNo: e.target.value }))} allowClear /></Col>
          <Col span={4}><Input placeholder="经销商搜索" value={filters.dealerName} onChange={(e) => setFilters((f) => ({ ...f, dealerName: e.target.value }))} allowClear /></Col>
          <Col span={5}><RangePicker style={{ width: '100%' }} placeholder={['开始日期', '结束日期']} value={filters.dateRange} onChange={(dates) => setFilters((f) => ({ ...f, dateRange: dates as [dayjs.Dayjs, dayjs.Dayjs] | null }))} /></Col>
          <Col span={4}><Select mode="multiple" placeholder="定制类型" style={{ width: '100%' }} value={filters.customTypes} onChange={(vals) => setFilters((f) => ({ ...f, customTypes: vals }))} options={Object.entries(CUSTOM_TYPE_MAP).map(([k, v]) => ({ value: k, label: v.label }))} maxTagCount={1} /></Col>
          <Col span={5}><Select mode="multiple" placeholder="审批状态" style={{ width: '100%' }} value={filters.approvalStatuses} onChange={(vals) => setFilters((f) => ({ ...f, approvalStatuses: vals }))} options={Object.entries(CUSTOM_APPROVAL_MAP).map(([k, v]) => ({ value: k, label: v.label }))} maxTagCount={2} /></Col>
        </Row>
      </Card>
      <Card>
        <Table rowKey="customNo" columns={columns} dataSource={filtered} scroll={{ x: 1400 }} size="middle"
          pagination={{ defaultPageSize: 20, showSizeChanger: true, showTotal: (total) => `共 ${total} 条` }}
          onRow={(r) => ({ onClick: () => navigate(`/orders/custom/${r.customNo}`) })} />
      </Card>
    </div>
  );
}
