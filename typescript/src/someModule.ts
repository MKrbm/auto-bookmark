// someModule.ts
import { processBookmarks } from './runnerBookmarks.js';
import { Bookmark } from './bookmarkTypes.js';

(async () => {
  // 例: Bookmark配列を用意
  const bookmarks: Bookmark[] = [
    {
      id: "287",
      path: {
        segments: ["directoryPath1_example1", "directoryPath2_example1", "userTitle_example1"],
        name: "userTitle_example1"
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
    // ... 例はこれだけだが、本来はもっとたくさんある
  ];

  // 処理を実行
  await processBookmarks(bookmarks);
})();
