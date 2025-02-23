/**
 * 環境変数を取得するヘルパー関数
 * - テスト環境（Node.js）: process.env から取得
 * - ブラウザ環境（Vite）: import.meta.env から取得
 */
export function getOpenAIApiKey(): string {
  // 1) Node.js 環境
  if (typeof process !== 'undefined' && process.env.OPENAI_API_KEY) {
    return process.env.OPENAI_API_KEY;
  }

  // 2) ブラウザ（Vite）環境
  if (typeof import.meta !== 'undefined' && import.meta.env.VITE_OPENAI_API_KEY) {
    return import.meta.env.VITE_OPENAI_API_KEY;
  }

  // 3) 上記いずれも取得できなかったらデフォルトキー
  return "YOUR_OPENAI_API_KEY";
}
