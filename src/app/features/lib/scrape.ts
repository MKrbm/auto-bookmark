// scrape.ts
import { parseHTML } from 'linkedom';

/**
 * HTMLエンティティをデコードし、テキストを正規化
 * - HTMLエンティティを実際の文字列に変換
 * - 改行・連続スペースを正規化
 * - 制御文字を除去
 * - 文字化け対策
 * @param text 正規化する文字列
 * @returns 正規化された文字列
 */
function cleanText(text: string): string {
  // HTMLエンティティをデコード
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = text;
  let decoded = tempDiv.textContent || tempDiv.innerText || '';
  
  // 制御文字を除去（改行とタブ以外）
  decoded = decoded.replace(/[\x00-\x09\x0B\x0C\x0E-\x1F\x7F]/g, '');
  
  // 全角スペースを半角に統一
  decoded = decoded.replace(/\u3000/g, ' ');
  
  // サロゲートペア文字を正しく処理
  decoded = Array.from(decoded).join('');
  
  // 改行・連続スペースを正規化（見出しの改行は保持）
  return decoded
    .split(/\n+/)
    .map(line => line.replace(/\s+/g, ' ').trim())
    .filter(Boolean)
    .join('\n');
}

interface Document {
  page_content: string;
  metadata: {
    url: string;
    title: string;
    userTitle: string;
  };
}

/**
 * scrapeMain
 * - Service Workerでも動作可能
 * - fetch + linkedom でHTMLを取得し、タイトルや本文を抽出
 * - 文字化け対策済み
 */
export default async function scrapeMain(
  urls: string[],
  userTitle: string
): Promise<Document[]> {
  // URLごとの処理を関数化
  const scrapeUrl = async (url: string): Promise<Document | null> => {
    try {
      // 1) fetchでHTMLを取得
      const response = await fetch(url);
      
      // Content-Typeヘッダーからエンコーディングを取得
      const contentType = response.headers.get('content-type');
      let charset = contentType?.match(/charset=([^;]+)/i)?.[1]?.toLowerCase() || 'utf-8';
      
      // Shift_JISやEUC-JPの場合はブラウザ互換の名前に変換
      if (charset === 'shift_jis' || charset === 'shift-jis' || charset === 'x-sjis') {
        charset = 'shift_jis';
      } else if (charset === 'euc-jp') {
        charset = 'euc-jp';
      }
      
      // HTMLを取得
      let html = await response.text();

      // HTMLかどうかの簡易チェック
      if (!html.trim().toLowerCase().startsWith('<!doctype html') && 
          !html.trim().toLowerCase().startsWith('<html')) {
        console.warn(`Not an HTML document: ${url}`);
        return null;
      }

      // 2) linkedomでパース
      const { window } = parseHTML(html);
      const doc = window.document;

      // 不要なタグを削除（noscriptは除外）
      const tagsToRemove = ['script', 'style', 'svg', 'iframe'];
      tagsToRemove.forEach(tag => {
        doc.querySelectorAll(tag).forEach(el => el.remove());
      });

      // 3) コンテンツを階層的に抽出
      const extractHeadingContent = (selector: string, prefix: string) => {
        const element = doc.querySelector(selector);
        return element?.textContent ? `${prefix} ${element.textContent.trim()}` : '';
      };

      // 見出しを階層的に取得
      const headings: string[] = [];
      for (let i = 1; i <= 6; i++) {
        doc.querySelectorAll(`h${i}`).forEach(heading => {
          const text = heading.textContent?.trim() || '';
          if (text) {
            headings.push(`${'#'.repeat(i)} ${text}`);
          }
        });
      }

      // メインコンテンツを取得（広告やサイドバーを除外）
      const contentSelectors = [
        // メインコンテンツのセレクタ
        '.post-content',
        'article',
        'main',
        '.entry-content',
        '.article-content',
        '#main-content',
        // フォールバックとして一般的なコンテナ
        '.container',
        '.content'
      ];

      // 除外するセレクタ
      const excludeSelectors = [
        // 広告
        '[class*="ad"]',
        '[id*="ad"]',
        '[class*="advertisement"]',
        // サイドバー
        'aside',
        '.sidebar',
        '#sidebar',
        // ナビゲーション
        'nav',
        '.navigation',
        '#navigation',
        // フッター
        'footer',
        '.footer',
        '#footer',
        // その他の不要な要素
        '.social-share',
        '.related-posts',
        '.comments',
        '.widget'
      ];

      // 除外要素を削除
      excludeSelectors.forEach(selector => {
        doc.querySelectorAll(selector).forEach(el => el.remove());
      });

      // メインコンテンツを探す
      let mainContent = '';
      for (const selector of contentSelectors) {
        const element = doc.querySelector(selector);
        if (element) {
          mainContent = element.textContent || '';
          break;
        }
      }

      // メインコンテンツが見つからない場合は、bodyから不要な要素を除いたコンテンツを使用
      const bodyContent = !mainContent ? doc.querySelector('body')?.textContent || '' : '';

      // 4) 意味のあるコンテンツが取得できた場合のみ返す
      if ((headings.length > 0 && headings.some(h => h.length > 10)) || 
          (mainContent && mainContent.length > 100) || 
          (bodyContent && bodyContent.length > 100)) {
        // 見出しとコンテンツを結合（意味のある長さのものだけ）
        const pageContent = cleanText([
          extractHeadingContent('.post-title', '#'),
          extractHeadingContent('title', '#'),
          ...headings.filter(h => h.length > 10), // 短すぎる見出しを除外
          mainContent || bodyContent
        ].filter(Boolean).join('\n'));
        
        return {
          page_content: pageContent,
          metadata: {
            url,
            title: doc.querySelector('title')?.textContent || '',
            userTitle,
          }
        };
      } else {
        console.warn(`No content found for ${url}.`);
        return null;
      }

    } catch (error) {
      console.error(`Error fetching ${url}:`, error);
      return null;
    }
  };

  // 全URLを並列処理
  const results = await Promise.all(
    urls.map(url => scrapeUrl(url))
  );

  // nullを除外して結果を返す
  const documents = results.filter((doc): doc is Document => doc !== null);
  return documents.length > 0 ? documents : [];
}
