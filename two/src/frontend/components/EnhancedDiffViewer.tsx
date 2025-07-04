import React, { useEffect, useRef } from 'react';
import { createPatch } from 'diff';
import { html } from 'diff2html';
import 'diff2html/bundles/css/diff2html.min.css';
import Prism from 'prismjs';
import 'prismjs/components/prism-python';
import 'prismjs/themes/prism.css';
import 'prismjs/themes/prism-okaidia.css'; // 暗色主题

interface EnhancedDiffViewerProps {
  oldCode: string;
  newCode: string;
  language?: string;
  fileName?: string;
  outputFormat?: 'side-by-side' | 'line-by-line';
}

const EnhancedDiffViewer: React.FC<EnhancedDiffViewerProps> = ({
  oldCode,
  newCode,
  language = 'python',
  fileName = 'code.py',
  outputFormat = 'side-by-side'
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    try {
      // 创建差异补丁
      const diffPatch = createPatch(
        fileName,
        oldCode || '',
        newCode || '',
        '原始代码',
        '修复后代码'
      );

      // 转换为HTML并渲染
      const diffHtml = html(diffPatch, {
        drawFileList: false,
        matching: 'lines',
        outputFormat: outputFormat,
        renderNothingWhenEmpty: true,
        matchingMaxComparisons: 2500,
        maxLineLengthHighlight: 1000,
        diffStyle: 'word'
      });

      containerRef.current.innerHTML = diffHtml;

      // 应用代码高亮
      const codeElements = containerRef.current.querySelectorAll('code');
      codeElements.forEach((element) => {
        // 为代码块添加语言类
        element.classList.add(`language-${language}`);
        Prism.highlightElement(element);
      });
    } catch (error) {
      console.error('创建差异对比时出错:', error);
      containerRef.current.innerHTML = '<div class="error-message">无法生成差异对比视图</div>';
    }
  }, [oldCode, newCode, fileName, language, outputFormat]);

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

    // 监听自定义事件
    document.addEventListener('themeChanged', handleThemeChange);
    
    return () => {
      document.removeEventListener('themeChanged', handleThemeChange);
    };
  }, []);

  return (
    <div className="enhanced-diff-container">
      <div ref={containerRef} className="diff2html-container"></div>
    </div>
  );
};

export default EnhancedDiffViewer; 