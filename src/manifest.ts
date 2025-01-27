// src/manifest.ts
import { defineManifest } from '@crxjs/vite-plugin';

export default defineManifest((env) => {
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
      // 既存の設定を触らずに、追加登録
      {
        resources: ['welcome/welcome.html'],
        matches: ['<all_urls>'],
      },
      // ここにテストページを追加
      {
        resources: ['test/test.html'],
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
