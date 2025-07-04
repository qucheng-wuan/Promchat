#!/usr/bin/env python
import os
import sys
import argparse
import subprocess
import threading
import time
import webbrowser
from pathlib import Path

# 确保当前目录在路径中
sys.path.insert(0, os.path.abspath("."))

def start_frontend():
    """启动前端开发服务器"""
    print("正在启动前端开发服务器...")
    subprocess.run(["npm", "run", "dev"], check=True)

def start_backend():
    """启动后端API服务器"""
    print("正在启动后端API服务器...")
    subprocess.run(
        ["uvicorn", "src.backend.main:app", "--reload", "--host", "0.0.0.0", "--port", "8000"], 
        check=True
    )

def setup_environment():
    """设置环境变量"""
    # 如果没有找到.env文件，创建一个示例.env文件
    env_file = Path(".env")
    if not env_file.exists():
        with open(env_file, "w") as f:
            f.write("""# 环境变量配置
OPENAI_API_KEY=your_openai_api_key_here
SECRET_KEY=your_secret_key_here
DATABASE_URL=sqlite:///./code_repair.db
""")
        print(f"已创建示例.env文件: {env_file.absolute()}")
        print("请编辑该文件并填入您的API密钥和其他配置信息。")
        return False
    return True

def install_dependencies():
    """安装依赖项"""
    print("正在检查并安装依赖项...")
    
    # 安装Python依赖
    subprocess.run([sys.executable, "-m", "pip", "install", "-r", "requirements.txt"], check=True)
    
    # 检查npm是否安装
    try:
        subprocess.run(["npm", "--version"], check=True, capture_output=True)
    except (subprocess.SubprocessError, FileNotFoundError):
        print("错误: 未找到npm。请安装Node.js和npm后再试。")
        sys.exit(1)
    
    # 安装前端依赖
    if not Path("node_modules").exists():
        print("正在安装前端依赖...")
        subprocess.run(["npm", "install"], check=True)
    
    print("依赖项安装完成。")

def main():
    """主函数"""
    parser = argparse.ArgumentParser(description="代码漏洞修复系统启动脚本")
    parser.add_argument("--frontend-only", action="store_true", help="仅启动前端")
    parser.add_argument("--backend-only", action="store_true", help="仅启动后端")
    parser.add_argument("--no-browser", action="store_true", help="不自动打开浏览器")
    parser.add_argument("--setup", action="store_true", help="设置环境并安装依赖项")
    
    args = parser.parse_args()
    
    if args.setup:
        setup_environment()
        install_dependencies()
        return
    
    # 检查环境设置
    if not setup_environment():
        print("请先设置环境变量，然后再启动应用。")
        return
    
    # 自动打开浏览器
    if not args.no_browser:
        def open_browser():
            time.sleep(3)  # 等待服务器启动
            webbrowser.open("http://localhost:3000")
        
        threading.Thread(target=open_browser).start()
    
    try:
        if args.frontend_only:
            start_frontend()
        elif args.backend_only:
            start_backend()
        else:
            # 同时启动前端和后端
            backend_thread = threading.Thread(target=start_backend)
            backend_thread.daemon = True
            backend_thread.start()
            
            start_frontend()
    except KeyboardInterrupt:
        print("\n应用已停止。")
    except Exception as e:
        print(f"启动失败: {str(e)}")

if __name__ == "__main__":
    main() 