# Promchat


# 代码漏洞修复系统

一个基于大语言模型的多语言代码漏洞检测与修复平台，支持多种编程语言，提供直观的用户界面和详细的漏洞分析报告。

## 目录

- [系统概述](#系统概述)
- [功能特点](#功能特点)
- [环境要求](#环境要求)
- [目录结构](#目录结构)
- [安装指南](#安装指南)
- [启动服务](#启动服务)
- [使用说明](#使用说明)
- [用户角色](#用户角色)
- [常见问题](#常见问题)
- [技术架构](#技术架构)
- [维护与更新](#维护与更新)

## 系统概述

代码漏洞修复系统是一个综合性平台，旨在帮助开发人员发现和修复代码中的安全漏洞。系统利用DeepSeek大语言模型识别各种编程语言中的安全问题，并提供具体的修复建议，帮助开发人员编写更安全的代码。

## 功能特点

- **多语言支持**：支持Python、JavaScript、Java、C/C++等多种编程语言的漏洞检测
- **实时分析**：快速分析代码并提供即时反馈
- **智能修复**：自动生成修复建议，并提供详细的解释
- **可视化报告**：直观展示漏洞分布、严重程度和修复进度
- **历史记录**：保存历史分析结果，跟踪修复进展
- **多角色支持**：管理员和普通用户不同权限体系
- **响应式设计**：适配各种设备屏幕尺寸

## 环境要求

### 软件要求

- **操作系统**：Windows 10/11、macOS 10.15+、Ubuntu 20.04+
- **Node.js**：v16.0.0 或更高版本
- **Python**：3.9 或更高版本
- **npm**：7.0.0 或更高版本
- **浏览器**：Chrome 90+、Firefox 90+、Edge 90+

### 硬件要求

- **CPU**：双核或更高
- **内存**：至少4GB RAM（推荐8GB）
- **磁盘空间**：至少1GB可用空间
- **网络**：稳定的互联网连接（用于API调用）

## 目录结构

```
two_front/two/
├── src/
│   ├── frontend/          # React前端代码
│   │   ├── components/    # UI组件
│   │   ├── pages/         # 页面组件
│   │   └── utils/         # 工具函数
│   └── backend/           # FastAPI后端代码
│       ├── models/        # 数据模型
│       ├── services/      # 业务逻辑
│       └── database/      # 数据库相关
├── public/                # 静态资源
├── node_modules/          # Node.js依赖
├── .venv/                 # Python虚拟环境
├── package.json           # npm配置
├── requirements.txt       # Python依赖
└── run.py                 # 启动脚本
```

## 安装指南

### 步骤1：克隆或下载项目

```bash
# 如果使用Git
git clone <repository-url>

# 或解压下载的压缩包
# 解压后进入项目目录
cd two_front/two
```

### 步骤2：安装前端依赖

```bash
# Windows PowerShell
cd D:\Users\QuCheng\Desktop\two_front\two
npm install

# Linux/macOS
cd /path/to/two_front/two
npm install
```

### 步骤3：配置Python环境

```bash
# Windows PowerShell
# 创建并激活虚拟环境（可选但推荐）
python -m venv .venv
.\.venv\Scripts\Activate.ps1

# 安装Python依赖
pip install -r requirements.txt

# Linux/macOS
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

### 步骤4：配置API密钥（可选）

如果您有自己的DeepSeek API密钥，请编辑以下文件：

```bash
# 编辑 src/backend/services/ai_service.py
# 找到并修改如下行：
def __init__(self, api_key: str = "sk-2d57aea45c7b4db6b446f91d22a621bd", model: str = "deepseek-coder"):
# 替换为您的API密钥
```

### 步骤5：创建环境变量文件（可选）

在项目根目录创建`.env`文件（如果系统未自动创建）：

```
OPENAI_API_KEY=your_deepseek_api_key
SECRET_KEY=your_secret_key
DATABASE_URL=sqlite:///./code_repair.db
```

## 启动服务

### 开发环境

**注意**: 在Windows PowerShell中，不支持`&&`连接多个命令，需要分别运行。

1. **启动后端服务**:

```bash
# 确保在two目录下运行命令
cd D:\Users\QuCheng\Desktop\two_front\two

# 启动后端服务器
uvicorn src.backend.main:app --reload --host 0.0.0.0 --port 8000
```

2. **新开一个终端，启动前端服务**:

```bash
# 确保在two目录下运行命令
cd D:\Users\QuCheng\Desktop\two_front\two

# 启动前端开发服务器
npm run dev
```

或者使用集成脚本（确保在正确的目录下）:

```bash
# 使用集成脚本同时启动前后端（推荐）
python run.py
```

### 生产环境

```bash
# 构建前端生产版本
npm run build

# 启动生产环境服务
python run.py --prod
```

## 使用说明

### 访问系统

- 开发环境：http://localhost:5173（或命令行输出的地址）
- 生产环境：http://服务器IP:端口

### 账号登录

| 角色 | 用户名 | 密码 | 
|------|--------|------|
| 管理员 | admin | admin123 |
| 普通用户 | user1 | user123 |
| 普通用户 | user2 | user123 |

### 使用流程

#### 1. 代码检测与修复

1. 登录系统后，点击导航栏的"代码修复"
2. 在左侧输入或粘贴需要分析的代码，或使用"上传文件"按钮上传代码文件
3. 从下拉菜单选择代码语言（默认为Python）
4. 点击"分析代码"按钮开始检测
5. 系统将在右侧显示修复后的代码，下方显示发现的漏洞列表
6. 点击任意漏洞项可高亮对应代码行
7. 点击"应用修复"按钮采纳修复方案

#### 2. 查看仪表盘

- **管理员**：访问"管理仪表盘"查看全局数据，包括所有用户的漏洞统计、分布情况和修复率
- **普通用户**：访问"个人仪表盘"查看个人数据，包括您提交代码的漏洞分析历史

#### 3. 历史记录

1. 点击导航栏的"历史记录"
2. 查看之前提交的代码分析结果
3. 点击"查看详情"复查特定分析
4. 使用筛选和排序功能查找特定记录

## 用户角色

### 管理员

- 完整的系统访问权限
- 全局仪表盘：查看所有用户的漏洞统计数据
- 系统设置：配置系统参数
- 代码分析：执行代码漏洞检测和修复

### 普通用户

- 有限的系统访问权限
- 个人仪表盘：仅查看自己的漏洞统计数据
- 代码分析：执行代码漏洞检测和修复
- 个人历史记录：查看自己的分析历史

## 常见问题

### 启动问题

**问题**：启动命令提示"ModuleNotFoundError: No module named 'src'"
**解决方案**：确保在正确的目录下执行命令，应该在`two_front/two`目录下，而不是`two_front`目录。

```bash
# 正确的命令
cd D:\Users\QuCheng\Desktop\two_front\two
uvicorn src.backend.main:app --reload --host 0.0.0.0 --port 8000
```

**问题**：PowerShell中使用`&&`连接命令报错
**解决方案**：在PowerShell中，应使用分号`;`连接命令，或者分别运行命令：

```bash
# 正确的PowerShell命令
cd D:\Users\QuCheng\Desktop\two_front\two; python -m uvicorn src.backend.main:app --reload
```

**问题**：npm run dev报错"Missing script: dev"
**解决方案**：确保在正确的目录下执行命令，且package.json中包含dev脚本

```bash
# 检查目录
cd D:\Users\QuCheng\Desktop\two_front\two

# 查看可用的npm脚本
npm run
```

### 使用问题

**问题**：API调用失败
**解决方案**：检查网络连接和API密钥配置，确保DeepSeek API密钥有效

**问题**：分析结果不准确
**解决方案**：尝试提供更多上下文或完整的代码片段，大模型需要足够的信息来准确分析

**问题**：界面显示异常
**解决方案**：尝试清除浏览器缓存或使用其他现代浏览器（Chrome/Firefox/Edge）

## 技术架构

- **前端**：React + Ant Design + Recharts + Monaco Editor
- **后端**：FastAPI + Python
- **AI模型**：DeepSeek Coder
- **数据存储**：SQLite（开发）/ PostgreSQL（生产）

## 维护与更新

### 更新前端

```bash
cd two_front/two
npm install  # 更新依赖
npm run build  # 重新构建
```

### 更新后端

```bash
cd two_front/two
pip install -r requirements.txt  # 更新依赖
```

### 备份数据

```bash
# 备份数据库（如果使用SQLite）
cp code_repair.db code_repair_backup.db
```

## 联系与支持

如有任何问题或需要技术支持，请联系：

- 邮箱：1542767141@qq.com
- 项目负责人：wuan

---

