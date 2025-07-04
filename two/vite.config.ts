import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import * as path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(process.cwd(), 'src/frontend'), // 路径别名配置
    },
  },
  server: {
    host: '0.0.0.0', // ✨ 允许外部IP访问
    port: 3000,
    strictPort: true, // 确保端口未被占用时直接报错
    proxy: {
      '/api': {
        target: 'http://localhost:8000', // 代理到本地后端服务
        changeOrigin: true,
        secure: false,
      },
    },
  },
});