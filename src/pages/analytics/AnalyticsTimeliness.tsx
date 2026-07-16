import { useNavigate } from 'react-router-dom';
import { Row, Col, Card, Statistic, Table, Typography, Space, Segmented } from 'antd';
import { ArrowUpOutlined, TrophyOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { Column, Bar, Line } from '@ant-design/charts';
import { timelinessCards, stageTimeData, exceptionTop10, baseRanking, satisfactionTrend } from '../../data/mockData';

const { Title, Text } = Typography;

export default function AnalyticsTimeliness() {
  const navigate = useNavigate();

  const stageChartData = stageTimeData.flatMap((d) => [
    { stage: d.stage, value: d['华东基地'], base: '华东基地' },
    { stage: d.stage, value: d['华南基地'], base: '华南基地' },
    { stage: d.stage, value: d['华北基地'], base: '华北基地' },
    { stage: d.stage, value: d['西南基地'], base: '西南基地' },
  ]);

  return (
    <div>
      <Title level={4} style={{ marginBottom: 16 }}>时效看板</Title>

      {/* KPI 卡片 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col span={12}>
          <Card><Statistic title={<span><TrophyOutlined style={{ marginRight: 6 }} />今日订单达成率</span>} value={timelinessCards.todayAchievement.value} precision={1} suffix={<span style={{ fontSize: 14, color: '#16A34A' }}><ArrowUpOutlined /> {timelinessCards.todayAchievement.trend}%</span>} valueStyle={{ color: '#16A34A' }} /></Card>
        </Col>
        <Col span={12}>
          <Card><Statistic title={<span><ClockCircleOutlined style={{ marginRight: 6 }} />平均履约时长</span>} value={timelinessCards.avgFulfillHours.value} precision={1} suffix={<span style={{ fontSize: 14, color: '#16A34A' }}><ArrowUpOutlined /> {Math.abs(timelinessCards.avgFulfillHours.trend)}%</span>} valueStyle={{ color: '#FF6B00' }} /></Card>
        </Col>
      </Row>

      {/* 各环节耗时 + 异常TOP10 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col span={16}>
          <Card title="各环节耗时分布（小时）" extra={<Segmented size="small" options={['日', '周', '月']} defaultValue="周" />}>
            <Column data={stageChartData} xField="stage" yField="value" seriesField="base" isGroup height={280} color={['#FF6B00', '#0284C7', '#16A34A', '#7C3AED']} legend={{ position: 'top' }} />
          </Card>
        </Col>
        <Col span={8}>
          <Card title="异常类型 TOP10">
            <Bar data={exceptionTop10} xField="count" yField="type" height={280} color="#E11D48" legend={false} label={{ position: 'right', style: { fontSize: 12 } }}
              onReady={(plot) => { plot.on('element:click', () => navigate('/exceptions')); }} />
          </Card>
        </Col>
      </Row>

      {/* 基地排名 + 满意度 */}
      <Row gutter={[16, 16]}>
        <Col span={12}>
          <Card title="基地时效排名" size="small">
            <Table rowKey="base" size="small" pagination={false} dataSource={baseRanking}
              columns={[
                { title: '排名', dataIndex: 'rank', width: 50, render: (v: number) => <Text strong style={{ color: v === 1 ? '#FF6B00' : '#8C8C8C' }}>#{v}</Text> },
                { title: '基地', dataIndex: 'base', width: 80 },
                { title: '达成率', dataIndex: 'achievement', width: 80, render: (v: number) => <span style={{ color: v > 95 ? '#16A34A' : '#F59E0B' }}>{v}%</span> },
                { title: '平均时长(h)', dataIndex: 'avgHours', width: 100 },
              ]} />
          </Card>
        </Col>
        <Col span={12}>
          <Card title="经销商满意度趋势" size="small">
            <Line data={satisfactionTrend} xField="month" yField="score" height={200} color="#FF6B00" point={{ size: 4 }} yAxis={{ min: 3.5, max: 5 }} />
          </Card>
        </Col>
      </Row>
    </div>
  );
}
