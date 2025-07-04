import React, { useEffect, useRef } from 'react';
import { createPatch } from 'diff';
import { html } from 'diff2html';
import 'diff2html/bundles/css/diff2html.min.css';
import Prism from 'prismjs';

// 加载常用编程语言支持
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-jsx';
import 'prismjs/components/prism-tsx';
import 'prismjs/components/prism-java';
import 'prismjs/components/prism-c';
import 'prismjs/components/prism-cpp';
import 'prismjs/components/prism-csharp';
import 'prismjs/components/prism-rust';
import 'prismjs/components/prism-go';
import 'prismjs/components/prism-ruby';
import 'prismjs/components/prism-php';
import 'prismjs/components/prism-markup'; // HTML
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-sql';
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-yaml';

import 'prismjs/themes/prism.css';
import 'prismjs/themes/prism-okaidia.css';

export interface ErrorFixDiffViewerProps {
  oldCode: string;
  newCode: string;
  errorLines?: number[];      // 原始代码中的错误行号
  fixedLines?: number[];      // 修复后代码中的修复行号
  language?: string;
  fileName?: string;
  outputFormat?: 'side-by-side' | 'line-by-line';
  theme?: 'light' | 'dark' | 'trae';
}

// 支持的文件类型映射到Prism语言
const fileExtensionToPrismLanguage: Record<string, string> = {
  'py': 'python',
  'js': 'javascript',
  'jsx': 'jsx',
  'ts': 'typescript',
  'tsx': 'tsx',
  'java': 'java',
  'c': 'c',
  'cpp': 'cpp',
  'cs': 'csharp',
  'rs': 'rust',
  'go': 'go',
  'rb': 'ruby',
  'php': 'php',
  'html': 'markup',
  'htm': 'markup',
  'xml': 'markup',
  'css': 'css',
  'sql': 'sql',
  'sh': 'bash',
  'json': 'json',
  'yml': 'yaml',
  'yaml': 'yaml',
  'md': 'markdown',
  'txt': 'plaintext',
};

/**
 * 从文件名中推断语言
 */
const inferLanguageFromFileName = (fileName: string): string => {
  if (!fileName) return 'plaintext';
  
  const extension = fileName.split('.').pop()?.toLowerCase() || '';
  return fileExtensionToPrismLanguage[extension] || 'plaintext';
};

/**
 * 根据代码内容猜测语言
 */
const inferLanguageFromContent = (code: string): string => {
  if (code.includes('def ') && code.includes(':')) {
    return 'python';
  } else if (code.includes('function') && (code.includes('{') || code.includes('=>'))) {
    return 'javascript';
  } else if (code.includes('import React') || code.includes('from "react"')) {
    return 'jsx';
  } else if (code.includes('class ') && code.includes(' extends ') && code.includes('{')){
    return 'javascript';
  } else if (code.includes('<html') || code.includes('<div')) {
    return 'markup';
  } else if (code.includes('#include <') && (code.includes('int main') || code.includes('void main'))) {
    return 'cpp';
  } else if (code.includes('package ') && code.includes('public class')) {
    return 'java';
  } else if (code.includes('SELECT') && code.includes('FROM') && code.includes('WHERE')) {
    return 'sql';
  }
  
  return 'plaintext';
};

const ErrorFixDiffViewer: React.FC<ErrorFixDiffViewerProps> = ({
  oldCode,
  newCode,
  errorLines = [],
  fixedLines = [],
  language,
  fileName = '',
  outputFormat = 'side-by-side',
  theme = 'dark',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // 推断语言
  const inferredLanguage = language || 
                          inferLanguageFromFileName(fileName) || 
                          inferLanguageFromContent(oldCode);

  useEffect(() => {
    if (!containerRef.current) return;

    try {
      // 确保语言有效
      const validLanguage = inferredLanguage in fileExtensionToPrismLanguage ? 
                            inferredLanguage : 'plaintext';

      // 创建差异补丁
      const diffPatch = createPatch(
        fileName || `code.${validLanguage}`,
        oldCode || '',
        newCode || '',
        '原始代码（错误部分标红）',
        '修复后代码（修复部分标绿）'
      );

      // 转换为HTML并渲染
      const diffHtml = html(diffPatch, {
        drawFileList: false,
        matching: 'lines',
        outputFormat: outputFormat,
        renderNothingWhenEmpty: true,
        matchingMaxComparisons: 2500,
        maxLineLengthHighlight: 1000,
        diffStyle: 'word' as 'word' | 'char'
      });

      containerRef.current.innerHTML = diffHtml;
      
      // 设置自定义主题类
      containerRef.current.classList.add(`diff-theme-${theme}`);

      // 应用代码高亮
      const codeElements = containerRef.current.querySelectorAll('code');
      codeElements.forEach((element) => {
        element.classList.add(`language-${validLanguage}`);
        Prism.highlightElement(element);
      });

      // 为错误行添加特殊标记
      errorLines.forEach(lineNum => {
        const leftLineElements = containerRef.current?.querySelectorAll(
          `.d2h-code-side-linenumber[data-line-number="${lineNum}"]`
        );
        
        leftLineElements?.forEach(element => {
          // 找到父行元素
          const lineElement = element.closest('.d2h-code-side-line');
          if (lineElement) {
            lineElement.classList.add('error-line');
            
            // 找到对应的代码内容元素并添加类
            const codeElement = lineElement.querySelector('.d2h-code-line-ctn');
            if (codeElement) {
              codeElement.classList.add('error-code');
            }
          }
        });
      });

      // 为修复行添加特殊标记
      fixedLines.forEach(lineNum => {
        const rightLineElements = containerRef.current?.querySelectorAll(
          `.d2h-code-side-linenumber[data-line-number="${lineNum}"]`
        );
        
        rightLineElements?.forEach(element => {
          // 确保我们只针对右侧面板
          const sidePanel = element.closest('.d2h-code-side-line.d2h-ins');
          if (sidePanel) {
            sidePanel.classList.add('fixed-line');
            
            // 找到对应的代码内容元素并添加类
            const codeElement = sidePanel.querySelector('.d2h-code-line-ctn');
            if (codeElement) {
              codeElement.classList.add('fixed-code');
            }
          }
        });
      });
    } catch (error) {
      console.error('创建差异对比时出错:', error);
      containerRef.current.innerHTML = '<div class="error-message">无法生成差异对比视图</div>';
    }
  }, [oldCode, newCode, fileName, inferredLanguage, outputFormat, errorLines, fixedLines, theme]);

  // 监听主题变化
  useEffect(() => {
    const handleThemeChange = () => {
      if (!containerRef.current) return;
      
      // 重新应用代码高亮
      const codeElements = containerRef.current.querySelectorAll('code');
      codeElements.forEach((element) => {
        Prism.highlightElement(element);
      });
    };

    document.addEventListener('themeChanged', handleThemeChange);
    
    return () => {
      document.removeEventListener('themeChanged', handleThemeChange);
    };
  }, []);

  return (
    <div className={`error-fix-diff-container diff-theme-${theme}`}>
      <div ref={containerRef} className="diff2html-container"></div>
    </div>
  );
};

export default ErrorFixDiffViewer; 