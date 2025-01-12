// example_usage.ts
import { processBookmarks } from './runnerBookmarks.js';
(async () => {
    const bookmarks = [
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
        // ... 他Bookmark
    ];
    await processBookmarks(bookmarks);
})();
