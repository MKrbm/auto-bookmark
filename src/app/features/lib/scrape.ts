// scrape.ts
import { parseHTML } from 'linkedom';

/**
 * HTMLエンティティをデコードし、テキストを正規化
 * - HTMLエンティティを実際の文字列に変換
 * - 改行・連続スペースを正規化
 * @param text 正規化する文字列
 * @returns 正規化された文字列
 */
function cleanText(text: string): string {
  // HTMLエンティティをデコード
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = text;
  const decoded = tempDiv.textContent || tempDiv.innerText || '';
  
  // 改行・連続スペースを正規化（見出しの改行は保持）
  return decoded
    .split(/\n+/)
    .map(line => line.replace(/\s+/g, ' ').trim())
    .filter(Boolean)
    .join('\n');
}

// Document型は変えずに利用
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
 */
export default async function scrapeMain(
  urls: string[],
  userTitle: string
): Promise<Document[]> {
  const documents: Document[] = [];

  for (const url of urls) {
    try {
      // 1) fetchでHTMLを取得
      const response = await fetch(url);
      const html = await response.text();

      // HTMLかどうかの簡易チェック
      if (!html.trim().toLowerCase().startsWith('<!doctype html') && 
          !html.trim().toLowerCase().startsWith('<html')) {
        console.warn(`Not an HTML document: ${url}`);
        continue;
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

      // メインコンテンツを取得
      const mainContent = 
        doc.querySelector('.post-content')?.textContent ||
        doc.querySelector('article')?.textContent ||
        doc.querySelector('main')?.textContent ||
        '';

      // フォールバックとしてbodyを使用
      const bodyContent = !mainContent ? doc.querySelector('body')?.textContent || '' : '';

      // 4) テキストが取得できた場合のみ追加
      if (headings.length > 0 || mainContent || bodyContent) {
        // 見出しとコンテンツを結合
        const pageContent = cleanText([
          extractHeadingContent('.post-title', '#'),
          extractHeadingContent('title', '#'),
          ...headings,
          mainContent || bodyContent
        ].filter(Boolean).join('\n'));
        const metadata = {
          url,
          title: doc.querySelector('title')?.textContent || '',
          userTitle,
        };
        documents.push({ page_content: pageContent, metadata });
      } else {
        console.warn(`No content found for ${url}.`);
      }

    } catch (error) {
      console.error(`Error fetching ${url}:`, error);
    }
  }

  // エラーがあった場合や結果が空の場合は空配列を返す
  return documents.length > 0 ? documents : [];
}
