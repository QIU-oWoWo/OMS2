import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card, Table, Input, Select, Button, Space, Tag, Typography, Row, Col, message, Modal, Dropdown, Checkbox,
  Drawer, Switch, InputNumber, List, Divider, Alert, Empty, Collapse,
} from 'antd';
import {
  SearchOutlined, ReloadOutlined, PlusOutlined, DownloadOutlined,
  UploadOutlined, ArrowUpOutlined, ArrowDownOutlined, DollarOutlined, SettingOutlined,
  ThunderboltOutlined, EyeInvisibleOutlined, VerticalAlignTopOutlined, SortAscendingOutlined,
  SwapOutlined, DeleteOutlined, PlusCircleOutlined, InfoCircleOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { mockProducts } from '../../data/mockData';
import { PRODUCT_STATUS_MAP, PRODUCT_TAG_MAP } from '../../types';
import type { ProductDTO, ProductStatus, ProductTag } from '../../types';

const { Title, Text } = Typography;
const { Panel } = Collapse;

const ALL_COLS = [
  { key: 'skuCode', title: 'SKU编码' }, { key: 'skuName', title: '商品名称' },
  { key: 'categoryPath', title: '商品分类' }, { key: 'specification', title: '规格型号' },
  { key: 'unit', title: '单位' }, { key: 'basePrice', title: '基准价' },
  { key: 'baseSource', title: '基地来源' }, { key: 'vehicleModelCount', title: '适配车型数' },
  { key: 'status', title: '状态' }, { key: 'tags', title: '标签' }, { key: 'updateTime', title: '更新时间' },
];

const RULES = [
  { key: 'autoOnShelf', title: '自动上架规则', desc: '新品导入后自动上架条件', icon: <ThunderboltOutlined />, color: '#16A34A' },
  { key: 'autoOffShelf', title: '自动下架规则', desc: '库存/销量触发自动下架', icon: <ArrowDownOutlined />, color: '#E11D48' },
  { key: 'visibility', title: '物料可见性配置', desc: '二网默认不可见 + 白/黑名单', icon: <EyeInvisibleOutlined />, color: '#7C3AED' },
  { key: 'pinTop', title: '一键置顶 / 取消', desc: '商城商品手动置顶管理', icon: <VerticalAlignTopOutlined />, color: '#FF6B00' },
  { key: 'sortRule', title: '排序规则配置', desc: '关联条件与优先级', icon: <SortAscendingOutlined />, color: '#0284C7' },
] as const;

type RuleKey = typeof RULES[number]['key'];

// ========== 模拟经销商白/黑名单数据 ==========
const DEALER_LIST = [
  { id: 'DLR-001', name: '杭州雅迪旗舰店', tier: '一网' },
  { id: 'DLR-002', name: '南京雅迪体验中心', tier: '一网' },
  { id: 'DLR-003', name: '合肥雅迪专卖店', tier: '一网' },
  { id: 'DLR-004', name: '郑州雅迪旗舰店', tier: '一网' },
  { id: 'DLR-005', name: '武汉雅迪服务中心', tier: '一网' },
  { id: 'DLR-101', name: '绍兴二网经销商A', tier: '二网' },
  { id: 'DLR-102', name: '镇江二网经销商B', tier: '二网' },
  { id: 'DLR-103', name: '芜湖二网经销商C', tier: '二网' },
  { id: 'DLR-104', name: '洛阳二网经销商D', tier: '二网' },
];

const CATEGORIES = [
  '制动系统 > 刹车片', '动力系统 > 滤清器', '传动系统 > 链条',
  '电气系统 > 蓄电池', '动力系统 > 电机', '电气系统 > 控制器',
  '车身部件 > 灯具', '底盘系统 > 减震器', '底盘系统 > 轮胎', '电气系统 > 充电器',
];

export default function ProductList() {
  const navigate = useNavigate();
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [visibleCols, setVisibleCols] = useState(ALL_COLS.map((c) => c.key));
  const [activeDrawer, setActiveDrawer] = useState<RuleKey | null>(null);
  const [filters, setFilters] = useState({
    skuCode: '', skuName: '', category: '', statuses: [] as string[], baseSource: '', tags: [] as string[],
  });

  // ---- 各规则状态 ----

  // 自动上架规则
  const [autoOnShelf, setAutoOnShelf] = useState({
    enabled: true, daysAfterImport: 3, categories: ['制动系统 > 刹车片', '动力系统 > 电机'] as string[],
  });

  // 自动下架规则
  const [autoOffShelf, setAutoOffShelf] = useState({
    enabled: true, zeroSalesDays: 30, lowStockThreshold: 5, excludeCategories: ['电气系统 > 蓄电池'] as string[],
  });

  // 物料可见性
  const [visibility, setVisibility] = useState({
    enabled: true,
    hiddenCategories: ['传动系统 > 链条', '底盘系统 > 减震器'] as string[],
    tier2Whitelist: ['DLR-101', 'DLR-103'] as string[],
    tier1Blacklist: [] as string[],
  });

  // 置顶商品
  const [pinnedProducts, setPinnedProducts] = useState([
    { skuCode: 'YD-BT-002', skuName: '石墨烯电池 72V20AH', pinnedAt: '2026-07-15T09:00:00+08:00' },
    { skuCode: 'YD-MT-002', skuName: '轮毂电机 800W（雅迪DE）', pinnedAt: '2026-07-14T14:30:00+08:00' },
  ]);
  const [pinSearchSku, setPinSearchSku] = useState('');

  // 排序规则
  const [sortRules, setSortRules] = useState([
    { field: 'salesVolume', label: '近30天销量', direction: 'desc', priority: 1, enabled: true },
    { field: 'isNew', label: '新品优先', direction: 'desc', priority: 2, enabled: true },
    { field: 'basePrice', label: '价格', direction: 'asc', priority: 3, enabled: false },
    { field: 'updateTime', label: '最近更新时间', direction: 'desc', priority: 4, enabled: false },
  ]);

  const filtered = useMemo(() => {
    let result = [...mockProducts];
    if (filters.skuCode) result = result.filter((p) => p.skuCode.toLowerCase().includes(filters.skuCode.toLowerCase()));
    if (filters.skuName) result = result.filter((p) => p.skuName.includes(filters.skuName));
    if (filters.category) result = result.filter((p) => p.categoryPath.includes(filters.category));
    if (filters.statuses.length > 0) result = result.filter((p) => filters.statuses.includes(p.status));
    if (filters.baseSource) result = result.filter((p) => p.baseSource === filters.baseSource);
    if (filters.tags.length > 0) result = result.filter((p) => p.tags.some((t) => filters.tags.includes(t)));
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
      { title: '状态', dataIndex: 'status', key: 'status', width: 70, render: (s: ProductStatus) => { const info = PRODUCT_STATUS_MAP[s]; return <Tag color={info?.color}>{info?.label}</Tag>; } },
      { title: '标签', dataIndex: 'tags', key: 'tags', width: 140, render: (tags: ProductTag[]) => tags.length === 0 || tags[0] === 'NONE' ? <Text type="secondary">-</Text> : <Space size={4}>{tags.map((t) => <Tag key={t} color={PRODUCT_TAG_MAP[t]?.color} style={{ fontSize: 11 }}>{PRODUCT_TAG_MAP[t]?.label}</Tag>)}</Space> },
      { title: '更新时间', dataIndex: 'updateTime', key: 'updateTime', width: 160, sorter: (a, b) => a.updateTime.localeCompare(b.updateTime), render: (t: string) => t.replace('T', ' ').substring(0, 16) },
      { title: '操作', key: 'actions', fixed: 'right' as const, width: 100, render: (_: unknown, record: ProductDTO) => (<a onClick={(e) => { e.stopPropagation(); navigate(`/products/${record.skuCode}/edit`); }} style={{ color: '#FF6B00' }}>编辑</a>) },
    ];
    return all.filter((c) => visibleCols.includes(c.key as string));
  }, [navigate, visibleCols]);

  // ========== 绘制各 Drawer 内容 ==========

  const renderDrawerContent = () => {
    switch (activeDrawer) {
      case 'autoOnShelf':
        return (
          <div>
            <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text strong>启用自动上架</Text>
              <Switch checked={autoOnShelf.enabled} onChange={(v) => setAutoOnShelf((p) => ({ ...p, enabled: v }))} />
            </div>
            <Divider style={{ margin: '12px 0' }} />
            <div style={{ marginBottom: 16 }}>
              <Text>新品导入后</Text>
              <InputNumber min={1} max={30} value={autoOnShelf.daysAfterImport} onChange={(v) => setAutoOnShelf((p) => ({ ...p, daysAfterImport: v || 3 }))} style={{ width: 80, margin: '0 8px' }} />
              <Text>天自动上架</Text>
            </div>
            <div style={{ marginBottom: 8 }}><Text strong>适用商品分类：</Text></div>
            <Select mode="multiple" style={{ width: '100%' }} value={autoOnShelf.categories} onChange={(v) => setAutoOnShelf((p) => ({ ...p, categories: v }))}
              options={CATEGORIES.map((c) => ({ value: c, label: c }))} />
            <Divider style={{ margin: '16px 0' }} />
            <Alert message="当前配置：新品导入后 3 天自动上架，适用于制动系统、动力系统品类" type="info" showIcon />
          </div>
        );

      case 'autoOffShelf':
        return (
          <div>
            <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text strong>启用自动下架</Text>
              <Switch checked={autoOffShelf.enabled} onChange={(v) => setAutoOffShelf((p) => ({ ...p, enabled: v }))} />
            </div>
            <Divider style={{ margin: '12px 0' }} />
            <div style={{ marginBottom: 16 }}>
              <Text>连续</Text>
              <InputNumber min={1} max={365} value={autoOffShelf.zeroSalesDays} onChange={(v) => setAutoOffShelf((p) => ({ ...p, zeroSalesDays: v || 30 }))} style={{ width: 80, margin: '0 8px' }} />
              <Text>天零销量自动下架</Text>
            </div>
            <div style={{ marginBottom: 16 }}>
              <Text>库存低于</Text>
              <InputNumber min={1} max={100} value={autoOffShelf.lowStockThreshold} onChange={(v) => setAutoOffShelf((p) => ({ ...p, lowStockThreshold: v || 5 }))} style={{ width: 80, margin: '0 8px' }} />
              <Text>件触发预警</Text>
            </div>
            <div style={{ marginBottom: 8 }}><Text strong>排除商品分类：</Text></div>
            <Select mode="multiple" style={{ width: '100%' }} value={autoOffShelf.excludeCategories} onChange={(v) => setAutoOffShelf((p) => ({ ...p, excludeCategories: v }))}
              options={CATEGORIES.map((c) => ({ value: c, label: c }))} />
            <Divider style={{ margin: '16px 0' }} />
            <Alert message="排除分类中的商品不会触发自动下架，避免蓄电池等长周期商品被误判" type="warning" showIcon />
          </div>
        );

      case 'visibility':
        return (
          <div>
            <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text strong>启用二网默认不可见</Text>
              <Switch checked={visibility.enabled} onChange={(v) => setVisibility((p) => ({ ...p, enabled: v }))} />
            </div>
            <Divider style={{ margin: '12px 0' }} />
            <Collapse defaultActiveKey={['hidden', 'whitelist']} size="small">
              <Panel header={<Text strong>对二网不可见的品类</Text>} key="hidden">
                <Select mode="multiple" style={{ width: '100%' }} value={visibility.hiddenCategories} onChange={(v) => setVisibility((p) => ({ ...p, hiddenCategories: v }))}
                  options={CATEGORIES.map((c) => ({ value: c, label: c }))} />
                <Text type="secondary" style={{ display: 'block', marginTop: 8, fontSize: 12 }}>
                  选中的品类对二网经销商默认不可见
                </Text>
              </Panel>
              <Panel header={<Text strong>二网经销商白名单（可查看被隐藏品类）</Text>} key="whitelist">
                <Select mode="multiple" style={{ width: '100%' }} value={visibility.tier2Whitelist} onChange={(v) => setVisibility((p) => ({ ...p, tier2Whitelist: v }))}
                  options={DEALER_LIST.filter((d) => d.tier === '二网').map((d) => ({ value: d.id, label: d.name }))} />
              </Panel>
              <Panel header={<Text strong>一网经销商黑名单（不可查看）</Text>} key="blacklist">
                <Select mode="multiple" style={{ width: '100%' }} value={visibility.tier1Blacklist} onChange={(v) => setVisibility((p) => ({ ...p, tier1Blacklist: v }))}
                  options={DEALER_LIST.filter((d) => d.tier === '一网').map((d) => ({ value: d.id, label: d.name }))} />
              </Panel>
            </Collapse>
            <Divider style={{ margin: '16px 0' }} />
            <Alert message="二网经销商默认不可见指定品类，白名单中的二网经销商和所有一网经销商正常可见" type="info" showIcon />
          </div>
        );

      case 'pinTop':
        return (
          <div>
            <div style={{ marginBottom: 16 }}>
              <Text strong>搜索商品加入置顶：</Text>
              <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
                <Input placeholder="输入SKU编码或名称搜索" value={pinSearchSku} onChange={(e) => setPinSearchSku(e.target.value)}
                  onPressEnter={() => {
                    const found = mockProducts.find((p) => p.skuCode.toLowerCase().includes(pinSearchSku.toLowerCase()) || p.skuName.includes(pinSearchSku));
                    if (found) {
                      if (pinnedProducts.some((pp) => pp.skuCode === found.skuCode)) { message.warning('该商品已在置顶列表中'); return; }
                      setPinnedProducts((prev) => [{ skuCode: found.skuCode, skuName: found.skuName, pinnedAt: new Date().toISOString() }, ...prev]);
                      setPinSearchSku('');
                      message.success(`${found.skuName} 已置顶`);
                    } else if (pinSearchSku) { message.error('未找到匹配商品'); }
                  }}
                  suffix={<PlusCircleOutlined style={{ color: '#FF6B00', cursor: 'pointer' }} />}
                />
              </div>
            </div>
            <Divider style={{ margin: '12px 0' }} />
            <Text strong>当前置顶商品（{pinnedProducts.length}）：</Text>
            {pinnedProducts.length === 0 ? (
              <Empty description="暂无置顶商品" style={{ marginTop: 24 }} />
            ) : (
              <List
                style={{ marginTop: 12 }}
                dataSource={pinnedProducts}
                renderItem={(item, idx) => (
                  <List.Item
                    actions={[
                      <Button size="small" danger icon={<DeleteOutlined />} key="unpin"
                        onClick={() => { setPinnedProducts((prev) => prev.filter((p) => p.skuCode !== item.skuCode)); message.success('已取消置顶'); }}>
                        取消置顶
                      </Button>
                    ]}
                  >
                    <List.Item.Meta
                      avatar={<Tag color="orange" style={{ margin: 0 }}>置顶 {idx + 1}</Tag>}
                      title={<span style={{ fontFamily: 'monospace' }}>{item.skuCode}</span>}
                      description={`${item.skuName} · 置顶时间: ${item.pinnedAt.replace('T', ' ').substring(0, 16)}`}
                    />
                  </List.Item>
                )}
              />
            )}
          </div>
        );

      case 'sortRule':
        return (
          <div>
            <Text strong>商城商品排序规则（拖拽调整优先级）：</Text>
            <div style={{ marginTop: 12 }}>
              {sortRules
                .sort((a, b) => a.priority - b.priority)
                .map((rule, idx) => (
                  <Card key={rule.field} size="small" style={{ marginBottom: 8, borderColor: rule.enabled ? '#FF6B00' : '#F0F0F0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Space>
                        <Tag color={rule.enabled ? '#FF6B00' : '#8C8C8C'}>优先级 {idx + 1}</Tag>
                        <Text strong={rule.enabled} delete={!rule.enabled}>{rule.label}</Text>
                        <Tag>{rule.direction === 'desc' ? '降序 ↓' : '升序 ↑'}</Tag>
                      </Space>
                      <Switch size="small" checked={rule.enabled} onChange={(v) => {
                        setSortRules((prev) => prev.map((r) => r.field === rule.field ? { ...r, enabled: v } : r));
                      }} />
                    </div>
                  </Card>
                ))}
            </div>
            <Divider style={{ margin: '12px 0' }} />
            <Space>
              <Button size="small" icon={<SwapOutlined />}
                onClick={() => {
                  const enabled = sortRules.filter((r) => r.enabled).sort((a, b) => a.priority - b.priority);
                  if (enabled.length < 2) { message.warning('至少需要2个启用的规则才能对调'); return; }
                  const reordered = sortRules.map((r) => {
                    if (r.field === enabled[0].field) return { ...r, priority: enabled[1].priority };
                    if (r.field === enabled[1].field) return { ...r, priority: enabled[0].priority };
                    return r;
                  });
                  setSortRules(reordered);
                  message.success('优先级已对调');
                }}>
                对调前两个优先级
              </Button>
              <Button size="small" onClick={() => {
                setSortRules((prev) => prev.map((r, i) => ({ ...r, priority: i + 1 })));
                message.success('优先级已重置');
              }}>
                重置优先级
              </Button>
            </Space>
          </div>
        );

      default:
        return null;
    }
  };

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

      {/* ========== 规则配置入口 ========== */}
      <Card
        size="small"
        style={{ marginBottom: 16, background: '#FAFAFA' }}
        title={<Space><SettingOutlined /><Text strong style={{ fontSize: 14 }}>规则配置</Text></Space>}
        extra={<Button size="small" type="link" onClick={() => navigate('/products/inventory-share')} icon={<SwapOutlined />}>库存共享管理 →</Button>}
      >
        <Row gutter={[12, 12]}>
          {RULES.map((rule) => (
            <Col xs={24} sm={12} md={Math.floor(24 / 5)} key={rule.key}>
              <div
                onClick={() => setActiveDrawer(rule.key)}
                style={{
                  cursor: 'pointer', padding: '14px 16px', borderRadius: 8,
                  background: '#FFFFFF', border: '1px solid #F0F0F0',
                  transition: 'all 0.2s', height: '100%',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = rule.color; e.currentTarget.style.boxShadow = `0 2px 8px ${rule.color}20`; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#F0F0F0'; e.currentTarget.style.boxShadow = 'none'; }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 20, color: rule.color }}>{rule.icon}</span>
                  <div>
                    <Text strong style={{ fontSize: 13 }}>{rule.title}</Text>
                    <br />
                    <Text type="secondary" style={{ fontSize: 11 }}>{rule.desc}</Text>
                  </div>
                </div>
              </div>
            </Col>
          ))}
        </Row>
      </Card>

      {/* ========== 右侧 Drawer ========== */}
      <Drawer
        title={<Space>{RULES.find((r) => r.key === activeDrawer)?.icon}<span>{RULES.find((r) => r.key === activeDrawer)?.title}</span></Space>}
        open={activeDrawer !== null}
        onClose={() => setActiveDrawer(null)}
        width={480}
        extra={
          <Button type="primary" size="small" onClick={() => { message.success('规则配置已保存'); setActiveDrawer(null); }}>
            保存配置
          </Button>
        }
      >
        {renderDrawerContent()}
      </Drawer>

      {/* ========== 筛选区 ========== */}
      <Card size="small" style={{ marginBottom: 16 }}>
        <Row gutter={[16, 12]}>
          <Col span={4}><Input placeholder="SKU编码搜索" prefix={<SearchOutlined />} value={filters.skuCode} onChange={(e) => setFilters((f) => ({ ...f, skuCode: e.target.value }))} allowClear /></Col>
          <Col span={4}><Input placeholder="商品名称搜索" value={filters.skuName} onChange={(e) => setFilters((f) => ({ ...f, skuName: e.target.value }))} allowClear /></Col>
          <Col span={4}><Input placeholder="分类搜索" value={filters.category} onChange={(e) => setFilters((f) => ({ ...f, category: e.target.value }))} allowClear /></Col>
          <Col span={3}><Select mode="multiple" placeholder="状态" style={{ width: '100%' }} value={filters.statuses} onChange={(vals) => setFilters((f) => ({ ...f, statuses: vals }))} options={Object.entries(PRODUCT_STATUS_MAP).map(([k, v]) => ({ value: k, label: v.label }))} maxTagCount={1} /></Col>
          <Col span={3}><Select placeholder="基地来源" style={{ width: '100%' }} value={filters.baseSource || undefined} onChange={(val) => setFilters((f) => ({ ...f, baseSource: val || '' }))} allowClear options={['华东基地', '华南基地', '华北基地', '西南基地'].map((b) => ({ value: b, label: b }))} /></Col>
          <Col span={3}><Select mode="multiple" placeholder="商品标签" style={{ width: '100%' }} value={filters.tags} onChange={(v) => setFilters((f) => ({ ...f, tags: v }))} options={Object.entries(PRODUCT_TAG_MAP).map(([k, v]) => ({ value: k, label: v.label }))} maxTagCount={1} /></Col>
          <Col span={3}>
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
          {/* Note: Row click goes to ProductDetail, edit button in detail page */}
      </Card>
    </div>
  );
}
