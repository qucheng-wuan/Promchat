from pydantic import BaseModel
from typing import List, Optional

class Vulnerability(BaseModel):
    """
    表示代码中检测到的漏洞
    """
    id: str
    line: int
    column: int
    message: str
    severity: str  # 'low', 'medium', 'high', 'critical'
    fixed: bool = False

class CodeAnalysisRequest(BaseModel):
    """
    代码分析请求
    """
    code: str
    language: str = "python"
    check_types: Optional[List[str]] = None

class CodeAnalysisResponse(BaseModel):
    """
    代码分析响应
    """
    original_code: str
    fixed_code: str
    vulnerabilities: List[Vulnerability]
    execution_time: float
    status: str  # 'success', 'partial', 'failed' 