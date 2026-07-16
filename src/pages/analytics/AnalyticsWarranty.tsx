import { useState } from 'react';
import { Row, Col, Card, Statistic, Table, Typography, Segmented } from 'antd';
import { WarningOutlined, DollarOutlined, FileTextOutlined } from '@ant-design/icons';
import { Line } from '@ant-design/charts';
import { warrantyCards, warrantyMonthlyTrend, topClaimSkus, supplierQualityRanking } from '../../data/mockData';

const { Title, Text } = Typography;

export default function AnalyticsWarranty() {
  const [tab, setTab] = useState<string>('claims');

  const claimColumns = [
    { title: 'SKU编码', dataIndex: 'skuCode', width: 120, render: (c: string) => <span style={{ fontFamily: 'monospace', fontSize: 12 }}>{c}</span> },
    { title: '商品名称', dataIndex: 'skuName', width: 120 },
    { title: '索赔次数', dataIndex: 'claimCount', width: 80, align: 'center' as const, sorter: (a: any, b: any) => a.claimCount - b.claimCount },
    { title: '索赔金额', dataIndex: 'claimAmount', width: 100, align: 'right' as const, render: (v: number) => `¥${v.toLocaleString()}` },
    { title: '索赔率', dataIndex: 'claimRate', width: 80, align: 'center' as const, render: (v: number) => <span style={{ color: v > 0.5 ? '#E11D48' : '#F59E0B' }}>{v}%</span> },
    { title: '供应商', dataIndex: 'supplier', width: 80 },
  ];

  const supplierColumns = [
    { title: '排名', dataIndex: 'rank', width: 50, render: (v: number) => <Text strong style={{ color: v === 1 ? '#16A34A' : '#8C8C8C' }}>#{v}</Text> },
    { title: '供应商', dataIndex: 'supplier', width: 100 },
    { title: '总销量', dataIndex: 'totalSold', width: 90, align: 'center' as const },
    { title: '索赔次数', dataIndex: 'claims', width: 80, align: 'center' as const },
    { title: '索赔率', dataIndex: 'claimRate', width: 80, align: 'center' as const, render: (v: number) => <span style={{ color: v < 0.3 ? '#16A34A' : v < 0.5 ? '#F59E0B' : '#E11D48', fontWeight: 500 }}>{v}%</span> },
  ];

  return (
    <div>
      <Title level={4} style={{ marginBottom: 16 }}>三包分析</Title>

      {/* KPI */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col span={8}><Card><Statistic title={<span><WarningOutlined style={{ marginRight: 6 }} />三包索赔率</span>} value={warrantyCards.claimRate} precision={1} suffix="%" valueStyle={{ color: '#E11D48' }} /></Card></Col>
        <Col span={8}><Card><Statistic title={<span><FileTextOutlined style={{ marginRight: 6 }} />累计索赔次数</span>} value={warrantyCards.totalClaims} suffix="次" /></Card></Col>
        <Col span={8}><Card><Statistic title={<span><DollarOutlined style={{ marginRight: 6 }} />累计索赔金额</span>} value={warrantyCards.totalAmount} precision={0} prefix="¥" /></Card></Col>
      </Row>

      {/* 月度索赔趋势 */}
      <Card title="月度索赔金额趋势" style={{ marginBottom: 24 }}>
        <Line data={warrantyMonthlyTrend} xField="month" yField="amount" height={250} color="#E11D48" point={{ size: 4 }} areaStyle={{ fill: 'l(270) 0:#ffffff 1:#E11D4820' }} />
      </Card>

      {/* 高频索赔 + 供应商排名 */}
      <Card title={<Segmented options={[{ label: '高频索赔SKU TOP20', value: 'claims' }, { label: '供应商质量排名', value: 'supplier' }]} value={tab} onChange={(v) => setTab(v as string)} />}>
        <Table rowKey={tab === 'claims' ? 'skuCode' : 'supplier'} size="small" pagination={false}
          dataSource={tab === 'claims' ? topClaimSkus : supplierQualityRanking}
          columns={tab === 'claims' ? claimColumns : supplierColumns} scroll={{ y: 400 }} />
      </Card>
    </div>
  );
}
