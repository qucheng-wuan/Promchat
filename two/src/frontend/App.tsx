import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ConfigProvider, Layout, message } from 'antd';
import zhCN from 'antd/locale/zh_CN';

import MainHeader from './components/MainHeader';
import CodeEditor from './pages/CodeEditor';
import Dashboard from './pages/Dashboard';
import History from './pages/History';
import Settings from './pages/Settings';
import Login from './pages/Login';
import Redirect from './pages/Redirect';
import UserDashboard from './pages/UserDashboard';

const { Content, Footer } = Layout;

// 身份验证路由组件
const ProtectedRoute = ({ children, requiredRole }: { children: React.ReactNode, requiredRole?: string }) => {
  const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
  const userRole = localStorage.getItem('userRole');
  const location = useLocation();

  // 检查是否登录
  if (!isLoggedIn) {
    // 重定向到登录页面，并保存尝试访问的URL
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 如果有角色要求，验证用户角色
  if (requiredRole && requiredRole !== userRole) {
    message.error('您没有权限访问此页面');
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

const App: React.FC = () => {
  const location = useLocation();
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    return localStorage.getItem('isLoggedIn') === 'true';
  });
  const [userRole, setUserRole] = useState<string>(() => {
    return localStorage.getItem('userRole') || '';
  });
  
  // 检查登录状态和角色
  const checkLoginStatus = () => {
    const loginStatus = localStorage.getItem('isLoggedIn') === 'true';
    const role = localStorage.getItem('userRole') || '';
    setIsLoggedIn(loginStatus);
    setUserRole(role);
  };
  
  useEffect(() => {
    // 初始检查
    checkLoginStatus();
    
    // 监听登录状态变化
    window.addEventListener('storage', checkLoginStatus);
    
    // 监听路由变化时也检查登录状态
    checkLoginStatus();
    
    // 清理函数
    return () => {
      window.removeEventListener('storage', checkLoginStatus);
    };
  }, [location.pathname]); // 当路由变化时重新检查
  
  // 直接判断登录页面特殊处理
  if (location.pathname === '/login' && isLoggedIn) {
    return <Navigate to={userRole === 'admin' ? '/dashboard' : '/'} replace />;
  }
  
  return (
    <ConfigProvider locale={zhCN}>
      {isLoggedIn ? (
      <Layout style={{ minHeight: '100vh' }}>
          <MainHeader userRole={userRole} />
        <Content style={{ padding: '24px', backgroundColor: '#f0f2f5' }}>
          <Routes>
              {/* 代码编辑器 - 所有用户可访问 */}
              <Route path="/" element={
                <ProtectedRoute>
                  <CodeEditor />
                </ProtectedRoute>
              } />
              
              {/* 管理员仪表盘 - 仅管理员可访问 */}
              <Route path="/dashboard" element={
                <ProtectedRoute requiredRole="admin">
                  <Dashboard />
                </ProtectedRoute>
              } />
              
              {/* 用户个人仪表盘 - 所有用户可访问 */}
              <Route path="/user-dashboard" element={
                <ProtectedRoute>
                  <UserDashboard />
                </ProtectedRoute>
              } />
              
              {/* 历史记录 - 所有用户可访问 */}
              <Route path="/history" element={
                <ProtectedRoute>
                  <History />
                </ProtectedRoute>
              } />
              
              {/* 设置页面 - 仅管理员可访问 */}
              <Route path="/settings" element={
                <ProtectedRoute requiredRole="admin">
                  <Settings />
                </ProtectedRoute>
              } />
              
              <Route path="/login" element={<Login />} />
              <Route path="/redirect" element={<Redirect />} />
              <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Content>
        <Footer style={{ textAlign: 'center' }}>
          代码漏洞修复系统 ©{new Date().getFullYear()} 版权所有
        </Footer>
      </Layout>
      ) : (
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/redirect" element={<Redirect />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      )}
    </ConfigProvider>
  );
};

export default App; 