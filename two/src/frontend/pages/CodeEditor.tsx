import React, { useState, useRef, useEffect } from 'react';
import { Card, Button, Space, Upload, message, Tabs, Typography, Divider, Spin, Switch, Tooltip, Select, Modal } from 'antd';
import { SendOutlined, UploadOutlined, SyncOutlined, CodeOutlined } from '@ant-design/icons';
import Editor from '@monaco-editor/react';
import * as monaco from 'monaco-editor';
import { editor } from 'monaco-editor';
import axios from 'axios';
import { ThemeType, getTheme } from '../utils/themeStorage';
import type { UploadProps } from 'antd';
import type { Monaco } from '@monaco-editor/react';
import { createPatch } from 'diff';
import * as diff2html from 'diff2html';
import ErrorFixDiffViewer from '../components/ErrorFixDiffViewer';
import { analyzeCodeDifferences, detectCodeErrors } from '../utils/codeAnalyzer';

const { TabPane } = Tabs;
const { Title, Text } = Typography;
const { Option } = Select;

interface Vulnerability {
  id: string;
  line: number;
  column: number;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  fixed: boolean;
}

// 定义代码编辑器主题
const lightTheme = {
  base: 'vs' as const,
  inherit: true,
  rules: [
    { token: 'keyword', foreground: '569CD6' },
    { token: 'string', foreground: 'CE9178' },
    { token: 'number', foreground: 'B5CEA8' },
    { token: 'comment', foreground: '6A9955', fontStyle: 'italic' },
    { token: 'function', foreground: 'DCDCAA' },
    { token: 'variable', foreground: '9CDCFE' },
    { token: 'type', foreground: '4EC9B0' },
    { token: 'class', foreground: '4EC9B0' }
  ],
  colors: {
    'editor.background': '#FAFBFC',
    'editor.foreground': '#24292E',
    'editorLineNumber.foreground': '#6E7681',
    'editorLineNumber.activeForeground': '#24292E',
    'editor.selectionBackground': '#ADD6FF80',
    'editor.lineHighlightBackground': '#F6F8FA',
    'editorCursor.foreground': '#044289',
    'editorWhitespace.foreground': '#E1E4E8',
    'editorIndentGuide.background': '#E1E4E8',
    'editorIndentGuide.activeBackground': '#D1D5DA'
  }
};

// 暗色主题
const darkTheme = {
  base: 'vs-dark' as const,
  inherit: true,
  rules: [
    { token: 'keyword', foreground: '569CD6' },
    { token: 'string', foreground: 'CE9178' },
    { token: 'number', foreground: 'B5CEA8' },
    { token: 'comment', foreground: '6A9955', fontStyle: 'italic' },
    { token: 'function', foreground: 'DCDCAA' },
    { token: 'variable', foreground: '9CDCFE' },
    { token: 'type', foreground: '4EC9B0' },
    { token: 'class', foreground: '4EC9B0' }
  ],
  colors: {
    'editor.background': '#1E1E1E',
    'editor.foreground': '#D4D4D4',
    'editorLineNumber.foreground': '#858585',
    'editorLineNumber.activeForeground': '#C6C6C6',
    'editor.selectionBackground': '#264F78',
    'editor.lineHighlightBackground': '#2D2D2D',
    'editorCursor.foreground': '#AEAFAD',
    'editorWhitespace.foreground': '#404040',
    'editorIndentGuide.background': '#404040',
    'editorIndentGuide.activeBackground': '#707070'
  }
};

