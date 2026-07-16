import { useParams, useNavigate } from 'react-router-dom';
import { Card, Descriptions, Tag, Button, Space, Typography, Row, Col, Table, Breadcrumb, Statistic, Image } from 'antd';
import { ArrowLeftOutlined, EditOutlined, EnvironmentOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { mockProducts } from '../../data/mockData';
import { PRODUCT_STATUS_MAP, PRODUCT_TAG_MAP } from '../../types';
import type { ProductTag } from '../../types';

const { Title, Text } = Typography;

export default function ProductDetail() {
  const { skuCode } = useParams<{ skuCode: string }>();
  const navigate = useNavigate();
  const product = mockProducts.find((p) => p.skuCode === skuCode);

  if (!product) return <div style={{ textAlign: 'center', padding: 80 }}><Title level={3} type="secondary">商品未找到</Title><Button type="link" onClick={() => navigate('/products')}>返回列表</Button></div>;

  const inventoryCols: ColumnsType<typeof product.baseInventory[number]> = [
    { title: '仓库', dataIndex: 'baseName', width: 80 },
    { title: '总库存', dataIndex: 'stock', width: 70, align: 'center' },
    { title: '已预留', dataIndex: 'reserved', width: 70, align: 'center', render: (v: number) => v > 0 ? <span style={{ color: '#F59E0B' }}>{v}</span> : '-' },
    { title: '可售', dataIndex: 'available', width: 70, align: 'center', render: (v: number) => <Text strong style={{ color: v < 50 ? '#E11D48' : '#16A34A' }}>{v}</Text> },
  ];

  return (
    <div>
      <Breadcrumb style={{ marginBottom: 16 }} items={[{ title: <a onClick={() => navigate('/products')}>商品管理</a> }, { title: product.skuName }]} />

      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={4} style={{ margin: 0 }}>{product.skuName}</Title>
        <Space>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/products')}>返回</Button>
          <Button type="primary" icon={<EditOutlined />} onClick={() => navigate(`/products/${product.skuCode}/edit`)}>编辑商品</Button>
        </Space>
      </div>

      <Row gutter={16}>
        <Col span={16}>
          {/* 商品图片 + 基本信息 */}
          <Card style={{ marginBottom: 16 }}>
            <Row gutter={24}>
              <Col span={10}>
                <div style={{ width: '100%', height: 280, background: '#FF6B00', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ color: '#FFFFFF', fontSize: 48, opacity: 0.5 }}>📦</Text>
                </div>
                <div style={{ marginTop: 12, display: 'flex', gap: 8, justifyContent: 'center' }}>
                  {[1, 2, 3].map((i) => (
                    <div key={i} style={{ width: 64, height: 64, background: i === 1 ? '#FF6B00' : '#FFD6A5', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', border: i === 1 ? '2px solid #FF6B00' : '2px solid #F0F0F0' }}>
                      <Text style={{ color: '#FFFFFF', fontSize: 20, opacity: 0.4 }}>📦</Text>
                    </div>
                  ))}
                </div>
              </Col>
              <Col span={14}>
                <Descriptions column={2} size="small" colon={false} bordered>
                  <Descriptions.Item label="SKU编码"><span style={{ fontFamily: 'monospace', fontWeight: 500 }}>{product.skuCode}</span></Descriptions.Item>
                  <Descriptions.Item label="品牌">{product.brand}</Descriptions.Item>
                  <Descriptions.Item label="商品分类" span={2}>{product.categoryPath}</Descriptions.Item>
                  <Descriptions.Item label="规格型号" span={2}>{product.specification}</Descriptions.Item>
                  <Descriptions.Item label="单位">{product.unit}</Descriptions.Item>
                  <Descriptions.Item label="包装方式">{product.packageType}</Descriptions.Item>
                  <Descriptions.Item label="单件重量">{product.weightKg} kg</Descriptions.Item>
                  <Descriptions.Item label="单件体积">{product.volumeCm3} cm³</Descriptions.Item>
                  <Descriptions.Item label="条形码"><span style={{ fontFamily: 'monospace' }}>{product.barcode}</span></Descriptions.Item>
                  <Descriptions.Item label="状态"><Tag color={PRODUCT_STATUS_MAP[product.status]?.color}>{PRODUCT_STATUS_MAP[product.status]?.label}</Tag></Descriptions.Item>
                  <Descriptions.Item label="商品标签" span={2}>
                    <Space>{product.tags.map((t) => <Tag key={t} color={PRODUCT_TAG_MAP[t]?.color}>{PRODUCT_TAG_MAP[t]?.label}</Tag>)}</Space>
                  </Descriptions.Item>
                  <Descriptions.Item label="基准价"><Text strong style={{ color: '#FF6B00' }}>¥{product.basePrice.toLocaleString()}</Text></Descriptions.Item>
                  <Descriptions.Item label="建议零售价">¥{product.suggestRetailPrice.toLocaleString()}</Descriptions.Item>
                </Descriptions>
              </Col>
            </Row>
          </Card>

          {/* 各基地库存 */}
          <Card title={<Space><EnvironmentOutlined />各基地库存</Space>} size="small" style={{ marginBottom: 16 }}>
            <Table rowKey="baseName" size="small" columns={inventoryCols} dataSource={product.baseInventory} pagination={false}
              summary={() => {
                const t = product.baseInventory.reduce((s, i) => ({ stock: s.stock + i.stock, reserved: s.reserved + i.reserved, available: s.available + i.available }), { stock: 0, reserved: 0, available: 0 });
                return (<Table.Summary.Row><Table.Summary.Cell index={0}><Text strong>合计</Text></Table.Summary.Cell><Table.Summary.Cell index={1} align="center"><Text strong>{t.stock}</Text></Table.Summary.Cell><Table.Summary.Cell index={2} align="center"><Text strong style={{ color: '#F59E0B' }}>{t.reserved}</Text></Table.Summary.Cell><Table.Summary.Cell index={3} align="center"><Text strong style={{ color: t.available < 100 ? '#E11D48' : '#16A34A' }}>{t.available}</Text></Table.Summary.Cell></Table.Summary.Row>);
              }} />
          </Card>
        </Col>

        <Col span={8}>
          {/* 适配车架号 */}
          <Card title="适配车架号(VIN)" size="small" style={{ marginBottom: 16 }}>
            {product.compatibleVins.map((vin) => (
              <Tag key={vin} color="purple" style={{ marginBottom: 6, fontFamily: 'monospace', fontSize: 12 }}>{vin}</Tag>
            ))}
          </Card>

          {/* 替代件 */}
          {product.substituteSkuCodes.length > 0 && (
            <Card title="替代件关系" size="small" style={{ marginBottom: 16 }}>
              {product.substituteSkuCodes.map((code) => {
                const sub = mockProducts.find((p) => p.skuCode === code);
                return (
                  <Tag key={code} color="blue" style={{ cursor: 'pointer', marginBottom: 6 }}
                    onClick={() => navigate(`/products/${code}`)}>
                    {code} {sub ? `(${sub.skuName.substring(0, 10)}...)` : ''}
                  </Tag>
                );
              })}
            </Card>
          )}

          {/* 合格证 */}
          {product.certificateTemplateId && (
            <Card title="合格证模板" size="small" style={{ marginBottom: 16 }}>
              <Tag color="green">{product.certificateTemplateId}</Tag>
            </Card>
          )}
        </Col>
      </Row>
    </div>
  );
}
