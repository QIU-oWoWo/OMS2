import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card, Table, Input, Select, DatePicker, Button, Space, Tag, Typography, Row, Col, Modal, message, Input as AntInput,
} from 'antd';
import { SearchOutlined, ReloadOutlined, CheckCircleOutlined, CloseCircleOutlined, EyeOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { mockCall400Orders } from '../../data/mockData';
import { APPLY_REASON_MAP, FREE_TYPE_MAP, CALL400_APPROVAL_MAP } from '../../types';
import type { Call400DTO, ApplyReason, FreeType, Call400ApprovalStatus } from '../../types';

const { Title } = Typography;
const { RangePicker } = DatePicker;
const { TextArea } = AntInput;

export default function Call400List() {
  const navigate = useNavigate();
  const [filters, setFilters] = useState({
    call400No: '', dealerName: '', applyReasons: [] as string[],
    freeTypes: [] as string[], approvalStatuses: [] as string[],
    dateRange: null as [dayjs.Dayjs, dayjs.Dayjs] | null,
  });

  const filtered = useMemo(() => {
    let result = [...mockCall400Orders];
    if (filters.call400No) result = result.filter((o) => o.call400No.includes(filters.call400No));
    if (filters.dealerName) result = result.filter((o) => o.dealerName.includes(filters.dealerName));
    if (filters.applyReasons.length > 0) result = result.filter((o) => filters.applyReasons.includes(o.applyReason));
    if (filters.freeTypes.length > 0) result = result.filter((o) => filters.freeTypes.includes(o.freeType));
    if (filters.approvalStatuses.length > 0) result = result.filter((o) => filters.approvalStatuses.includes(o.approvalStatus));
    if (filters.dateRange) {
      const [s, e] = filters.dateRange;
      result = result.filter((o) => dayjs(o.createTime).isAfter(s.startOf('day')) && dayjs(o.createTime).isBefore(e.endOf('day')));
    }
    return result;
  }, [filters]);

  const handleApprove = (record: Call400DTO) => {
    Modal.confirm({
      title: '审批通过',
      content: `确认通过400免费订单 ${record.call400No}？审批通过后将自动生成出库任务。`,
      okText: '确认通过',
      cancelText: '取消',
      onOk: () => message.success(`400订单 ${record.call400No} 已审批通过，出库任务已生成`),
    });
  };

  const handleReject = (record: Call400DTO) => {
    let rejectReason = '';
    Modal.confirm({
      title: '审批拒绝',
      content: (
        <div>
          <p>确定拒绝400免费订单 {record.call400No}？</p>
          <TextArea rows={3} placeholder="请填写拒绝原因（必填）" onChange={(e) => { rejectReason = e.target.value; }} />
        </div>
      ),
      okText: '确认拒绝',
      okButtonProps: { danger: true },
      cancelText: '取消',
      onOk: () => {
        if (!rejectReason.trim()) { message.warning('请填写拒绝原因'); return Promise.reject(); }
        message.success(`400订单 ${record.call400No} 已拒绝，已通知客服跟进`);
      },
    });
  };

  const columns: ColumnsType<Call400DTO> = [
    { title: '400单号', dataIndex: 'call400No', key: 'call400No', width: 180, render: (no: string) => (<a onClick={(e) => { e.stopPropagation(); }} style={{ color: '#FF6B00', fontWeight: 500 }}>{no}</a>) },
    { title: '关联订单号', dataIndex: 'originOrderNo', key: 'originOrderNo', width: 180, render: (no: string) => (<a onClick={(e) => { e.stopPropagation(); navigate(`/orders/${no}`); }} style={{ color: '#0284C7' }}>{no}</a>) },
    { title: '投诉工单号', dataIndex: 'complaintNo', key: 'complaintNo', width: 160, render: (no: string) => <span style={{ fontFamily: 'monospace', fontSize: 12 }}>{no}</span> },
    { title: '经销商', dataIndex: 'dealerName', key: 'dealerName', width: 150 },
    { title: '申请原因', dataIndex: 'applyReason', key: 'applyReason', width: 100, render: (r: ApplyReason) => <Tag>{APPLY_REASON_MAP[r]}</Tag> },
    { title: '免费类型', dataIndex: 'freeType', key: 'freeType', width: 100, render: (t: FreeType) => { const info = FREE_TYPE_MAP[t]; return <Tag color={info?.color}>{info?.label}</Tag>; } },
    { title: 'SKU明细', key: 'skuSummary', width: 180, render: (_: unknown, record: Call400DTO) => record.items.map((i) => `${i.skuName}×${i.quantity}`).join(', ') },
    { title: '申请人', dataIndex: 'applicant', key: 'applicant', width: 80 },
    { title: '审批状态', dataIndex: 'approvalStatus', key: 'approvalStatus', width: 100, render: (s: Call400ApprovalStatus) => { const info = CALL400_APPROVAL_MAP[s]; return <Tag color={info?.color}>{info?.label}</Tag>; } },
    { title: '创建时间', dataIndex: 'createTime', key: 'createTime', width: 160, sorter: (a, b) => a.createTime.localeCompare(b.createTime), render: (t: string) => t.replace('T', ' ').substring(0, 16) },
    { title: '操作', key: 'actions', fixed: 'right' as const, width: 180, render: (_: unknown, record: Call400DTO) => (
      <Space size="small">
        <Button size="small" icon={<EyeOutlined />} onClick={(e) => { e.stopPropagation(); navigate(`/orders/${record.originOrderNo}`); }}>查看</Button>
        {record.approvalStatus === 'PENDING_APPROVAL' && (
          <>
            <Button size="small" type="primary" icon={<CheckCircleOutlined />} onClick={(e) => { e.stopPropagation(); handleApprove(record); }}>通过</Button>
            <Button size="small" danger icon={<CloseCircleOutlined />} onClick={(e) => { e.stopPropagation(); handleReject(record); }}>拒绝</Button>
          </>
        )}
      </Space>
    )},
  ];

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={4} style={{ margin: 0 }}>400免费订单</Title>
        <Button icon={<ReloadOutlined />} onClick={() => setFilters({ call400No: '', dealerName: '', applyReasons: [], freeTypes: [], approvalStatuses: [], dateRange: null })}>重置</Button>
      </div>
      <Card size="small" style={{ marginBottom: 16 }}>
        <Row gutter={[16, 12]}>
          <Col span={4}><Input placeholder="400单号搜索" prefix={<SearchOutlined />} value={filters.call400No} onChange={(e) => setFilters((f) => ({ ...f, call400No: e.target.value }))} allowClear /></Col>
          <Col span={4}><Input placeholder="经销商搜索" value={filters.dealerName} onChange={(e) => setFilters((f) => ({ ...f, dealerName: e.target.value }))} allowClear /></Col>
          <Col span={5}><RangePicker style={{ width: '100%' }} placeholder={['开始日期', '结束日期']} value={filters.dateRange} onChange={(dates) => setFilters((f) => ({ ...f, dateRange: dates as [dayjs.Dayjs, dayjs.Dayjs] | null }))} /></Col>
          <Col span={3}><Select mode="multiple" placeholder="申请原因" style={{ width: '100%' }} value={filters.applyReasons} onChange={(vals) => setFilters((f) => ({ ...f, applyReasons: vals }))} options={Object.entries(APPLY_REASON_MAP).map(([k, v]) => ({ value: k, label: v }))} maxTagCount={1} /></Col>
          <Col span={3}><Select mode="multiple" placeholder="免费类型" style={{ width: '100%' }} value={filters.freeTypes} onChange={(vals) => setFilters((f) => ({ ...f, freeTypes: vals }))} options={Object.entries(FREE_TYPE_MAP).map(([k, v]) => ({ value: k, label: v.label }))} maxTagCount={1} /></Col>
          <Col span={3}><Select mode="multiple" placeholder="审批状态" style={{ width: '100%' }} value={filters.approvalStatuses} onChange={(vals) => setFilters((f) => ({ ...f, approvalStatuses: vals }))} options={Object.entries(CALL400_APPROVAL_MAP).map(([k, v]) => ({ value: k, label: v.label }))} maxTagCount={1} /></Col>
        </Row>
      </Card>
      <Card>
        <Table rowKey="call400No" columns={columns} dataSource={filtered} scroll={{ x: 1600 }} size="middle"
          pagination={{ defaultPageSize: 20, showSizeChanger: true, showTotal: (total) => `共 ${total} 条` }} />
      </Card>
    </div>
  );
}
