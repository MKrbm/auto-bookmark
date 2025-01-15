import { crx, defineManifest } from "@crxjs/vite-plugin";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { resolve, join } from "path";

// const manifest = defineManifest({
//     manifest_version: 3,
//     name: "Open Bookmarks",
//     version: "1.0.0",
//     permissions: ["bookmarks"],
//     action: {
//         default_popup: "popup.html",
//     },
// });

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
            // If you’re using ES modules in background/index.ts, you typically need:
            type: 'module',
        },
        host_permissions: ['<all_urls>'],
        options_ui: {
            page: 'options/options.html',
            open_in_tab: true,
        },
        // The web_accessible_resources field specifies which resources in the extension can be accessed by web pages.
        // In this case, the welcome.html file in the welcome directory is accessible to all URLs.
        web_accessible_resources: [
            {
                resources: ['welcome/welcome.html', 'popup/popup.html', 'options/options.html'],
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
        // Uncomment if you have content scripts:
        // content_scripts: [
        //   {
        //     matches: ['http://*/*', 'https://*/*', 'file:///*'],
        //     js: ['content/index.tsx'],
        //   },
        // ],
    };
});

export default defineConfig({
    root: resolve(__dirname, 'src'),
    publicDir: resolve(__dirname, 'public'),
    // build: {
    //     outDir: resolve(__dirname, 'dist'),
    //     rollupOptions: {
    //         input: {
    //             // see web_accessible_resources in the manifest config
    //             welcome: join(__dirname, 'src/welcome/welcome.html'),
    //         },
    //         output: {
    //             chunkFileNames: 'assets/chunk-[hash].js',
    //         },
    //     },
    // },
    plugins: [react(), crx({ manifest })],
});