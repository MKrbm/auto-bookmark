// src/test/testRunner.ts

import { processBookmarks } from '../app/features/lib/runnerBookmarks';
import { Bookmark } from '../app/features/lib/bookmarkTypes';

console.log('=== testRunner.ts loaded ===');

// example_usage.ts と同じロジック
const bookmarks: Bookmark[] = [
  {
    id: "287",
    path: {
      segments: ["Bookmarks Bar", "cameras", "光と絵の具の三原色（色とは何か）"],
      name: "光と絵の具の三原色（色とは何か）"
    },
    url: "https://squash.or.jp/game/"
  },
  {
    id: "288",
    path: {
      segments: ["Bookmarks Bar", "misc", "LangChain公式サイト"],
      name: "LangChain公式サイト"
    },
    url: "https://www.langchain.com/"
  }
];

async function runTest() {
  try {
    const results = await processBookmarks(bookmarks);
    console.log('=== 最終結果 ===');
    console.log(JSON.stringify(results, null, 2));
  } catch (err) {
    console.error('Error in processBookmarks:', err);
  }
}

// ページ読み込み完了後に実行
document.addEventListener('DOMContentLoaded', () => {
  runTest();
});
