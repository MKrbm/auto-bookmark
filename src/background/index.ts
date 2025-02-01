import browser from 'webextension-polyfill';
import scrapeMain from '../app/features/lib/scrape';
import { create_vectorsMain } from '../app/features/lib/create_vectors';
import { ChunkData } from '../app/features/lib/chunkTypes';
import { flattenBookmarks } from '../app/features/lib/utils';

// show welcome page on new install
browser.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === 'install') {
    const url = browser.runtime.getURL('welcome/welcome.html');
    await browser.tabs.create({ url });
  }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'fetchBookmarks') {
    chrome.bookmarks.getTree((bookmarkTreeNodes) => {
      sendResponse({ bookmarks: bookmarkTreeNodes });
    });
    return true;
  }

  if (request.action === 'syncBookmarks') {
    (async () => {
      try {
        // ブックマークを取得
        const bookmarkTreeNodes = await chrome.bookmarks.getTree();
        const bookmarks = flattenBookmarks(bookmarkTreeNodes);
        
        // スクレイピング実行
        const documents = await scrapeMain(
          bookmarks.map(b => b.url),
          bookmarks.map(b => b.searchString).join(' ')
        );

        // ベクトル生成
        const chunks = await create_vectorsMain(
          documents,
          'bookmarks',
          'Bookmarks Vector Data'
        );

        // チャンクデータを作成
        const chunkData: ChunkData[] = chunks.map((chunk, index) => ({
          userId: `bookmark_${index}`,
          url: documents[Math.floor(index / 2)].metadata.url, // 各documentから2チャンク程度生成される想定
          path: {
            segments: ['bookmarks'],
            name: documents[Math.floor(index / 2)].metadata.title
          },
          chunk_index: chunk.chunk_index,
          chunk_text: chunk.chunk_text,
          chunk_vector: chunk.chunk_vector
        }));

        // chrome.storage.localに保存
        await chrome.storage.local.set({ chunkData });
        
        sendResponse({ success: true });
      } catch (error: unknown) {
        console.error('Sync error:', error);
        sendResponse({ 
          success: false, 
          error: error instanceof Error ? error.message : 'Unknown error occurred' 
        });
      }
    })();
    return true;
  }
});
