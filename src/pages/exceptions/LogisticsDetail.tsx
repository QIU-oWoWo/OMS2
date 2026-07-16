import { useParams, useNavigate } from 'react-router-dom';
import { Card, Descriptions, Tag, Button, Space, Typography, Row, Col, Breadcrumb, Timeline, Statistic } from 'antd';
import { ArrowLeftOutlined, EnvironmentOutlined, ClockCircleOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { mockTrackingList } from '../../data/mockData';
import { TRACK_STATUS_MAP } from '../../types';
import type { TrackStatus } from '../../types';

const { Title, Text } = Typography;

export default function LogisticsDetail() {
  const { trackingNo } = useParams<{ trackingNo: string }>();
  const navigate = useNavigate();
  const tracking = mockTrackingList.find((t) => t.trackingNo === trackingNo);
  if (!tracking) return <div style={{ textAlign: 'center', padding: 80 }}><Title level={3} type="secondary">运单未找到</Title><Button type="link" onClick={() => navigate('/exceptions/logistics')}>返回列表</Button></div>;

  const statusInfo = TRACK_STATUS_MAP[tracking.trackStatus as TrackStatus];
  const isDelivered = tracking.trackStatus === 'DELIVERED';

  return (
    <div>
      <Breadcrumb style={{ marginBottom: 16 }} items={[{ title: <a onClick={() => navigate('/exceptions/logistics')}>运单查询</a> }, { title: `轨迹 ${tracking.trackingNo}` }]} />

      {/* 头部 */}
      <Card style={{ marginBottom: 16 }}>
        <Space size="large" align="start">
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/exceptions/logistics')} />
          <div>
            <Title level={4} style={{ margin: 0 }}>运单 {tracking.trackingNo} <Tag color={statusInfo?.color}>{statusInfo?.label}</Tag></Title>
            <Space size={16} style={{ marginTop: 8 }}>
              <Text type="secondary">物流公司: {tracking.logisticsCompany}</Text>
              <Text type="secondary">关联订单: <a onClick={() => navigate(`/orders/${tracking.orderNo}`)}>{tracking.orderNo}</a></Text>
              <Text type="secondary">发货仓库: {tracking.warehouseName}</Text>
            </Space>
          </div>
        </Space>
      </Card>

      <Row gutter={16}>
        {/* 轨迹时间线 */}
        <Col span={16}>
          <Card title={<Space><EnvironmentOutlined />物流轨迹</Space>} size="small" style={{ marginBottom: 16 }}>
            <Timeline
              items={tracking.nodes.map((node, i) => ({
                color: i === 0 ? '#FF6B00' : i === tracking.nodes.length - 1 && isDelivered ? '#16A34A' : '#0284C7',
                children: (
                  <div>
                    <Text style={{ fontSize: 14 }}>{node.description}</Text>
                    <br />
                    <Text type="secondary" style={{ fontSize: 12 }}>{node.time.replace('T', ' ').substring(0, 19)}</Text>
                    <br />
                    <Text type="secondary" style={{ fontSize: 12 }}>{node.location}</Text>
                  </div>
                ),
              }))}
            />
          </Card>
        </Col>

        <Col span={8}>
          {/* 时效预估 */}
          <Card size="small" style={{ marginBottom: 16 }}>
            <Statistic
              title={<Space><ClockCircleOutlined />预计送达</Space>}
              value={isDelivered ? '已签收' : tracking.estimatedDelivery ? dayjs(tracking.estimatedDelivery).format('MM-DD HH:mm') : '-'}
              valueStyle={{ color: isDelivered ? '#16A34A' : '#FF6B00', fontSize: 20 }}
            />
            {!isDelivered && tracking.estimatedDelivery && dayjs(tracking.estimatedDelivery).isBefore(dayjs()) && (
              <Tag color="error" style={{ marginTop: 8 }}>已超时</Tag>
            )}
          </Card>

          {/* 运单信息 */}
          <Card title="运单信息" size="small" style={{ marginBottom: 16 }}>
            <Descriptions column={1} size="small" colon={false}>
              <Descriptions.Item label="运单号"><span style={{ fontFamily: 'monospace' }}>{tracking.trackingNo}</span></Descriptions.Item>
              <Descriptions.Item label="物流公司">{tracking.logisticsCompany}</Descriptions.Item>
              <Descriptions.Item label="发货仓库">{tracking.warehouseName}</Descriptions.Item>
              <Descriptions.Item label="收货地址">{tracking.receiverAddress}</Descriptions.Item>
              <Descriptions.Item label="关联订单"><a onClick={() => navigate(`/orders/${tracking.orderNo}`)}>{tracking.orderNo}</a></Descriptions.Item>
            </Descriptions>
          </Card>

          {/* 地图占位 */}
          <Card size="small">
            <div style={{ height: 200, background: '#F5F5F5', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
              <EnvironmentOutlined style={{ fontSize: 32, color: '#FF6B00', marginBottom: 8 }} />
              <Text type="secondary" style={{ fontSize: 13 }}>地图组件接入中...</Text>
              <div style={{ marginTop: 8 }}>
                <Tag>{tracking.nodes[0]?.location || '发货地'}</Tag>
                <span style={{ color: '#BFBFBF', margin: '0 8px' }}>→</span>
                <Tag color="orange">{tracking.nodes[tracking.nodes.length - 1]?.location || '目的地'}</Tag>
              </div>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
