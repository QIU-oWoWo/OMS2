import { useState } from 'react';
import { Card, Table, Tag, Button, Space, Typography, Row, Col, Modal, Form, Input, InputNumber, Select, Switch, Descriptions, List, Divider, message, Tabs } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, CheckCircleOutlined, CloseCircleOutlined, SafetyCertificateOutlined, ApiOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { priceRules, promotions, baseConfigs, logisticsProviders, systemUsers, roles, auditLogs, systemParams } from '../../data/mockData';

const { Title, Text } = Typography;

// ====== 价格策略 Tab ======
function PricingTab() {
  const cols: ColumnsType<typeof priceRules[number]> = [
    { title: '规则编号', dataIndex: 'ruleNo', width: 110 },
    { title: '经销商等级', dataIndex: 'dealerGrade', width: 90, render: (v: string) => <Tag color="blue">{v}</Tag> },
    { title: '折扣系数', dataIndex: 'discountRate', width: 90, render: (v: number) => <strong>{v.toFixed(2)}</strong> },
    { title: '适用区域', dataIndex: 'region', width: 80 },
    { title: '生效日期', dataIndex: 'effectiveDate', width: 110 },
    { title: '状态', dataIndex: 'status', width: 80, render: (s: string) => <Tag color={s === 'ACTIVE' ? '#16A34A' : '#F59E0B'}>{s === 'ACTIVE' ? '生效中' : '待生效'}</Tag> },
    { title: '操作', key: 'act', width: 100, render: () => <Space><Button size="small" icon={<EditOutlined />}>编辑</Button></Space> },
  ];
  return <Card title="基准价与经销商等级折扣" extra={<Button size="small" type="primary" icon={<PlusOutlined />}>新增规则</Button>}><Table rowKey="ruleNo" size="small" columns={cols} dataSource={priceRules} pagination={false} /></Card>;
}

// ====== 促销规则 Tab ======
function PromotionsTab() {
  const cols: ColumnsType<typeof promotions[number]> = [
    { title: '编号', dataIndex: 'promoNo', width: 110 },
    { title: '活动名称', dataIndex: 'promoName', width: 150 },
    { title: '类型', dataIndex: 'type', width: 90, render: (t: string) => { const m: Record<string, string> = { FULL_REDUCTION: '满减', DISCOUNT: '折扣', BUY_GIFT: '买赠', COMBO: '组合' }; return <Tag>{m[t] || t}</Tag>; } },
    { title: '开始', dataIndex: 'startDate', width: 100 },
    { title: '结束', dataIndex: 'endDate', width: 100 },
    { title: '状态', dataIndex: 'status', width: 80, render: (s: string) => <Tag color={s === 'ACTIVE' ? '#16A34A' : s === 'DRAFT' ? '#F59E0B' : '#8C8C8C'}>{s === 'ACTIVE' ? '进行中' : s === 'DRAFT' ? '草稿' : '已过期'}</Tag> },
    { title: '适用SKU', dataIndex: 'applicableSkus', width: 200, render: (skus: string[]) => skus.slice(0, 2).join(', ') + (skus.length > 2 ? ` +${skus.length - 2}` : '') },
    { title: '操作', key: 'act', width: 100, render: () => <Space><Button size="small" icon={<EditOutlined />}>编辑</Button><Button size="small" danger icon={<DeleteOutlined />}>删除</Button></Space> },
  ];
  return <Card title="促销规则列表" extra={<Button size="small" type="primary" icon={<PlusOutlined />}>创建促销</Button>}><Table rowKey="promoNo" size="small" columns={cols} dataSource={promotions} pagination={false} /></Card>;
}

// ====== 基地配置 Tab ======
function BasesTab() {
  const cols: ColumnsType<typeof baseConfigs[number]> = [
    { title: '基地编码', dataIndex: 'baseCode', width: 110 },
    { title: '基地名称', dataIndex: 'baseName', width: 100 },
    { title: '所属区域', dataIndex: 'region', width: 70 },
    { title: '负责人', dataIndex: 'manager', width: 70 },
    { title: '联系电话', dataIndex: 'phone', width: 120 },
    { title: '关联仓库', dataIndex: 'warehouseCount', width: 80, align: 'center', render: (v: number) => `${v} 个` },
    { title: 'SLA时效(h)', dataIndex: 'slaHours', width: 90 },
    { title: '状态', dataIndex: 'status', width: 80, render: (s: string) => <Tag color={s === 'ACTIVE' ? '#16A34A' : '#8C8C8C'}>{s === 'ACTIVE' ? '启用' : '停用'}</Tag> },
    { title: '操作', key: 'act', width: 80, render: () => <Button size="small" icon={<EditOutlined />}>编辑</Button> },
  ];
  return <Card title="基地配置" extra={<Button size="small" type="primary" icon={<PlusOutlined />}>新增基地</Button>}><Table rowKey="baseCode" size="small" columns={cols} dataSource={baseConfigs} pagination={false} /></Card>;
}

