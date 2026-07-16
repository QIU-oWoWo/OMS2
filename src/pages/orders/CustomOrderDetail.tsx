import { useParams, useNavigate } from 'react-router-dom';
import { Card, Descriptions, Tag, Steps, Button, Space, Typography, Row, Col, Breadcrumb, Timeline, Divider } from 'antd';
import { ArrowLeftOutlined, PaperClipOutlined, MessageOutlined } from '@ant-design/icons';
import { mockCustomOrders, mockOrders } from '../../data/mockData';
import { CUSTOM_TYPE_MAP, CUSTOM_APPROVAL_MAP } from '../../types';
import type { CustomApprovalStatus } from '../../types';

const { Title, Text } = Typography;

const PRODUCTION_STEPS = ['接单', '排产', '加工', '质检', '入库', '发货'];

export default function CustomOrderDetail() {
  const { customNo } = useParams<{ customNo: string }>();
  const navigate = useNavigate();
  const order = mockCustomOrders.find((o) => o.customNo === customNo);
  if (!order) return <div style={{ textAlign: 'center', padding: 80 }}><Title level={3} type="secondary">定制订单未找到</Title><Button type="link" onClick={() => navigate('/orders/custom')}>返回列表</Button></div>;

  const relatedOrder = mockOrders.find((o) => o.orderNo === order.orderNo);
  const approvalSteps = [
    { title: '提交', status: order.approvalStatus === 'DRAFT' ? 'process' : 'finish' },
    { title: '技术评审', status: order.approvalStatus === 'TECH_REVIEW' ? 'process' : ['QUOTE_PENDING', 'IN_PRODUCTION', 'COMPLETED'].includes(order.approvalStatus) ? 'finish' : order.approvalStatus === 'REJECTED' ? 'error' : 'wait' },
    { title: '报价确认', status: order.approvalStatus === 'QUOTE_PENDING' ? 'process' : ['IN_PRODUCTION', 'COMPLETED'].includes(order.approvalStatus) ? 'finish' : 'wait' },
    { title: '生产下达', status: order.approvalStatus === 'IN_PRODUCTION' ? 'process' : order.approvalStatus === 'COMPLETED' ? 'finish' : 'wait' },
    { title: '完工验收', status: order.approvalStatus === 'COMPLETED' ? 'finish' : 'wait' },
  ];

  const productionStepIdx = order.approvalStatus === 'IN_PRODUCTION' ? 2 : order.approvalStatus === 'COMPLETED' ? 5 : 0;

  return (
    <div>
      <Breadcrumb style={{ marginBottom: 16 }} items={[{ title: <a onClick={() => navigate('/orders/custom')}>定制订单</a> }, { title: `详情 ${order.customNo}` }]} />

      {/* 头部 */}
      <Card style={{ marginBottom: 16 }}>
        <Space size="large" align="start">
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/orders/custom')} />
          <div>
            <Title level={4} style={{ margin: 0 }}>定制单 {order.customNo} <Tag color={CUSTOM_APPROVAL_MAP[order.approvalStatus as CustomApprovalStatus]?.color}>{CUSTOM_APPROVAL_MAP[order.approvalStatus as CustomApprovalStatus]?.label}</Tag></Title>
            <Space size={16} style={{ marginTop: 8 }}>
              <Text type="secondary">经销商: {order.dealerName}</Text>
              <Text type="secondary">关联订单: <a onClick={() => navigate(`/orders/${order.orderNo}`)}>{order.orderNo}</a></Text>
              <Tag color={CUSTOM_TYPE_MAP[order.customType]?.color}>{CUSTOM_TYPE_MAP[order.customType]?.label}</Tag>
            </Space>
          </div>
        </Space>
      </Card>

      <Row gutter={16}>
        <Col span={16}>
          {/* 定制需求卡 */}
          <Card title="定制需求" size="small" style={{ marginBottom: 16 }}>
            <Descriptions column={2} size="small" colon={false}>
              <Descriptions.Item label="定制类型"><Tag color={CUSTOM_TYPE_MAP[order.customType]?.color}>{CUSTOM_TYPE_MAP[order.customType]?.label}</Tag></Descriptions.Item>
              <Descriptions.Item label="预计完工">{order.expectFinishDate}</Descriptions.Item>
              <Descriptions.Item label="规格描述" span={2}>{order.specDescription}</Descriptions.Item>
              <Descriptions.Item label="工艺要求" span={2}>{order.processRequirement || '无特殊工艺要求'}</Descriptions.Item>
              <Descriptions.Item label="VIN码"><span style={{ fontFamily: 'monospace', fontSize: 12 }}>{order.vinCode}</span></Descriptions.Item>
              <Descriptions.Item label="关联车型">{relatedOrder ? '雅迪' + relatedOrder.vinCode.substring(10, 12) + '系' : '-'}</Descriptions.Item>
              <Descriptions.Item label="附件" span={2}>
                {order.attachments.length > 0 ? order.attachments.map((a) => <Tag key={a} icon={<PaperClipOutlined />} color="blue" style={{ cursor: 'pointer' }}>{a}</Tag>) : <Text type="secondary">无附件</Text>}
              </Descriptions.Item>
            </Descriptions>
          </Card>

          {/* 报价信息 */}
          <Card title="报价信息" size="small" style={{ marginBottom: 16 }}>
            <Row gutter={24}>
              <Col span={6}><Text type="secondary">材料费</Text><br /><Text strong style={{ fontSize: 16 }}>¥{order.materialCost.toLocaleString()}</Text></Col>
              <Col span={6}><Text type="secondary">工时费</Text><br /><Text strong style={{ fontSize: 16 }}>¥{order.laborCost.toLocaleString()}</Text></Col>
              <Col span={6}><Text type="secondary">加价系数</Text><br /><Text strong style={{ fontSize: 16 }}>{order.markupRate}%</Text></Col>
              <Col span={6}><Text type="secondary">合计金额</Text><br /><Text strong style={{ fontSize: 20, color: '#FF6B00' }}>¥{order.quoteAmount.toLocaleString()}</Text></Col>
            </Row>
          </Card>

          {/* 生产进度 */}
          <Card title="生产进度" size="small" style={{ marginBottom: 16 }}>
            <Steps current={productionStepIdx} size="small" items={PRODUCTION_STEPS.map((s) => ({ title: s }))} />
          </Card>
        </Col>

        <Col span={8}>
          {/* 审批流 */}
          <Card title="审批流程" size="small" style={{ marginBottom: 16 }}>
            <Steps direction="vertical" size="small" current={-1}
              items={approvalSteps.map((s, i) => ({ title: s.title, status: s.status as 'process' | 'finish' | 'error' | 'wait', description: i === 0 ? order.createTime.replace('T', ' ').substring(0, 16) : undefined }))} />
          </Card>

          {/* 沟通记录 */}
          <Card title="沟通记录" size="small" style={{ marginBottom: 16 }}>
            <Timeline items={[
              { color: '#FF6B00', children: <div><Text style={{ fontSize: 13 }}>经销商咨询定制方案</Text><br /><Text type="secondary" style={{ fontSize: 12 }}>王丽华（客服专员）</Text><br /><Text type="secondary" style={{ fontSize: 11 }}>{order.createTime.replace('T', ' ').substring(0, 19)}</Text></div> },
              { color: '#0284C7', children: <div><Text style={{ fontSize: 13 }}>技术部门反馈可行性评估</Text><br /><Text type="secondary" style={{ fontSize: 12 }}>张建国（运营主管）</Text><br /><Text type="secondary" style={{ fontSize: 11 }}>2026-07-{String(Number(order.createTime.substring(8, 10)) + 1).padStart(2, '0')} {order.createTime.substring(11, 19)}</Text><Text type="secondary" italic><br />方案可行，建议采用CNC加工工艺</Text></div> },
            ]} />
          </Card>
        </Col>
      </Row>
    </div>
  );
}
