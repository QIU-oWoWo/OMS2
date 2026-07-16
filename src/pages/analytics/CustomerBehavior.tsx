import { Row, Col, Card, Statistic, Table, Tag, Typography } from 'antd';
import { ArrowUpOutlined, ArrowDownOutlined, UserOutlined, DollarOutlined, TeamOutlined, AppstoreOutlined } from '@ant-design/icons';
import { Line, Column, Pie } from '@ant-design/charts';
import type { ColumnsType } from 'antd/es/table';
import { behaviorKpis, repurchaseTrend, avgOrderDistribution, categoryPreference, dealerRFM } from '../../data/mockData';

const { Title, Text } = Typography;

export default function CustomerBehavior() {
  const pieData = categoryPreference.map((c) => ({ type: c.category, value: c.share }));

  const categoryCols: ColumnsType<typeof categoryPreference[number]> = [
    { title: '品类', dataIndex: 'category', width: 90 },
    { title: '销量', dataIndex: 'sales', width: 80, align: 'center' },
    { title: '占比', dataIndex: 'share', width: 70, align: 'center', render: (v: number) => `${v}%` },
    { title: '环比', dataIndex: 'growth', width: 80, align: 'center', render: (v: number) => <span style={{ color: v > 0 ? '#16A34A' : '#E11D48' }}>{v > 0 ? <ArrowUpOutlined /> : <ArrowDownOutlined />} {Math.abs(v)}%</span> },
  ];

  const rfmCols: ColumnsType<typeof dealerRFM[number]> = [
    { title: '经销商', dataIndex: 'dealer', width: 150 },
    { title: '购买频次', dataIndex: 'frequency', width: 80, align: 'center' },
    { title: '消费金额', dataIndex: 'monetary', width: 100, align: 'right', render: (v: number) => `¥${v.toLocaleString()}` },
    { title: '最近购买', dataIndex: 'recency', width: 80 },
    { title: '分层', dataIndex: 'tier', width: 90, render: (v: string) => <Tag color={v === '高价值' ? '#16A34A' : v === '中价值' ? '#F59E0B' : '#8C8C8C'}>{v}</Tag> },
  ];

  return (
    <div>
      <Title level={4} style={{ marginBottom: 16 }}>客户购买行为分析</Title>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col span={6}><Card><Statistic title={<span><UserOutlined style={{ marginRight: 6 }} />整体复购率</span>} value={behaviorKpis.repurchaseRate.value} suffix={<span style={{ fontSize: 14, color: '#16A34A' }}><ArrowUpOutlined /> {behaviorKpis.repurchaseRate.trend}%</span>} valueStyle={{ color: '#FF6B00' }} /></Card></Col>
        <Col span={6}><Card><Statistic title={<span><DollarOutlined style={{ marginRight: 6 }} />月均客单价</span>} value={behaviorKpis.avgOrderValue.value} prefix="¥" suffix={<span style={{ fontSize: 14, color: '#16A34A' }}><ArrowUpOutlined /> {behaviorKpis.avgOrderValue.trend}%</span>} /></Card></Col>
        <Col span={6}><Card><Statistic title={<span><TeamOutlined style={{ marginRight: 6 }} />活跃经销商</span>} value={behaviorKpis.activeDealers.value} suffix={<span style={{ fontSize: 14, color: '#16A34A' }}><ArrowUpOutlined /> {behaviorKpis.activeDealers.trend}%</span>} /></Card></Col>
        <Col span={6}><Card><Statistic title={<span><AppstoreOutlined style={{ marginRight: 6 }} />SKU动销率</span>} value={behaviorKpis.skuActiveRate.value} suffix={<span style={{ fontSize: 14, color: '#E11D48' }}><ArrowDownOutlined /> {Math.abs(behaviorKpis.skuActiveRate.trend)}%</span>} valueStyle={{ color: '#F59E0B' }} /></Card></Col>
      </Row>

      {/* 复购率趋势 + 客单价分布 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col span={12}>
          <Card title="近7月复购率趋势 (%)" size="small">
            <Line data={repurchaseTrend} xField="month" yField="rate" height={220} color="#FF6B00" point={{ size: 4 }} />
          </Card>
        </Col>
        <Col span={12}>
          <Card title="客单价区间分布（经销商数）" size="small">
            <Column data={avgOrderDistribution} xField="range" yField="count" height={220} color="#0284C7" label={{ position: 'top', style: { fontSize: 12 } }} />
          </Card>
        </Col>
      </Row>

      {/* 偏好品类 + 经销商分层 */}
      <Row gutter={[16, 16]}>
        <Col span={10}>
          <Card title="品类销量占比" size="small">
            <Pie data={pieData} angleField="value" colorField="type" height={240} radius={0.8} label={{ type: 'outer', content: '{name} {percentage}' }} />
          </Card>
        </Col>
        <Col span={14}>
          <Card title="品类偏好排名" size="small">
            <Table rowKey="category" size="small" columns={categoryCols} dataSource={categoryPreference} pagination={false} />
          </Card>
        </Col>
      </Row>

      <Card title="经销商RFM分层" style={{ marginTop: 16 }}>
        <Table rowKey="dealer" size="small" columns={rfmCols} dataSource={dealerRFM} pagination={false} />
      </Card>
    </div>
  );
}
