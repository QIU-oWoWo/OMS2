import { useState } from 'react';
import { Row, Col, Card, Statistic, Table, Typography, Segmented } from 'antd';
import { ArrowUpOutlined, ArrowDownOutlined, ClockCircleOutlined, CarOutlined, WarningOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { Column, Line } from '@ant-design/charts';
import type { ColumnsType } from 'antd/es/table';
import { fulfillmentKpis, stageTimeDetail, deliveryDistribution, exceptionRateTrend, logisticsRanking } from '../../data/mockData';

const { Title, Text } = Typography;

export default function FulfillmentEfficiency() {
  const [deliveryView, setDeliveryView] = useState('base');

  const stageData = stageTimeDetail.flatMap((d) => [
    { stage: d.stage, value: d['华东基地'], base: '华东基地' },
    { stage: d.stage, value: d['华南基地'], base: '华南基地' },
    { stage: d.stage, value: d['华北基地'], base: '华北基地' },
    { stage: d.stage, value: d['西南基地'], base: '西南基地' },
  ]);

  const deliveryData = deliveryDistribution.flatMap((d) => [
    { period: d.period, value: d['华东基地'], base: '华东基地' },
    { period: d.period, value: d['华南基地'], base: '华南基地' },
    { period: d.period, value: d['华北基地'], base: '华北基地' },
    { period: d.period, value: d['西南基地'], base: '西南基地' },
  ]);

  const exceptionData = exceptionRateTrend.flatMap((d) => [
    { date: d.date, value: d['缺货'], type: '缺货' },
    { date: d.date, value: d['破损'], type: '破损' },
    { date: d.date, value: d['超时'], type: '超时' },
    { date: d.date, value: d['其他'], type: '其他' },
  ]);

  const rankCols: ColumnsType<typeof logisticsRanking[number]> = [
    { title: '物流公司', dataIndex: 'company', width: 100 },
    { title: '平均时长(h)', dataIndex: 'avgHours', width: 100, align: 'center', sorter: (a, b) => a.avgHours - b.avgHours },
    { title: '准时交付率', dataIndex: 'onTimeRate', width: 100, align: 'center', render: (v: number) => <span style={{ color: v > 95 ? '#16A34A' : v > 90 ? '#F59E0B' : '#E11D48', fontWeight: 500 }}>{v}%</span> },
    { title: '承运单数', dataIndex: 'orderCount', width: 80, align: 'center' },
  ];

  return (
    <div>
      <Title level={4} style={{ marginBottom: 16 }}>履约效率分析</Title>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col span={6}><Card><Statistic title={<span><ClockCircleOutlined style={{ marginRight: 6 }} />平均处理时长</span>} value={fulfillmentKpis.avgProcessHours.value} precision={1} suffix={<span style={{ fontSize: 14, color: '#16A34A' }}><ArrowDownOutlined /> {Math.abs(fulfillmentKpis.avgProcessHours.trend)}%</span>} valueStyle={{ color: '#FF6B00' }} /></Card></Col>
        <Col span={6}><Card><Statistic title={<span><CarOutlined style={{ marginRight: 6 }} />平均配送时效</span>} value={fulfillmentKpis.avgDeliveryHours.value} precision={1} suffix={<span style={{ fontSize: 14, color: '#16A34A' }}><ArrowDownOutlined /> {Math.abs(fulfillmentKpis.avgDeliveryHours.trend)}%</span>} /></Card></Col>
        <Col span={6}><Card><Statistic title={<span><WarningOutlined style={{ marginRight: 6 }} />异常率</span>} value={fulfillmentKpis.exceptionRate.value} precision={1} suffix={<span style={{ fontSize: 14, color: '#16A34A' }}><ArrowDownOutlined /> {Math.abs(fulfillmentKpis.exceptionRate.trend)}%</span>} valueStyle={{ color: '#E11D48' }} /></Card></Col>
        <Col span={6}><Card><Statistic title={<span><CheckCircleOutlined style={{ marginRight: 6 }} />准时交付率</span>} value={fulfillmentKpis.onTimeRate.value} precision={1} suffix={<span style={{ fontSize: 14, color: '#16A34A' }}><ArrowUpOutlined /> {fulfillmentKpis.onTimeRate.trend}%</span>} valueStyle={{ color: '#16A34A' }} /></Card></Col>
      </Row>

      {/* 各环节耗时 */}
      <Card title="各环节平均耗时（小时）- 按基地对比" style={{ marginBottom: 24 }}>
        <Column data={stageData} xField="stage" yField="value" seriesField="base" isGroup height={280} color={['#FF6B00', '#0284C7', '#16A34A', '#7C3AED']} legend={{ position: 'top' }} />
      </Card>

      {/* 配送时效分布 */}
      <Card title="配送时效分布（按基地）" style={{ marginBottom: 24 }} extra={<Segmented size="small" options={[{ label: '按基地', value: 'base' }, { label: '按物流公司', value: 'company' }]} value={deliveryView} onChange={(v) => setDeliveryView(v as string)} />}>
        <Column data={deliveryData} xField="period" yField="value" seriesField="base" isGroup height={260} color={['#FF6B00', '#0284C7', '#16A34A', '#7C3AED']} legend={{ position: 'top' }} />
      </Card>

      {/* 异常率趋势 + 物流排行 */}
      <Row gutter={[16, 16]}>
        <Col span={14}>
          <Card title="近30天异常率趋势（按类型）" size="small">
            <Line data={exceptionData} xField="date" yField="value" seriesField="type" height={240} color={['#E11D48', '#F59E0B', '#D97706', '#8C8C8C']} legend={{ position: 'top' }} />
          </Card>
        </Col>
        <Col span={10}>
          <Card title="物流公司时效排行" size="small">
            <Table rowKey="company" size="small" columns={rankCols} dataSource={logisticsRanking} pagination={false} />
          </Card>
        </Col>
      </Row>
    </div>
  );
}
