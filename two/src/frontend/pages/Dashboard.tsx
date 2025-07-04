import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Button, Typography, Spin, Table, Tag, Tooltip, message } from 'antd';
import type { TableColumnsType } from 'antd';
import { 
  CheckCircleOutlined, 
  ExclamationCircleOutlined, 
  LineChartOutlined, 
  ScanOutlined, 
  BugOutlined, 
  CodeOutlined,
  ClockCircleOutlined,
  UserOutlined
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
import type { Breakpoint } from 'antd/es/_util/responsiveObserver';

const { Title, Text } = Typography;

// 定义类型
interface OverviewCardProps {
  title: string;
  value: number;
  delta: number;
  icon: React.ReactNode;
  suffix?: string;
  color?: string;
}

interface ActivityItem {
  key: string;
  time: string;
  user: string;
  action: string;
  module: string;
  description: string;
}

// 假数据 - 实际使用时应替换为API调用
const mockOverviewData = {
  totalVulnerabilities: 147,
  fixedVulnerabilities: 98,
  pendingVulnerabilities: 49,
  fixRate: 66.7, // 百分比
  totalDelta: +12,
  fixedDelta: +23,
  pendingDelta: -11,
  fixRateDelta: +4.5,
};

const mockTrendData = [
  { date: '7/1', opened: 15, fixed: 7 },
  { date: '7/2', opened: 12, fixed: 10 },
  { date: '7/3', opened: 8, fixed: 13 },
  { date: '7/4', opened: 10, fixed: 15 },
  { date: '7/5', opened: 5, fixed: 12 },
  { date: '7/6', opened: 7, fixed: 8 },
  { date: '7/7', opened: 9, fixed: 14 },
];

const mockModuleData = [
  { name: '认证模块', value: 25, color: '#FF6384' },
  { name: '支付模块', value: 18, color: '#36A2EB' },
  { name: '数据存储', value: 15, color: '#FFCE56' },
  { name: '用户界面', value: 12, color: '#4BC0C0' },
  { name: '第三方API', value: 8, color: '#9966FF' },
  { name: '其他', value: 5, color: '#FF9F40' },
];

const mockActivityData: ActivityItem[] = [
  { 
    key: '1', 
    time: '2025-04-27 10:25', 
    user: '张三', 
    action: '修复', 
    module: '认证模块', 
    description: '修复了跨站脚本漏洞' 
  },
  { 
    key: '2', 
    time: '2025-04-27 09:40', 
    user: '系统', 
    action: '扫描', 
    module: '全部', 
    description: '完成了定时安全扫描' 
  },
  { 
    key: '3', 
    time: '2025-04-26 16:18', 
    user: '李四', 
    action: '修复', 
    module: '支付模块', 
    description: '修复了SQL注入漏洞' 
  },
  { 
    key: '4', 
    time: '2025-04-26 14:30', 
    user: '王五', 
    action: '创建', 
    module: '数据存储', 
    description: '创建了新的修复任务' 
  },
  { 
    key: '5', 
    time: '2025-04-26 11:45', 
    user: '张三', 
    action: '修复', 
    module: '用户界面', 
    description: '修复了CSRF漏洞' 
  },
];

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

// Overview Card 组件
const OverviewCard: React.FC<OverviewCardProps> = ({ title, value, delta, icon, suffix = '', color = 'blue' }) => {
  const isPositive = delta > 0;
  const isNeutral = delta === 0;
  
  return (
    <Card className="overview-card">
      <div className="card-content">
        <div className="card-icon" style={{ backgroundColor: `rgba(${color === 'blue' ? '24, 144, 255' : color === 'green' ? '82, 196, 26' : color === 'red' ? '245, 34, 45' : '250, 173, 20'}, 0.15)` }}>
          {icon}
        </div>
        <div className="card-data">
          <Text type="secondary">{title}</Text>
          <Title level={3} style={{ margin: '8px 0' }}>
            {value}{suffix}
          </Title>
          <div className="delta-indicator">
            {isNeutral ? (
              <Text type="secondary">无变化</Text>
            ) : (
              <Text
                type={isPositive ? (title.includes('待修复') ? 'danger' : 'success') : (title.includes('待修复') ? 'success' : 'danger')}
                style={{ display: 'flex', alignItems: 'center' }}
              >
                {isPositive ? '↑' : '↓'} {Math.abs(delta)}{suffix}
              </Text>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
};

// Dashboard 主组件
const Dashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  
  // 模拟API加载
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);

  // 点击"立即扫描"按钮
  const handleScan = () => {
    setLoading(true);
    // 实际应用中应调用API
    setTimeout(() => {
      setLoading(false);
      message.success('扫描完成，发现3个新漏洞');
    }, 2000);
  };

  // 活动表列配置
  const activityColumns: TableColumnsType<ActivityItem> = [
    {
      title: '时间',
      dataIndex: 'time',
      key: 'time',
      render: (text: string) => <span><ClockCircleOutlined style={{ marginRight: 8 }} />{text}</span>
    },
    {
      title: '用户',
      dataIndex: 'user',
      key: 'user',
      render: (text: string) => <span><UserOutlined style={{ marginRight: 8 }} />{text}</span>
    },
    {
      title: '操作',
      dataIndex: 'action',
      key: 'action',
      render: (text: string) => {
        let color = 'blue';
        let icon = <CodeOutlined />;
        
        if (text === '扫描') {
          color = 'purple';
          icon = <ScanOutlined />;
        } else if (text === '修复') {
          color = 'green';
          icon = <CheckCircleOutlined />;
        } else if (text === '创建') {
          color = 'blue';
          icon = <BugOutlined />;
        }
        
        return <Tag color={color} icon={icon}>{text}</Tag>;
      }
    },
    {
      title: '模块',
      dataIndex: 'module',
      key: 'module',
    },
    {
      title: '详情',
      dataIndex: 'description',
      key: 'description',
      render: (text: string) => <Tooltip title={text}>{text.length > 20 ? `${text.substring(0, 20)}...` : text}</Tooltip>,
      responsive: ['md' as Breakpoint]
    },
  ];

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 'calc(100vh - 200px)' }}>
        <Spin size="large" tip="正在加载数据..." />
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
    <div>
          <Title level={2}>仪表盘</Title>
          <Text type="secondary">欢迎使用代码漏洞修复平台，这里是您的安全修复概览</Text>
        </div>
        <div className="action-buttons">
          <Button 
            type="primary" 
            icon={<ScanOutlined />} 
            onClick={handleScan}
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
      </div>

      {/* 概览卡片 */}
      <Row gutter={[16, 16]} className="overview-cards">
        <Col xs={24} sm={12} md={6}>
          <OverviewCard 
            title="总漏洞数" 
            value={mockOverviewData.totalVulnerabilities} 
            delta={mockOverviewData.totalDelta} 
            icon={<BugOutlined style={{ fontSize: 24, color: '#1890ff' }} />}
            color="blue"
          />
        </Col>
        <Col xs={24} sm={12} md={6}>
          <OverviewCard 
            title="已修复数" 
            value={mockOverviewData.fixedVulnerabilities} 
            delta={mockOverviewData.fixedDelta}
            icon={<CheckCircleOutlined style={{ fontSize: 24, color: '#52c41a' }} />}
            color="green"
          />
        </Col>
        <Col xs={24} sm={12} md={6}>
          <OverviewCard 
            title="待修复数" 
            value={mockOverviewData.pendingVulnerabilities} 
            delta={mockOverviewData.pendingDelta}
            icon={<ExclamationCircleOutlined style={{ fontSize: 24, color: '#f5222d' }} />}
            color="red"
          />
        </Col>
        <Col xs={24} sm={12} md={6}>
          <OverviewCard 
            title="修复率" 
            value={mockOverviewData.fixRate} 
            delta={mockOverviewData.fixRateDelta}
            suffix="%"
            icon={<LineChartOutlined style={{ fontSize: 24, color: '#faad14' }} />}
            color="orange"
          />
        </Col>
      </Row>

      {/* 图表区域 */}
      <Row gutter={[16, 16]} className="chart-section">
        <Col xs={24} lg={16}>
          <Card title="漏洞趋势" className="trend-chart-card">
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
                  name="新增漏洞" 
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
        <Col xs={24} lg={8}>
          <Card title="模块分布" className="module-chart-card">
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

      {/* 活动表格 */}
      <Card title="最近活动" className="activity-table-card">
        <Table 
          columns={activityColumns} 
          dataSource={mockActivityData} 
          pagination={false}
          className="recent-activity-table"
        />
      </Card>

      <style>
        {`
          .dashboard-container {
            padding: 16px;
          }
          
          .dashboard-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 24px;
            flex-wrap: wrap;
          }
          
          .action-buttons {
            margin-top: 16px;
          }
          
          .overview-cards {
            margin-bottom: 24px;
          }
          
          .overview-card .card-content {
            display: flex;
            align-items: center;
          }
          
          .card-icon {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 48px;
            height: 48px;
            border-radius: 12px;
            margin-right: 16px;
          }
          
          .card-data {
            flex: 1;
          }
          
          .delta-indicator {
            display: flex;
            align-items: center;
          }
          
          .chart-section {
            margin-bottom: 24px;
          }
          
          .activity-table-card {
            margin-bottom: 24px;
          }
          
          @media (max-width: 768px) {
            .dashboard-header {
              flex-direction: column;
            }
            
            .action-buttons {
              margin-top: 16px;
            }
          }
        `}
      </style>
    </div>
  );
};

export default Dashboard; 