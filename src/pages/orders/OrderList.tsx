import { useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Card,
  Tabs,
  Table,
  Input,
  Select,
  DatePicker,
  Button,
  Space,
  Tag,
  Badge,
  Switch,
  Tooltip,
  Row,
  Col,
  Typography,
  Dropdown,
  Checkbox,
  message,
  Modal,
  Cascader,
} from 'antd';
import {
  SearchOutlined,
  DownloadOutlined,
  PrinterOutlined,
  FilterOutlined,
  ReloadOutlined,
  SettingOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  MoreOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { mockOrders } from '../../data/mockData';
import {
  ORDER_STATUS_MAP,
  BIZ_TYPE_MAP,
  URGENCY_MAP,
  FULFILL_METHOD_MAP,
  ORDER_STATUS_STEPS,
} from '../../types';
import type { OrderDTO, OrderStatus } from '../../types';

const { Title } = Typography;
const { RangePicker } = DatePicker;

// 状态 Tab 顺序
const STATUS_TABS: { key: OrderStatus | 'ALL'; label: string }[] = [
  { key: 'ALL', label: '全部' },
  { key: 'PENDING_REVIEW', label: '待审核' },
  { key: 'SCHEDULING', label: '排单中' },
  { key: 'PICKING', label: '拣货中' },
  { key: 'READY_TO_SHIP', label: '待发货' },
  { key: 'IN_TRANSIT', label: '运输中' },
  { key: 'DELIVERED', label: '已签收' },
  { key: 'EXCEPTION', label: '异常' },
  { key: 'COMPLETED', label: '已完成' },
];

// 自定义列配置
const ALL_COLUMNS = [
  { key: 'orderNo', title: '订单号', fixed: true },
  { key: 'dealerName', title: '经销商' },
  { key: 'bizType', title: '业务流程' },
  { key: 'urgencyLevel', title: '时效等级' },
  { key: 'fulfillMethod', title: '履约方式' },
  { key: 'skuCount', title: 'SKU数量' },
  { key: 'totalAmount', title: '总金额' },
  { key: 'createTime', title: '下单时间' },
  { key: 'status', title: '当前状态' },
  { key: 'vinCode', title: 'VIN码' },
  { key: 'baseSource', title: '基地来源' },
  { key: 'shortageFlag', title: '缺件' },
];

export default function OrderList() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialStatus = searchParams.get('status') as OrderStatus | null;

  // 状态
  const [activeTab, setActiveTab] = useState<OrderStatus | 'ALL'>(initialStatus || 'ALL');
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [showFilters, setShowFilters] = useState(true);
  const [visibleColumns, setVisibleColumns] = useState(ALL_COLUMNS.map((c) => c.key));

  // 筛选条件
  const [filters, setFilters] = useState({
    orderNo: '',
    dealerName: '',
    dateRange: null as [dayjs.Dayjs, dayjs.Dayjs] | null,
    bizTypes: [] as string[],
    urgencyLevels: [] as string[],
    fulfillMethods: [] as string[],
    baseSource: '',
    vinCode: '',
    shortageOnly: false,
  });

  // 筛选后的数据
  const filteredOrders = useMemo(() => {
    let result = [...mockOrders];

    // 状态过滤
    if (activeTab !== 'ALL') {
      result = result.filter((o) => o.status === activeTab);
    }

    // 各筛选条件
    if (filters.orderNo) {
      result = result.filter(
        (o) =>
          o.orderNo.includes(filters.orderNo.toUpperCase()) ||
          o.orderNo.includes(filters.orderNo)
      );
    }
    if (filters.dealerName) {
      result = result.filter((o) => o.dealerName.includes(filters.dealerName));
    }
    if (filters.dateRange) {
      const [start, end] = filters.dateRange;
      result = result.filter((o) => {
        const t = dayjs(o.createTime);
        return t.isAfter(start.startOf('day')) && t.isBefore(end.endOf('day'));
      });
    }
    if (filters.bizTypes.length > 0) {
      result = result.filter((o) => filters.bizTypes.includes(o.bizType));
    }
    if (filters.urgencyLevels.length > 0) {
      result = result.filter((o) => filters.urgencyLevels.includes(o.urgencyLevel));
    }
    if (filters.fulfillMethods.length > 0) {
      result = result.filter((o) => filters.fulfillMethods.includes(o.fulfillMethod));
    }
    if (filters.baseSource) {
      result = result.filter((o) => o.baseSource === filters.baseSource);
    }
    if (filters.vinCode) {
      result = result.filter((o) => o.vinCode.includes(filters.vinCode));
    }
    if (filters.shortageOnly) {
      result = result.filter((o) => o.shortageFlag);
    }

    return result;
  }, [activeTab, filters]);

  // 各状态数量
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { ALL: mockOrders.length };
    STATUS_TABS.forEach((tab) => {
      if (tab.key === 'ALL') return;
      counts[tab.key] = mockOrders.filter((o) => o.status === tab.key).length;
    });
    return counts;
  }, []);

  // 表格列定义
  const columns: ColumnsType<OrderDTO> = useMemo(() => {
    const allCols: ColumnsType<OrderDTO> = [
      {
        title: '订单号',
        dataIndex: 'orderNo',
        key: 'orderNo',
        fixed: 'left' as const,
        width: 180,
        sorter: (a, b) => a.orderNo.localeCompare(b.orderNo),
        render: (no: string) => (
          <a
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/orders/${no}`);
            }}
            style={{ color: '#FF6B00', fontWeight: 500 }}
          >
            {no}
          </a>
        ),
      },
      {
        title: '经销商',
        dataIndex: 'dealerName',
        key: 'dealerName',
        width: 160,
        sorter: (a, b) => a.dealerName.localeCompare(b.dealerName),
      },
      {
        title: '业务流程',
        dataIndex: 'bizType',
        key: 'bizType',
        width: 90,
        render: (type: string) => {
          const colors: Record<string, string> = {
            REGULAR: '#16A34A',
            APPOINTMENT: '#0284C7',
            CUSTOM: '#7C3AED',
            REQUISITION: '#8C8C8C',
          };
          return <Tag color={colors[type] || '#8C8C8C'}>{BIZ_TYPE_MAP[type as keyof typeof BIZ_TYPE_MAP]}</Tag>;
        },
      },
      {
        title: '时效等级',
        dataIndex: 'urgencyLevel',
        key: 'urgencyLevel',
        width: 90,
        sorter: (a, b) => {
          const order = { CRITICAL: 3, URGENT: 2, NORMAL: 1 };
          return order[a.urgencyLevel] - order[b.urgencyLevel];
        },
        render: (level: string) => {
          const info = URGENCY_MAP[level as keyof typeof URGENCY_MAP];
          return <Tag color={info?.color}>{info?.label}</Tag>;
        },
      },
      {
        title: '履约方式',
        dataIndex: 'fulfillMethod',
        key: 'fulfillMethod',
        width: 90,
        render: (m: string) => FULFILL_METHOD_MAP[m as keyof typeof FULFILL_METHOD_MAP],
      },
      {
        title: 'SKU数量',
        dataIndex: 'skuCount',
        key: 'skuCount',
        width: 90,
        align: 'center' as const,
        sorter: (a, b) => a.skuCount - b.skuCount,
      },
      {
        title: '总金额',
        dataIndex: 'totalAmount',
        key: 'totalAmount',
        width: 120,
        align: 'right' as const,
        sorter: (a, b) => a.totalAmount - b.totalAmount,
        render: (amount: number) => (
          <span style={{ fontWeight: 500 }}>¥{amount.toLocaleString()}</span>
        ),
      },
      {
        title: '下单时间',
        dataIndex: 'createTime',
        key: 'createTime',
        width: 160,
        sorter: (a, b) => a.createTime.localeCompare(b.createTime),
        render: (t: string) => t.replace('T', ' ').substring(0, 16),
      },
      {
        title: '当前状态',
        dataIndex: 'status',
        key: 'status',
        width: 100,
        sorter: (a, b) => {
          const idx = (s: string) => ORDER_STATUS_STEPS.indexOf(s as OrderStatus);
          return idx(a.status) - idx(b.status);
        },
        render: (s: OrderStatus) => {
          const isException = s === 'EXCEPTION';
          return (
            <Tag
              color={isException ? '#E11D48' : s === 'COMPLETED' ? '#16A34A' : '#FF6B00'}
            >
              {ORDER_STATUS_MAP[s]}
            </Tag>
          );
        },
      },
      {
        title: 'VIN码',
        dataIndex: 'vinCode',
        key: 'vinCode',
        width: 170,
        ellipsis: { showTitle: false },
        render: (vin: string) => (
          <Tooltip title={vin}>
            <span style={{ fontFamily: 'monospace', fontSize: 12 }}>{vin}</span>
          </Tooltip>
        ),
      },
      {
        title: '基地来源',
        dataIndex: 'baseSource',
        key: 'baseSource',
        width: 100,
      },
      {
        title: '缺件',
        dataIndex: 'shortageFlag',
        key: 'shortageFlag',
        width: 60,
        align: 'center' as const,
        render: (flag: boolean) =>
          flag ? (
            <Tooltip title="有缺件">
              <ExclamationCircleOutlined style={{ color: '#E11D48', fontSize: 16 }} />
            </Tooltip>
          ) : null,
      },
      {
        title: '操作',
        key: 'actions',
        fixed: 'right' as const,
        width: 120,
        render: (_: unknown, record: OrderDTO) => (
          <Space size="small">
            <a
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/orders/${record.orderNo}`);
              }}
              style={{ color: '#FF6B00' }}
            >
              查看
            </a>
            <Dropdown
              menu={{
                items: [
                  { key: 'audit', label: '审核', icon: <CheckCircleOutlined /> },
                  { key: 'schedule', label: '排单', icon: <CheckCircleOutlined /> },
                  { key: 'export', label: '导出', icon: <DownloadOutlined /> },
                  { key: 'print', label: '打印', icon: <PrinterOutlined /> },
                ],
              }}
              trigger={['click']}
            >
              <a onClick={(e) => e.stopPropagation()}>
                <MoreOutlined />
              </a>
            </Dropdown>
          </Space>
        ),
      },
    ];

    return allCols.filter((col) => visibleColumns.includes(col.key as string));
  }, [navigate, visibleColumns]);

  // 批量操作
  const handleBatchAction = (action: string) => {
    if (selectedRowKeys.length === 0) {
      message.warning('请先选择订单');
      return;
    }
    Modal.confirm({
      title: `确认${action}`,
      content: `确定要对选中的 ${selectedRowKeys.length} 个订单执行${action}操作吗？`,
      okText: '确认',
      cancelText: '取消',
      onOk: () => {
        message.success(`${action}操作已提交，共 ${selectedRowKeys.length} 条`);
        setSelectedRowKeys([]);
      },
    });
  };

  // 重置筛选
  const handleReset = () => {
    setFilters({
      orderNo: '',
      dealerName: '',
      dateRange: null,
      bizTypes: [],
      urgencyLevels: [],
      fulfillMethods: [],
      baseSource: '',
      vinCode: '',
      shortageOnly: false,
    });
  };

  return (
    <div>
      {/* 页面标题 */}
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <Title level={4} style={{ margin: 0 }}>订单管理</Title>
        </div>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={handleReset}>重置</Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => navigate('/orders?action=create')}
          >
            新建订单
          </Button>
        </Space>
      </div>

      {/* 状态 Tab 栏 */}
      <Card style={{ marginBottom: 16 }}>
        <Tabs
          activeKey={activeTab}
          onChange={(key) => {
            setActiveTab(key as OrderStatus | 'ALL');
            setSelectedRowKeys([]);
          }}
          tabBarExtraContent={
            <Dropdown
              menu={{
                items: ALL_COLUMNS.map((col) => ({
                  key: col.key,
                  label: (
                    <Checkbox checked={visibleColumns.includes(col.key)} disabled={col.fixed}>
                      {col.title}
                    </Checkbox>
                  ),
                  onClick: () => {
                    setVisibleColumns((prev) =>
                      prev.includes(col.key)
                        ? prev.filter((k) => k !== col.key)
                        : [...prev, col.key]
                    );
                  },
                })),
              }}
              trigger={['click']}
            >
              <Button icon={<SettingOutlined />} size="small">
                列设置
              </Button>
            </Dropdown>
          }
          tabBarStyle={{ marginBottom: 0 }}
          items={STATUS_TABS.map((tab) => ({
            key: tab.key,
            label: (
              <Badge
                count={statusCounts[tab.key] || 0}
                overflowCount={999}
                color={tab.key === 'EXCEPTION' ? '#E11D48' : tab.key === 'ALL' ? '#FF6B00' : '#8C8C8C'}
                style={{ marginLeft: 2 }}
                size="small"
              >
                <span style={{ paddingRight: tab.key === 'ALL' ? 0 : 4 }}>{tab.label}</span>
              </Badge>
            ),
          }))}
        />
      </Card>

      {/* 筛选条件区 */}
      {showFilters && (
        <Card size="small" style={{ marginBottom: 16 }}>
          <Row gutter={[16, 12]}>
            <Col span={4}>
              <Input
                placeholder="订单号搜索"
                prefix={<SearchOutlined />}
                value={filters.orderNo}
                onChange={(e) => setFilters((f) => ({ ...f, orderNo: e.target.value }))}
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
            <Col span={3}>
              <Select
                mode="multiple"
                placeholder="业务流程"
                style={{ width: '100%' }}
                value={filters.bizTypes}
                onChange={(vals) => setFilters((f) => ({ ...f, bizTypes: vals }))}
                options={Object.entries(BIZ_TYPE_MAP).map(([k, v]) => ({ value: k, label: v }))}
                maxTagCount={1}
              />
            </Col>
            <Col span={3}>
              <Select
                mode="multiple"
                placeholder="时效等级"
                style={{ width: '100%' }}
                value={filters.urgencyLevels}
                onChange={(vals) => setFilters((f) => ({ ...f, urgencyLevels: vals }))}
                options={[
                  { value: 'CRITICAL', label: '特急' },
                  { value: 'URGENT', label: '紧急' },
                  { value: 'NORMAL', label: '普通' },
                ]}
                maxTagCount={1}
              />
            </Col>
            <Col span={3}>
              <Select
                placeholder="基地来源"
                style={{ width: '100%' }}
                value={filters.baseSource || undefined}
                onChange={(val) => setFilters((f) => ({ ...f, baseSource: val || '' }))}
                allowClear
                options={['华东基地', '华南基地', '华北基地', '西南基地'].map((b) => ({
                  value: b,
                  label: b,
                }))}
              />
            </Col>
            <Col span={2}>
              <Space>
                <span style={{ fontSize: 13, color: '#595959' }}>仅缺件</span>
                <Switch
                  size="small"
                  checked={filters.shortageOnly}
                  onChange={(v) => setFilters((f) => ({ ...f, shortageOnly: v }))}
                />
              </Space>
            </Col>
          </Row>
          <Row style={{ marginTop: 12 }}>
            <Col span={4}>
              <Input
                placeholder="VIN码搜索"
                value={filters.vinCode}
                onChange={(e) => setFilters((f) => ({ ...f, vinCode: e.target.value }))}
                allowClear
              />
            </Col>
            <Col span={3} offset={17} style={{ textAlign: 'right' }}>
              <Button onClick={() => setShowFilters(false)} icon={<FilterOutlined />}>
                收起筛选
              </Button>
            </Col>
          </Row>
        </Card>
      )}

      {!showFilters && (
        <div style={{ marginBottom: 16 }}>
          <Button onClick={() => setShowFilters(true)} icon={<FilterOutlined />}>
            展开筛选
          </Button>
        </div>
      )}

      {/* 批量操作栏 */}
      {selectedRowKeys.length > 0 && (
        <Card
          size="small"
          style={{
            marginBottom: 16,
            background: '#FFF3E8',
            border: '1px solid #FFD6A5',
          }}
        >
          <Space>
            <span style={{ fontWeight: 500 }}>
              已选择 <span style={{ color: '#FF6B00' }}>{selectedRowKeys.length}</span> 条订单
            </span>
            {activeTab === 'PENDING_REVIEW' && (
              <Button
                size="small"
                type="primary"
                icon={<CheckCircleOutlined />}
                onClick={() => handleBatchAction('批量审核')}
              >
                批量审核
              </Button>
            )}
            {activeTab === 'SCHEDULING' && (
              <Button size="small" type="primary" onClick={() => handleBatchAction('批量排单')}>
                批量排单
              </Button>
            )}
            {activeTab === 'READY_TO_SHIP' && (
              <Button size="small" icon={<PrinterOutlined />} onClick={() => handleBatchAction('打印发货单')}>
                打印发货单
              </Button>
            )}
            <Button size="small" icon={<DownloadOutlined />} onClick={() => handleBatchAction('导出Excel')}>
              导出 Excel
            </Button>
            <a onClick={() => setSelectedRowKeys([])} style={{ color: '#8C8C8C' }}>
              取消选择
            </a>
          </Space>
        </Card>
      )}

      {/* 数据表格 */}
      <Card>
        <Table
          rowKey="orderNo"
          columns={columns}
          dataSource={filteredOrders}
          rowSelection={{
            selectedRowKeys,
            onChange: setSelectedRowKeys,
          }}
          scroll={{ x: 1400 }}
          size="middle"
          pagination={{
            defaultPageSize: 20,
            showSizeChanger: true,
            pageSizeOptions: ['10', '20', '50', '100'],
            showTotal: (total, range) => `共 ${total} 条，显示第 ${range[0]}-${range[1]} 条`,
          }}
          onRow={(record) => ({
            onClick: () => navigate(`/orders/${record.orderNo}`),
          })}
        />
      </Card>
    </div>
  );
}

// 需要 import 的补充图标
import { PlusOutlined } from '@ant-design/icons';
