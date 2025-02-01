import { processFetchedBookmarks } from '../app/features/lib/runnerBookmarks_new';
import { FetchedBookmark } from '../app/features/lib/fetchBookmarkTypes';
import { aiSearchRepresentative } from '../app/features/search/aiSearchRepresentative';

console.log('=== testRunnerFetched.ts loaded ===');



// fetchBookmarkの戻り値を想定したテストデータ
const fetchedBookmarks: FetchedBookmark[] = [
  {
    userid: "u-001",
    url: "http://fnorio.com/0074trichromatism1/trichromatism1.html",
    path: {
      segments: ["Bookmarks Bar", "cameras"],
      name: "光と絵の具の三原色（色とは何か）"
    },
    searchStrings: "三原色 ライト 絵の具 色遊び 物理学 光の性質"
  },
  {
    userid: "u-002",
    url: "https://www.langchain.com/",
    path: {
      segments: ["Bookmarks Bar", "misc"],
      name: "LangChain公式サイト"
    },
    searchStrings: "LangChain AI LLM"
  },
  {
    userid: "u-003",
    url: "https://docs.dwavesys.com/docs/latest/c_gs_2.html",
    path: {
      segments: ["Bookmarks Bar", "physics"],
      name: "D-WAVE"
    },
    searchStrings: "What is Quantum Annealing"
  }
];

async function runTest() {
  try {
    // 1. まずprocessFetchedBookmarksを実行
    console.log('=== processFetchedBookmarks の実行 ===');
    console.log('=== 全てのchunkを出力 (syncボタンを押したとき何を保持しておくかという話) ===');
    const results = await processFetchedBookmarks(fetchedBookmarks);

    // chunk_vectorの先頭3要素だけを残し、見やすく整形して表示
    const shortResults = results.map((item) => ({
      userId: item.userId,
      url: item.url,
      path: item.path,
      chunk_index: item.chunk_index,
      chunk_text: item.chunk_text.slice(0, 100) + "...", // テキストも省略表示
      chunk_vector: item.chunk_vector.slice(0, 3),
    }));
    console.log(JSON.stringify(shortResults, null, 2));

    // 2. 次にaiSearchRepresentativeで「物理学」を検索
    console.log('=== aiSearchEngineでの検索の動作テスト ===');
    console.log('\n=== 「物理学」での検索結果 ===');
    const searchResults = await aiSearchRepresentative('物理学', results, 5);
    // スニペットは200文字で切り詰められているので、そのまま表示
    console.log(JSON.stringify(searchResults, null, 2));
    
    // 類似度スコアの範囲を確認
    const scores = searchResults.map(r => r.similarity);
    console.log('\n=== 類似度スコア ===');
    console.log(`最大: ${Math.max(...scores).toFixed(4)}`);
    console.log(`最小: ${Math.min(...scores).toFixed(4)}`);

  } catch (err) {
    console.error('Error in test:', err);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  runTest();
});
