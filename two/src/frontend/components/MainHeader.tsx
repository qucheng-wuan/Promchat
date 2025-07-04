import React from 'react';
import { Layout, Menu, Space, Dropdown, Avatar, message } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  CodeOutlined,
  DashboardOutlined,
  HistoryOutlined,
  SettingOutlined,
  UserOutlined,
  LogoutOutlined,
  AppstoreOutlined
} from '@ant-design/icons';
import ThemeToggle from './ThemeToggle';
import type { MenuProps } from 'antd';

const { Header } = Layout;

interface MainHeaderProps {
  userRole?: string;
}

const MainHeader: React.FC<MainHeaderProps> = ({ userRole = 'user' }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const username = localStorage.getItem('username') || 'Admin';
  const isAdmin = userRole === 'admin';
  
  // 根据用户角色构建菜单项
  const getMenuItems = () => {
    const baseItems = [
    {
      key: '/',
      icon: <CodeOutlined />,
      label: '代码修复'
    },
    {
      key: '/history',
      icon: <HistoryOutlined />,
      label: '历史记录'
      }
    ];
    
    // 普通用户看到个人仪表盘
    if (!isAdmin) {
      baseItems.push({
        key: '/user-dashboard',
        icon: <AppstoreOutlined />,
        label: '个人仪表盘'
      });
    }
    
    // 管理员可以访问全局仪表盘和设置
    if (isAdmin) {
      return [
        ...baseItems,
        {
          key: '/dashboard',
          icon: <DashboardOutlined />,
          label: '管理仪表盘'
    },
    {
      key: '/settings',
      icon: <SettingOutlined />,
          label: '系统设置'
    }
  ];
    }
    
    return baseItems;
  };

  const handleMenuClick = (e: { key: string }) => {
    navigate(e.key);
  };
  
  const handleLogout = () => {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('username');
    localStorage.removeItem('userRole');
    message.success('已成功退出登录');
    navigate('/login');
  };
  
  const userMenuItems: MenuProps['items'] = [
    {
      key: 'profile',
      label: '个人资料',
      icon: <UserOutlined />
    },
    {
      key: 'settings',
      label: '账号设置',
      icon: <SettingOutlined />
    },
    {
      type: 'divider'
    },
    {
      key: 'logout',
      label: '退出登录',
      icon: <LogoutOutlined />,
      danger: true,
      onClick: handleLogout
    }
  ];

  return (
    <Header style={{ display: 'flex', alignItems: 'center', padding: '0 16px' }}>
      <div style={{ 
        color: 'white', 
        fontSize: '20px', 
        fontWeight: 'bold',
        marginRight: '24px'
      }}>
        代码漏洞修复系统
        {isAdmin && <span style={{ fontSize: '14px', marginLeft: '8px', opacity: 0.7 }}>(管理员)</span>}
      </div>
      <Menu
        theme="dark"
        mode="horizontal"
        selectedKeys={[location.pathname]}
        items={getMenuItems()}
        onClick={handleMenuClick}
        style={{ flex: 1, minWidth: 0 }}
      />
      <Space style={{ marginLeft: '16px' }}>
        <ThemeToggle />
        <Dropdown menu={{ items: userMenuItems }} trigger={['click']} placement="bottomRight">
          <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
            <Avatar 
              style={{ backgroundColor: isAdmin ? '#f56a00' : '#1890ff' }}
              icon={<UserOutlined />}
            />
            <span style={{ color: 'white', marginLeft: '8px' }}>{username}</span>
          </div>
        </Dropdown>
      </Space>
    </Header>
  );
};

export default MainHeader; 