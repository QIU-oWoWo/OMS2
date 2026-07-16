import { Card, Table, Typography, Row, Col, Statistic, Segmented } from 'antd';
import { DollarOutlined, CheckCircleOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { Line } from '@ant-design/charts';
import type { ColumnsType } from 'antd/es/table';
import { dealerMonthlyStats, agingData, paymentTrend } from '../../data/mockData';

const { Title } = Typography;

export default function ReconciliationReports() {
  const agingColumns: ColumnsType<typeof agingData[number]> = [
    { title: '经销商', dataIndex: 'dealer', width: 150 },
    { title: '30天内', dataIndex: 'within30', width: 100, align: 'right', render: (v: number) => <span style={{ color: '#16A34A' }}>¥{v.toLocaleString()}</span> },
    { title: '30-60天', dataIndex: 'days30to60', width: 100, align: 'right', render: (v: number) => v > 0 ? <span style={{ color: '#F59E0B' }}>¥{v.toLocaleString()}</span> : <span style={{ color: '#8C8C8C' }}>-</span> },
    { title: '60-90天', dataIndex: 'days60to90', width: 100, align: 'right', render: (v: number) => v > 0 ? <span style={{ color: '#E11D48' }}>¥{v.toLocaleString()}</span> : <span style={{ color: '#8C8C8C' }}>-</span> },
    { title: '90天以上', dataIndex: 'over90', width: 100, align: 'right', render: (v: number) => v > 0 ? <span style={{ color: '#E11D48', fontWeight: 500 }}>¥{v.toLocaleString()}</span> : <span style={{ color: '#8C8C8C' }}>-</span> },
  ];

  return (
    <div>
      <Title level={4} style={{ marginBottom: 16 }}>结算报表</Title>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col span={8}><Card><Statistic title={<span><DollarOutlined style={{ marginRight: 6 }} />本月回款总额</span>} value={980000} prefix="¥" /></Card></Col>
        <Col span={8}><Card><Statistic title={<span><CheckCircleOutlined style={{ marginRight: 6 }} />本月回款率</span>} value={93.5} suffix="%" valueStyle={{ color: '#16A34A' }} /></Card></Col>
        <Col span={8}><Card><Statistic title={<span><ClockCircleOutlined style={{ marginRight: 6 }} />超90天应收</span>} value={0} prefix="¥" valueStyle={{ color: '#16A34A' }} /></Card></Col>
      </Row>

      <Card title="回款趋势" style={{ marginBottom: 24 }}>
        <Line data={paymentTrend} xField="month" yField="amount" height={250} color="#FF6B00" point={{ size: 4 }} />
      </Card>

      <Card title="应收账款账龄分析" style={{ marginBottom: 24 }}>
        <Table rowKey="dealer" columns={agingColumns} dataSource={agingData} size="middle" pagination={false} />
      </Card>
    </div>
  );
}
