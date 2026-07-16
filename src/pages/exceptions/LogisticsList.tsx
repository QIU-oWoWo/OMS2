import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card, Table, Input, Select, DatePicker, Button, Space, Tag, Typography, Row, Col,
} from 'antd';
import { SearchOutlined, ReloadOutlined, EnvironmentOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { mockTrackingList } from '../../data/mockData';
import { TRACK_STATUS_MAP } from '../../types';
import type { TrackingDTO, TrackStatus } from '../../types';

const { Title } = Typography;
const { RangePicker } = DatePicker;

export default function LogisticsList() {
  const navigate = useNavigate();
  const [filters, setFilters] = useState({
    trackingNo: '', orderNo: '', logisticsCompany: '',
    trackStatuses: [] as string[], dateRange: null as [dayjs.Dayjs, dayjs.Dayjs] | null,
  });

  const filtered = useMemo(() => {
    let result = [...mockTrackingList];
    if (filters.trackingNo) result = result.filter((t) => t.trackingNo.includes(filters.trackingNo));
    if (filters.orderNo) result = result.filter((t) => t.orderNo.includes(filters.orderNo));
    if (filters.logisticsCompany) result = result.filter((t) => t.logisticsCompany === filters.logisticsCompany);
    if (filters.trackStatuses.length > 0) result = result.filter((t) => filters.trackStatuses.includes(t.trackStatus));
    if (filters.dateRange) {
      const [s, e] = filters.dateRange;
      result = result.filter((t) => dayjs(t.lastUpdateTime).isAfter(s.startOf('day')) && dayjs(t.lastUpdateTime).isBefore(e.endOf('day')));
    }
    return result;
  }, [filters]);

  const logisticsOptions = [...new Set(mockTrackingList.map((t) => t.logisticsCompany))];

  const columns: ColumnsType<TrackingDTO> = [
    { title: '运单号', dataIndex: 'trackingNo', key: 'trackingNo', width: 160, render: (no: string) => (<a onClick={(e) => { e.stopPropagation(); navigate(`/exceptions/logistics/${no}`); }} style={{ color: '#FF6B00', fontWeight: 500 }}>{no}</a>) },
    { title: '关联订单号', dataIndex: 'orderNo', key: 'orderNo', width: 180, render: (no: string) => (<a onClick={(e) => { e.stopPropagation(); navigate(`/orders/${no}`); }} style={{ color: '#0284C7' }}>{no}</a>) },
    { title: '物流公司', dataIndex: 'logisticsCompany', key: 'logisticsCompany', width: 110 },
    { title: '发货仓库', dataIndex: 'warehouseName', key: 'warehouseName', width: 90 },
    { title: '收货地址', dataIndex: 'receiverAddress', key: 'receiverAddress', width: 200, ellipsis: true },
    { title: '当前状态', dataIndex: 'trackStatus', key: 'trackStatus', width: 90, render: (s: TrackStatus) => { const info = TRACK_STATUS_MAP[s]; return <Tag color={info?.color}>{info?.label}</Tag>; } },
    { title: '最近更新', dataIndex: 'lastUpdateTime', key: 'lastUpdateTime', width: 160, sorter: (a, b) => a.lastUpdateTime.localeCompare(b.lastUpdateTime), render: (t: string) => t.replace('T', ' ').substring(0, 16) },
    { title: '操作', key: 'actions', width: 100, render: (_: unknown, record: TrackingDTO) => (
      <a onClick={(e) => { e.stopPropagation(); navigate(`/exceptions/logistics/${record.trackingNo}`); }} style={{ color: '#FF6B00' }}><EnvironmentOutlined /> 查看轨迹</a>
    )},
  ];

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={4} style={{ margin: 0 }}>运单查询</Title>
        <Button icon={<ReloadOutlined />} onClick={() => setFilters({ trackingNo: '', orderNo: '', logisticsCompany: '', trackStatuses: [], dateRange: null })}>重置</Button>
      </div>
      <Card size="small" style={{ marginBottom: 16 }}>
        <Row gutter={[16, 12]}>
          <Col span={4}><Input placeholder="运单号搜索" prefix={<SearchOutlined />} value={filters.trackingNo} onChange={(e) => setFilters((f) => ({ ...f, trackingNo: e.target.value }))} allowClear /></Col>
          <Col span={4}><Input placeholder="订单号搜索" value={filters.orderNo} onChange={(e) => setFilters((f) => ({ ...f, orderNo: e.target.value }))} allowClear /></Col>
          <Col span={4}><Select placeholder="物流公司" style={{ width: '100%' }} value={filters.logisticsCompany || undefined} onChange={(val) => setFilters((f) => ({ ...f, logisticsCompany: val || '' }))} allowClear options={logisticsOptions.map((c) => ({ value: c, label: c }))} /></Col>
          <Col span={4}><Select mode="multiple" placeholder="物流状态" style={{ width: '100%' }} value={filters.trackStatuses} onChange={(vals) => setFilters((f) => ({ ...f, trackStatuses: vals }))} options={Object.entries(TRACK_STATUS_MAP).map(([k, v]) => ({ value: k, label: v.label }))} maxTagCount={1} /></Col>
          <Col span={5}><RangePicker style={{ width: '100%' }} placeholder={['开始日期', '结束日期']} value={filters.dateRange} onChange={(dates) => setFilters((f) => ({ ...f, dateRange: dates as [dayjs.Dayjs, dayjs.Dayjs] | null }))} /></Col>
        </Row>
      </Card>
      <Card>
        <Table rowKey="trackingNo" columns={columns} dataSource={filtered} scroll={{ x: 1200 }} size="middle"
          pagination={{ defaultPageSize: 20, showSizeChanger: true, showTotal: (total) => `共 ${total} 条` }}
          onRow={(r) => ({ onClick: () => navigate(`/exceptions/logistics/${r.trackingNo}`) })} />
      </Card>
    </div>
  );
}
