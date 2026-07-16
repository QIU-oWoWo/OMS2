import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  Layout,
  Menu,
  Input,
  Badge,
  Avatar,
  Dropdown,
  Space,
  Typography,
  theme as antdTheme,
} from 'antd';
import {
  DashboardOutlined,
  ShoppingCartOutlined,
  WarningOutlined,
  AppstoreOutlined,
  BarChartOutlined,
  DollarOutlined,
  SettingOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  SearchOutlined,
  BellOutlined,
  UserOutlined,
  LogoutOutlined,
  PlusOutlined,
  ScanOutlined,
  StockOutlined,
  AlertOutlined,
  CalendarOutlined,
  FileTextOutlined,
  FileProtectOutlined,
  EnvironmentOutlined,
  CheckSquareOutlined,
  SwapOutlined,
  ClockCircleOutlined,
  TrophyOutlined,
  SafetyCertificateOutlined,
  DownloadOutlined,
  AuditOutlined,
  WalletOutlined,
  CreditCardOutlined,
  PieChartOutlined,
} from '@ant-design/icons';
import type { MenuProps } from 'antd';

const { Header, Sider, Content } = Layout;
const { Text } = Typography;

type MenuItem = Required<MenuProps>['items'][number];

const menuItems: MenuItem[] = [
  {
    key: '/dashboard',
    icon: <DashboardOutlined />,
    label: '工作台',
  },
  {
    key: 'orders',
    icon: <ShoppingCartOutlined />,
    label: '订单管理',
    children: [
      { key: '/orders', icon: <FileTextOutlined />, label: '订单列表' },
      { key: '/orders/appointments', icon: <CalendarOutlined />, label: '预约单管理' },
      { key: '/orders/custom', icon: <AppstoreOutlined />, label: '定制订单' },
      { key: '/orders/call400', icon: <FileProtectOutlined />, label: '400免费订单' },
      { key: '/orders/invoices', icon: <DollarOutlined />, label: '开票管理' },
    ],
  },
  {
    key: 'exceptions',
    icon: <WarningOutlined />,
    label: '异常中心',
    children: [
      { key: '/exceptions', icon: <AlertOutlined />, label: '异常列表' },
      { key: '/exceptions/returns', icon: <FileTextOutlined />, label: '退换货管理' },
      { key: '/exceptions/logistics', icon: <EnvironmentOutlined />, label: '运单查询' },
      { key: '/exceptions/sign-off', icon: <CheckSquareOutlined />, label: '签收管理' },
    ],
  },
  {
    key: 'products',
    icon: <AppstoreOutlined />,
    label: '商品管理',
    children: [
      { key: '/products', icon: <AppstoreOutlined />, label: '商品列表' },
      { key: '/products/inventory-share', icon: <SwapOutlined />, label: '库存共享管理' },
    ],
  },
  {
    key: 'analytics',
    icon: <BarChartOutlined />,
    label: '数据分析',
    children: [
      { key: '/analytics/order-forecast', icon: <RiseOutlined />, label: '订单量预测' },
      { key: '/analytics/customer-behavior', icon: <UserOutlined />, label: '客户购买行为' },
      { key: '/analytics/fulfillment-efficiency', icon: <ClockCircleOutlined />, label: '履约效率分析' },
      { key: '/analytics/warranty-business', icon: <SafetyCertificateOutlined />, label: '三包与经营数据' },
    ],
  },
  {
    key: 'reconciliation',
    icon: <DollarOutlined />,
    label: '对账中心',
    children: [
      { key: '/reconciliation', icon: <AuditOutlined />, label: '对账单管理' },
      { key: '/reconciliation/differences', icon: <WarningOutlined />, label: '差异处理' },
      { key: '/reconciliation/payments', icon: <CreditCardOutlined />, label: '回款核销' },
      { key: '/reconciliation/reports', icon: <PieChartOutlined />, label: '结算报表' },
    ],
  },
  {
    key: '/settings',
    icon: <SettingOutlined />,
    label: '系统设置',
  },
];

