import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider, App as AntApp } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import theme from './theme';
import MainLayout from './layouts/MainLayout';
import Dashboard from './pages/Dashboard';
import OrderList from './pages/orders/OrderList';
import OrderDetail from './pages/orders/OrderDetail';
import AppointmentList from './pages/orders/AppointmentList';
import ExceptionList from './pages/exceptions/ExceptionList';

function App() {
  return (
    <ConfigProvider theme={theme} locale={zhCN}>
      <AntApp>
        <BrowserRouter>
          <Routes>
            <Route element={<MainLayout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/orders" element={<OrderList />} />
              <Route path="/orders/:orderNo" element={<OrderDetail />} />
              <Route path="/orders/appointments" element={<AppointmentList />} />
              <Route path="/exceptions" element={<ExceptionList />} />
              <Route path="/orders/custom" element={<PlaceholderPage title="定制订单" />} />
              <Route path="/orders/call400" element={<PlaceholderPage title="400免费订单" />} />
              <Route path="/orders/invoices" element={<PlaceholderPage title="开票管理" />} />
              <Route path="/exceptions/returns" element={<PlaceholderPage title="退换货管理" />} />
              <Route path="/exceptions/logistics" element={<PlaceholderPage title="运单查询" />} />
              <Route path="/exceptions/sign-off" element={<PlaceholderPage title="签收管理" />} />
              <Route path="/products" element={<PlaceholderPage title="商品管理" />} />
              <Route path="/analytics" element={<PlaceholderPage title="数据分析" />} />
              <Route path="/reconciliation" element={<PlaceholderPage title="对账中心" />} />
              <Route path="/settings" element={<PlaceholderPage title="系统设置" />} />
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AntApp>
    </ConfigProvider>
  );
}

function PlaceholderPage({ title }: { title: string }) {
  return (
    <div
      style={{
        background: '#FFFFFF',
        borderRadius: 8,
        padding: '80px 24px',
        textAlign: 'center',
      }}
    >
      <div style={{ fontSize: 48, marginBottom: 16 }}>🚧</div>
      <h2 style={{ color: '#595959', marginBottom: 8 }}>{title}</h2>
      <p style={{ color: '#8C8C8C' }}>此模块正在开发中，敬请期待...</p>
    </div>
  );
}

export default App;
