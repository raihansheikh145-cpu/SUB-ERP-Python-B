import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import dotenv from 'dotenv';
const envFile = dotenv.config().parsed || {};

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    const supabaseUrl = envFile.VITE_SUPABASE_URL || env.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
    const supabaseKey = envFile.VITE_SUPABASE_ANON_KEY || env.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
    
    return {
      base: '/',
      server: {
        port: 5173,
        host: '0.0.0.0',
        strictPort: false,

        proxy: {
          '/api': {
            target: 'http://127.0.0.1:3000',
            changeOrigin: true
          }
        }
      },
      plugins: [react(), tailwindcss()],
      define: {
        'process.env.VITE_SUPABASE_URL': JSON.stringify(supabaseUrl),
        'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(supabaseUrl),
        'process.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(supabaseKey),
        'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(supabaseKey),
        'process.env.NEXT_PUBLIC_API_URL': JSON.stringify(env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_URL || process.env.VITE_API_URL || ''),
        'process.env.VITE_API_URL': JSON.stringify(env.VITE_API_URL || process.env.VITE_API_URL || '')
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      build: {
        outDir: 'dist',
        sourcemap: true,
        emptyOutDir: true
      }
    };
});