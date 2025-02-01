import { processFetchedBookmarks } from '../app/features/lib/runnerBookmarks_new';
import { FetchedBookmark } from '../app/features/lib/fetchBookmarkTypes';

console.log('=== testRunnerFetched.ts loaded ===');


# fetchedBookmarkの戻り値を入力してテストする
const fetchedBookmarks: FetchedBookmark[] = [
  {
    userid: "u-001",
    url: "http://fnorio.com/0074trichromatism1/trichromatism1.html",
    path: {
      segments: ["Bookmarks Bar", "cameras"],
      name: "光と絵の具の三原色（色とは何か）"
    },
    searchStrings: "三原色 ライト 絵の具 色遊び"
  },
  {
    userid: "u-002",
    url: "https://www.langchain.com/",
    path: {
      segments: ["Bookmarks Bar", "misc"],
      name: "LangChain公式サイト"
    },
    searchStrings: "LangChain AI LLM"
  }
];

async function runTest() {
  try {
    const results = await processFetchedBookmarks(fetchedBookmarks);
    console.log('=== 最終結果 (fetchedBookmarks) ===');

    // chunk_vectorの先頭3要素だけを残したコピーを作成
    const shortResults = results.map((item) => ({
      ...item,
      chunk_vector: item.chunk_vector.slice(0, 3),
    }));

    console.log(JSON.stringify(shortResults, null, 2));
  } catch (err) {
    console.error('Error in processFetchedBookmarks:', err);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  runTest();
});
