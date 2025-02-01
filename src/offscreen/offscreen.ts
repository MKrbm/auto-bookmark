interface Document {
  page_content: string;
  metadata: {
    url: string;
    title: string;
    userTitle: string;
  };
}

interface ScrapeMessage {
  type: 'SCRAPE_PAGE';
  data: {
    url: string;
    html: string;
    userTitle: string;
  };
}

// メッセージハンドラーを設定
chrome.runtime.onMessage.addListener((message: ScrapeMessage, sender, sendResponse) => {
  if (message.type === 'SCRAPE_PAGE') {
    const { html, url, userTitle } = message.data;
    
    try {
      // DOMParserでパース
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');

      // タイトルや本文を複数セレクタで試す
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

      // テキストが取得できた場合のみ結果を返す
      if (postTitle || postHeader || postContent) {
        const pageContent = `${postTitle}\n${postHeader}\n${postContent}`.trim();
        const metadata = {
          url,
          title: doc.querySelector('title')?.textContent || '',
          userTitle,
        };
        
        sendResponse({ success: true, document: { page_content: pageContent, metadata } });
      } else {
        sendResponse({ success: false, error: `No content found for ${url}.` });
      }
    } catch (error) {
      sendResponse({ success: false, error: `Error parsing ${url}: ${error}` });
    }
    
    return true; // 非同期レスポンスを示す
  }
});

// オフスクリーンドキュメントが準備できたことを通知
chrome.runtime.sendMessage({ type: 'OFFSCREEN_READY' });
