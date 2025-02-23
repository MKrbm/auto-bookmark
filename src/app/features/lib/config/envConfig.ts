/**
 * 環境変数を取得するヘルパー関数
 * - テスト環境（Node.js）: process.env から取得
 * - ブラウザ環境（Vite）: import.meta.env から取得
 */
export function getOpenAIApiKey(): string {
  if (typeof process !== 'undefined' && process.env.OPENAI_API_KEY) {
    return process.env.OPENAI_API_KEY;
  }

  // ブラウザ環境（Vite）の場合
  if (typeof window !== 'undefined') {
    try {
      // @ts-ignore - Vite環境でのみ使用
      const viteKey = window.__VITE_OPENAI_API_KEY__;
      if (viteKey) return viteKey;
    } catch (e) {
      // 環境変数が取得できない場合は無視
    }
  }


  return "YOUR_OPENAI_API_KEY";

}
