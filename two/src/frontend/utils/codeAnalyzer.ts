import { parsePatch } from 'diff';

/**
 * 分析代码差异，找出错误和修复的行号
 *
 * @param oldCode 原始代码（可能包含错误）
 * @param newCode 修复后的代码
 * @param fileName 文件名（用于差异分析）
 * @returns 包含错误行号和修复行号的对象
 */
export function analyzeCodeDifferences(
  oldCode: string,
  newCode: string,
  fileName: string = 'code.py'
): {
  errorLines: number[];
  fixedLines: number[];
} {
  // 创建差异字符串
  const diffStr = 
    `--- a/${fileName}\n` +
    `+++ b/${fileName}\n` +
    generateUnifiedDiff(oldCode, newCode);

  try {
    // 解析差异
    const patches = parsePatch(diffStr);
    
    if (!patches || patches.length === 0) {
      return { errorLines: [], fixedLines: [] };
    }

    const errorLines: number[] = [];
    const fixedLines: number[] = [];

    // 分析每个差异块
    patches.forEach(patch => {
      patch.hunks.forEach(hunk => {
        let oldLineNumber = hunk.oldStart;
        let newLineNumber = hunk.newStart;

        hunk.lines.forEach(line => {
          if (line.startsWith('-')) {
            // 这是原始代码中被删除的行，可能是错误行
            errorLines.push(oldLineNumber);
            oldLineNumber++;
          } else if (line.startsWith('+')) {
            // 这是修复后代码中新增的行，可能是修复行
            fixedLines.push(newLineNumber);
            newLineNumber++;
          } else {
            // 上下文行，两边都递增
            oldLineNumber++;
            newLineNumber++;
          }
        });
      });
    });

    return { errorLines, fixedLines };
  } catch (error) {
    console.error('分析代码差异时出错:', error);
    return { errorLines: [], fixedLines: [] };
  }
}

/**
 * 生成统一差异格式（Unified Diff Format）
 */
function generateUnifiedDiff(oldCode: string, newCode: string): string {
  const oldLines = oldCode.split('\n');
  const newLines = newCode.split('\n');
  
  let diff = '';
  let inHunk = false;
  let hunkOldStart = 0;
  let hunkNewStart = 0;
  let hunkOldLines = 0;
  let hunkNewLines = 0;
  let hunkLines: string[] = [];
  
  // 简单的差异算法 - 实际项目中可以使用更复杂的算法
  for (let i = 0; i < Math.max(oldLines.length, newLines.length); i++) {
    const oldLine = i < oldLines.length ? oldLines[i] : null;
    const newLine = i < newLines.length ? newLines[i] : null;
    
    if (oldLine !== newLine) {
      if (!inHunk) {
        inHunk = true;
        hunkOldStart = Math.max(1, i - 3); // 上下文行
        hunkNewStart = Math.max(1, i - 3);
        hunkOldLines = 0;
        hunkNewLines = 0;
        hunkLines = [];
        
        // 添加上下文行
        for (let j = Math.max(0, i - 3); j < i; j++) {
          if (j < oldLines.length) {
            hunkLines.push(' ' + oldLines[j]);
            hunkOldLines++;
            hunkNewLines++;
          }
        }
      }
      
      if (oldLine === null) {
        hunkLines.push('+' + newLine);
        hunkNewLines++;
      } else if (newLine === null) {
        hunkLines.push('-' + oldLine);
        hunkOldLines++;
      } else {
        hunkLines.push('-' + oldLine);
        hunkLines.push('+' + newLine);
        hunkOldLines++;
        hunkNewLines++;
      }
    } else if (inHunk) {
      // 继续添加几行上下文
      if (i < oldLines.length) {
        hunkLines.push(' ' + oldLines[i]);
        hunkOldLines++;
        hunkNewLines++;
      }
      
      // 如果我们有足够的上下文行或到达文件末尾，完成这个hunk
      if (hunkLines.length > 0 && (hunkLines.length >= 6 || i >= oldLines.length - 1 || i >= newLines.length - 1)) {
        diff += `@@ -${hunkOldStart},${hunkOldLines} +${hunkNewStart},${hunkNewLines} @@\n`;
        diff += hunkLines.join('\n') + '\n';
        inHunk = false;
      }
    }
  }
  
  // 处理最后一个hunk
  if (inHunk && hunkLines.length > 0) {
    diff += `@@ -${hunkOldStart},${hunkOldLines} +${hunkNewStart},${hunkNewLines} @@\n`;
    diff += hunkLines.join('\n') + '\n';
  }
  
  return diff;
}

/**
 * 检测代码中的常见错误，返回可能的错误行号
 * 这个函数可以根据项目需求进一步扩展，添加更多错误检测规则
 */
export function detectCodeErrors(
  code: string,
  language: string = 'python'
): number[] {
  const lines = code.split('\n');
  const errorLines: number[] = [];
  
  // 根据语言类型应用不同的检测规则
  switch (language.toLowerCase()) {
    case 'python':
      // Python错误检测规则
      lines.forEach((line, index) => {
        // 检测未闭合的括号、引号等
        const openBrackets = (line.match(/\(/g) || []).length;
        const closeBrackets = (line.match(/\)/g) || []).length;
        if (openBrackets !== closeBrackets) {
          errorLines.push(index + 1); // 行号从1开始
        }
        
        // 检测可能的SQL注入
        if (/execute\s*\(\s*["'].*\%s.*["']/i.test(line) && line.includes('input')) {
          errorLines.push(index + 1);
        }
        
        // 检测可能的命令注入
        if (/os\.system|subprocess\.call|eval|exec/.test(line) && line.includes('input')) {
          errorLines.push(index + 1);
        }
      });
      break;
      
    case 'javascript':
    case 'typescript':
      // JavaScript/TypeScript错误检测规则
      lines.forEach((line, index) => {
        // 检测可能的XSS
        if (/innerHTML|outerHTML|document\.write/.test(line) && /\$\{.*\}|variable|param|input/.test(line)) {
          errorLines.push(index + 1);
        }
        
        // 检测可能的原型污染
        if (/Object\.assign\(.*,.*\)/.test(line) && !line.includes('{}')) {
          errorLines.push(index + 1);
        }
      });
      break;
  }
  
  return errorLines;
} 