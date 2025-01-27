// example_usage.ts

import { processBookmarks } from './runnerBookmarks.js';
import { Bookmark } from './runnerBookmarks.js';

(async () => {
  const bookmarks: Bookmark[] = [
    {
      id: "287",
      path: {
        segments: ["Bookmarks Bar", "cameras", "光と絵の具の三原色（色とは何か）"],
        name: "光と絵の具の三原色（色とは何か）"
      },
      url: "https://squash.or.jp/game/" // 適当なURL
    },
    {
      id: "288",
      path: {
        segments: ["Bookmarks Bar", "misc", "LangChain公式サイト"],
        name: "LangChain公式サイト"
      },
      url: "https://www.langchain.com/"
    }
    // ...他のブックマーク
  ];

  const results = await processBookmarks(bookmarks);
  console.log('=== 最終結果 ===');
  console.log(JSON.stringify(results, null, 2));
})();
