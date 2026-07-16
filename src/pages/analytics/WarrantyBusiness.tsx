import { useState } from 'react';
import { Row, Col, Card, Statistic, Table, Tag, Typography, Select, Segmented, Tabs } from 'antd';
import { ArrowUpOutlined, ArrowDownOutlined, CheckCircleOutlined, ShopOutlined, PercentageOutlined, GlobalOutlined } from '@ant-design/icons';
import { Column, Line, Bar } from '@ant-design/charts';
import type { ColumnsType } from 'antd/es/table';
import { warrantyBizKpis, warrantyCompletionTrend, quarterlyWarranty, hourlyOrders, weeklyOrders, nearbyHotSkus, regionRanking, hotSalesSkus } from '../../data/mockData';

const { Title, Text } = Typography;

export default function WarrantyBusiness() {
  const [periodMode, setPeriodMode] = useState('monthly');
  const [hotTab, setHotTab] = useState('volume');

  const trendData = periodMode === 'monthly' ? warrantyCompletionTrend : quarterlyWarranty;
  const periodKey = periodMode === 'monthly' ? 'period' : 'quarter';

  const chartData = (trendData as typeof warrantyCompletionTrend).flatMap((d: any) => [
    { period: d[periodKey], value: d['三包完成'], type: '三包完成' },
    { period: d[periodKey], value: d['非三包完成'], type: '非三包完成' },
    { period: d[periodKey], value: d['二网三包'] + d['二网非三包'], type: '二网订单合计' },
  ]);

  const regionCols: ColumnsType<typeof regionRanking[number]> = [
    { title: '排名', dataIndex: 'share', width: 50, render: (_: any, __: any, i: number) => <Text strong style={{ color: i === 0 ? '#FF6B00' : '#8C8C8C' }}>#{i + 1}</Text> },
    { title: '省份', dataIndex: 'region', width: 80 },
    { title: '订单量', dataIndex: 'orders', width: 70, align: 'center' },
    { title: '销售额', dataIndex: 'amount', width: 100, align: 'right', render: (v: number) => `¥${(v / 10000).toFixed(1)}万` },
    { title: '环比', dataIndex: 'growth', width: 70, align: 'center', render: (v: number) => <span style={{ color: v > 0 ? '#16A34A' : '#E11D48' }}>{v > 0 ? <ArrowUpOutlined /> : <ArrowDownOutlined />} {Math.abs(v)}%</span> },
    { title: '占比', dataIndex: 'share', width: 60, align: 'center', render: (v: number) => `${v}%` },
  ];

  const nearbyCols: ColumnsType<typeof nearbyHotSkus[number]> = [
    { title: '#', dataIndex: 'rank', width: 40 },
    { title: 'SKU', dataIndex: 'skuCode', width: 110, render: (c: string) => <span style={{ fontFamily: 'monospace', fontSize: 12 }}>{c}</span> },
    { title: '商品名称', dataIndex: 'skuName', width: 130 },
    { title: '销量', dataIndex: 'sales', width: 60, align: 'center' },
    { title: '环比', dataIndex: 'growth', width: 70, align: 'center', render: (v: number) => <span style={{ color: v > 0 ? '#16A34A' : '#E11D48' }}>{v > 0 ? <ArrowUpOutlined /> : <ArrowDownOutlined />} {Math.abs(v)}%</span> },
  ];

  const hotCols: ColumnsType<typeof hotSalesSkus[number]> = [
    { title: '#', dataIndex: 'rank', width: 40 },
    { title: 'SKU编码', dataIndex: 'skuCode', width: 110, render: (c: string) => <span style={{ fontFamily: 'monospace', fontSize: 12 }}>{c}</span> },
    { title: '商品名称', dataIndex: 'skuName', width: 120 },
    ...(hotTab === 'volume' ? [
      { title: '销量', dataIndex: 'salesVolume', width: 70, align: 'center' as const, sorter: (a: any, b: any) => a.salesVolume - b.salesVolume },
    ] : [
      { title: '销售额', dataIndex: 'salesAmount', width: 90, align: 'right' as const, render: (v: number) => `¥${v.toLocaleString()}` },
    ]),
    { title: '环比', dataIndex: 'growth', width: 70, align: 'center' as const, render: (v: number) => <span style={{ color: v > 0 ? '#16A34A' : '#E11D48' }}>{v > 0 ? '+' : ''}{v}%</span> },
    { title: '供应商', dataIndex: 'supplier', width: 80 },
  ];

  return (
    <div>
      <Title level={4} style={{ marginBottom: 16 }}>三包与经营数据</Title>

      {/* KPI */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col span={6}><Card><Statistic title={<span><CheckCircleOutlined style={{ marginRight: 6 }} />月三包完成量</span>} value={warrantyBizKpis.monthWarrantyDone.value} suffix={<span style={{ fontSize: 14, color: '#16A34A' }}><ArrowUpOutlined /> {warrantyBizKpis.monthWarrantyDone.trend}%</span>} /></Card></Col>
        <Col span={6}><Card><Statistic title={<span><ShopOutlined style={{ marginRight: 6 }} />月非三包完成量</span>} value={warrantyBizKpis.monthNonWarrantyDone.value} suffix={<span style={{ fontSize: 14, color: '#16A34A' }}><ArrowUpOutlined /> {warrantyBizKpis.monthNonWarrantyDone.trend}%</span>} valueStyle={{ color: '#FF6B00' }} /></Card></Col>
        <Col span={6}><Card><Statistic title={<span><PercentageOutlined style={{ marginRight: 6 }} />三包占比</span>} value={warrantyBizKpis.warrantyRatio.value} suffix={<span style={{ fontSize: 14, color: '#16A34A' }}><ArrowDownOutlined /> {Math.abs(warrantyBizKpis.warrantyRatio.trend)}%</span>} /></Card></Col>
        <Col span={6}><Card><Statistic title={<span><GlobalOutlined style={{ marginRight: 6 }} />二网订单占比</span>} value={warrantyBizKpis.tier2OrderRatio.value} suffix={<span style={{ fontSize: 14, color: '#16A34A' }}><ArrowUpOutlined /> {warrantyBizKpis.tier2OrderRatio.trend}%</span>} valueStyle={{ color: '#0284C7' }} /></Card></Col>
      </Row>

      {/* 三包/非三包趋势 */}
      <Card title="三包与非三包完成量趋势（含二网拆分）" style={{ marginBottom: 24 }}
        extra={<Segmented size="small" options={[{ label: '月度', value: 'monthly' }, { label: '季度', value: 'quarterly' }]} value={periodMode} onChange={(v) => setPeriodMode(v as string)} />}>
        <Column data={chartData} xField="period" yField="value" seriesField="type" isGroup height={280} color={['#E11D48', '#16A34A', '#0284C7']} legend={{ position: 'top' }} />
      </Card>

      {/* 下单习惯 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col span={12}>
          <Card title="下单时段分布（按小时）" size="small">
            <Column data={hourlyOrders} xField="hour" yField="count" height={220} color="#FF6B00" label={{ position: 'top', style: { fontSize: 10 } }} />
          </Card>
        </Col>
        <Col span={12}>
          <Card title="下单分布（按周几）" size="small">
            <Column data={weeklyOrders} xField="day" yField="count" height={220} color="#0284C7" label={{ position: 'top', style: { fontSize: 12 } }} />
          </Card>
        </Col>
      </Row>

      {/* 周边热销 + 区域排行 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col span={10}>
          <Card title="周边热销 TOP10" size="small" extra={<Select size="small" defaultValue="hangzhou" options={[{ value: 'hangzhou', label: '杭州为中心' }]} />}>
            <Table rowKey="rank" size="small" columns={nearbyCols} dataSource={nearbyHotSkus} pagination={false} />
          </Card>
        </Col>
        <Col span={14}>
          <Card title="区域排行" size="small">
            <Table rowKey="region" size="small" columns={regionCols} dataSource={regionRanking} pagination={false} />
          </Card>
        </Col>
      </Row>

      {/* 热销排行 */}
      <Card title="热销排行 TOP20" extra={
        <Segmented size="small" options={[{ label: '按销量', value: 'volume' }, { label: '按销售额', value: 'amount' }]} value={hotTab} onChange={(v) => setHotTab(v as string)} />
      }>
        <Table rowKey="rank" size="small" columns={hotCols} dataSource={hotSalesSkus} pagination={{ pageSize: 10, showTotal: (t) => `共 ${t} 条` }} />
      </Card>
    </div>
  );
}
