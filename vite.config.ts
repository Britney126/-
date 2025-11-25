import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    // 允许在客户端代码中使用 process.env.API_KEY
    'process.env': process.env
  }
});