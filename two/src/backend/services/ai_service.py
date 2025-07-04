import requests
import json
import re
from typing import List, Dict, Any, Optional

class AIService:
    """
    AI服务接口，用于调用DeepSeek API进行代码生成和修复
    """
    
    def __init__(self, api_key: str = "sk-2d57aea45c7b4db6b446f91d22a621bd", model: str = "deepseek-coder"):
        """
        初始化AI服务
        
        Args:
            api_key: DeepSeek API密钥
            model: 使用的模型名称
        """
        self.api_key = api_key
        self.model = model
        self.api_url = "https://api.deepseek.com/v1/chat/completions"  # DeepSeek API地址
        
    def _call_api(self, messages: List[Dict[str, str]], temperature: float = 0.2) -> Dict[str, Any]:
        """
        调用DeepSeek API
        
        Args:
            messages: 消息列表
            temperature: 生成温度
            
        Returns:
            API响应
        """
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self.api_key}"
        }
        
        data = {
            "model": self.model,
            "messages": messages,
            "temperature": temperature
        }
        
        response = requests.post(self.api_url, headers=headers, json=data)
        
        if response.status_code != 200:
            raise Exception(f"API调用失败: {response.status_code} {response.text}")
        
        return response.json()
    
    def analyze_and_fix_code(self, code: str, language: str = "python") -> Dict[str, Any]:
        """
        分析并修复代码中的安全漏洞
        
        Args:
            code: 源代码
            language: 编程语言，默认为python
            
        Returns:
            修复结果，包含修复后的代码和发现的漏洞
        """
        # 创建提示
        prompt = f"""你是一个代码安全专家，请按以下规则处理用户提供的{language}代码：

1. **漏洞检测**
   - 扫描代码中的安全漏洞（优先处理OWASP Top 10漏洞）
   - 识别危险函数/模式（如{language}中的不安全API、命令注入风险、SQL注入等）

2. **修复策略**
   - 在漏洞代码行添加简洁注释（格式：{self._get_comment_syntax(language)} [FIX] 原因）
   - 提供最小化修改方案（保持原有功能不变）
   - 优先使用语言原生安全方案

3. **输出格式**
   ```{language}
   {self._get_comment_syntax(language)} [FIX] 修复原因描述
   {self._get_comment_syntax(language)} 原代码：有漏洞的代码行
   安全的替代实现代码
   ```

以下是需要你分析和修复的{language}代码：

```{language}
{code}
```

请提供以下信息:
1. 代码中发现的安全漏洞列表，每个漏洞包括行号、描述和严重程度
2. 修复后的完整代码（使用上述修复策略和输出格式）
3. 修复说明

请确保修复不改变代码的原始功能。"""
        
        messages = [
            {"role": "system", "content": f"你是一个专业的{language}安全专家，精通代码漏洞检测和修复。你的回答将被直接用于代码分析系统。"},
            {"role": "user", "content": prompt}
        ]
        
        try:
            response = self._call_api(messages)
            content = response["choices"][0]["message"]["content"]
            
            # 解析回复内容
            result = self._parse_response(content, code, language)
            return result
        except Exception as e:
            print(f"分析代码时出错: {str(e)}")
            return {
                "fixed_code": code,
                "vulnerabilities": [],
                "error": str(e)
            }
    
    def _get_comment_syntax(self, language: str) -> str:
        """
        获取不同语言的注释语法
        
        Args:
            language: 编程语言
            
        Returns:
            注释语法
        """
        comment_syntaxes = {
            "python": "#",
            "javascript": "//",
            "typescript": "//",
            "java": "//",
            "c": "//",
            "cpp": "//",
            "csharp": "//",
            "go": "//",
            "rust": "//",
            "php": "//",
            "ruby": "#",
            "swift": "//",
            "kotlin": "//",
            "scala": "//",
            "shell": "#",
            "bash": "#",
            "sql": "--",
            "html": "<!--",  # HTML注释开始
            "css": "/*",  # CSS注释开始
        }
        
        return comment_syntaxes.get(language.lower(), "#")  # 默认使用#作为注释
    
    def _parse_response(self, content: str, original_code: str, language: str = "python") -> Dict[str, Any]:
        """
        解析API响应
        
        Args:
            content: API响应内容
            original_code: 原始代码
            language: 编程语言
            
        Returns:
            解析结果
        """
        # 提取修复后的代码
        code_pattern = f"```(?:{language})?\\s*(.*?)\\s*```"
        code_match = re.search(code_pattern, content, re.DOTALL)
        fixed_code = code_match.group(1) if code_match else original_code
        
        # 尝试提取漏洞信息
        vulnerabilities = []
        
        # 简单匹配行号和描述
        vuln_pattern = r"行(\d+).*?[:：](.+?)(?:\n|$)"
        for idx, match in enumerate(re.finditer(vuln_pattern, content)):
            line = int(match.group(1))
            description = match.group(2).strip()
            
            # 尝试从描述中判断严重程度
            severity = "medium"  # 默认中等严重
            if any(keyword in description.lower() for keyword in ["严重", "高风险", "危险", "critical", "high"]):
                severity = "high"
            elif any(keyword in description.lower() for keyword in ["低风险", "建议", "提示", "low"]):
                severity = "low"
            
            vulnerabilities.append({
                "id": str(idx + 1),
                "line": line,
                "column": 1,  # 无法精确定位列，默认为1
                "message": description,
                "severity": severity,
                "fixed": True
            })
        
        return {
            "fixed_code": fixed_code,
            "vulnerabilities": vulnerabilities
        } 