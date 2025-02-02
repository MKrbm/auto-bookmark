import { processFetchedBookmarks } from '../app/features/lib/runnerBookmarks_new';
import { FetchedBookmark } from '../app/features/lib/fetchBookmarkTypes';
import { aiSearchRepresentative } from '../app/features/search/aiSearchRepresentative';
import { ChunkData } from '../app/features/lib/chunkTypes';

console.log('=== testRunnerFetched.ts loaded ===');

// テスト用のモックストレージを実装
const mockStorage = {
  data: {} as { [key: string]: any },
  get(keys: string[]) {
    return Promise.resolve(
      keys.reduce((acc, key) => {
        acc[key] = this.data[key];
        return acc;
      }, {} as { [key: string]: any })
    );
  },
  set(items: { [key: string]: any }) {
    Object.assign(this.data, items);
    return Promise.resolve();
  }
};

// chrome.storage.localのモック
(window as any).chrome = {
  storage: {
    local: mockStorage
  }
};



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

    // ユーザーデータとしてchunkを保存
    await chrome.storage.local.set({
      bookmarkChunks: results,
      syncStatus: {
        bookmarkCount: fetchedBookmarks.length,
        chunkCount: results.length
      }
    });

    // 保存したデータを取得して確認
    const stored = await chrome.storage.local.get(['bookmarkChunks', 'syncStatus']);
    console.log('=== 保存されたユーザーデータ ===');
    console.log('Sync status:', stored.syncStatus);

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
    console.log('=== aiSearchEngine(aiSearchRepresentative)での検索の動作テスト ===');
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

describe('AI検索のランキングテスト', () => {
  // 順位の期待リスト
  const expectedRanking = [
    "http://fnorio.com/0074trichromatism1/trichromatism1.html", // 1位に期待
    "https://docs.dwavesys.com/docs/latest/c_gs_2.html",        // 2位
    "https://www.langchain.com/"                                // 3位
  ];

  it('should rank "物理学" in the order of fnorio -> dwave -> langchain', async () => {
    // 通常どおり processFetchedBookmarks でチャンクセットを作る
    const chunks = await processFetchedBookmarks(fetchedBookmarks);

    // AI検索（Embedding 類似度計算）
    const searchResults = await aiSearchRepresentative('物理学', chunks, 10);

    // 期待順位と比較
    for (let i = 0; i < expectedRanking.length; i++) {
      const expectedUrl = expectedRanking[i];
      // テスト上は、検索結果が "i" 番目(=i番目の順位) に expectedUrl があることを期待
      expect(searchResults[i].url).toBe(expectedUrl);
    }
  });
});
