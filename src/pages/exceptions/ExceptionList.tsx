import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  Table,
  Input,
  Select,
  DatePicker,
  Button,
  Space,
  Tag,
  Typography,
  Row,
  Col,
  message,
} from 'antd';
import {
  SearchOutlined,
  ReloadOutlined,
  ExportOutlined,
  SwapOutlined,
  ArrowUpOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { mockExceptions } from '../../data/mockData';
import {
  EXCEPTION_TYPE_MAP,
  PRIORITY_MAP,
  EXCEPTION_STATUS_MAP,
} from '../../types';
import type { ExceptionDTO, ExceptionType, Priority, ExceptionStatus, ResponsibleParty } from '../../types';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

const STATUS_COLORS: Record<ExceptionStatus, string> = {
  PENDING: '#E11D48',
  PROCESSING: '#F59E0B',
  RESOLVED: '#16A34A',
  CLOSED: '#8C8C8C',
};

const PARTY_LABELS: Record<ResponsibleParty, string> = {
  WAREHOUSE: '仓库',
  LOGISTICS: '物流',
  SUPPLIER: '供应商',
  DEALER: '经销商',
  SYSTEM: '系统',
};

export default function ExceptionList() {
  const navigate = useNavigate();

  const [filters, setFilters] = useState({
    orderNo: '',
    exceptionTypes: [] as string[],
    statuses: [] as string[],
    priorities: [] as string[],
    dateRange: null as [dayjs.Dayjs, dayjs.Dayjs] | null,
    responsibleParty: '',
  });

  const filtered = useMemo(() => {
    let result = [...mockExceptions];
    if (filters.orderNo) {
      result = result.filter((e) => e.orderNo.includes(filters.orderNo));
    }
    if (filters.exceptionTypes.length > 0) {
      result = result.filter((e) => filters.exceptionTypes.includes(e.exceptionType));
    }
    if (filters.statuses.length > 0) {
      result = result.filter((e) => filters.statuses.includes(e.status));
    }
    if (filters.priorities.length > 0) {
      result = result.filter((e) => filters.priorities.includes(e.priority));
    }
    if (filters.dateRange) {
      const [start, end] = filters.dateRange;
      result = result.filter((e) => {
        const t = dayjs(e.discoverTime);
        return t.isAfter(start.startOf('day')) && t.isBefore(end.endOf('day'));
      });
    }
    if (filters.responsibleParty) {
      result = result.filter((e) => e.responsibleParty === filters.responsibleParty);
    }
    return result;
  }, [filters]);

  const columns: ColumnsType<ExceptionDTO> = [
    {
      title: '异常单号',
      dataIndex: 'exceptionNo',
      key: 'exceptionNo',
      width: 180,
      render: (no: string) => (
        <a style={{ color: '#FF6B00', fontWeight: 500 }}>{no}</a>
      ),
    },
    {
      title: '异常类型',
      dataIndex: 'exceptionType',
      key: 'exceptionType',
      width: 100,
      render: (type: ExceptionType) => {
        const info = EXCEPTION_TYPE_MAP[type];
        return <Tag color={info?.color}>{info?.label}</Tag>;
      },
    },
    {
      title: '优先级',
      dataIndex: 'priority',
      key: 'priority',
      width: 100,
      render: (p: Priority) => {
        const info = PRIORITY_MAP[p];
        return <Tag color={info?.color}>{info?.label}</Tag>;
      },
    },
    {
      title: '关联订单',
      dataIndex: 'orderNo',
      key: 'orderNo',
      width: 180,
      render: (no: string) => (
        <a
          onClick={() => navigate(`/orders/${no}`)}
          style={{ color: '#0284C7' }}
        >
          {no}
        </a>
      ),
    },
    {
      title: '异常描述',
      dataIndex: 'description',
      key: 'description',
      width: 240,
      ellipsis: true,
    },
    {
      title: '责任方',
      dataIndex: 'responsibleParty',
      key: 'responsibleParty',
      width: 90,
      render: (p: ResponsibleParty) => PARTY_LABELS[p],
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 90,
      render: (s: ExceptionStatus) => (
        <Tag color={STATUS_COLORS[s]}>{EXCEPTION_STATUS_MAP[s]}</Tag>
      ),
    },
    {
      title: '发现时间',
      dataIndex: 'discoverTime',
      key: 'discoverTime',
      width: 160,
      sorter: (a, b) => a.discoverTime.localeCompare(b.discoverTime),
      render: (t: string) => t.replace('T', ' ').substring(0, 16),
    },
    {
      title: '处理时限',
      dataIndex: 'deadline',
      key: 'deadline',
      width: 160,
      render: (t: string) => {
        const isPast = dayjs(t).isBefore(dayjs());
        return (
          <Text style={{ color: isPast ? '#E11D48' : undefined }}>
            {t.replace('T', ' ').substring(0, 16)}
            {isPast && <Tag color="error" style={{ marginLeft: 4 }}>超时</Tag>}
          </Text>
        );
      },
    },
    {
      title: '当前处理人',
      dataIndex: 'handler',
      key: 'handler',
      width: 90,
    },
    {
      title: '操作',
      key: 'actions',
      width: 160,
      render: () => (
        <Space size="small">
          <Button size="small" type="primary">
            处理
          </Button>
          <Button size="small" icon={<SwapOutlined />}>
            转派
          </Button>
          <Button size="small" icon={<ArrowUpOutlined />} danger>
            升级
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={4} style={{ margin: 0 }}>异常中心</Title>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={() => setFilters({
            orderNo: '', exceptionTypes: [], statuses: [], priorities: [],
            dateRange: null, responsibleParty: '',
          })}>
            重置
          </Button>
          <Button type="primary" icon={<ExportOutlined />} onClick={() => message.info('导出功能开发中')}>
            导出 Excel
          </Button>
        </Space>
      </div>

      {/* 筛选区 */}
      <Card size="small" style={{ marginBottom: 16 }}>
        <Row gutter={[16, 12]}>
          <Col span={4}>
            <Input
              placeholder="关联订单号搜索"
              prefix={<SearchOutlined />}
              value={filters.orderNo}
              onChange={(e) => setFilters((f) => ({ ...f, orderNo: e.target.value }))}
              allowClear
            />
          </Col>
          <Col span={4}>
            <Select
              mode="multiple"
              placeholder="异常类型"
              style={{ width: '100%' }}
              value={filters.exceptionTypes}
              onChange={(vals) => setFilters((f) => ({ ...f, exceptionTypes: vals }))}
              options={Object.entries(EXCEPTION_TYPE_MAP).map(([k, v]) => ({
                value: k,
                label: v.label,
              }))}
              maxTagCount={1}
            />
          </Col>
          <Col span={3}>
            <Select
              mode="multiple"
              placeholder="异常状态"
              style={{ width: '100%' }}
              value={filters.statuses}
              onChange={(vals) => setFilters((f) => ({ ...f, statuses: vals }))}
              options={Object.entries(EXCEPTION_STATUS_MAP).map(([k, v]) => ({
                value: k,
                label: v,
              }))}
              maxTagCount={1}
            />
          </Col>
          <Col span={3}>
            <Select
              mode="multiple"
              placeholder="优先级"
              style={{ width: '100%' }}
              value={filters.priorities}
              onChange={(vals) => setFilters((f) => ({ ...f, priorities: vals }))}
              options={Object.entries(PRIORITY_MAP).map(([k, v]) => ({
                value: k,
                label: v.label,
              }))}
              maxTagCount={1}
            />
          </Col>
          <Col span={5}>
            <RangePicker
              style={{ width: '100%' }}
              placeholder={['开始日期', '结束日期']}
              value={filters.dateRange}
              onChange={(dates) => setFilters((f) => ({ ...f, dateRange: dates as [dayjs.Dayjs, dayjs.Dayjs] | null }))}
            />
          </Col>
          <Col span={3}>
            <Select
              placeholder="责任方"
              style={{ width: '100%' }}
              value={filters.responsibleParty || undefined}
              onChange={(val) => setFilters((f) => ({ ...f, responsibleParty: val || '' }))}
              allowClear
              options={Object.entries(PARTY_LABELS).map(([k, v]) => ({
                value: k,
                label: v,
              }))}
            />
          </Col>
        </Row>
      </Card>

      {/* 数据表格 */}
      <Card>
        <Table
          rowKey="exceptionNo"
          columns={columns}
          dataSource={filtered}
          scroll={{ x: 1500 }}
          size="middle"
          pagination={{
            defaultPageSize: 20,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条`,
          }}
        />
      </Card>
    </div>
  );
}
