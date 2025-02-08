import { OpenAIEmbeddings } from "@langchain/openai";
import * as dotenv from "dotenv";

// .env から環境変数を読み込む
dotenv.config();

// OpenAI APIキーの取得
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";

/**
 * Embeddingモデルの設定
 */
const embeddingModel = new OpenAIEmbeddings({
  openAIApiKey: OPENAI_API_KEY,
  modelName: "text-embedding-ada-002",
});

/**
 * コサイン類似度を計算する関数
 */
function calculateCosineSimilarity(a: number[], b: number[]): number {
  let dot = 0;
  let magA = 0;
  let magB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }
  magA = Math.sqrt(magA);
  magB = Math.sqrt(magB);
  return (magA && magB) ? (dot / (magA * magB)) : 0;
}

// ChunkData 的な構造体例
interface ChunkData {
  userId: string;
  url: string;
  path: { segments: string[]; name: string };
  chunk_index: number;
  chunk_text: string;
  chunk_vector: number[]; // 1536次元
}

/**
 * 検索関数 (aiSearchRepresentative)
 */
async function aiSearchRepresentative(
  input: string,
  chunks: ChunkData[],
  topN: number = 5
) {
  if (!input.trim()) {
    return [];
  }

  console.time(`query-embedding-generation ("${input}")`);
  const [queryEmbedding] = await embeddingModel.embedDocuments([input]);
  console.timeEnd(`query-embedding-generation ("${input}")`);

  // URL ごとに最高スコアを管理
  const urlBest: Record<string, { bestSimilarity: number; snippet: string; title: string }> = {};

  console.time(`similarity-calculation (${chunks.length} chunks)`);
  for (const chunk of chunks) {
    const similarity = calculateCosineSimilarity(chunk.chunk_vector, queryEmbedding);
    if (!urlBest[chunk.url]) {
      urlBest[chunk.url] = {
        bestSimilarity: similarity,
        snippet: chunk.chunk_text.slice(0, 100),
        title: chunk.path.name,
      };
    } else {
      if (similarity > urlBest[chunk.url].bestSimilarity) {
        urlBest[chunk.url].bestSimilarity = similarity;
        urlBest[chunk.url].snippet = chunk.chunk_text.slice(0, 100);
      }
    }
  }
  console.timeEnd(`similarity-calculation (${chunks.length} chunks)`);

  // 配列にしてソート
  console.time(`sort-results`);
  const results = Object.entries(urlBest).map(([url, info]) => ({
    url,
    similarity: info.bestSimilarity,
    snippet: info.snippet,
    title: info.title,
  }));
  results.sort((a, b) => b.similarity - a.similarity);
  console.timeEnd(`sort-results`);

  // 上位N件
  return results.slice(0, topN);
}

/**
 * ローカル実行用メイン関数
 */
async function main() {
  // テスト用に適当なchunkを用意
  const mockChunks: ChunkData[] = [
    {
      userId: "u001",
      url: "https://example.com/doc1",
      path: { segments: ["Bookmarks Bar"], name: "Document1" },
      chunk_index: 0,
      chunk_text: "This is a chunk about physics and mathematics.",
      chunk_vector: new Array(1536).fill(0),
    },
    {
      userId: "u002",
      url: "https://example.com/doc2",
      path: { segments: ["Bookmarks Bar"], name: "Document2" },
      chunk_index: 0,
      chunk_text: "This is a chunk about AI, artificial intelligence and machine learning.",
      chunk_vector: new Array(1536).fill(0),
    },
  ];

  const query = "人工知能とは何か？";

  console.log("=== AI Search Representative (Local) ===");
  console.log("Query:", query);

  // 実際に呼び出して処理時間を計測
  const results = await aiSearchRepresentative(query, mockChunks, 2);

  // 結果表示
  console.log("Results:", results);
}

// スクリプト実行
main().catch((err) => {
  console.error(err);
});
