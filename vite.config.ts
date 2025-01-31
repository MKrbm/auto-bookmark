import { crx, defineManifest } from "@crxjs/vite-plugin";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { resolve, join } from "path";
import dotenv from 'dotenv';
dotenv.config();

const manifest = defineManifest((env) => {
    const isDev = env.mode === 'development';

    return {
        manifest_version: 3,
        name: isDev
            ? '[Dev] Browser Extension TypeScript & React Starter'
            : 'Browser Extension TypeScript & React Starter',
        description: 'Browser Extension, TypeScript, React',
        version: '1.0.0',
        background: {
            service_worker: 'background/index.ts',
            type: 'module',
        },
        host_permissions: ['<all_urls>'],
        options_ui: {
            page: 'options/options.html',
            open_in_tab: true,
        },
        web_accessible_resources: [
            {
                resources: [
                    'welcome/welcome.html',
                    'popup/popup.html',
                    'options/options.html',
                    'test/test.html'
                ],
                matches: ['<all_urls>'],
            },
        ],
        action: {
            default_popup: 'popup/popup.html',
            default_icon: {
                '16': 'images/extension_16.png',
                '32': 'images/extension_32.png',
                '48': 'images/extension_48.png',
                '128': 'images/extension_128.png',
            },
        },
        icons: {
            '16': 'images/extension_16.png',
            '32': 'images/extension_32.png',
            '48': 'images/extension_48.png',
            '128': 'images/extension_128.png',
        },
        permissions: ['storage', 'tabs', 'bookmarks'],
    };
});

export default defineConfig({
    root: resolve(__dirname, 'src'),
    publicDir: resolve(__dirname, 'public'),
    
    server: {
        hmr: false  // HMRを無効化
    },

    build: {
        outDir: resolve(__dirname, 'dist'),
        rollupOptions: {
            input: {
                welcome: join(__dirname, 'src/welcome/welcome.html'),
                test: join(__dirname, 'src/test/test.html'),
            },
            output: {
                chunkFileNames: 'assets/chunk-[hash].js',
            },
        },
    },
    plugins: [react(), crx({ manifest })],
});
