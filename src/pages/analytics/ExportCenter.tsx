import { Card, Table, Button, Tag, Space, Typography, message, Switch } from 'antd';
import { DownloadOutlined, RedoOutlined, DeleteOutlined, ClockCircleOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { exportTasks } from '../../data/mockData';

const { Title, Text } = Typography;

interface ExportRow { taskNo: string; taskName: string; format: 'EXCEL' | 'PDF'; status: string; createTime: string; expireTime: string; downloadUrl?: string; rowCount: number; }

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  COMPLETED: { label: '已完成', color: '#16A34A' },
  GENERATING: { label: '生成中', color: '#FF6B00' },
  QUEUED: { label: '排队中', color: '#8C8C8C' },
  FAILED: { label: '失败', color: '#E11D48' },
};

export default function ExportCenter() {
  const columns: ColumnsType<ExportRow> = [
    { title: '任务编号', dataIndex: 'taskNo', width: 110, render: (v: string) => <span style={{ fontFamily: 'monospace', fontSize: 12 }}>{v}</span> },
    { title: '任务名称', dataIndex: 'taskName', width: 200 },
    { title: '格式', dataIndex: 'format', width: 60, render: (f: string) => <Tag>{f}</Tag> },
    { title: '行数', dataIndex: 'rowCount', width: 80, align: 'center', render: (v: number) => v.toLocaleString() },
    { title: '状态', dataIndex: 'status', width: 90, render: (s: string) => { const info = STATUS_MAP[s]; return <Tag color={info?.color}>{info?.label}</Tag>; } },
    { title: '创建时间', dataIndex: 'createTime', width: 160, render: (t: string) => t.replace('T', ' ').substring(0, 16) },
    { title: '有效期至', dataIndex: 'expireTime', width: 160, render: (t: string) => t.replace('T', ' ').substring(0, 16) },
    { title: '操作', key: 'actions', width: 150, render: (_: unknown, r: ExportRow) => (
      <Space size="small">
        {r.status === 'COMPLETED' && <Button size="small" type="primary" icon={<DownloadOutlined />} onClick={() => message.success('开始下载')}>下载</Button>}
        {r.status === 'FAILED' && <Button size="small" icon={<RedoOutlined />} onClick={() => message.success('已重新提交')}>重试</Button>}
        {r.status === 'COMPLETED' && <Button size="small" danger icon={<DeleteOutlined />} onClick={() => message.success('已删除')}>删除</Button>}
      </Space>
    )},
  ];

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={4} style={{ margin: 0 }}>导出中心</Title>
        <Button type="primary" icon={<DownloadOutlined />}>新建导出任务</Button>
      </div>

      {/* 定时导出配置 */}
      <Card size="small" style={{ marginBottom: 16, background: '#FAFAFA' }}>
        <Space>
          <ClockCircleOutlined style={{ color: '#FF6B00' }} />
          <Text strong>定时导出：</Text>
          <Text>每月1日自动导出上月达成率报表</Text>
          <Switch size="small" defaultChecked />
          <Text type="secondary" style={{ marginLeft: 16 }}>发送至：</Text>
          <Tag color="blue">zhangjianguo@yadi.com</Tag>
          <Button size="small" type="link">配置邮箱</Button>
        </Space>
      </Card>

      <Card>
        <Table rowKey="taskNo" columns={columns} dataSource={exportTasks} size="middle"
          pagination={{ defaultPageSize: 20, showTotal: (total) => `共 ${total} 条` }} />
      </Card>
    </div>
  );
}
