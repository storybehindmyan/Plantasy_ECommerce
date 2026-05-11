import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'admin-spa-fallback',
      configureServer(server) {
        server.middlewares.use((req, _res, next) => {
          if (
            req.url?.startsWith('/Admin-plantasy/') &&
            !req.url.includes('.')
          ) {
            req.url = '/Admin-plantasy/index.html';
          }
          next();
        });
      },
    },
  ],
  define: {
    global: 'globalThis',
  },
  server: {
    host: '0.0.0.0',
    port: 5000,
    strictPort: true,
    allowedHosts: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
    watch: {
      ignored: ['**/server/**'],
    },
  },
  optimizeDeps: {
    entries: [
      path.resolve(__dirname, 'index.html'),
      path.resolve(__dirname, 'Admin-plantasy/index.html'),
    ],
  },
  build: {
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html'),
        admin: path.resolve(__dirname, 'Admin-plantasy/index.html'),
      },
    },
    target: 'esnext',
    cssTarget: 'chrome80',
    commonjsOptions: {
      include: [/node_modules/],
      transformMixedEsModules: true,
    },
  },
  resolve: {
    extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json', '.cjs'],
    alias: {
      '@': path.resolve(__dirname, 'Admin-plantasy/src'),
      'virtual:admin-root': path.resolve(
        __dirname,
        'Admin-plantasy/src/AdminRoot.tsx'
      ),
    },
  },
});
