import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card, Form, Input, InputNumber, Select, Button, Space, Typography, Breadcrumb, Row, Col,
  Divider, message, Upload,
} from 'antd';
import {
  SaveOutlined, ArrowLeftOutlined, SendOutlined, UploadOutlined, InboxOutlined,
} from '@ant-design/icons';
import { mockProducts } from '../../data/mockData';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Dragger } = Upload;

export default function ProductEdit() {
  const { skuCode } = useParams<{ skuCode: string }>();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const isNew = skuCode === 'new' || !skuCode;
  const product = !isNew ? mockProducts.find((p) => p.skuCode === skuCode) : null;

  useEffect(() => {
    if (product) {
      form.setFieldsValue(product);
    }
  }, [product, form]);

  const handleSave = (isDraft: boolean) => {
    form.validateFields().then((values) => {
      console.log('Form values:', values);
      message.success(isDraft ? '草稿已保存' : '商品信息已提交审核');
      navigate('/products');
    }).catch(() => message.warning('请完善必填信息'));
  };

  if (!isNew && !product) {
    return <div style={{ textAlign: 'center', padding: 80 }}><Title level={3} type="secondary">商品未找到</Title><Button type="link" onClick={() => navigate('/products')}>返回列表</Button></div>;
  }

  return (
    <div>
      <Breadcrumb style={{ marginBottom: 16 }} items={[
        { title: <a onClick={() => navigate('/products')}>商品管理</a> },
        { title: isNew ? '新增商品' : `编辑 ${skuCode}` },
      ]} />

      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={4} style={{ margin: 0 }}>{isNew ? '新增商品' : `编辑商品 - ${skuCode}`}</Title>
        <Space>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/products')}>返回</Button>
          <Button icon={<SaveOutlined />} onClick={() => handleSave(true)}>保存草稿</Button>
          <Button type="primary" icon={<SendOutlined />} onClick={() => handleSave(false)}>提交审核</Button>
        </Space>
      </div>

      <Form form={form} layout="vertical" initialValues={{ unit: '个', packageType: '散装', status: 'ON_SHELF' }}>
        <Row gutter={16}>
          <Col span={17}>
            {/* 基本信息 */}
            <Card title="基本信息" size="small" style={{ marginBottom: 16 }}>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item name="skuCode" label="SKU编码" rules={[{ required: true, message: '请输入SKU编码' }]}>
                    <Input placeholder={isNew ? '可手动输入或留空自动生成' : undefined} disabled={!isNew} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="skuName" label="商品名称" rules={[{ required: true, message: '请输入商品名称' }]}>
                    <Input placeholder="最大100字符" maxLength={100} />
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={16}>
                <Col span={8}>
                  <Form.Item name="categoryPath" label="商品分类" rules={[{ required: true, message: '请选择分类' }]}>
                    <Select placeholder="选择三级分类" options={[
                      { value: '制动系统 > 刹车片 > 前刹车片', label: '制动系统 > 刹车片 > 前刹车片' },
                      { value: '动力系统 > 电机 > 500W系列', label: '动力系统 > 电机 > 500W系列' },
                      { value: '电气系统 > 控制器 > 通用型', label: '电气系统 > 控制器 > 通用型' },
                      { value: '底盘系统 > 减震器 > 后减震', label: '底盘系统 > 减震器 > 后减震' },
                    ]} />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item name="specification" label="规格型号" rules={[{ required: true, message: '请输入规格型号' }]}>
                    <Input placeholder="最大200字符" maxLength={200} />
                  </Form.Item>
                </Col>
                <Col span={4}>
                  <Form.Item name="unit" label="单位" rules={[{ required: true }]}>
                    <Select options={['件', '套', '组', '个', '对'].map((u) => ({ value: u, label: u }))} />
                  </Form.Item>
                </Col>
                <Col span={4}>
                  <Form.Item name="brand" label="品牌">
                    <Select placeholder="选择品牌" options={['BOSCH', 'MANN', 'DID', 'RK', 'YUASA', '博世', '全顺', '凯利', '远驱', '欧司朗', 'KYB', 'SHOWA', '正新', '雅迪原厂'].map((b) => ({ value: b, label: b }))} />
                  </Form.Item>
                </Col>
              </Row>
            </Card>

            {/* 价格信息 */}
            <Card title="价格信息" size="small" style={{ marginBottom: 16 }}>
              <Row gutter={16}>
                <Col span={8}>
                  <Form.Item name="basePrice" label="基准价 (¥)" rules={[{ required: true, message: '请输入基准价' }]}>
                    <InputNumber min={0} precision={2} style={{ width: '100%' }} prefix="¥" />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item name="costPrice" label="成本价 (¥)">
                    <InputNumber min={0} precision={2} style={{ width: '100%' }} prefix="¥" />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item name="suggestRetailPrice" label="建议零售价 (¥)">
                    <InputNumber min={0} precision={2} style={{ width: '100%' }} prefix="¥" />
                  </Form.Item>
                </Col>
              </Row>
            </Card>

            {/* 包装信息 */}
            <Card title="包装信息" size="small" style={{ marginBottom: 16 }}>
              <Row gutter={16}>
                <Col span={6}>
                  <Form.Item name="packageType" label="包装方式">
                    <Select options={['散装', '盒装', '套装'].map((p) => ({ value: p, label: p }))} />
                  </Form.Item>
                </Col>
                <Col span={6}>
                  <Form.Item name="weightKg" label="单件重量 (kg)">
                    <InputNumber min={0} precision={2} style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
                <Col span={6}>
                  <Form.Item name="volumeCm3" label="单件体积 (cm³)">
                    <InputNumber min={0} precision={0} style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
                <Col span={6}>
                  <Form.Item name="barcode" label="条形码">
                    <Input placeholder="支持扫码录入" />
                  </Form.Item>
                </Col>
              </Row>
            </Card>

            {/* 备注 */}
            <Card title="备注" size="small" style={{ marginBottom: 16 }}>
              <Form.Item name="remark" noStyle>
                <TextArea rows={3} maxLength={500} placeholder="最大500字符" />
              </Form.Item>
            </Card>
          </Col>

          <Col span={7}>
            {/* 合格证 */}
            <Card title="合格证模板" size="small" style={{ marginBottom: 16 }}>
              <Dragger accept=".pdf,.dwg,.jpg,.png" maxCount={3} beforeUpload={() => false}>
                <p className="ant-upload-drag-icon"><InboxOutlined /></p>
                <p className="ant-upload-text">点击或拖拽上传</p>
                <p className="ant-upload-hint">支持 PDF/DWG/JPG/PNG，最大10MB</p>
              </Dragger>
              {product?.certificateTemplateId && (
                <div style={{ marginTop: 12 }}>
                  <Tag color="blue">已关联模板: {product.certificateTemplateId}</Tag>
                </div>
              )}
            </Card>

            {/* 状态 */}
            <Card title="商品状态" size="small" style={{ marginBottom: 16 }}>
              <Form.Item name="status" noStyle>
                <Select options={[
                  { value: 'ON_SHELF', label: '上架' },
                  { value: 'OFF_SHELF', label: '下架' },
                  { value: 'DISABLED', label: '停用' },
                ]} />
              </Form.Item>
            </Card>

            {/* 操作提示 */}
            <Card size="small" style={{ background: '#FFF3E8', border: '1px solid #FFD6A5' }}>
              <Text style={{ fontSize: 13, color: '#FF6B00' }}>
                <strong>提示：</strong>
                <ul style={{ margin: '4px 0 0 16px', padding: 0 }}>
                  <li>SKU编码提交后不可修改</li>
                  <li>完整填写后可提交审核</li>
                  <li>未填完可保存为草稿</li>
                  <li>每次编辑均记录变更快照</li>
                </ul>
              </Text>
            </Card>
          </Col>
        </Row>
      </Form>
    </div>
  );
}
