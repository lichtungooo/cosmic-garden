import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

const rls = path.resolve(__dirname, '../real-life-stack/packages');
const wot = path.resolve(__dirname, '../web-of-trust/packages');

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: [
      { find: '@real-life-stack/data-interface/demo-data', replacement: path.join(rls, 'data-interface/src/demo-data.ts') },
      { find: '@real-life-stack/data-interface', replacement: path.join(rls, 'data-interface/src/index.ts') },
      { find: '@real-life-stack/toolkit/styles/globals.css', replacement: path.join(rls, 'toolkit/src/styles/globals.css') },
      { find: '@real-life-stack/toolkit/lib/image-utils', replacement: path.join(rls, 'toolkit/src/lib/image-utils.ts') },
      { find: '@real-life-stack/toolkit', replacement: path.join(rls, 'toolkit/src/index.ts') },
      { find: '@real-life-stack/wot-connector/components', replacement: path.join(rls, 'wot-connector/src/components/index.ts') },
      { find: '@real-life-stack/wot-connector', replacement: path.join(rls, 'wot-connector/src/index.ts') },
      { find: '@web_of_trust/adapter-yjs', replacement: path.join(wot, 'adapter-yjs/src/index.ts') },
      { find: '@web_of_trust/core', replacement: path.join(wot, 'wot-core/src/index.ts') },
      { find: '@real-life/adapter-yjs', replacement: path.join(wot, 'adapter-yjs/src/index.ts') },
      { find: '@real-life/wot-core', replacement: path.join(wot, 'wot-core/src/index.ts') },
      { find: /^@\//, replacement: path.join(rls, 'toolkit/src') + '/' },
      // Eine React-Instanz erzwingen
      { find: 'react', replacement: path.resolve(__dirname, 'node_modules/react') },
      { find: 'react-dom', replacement: path.resolve(__dirname, 'node_modules/react-dom') },
      { find: 'react/jsx-runtime', replacement: path.resolve(__dirname, 'node_modules/react/jsx-runtime') },
      { find: 'react/jsx-dev-runtime', replacement: path.resolve(__dirname, 'node_modules/react/jsx-dev-runtime') },
    ],
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'lucide-react'],
  },
  build: {
    chunkSizeWarningLimit: 1200,
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (/node_modules\/react\//.test(id) || /node_modules\/react-dom\//.test(id)) {
            return 'vendor-react';
          }
          if (id.includes('node_modules/yjs') || id.includes('node_modules/y-')) {
            return 'vendor-yjs';
          }
          if (id.includes('node_modules/@noble') || id.includes('node_modules/@scure')) {
            return 'vendor-crypto';
          }
          if (id.includes('wot-connector') || id.includes('wot-core') || id.includes('adapter-yjs')) {
            return 'vendor-wot';
          }
          if (id.includes('node_modules/@radix-ui') || id.includes('node_modules/@tiptap')) {
            return 'vendor-ui';
          }
        },
      },
    },
  },
  server: {
    port: 5180,
    strictPort: true,
    fs: {
      // Sibling-Repos (real-life-stack, web-of-trust) liegen ausserhalb des
      // Garten-Roots — Vite muss sie explizit zulassen.
      allow: [
        path.resolve(__dirname),
        path.resolve(__dirname, '../real-life-stack'),
        path.resolve(__dirname, '../web-of-trust'),
      ],
    },
  },
});
