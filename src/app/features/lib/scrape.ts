// scrape.ts
import { parseHTML } from 'linkedom';

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

      // scriptタグを削除
      doc.querySelectorAll('script').forEach(script => script.remove());

      // 3) タイトルや本文を複数セレクタで試す
      const postTitle =
        doc.querySelector('.post-title')?.textContent ||
        doc.querySelector('h1')?.textContent ||
        doc.querySelector('title')?.textContent ||
        '';
      const postHeader =
        doc.querySelector('.post-header')?.textContent ||
        doc.querySelector('header')?.textContent ||
        doc.querySelector('h2')?.textContent ||
        '';
      const postContent =
        doc.querySelector('.post-content')?.textContent ||
        doc.querySelector('article')?.textContent ||
        doc.querySelector('main')?.textContent ||
        doc.querySelector('body')?.textContent ||
        '';

      // 4) テキストが取得できた場合のみ追加
      if (postTitle || postHeader || postContent) {
        const pageContent = `${postTitle}\n${postHeader}\n${postContent}`.trim();
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
