// scrape.ts

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
   * - ブラウザ(拡張機能)でのみ使用
   * - fetch + DOMParser でHTMLを取得し、タイトルや本文を抽出
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
  
        // 2) DOMParserでパース
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
  
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
  
    return documents;
  }
  