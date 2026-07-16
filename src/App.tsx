import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider, App as AntApp } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import theme from './theme';
import MainLayout from './layouts/MainLayout';
import Dashboard from './pages/Dashboard';
import OrderList from './pages/orders/OrderList';
import OrderDetail from './pages/orders/OrderDetail';
import AppointmentList from './pages/orders/AppointmentList';
import CustomOrderList from './pages/orders/CustomOrderList';
import CustomOrderDetail from './pages/orders/CustomOrderDetail';
import Call400List from './pages/orders/Call400List';
import VehicleShipping from './pages/orders/VehicleShipping';
import ExceptionList from './pages/exceptions/ExceptionList';
import LogisticsList from './pages/exceptions/LogisticsList';
import LogisticsDetail from './pages/exceptions/LogisticsDetail';
import ProductList from './pages/products/ProductList';
import ProductEdit from './pages/products/ProductEdit';
import InventoryShare from './pages/products/InventoryShare';
import OrderForecast from './pages/analytics/OrderForecast';
import CustomerBehavior from './pages/analytics/CustomerBehavior';
import FulfillmentEfficiency from './pages/analytics/FulfillmentEfficiency';
import WarrantyBusiness from './pages/analytics/WarrantyBusiness';
import ReconciliationList from './pages/reconciliation/ReconciliationList';
import DifferenceHandle from './pages/reconciliation/DifferenceHandle';
import PaymentVerification from './pages/reconciliation/PaymentVerification';
import ReconciliationReports from './pages/reconciliation/ReconciliationReports';
import SettingsHub from './pages/settings/SettingsHub';

function App() {
  return (
    <ConfigProvider theme={theme} locale={zhCN}>
      <AntApp>
        <BrowserRouter>
          <Routes>
            <Route element={<MainLayout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              {/* 订单管理 */}
              <Route path="/orders" element={<OrderList />} />
              <Route path="/orders/:orderNo" element={<OrderDetail />} />
              <Route path="/orders/appointments" element={<AppointmentList />} />
              <Route path="/orders/custom" element={<CustomOrderList />} />
              <Route path="/orders/custom/:customNo" element={<CustomOrderDetail />} />
              <Route path="/orders/call400" element={<Call400List />} />
              <Route path="/orders/vehicle-shipping" element={<VehicleShipping />} />
              <Route path="/orders/invoices" element={<PlaceholderPage title="开票管理" />} />
              {/* 异常中心 */}
              <Route path="/exceptions" element={<ExceptionList />} />
              <Route path="/exceptions/returns" element={<PlaceholderPage title="退换货管理" />} />
              <Route path="/exceptions/logistics" element={<LogisticsList />} />
              <Route path="/exceptions/logistics/:trackingNo" element={<LogisticsDetail />} />
              <Route path="/exceptions/sign-off" element={<PlaceholderPage title="签收管理" />} />
              {/* 商品管理 */}
              <Route path="/products" element={<ProductList />} />
              <Route path="/products/new" element={<ProductEdit />} />
              <Route path="/products/inventory-share" element={<InventoryShare />} />
              <Route path="/products/:skuCode" element={<ProductEdit />} />
              {/* 数据分析 */}
              <Route path="/analytics/order-forecast" element={<OrderForecast />} />
              <Route path="/analytics/customer-behavior" element={<CustomerBehavior />} />
              <Route path="/analytics/fulfillment-efficiency" element={<FulfillmentEfficiency />} />
              <Route path="/analytics/warranty-business" element={<WarrantyBusiness />} />
              {/* 对账中心 */}
              <Route path="/reconciliation" element={<ReconciliationList />} />
              <Route path="/reconciliation/differences" element={<DifferenceHandle />} />
              <Route path="/reconciliation/payments" element={<PaymentVerification />} />
              <Route path="/reconciliation/reports" element={<ReconciliationReports />} />
              {/* 系统设置 */}
              <Route path="/settings" element={<SettingsHub />} />
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
    <div style={{ background: '#FFFFFF', borderRadius: 8, padding: '80px 24px', textAlign: 'center' }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>🚧</div>
      <h2 style={{ color: '#595959', marginBottom: 8 }}>{title}</h2>
      <p style={{ color: '#8C8C8C' }}>此模块正在开发中，敬请期待...</p>
    </div>
  );
}

export default App;
