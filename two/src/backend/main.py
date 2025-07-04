from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import time
from src.backend.services.ai_service import AIService

app = FastAPI(
    title="代码漏洞修复系统API",
    description="用于分析和修复代码中的安全漏洞",
    version="0.1.0",
)

# 配置CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 生产环境中应设置为具体的前端地址
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 初始化AI服务
ai_service = AIService()

class Vulnerability(BaseModel):
    id: str
    line: int
    column: int
    message: str
    severity: str
    fixed: bool = False

class CodeAnalysisRequest(BaseModel):
    code: str
    language: str = "python"

class CodeAnalysisResponse(BaseModel):
    original_code: str
    fixed_code: str
    vulnerabilities: List[Vulnerability]
    execution_time: float
    status: str

@app.post("/api/analyze", response_model=CodeAnalysisResponse)
async def analyze_code(request: CodeAnalysisRequest):
    """分析代码并修复漏洞"""
    
    start_time = time.time()
    
    try:
        # 使用AI服务分析和修复代码，传入语言参数
        result = ai_service.analyze_and_fix_code(request.code, request.language)
        
        # 转换漏洞对象
        vulnerabilities = []
        for vuln_data in result.get("vulnerabilities", []):
            vulnerabilities.append(
                Vulnerability(
                    id=vuln_data.get("id", "1"),
                    line=vuln_data.get("line", 1),
                    column=vuln_data.get("column", 1),
                    message=vuln_data.get("message", "未知漏洞"),
                    severity=vuln_data.get("severity", "medium"),
                    fixed=vuln_data.get("fixed", True)
                )
            )
        
        fixed_code = result.get("fixed_code", request.code)
        execution_time = time.time() - start_time
        
        return CodeAnalysisResponse(
            original_code=request.code,
            fixed_code=fixed_code,
            vulnerabilities=vulnerabilities,
            execution_time=execution_time,
            status="success" if vulnerabilities else "no_issues"
        )
        
    except Exception as e:
        print(f"处理代码时出错: {str(e)}")
        # 发生错误时返回原始代码
        return CodeAnalysisResponse(
            original_code=request.code,
            fixed_code=request.code,
            vulnerabilities=[],
            execution_time=time.time() - start_time,
            status="error"
        )

@app.get("/health")
async def health_check():
    """健康检查接口"""
    return {"status": "healthy", "version": "0.1.0"}

@app.get("/api/supported_languages")
async def supported_languages():
    """返回支持的编程语言列表"""
    languages = [
        {"id": "python", "name": "Python", "icon": "python"},
        {"id": "javascript", "name": "JavaScript", "icon": "javascript"},
        {"id": "typescript", "name": "TypeScript", "icon": "typescript"},
        {"id": "java", "name": "Java", "icon": "java"},
        {"id": "cpp", "name": "C++", "icon": "cpp"},
        {"id": "csharp", "name": "C#", "icon": "csharp"},
        {"id": "go", "name": "Go", "icon": "go"},
        {"id": "php", "name": "PHP", "icon": "php"},
        {"id": "ruby", "name": "Ruby", "icon": "ruby"},
        {"id": "swift", "name": "Swift", "icon": "swift"},
        {"id": "sql", "name": "SQL", "icon": "sql"},
        {"id": "html", "name": "HTML", "icon": "html"},
        {"id": "css", "name": "CSS", "icon": "css"},
        {"id": "rust", "name": "Rust", "icon": "rust"},
        {"id": "kotlin", "name": "Kotlin", "icon": "kotlin"}
    ]
    return {"languages": languages}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True) 