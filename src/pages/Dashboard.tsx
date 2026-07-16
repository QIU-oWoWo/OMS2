import { useNavigate } from 'react-router-dom';
import { Row, Col, Card, Statistic, Table, Tag, Typography, Space, Segmented } from 'antd';
import {
  ArrowUpOutlined,
  ArrowDownOutlined,
  ShoppingCartOutlined,
  AuditOutlined,
  WarningOutlined,
  RocketOutlined,
  TrophyOutlined,
  PlusOutlined,
  ScanOutlined,
  StockOutlined,
  AlertOutlined,
} from '@ant-design/icons';
import { Column } from '@ant-design/charts';
import type { ColumnsType } from 'antd/es/table';
import { dashboardStats, trendData, alertExceptions } from '../data/mockData';
import { EXCEPTION_TYPE_MAP, PRIORITY_MAP, EXCEPTION_STATUS_MAP } from '../types';
import type { ExceptionDTO } from '../types';

const { Title, Text } = Typography;

export default function Dashboard() {
  const navigate = useNavigate();

  // 趋势图配置
  const chartConfig = {
    data: trendData,
    xField: 'date',
    yField: 'value',
    seriesField: 'type',
    isGroup: true,
    columnStyle: { radius: [4, 4, 0, 0] },
    color: ['#FF6B00', '#16A34A', '#E11D48'],
    legend: { position: 'top' as const },
    label: { position: 'top' as const, style: { fill: '#000000', opacity: 0.6, fontSize: 12 } },
  };

  const trendChartData: { date: string; value: number; type: string }[] = [];
  trendData.forEach((d) => {
    trendChartData.push({ date: d.date, value: d['新增订单'], type: '新增订单' });
    trendChartData.push({ date: d.date, value: d['完成订单'], type: '完成订单' });
    trendChartData.push({ date: d.date, value: d['异常订单'], type: '异常订单' });
  });

  // 异常预警表格列
  const alertColumns: ColumnsType<ExceptionDTO> = [
    {
      title: '异常类型',
      dataIndex: 'exceptionType',
      key: 'exceptionType',
      width: 100,
      render: (type: string) => {
        const info = EXCEPTION_TYPE_MAP[type as keyof typeof EXCEPTION_TYPE_MAP];
        return <Tag color={info?.color}>{info?.label || type}</Tag>;
      },
    },
    {
      title: '关联订单',
      dataIndex: 'orderNo',
      key: 'orderNo',
      width: 180,
      render: (no: string) => (
        <a onClick={() => navigate(`/orders/${no}`)} style={{ color: '#FF6B00' }}>
          {no}
        </a>
      ),
    },
    {
      title: '优先级',
      dataIndex: 'priority',
      key: 'priority',
      width: 90,
      render: (p: string) => {
        const info = PRIORITY_MAP[p as keyof typeof PRIORITY_MAP];
        return <Tag color={info?.color}>{info?.label}</Tag>;
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 80,
      render: (s: string) => EXCEPTION_STATUS_MAP[s as keyof typeof EXCEPTION_STATUS_MAP],
    },
    {
      title: '发现时间',
      dataIndex: 'discoverTime',
      key: 'discoverTime',
      width: 160,
      render: (t: string) => t.replace('T', ' ').substring(0, 16),
    },
    {
      title: '处理人',
      dataIndex: 'handler',
      key: 'handler',
      width: 80,
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      render: () => (
        <Space size="small">
          <a style={{ color: '#FF6B00' }}>处理</a>
          <a>详情</a>
        </Space>
      ),
    },
  ];

  // 快捷操作
  const quickActions = [
    { label: '新建订单', icon: <PlusOutlined />, color: '#FF6B00', path: '/orders' },
    { label: '扫码发货', icon: <ScanOutlined />, color: '#16A34A', path: '/exceptions/logistics' },
    { label: '库存查询', icon: <StockOutlined />, color: '#0284C7', path: '/products' },
    { label: '异常上报', icon: <AlertOutlined />, color: '#E11D48', path: '/exceptions' },
  ];

  return (
    <div>
      {/* 页面标题 */}
      <div style={{ marginBottom: 24 }}>
        <Title level={4} style={{ margin: 0 }}>
          工作台
        </Title>
        <Text type="secondary">欢迎回来，张建国。以下是今日运营概览。</Text>
      </div>

      {/* 核心指标卡片 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={Math.floor(24 / 5)}>
          <Card
            className="stat-card"
            hoverable
            onClick={() => navigate('/orders?status=PENDING_REVIEW')}
            style={{ borderTop: '3px solid #FF6B00' }}
          >
            <Statistic
              title={<span><ShoppingCartOutlined style={{ marginRight: 6 }} />今日新增订单</span>}
              value={dashboardStats.todayOrders.value}
              suffix={
                <span style={{ fontSize: 14, color: dashboardStats.todayOrders.trend > 0 ? '#E11D48' : '#16A34A' }}>
                  {dashboardStats.todayOrders.trend > 0 ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
                  {Math.abs(dashboardStats.todayOrders.trend)}%
                </span>
              }
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={Math.floor(24 / 5)}>
          <Card
            className="stat-card"
            hoverable
            onClick={() => navigate('/orders?status=PENDING_REVIEW')}
            style={{ borderTop: '3px solid #E11D48' }}
          >
            <Statistic
              title={<span><AuditOutlined style={{ marginRight: 6 }} />待审核订单</span>}
              value={dashboardStats.pendingReview.value}
              valueStyle={{ color: dashboardStats.pendingReview.value > 10 ? '#E11D48' : undefined }}
              suffix={
                <span style={{ fontSize: 14, color: dashboardStats.pendingReview.trend > 0 ? '#E11D48' : '#16A34A' }}>
                  {dashboardStats.pendingReview.trend > 0 ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
                  {Math.abs(dashboardStats.pendingReview.trend)}%
                </span>
              }
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={Math.floor(24 / 5)}>
          <Card
            className="stat-card"
            hoverable
            onClick={() => navigate('/exceptions?status=PENDING')}
            style={{ borderTop: '3px solid #F59E0B' }}
          >
            <Statistic
              title={<span><WarningOutlined style={{ marginRight: 6 }} />异常未处理</span>}
              value={dashboardStats.unhandledExceptions.value}
              valueStyle={{ color: '#E11D48' }}
              suffix={
                <span style={{ fontSize: 14, color: dashboardStats.unhandledExceptions.trend > 0 ? '#E11D48' : '#16A34A' }}>
                  {dashboardStats.unhandledExceptions.trend > 0 ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
                  {Math.abs(dashboardStats.unhandledExceptions.trend)}%
                </span>
              }
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={Math.floor(24 / 5)}>
          <Card
            className="stat-card"
            hoverable
            onClick={() => navigate('/exceptions/logistics')}
            style={{ borderTop: '3px solid #16A34A' }}
          >
            <Statistic
              title={<span><RocketOutlined style={{ marginRight: 6 }} />今日发货完成率</span>}
              value={dashboardStats.todayShipRate.value}
              precision={1}
              suffix="%"
              valueStyle={{ color: dashboardStats.todayShipRate.value > 80 ? '#16A34A' : '#F59E0B' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={Math.floor(24 / 5)}>
          <Card
            className="stat-card"
            hoverable
            onClick={() => navigate('/analytics')}
            style={{ borderTop: '3px solid #0284C7' }}
          >
            <Statistic
              title={<span><TrophyOutlined style={{ marginRight: 6 }} />本周达成率</span>}
              value={dashboardStats.weeklyAchievement.value}
              precision={1}
              suffix="%"
              valueStyle={{ color: dashboardStats.weeklyAchievement.value > 90 ? '#16A34A' : '#F59E0B' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 快捷操作 + 图表 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} md={6}>
          <Card title="快捷操作" style={{ height: '100%' }}>
            <Row gutter={[12, 12]}>
              {quickActions.map((action) => (
                <Col span={12} key={action.label}>
                  <div
                    onClick={() => navigate(action.path)}
                    style={{
                      cursor: 'pointer',
                      textAlign: 'center',
                      padding: '16px 8px',
                      borderRadius: 8,
                      background: '#FAFAFA',
                      border: '1px solid #F0F0F0',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = action.color;
                      e.currentTarget.style.background = '#FFF3E8';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = '#F0F0F0';
                      e.currentTarget.style.background = '#FAFAFA';
                    }}
                  >
                    <div style={{ fontSize: 24, color: action.color, marginBottom: 8 }}>{action.icon}</div>
                    <div style={{ fontSize: 13, color: '#595959' }}>{action.label}</div>
                  </div>
                </Col>
              ))}
            </Row>
          </Card>
        </Col>
        <Col xs={24} md={18}>
          <Card
            title="订单趋势"
            extra={
              <Segmented
                size="small"
                options={['日', '周', '月']}
                defaultValue="日"
              />
            }
          >
            <Column
              data={trendChartData}
              xField="date"
              yField="value"
              seriesField="type"
              isGroup
              height={260}
              columnStyle={{ radius: [4, 4, 0, 0] }}
              color={['#FF6B00', '#16A34A', '#E11D48']}
              legend={{ position: 'top' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 异常预警列表 */}
      <Card
        title={
          <Space>
            <span>异常预警</span>
            <Tag color="error">{dashboardStats.unhandledExceptions.value} 条待处理</Tag>
          </Space>
        }
        extra={<a onClick={() => navigate('/exceptions')}>查看全部 →</a>}
      >
        <Table
          columns={alertColumns}
          dataSource={alertExceptions}
          rowKey="exceptionNo"
          size="small"
          pagination={false}
          scroll={{ x: 800 }}
          onRow={(record) => ({
            onClick: () => navigate(`/exceptions`),
          })}
        />
      </Card>
    </div>
  );
}
