import React, { useState } from 'react';
import { Form, Input, Button, Card, Typography, message, Space } from 'antd';
import { UserOutlined, LockOutlined, SafetyOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;

const Login: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const onFinish = (values: any) => {
    setLoading(true);
    
    // 模拟登录请求
    setTimeout(() => {
      const { username, password } = values;
      
      // 通过账号密码自动判断角色
      if (username === 'admin' && password === 'admin123') {
        // 管理员登录
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('username', username);
        localStorage.setItem('userRole', 'admin');
        
        message.success('管理员登录成功，欢迎使用代码漏洞修复系统！');
        navigate('/dashboard');
      } else if ((username === 'user1' && password === 'user123') || 
                (username === 'user2' && password === 'user123')) {
        // 普通用户登录
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('username', username);
        localStorage.setItem('userRole', 'user');
        
        message.success('用户登录成功，欢迎使用代码漏洞修复系统！');
        navigate('/user-dashboard');
      } else {
        message.error('用户名或密码错误');
      }
      
      setLoading(false);
    }, 800);
  };

  return (
    <div className="login-container">
      <div className="login-content">
        <Card bordered={false} className="login-card">
          <div className="login-header">
            <Title level={2} className="login-title">代码漏洞修复系统</Title>
            <Text type="secondary">专业的代码安全检测与修复平台</Text>
          </div>
          
          <Form
            name="login"
            className="login-form"
            initialValues={{ remember: true }}
            onFinish={onFinish}
            size="large"
            layout="vertical"
          >
            <Form.Item
              name="username"
              rules={[{ required: true, message: '请输入用户名' }]}
            >
              <Input 
                prefix={<UserOutlined className="site-form-item-icon" />} 
                placeholder="用户名" 
                allowClear
              />
            </Form.Item>
            
            <Form.Item
              name="password"
              rules={[{ required: true, message: '请输入密码' }]}
            >
              <Input.Password
                prefix={<LockOutlined className="site-form-item-icon" />}
                placeholder="密码"
              />
            </Form.Item>
            
            <Form.Item>
              <Button 
                type="primary" 
                htmlType="submit" 
                className="login-form-button" 
                block
                loading={loading}
              >
                登录
              </Button>
            </Form.Item>
            
            <div className="login-help">
              <Space>
                <Button type="link" size="small">忘记密码</Button>
                <Text type="secondary">|</Text>
                <Button type="link" size="small">注册账号</Button>
              </Space>
            </div>
          </Form>
          
          <div className="login-info">
            <Text type="secondary">
              <SafetyOutlined /> 测试账号: 
            </Text>
            <div className="login-test-accounts">
              <Text type="secondary">管理员: admin / admin123</Text>
              <Text type="secondary">普通用户: user1 / user123</Text>
            </div>
          </div>
        </Card>
      </div>
      
      <style>
        {`
          .login-container {
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            background: linear-gradient(120deg, #f0f2f5, #e6f7ff);
          }
          
          .login-content {
            width: 100%;
            max-width: 400px;
            padding: 20px;
          }
          
          .login-card {
            border-radius: 12px;
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
          }
          
          .login-header {
            text-align: center;
            margin-bottom: 36px;
          }
          
          .login-title {
            margin-bottom: 8px !important;
          }
          
          .login-form {
            margin-top: 24px;
          }
          
          .login-form-button {
            height: 44px;
            font-size: 16px;
            margin-top: 12px;
          }
          
          .login-help {
            display: flex;
            justify-content: center;
            margin-top: 8px;
          }
          
          .login-info {
            margin-top: 36px;
            text-align: center;
          }
          
          .login-test-accounts {
            margin-top: 8px;
            display: flex;
            flex-direction: column;
            gap: 4px;
          }
          
          @media (max-width: 576px) {
            .login-content {
              padding: 16px;
            }
          }
        `}
      </style>
    </div>
  );
};

export default Login; 