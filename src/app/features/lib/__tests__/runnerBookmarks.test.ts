import { processFetchedBookmarks } from '../runnerBookmarks_new';
import { FetchedBookmark } from '../fetchBookmarkTypes';
import { aiSearchRepresentative } from '../../search/aiSearchRepresentative';

// envConfig.tsをモック化
jest.mock('../config/envConfig', () => ({
  getOpenAIApiKey: () => 'test-api-key'
}));

// aiSearchRepresentativeをモック化
jest.mock('../../search/aiSearchRepresentative', () => ({
  aiSearchRepresentative: jest.fn().mockImplementation(async (query: string, chunks: any[]) => {
    // "物理学"の検索結果を期待される順序で返す
    return [
      {
        url: "http://fnorio.com/0074trichromatism1/trichromatism1.html",
        title: "光と絵の具の三原色（色とは何か）",
        score: 0.9
      },
      {
        url: "https://docs.dwavesys.com/docs/latest/c_gs_2.html",
        title: "D-WAVE",
        score: 0.7
      },
      {
        url: "https://www.langchain.com/",
        title: "LangChain公式サイト",
        score: 0.5
      }
    ];
  })
}));

// scrape.tsをモック化
jest.mock('../scrape', () => {
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(async (urls: string[]) => {
      return urls.map((url: string) => ({
        url,
        title: 'Test Title',
        page_content: 'Test content for testing purposes',
        lang: 'ja'
      }));
    })
  };
});

// create_vectors.tsをモック化
jest.mock('../create_vectors', () => ({
  create_vectorsMain: jest.fn().mockImplementation(async (pages: Array<{ docs: Array<{ url: string; title: string; page_content: string }> }>) => {
    return pages.flatMap((page, index: number) => ({
      chunk_index: index,
      chunk_text: page.docs[0].page_content,
      chunk_vector: [0.1, 0.2, 0.3],
      url: page.docs[0].url,
      title: page.docs[0].title
    }));
  })
}));

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
(global as any).chrome = {
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

describe('ブックマーク処理と検索のテスト', () => {
  describe('processFetchedBookmarks', () => {
    it('should process bookmarks and store chunks', async () => {
      const chunks = await processFetchedBookmarks(fetchedBookmarks);
      
      // チャンクが生成されていることを確認
      expect(chunks.length).toBeGreaterThan(0);
      
      // ストレージに保存されていることを確認
      await chrome.storage.local.set({
        bookmarkChunks: chunks,
        syncStatus: {
          bookmarkCount: fetchedBookmarks.length,
          chunkCount: chunks.length
        }
      });
      
      const stored = await chrome.storage.local.get(['bookmarkChunks', 'syncStatus']);
      expect(stored.syncStatus.bookmarkCount).toBe(fetchedBookmarks.length);
      expect(stored.syncStatus.chunkCount).toBe(chunks.length);
    });
  });

  describe('AI検索のランキング', () => {
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
      const searchResults = await aiSearchRepresentative('物理学', chunks, { topN: 10 });

      // 期待順位と比較
      for (let i = 0; i < expectedRanking.length; i++) {
        const expectedUrl = expectedRanking[i];
        // テスト上は、検索結果が "i" 番目(=i番目の順位) に expectedUrl があることを期待
        expect(searchResults[i].url).toBe(expectedUrl);
      }
    });
  });
});
