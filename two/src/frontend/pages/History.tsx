import React, { useState, useEffect } from 'react';
import { Typography, Table, Button, Space, Card, Tag, Modal, Spin, Tabs, message, Input, Select, Pagination, Checkbox, Dropdown, Menu, Popconfirm, Tooltip } from 'antd';
import { EyeOutlined, HistoryOutlined, DeleteOutlined, SearchOutlined, FilterOutlined, DownloadOutlined, UploadOutlined, ExportOutlined, ImportOutlined, DiffOutlined } from '@ant-design/icons';
import axios from 'axios';
import Editor from '@monaco-editor/react';
import { ThemeType, getTheme } from '../utils/themeStorage';
import ErrorFixDiffViewer from '../components/ErrorFixDiffViewer';

const { Title, Text } = Typography;
const { TabPane } = Tabs;
const { Option } = Select;

interface Vulnerability {
  id: string;
  line: number;
  column: number;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  fixed: boolean;
}

interface HistoryRecord {
  id: string;
  timestamp: string;
  originalCode: string;
  fixedCode?: string;
  vulnerabilities: Vulnerability[];
  status?: string;
  errorLines?: number[];
  fixedLines?: number[];
  execution_time?: number; // 保留兼容性
}

const History: React.FC = () => {
  const [historyRecords, setHistoryRecords] = useState<HistoryRecord[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<HistoryRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedRecord, setSelectedRecord] = useState<HistoryRecord | null>(null);
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [currentTheme, setCurrentTheme] = useState<ThemeType>(getTheme());
  const [searchText, setSearchText] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);
  const [pageSize, setPageSize] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [importModalVisible, setImportModalVisible] = useState<boolean>(false);
  const [importData, setImportData] = useState<string>('');
  const [currentRecord, setCurrentRecord] = useState<HistoryRecord | null>(null);
  const [showDiffView, setShowDiffView] = useState<boolean>(false);
  
  const fetchHistory = async () => {
    setLoading(true);
    try {
      // 尝试从本地存储获取历史记录
      const savedHistory = localStorage.getItem('codeAnalysisHistory');
      
      if (savedHistory) {
        const records = JSON.parse(savedHistory) as HistoryRecord[];
        const sortedRecords = records.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        setHistoryRecords(sortedRecords);
        setFilteredRecords(sortedRecords);
      } else {
        setHistoryRecords([]);
        setFilteredRecords([]);
      }
    } catch (error) {
      console.error('获取历史记录失败:', error);
      message.error('获取历史记录失败');
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchHistory();
    
    // 监听主题变化
    const handleThemeChange = (event: Event) => {
      const customEvent = event as CustomEvent<{theme: ThemeType}>;
      if (customEvent.detail && customEvent.detail.theme) {
        setCurrentTheme(customEvent.detail.theme);
      }
    };

    document.addEventListener('themeChanged', handleThemeChange as EventListener);
    return () => {
      document.removeEventListener('themeChanged', handleThemeChange as EventListener);
    };
  }, []);
  
  useEffect(() => {
    // 根据搜索和筛选条件对历史记录进行过滤
    let result = [...historyRecords];
    
    if (searchText) {
      result = result.filter(record => 
        record.originalCode.toLowerCase().includes(searchText.toLowerCase()) || 
        record.fixedCode?.toLowerCase().includes(searchText.toLowerCase())
      );
    }
    
    if (filterStatus !== 'all') {
      result = result.filter(record => record.status === filterStatus);
    }
    
    setFilteredRecords(result);
    setCurrentPage(1); // 重置到第一页
  }, [searchText, filterStatus, historyRecords]);
  
  const handleViewRecord = (record: HistoryRecord) => {
    setSelectedRecord(record);
    setModalVisible(true);
  };
  
  const handleRestoreRecord = (record: HistoryRecord) => {
    // 触发一个自定义事件，通知CodeEditor页面恢复这个记录
    const restoreEvent = new CustomEvent('restoreHistoryRecord', { 
      detail: { 
        originalCode: record.originalCode,
        fixedCode: record.fixedCode,
        vulnerabilities: record.vulnerabilities
      } 
    });
    document.dispatchEvent(restoreEvent);
    
    message.success('已恢复历史记录，请返回编辑器页面查看');
  };
  
  const handleDeleteRecord = (recordId: string) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这条历史记录吗？此操作不可恢复。',
      onOk: () => {
        try {
          // 从本地存储中删除
          const savedHistory = localStorage.getItem('codeAnalysisHistory');
          if (savedHistory) {
            const records = JSON.parse(savedHistory) as HistoryRecord[];
            const updatedRecords = records.filter(record => record.id !== recordId);
            localStorage.setItem('codeAnalysisHistory', JSON.stringify(updatedRecords));
            setHistoryRecords(updatedRecords);
            setFilteredRecords(prev => prev.filter(record => record.id !== recordId));
            message.success('删除成功');
          }
        } catch (error) {
          console.error('删除历史记录失败:', error);
          message.error('删除历史记录失败');
        }
      }
    });
  };
  
  const handleBatchDelete = () => {
    if (selectedRowKeys.length === 0) {
      message.info('请先选择要删除的记录');
      return;
    }
    
    Modal.confirm({
      title: '确认批量删除',
      content: `确定要删除选中的 ${selectedRowKeys.length} 条历史记录吗？此操作不可恢复。`,
      onOk: () => {
        try {
          // 从本地存储中删除
          const savedHistory = localStorage.getItem('codeAnalysisHistory');
          if (savedHistory) {
            const records = JSON.parse(savedHistory) as HistoryRecord[];
            const updatedRecords = records.filter(record => !selectedRowKeys.includes(record.id));
            localStorage.setItem('codeAnalysisHistory', JSON.stringify(updatedRecords));
            setHistoryRecords(updatedRecords);
            setFilteredRecords(prev => prev.filter(record => !selectedRowKeys.includes(record.id)));
            setSelectedRowKeys([]);
            message.success(`成功删除 ${selectedRowKeys.length} 条记录`);
          }
        } catch (error) {
          console.error('批量删除历史记录失败:', error);
          message.error('批量删除历史记录失败');
        }
      }
    });
  };
  
  const handleClearHistory = () => {
    Modal.confirm({
      title: '确认清空',
      content: '确定要清空所有历史记录吗？此操作不可恢复。',
      onOk: () => {
        try {
          localStorage.removeItem('codeAnalysisHistory');
          setHistoryRecords([]);
          setFilteredRecords([]);
          setSelectedRowKeys([]);
          message.success('历史记录已清空');
        } catch (error) {
          console.error('清空历史记录失败:', error);
          message.error('清空历史记录失败');
        }
      }
    });
  };
  
  const handleExportHistory = () => {
    try {
      // 导出所有历史记录
      const dataStr = JSON.stringify(historyRecords, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
      
      const exportFileDefaultName = `code_analysis_history_${new Date().toISOString().slice(0, 10)}.json`;
      
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
      
      message.success('历史记录导出成功');
    } catch (error) {
      console.error('导出历史记录失败:', error);
      message.error('导出历史记录失败');
    }
  };
  
  const showImportModal = () => {
    setImportData('');
    setImportModalVisible(true);
  };
  
  const handleImportHistory = () => {
    try {
      if (!importData.trim()) {
        message.error('导入数据不能为空');
        return;
      }
      
      const importedRecords = JSON.parse(importData) as HistoryRecord[];
      
      if (!Array.isArray(importedRecords)) {
        message.error('导入数据格式不正确');
        return;
      }
      
      // 验证每条记录的格式
      for (const record of importedRecords) {
        if (!record.id || !record.timestamp || !record.originalCode || !record.fixedCode || 
            !Array.isArray(record.vulnerabilities) || !record.status || record.execution_time === undefined) {
          message.error('导入数据中包含格式不正确的记录');
          return;
        }
      }
      
      // 合并到现有记录中
      const savedHistory = localStorage.getItem('codeAnalysisHistory');
      let existingRecords: HistoryRecord[] = [];
      
      if (savedHistory) {
        existingRecords = JSON.parse(savedHistory) as HistoryRecord[];
      }
      
      // 使用Map根据ID去重
      const recordMap = new Map<string, HistoryRecord>();
      
      // 先放入导入的记录
      for (const record of importedRecords) {
        recordMap.set(record.id, record);
      }
      
      // 再放入已有的记录（不覆盖导入的）
      for (const record of existingRecords) {
        if (!recordMap.has(record.id)) {
          recordMap.set(record.id, record);
        }
      }
      
      // 转回数组
      const mergedRecords = Array.from(recordMap.values());
      
      // 保存到本地存储
      localStorage.setItem('codeAnalysisHistory', JSON.stringify(mergedRecords));
      
      // 更新状态
      setHistoryRecords(mergedRecords);
      setFilteredRecords(mergedRecords);
      
      message.success(`成功导入 ${importedRecords.length} 条记录`);
      setImportModalVisible(false);
    } catch (error) {
      console.error('导入历史记录失败:', error);
      message.error('导入历史记录失败：' + (error instanceof Error ? error.message : String(error)));
    }
  };
  
  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setImportData(content);
    };
    reader.readAsText(file);
  };
  
  const openDiffView = (record: HistoryRecord) => {
    setCurrentRecord(record);
    setShowDiffView(true);
  };
  
  const columns = [
    {
      title: '时间',
      dataIndex: 'timestamp',
      key: 'timestamp',
      render: (text: string) => new Date(text).toLocaleString()
    },
    {
      title: '发现漏洞数',
      key: 'vulnerabilities',
      render: (record: HistoryRecord) => (
        <Tag color={record.vulnerabilities.length > 0 ? 'error' : 'success'}>
          {record.vulnerabilities.length}
        </Tag>
      )
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'success' ? 'green' : status === 'error' ? 'red' : 'blue'}>
          {status === 'success' ? '成功' : status === 'error' ? '失败' : '无问题'}
        </Tag>
      ),
      filters: [
        { text: '成功', value: 'success' },
        { text: '失败', value: 'error' },
        { text: '无问题', value: 'no_issues' }
      ]
    },
    {
      title: '执行时间',
      dataIndex: 'execution_time',
      key: 'execution_time',
      render: (time: number) => `${time.toFixed(2)}秒`
    },
    {
      title: '操作',
      key: 'action',
      render: (record: HistoryRecord) => (
        <Space size="small">
          <Tooltip title="查看详情">
            <Button 
              type="text" 
              icon={<EyeOutlined />} 
              onClick={() => handleViewRecord(record)} 
            />
          </Tooltip>
          
          {record.fixedCode && (
            <Tooltip title="查看错误与修复对比">
              <Button 
                type="text" 
                icon={<DiffOutlined />} 
                onClick={() => openDiffView(record)} 
              />
            </Tooltip>
          )}
          
          <Tooltip title="删除记录">
            <Button 
              type="text" 
              danger 
              icon={<DeleteOutlined />} 
              onClick={() => handleDeleteRecord(record.id)} 
            />
          </Tooltip>
        </Space>
      )
    }
  ];
  
  const rowSelection = {
    selectedRowKeys,
    onChange: (keys: React.Key[]) => {
      setSelectedRowKeys(keys as string[]);
    }
  };
  
  // 分页设置
  const paginatedData = filteredRecords.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  
  return (
    <div className="history-container">
      <Card 
        title={<Title level={3}>历史记录</Title>} 
        bordered={false}
        extra={
          <Space>
            <Button 
              type="primary" 
              danger 
              onClick={handleBatchDelete} 
              disabled={selectedRowKeys.length === 0}
              icon={<DeleteOutlined />}
            >
              批量删除
            </Button>
            <Button 
              type="primary" 
              danger 
              onClick={handleClearHistory} 
              disabled={historyRecords.length === 0}
            >
              清空历史
            </Button>
            <Dropdown overlay={
              <Menu>
                <Menu.Item key="export" onClick={handleExportHistory} icon={<ExportOutlined />}>
                  导出历史
                </Menu.Item>
                <Menu.Item key="import" onClick={showImportModal} icon={<ImportOutlined />}>
                  导入历史
                </Menu.Item>
              </Menu>
            }>
              <Button icon={<DownloadOutlined />}>
                导入/导出
              </Button>
            </Dropdown>
          </Space>
        }
      >
        <div className="filter-container" style={{ marginBottom: 16 }}>
          <Space size="large">
            <Input
              placeholder="搜索代码内容"
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
              allowClear
              style={{ width: 250 }}
            />
            <Space>
              <span>状态筛选:</span>
              <Select 
                value={filterStatus} 
                onChange={setFilterStatus}
                style={{ width: 120 }}
              >
                <Option value="all">全部</Option>
                <Option value="success">成功</Option>
                <Option value="error">失败</Option>
                <Option value="no_issues">无问题</Option>
              </Select>
            </Space>
          </Space>
        </div>
        
        {loading ? (
          <div className="loading-container">
            <Spin tip="加载历史记录中..." />
          </div>
        ) : filteredRecords.length === 0 ? (
          <div className="empty-history">
            <Text>{searchText || filterStatus !== 'all' ? '没有找到匹配的记录' : '暂无历史记录'}</Text>
          </div>
        ) : (
          <>
            <Table 
              rowSelection={rowSelection}
              columns={columns} 
              dataSource={paginatedData} 
              rowKey="id"
              pagination={false}
            />
            <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end' }}>
              <Space>
                <span>每页显示:</span>
                <Select value={pageSize} onChange={setPageSize} style={{ width: 80 }}>
                  <Option value={10}>10</Option>
                  <Option value={20}>20</Option>
                  <Option value={50}>50</Option>
                </Select>
                <Pagination
                  current={currentPage}
                  pageSize={pageSize}
                  total={filteredRecords.length}
                  onChange={setCurrentPage}
                  showSizeChanger={false}
                  showQuickJumper
                />
              </Space>
            </div>
          </>
        )}
      </Card>
      
      <Modal
        title="历史记录详情"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        width={1000}
        footer={[
          <Button key="close" onClick={() => setModalVisible(false)}>
            关闭
          </Button>,
          <Button 
            key="restore" 
            type="primary" 
            onClick={() => {
              if (selectedRecord) {
                handleRestoreRecord(selectedRecord);
                setModalVisible(false);
              }
            }}
          >
            恢复此记录
          </Button>
        ]}
      >
        {selectedRecord && (
          <div className="history-detail">
            <Tabs defaultActiveKey="code">
              <TabPane tab="代码对比" key="code">
                <div className="code-comparison">
                  <div className="code-panel">
                    <Title level={5}>原始代码</Title>
                    <div className="editor-container">
                      <Editor
                        height="300px"
                        language="python"
                        value={selectedRecord.originalCode}
                        theme={currentTheme === 'dark' ? 'vs-dark' : 'vs-light'}
                        options={{ readOnly: true }}
                      />
                    </div>
                  </div>
                  <div className="code-panel">
                    <Title level={5}>修复代码</Title>
                    <div className="editor-container">
                      <Editor
                        height="300px"
                        language="python"
                        value={selectedRecord.fixedCode}
                        theme={currentTheme === 'dark' ? 'vs-dark' : 'vs-light'}
                        options={{ readOnly: true }}
                      />
                    </div>
                  </div>
                </div>
              </TabPane>
              <TabPane tab="漏洞详情" key="vulnerabilities">
                <div className="vulnerabilities-list">
                  {selectedRecord.vulnerabilities.length === 0 ? (
                    <Text>未发现漏洞</Text>
                  ) : (
                    selectedRecord.vulnerabilities.map((vuln: any, index: number) => (
                      <Card key={index} className="vulnerability-card">
                        <p><strong>问题：</strong> {vuln.message}</p>
                        <p><strong>位置：</strong> 第 {vuln.line} 行，第 {vuln.column} 列</p>
                        <p><strong>严重程度：</strong> {
                          vuln.severity === 'critical' ? '严重' :
                          vuln.severity === 'high' ? '高' :
                          vuln.severity === 'medium' ? '中' : '低'
                        }</p>
                        <p><strong>状态：</strong> {vuln.fixed ? '已修复' : '未修复'}</p>
                      </Card>
                    ))
                  )}
                </div>
              </TabPane>
              <TabPane tab="元数据" key="metadata">
                <div className="metadata">
                  <p><strong>记录ID：</strong> {selectedRecord.id}</p>
                  <p><strong>时间戳：</strong> {new Date(selectedRecord.timestamp).toLocaleString()}</p>
                  <p><strong>执行时间：</strong> {selectedRecord.execution_time?.toFixed(2) || '未记录'}秒</p>
                  <p><strong>状态：</strong> {
                    selectedRecord.status === 'success' ? '成功' :
                    selectedRecord.status === 'error' ? '失败' : '无问题'
                  }</p>
                </div>
              </TabPane>
            </Tabs>
          </div>
        )}
      </Modal>
      
      <Modal
        title="导入历史记录"
        open={importModalVisible}
        onCancel={() => setImportModalVisible(false)}
        onOk={handleImportHistory}
        okText="导入"
        cancelText="取消"
      >
        <div style={{ marginBottom: 16 }}>
          <p>请选择要导入的JSON文件，或直接粘贴JSON数据:</p>
          <input
            type="file"
            accept=".json"
            onChange={handleFileImport}
            style={{ marginBottom: 16 }}
          />
          <Input.TextArea
            rows={10}
            value={importData}
            onChange={e => setImportData(e.target.value)}
            placeholder='粘贴JSON格式的历史记录数据'
          />
        </div>
      </Modal>
      
      <Modal
        title="代码差异对比"
        open={showDiffView}
        onCancel={() => setShowDiffView(false)}
        width={1200}
        footer={[
          <Button key="back" onClick={() => setShowDiffView(false)}>
            关闭
          </Button>
        ]}
      >
        {currentRecord && currentRecord.fixedCode && (
          <ErrorFixDiffViewer
            oldCode={currentRecord.originalCode}
            newCode={currentRecord.fixedCode}
            errorLines={currentRecord.errorLines || []}
            fixedLines={currentRecord.fixedLines || []}
            language={currentRecord.originalCode.includes('def ') ? 'python' : 'javascript'}
            outputFormat="side-by-side"
            theme="trae"
          />
        )}
      </Modal>
      
      <style>
        {`
          .history-container {
            max-width: 1200px;
            margin: 0 auto;
          }
          .loading-container {
            display: flex;
            justify-content: center;
            align-items: center;
            height: 300px;
          }
          .empty-history {
            display: flex;
            justify-content: center;
            align-items: center;
            height: 200px;
            background-color: #f5f5f5;
            border-radius: 4px;
          }
          .code-comparison {
            display: flex;
            gap: 16px;
          }
          .code-panel {
            flex: 1;
          }
          .editor-container {
            border: 1px solid #d9d9d9;
            border-radius: 2px;
          }
          .vulnerabilities-list {
            display: flex;
            flex-direction: column;
            gap: 8px;
          }
          .vulnerability-card {
            margin-bottom: 8px;
          }
          .metadata {
            background-color: #f5f5f5;
            padding: 16px;
            border-radius: 4px;
          }
          .filter-container {
            padding: 16px;
            background-color: #f9f9f9;
            border-radius: 4px;
            margin-bottom: 16px;
          }
        `}
      </style>
    </div>
  );
};

export default History; 