// ====== 物流公司 Tab ======
function LogisticsTab() {
  const cols: ColumnsType<typeof logisticsProviders[number]> = [
    { title: '编码', dataIndex: 'providerCode', width: 90 },
    { title: '物流公司', dataIndex: 'providerName', width: 100 },
    { title: '联系人', dataIndex: 'contact', width: 80 },
    { title: '电话', dataIndex: 'phone', width: 100 },
    { title: '服务区域', dataIndex: 'serviceArea', width: 90 },
    { title: 'API状态', dataIndex: 'apiStatus', width: 100, render: (s: string) => <Tag icon={<ApiOutlined />} color={s === 'CONNECTED' ? '#16A34A' : s === 'ERROR' ? '#E11D48' : '#8C8C8C'}>{s === 'CONNECTED' ? '已对接' : s === 'ERROR' ? '异常' : '未对接'}</Tag> },
    { title: '操作', key: 'act', width: 160, render: () => <Space><Button size="small" icon={<EditOutlined />}>配置</Button><Button size="small">运费模板</Button></Space> },
  ];
  return <Card title="物流公司管理" extra={<Button size="small" type="primary" icon={<PlusOutlined />}>新增物流公司</Button>}><Table rowKey="providerCode" size="small" columns={cols} dataSource={logisticsProviders} pagination={false} /></Card>;
}

// ====== 用户权限 Tab ======
function UsersTab() {
  const cols: ColumnsType<typeof systemUsers[number]> = [
    { title: '用户名', dataIndex: 'username', width: 110 },
    { title: '姓名', dataIndex: 'realName', width: 80 },
    { title: '角色', dataIndex: 'role', width: 90, render: (v: string) => <Tag>{v}</Tag> },
    { title: '部门', dataIndex: 'department', width: 80 },
    { title: '状态', dataIndex: 'status', width: 80, render: (s: string) => <Tag color={s === 'ENABLED' ? '#16A34A' : '#E11D48'}>{s === 'ENABLED' ? '启用' : '禁用'}</Tag> },
    { title: '最近登录', dataIndex: 'lastLoginTime', width: 160, render: (t: string) => t.replace('T', ' ').substring(0, 16) },
    { title: '操作', key: 'act', width: 100, render: () => <Space><Button size="small" icon={<EditOutlined />}>编辑</Button></Space> },
  ];
  return <Card title="用户列表" extra={<Space><Button icon={<PlusOutlined />}>批量导入</Button><Button type="primary" icon={<PlusOutlined />}>新增用户</Button></Space>}><Table rowKey="userId" size="small" columns={cols} dataSource={systemUsers} pagination={false} /></Card>;
}

// ====== 角色管理 Tab ======
function RolesTab() {
  const cols: ColumnsType<typeof roles[number]> = [
    { title: '角色名称', dataIndex: 'roleName', width: 100, render: (v: string) => <Text strong>{v}</Text> },
    { title: '用户数', dataIndex: 'userCount', width: 60, align: 'center' },
    { title: '数据范围', dataIndex: 'dataScope', width: 90, render: (v: string) => <Tag color="blue">{v}</Tag> },
    { title: '权限', dataIndex: 'permissions', width: 400, render: (perms: string[]) => perms.map((p) => <Tag key={p} style={{ marginBottom: 4 }}>{p}</Tag>) },
    { title: '操作', key: 'act', width: 80, render: () => <Button size="small" icon={<EditOutlined />}>编辑</Button> },
  ];
  return <Card title="角色管理" extra={<Button size="small" type="primary" icon={<PlusOutlined />}>新增角色</Button>}><Table rowKey="roleId" size="small" columns={cols} dataSource={roles} pagination={false} /></Card>;
}

// ====== 数据字典 Tab ======
function DictionaryTab() {
  const dictItems = [
    { group: '业务流程属性', items: ['常规', '预约', '定制', '400', '领用'] },
    { group: '响应时效属性', items: ['普通', '紧急', '特急'] },
    { group: '履约方式', items: ['直发（供应商→经销商）', '仓发（基地仓→经销商）'] },
    { group: '异常类型', items: ['缺货', '破损', '错发', '拒收', '超时', '地址异常', '其他'] },
    { group: '物流公司', items: ['顺丰', '京东', '德邦', '中通', '圆通'] },
    { group: '定制类型', items: ['改型加工', '特殊材质', '尺寸定制', '套件组装'] },
    { group: '退换货原因', items: ['质量问题', '错发', '不匹配', '经销商取消'] },
  ];
  return (
    <Card title="数据字典" extra={<Button size="small" type="primary" icon={<PlusOutlined />}>新增字典项</Button>}>
      {dictItems.map((group) => (
        <div key={group.group} style={{ marginBottom: 16 }}>
          <Text strong style={{ marginRight: 12 }}>{group.group}:</Text>
          {group.items.map((item) => <Tag key={item} style={{ marginBottom: 4 }}>{item}</Tag>)}
          <Button size="small" type="link" icon={<PlusOutlined />} style={{ fontSize: 12 }} />
        </div>
      ))}
    </Card>
  );
}

