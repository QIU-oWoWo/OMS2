import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card, Table, Input, Select, Button, Space, Tag, Typography, Row, Col, message, Modal, Dropdown, Checkbox,
} from 'antd';
import {
  SearchOutlined, ReloadOutlined, PlusOutlined, DownloadOutlined,
  UploadOutlined, ArrowUpOutlined, ArrowDownOutlined, DollarOutlined, SettingOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { mockProducts } from '../../data/mockData';
import { PRODUCT_STATUS_MAP } from '../../types';
import type { ProductDTO, ProductStatus } from '../../types';

const { Title } = Typography;

const ALL_COLS = [
  { key: 'skuCode', title: 'SKU编码' }, { key: 'skuName', title: '商品名称' },
  { key: 'categoryPath', title: '商品分类' }, { key: 'specification', title: '规格型号' },
  { key: 'unit', title: '单位' }, { key: 'basePrice', title: '基准价' },
  { key: 'baseSource', title: '基地来源' }, { key: 'vehicleModelCount', title: '适配车型数' },
  { key: 'status', title: '状态' }, { key: 'updateTime', title: '更新时间' },
];

export default function ProductList() {
  const navigate = useNavigate();
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [visibleCols, setVisibleCols] = useState(ALL_COLS.map((c) => c.key));
  const [filters, setFilters] = useState({
    skuCode: '', skuName: '', category: '', statuses: [] as string[], baseSource: '',
  });

  const filtered = useMemo(() => {
    let result = [...mockProducts];
    if (filters.skuCode) result = result.filter((p) => p.skuCode.toLowerCase().includes(filters.skuCode.toLowerCase()));
    if (filters.skuName) result = result.filter((p) => p.skuName.includes(filters.skuName));
    if (filters.category) result = result.filter((p) => p.categoryPath.includes(filters.category));
    if (filters.statuses.length > 0) result = result.filter((p) => filters.statuses.includes(p.status));
    if (filters.baseSource) result = result.filter((p) => p.baseSource === filters.baseSource);
    return result;
  }, [filters]);

  const handleBatchAction = (action: string) => {
    if (selectedRowKeys.length === 0) { message.warning('请先选择商品'); return; }
    Modal.confirm({
      title: `确认${action}`,
      content: `确定要对选中的 ${selectedRowKeys.length} 个商品执行${action}操作吗？`,
      onOk: () => { message.success(`${action}操作成功，共 ${selectedRowKeys.length} 条`); setSelectedRowKeys([]); },
    });
  };

  const columns: ColumnsType<ProductDTO> = useMemo(() => {
    const all: ColumnsType<ProductDTO> = [
      { title: 'SKU编码', dataIndex: 'skuCode', key: 'skuCode', width: 140, render: (code: string) => (<a onClick={(e) => { e.stopPropagation(); navigate(`/products/${code}`); }} style={{ color: '#FF6B00', fontWeight: 500, fontFamily: 'monospace' }}>{code}</a>) },
      { title: '商品名称', dataIndex: 'skuName', key: 'skuName', width: 240, ellipsis: true },
      { title: '商品分类', dataIndex: 'categoryPath', key: 'categoryPath', width: 180, ellipsis: true },
      { title: '规格型号', dataIndex: 'specification', key: 'specification', width: 180, ellipsis: true },
      { title: '单位', dataIndex: 'unit', key: 'unit', width: 60, align: 'center' },
      { title: '基准价', dataIndex: 'basePrice', key: 'basePrice', width: 110, align: 'right', sorter: (a, b) => a.basePrice - b.basePrice, render: (v: number) => <span style={{ fontWeight: 500 }}>¥{v.toLocaleString()}</span> },
      { title: '基地来源', dataIndex: 'baseSource', key: 'baseSource', width: 100, sorter: (a, b) => a.baseSource.localeCompare(b.baseSource) },
      { title: '适配车型数', dataIndex: 'vehicleModelCount', key: 'vehicleModelCount', width: 100, align: 'center', sorter: (a, b) => a.vehicleModelCount - b.vehicleModelCount },
      { title: '状态', dataIndex: 'status', key: 'status', width: 80, render: (s: ProductStatus) => { const info = PRODUCT_STATUS_MAP[s]; return <Tag color={info?.color}>{info?.label}</Tag>; } },
      { title: '更新时间', dataIndex: 'updateTime', key: 'updateTime', width: 160, sorter: (a, b) => a.updateTime.localeCompare(b.updateTime), render: (t: string) => t.replace('T', ' ').substring(0, 16) },
      { title: '操作', key: 'actions', fixed: 'right' as const, width: 100, render: (_: unknown, record: ProductDTO) => (<a onClick={(e) => { e.stopPropagation(); navigate(`/products/${record.skuCode}`); }} style={{ color: '#FF6B00' }}>编辑</a>) },
    ];
    return all.filter((c) => visibleCols.includes(c.key as string));
  }, [navigate, visibleCols]);

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={4} style={{ margin: 0 }}>商品管理</Title>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={() => setFilters({ skuCode: '', skuName: '', category: '', statuses: [], baseSource: '' })}>重置</Button>
          <Button icon={<UploadOutlined />}>批量导入</Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/products/new')}>新增商品</Button>
        </Space>
      </div>
      <Card size="small" style={{ marginBottom: 16 }}>
        <Row gutter={[16, 12]}>
          <Col span={4}><Input placeholder="SKU编码搜索" prefix={<SearchOutlined />} value={filters.skuCode} onChange={(e) => setFilters((f) => ({ ...f, skuCode: e.target.value }))} allowClear /></Col>
          <Col span={4}><Input placeholder="商品名称搜索" value={filters.skuName} onChange={(e) => setFilters((f) => ({ ...f, skuName: e.target.value }))} allowClear /></Col>
          <Col span={4}><Input placeholder="分类搜索" value={filters.category} onChange={(e) => setFilters((f) => ({ ...f, category: e.target.value }))} allowClear /></Col>
          <Col span={3}><Select mode="multiple" placeholder="状态" style={{ width: '100%' }} value={filters.statuses} onChange={(vals) => setFilters((f) => ({ ...f, statuses: vals }))} options={Object.entries(PRODUCT_STATUS_MAP).map(([k, v]) => ({ value: k, label: v.label }))} maxTagCount={1} /></Col>
          <Col span={3}><Select placeholder="基地来源" style={{ width: '100%' }} value={filters.baseSource || undefined} onChange={(val) => setFilters((f) => ({ ...f, baseSource: val || '' }))} allowClear options={['华东基地', '华南基地', '华北基地', '西南基地'].map((b) => ({ value: b, label: b }))} /></Col>
          <Col span={4}>
            <Dropdown menu={{ items: ALL_COLS.map((col) => ({ key: col.key, label: <Checkbox checked={visibleCols.includes(col.key)}>{col.title}</Checkbox>, onClick: () => setVisibleCols((p) => p.includes(col.key) ? p.filter((k) => k !== col.key) : [...p, col.key]) })) }} trigger={['click']}>
              <Button icon={<SettingOutlined />}>列设置</Button>
            </Dropdown>
          </Col>
        </Row>
      </Card>

      {selectedRowKeys.length > 0 && (
        <Card size="small" style={{ marginBottom: 16, background: '#FFF3E8', border: '1px solid #FFD6A5' }}>
          <Space>
            <span>已选择 <span style={{ color: '#FF6B00', fontWeight: 500 }}>{selectedRowKeys.length}</span> 个商品</span>
            <Button size="small" icon={<ArrowUpOutlined />} onClick={() => handleBatchAction('批量上架')}>批量上架</Button>
            <Button size="small" icon={<ArrowDownOutlined />} onClick={() => handleBatchAction('批量下架')}>批量下架</Button>
            <Button size="small" icon={<DollarOutlined />} onClick={() => handleBatchAction('批量调价')}>批量调价</Button>
            <Button size="small" icon={<DownloadOutlined />} onClick={() => handleBatchAction('导出Excel')}>导出 Excel</Button>
            <a onClick={() => setSelectedRowKeys([])} style={{ color: '#8C8C8C' }}>取消选择</a>
          </Space>
        </Card>
      )}

      <Card>
        <Table rowKey="skuCode" columns={columns} dataSource={filtered}
          rowSelection={{ selectedRowKeys, onChange: setSelectedRowKeys }}
          scroll={{ x: 1400 }} size="middle"
          pagination={{ defaultPageSize: 20, showSizeChanger: true, pageSizeOptions: ['10', '20', '50', '100'], showTotal: (total) => `共 ${total} 条` }}
          onRow={(r) => ({ onClick: () => navigate(`/products/${r.skuCode}`) })} />
      </Card>
    </div>
  );
}
