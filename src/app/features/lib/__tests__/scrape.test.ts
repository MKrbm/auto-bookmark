import { describe, expect, test, beforeEach } from '@jest/globals';
import scrapeMain from '../scrape';

describe('scrapeMain', () => {
  beforeEach(() => {
    // 各テストの前にモックをリセット
    (global.fetch as jest.Mock).mockReset();
  });

  // フェッチエラーのテスト
  test('フェッチに失敗した場合', async () => {
    (global.fetch as jest.Mock).mockImplementationOnce(() =>
      Promise.resolve({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      })
    );

    const result = await scrapeMain(['http://example.com/error'], 'Error Page');
    expect(result).toHaveLength(0);
  });

  // ネットワークエラーのテスト
  test('ネットワークエラーの場合', async () => {
    (global.fetch as jest.Mock).mockImplementationOnce(() =>
      Promise.reject(new Error('Network error'))
    );

    const result = await scrapeMain(['http://example.com/network-error'], 'Network Error Page');
    expect(result).toHaveLength(0);
  });

  // 静的サイトのテスト
  test('静的サイトのスクレイピング', async () => {
    const mockStaticHTML = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>静的サイトのテスト</title>
        </head>
        <body>
          <h1>メインタイトル</h1>
          <p>これは段落1です。重要な情報を含んでいます。</p>
          <h2>サブセクション</h2>
          <p>これは段落2です。追加の詳細情報です。</p>
        </body>
      </html>
    `;

    // fetchのモックを設定
    (global.fetch as jest.Mock).mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        text: () => Promise.resolve(mockStaticHTML),
        status: 200,
      } as Response)
    );

    const result = await scrapeMain(['http://example.com/static'], 'Static Page');
    expect(result[0].page_content).toContain('メインタイトル');
    expect(result[0].page_content).toContain('これは段落1です');
    expect(result[0].metadata.title).toBe('静的サイトのテスト');
  });

  // WordPress系サイトのテスト
  test('WordPress系サイトのスクレイピング', async () => {
    const mockWordPressHTML = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>WordPressブログ記事</title>
          <meta name="description" content="ブログの説明文です">
        </head>
        <body>
          <header>
            <h1 class="entry-title">ブログ記事のタイトル</h1>
          </header>
          <article class="post-content">
            <p>これはブログ記事の本文です。</p>
            <p>WordPressの一般的なコンテンツ構造を模しています。</p>
          </article>
          <aside>
            <div class="widget">
              <h3>サイドバー</h3>
              <p>この部分は無視されるべき情報です。</p>
            </div>
          </aside>
        </body>
      </html>
    `;

    // fetchのモックを設定
    (global.fetch as jest.Mock).mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        text: () => Promise.resolve(mockWordPressHTML),
        status: 200,
      } as Response)
    );

    const result = await scrapeMain(['http://example.com/wordpress'], 'WordPress Page');
    expect(result[0].page_content).toContain('ブログ記事のタイトル');
    expect(result[0].page_content).toContain('ブログ記事の本文です');
    expect(result[0].page_content).not.toContain('サイドバー');
    expect(result[0].metadata.title).toBe('WordPressブログ記事');
  });

  // SPAのテスト
  test('SPAサイトのスクレイピング', async () => {
    const mockSPAHTML = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>SPA Site</title>
        </head>
        <body>
          <div id="app">
            <!-- 初期状態では空 -->
          </div>
          <script>
            // 動的にコンテンツを生成
            window.onload = () => {
              const app = document.getElementById('app');
              app.innerHTML = \`
                <h1>動的に生成されたタイトル</h1>
                <p>これは JavaScript で動的に生成されたコンテンツです。</p>
              \`;
            };
          </script>
        </body>
      </html>
    `;

    // fetchのモックを設定
    (global.fetch as jest.Mock).mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        text: () => Promise.resolve(mockSPAHTML),
        status: 200,
      } as Response)
    );

    const result = await scrapeMain(['http://example.com/spa'], 'SPA Page');
    // linkedomの制限により、動的コンテンツは取得できない
    expect(result[0].page_content).not.toContain('動的に生成されたタイトル');
    expect(result[0].metadata.title).toBe('SPA Site');
  });

  // エラーケースのテスト
  test('404エラーページのスクレイピング', async () => {
    const mock404HTML = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>404 Not Found</title>
        </head>
        <body>
          <h1>404 Not Found</h1>
          <p>The requested page could not be found.</p>
        </body>
      </html>
    `;

    // fetchのモックを設定
    (global.fetch as jest.Mock).mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        text: () => Promise.resolve(mock404HTML),
        status: 200,
      } as Response)
    );

    const result = await scrapeMain(['http://example.com/404'], '404 Page');
    expect(result[0].page_content).toContain('404 Not Found');
    expect(result[0].metadata.title).toBe('404 Not Found');
  });

  test('HTMLではないコンテンツのスクレイピング', async () => {
    const mockPDFContent = '%PDF-1.7\n...'; // PDFのバイナリデータを想定

    // fetchのモックを設定
    (global.fetch as jest.Mock).mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        text: () => Promise.resolve(mockPDFContent),
        status: 200,
      } as Response)
    );

    const result = await scrapeMain(['http://example.com/document.pdf'], 'PDF Document');
    // PDFコンテンツは適切にハンドリングされるべき
    expect(result).toHaveLength(0);
  });

  // 実在するサイトのテスト
  test('実在するWordPressサイトのスクレイピング', async () => {
    const mockRealWordPressHTML = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Tech Blog | 最新の技術情報</title>
          <meta name="description" content="技術情報を発信するブログです">
        </head>
        <body>
          <div id="wrapper">
            <header class="site-header">
              <h1 class="site-title">Tech Blog</h1>
            </header>
            <main class="site-main">
              <article class="post-123 post type-post">
                <header class="entry-header">
                  <h1 class="entry-title">TypeScriptの新機能解説</h1>
                  <div class="entry-meta">
                    <span class="posted-on">2024-01-15</span>
                  </div>
                </header>
                <div class="entry-content">
                  <p>TypeScript 5.0で導入された新機能について解説します。</p>
                  <h2>1. const Type Parameters</h2>
                  <p>const type parametersを使用することで、より厳密な型チェックが可能になりました。</p>
                  <pre><code>function process<const T extends string[]>(arr: T) {}</code></pre>
                </div>
                <footer class="entry-footer">
                  <span class="cat-links">カテゴリー: TypeScript</span>
                  <span class="tags-links">タグ: プログラミング, 開発</span>
                </footer>
              </article>
            </main>
            <aside class="widget-area">
              <section class="widget">
                <h2 class="widget-title">最新の投稿</h2>
                <ul>
                  <li><a href="#">記事1</a></li>
                  <li><a href="#">記事2</a></li>
                </ul>
              </section>
            </aside>
          </div>
        </body>
      </html>
    `;

    // fetchのモックを設定
    (global.fetch as jest.Mock).mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        text: () => Promise.resolve(mockRealWordPressHTML),
        status: 200,
      } as Response)
    );

    const result = await scrapeMain(['http://example.com/tech-blog'], 'Tech Blog');
    
    // メインコンテンツが含まれていることを確認
    expect(result[0].page_content).toContain('TypeScriptの新機能解説');
    expect(result[0].page_content).toContain('TypeScript 5.0で導入された新機能について解説します');
    expect(result[0].page_content).toContain('const type parameters');
    
    // サイドバーのコンテンツは含まれていないことを確認
    expect(result[0].page_content).not.toContain('最新の投稿');
    expect(result[0].page_content).not.toContain('記事1');
    
    // メタデータの確認
    expect(result[0].metadata.title).toBe('Tech Blog | 最新の技術情報');
    expect(result[0].metadata.userTitle).toBe('Tech Blog');
  });

  test('実在するドキュメントサイトのスクレイピング', async () => {
    const mockDocsHTML = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>API Documentation</title>
          <meta name="description" content="Official API documentation">
        </head>
        <body>
          <nav class="sidebar">
            <ul>
              <li><a href="#intro">Introduction</a></li>
              <li><a href="#api">API Reference</a></li>
            </ul>
          </nav>
          <main class="content">
            <section id="intro">
              <h1>Introduction</h1>
              <p>Welcome to the API documentation. This guide will help you understand how to use our API effectively.</p>
            </section>
            <section id="api">
              <h2>API Reference</h2>
              <div class="endpoint">
                <h3>GET /api/v1/users</h3>
                <p>Returns a list of users.</p>
                <pre><code>
                  {
                    "users": [
                      { "id": 1, "name": "John" }
                    ]
                  }
                </code></pre>
              </div>
            </section>
          </main>
        </body>
      </html>
    `;

    // fetchのモックを設定
    (global.fetch as jest.Mock).mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        text: () => Promise.resolve(mockDocsHTML),
        status: 200,
      } as Response)
    );

    const result = await scrapeMain(['http://example.com/docs'], 'API Docs');
    
    // メインコンテンツが含まれていることを確認
    expect(result[0].page_content).toContain('Welcome to the API documentation');
    expect(result[0].page_content).toContain('GET /api/v1/users');
    expect(result[0].page_content).toContain('Returns a list of users');
    
    // サイドバーのナビゲーションは含まれていないことを確認
    expect(result[0].page_content).not.toMatch(/Introduction.*API Reference/);
    
    // メタデータの確認
    expect(result[0].metadata.title).toBe('API Documentation');
    expect(result[0].metadata.userTitle).toBe('API Docs');
  });
});
