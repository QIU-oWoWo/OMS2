import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card, Table, Input, Select, DatePicker, Button, Space, Tag, Typography, Row, Col,
  Drawer, Descriptions, Timeline, Alert, Collapse, Divider, message, Modal,
} from 'antd';
import {
  SearchOutlined, ReloadOutlined, EyeOutlined, CheckCircleOutlined,
  CloseCircleOutlined, SafetyCertificateOutlined, DollarOutlined,
  ExclamationCircleOutlined, InfoCircleOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { mockInventoryShares } from '../../data/mockData';
import { SHARE_STATUS_MAP } from '../../types';
import type { InventoryShareDTO, ShareStatus } from '../../types';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { Panel } = Collapse;

export default function InventoryShare() {
  const navigate = useNavigate();
  const [detailDrawer, setDetailDrawer] = useState<InventoryShareDTO | null>(null);
  const [filters, setFilters] = useState({
    shareNo: '', dealerName: '', statuses: [] as string[], skuCode: '',
    dateRange: null as [dayjs.Dayjs, dayjs.Dayjs] | null,
  });

  const filtered = useMemo(() => {
    let result = [...mockInventoryShares];
    if (filters.shareNo) result = result.filter((s) => s.shareNo.includes(filters.shareNo));
    if (filters.dealerName) result = result.filter((s) => s.fromDealerName.includes(filters.dealerName) || s.toDealerName.includes(filters.dealerName));
    if (filters.statuses.length > 0) result = result.filter((s) => filters.statuses.includes(s.status));
    if (filters.skuCode) result = result.filter((s) => s.items.some((i) => i.skuCode.includes(filters.skuCode)));
    if (filters.dateRange) {
      const [s, e] = filters.dateRange;
      result = result.filter((r) => dayjs(r.createTime).isAfter(s.startOf('day')) && dayjs(r.createTime).isBefore(e.endOf('day')));
    }
    return result;
  }, [filters]);

  const columns: ColumnsType<InventoryShareDTO> = [
    { title: '共享方经销商', dataIndex: 'fromDealerName', key: 'fromDealerName', width: 150 },
    { title: 'SKU明细', key: 'skuSummary', width: 220, render: (_: unknown, r: InventoryShareDTO) => r.items.map((i) => <Tag key={i.skuCode} style={{ fontFamily: 'monospace', fontSize: 11 }}>{i.skuCode}</Tag>) },
    { title: '定价', dataIndex: 'totalAmount', key: 'totalAmount', width: 110, align: 'right', sorter: (a, b) => a.totalAmount - b.totalAmount, render: (v: number) => <span style={{ fontWeight: 500 }}>¥{v.toLocaleString()}</span> },
    { title: '质量认证', key: 'qualityCert', width: 110, align: 'center', render: (_: unknown, r: InventoryShareDTO) => {
      if (r.qualityCertStatus === 'VERIFIED') return <Tag icon={<SafetyCertificateOutlined />} color="success">已认证</Tag>;
      if (r.qualityCertStatus === 'PENDING') return <Tag icon={<ExclamationCircleOutlined />} color="warning">待认证</Tag>;
      return <Tag icon={<CloseCircleOutlined />} color="error">未通过</Tag>;
    }},
    { title: '共享状态', dataIndex: 'status', key: 'status', width: 90, render: (s: ShareStatus) => { const info = SHARE_STATUS_MAP[s]; return <Tag color={info?.color}>{info?.label}</Tag>; } },
    { title: '创建时间', dataIndex: 'createTime', key: 'createTime', width: 160, sorter: (a, b) => a.createTime.localeCompare(b.createTime), render: (t: string) => t.replace('T', ' ').substring(0, 16) },
    { title: '操作', key: 'actions', width: 80, render: (_: unknown, r: InventoryShareDTO) => (<Button size="small" danger icon={<CloseCircleOutlined />} onClick={(e) => { e.stopPropagation(); Modal.confirm({ title: '确认下架', content: `确定要下架共享 ${r.shareNo} 吗？`, okText: '确认', okButtonProps: { danger: true }, onOk: () => message.success('已下架') }); }}>下架</Button>) },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={4} style={{ margin: 0 }}>库存共享管理</Title>
        <Button icon={<ReloadOutlined />} onClick={() => setFilters({ shareNo: '', dealerName: '', statuses: [], skuCode: '', dateRange: null })}>重置</Button>
      </div>

      {/* ========== 官方共享机制说明 ========== */}
      <Card size="small" style={{ marginBottom: 16, background: '#FFF3E8', border: '1px solid #FFD6A5' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
          <InfoCircleOutlined style={{ color: '#FF6B00', fontSize: 18, marginTop: 3 }} />
          <div style={{ flex: 1 }}>
            <Text strong style={{ color: '#FF6B00', fontSize: 15 }}>雅迪官方库存共享机制</Text>
            <Collapse ghost size="small" style={{ marginTop: 8 }}>
              <Panel header={<Text strong>📋 认证标准</Text>} key="cert">
                <ul style={{ margin: '4px 0 0 4px', paddingLeft: 16, color: '#595959', fontSize: 13 }}>
                  <li>共享配件须持有有效合格证（PDF/DWG格式），上传至OMS商品合格证模板库</li>
                  <li>配件批次号需可追溯至供应商原始批次，确保来源正规</li>
                  <li>三包期内配件不得共享，需优先履行原订单质保义务</li>
                  <li>跨基地共享需经过双方基地仓管员确认实物状态</li>
                </ul>
              </Panel>
              <Panel header={<Text strong>💰 定价规则</Text>} key="pricing">
                <ul style={{ margin: '4px 0 0 4px', paddingLeft: 16, color: '#595959', fontSize: 13 }}>
                  <li>共享定价不得低于OMS基准价的80%，不得高于建议零售价</li>
                  <li>共享方（出让方）定价后，OMS自动锁定价格，交易完成前不可修改</li>
                  <li>运输费用由双方协商承担，OMS不介入运费结算</li>
                  <li>系统按共享金额的2%收取平台服务费（最低¥10/单）</li>
                </ul>
              </Panel>
              <Panel header={<Text strong>⚖️ 质量责任归属</Text>} key="quality">
                <ul style={{ margin: '4px 0 0 4px', paddingLeft: 16, color: '#595959', fontSize: 13 }}>
                  <li>配件质量问题由共享方（出让方）承担首要责任</li>
                  <li>接收方签收后48小时内发现质量问题可发起退换，超时视为验收合格</li>
                  <li>因运输导致的破损由约定的承运方承担责任</li>
                  <li>伪造合格证或隐瞒质量缺陷的共享方将被暂停共享资格30天并记录信用分</li>
                </ul>
              </Panel>
            </Collapse>
          </div>
        </div>
      </Card>

      {/* 筛选区 */}
      <Card size="small" style={{ marginBottom: 16 }}>
        <Row gutter={[16, 12]}>
          <Col span={4}><Input placeholder="共享单号搜索" prefix={<SearchOutlined />} value={filters.shareNo} onChange={(e) => setFilters((f) => ({ ...f, shareNo: e.target.value }))} allowClear /></Col>
          <Col span={4}><Input placeholder="经销商名称搜索" value={filters.dealerName} onChange={(e) => setFilters((f) => ({ ...f, dealerName: e.target.value }))} allowClear /></Col>
          <Col span={3}><Input placeholder="SKU编码" value={filters.skuCode} onChange={(e) => setFilters((f) => ({ ...f, skuCode: e.target.value }))} allowClear /></Col>
          <Col span={4}><Select mode="multiple" placeholder="共享状态" style={{ width: '100%' }} value={filters.statuses} onChange={(v) => setFilters((f) => ({ ...f, statuses: v }))} options={Object.entries(SHARE_STATUS_MAP).map(([k, v]) => ({ value: k, label: v.label }))} maxTagCount={1} /></Col>
          <Col span={5}><RangePicker style={{ width: '100%' }} placeholder={['开始日期', '结束日期']} value={filters.dateRange} onChange={(d) => setFilters((f) => ({ ...f, dateRange: d as [dayjs.Dayjs, dayjs.Dayjs] | null }))} /></Col>
        </Row>
      </Card>

      {/* 数据表格 */}
      <Card>
        <Table rowKey="shareNo" columns={columns} dataSource={filtered} scroll={{ x: 1300 }} size="middle"
          pagination={{ defaultPageSize: 20, showSizeChanger: true, showTotal: (total) => `共 ${total} 条` }}
          onRow={(r) => ({ onClick: () => setDetailDrawer(r) })} />
      </Card>

      {/* 详情抽屉 */}
      <Drawer title={`共享单号 ${detailDrawer?.shareNo || ''}`} open={!!detailDrawer} onClose={() => setDetailDrawer(null)} width={560}>
        {detailDrawer && (
          <div>
            <Descriptions column={2} size="small" colon={false} bordered>
              <Descriptions.Item label="共享单号" span={2}><span style={{ fontFamily: 'monospace' }}>{detailDrawer.shareNo}</span></Descriptions.Item>
              <Descriptions.Item label="共享方">{detailDrawer.fromDealerName}</Descriptions.Item>
              <Descriptions.Item label="接收方">{detailDrawer.toDealerName}</Descriptions.Item>
              <Descriptions.Item label="共享状态"><Tag color={SHARE_STATUS_MAP[detailDrawer.status as ShareStatus]?.color}>{SHARE_STATUS_MAP[detailDrawer.status as ShareStatus]?.label}</Tag></Descriptions.Item>
              <Descriptions.Item label="总金额"><Text strong style={{ color: '#FF6B00' }}>¥{detailDrawer.totalAmount.toLocaleString()}</Text></Descriptions.Item>
              <Descriptions.Item label="质量认证">
                {detailDrawer.qualityCertStatus === 'VERIFIED' ? <Tag color="success" icon={<SafetyCertificateOutlined />}>已认证 ({detailDrawer.qualityCert})</Tag>
                  : detailDrawer.qualityCertStatus === 'PENDING' ? <Tag color="warning">待认证</Tag>
                  : <Tag color="error">未通过</Tag>}
              </Descriptions.Item>
              <Descriptions.Item label="创建时间">{detailDrawer.createTime.replace('T', ' ').substring(0, 16)}</Descriptions.Item>
              <Descriptions.Item label="更新时间">{detailDrawer.updateTime.replace('T', ' ').substring(0, 16)}</Descriptions.Item>
              <Descriptions.Item label="备注" span={2}>{detailDrawer.remark || '-'}</Descriptions.Item>
            </Descriptions>

            <Divider style={{ margin: '16px 0' }} />
            <Text strong>共享商品明细：</Text>
            <Table
              style={{ marginTop: 8 }}
              rowKey="skuCode" size="small" pagination={false}
              dataSource={detailDrawer.items}
              columns={[
                { title: 'SKU编码', dataIndex: 'skuCode', width: 120, render: (c: string) => <span style={{ fontFamily: 'monospace', fontSize: 12 }}>{c}</span> },
                { title: '商品名称', dataIndex: 'skuName', width: 150 },
                { title: '数量', dataIndex: 'quantity', width: 60, align: 'center' },
                { title: '单价', dataIndex: 'unitPrice', width: 80, align: 'right', render: (v: number) => `¥${v}` },
                { title: '小计', key: 'sub', width: 100, align: 'right', render: (_: unknown, i: { quantity: number; unitPrice: number }) => <Text strong>¥{(i.quantity * i.unitPrice).toLocaleString()}</Text> },
              ]}
            />

            <Divider style={{ margin: '16px 0' }} />
            <Text strong>操作记录：</Text>
            <Timeline style={{ marginTop: 12 }}
              items={[
                { color: '#FF6B00', children: <div><Text style={{ fontSize: 13 }}>经销商提交共享申请</Text><br /><Text type="secondary" style={{ fontSize: 12 }}>{detailDrawer.createTime.replace('T', ' ').substring(0, 19)}</Text></div> },
                { color: detailDrawer.qualityCertStatus === 'VERIFIED' ? '#16A34A' : '#F59E0B', children: <div><Text style={{ fontSize: 13 }}>OMS系统审核材料</Text><br /><Text type="secondary" style={{ fontSize: 12 }}>合格证{detailDrawer.qualityCertStatus === 'VERIFIED' ? '核验通过' : '待核验'}</Text></div> },
                { color: detailDrawer.status === 'ACTIVE' ? '#16A34A' : '#0284C7', children: <div><Text style={{ fontSize: 13 }}>{detailDrawer.status === 'ACTIVE' ? '共享交易生效中' : `状态: ${SHARE_STATUS_MAP[detailDrawer.status as ShareStatus]?.label}`}</Text><br /><Text type="secondary" style={{ fontSize: 12 }}>{detailDrawer.updateTime.replace('T', ' ').substring(0, 19)}</Text></div> },
              ]}
            />
          </div>
        )}
      </Drawer>
    </div>
  );
}
