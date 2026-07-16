import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card, Table, Input, Select, DatePicker, Button, Space, Tag, Typography, Row, Col, Modal, message,
  Drawer, Switch, InputNumber, Divider, Alert,
} from 'antd';
import { SearchOutlined, ReloadOutlined, CheckCircleOutlined, CloseCircleOutlined, CalendarOutlined, SettingOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { mockAppointments } from '../../data/mockData';
import { APPOINT_STATUS_MAP } from '../../types';
import type { AppointmentDTO, AppointStatus } from '../../types';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

const STATUS_COLORS: Record<AppointStatus, string> = {
  PENDING_CONFIRM: '#F59E0B',
  CONFIRMED: '#0284C7',
  EXPIRED: '#8C8C8C',
  CANCELLED: '#E11D48',
  EXECUTED: '#16A34A',
};

export default function AppointmentList() {
  const navigate = useNavigate();

  const [ruleOpen, setRuleOpen] = useState(false);
  const [rules, setRules] = useState({
    enabled: true,
    earliestDays: 3,
    latestDays: 30,
    timeWindowStart: 8,
    timeWindowEnd: 18,
    maxPerDay: 20,
  });

  const [filters, setFilters] = useState({
    appointNo: '',
    dealerName: '',
    statuses: [] as string[],
    dateRange: null as [dayjs.Dayjs, dayjs.Dayjs] | null,
  });

  const filtered = useMemo(() => {
    let result = [...mockAppointments];
    if (filters.appointNo) {
      result = result.filter((a) => a.appointNo.includes(filters.appointNo));
    }
    if (filters.dealerName) {
      result = result.filter((a) => a.dealerName.includes(filters.dealerName));
    }
    if (filters.statuses.length > 0) {
      result = result.filter((a) => filters.statuses.includes(a.appointStatus));
    }
    if (filters.dateRange) {
      const [start, end] = filters.dateRange;
      result = result.filter((a) => {
        const t = dayjs(a.appointDate);
        return t.isAfter(start.startOf('day')) && t.isBefore(end.endOf('day'));
      });
    }
    return result;
  }, [filters]);

  const columns: ColumnsType<AppointmentDTO> = [
    {
      title: '预约单号',
      dataIndex: 'appointNo',
      key: 'appointNo',
      width: 180,
      render: (no: string) => (
        <a style={{ color: '#FF6B00', fontWeight: 500 }}>{no}</a>
      ),
    },
    {
      title: '关联订单号',
      dataIndex: 'orderNo',
      key: 'orderNo',
      width: 180,
      render: (no: string) => (
        <a onClick={() => navigate(`/orders/${no}`)} style={{ color: '#0284C7' }}>
          {no}
        </a>
      ),
    },
    {
      title: '经销商',
      dataIndex: 'dealerName',
      key: 'dealerName',
      width: 160,
    },
    {
      title: '预约发货日期',
      dataIndex: 'appointDate',
      key: 'appointDate',
      width: 120,
      sorter: (a, b) => a.appointDate.localeCompare(b.appointDate),
    },
    {
      title: '预约状态',
      dataIndex: 'appointStatus',
      key: 'appointStatus',
      width: 100,
      render: (s: AppointStatus) => (
        <Tag color={STATUS_COLORS[s]}>{APPOINT_STATUS_MAP[s]}</Tag>
      ),
    },
    {
      title: 'SKU种类数',
      dataIndex: 'skuTypes',
      key: 'skuTypes',
      width: 100,
      align: 'center',
    },
    {
      title: '预约备注',
      dataIndex: 'remark',
      key: 'remark',
      width: 180,
      ellipsis: true,
    },
    {
      title: '创建时间',
      dataIndex: 'createTime',
      key: 'createTime',
      width: 160,
      render: (t: string) => t.replace('T', ' ').substring(0, 16),
    },
    {
      title: '操作',
      key: 'actions',
      width: 200,
      render: (_: unknown, record: AppointmentDTO) => (
        <Space size="small">
          {record.appointStatus === 'PENDING_CONFIRM' && (
            <Button
              size="small"
              type="primary"
              icon={<CheckCircleOutlined />}
              onClick={() => message.success('预约已确认')}
            >
              确认
            </Button>
          )}
          {(record.appointStatus === 'PENDING_CONFIRM' || record.appointStatus === 'CONFIRMED') && (
            <Button size="small" icon={<CalendarOutlined />}>
              修改日期
            </Button>
          )}
          {record.appointStatus !== 'EXECUTED' && (
            <Button
              size="small"
              danger
              icon={<CloseCircleOutlined />}
              onClick={() => {
                Modal.confirm({
                  title: '取消预约',
                  content: '确定要取消此预约吗？请填写取消原因。',
                  okText: '确认取消',
                  cancelText: '保留',
                  okButtonProps: { danger: true },
                  onOk: () => message.success('预约已取消'),
                });
              }}
            >
              取消
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={4} style={{ margin: 0 }}>预约单管理</Title>
        <Button icon={<ReloadOutlined />} onClick={() => setFilters({ appointNo: '', dealerName: '', statuses: [], dateRange: null })}>
          重置
        </Button>
      </div>

      {/* 预约规则配置入口 */}
      <Card size="small" style={{ marginBottom: 16, background: '#FAFAFA' }}
        title={<Space><SettingOutlined /><Text strong style={{ fontSize: 14 }}>预约规则配置</Text></Space>}>
        <div onClick={() => setRuleOpen(true)} style={{ cursor: 'pointer', padding: '12px 16px', borderRadius: 8, background: '#FFFFFF', border: '1px solid #F0F0F0', display: 'inline-block', transition: 'all 0.2s' }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#0284C7'; e.currentTarget.style.boxShadow = '0 2px 8px #0284C720'; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#F0F0F0'; e.currentTarget.style.boxShadow = 'none'; }}>
          <Space><CalendarOutlined style={{ color: '#0284C7', fontSize: 18 }} /><div><Text strong style={{ fontSize: 13 }}>预约时间规则</Text><br /><Text type="secondary" style={{ fontSize: 11 }}>最早/最晚可预约时间 · 时间窗口 · 每日上限</Text></div></Space>
        </div>
      </Card>

      <Drawer title={<Space><CalendarOutlined />预约规则配置</Space>} open={ruleOpen} onClose={() => setRuleOpen(false)} width={460}
        extra={<Button type="primary" size="small" onClick={() => { message.success('预约规则已保存'); setRuleOpen(false); }}>保存配置</Button>}>
        <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}><Text strong>启用预约规则</Text><Switch checked={rules.enabled} onChange={(v) => setRules((p) => ({ ...p, enabled: v }))} /></div>
        <Divider style={{ margin: '12px 0' }} />
        <div style={{ marginBottom: 16 }}><Text strong>可预约时间范围：</Text></div>
        <div style={{ marginBottom: 16 }}>
          <Text>最早可预约：</Text><Text type="secondary" style={{ fontSize: 12 }}>（经销商需提前至少）</Text>
          <InputNumber min={1} max={90} value={rules.earliestDays} onChange={(v) => setRules((p) => ({ ...p, earliestDays: v || 3 }))} style={{ width: 70, margin: '0 8px' }} /><Text>天</Text>
        </div>
        <div style={{ marginBottom: 16 }}>
          <Text>最晚可预约：</Text><Text type="secondary" style={{ fontSize: 12 }}>（经销商最多可提前）</Text>
          <InputNumber min={1} max={180} value={rules.latestDays} onChange={(v) => setRules((p) => ({ ...p, latestDays: v || 30 }))} style={{ width: 70, margin: '0 8px' }} /><Text>天</Text>
        </div>
        <Divider style={{ margin: '12px 0' }} />
        <div style={{ marginBottom: 16 }}><Text strong>预约时间窗口（每日）：</Text></div>
        <div style={{ marginBottom: 16 }}>
          <InputNumber min={0} max={23} value={rules.timeWindowStart} onChange={(v) => setRules((p) => ({ ...p, timeWindowStart: v || 8 }))} style={{ width: 70 }} />
          <Text style={{ margin: '0 8px' }}>:00 —</Text>
          <InputNumber min={0} max={23} value={rules.timeWindowEnd} onChange={(v) => setRules((p) => ({ ...p, timeWindowEnd: v || 18 }))} style={{ width: 70, marginLeft: 8 }} />
          <Text style={{ marginLeft: 8 }}>:00</Text>
        </div>
        <Divider style={{ margin: '12px 0' }} />
        <div style={{ marginBottom: 16 }}>
          <Text strong>每日预约上限：</Text>
          <InputNumber min={1} max={500} value={rules.maxPerDay} onChange={(v) => setRules((p) => ({ ...p, maxPerDay: v || 20 }))} style={{ width: 80, marginLeft: 8 }} /><Text style={{ marginLeft: 8 }}>单</Text>
        </div>
        <Divider style={{ margin: '16px 0' }} />
        <Alert message={`当前规则：经销商需提前 ${rules.earliestDays}~${rules.latestDays} 天预约，每日 ${rules.timeWindowStart}:00-${rules.timeWindowEnd}:00 开放预约，上限 ${rules.maxPerDay} 单/天`} type="info" showIcon />
      </Drawer>

      {/* 筛选区 */}
      <Card size="small" style={{ marginBottom: 16 }}>
        <Row gutter={[16, 12]}>
          <Col span={4}>
            <Input
              placeholder="预约单号搜索"
              prefix={<SearchOutlined />}
              value={filters.appointNo}
              onChange={(e) => setFilters((f) => ({ ...f, appointNo: e.target.value }))}
              allowClear
            />
          </Col>
          <Col span={4}>
            <Input
              placeholder="经销商搜索"
              value={filters.dealerName}
              onChange={(e) => setFilters((f) => ({ ...f, dealerName: e.target.value }))}
              allowClear
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
          <Col span={6}>
            <Select
              mode="multiple"
              placeholder="预约状态"
              style={{ width: '100%' }}
              value={filters.statuses}
              onChange={(vals) => setFilters((f) => ({ ...f, statuses: vals }))}
              options={Object.entries(APPOINT_STATUS_MAP).map(([k, v]) => ({ value: k, label: v }))}
              maxTagCount={2}
            />
          </Col>
        </Row>
      </Card>

      {/* 数据表格 */}
      <Card>
        <Table
          rowKey="appointNo"
          columns={columns}
          dataSource={filtered}
          scroll={{ x: 1200 }}
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
