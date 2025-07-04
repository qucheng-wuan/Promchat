import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Button, Typography, Spin, Table, Tag, Empty } from 'antd';
import { 
  CheckCircleOutlined, 
  ExclamationCircleOutlined, 
  LineChartOutlined, 
  ScanOutlined, 
  BugOutlined, 
  CodeOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

const { Title, Text } = Typography;

// 假数据 - 实际使用时应替换为该用户的API调用
const mockUserData = {
  username: localStorage.getItem('username') || 'User',
  stats: {
    totalVulnerabilities: 37,
    fixedVulnerabilities: 23,
    pendingVulnerabilities: 14,
    fixRate: 62.2, // 百分比
  },
  lastScanDate: '2025-04-27 09:40:22'
};

const mockTrendData = [
  { date: '7/1', opened: 5, fixed: 2 },
  { date: '7/2', opened: 3, fixed: 4 },
  { date: '7/3', opened: 2, fixed: 3 },
  { date: '7/4', opened: 4, fixed: 2 },
  { date: '7/5', opened: 1, fixed: 5 },
  { date: '7/6', opened: 3, fixed: 2 },
  { date: '7/7', opened: 2, fixed: 4 },
];

const mockModuleData = [
  { name: '认证模块', value: 8, color: '#FF6384' },
  { name: '支付模块', value: 5, color: '#36A2EB' },
  { name: '数据存储', value: 7, color: '#FFCE56' },
  { name: '用户界面', value: 4, color: '#4BC0C0' },
  { name: '其他', value: 3, color: '#FF9F40' },
];

const mockRecentActivity = [
  { 
    key: '1', 
    date: '2025-04-27', 
    module: '认证模块', 
    vulnerabilities: 3,
    fixed: 2,
    status: 'inProgress'
  },
  { 
    key: '2', 
    date: '2025-04-26', 
    module: '支付模块', 
    vulnerabilities: 5,
    fixed: 5,
    status: 'completed'
  },
  { 
    key: '3', 
    date: '2025-04-25', 
    module: '数据存储', 
    vulnerabilities: 2,
    fixed: 0,
    status: 'pending'
  }
];

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

// 用户仪表盘组件
const UserDashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const username = localStorage.getItem('username') || 'User';
  
  // 模拟加载数据
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);

  // 渲染状态标签
  const renderStatusTag = (status: string) => {
    switch (status) {
      case 'completed':
        return <Tag color="success" icon={<CheckCircleOutlined />}>已完成</Tag>;
      case 'inProgress':
        return <Tag color="processing" icon={<ScanOutlined />}>进行中</Tag>;
      case 'pending':
        return <Tag color="warning" icon={<ExclamationCircleOutlined />}>待处理</Tag>;
      default:
        return <Tag color="default">未知</Tag>;
    }
  };

  // 活动表列配置
  const columns = [
    {
      title: '日期',
      dataIndex: 'date',
      key: 'date',
    },
    {
      title: '模块',
      dataIndex: 'module',
      key: 'module',
    },
    {
      title: '漏洞数',
      dataIndex: 'vulnerabilities',
      key: 'vulnerabilities',
    },
    {
      title: '已修复',
      dataIndex: 'fixed',
      key: 'fixed',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => renderStatusTag(status)
    },
    {
      title: '操作',
      key: 'action',
      render: () => (
        <Button type="link" size="small" onClick={() => navigate('/history')}>
          查看详情
        </Button>
      )
    }
  ];

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 'calc(100vh - 200px)' }}>
        <Spin size="large" tip="正在加载数据..." />
      </div>
    );
  }

  return (
    <div className="user-dashboard-container">
      <Card className="welcome-card" bordered={false}>
        <Title level={3}>欢迎，{username}！</Title>
        <Text type="secondary">
          上次扫描时间: {mockUserData.lastScanDate}
        </Text>
        <div style={{ marginTop: 16 }}>
          <Button 
            type="primary" 
            icon={<ScanOutlined />} 
            onClick={() => navigate('/')}
            style={{ marginRight: 12 }}
          >
            立即扫描
          </Button>
          <Button 
            type="default" 
            icon={<BugOutlined />}
            onClick={() => navigate('/')}
          >
            前往修复
          </Button>
        </div>
      </Card>

      {/* 统计卡片 */}
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} sm={8}>
          <Card bordered={false}>
            <div className="stat-card">
              <Title level={2}>{mockUserData.stats.totalVulnerabilities}</Title>
              <div className="stat-info">
                <BugOutlined style={{ fontSize: 24, color: '#1890ff' }} />
                <Text>总漏洞数</Text>
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card bordered={false}>
            <div className="stat-card">
              <Title level={2}>{mockUserData.stats.fixedVulnerabilities}</Title>
              <div className="stat-info">
                <CheckCircleOutlined style={{ fontSize: 24, color: '#52c41a' }} />
                <Text>已修复</Text>
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card bordered={false}>
            <div className="stat-card">
              <Title level={2}>{mockUserData.stats.fixRate}%</Title>
              <div className="stat-info">
                <LineChartOutlined style={{ fontSize: 24, color: '#faad14' }} />
                <Text>修复率</Text>
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      {/* 图表行 */}
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} md={16}>
          <Card title="您的修复趋势" bordered={false}>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart
                data={mockTrendData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <RechartsTooltip />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="opened" 
                  name="发现漏洞" 
                  stroke="#f5222d" 
                  activeDot={{ r: 8 }} 
                />
                <Line 
                  type="monotone" 
                  dataKey="fixed" 
                  name="修复漏洞" 
                  stroke="#52c41a" 
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card title="漏洞分布" bordered={false}>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={mockModuleData}
                  cx="50%"
                  cy="50%"
                  labelLine={true}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  nameKey="name"
                  label={({name, percent}) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {mockModuleData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>

      {/* 最近活动 */}
      <Card 
        title="您的最近活动" 
        bordered={false} 
        style={{ marginTop: 16 }}
        extra={<Button type="link" onClick={() => navigate('/history')}>查看全部</Button>}
      >
        {mockRecentActivity.length > 0 ? (
          <Table 
            columns={columns} 
            dataSource={mockRecentActivity} 
            pagination={false} 
          />
        ) : (
          <Empty description="暂无活动记录" />
        )}
      </Card>

      <style>{`
        .user-dashboard-container {
          max-width: 1200px;
          margin: 0 auto;
        }
        .welcome-card {
          border-radius: 8px;
          background: linear-gradient(135deg, #1890ff11, #1890ff22);
          margin-bottom: 16px;
        }
        .stat-card {
          text-align: center;
        }
        .stat-info {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }
      `}</style>
    </div>
  );
};

export default UserDashboard; 