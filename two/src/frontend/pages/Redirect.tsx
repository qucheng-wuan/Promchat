import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Spin } from 'antd';

// 简单的重定向组件，用于处理登录跳转问题
const Redirect: React.FC = () => {
  const navigate = useNavigate();
  
  useEffect(() => {
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    
    // 短暂延迟后重定向
    setTimeout(() => {
      if (isLoggedIn) {
        navigate('/', { replace: true });
      } else {
        navigate('/login', { replace: true });
      }
    }, 100);
  }, [navigate]);
  
  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh',
      flexDirection: 'column',
      background: '#f0f2f5'
    }}>
      <Spin size="large" />
      <div style={{ marginTop: 16 }}>正在加载系统，请稍候...</div>
    </div>
  );
};

export default Redirect; 