export default function MainLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { token } = antdTheme.useToken();

  // 计算当前选中的菜单
  const selectedKey = '/' + location.pathname.split('/').slice(1, 3).join('/');
  const openKeys = location.pathname.split('/')[1] ? [location.pathname.split('/')[1]] : [''];

  const onMenuClick: MenuProps['onClick'] = ({ key }) => {
    navigate(key);
  };

  const userMenuItems: MenuProps['items'] = [
    { key: 'profile', icon: <UserOutlined />, label: '个人中心' },
    { key: 'settings', icon: <SettingOutlined />, label: '账号设置' },
    { type: 'divider' },
    { key: 'logout', icon: <LogoutOutlined />, label: '退出登录', danger: true },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {/* 侧边栏 */}
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        width={220}
        collapsedWidth={64}
        style={{
          overflow: 'auto',
          height: '100vh',
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
          zIndex: 100,
        }}
      >
        {/* Logo */}
        <div
          style={{
            height: 56,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderBottom: '1px solid rgba(255,255,255,0.1)',
            padding: collapsed ? '0 16px' : '0 20px',
          }}
        >
          {collapsed ? (
            <span style={{ color: '#FF6B00', fontSize: 22, fontWeight: 800 }}>Y</span>
          ) : (
            <Space align="center" size={10}>
              <span
                style={{
                  color: '#FF6B00',
                  fontSize: 20,
                  fontWeight: 800,
                  letterSpacing: 1,
                }}
              >
                雅迪配件OMS
              </span>
            </Space>
          )}
        </div>

        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[selectedKey]}
          defaultOpenKeys={openKeys}
          items={menuItems}
          onClick={onMenuClick}
          style={{ borderRight: 0, marginTop: 4 }}
        />
      </Sider>

      {/* 右侧主区域 */}
      <Layout style={{ marginLeft: collapsed ? 64 : 220, transition: 'all 0.2s' }}>
        {/* 顶部导航 */}
        <Header
          style={{
            padding: '0 24px',
            background: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid #F0F0F0',
            position: 'sticky',
            top: 0,
            zIndex: 99,
            height: 56,
          }}
        >
          <Space size={16}>
            <span
              onClick={() => setCollapsed(!collapsed)}
              style={{ cursor: 'pointer', fontSize: 18, color: '#595959' }}
            >
              {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            </span>
            <Input
              placeholder="搜索订单号/经销商/VIN码..."
              prefix={<SearchOutlined style={{ color: '#BFBFBF' }} />}
              style={{ width: 360 }}
              allowClear
            />
          </Space>

          <Space size={20}>
            {/* 快捷操作 */}
            <Space size={8}>
              <span
                style={{
                  cursor: 'pointer',
                  padding: '4px 12px',
                  borderRadius: 4,
                  background: '#FFF3E8',
                  color: '#FF6B00',
                  fontSize: 13,
                  fontWeight: 500,
                }}
                onClick={() => navigate('/orders?action=create')}
              >
                <PlusOutlined style={{ marginRight: 4 }} />
                新建订单
              </span>
            </Space>

            {/* 通知 */}
            <Badge count={5} size="small">
              <BellOutlined style={{ fontSize: 18, cursor: 'pointer', color: '#595959' }} />
            </Badge>

            {/* 用户 */}
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
              <Space style={{ cursor: 'pointer' }}>
                <Avatar
                  size={32}
                  style={{ backgroundColor: '#FF6B00' }}
                  icon={<UserOutlined />}
                />
                <Text style={{ fontSize: 14, color: '#1A1A1A' }}>张建国</Text>
                <Text style={{ fontSize: 12, color: '#8C8C8C' }}>运营主管</Text>
              </Space>
            </Dropdown>
          </Space>
        </Header>

        {/* 内容区 */}
        <Content
          style={{
            padding: 24,
            background: '#F5F5F5',
            minHeight: 'calc(100vh - 56px)',
          }}
        >
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}
