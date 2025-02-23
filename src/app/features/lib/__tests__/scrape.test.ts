import { describe, expect, test, beforeEach } from '@jest/globals';
import scrapeMain from '../scrape';
import { TextEncoder } from 'util';

describe('scrapeMain', () => {
  beforeEach(() => {
    // 各テストの前にモックをリセット
    (global.fetch as jest.Mock).mockReset();
  });

  // 日本語エンコーディングのテスト
  test('Shift_JISエンコーディングのサイト', async () => {
    // テスト用のHTMLを文字列として定義
    const htmlString = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>日本語のページ</title>
          <meta charset="shift_jis">
        </head>
        <body>
          <article>
            <h1>重要な技術情報</h1>
            <p>これは日本語で書かれた技術記事です。Shift_JISでエンコードされています。プログラミング言語やフレームワークについての詳細な解説を含んでいます。特に、Webアプリケーション開発における重要な概念について説明しています。</p>
          </article>
        </body>
      </html>
    `;

    // Uint8Array形式でデータを作成
    const encoder = new TextEncoder();
    const htmlData = encoder.encode(htmlString);

    // fetchのモックを設定
    (global.fetch as jest.Mock).mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        arrayBuffer: () => Promise.resolve(htmlData.buffer),
        headers: new Headers({
          'content-type': 'text/html; charset=shift_jis'
        }),
        status: 200,
        statusText: 'OK',
        redirected: false,
        type: 'basic',
        url: 'http://example.jp/article',
        body: null,
        bodyUsed: false,
        clone: () => ({ } as Response),
        text: () => Promise.resolve(htmlString),
        json: () => Promise.reject(new Error('Not JSON')),
        blob: () => Promise.reject(new Error('Not implemented')),
        formData: () => Promise.reject(new Error('Not implemented')),
      } as Response)
    );

    const result = await scrapeMain(['http://example.jp/article'], 'Japanese Article');
    
    // 日本語コンテンツが正しく抽出されていることを確認
    expect(result[0].page_content).toContain('重要な技術情報');
    expect(result[0].page_content).toContain('日本語で書かれた技術記事');
    expect(result[0].page_content).not.toContain('�');
  });

  test('EUC-JPエンコーディングのサイト', async () => {
    const htmlString = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>EUC-JPのページ</title>
          <meta charset="euc-jp">
        </head>
        <body>
          <main>
            <h1>日本語のコンテンツ</h1>
            <p>これはEUC-JPでエンコードされた日本語の記事です。文字化けせずに正しく表示される必要があります。技術的な内容を含む長めの文章で、プログラミングやソフトウェア開発に関する情報を提供しています。</p>
          </main>
        </body>
      </html>
    `;

    const encoder = new TextEncoder();
    const htmlData = encoder.encode(htmlString);

    // fetchのモックを設定
    (global.fetch as jest.Mock).mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        arrayBuffer: () => Promise.resolve(htmlData.buffer),
        headers: new Headers({
          'content-type': 'text/html; charset=euc-jp'
        }),
        status: 200,
        statusText: 'OK',
        redirected: false,
        type: 'basic',
        url: 'http://example.jp/euc',
        body: null,
        bodyUsed: false,
        clone: () => ({ } as Response),
        text: () => Promise.resolve(htmlString),
        json: () => Promise.reject(new Error('Not JSON')),
        blob: () => Promise.reject(new Error('Not implemented')),
        formData: () => Promise.reject(new Error('Not implemented')),
      } as Response)
    );

    const result = await scrapeMain(['http://example.jp/euc'], 'EUC-JP Article');
    
    // 日本語コンテンツが正しく抽出されていることを確認
    expect(result[0].page_content).toContain('日本語のコンテンツ');
    expect(result[0].page_content).toContain('EUC-JPでエンコードされた');
    expect(result[0].page_content).not.toContain('�');
  });

  // 広告とサイドバーの除外テスト
  test('広告とサイドバーを除外したコンテンツ抽出', async () => {
    const htmlString = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>テストページ</title>
        </head>
        <body>
          <main class="main-content">
            <h1>メインコンテンツ</h1>
            <p>これは重要な本文です。200文字以上の意味のある内容を含んでいます。TypeScriptは、JavaScriptに静的型付けを追加したプログラミング言語です。型システムにより、開発時のエラー検出が容易になり、コードの品質と保守性が向上します。また、最新のECMAScript機能もサポートしており、モダンな開発手法を実践できます。</p>
          </main>
          <aside class="sidebar">
            <div class="widget">
              <h3>関連記事</h3>
              <ul>
                <li>記事1</li>
                <li>記事2</li>
              </ul>
            </div>
          </aside>
          <div class="advertisement">
            <p>広告コンテンツ</p>
          </div>
          <div id="ad-banner">
            <p>バナー広告</p>
          </div>
          <nav class="navigation">
            <ul>
              <li>ホーム</li>
              <li>about</li>
            </ul>
          </nav>
        </body>
      </html>
    `;

    const encoder = new TextEncoder();
    const htmlData = encoder.encode(htmlString);

    // fetchのモックを設定
    (global.fetch as jest.Mock).mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        arrayBuffer: () => Promise.resolve(htmlData.buffer),
        headers: new Headers({
          'content-type': 'text/html; charset=utf-8'
        }),
        status: 200,
        statusText: 'OK',
        redirected: false,
        type: 'basic',
        url: 'http://example.com/test',
        body: null,
        bodyUsed: false,
        clone: () => ({ } as Response),
        text: () => Promise.resolve(htmlString),
        json: () => Promise.reject(new Error('Not JSON')),
        blob: () => Promise.reject(new Error('Not implemented')),
        formData: () => Promise.reject(new Error('Not implemented')),
      } as Response)
    );

    const result = await scrapeMain(['http://example.com/test'], 'Test Page');
    
    // メインコンテンツが含まれていることを確認
    expect(result[0].page_content).toContain('メインコンテンツ');
    expect(result[0].page_content).toContain('TypeScriptは、JavaScriptに静的型付けを追加した');
    
    // 広告が除外されていることを確認
    expect(result[0].page_content).not.toContain('広告コンテンツ');
    expect(result[0].page_content).not.toContain('バナー広告');
    
    // サイドバーが除外されていることを確認
    expect(result[0].page_content).not.toContain('関連記事');
    expect(result[0].page_content).not.toContain('記事1');
    
    // ナビゲーションが除外されていることを確認
    expect(result[0].page_content).not.toContain('ホーム');
    expect(result[0].page_content).not.toContain('about');
  });

  // 短すぎるコンテンツの除外テスト
  test('短すぎるコンテンツの除外', async () => {
    const htmlString = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>短いコンテンツ</title>
        </head>
        <body>
          <main>
            <h1>短い見出し</h1>
            <p>これは短すぎる本文です。</p>
          </main>
        </body>
      </html>
    `;

    const encoder = new TextEncoder();
    const htmlData = encoder.encode(htmlString);

    // fetchのモックを設定
    (global.fetch as jest.Mock).mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        arrayBuffer: () => Promise.resolve(htmlData.buffer),
        headers: new Headers({
          'content-type': 'text/html; charset=utf-8'
        }),
        status: 200,
        statusText: 'OK',
        redirected: false,
        type: 'basic',
        url: 'http://example.com/short',
        body: null,
        bodyUsed: false,
        clone: () => ({ } as Response),
        text: () => Promise.resolve(htmlString),
        json: () => Promise.reject(new Error('Not JSON')),
        blob: () => Promise.reject(new Error('Not implemented')),
        formData: () => Promise.reject(new Error('Not implemented')),
      } as Response)
    );

    const result = await scrapeMain(['http://example.com/short'], 'Short Content');
    
    // 短すぎるコンテンツは除外されるため、結果は空になる
    expect(result).toHaveLength(0);
  });

  // フェッチエラーのテスト
  test('フェッチに失敗した場合', async () => {
    (global.fetch as jest.Mock).mockImplementationOnce(() =>
      Promise.resolve({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        redirected: false,
        type: 'error',
        url: 'http://example.com/error',
        body: null,
        bodyUsed: false,
        headers: new Headers(),
        clone: () => ({ } as Response),
        arrayBuffer: () => Promise.reject(new Error('Server Error')),
        text: () => Promise.reject(new Error('Server Error')),
        json: () => Promise.reject(new Error('Server Error')),
        blob: () => Promise.reject(new Error('Server Error')),
        formData: () => Promise.reject(new Error('Server Error')),
      } as Response)
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

  // HTMLではないコンテンツのテスト
  test('HTMLではないコンテンツのスクレイピング', async () => {
    const pdfContent = '%PDF-1.7\n...'; // PDFのバイナリデータを想定
    const encoder = new TextEncoder();
    const pdfData = encoder.encode(pdfContent);

    // fetchのモックを設定
    (global.fetch as jest.Mock).mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        arrayBuffer: () => Promise.resolve(pdfData.buffer),
        headers: new Headers({
          'content-type': 'application/pdf'
        }),
        status: 200,
        statusText: 'OK',
        redirected: false,
        type: 'basic',
        url: 'http://example.com/document.pdf',
        body: null,
        bodyUsed: false,
        clone: () => ({ } as Response),
        text: () => Promise.resolve(pdfContent),
        json: () => Promise.reject(new Error('Not JSON')),
        blob: () => Promise.reject(new Error('Not implemented')),
        formData: () => Promise.reject(new Error('Not implemented')),
      } as Response)
    );

    const result = await scrapeMain(['http://example.com/document.pdf'], 'PDF Document');
    expect(result).toHaveLength(0);
  });

  // 実在するサイトのテスト
  test('実在するWordPressサイトのスクレイピング', async () => {
    const htmlString = `
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
                  <p>TypeScript 5.0で導入された新機能について解説します。この記事では、型システムの改善点や、開発者の生産性を向上させる新しい機能について詳しく説明します。特に、const type parametersやデコレータの改善など、注目すべき変更点を重点的に取り上げます。</p>
                  <h2>1. const Type Parameters</h2>
                  <p>const type parametersを使用することで、より厳密な型チェックが可能になりました。これにより、タプルや配列の型推論が改善され、より安全なコードが書けるようになります。</p>
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

    const encoder = new TextEncoder();
    const htmlData = encoder.encode(htmlString);

    // fetchのモックを設定
    (global.fetch as jest.Mock).mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        arrayBuffer: () => Promise.resolve(htmlData.buffer),
        headers: new Headers({
          'content-type': 'text/html; charset=utf-8'
        }),
        status: 200,
        statusText: 'OK',
        redirected: false,
        type: 'basic',
        url: 'http://example.com/tech-blog',
        body: null,
        bodyUsed: false,
        clone: () => ({ } as Response),
        text: () => Promise.resolve(htmlString),
        json: () => Promise.reject(new Error('Not JSON')),
        blob: () => Promise.reject(new Error('Not implemented')),
        formData: () => Promise.reject(new Error('Not implemented')),
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
});