const CodeEditor: React.FC = () => {
  const [leftCode, setLeftCode] = useState<string>('# 在这里输入或粘贴代码\n\n// JavaScript示例\nfunction getUser(id) {\n  const query = "SELECT * FROM users WHERE id=" + id;\n  return db.execute(query);\n}\n\n# Python示例\ndef example_function():\n    password = "hardcoded_password"\n    return password');
  const [rightCode, setRightCode] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [vulnerabilities, setVulnerabilities] = useState<Vulnerability[]>([]);
  const [currentTheme, setCurrentTheme] = useState<ThemeType>(getTheme());
  const [errorLines, setErrorLines] = useState<number[]>([]);
  const [fixedLines, setFixedLines] = useState<number[]>([]);
  const [showErrorFixDiff, setShowErrorFixDiff] = useState<boolean>(false);
  const [showDiffView, setShowDiffView] = useState<boolean>(false);
  const leftEditorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const rightEditorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<Monaco | null>(null);

  // 监听主题变化
  useEffect(() => {
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

  // 配置Monaco编辑器
  const handleEditorWillMount = (monaco: Monaco) => {
    monacoRef.current = monaco;
    // 定义自定义主题
    monaco.editor.defineTheme('lightTheme', lightTheme);
    monaco.editor.defineTheme('darkTheme', darkTheme);
    
    // 配置Python语言高亮和智能提示
    monaco.languages.registerCompletionItemProvider('python', {
      provideCompletionItems: (model, position) => {
        const suggestions = [
          {
            label: 'def',
            kind: monaco.languages.CompletionItemKind.Keyword,
            insertText: 'def ${1:function_name}(${2:parameters}):\n\t${0}',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: '定义一个函数',
            range: {
              startLineNumber: position.lineNumber,
              startColumn: position.column,
              endLineNumber: position.lineNumber,
              endColumn: position.column
            }
          },
          {
            label: 'class',
            kind: monaco.languages.CompletionItemKind.Keyword,
            insertText: 'class ${1:ClassName}:\n\t${0}',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: '定义一个类',
            range: {
              startLineNumber: position.lineNumber,
              startColumn: position.column,
              endLineNumber: position.lineNumber,
              endColumn: position.column
            }
          },
          {
            label: 'if',
            kind: monaco.languages.CompletionItemKind.Keyword,
            insertText: 'if ${1:condition}:\n\t${0}',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: 'if条件语句',
            range: {
              startLineNumber: position.lineNumber,
              startColumn: position.column,
              endLineNumber: position.lineNumber,
              endColumn: position.column
            }
          }
        ];

        return { suggestions };
      }
    });
  };

  const handleLeftEditorDidMount = (editor: editor.IStandaloneCodeEditor) => {
    leftEditorRef.current = editor;
    
    // 聚焦编辑器
    editor.focus();
    
    // 如果已有漏洞数据，应用高亮
    if (vulnerabilities.length > 0) {
      setTimeout(() => highlightErrorsInLeftEditor(), 100);
    }
  };

  const handleRightEditorDidMount = (editor: editor.IStandaloneCodeEditor) => {
    rightEditorRef.current = editor;
    
    // 如果已有修复代码，应用高亮
    if (rightCode) {
      setTimeout(() => highlightFixesInRightEditor(), 100);
    }
  };

  const uploadProps: UploadProps = {
    name: 'file',
    accept: '.py,.js,.ts,.jsx,.tsx',
    showUploadList: false,
    beforeUpload: (file) => {
      const fileReader = new globalThis.FileReader();
      fileReader.onload = (e) => {
        if (e.target && typeof e.target.result === 'string') {
          setLeftCode(e.target.result);
          setRightCode('');
          setVulnerabilities([]);
          message.success(`成功加载文件: ${file.name}`);
        }
      };
      fileReader.readAsText(file);
      return false;
    },
  };

  // 高亮错误行
  const highlightErrorsInLeftEditor = () => {
    if (!leftEditorRef.current || !monacoRef.current || vulnerabilities.length === 0) return;
    
    const monaco = monacoRef.current;
    const editor = leftEditorRef.current;
    
    // 清除之前的所有装饰
    const oldDecorations = editor.getModel()?.getAllDecorations() || [];
    const oldDecorationsIds = oldDecorations
      .filter(d => d.options.className === 'error-line')
      .map(d => d.id);
    
    editor.deltaDecorations(oldDecorationsIds, []);
    
    // 创建新的错误行装饰
    const errorDecorations = vulnerabilities.map(vuln => ({
      range: new monaco.Range(vuln.line, 1, vuln.line, 1),
      options: {
        isWholeLine: true,
        className: 'error-line',
        glyphMarginClassName: 'error-glyph',
        overviewRuler: {
          color: 'rgba(255, 0, 0, 0.7)',
          position: monaco.editor.OverviewRulerLane.Left
        },
        minimap: {
          color: 'rgba(255, 0, 0, 0.7)',
          position: monaco.editor.MinimapPosition.Inline
        }
      }
    }));
    
    // 应用装饰
    if (errorDecorations.length > 0) {
      editor.deltaDecorations([], errorDecorations);
      console.log('Applied error highlights to lines:', vulnerabilities.map(v => v.line).join(', '));
    }
  };

  // 高亮修复行
  const highlightFixesInRightEditor = () => {
    if (!rightEditorRef.current || !monacoRef.current || !rightCode) return;
    
    const monaco = monacoRef.current;
    const editor = rightEditorRef.current;
    
    // 清除之前的所有装饰
    const oldDecorations = editor.getModel()?.getAllDecorations() || [];
    const oldDecorationsIds = oldDecorations
      .filter(d => d.options.className === 'fixed-line')
      .map(d => d.id);
    
    editor.deltaDecorations(oldDecorationsIds, []);
    
    try {
      // 生成差异
      const diffPatch = createPatch('code.py', leftCode, rightCode, '', '');
      const parsedDiff = diff2html.parse(diffPatch);
      
      const fixedDecorations: editor.IModelDeltaDecoration[] = [];
      
      if (parsedDiff.length > 0) {
        const blocks = parsedDiff[0].blocks;
        
        blocks.forEach((block: any) => {
          // 处理修复的行
          if (block.newStartLine) {
            block.addedLines.forEach((_: any, index: number) => {
              const lineNumber = block.newStartLine + index;
              fixedDecorations.push({
                range: new monaco.Range(lineNumber, 1, lineNumber, 1),
                options: {
                  isWholeLine: true,
                  className: 'fixed-line',
                  overviewRuler: {
                    color: 'rgba(0, 255, 0, 0.7)',
                    position: monaco.editor.OverviewRulerLane.Left
                  },
                  minimap: {
                    color: 'rgba(0, 255, 0, 0.7)',
                    position: monaco.editor.MinimapPosition.Inline
                  }
                }
              });
            });
          }
        });
      }
      
      // 应用装饰
      if (fixedDecorations.length > 0) {
        editor.deltaDecorations([], fixedDecorations);
        console.log('Applied fix highlights, count:', fixedDecorations.length);
      }
    } catch (error) {
      console.error('生成差异高亮时出错:', error);
    }
  };

  // 当漏洞信息或代码改变时重新应用高亮
  useEffect(() => {
    highlightErrorsInLeftEditor();
    highlightFixesInRightEditor();
  }, [vulnerabilities, leftCode, rightCode]);

  const analyzeCode = async () => {
    if (!leftCode.trim()) {
      message.warning('请先输入代码');
      return;
    }

    setIsProcessing(true);
    setVulnerabilities([]);
    setRightCode('');
    setErrorLines([]);
    setFixedLines([]);
    setShowErrorFixDiff(false);
    
    try {
      // 调用DeepSeek API
      const response = await axios.post('/api/analyze', { 
        code: leftCode 
      });
      
      // 使用API返回的实际结果
      const { fixed_code, vulnerabilities: detectedVulnerabilities, status } = response.data;
      setRightCode(fixed_code || '');
      
      const vulns = (detectedVulnerabilities || []).map((v: any) => ({
        id: generateId(),
        line: v.line,
        column: v.column || 1,
        message: v.message,
        severity: v.severity || 'medium',
        fixed: Boolean(fixed_code)
      }));
      
      setVulnerabilities(vulns);
      
      if (fixed_code) {
        // 分析代码差异，找出错误行和修复行
        const fileExt = getCodeFileExtension(leftCode);
        const fileName = `code.${fileExt}`;
        const language = fileExt === 'py' ? 'python' : 'javascript';
        
        // 使用差异分析找出错误和修复行
        const { errorLines: detectedErrors, fixedLines: detectedFixes } = 
          analyzeCodeDifferences(leftCode, fixed_code, fileName);
          
        // 如果自动检测不出错误行，尝试使用规则检测
        const altErrorLines = detectedErrors.length > 0 
          ? detectedErrors 
          : detectedVulnerabilities.map((v: { line: number }) => v.line);
          
        setErrorLines(altErrorLines);
        setFixedLines(detectedFixes);
        setShowErrorFixDiff(true);
        
        // 保存到历史记录
        saveToHistory({
          id: generateId(),
          timestamp: new Date().toISOString(),
          originalCode: leftCode,
          fixedCode: fixed_code,
          vulnerabilities: vulns,
          status: status || 'success',
          errorLines: altErrorLines,
          fixedLines: detectedFixes,
          execution_time: response.data.execution_time || 0
        });
        
        if (status === 'error') {
        message.error('分析过程中出现错误，请重试');
        } else if (detectedVulnerabilities.length > 0) {
          message.success(`发现${detectedVulnerabilities.length}个漏洞并已修复`);
        }
      } else {
        if (vulns.length > 0) {
          // 没有修复代码，但检测到漏洞
          const detectedErrors = vulns.map(v => v.line);
          setErrorLines(detectedErrors);
          
          // 保存到历史记录
          saveToHistory({
            id: generateId(),
            timestamp: new Date().toISOString(),
            originalCode: leftCode,
            status: 'error',
            vulnerabilities: vulns,
            execution_time: response.data.execution_time || 0
          });
          
          message.warning('发现漏洞但无法自动修复');
        } else {
          // 保存无漏洞的历史记录
          saveToHistory({
            id: generateId(),
            timestamp: new Date().toISOString(),
            originalCode: leftCode,
            status: 'no_issues',
            vulnerabilities: [],
            execution_time: response.data.execution_time || 0
          });
          
        message.success('代码分析完成，没有发现漏洞');
      }
      }
      
      // 高亮错误和修复
      setTimeout(() => {
        highlightErrorsInLeftEditor();
        if (fixed_code) {
          highlightFixesInRightEditor();
        }
      }, 100);
    } catch (error) {
      console.error('分析代码时出错:', error);
      message.error('连接服务器失败，请检查后端服务是否运行');
      
      // 保存错误记录
      saveToHistory({
        id: generateId(),
        timestamp: new Date().toISOString(),
        originalCode: leftCode,
        status: 'error',
        vulnerabilities: [],
        execution_time: 0
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // 生成唯一ID
  const generateId = () => {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
  };

  // 保存到历史记录
  const saveToHistory = (record: any) => {
    try {
      // 获取现有历史记录
      const savedHistory = localStorage.getItem('codeAnalysisHistory');
      let records = [];
      
      if (savedHistory) {
        records = JSON.parse(savedHistory);
      }
      
      // 添加新记录（限制最多保存50条）
      records.unshift(record);
      if (records.length > 50) {
        records = records.slice(0, 50);
      }
      
      // 保存回本地存储
      localStorage.setItem('codeAnalysisHistory', JSON.stringify(records));
      console.log('历史记录已保存');
    } catch (error) {
      console.error('保存历史记录失败:', error);
    }
  };
        
  // 应用修复
  const applyFixes = () => {
    if (rightCode) {
      setLeftCode(rightCode);
      setRightCode('');
      setVulnerabilities([]);
      setErrorLines([]);
      setFixedLines([]);
      setShowErrorFixDiff(false);
      message.success('已应用所有修复');
    }
  };

  /**
   * 根据代码内容猜测文件扩展名
   */
  const getCodeFileExtension = (code: string): string => {
    // 简单启发式判断代码语言
    if (code.includes('import ') && code.includes('def ') && code.includes(':')) {
      return 'py'; // Python
    } else if (code.includes('function') && (code.includes('{') || code.includes('=>'))) {
      return 'js'; // JavaScript
    } else {
      return 'txt'; // 默认文本
    }
  };

  // 查看错误修复对比图
  const viewDiffComparison = () => {
    setShowDiffView(true);
  };

  // 渲染漏洞列表
  const renderVulnerabilityList = () => {
    if (vulnerabilities.length === 0) {
      return <Text>没有发现漏洞</Text>;
    }

    return (
      <div className="vulnerability-list">
        {vulnerabilities.map((vuln) => (
          <div 
            key={vuln.id} 
            className={`vulnerability-item ${vuln.severity === 'critical' || vuln.severity === 'high' ? 'vulnerability-item-critical' : ''} ${vuln.fixed ? 'vulnerability-item-fixed' : ''}`}
            onClick={() => {
              // 点击漏洞项时跳转到对应行
              if (leftEditorRef.current) {
                leftEditorRef.current.revealLineInCenter(vuln.line);
                leftEditorRef.current.setPosition({lineNumber: vuln.line, column: vuln.column});
                leftEditorRef.current.focus();
              }
            }}
            style={{ cursor: 'pointer' }}
          >
            <div><strong>问题：</strong> {vuln.message}</div>
            <div><strong>位置：</strong> 第 {vuln.line} 行，第 {vuln.column} 列</div>
            <div><strong>严重程度：</strong> {
              vuln.severity === 'critical' ? '严重' :
              vuln.severity === 'high' ? '高' :
              vuln.severity === 'medium' ? '中' : '低'
            }</div>
            <div><strong>状态：</strong> {vuln.fixed ? '已修复' : '未修复'}</div>
          </div>
        ))}
      </div>
    );
  };

  // 监听历史记录恢复事件
  useEffect(() => {
    const handleRestoreHistory = (event: Event) => {
      const customEvent = event as CustomEvent<{
        originalCode: string;
        fixedCode: string;
        vulnerabilities: any[];
        errorLines?: number[];
        fixedLines?: number[];
      }>;
      
      if (customEvent.detail) {
        setLeftCode(customEvent.detail.originalCode);
        setRightCode(customEvent.detail.fixedCode || '');
        setVulnerabilities(customEvent.detail.vulnerabilities || []);
        setErrorLines(customEvent.detail.errorLines || []);
        setFixedLines(customEvent.detail.fixedLines || []);
        setShowErrorFixDiff(Boolean(customEvent.detail.fixedCode));
        
        // 应用高亮
        setTimeout(() => {
          highlightErrorsInLeftEditor();
          if (customEvent.detail.fixedCode) {
            highlightFixesInRightEditor();
          }
        }, 100);
        
        message.success('已恢复历史记录');
      }
    };
    
    document.addEventListener('restoreHistoryRecord', handleRestoreHistory as EventListener);
    
    return () => {
      document.removeEventListener('restoreHistoryRecord', handleRestoreHistory as EventListener);
    };
  }, []);

  return (
    <div className="code-editor-container">
      <Card className="editor-card" title="代码漏洞修复系统" bordered={false}>
        <div className="editor-toolbar">
                <Space>
                  <Upload {...uploadProps}>
                    <Button icon={<UploadOutlined />}>上传文件</Button>
                  </Upload>
                  <Button 
                    type="primary" 
                    icon={<SendOutlined />} 
                    onClick={analyzeCode}
                    loading={isProcessing}
                  >
              分析代码
            </Button>
            {rightCode && (
              <Button 
                type="primary" 
                icon={<CodeOutlined />} 
                onClick={applyFixes}
              >
                应用修复
              </Button>
            )}
            {showErrorFixDiff && (
              <Button 
                icon={<SyncOutlined />} 
                onClick={viewDiffComparison}
              >
                查看错误修复对比
                  </Button>
            )}
                </Space>
        </div>
        
        <div className="editors-container">
          <div className="editor-left">
            <Card 
              title="原始代码" 
              className="editor-panel"
              size="small"
            >
                <Editor
                height="60vh"
                  defaultLanguage="python"
                  value={leftCode}
                  onChange={(value) => setLeftCode(value || '')}
                theme={currentTheme === 'dark' ? 'darkTheme' : 'lightTheme'}
                  beforeMount={handleEditorWillMount}
                  onMount={handleLeftEditorDidMount}
                  options={{
                  minimap: { enabled: true },
                  scrollBeyondLastLine: false,
                  fontFamily: '"Fira Code", "JetBrains Mono", Menlo, Monaco, "Courier New", monospace',
                  fontLigatures: true,
                    fontSize: 14,
                  tabSize: 4,
                  insertSpaces: true,
                    lineNumbers: 'on',
                  renderWhitespace: 'selection',
                  renderLineHighlight: 'all',
                  glyphMargin: true,
                    automaticLayout: true,
                    scrollbar: {
                      verticalScrollbarSize: 12,
                      horizontalScrollbarSize: 12
                    }
                  }}
                />
            </Card>
          </div>

          <div className="editor-right">
            <Card 
              title="修复代码" 
              className="editor-panel"
              size="small"
            >
                {isProcessing ? (
                <div className="loading-container">
                    <Spin tip="正在分析和修复代码..." />
                  </div>
                ) : (
                  <Editor
                  height="60vh"
                    defaultLanguage="python"
                    value={rightCode}
                  theme={currentTheme === 'dark' ? 'darkTheme' : 'lightTheme'}
                    beforeMount={handleEditorWillMount}
                    onMount={handleRightEditorDidMount}
                    options={{
                      readOnly: true,
                    minimap: { enabled: true },
                    scrollBeyondLastLine: false,
                    fontFamily: '"Fira Code", "JetBrains Mono", Menlo, Monaco, "Courier New", monospace',
                    fontLigatures: true,
                      fontSize: 14,
                    tabSize: 4,
                    insertSpaces: true,
                      lineNumbers: 'on',
                    renderWhitespace: 'selection',
                    renderLineHighlight: 'all',
                    glyphMargin: true,
                      automaticLayout: true,
                      scrollbar: {
                        verticalScrollbarSize: 12,
                        horizontalScrollbarSize: 12
                      }
                    }}
                  />
                )}
            </Card>
          </div>
            </div>

      <Divider />

        {vulnerabilities.length > 0 && (
          <div className="vulnerability-section">
            <Title level={4}>
              发现 {vulnerabilities.length} 个安全漏洞
            </Title>
            {renderVulnerabilityList()}
          </div>
        )}
      </Card>

      <Modal
        title="错误与修复对比"
        open={showDiffView}
        onCancel={() => setShowDiffView(false)}
        width={1200}
        footer={[
          <Button key="back" onClick={() => setShowDiffView(false)}>
            关闭
          </Button>
        ]}
      >
        {showErrorFixDiff && (
          <ErrorFixDiffViewer
            oldCode={leftCode}
            newCode={rightCode}
            errorLines={errorLines}
            fixedLines={fixedLines}
            language={getCodeFileExtension(leftCode) === 'py' ? 'python' : 'javascript'}
            fileName={`code.${getCodeFileExtension(leftCode)}`}
            outputFormat="side-by-side"
            theme="trae"
          />
        )}
      </Modal>
      
      <style>
        {`
          .code-editor-container {
            max-width: 1400px;
            margin: 0 auto;
          }
          .editor-card {
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          }
          .editor-toolbar {
            margin-bottom: 16px;
          }
          .editors-container {
            display: flex;
            flex-direction: row;
            gap: 16px;
          }
          .editor-left, .editor-right {
            flex: 1;
            min-width: 0;
          }
          .editor-panel {
            height: 100%;
          }
          .loading-container {
            display: flex;
            justify-content: center;
            align-items: center;
            height: 60vh;
          }
          .error-line {
            background-color: rgba(255, 0, 0, 0.2) !important;
            border-left: 3px solid red !important;
          }
          .error-glyph {
            background-color: red !important;
            border-radius: 50% !important;
            margin-left: 5px !important;
          }
          .fixed-line {
            background-color: rgba(0, 255, 0, 0.2) !important;
            border-left: 3px solid green !important;
          }
          .vulnerability-list {
            margin-top: 16px;
          }
          .vulnerability-item {
            margin-bottom: 12px;
            padding: 12px;
            border-radius: 4px;
            background-color: #f5f5f5;
            border-left: 4px solid #ffa39e;
          }
          .vulnerability-item-critical {
            border-left: 4px solid #ff4d4f;
            background-color: #fff1f0;
          }
          .vulnerability-item-fixed {
            border-left: 4px solid #52c41a;
          }
          .vulnerability-section {
            margin-top: 16px;
          }
          
          /* VS Code 风格滚动条 */
          ::-webkit-scrollbar {
            width: 12px;
            height: 12px;
          }
          ::-webkit-scrollbar-thumb {
            background-color: rgba(121, 121, 121, 0.4);
          }
          ::-webkit-scrollbar-thumb:hover {
            background-color: rgba(100, 100, 100, 0.7);
          }
          ::-webkit-scrollbar-track {
            background-color: transparent;
          }
        `}
      </style>
    </div>
  );
};

export default CodeEditor; 