// ====== 接口配置 Tab ======
function IntegrationsTab() {
  const systems = [
    { name: 'WMS', desc: '库存同步、出入库指令', status: 'CONNECTED' },
    { name: 'TMS', desc: '物流轨迹、运单管理', status: 'CONNECTED' },
    { name: 'ERP', desc: '经销商主数据、价格同步', status: 'CONNECTED' },
    { name: '客服系统', desc: '400工单同步、投诉数据', status: 'CONNECTED' },
    { name: '税务系统', desc: '发票开具、红冲', status: 'DISCONNECTED' },
    { name: '短信/邮件网关', desc: '通知推送', status: 'CONNECTED' },
  ];
  return (
    <Card title="接口配置">
      <Row gutter={[16, 16]}>
        {systems.map((sys) => (
          <Col span={8} key={sys.name}>
            <Card size="small" hoverable>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <Text strong style={{ fontSize: 15 }}>{sys.name}</Text>
                  <br /><Text type="secondary" style={{ fontSize: 12 }}>{sys.desc}</Text>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <Tag icon={sys.status === 'CONNECTED' ? <CheckCircleOutlined /> : <CloseCircleOutlined />} color={sys.status === 'CONNECTED' ? '#16A34A' : '#E11D48'}>
                    {sys.status === 'CONNECTED' ? '已连接' : '未连接'}
                  </Tag>
                  <br /><Button size="small" type="link" style={{ marginTop: 4 }}>配置</Button>
                </div>
              </div>
            </Card>
          </Col>
        ))}
      </Row>
    </Card>
  );
}

// ====== 操作日志 Tab ======
function AuditLogTab() {
  const cols: ColumnsType<typeof auditLogs[number]> = [
    { title: '时间', dataIndex: 'createTime', width: 160, render: (t: string) => t.replace('T', ' ').substring(0, 16) },
    { title: '操作人', dataIndex: 'operator', width: 80 },
    { title: '模块', dataIndex: 'module', width: 90, render: (v: string) => <Tag>{v}</Tag> },
    { title: '操作类型', dataIndex: 'actionType', width: 80, render: (v: string) => <Tag color="blue">{v}</Tag> },
    { title: '操作对象', dataIndex: 'target', width: 160 },
    { title: '变更内容', dataIndex: 'changes', width: 200, ellipsis: true, render: (v: string) => <Text style={{ fontSize: 11, fontFamily: 'monospace' }}>{v.substring(0, 60)}...</Text> },
    { title: 'IP地址', dataIndex: 'ipAddress', width: 120, render: (v: string) => <span style={{ fontFamily: 'monospace', fontSize: 12 }}>{v}</span> },
  ];
  return <Card title="操作日志"><Table rowKey="logId" size="small" columns={cols} dataSource={auditLogs} pagination={{ defaultPageSize: 10, showTotal: (t) => `共 ${t} 条` }} /></Card>;
}

// ====== 系统参数 Tab ======
function ParamsTab() {
  const cols: ColumnsType<typeof systemParams[number]> = [
    { title: '参数项', dataIndex: 'paramName', width: 160 },
    { title: '参数键', dataIndex: 'paramKey', width: 120, render: (v: string) => <span style={{ fontFamily: 'monospace', fontSize: 12 }}>{v}</span> },
    { title: '说明', dataIndex: 'description', width: 200, ellipsis: true },
    { title: '默认值', dataIndex: 'defaultValue', width: 70 },
    { title: '当前值', dataIndex: 'paramValue', width: 130, render: (v: any, r: typeof systemParams[number]) => {
      if (r.type === 'SWITCH') return <Switch size="small" checked={v as boolean} onChange={() => message.success('参数已更新')} />;
      if (r.type === 'NUMBER') return <InputNumber size="small" value={v as number} style={{ width: 80 }} onChange={() => message.success('参数已更新')} />;
      return <Input size="small" value={v as string} style={{ width: 120 }} />;
    }},
  ];
  return <Card title="系统参数"><Table rowKey="paramKey" size="small" columns={cols} dataSource={systemParams} pagination={false} /></Card>;
}

// ====== Hub ======
export default function SettingsHub() {
  const [activeTab, setActiveTab] = useState('pricing');

  const tabItems = [
    { key: 'pricing', label: '价格策略', children: <PricingTab /> },
    { key: 'promotions', label: '促销规则', children: <PromotionsTab /> },
    { key: 'bases', label: '基地配置', children: <BasesTab /> },
    { key: 'logistics', label: '物流公司', children: <LogisticsTab /> },
    { key: 'users', label: '用户权限', children: <UsersTab /> },
    { key: 'roles', label: '角色管理', children: <RolesTab /> },
    { key: 'dictionary', label: '数据字典', children: <DictionaryTab /> },
    { key: 'integrations', label: '接口配置', children: <IntegrationsTab /> },
    { key: 'audit-log', label: '操作日志', children: <AuditLogTab /> },
    { key: 'params', label: '系统参数', children: <ParamsTab /> },
  ];

  return (
    <div>
      <Title level={4} style={{ marginBottom: 16 }}>系统设置</Title>
      <Card>
        <Tabs tabPosition="left" activeKey={activeTab} onChange={setActiveTab} items={tabItems} style={{ minHeight: 500 }} />
      </Card>
    </div>
  );
}
