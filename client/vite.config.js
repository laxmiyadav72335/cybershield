import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// Vite config for the CyberShield client.
// The /api proxy lets the React dev server talk to the Express backend
// (server/ on port 5001; 5000 is used by macOS AirPlay) without CORS issues during local development.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: process.env.VITE_GITHUB_PAGES === 'true' ? '/cybershield/' : '/',
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5001',
        changeOrigin: true,
      },
    },
  },
});
