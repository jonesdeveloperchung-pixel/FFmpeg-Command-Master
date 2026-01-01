import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import electron from 'vite-plugin-electron';
import renderer from 'vite-plugin-electron-renderer';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      base: './',
      server: {
        port: 3000,
        host: '0.0.0.0',
        proxy: {
          '/ollama': {
            target: 'http://192.168.16.120:11434',
            changeOrigin: true,
            rewrite: (path) => path.replace(/^\/ollama/, ''),
          },
          '/ollama-90': {
            target: 'http://192.168.16.90:11434',
            changeOrigin: true,
            rewrite: (path) => path.replace(/^\/ollama-90/, ''),
          },
          '/ollama-110': {
            target: 'http://192.168.16.110:11434',
            changeOrigin: true,
            rewrite: (path) => path.replace(/^\/ollama-110/, ''),
          }
        }
      },
      plugins: [
        react(),
        tailwindcss(),
        electron([
          {
            // Main-Process entry file of the Electron App.
            entry: 'electron/main.ts',
            vite: {
              build: {
                outDir: 'dist-electron',
                rollupOptions: {
                  external: ['better-sqlite3'],
                  output: {
                    entryFileNames: '[name].mjs',
                    format: 'esm',
                  },
                },
              },
              optimizeDeps: {
                exclude: ['better-sqlite3'],
              },
            },
          },
          {
            entry: 'electron/preload.ts',
            onstart(options) {
              // Notify the Renderer-Process to reload the page when the Preload-Scripts build is complete, 
              // instead of restarting the entire Electron App.
              options.reload();
            },
            vite: {
              build: {
                outDir: 'dist-electron',
                rollupOptions: {
                  output: {
                    entryFileNames: '[name].mjs',
                    format: 'cjs',
                  },
                },
              },
            },
          },
        ]),
        renderer(),
      ],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});