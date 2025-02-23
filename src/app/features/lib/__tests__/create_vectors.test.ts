import { create_vectorsMain } from '../create_vectors';
import { OpenAIEmbeddings } from "@langchain/openai";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { type EmbeddingConfig } from '../config/embeddingConfig';

// OpenAIEmbeddingsのモック
jest.mock("@langchain/openai", () => ({
  OpenAIEmbeddings: jest.fn().mockImplementation(() => ({
    embedDocuments: jest.fn().mockImplementation(async (texts) => {
      // 簡単なモックベクター生成
      return texts.map(() => [[0.1, 0.2, 0.3]]);
    }),
  })),
}));

// RecursiveCharacterTextSplitterのモック
jest.mock("langchain/text_splitter", () => ({
  RecursiveCharacterTextSplitter: jest.fn().mockImplementation(() => ({
    splitDocuments: jest.fn().mockImplementation(async (docs) => {
      // 単純な分割をシミュレート
      return docs.map((doc: { pageContent: string; metadata: any }) => ({
        pageContent: doc.pageContent,
        metadata: doc.metadata,
      }));
    }),
  })),
}));

describe('create_vectorsMain', () => {
  const mockPages = [
    {
      docs: [{
        page_content: "Test content 1",
        metadata: {
          url: "http://test1.com",
          title: "Test Page 1",
          userTitle: "User Title 1"
        }
      }],
      filename: "test1.html",
      userTitle: "User Title 1"
    },
    {
      docs: [{
        page_content: "Test content 2",
        metadata: {
          url: "http://test2.com",
          title: "Test Page 2",
          userTitle: "User Title 2"
        }
      }],
      filename: "test2.html",
      userTitle: "User Title 2"
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    // コンソール出力を抑制
    jest.spyOn(console, 'time').mockImplementation();
    jest.spyOn(console, 'timeEnd').mockImplementation();
    jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();
  });

  it('複数ページを並列で処理できること', async () => {
    const result = await create_vectorsMain(mockPages);

    expect(result).toHaveLength(2); // 2つのページ分の結果
    expect(result[0]).toEqual(expect.objectContaining({
      chunk_index: 0,
      chunk_text: expect.any(String),
      chunk_vector: expect.any(Array),
      url: "http://test1.com",
      title: "Test Page 1"
    }));
    expect(result[1]).toEqual(expect.objectContaining({
      chunk_index: 0,
      chunk_text: expect.any(String),
      chunk_vector: expect.any(Array),
      url: "http://test2.com",
      title: "Test Page 2"
    }));
  });

  it('一部のページでエラーが発生しても他のページは処理を継続すること', async () => {
    // 2番目のページでエラーを発生させる
    const pagesWithError = [
      mockPages[0],
      {
        docs: [], // 空の配列でエラーを発生させる
        filename: "error.html",
        userTitle: "Error Page"
      }
    ];

    const result = await create_vectorsMain(pagesWithError);

    expect(result).toHaveLength(1); // エラーのないページのみ処理される
    expect(result[0]).toEqual(expect.objectContaining({
      url: "http://test1.com",
      title: "Test Page 1"
    }));
  });

  it('空の入力配列に対して空の配列を返すこと', async () => {
    const result = await create_vectorsMain([]);
    expect(result).toEqual([]);
  });

  it('カスタム設定でモデルが初期化されること', async () => {
    const customConfig: Partial<EmbeddingConfig> = {
      chunkSize: 5000,
      chunkOverlap: 500,
      model: "text-embedding-3-small"
    };

    await create_vectorsMain(mockPages, customConfig);

    expect(RecursiveCharacterTextSplitter).toHaveBeenCalledWith(
      expect.objectContaining({
        chunkSize: customConfig.chunkSize,
        chunkOverlap: customConfig.chunkOverlap
      })
    );

    expect(OpenAIEmbeddings).toHaveBeenCalledWith(
      expect.objectContaining({
        model: customConfig.model
      })
    );
  });
});
