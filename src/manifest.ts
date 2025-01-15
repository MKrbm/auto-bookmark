import { defineManifest } from '@crxjs/vite-plugin';
// If your bundler/TypeScript requires an import assertion:
// import pkg from '../package.json' assert { type: 'json' };
// const { version } = pkg;
// import { version } from '../package.json';

export default defineManifest((env) => {
  const isDev = env.mode === 'development';

  return {
    manifest_version: 3,
    name: isDev
      ? '[Dev] Browser Extension TypeScript & React Starter'
      : 'Browser Extension TypeScript & React Starter',
    description: 'Browser Extension, TypeScript, React',
    version : "1.0.0",
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
    web_accessible_resources: [
      {
        resources: ['welcome/welcome.html'],
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
