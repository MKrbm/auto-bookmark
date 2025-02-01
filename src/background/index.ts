import browser from 'webextension-polyfill';
import { flattenBookmarks } from '../app/features/lib/utils';
import { FetchedBookmark } from '../app/features/lib/fetchBookmarkTypes';

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
        
        // FetchedBookmark形式に変換
        const fetchedBookmarks: FetchedBookmark[] = bookmarks.map((bookmark, index) => ({
          userid: `bookmark_${index}`,
          url: bookmark.url,
          path: {
            segments: bookmark.path.segments,
            name: bookmark.path.name
          },
          searchStrings: bookmark.searchString
        }));

        sendResponse({ 
          success: true,
          fetchedBookmarks
        });
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
