import { Row, Col, Card, Statistic, Table, Typography, Segmented } from 'antd';
import { ArrowUpOutlined, ShoppingCartOutlined, CalendarOutlined, RiseOutlined, ThunderboltOutlined } from '@ant-design/icons';
import { Line } from '@ant-design/charts';
import type { ColumnsType } from 'antd/es/table';
import { forecastKpis, orderHistory30, forecast7Days, eventImpact } from '../../data/mockData';

const { Title, Text } = Typography;

export default function OrderForecast() {
  // 30天实际vs预测合并数据
  const trendData = orderHistory30.flatMap((d) => [
    { date: d.date, value: d.actual, type: '实际订单量' },
    { date: d.date, value: d.predicted, type: '预测订单量' },
  ]);

  const forecastCols: ColumnsType<typeof forecast7Days[number]> = [
    { title: '日期', dataIndex: 'date', width: 80 },
    { title: '预测值', dataIndex: 'predicted', width: 70, align: 'center', render: (v: number) => <Text strong>{v}</Text> },
    { title: '下限', dataIndex: 'lowerBound', width: 70, align: 'center', render: (v: number) => <Text type="secondary">{v}</Text> },
    { title: '上限', dataIndex: 'upperBound', width: 70, align: 'center', render: (v: number) => <Text type="secondary">{v}</Text> },
  ];

  const impactCols: ColumnsType<typeof eventImpact[number]> = [
    { title: '事件', dataIndex: 'event', width: 100 },
    { title: '时间', dataIndex: 'period', width: 160 },
    { title: '影响系数', dataIndex: 'impactCoefficient', width: 80, align: 'center', render: (v: number) => <Text strong style={{ color: v > 1 ? '#16A34A' : v < 0.5 ? '#E11D48' : '#F59E0B' }}>{v.toFixed(2)}x</Text> },
    { title: '效果', dataIndex: 'effect', width: 140 },
  ];

  return (
    <div>
      <Title level={4} style={{ marginBottom: 16 }}>订单量预测</Title>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col span={6}><Card><Statistic title={<span><ShoppingCartOutlined style={{ marginRight: 6 }} />今日订单量</span>} value={forecastKpis.todayOrders.value} suffix={<span style={{ fontSize: 14, color: '#16A34A' }}><ArrowUpOutlined /> {forecastKpis.todayOrders.trend}%</span>} /></Card></Col>
        <Col span={6}><Card><Statistic title={<span><CalendarOutlined style={{ marginRight: 6 }} />本月累计</span>} value={forecastKpis.monthTotal.value} suffix={<span style={{ fontSize: 14, color: '#16A34A' }}><ArrowUpOutlined /> {forecastKpis.monthTotal.trend}%</span>} /></Card></Col>
        <Col span={6}><Card><Statistic title={<span><RiseOutlined style={{ marginRight: 6 }} />环比增长率</span>} value={forecastKpis.growthRate.value} suffix="%" valueStyle={{ color: '#16A34A' }} /></Card></Col>
        <Col span={6}><Card><Statistic title={<span><ThunderboltOutlined style={{ marginRight: 6 }} />预测明日订单</span>} value={forecastKpis.tomorrowPrediction.value} suffix={<Text type="secondary" style={{ fontSize: 13 }}>{forecastKpis.tomorrowPrediction.confidence}</Text>} valueStyle={{ color: '#FF6B00' }} /></Card></Col>
      </Row>

      {/* 实际 vs 预测趋势 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col span={16}>
          <Card title="近30天订单趋势（实际 vs 预测）">
            <Line data={trendData} xField="date" yField="value" seriesField="type" height={280} color={['#FF6B00', '#0284C7']} lineStyle={{ lineWidth: 3 }} point={{ size: 3 }} legend={{ position: 'top' }} />
          </Card>
        </Col>
        <Col span={8}>
          <Card title="未来7天预测" size="small">
            <Table rowKey="date" size="small" columns={forecastCols} dataSource={forecast7Days} pagination={false} />
          </Card>
        </Col>
      </Row>

      {/* 影响因素表 */}
      <Card title="节假日/促销活动影响系数">
        <Table rowKey="event" size="small" columns={impactCols} dataSource={eventImpact} pagination={false} />
      </Card>
    </div>
  );
}
