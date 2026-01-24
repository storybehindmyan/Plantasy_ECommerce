import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // base: process.env.NODE_ENV === "production" ? "/" : "/Plant_Ecommers/",
  //  resolve: {
  //   extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json', '.cjs'],
  //   alias: { '@firebase/auth': 'node_modules/@firebase/auth/dist/esm2017/index.js' }, // If needed
  // },
  optimizeDeps: { include: ['firebase/auth'] },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
});



