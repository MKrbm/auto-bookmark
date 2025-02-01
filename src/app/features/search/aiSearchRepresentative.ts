import { ChunkData } from '../lib/chunkTypes';
import { OpenAIEmbeddings } from "@langchain/openai";

const embeddingModel = new OpenAIEmbeddings({
  openAIApiKey: import.meta.env.VITE_OPENAI_API_KEY || '',
  model: "text-embedding-3-large",
  dimensions: 1024,
});

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

export interface RepresentativeSearchResult {
  url: string;
  title: string;
  snippet: string;
  similarity: number;
  userId: string;
  path: ChunkData['path'];
}

/**
 * 代表チャンク＋上位N件検索 (AI Search)
 * - input を Embedding → 各ファイルのチャンクとコサイン類似度
 * - 同一URL内で最高スコアのチャンクを1つだけ代表として記録
 * - 全URL中の上位N件を返す
 */
export async function aiSearchRepresentative(
  input: string,
  chunks: ChunkData[],
  topN: number = 5,
  signal?: AbortSignal
): Promise<RepresentativeSearchResult[]> {
  if (!input.trim()) {
    return [];
  }
  if (signal?.aborted) {
    console.log('[aiSearchRepresentative] Aborted before embedding');
    return [];
  }

  // 1) input を Embedding (1回)
  const [queryEmbedding] = await embeddingModel.embedDocuments([input]);
  if (signal?.aborted) {
    console.log('[aiSearchRepresentative] Aborted after query embedding');
    return [];
  }

  // 2) URLをキーに、{ bestSimilarity, snippet, title } を追跡するマップ
  const urlBest: Record<string, {
    bestSimilarity: number;
    snippet: string;
    title: string;
    userId: string;
    path: ChunkData['path'];
  }> = {};

  for (const chunk of chunks) {
    const similarity = calculateCosineSimilarity(chunk.chunk_vector, queryEmbedding);

    // 初期値がなければ作る
    if (!urlBest[chunk.url]) {
      urlBest[chunk.url] = {
        bestSimilarity: similarity,
        snippet: chunk.chunk_text.slice(0, 200), // 先頭200文字
        title: chunk.path.name,
        userId: chunk.userId,
        path: chunk.path
      };
    } else {
      // 既にある場合、最高スコアを更新
      if (similarity > urlBest[chunk.url].bestSimilarity) {
        urlBest[chunk.url].bestSimilarity = similarity;
        urlBest[chunk.url].snippet = chunk.chunk_text.slice(0, 200);
      }
    }
  }

  // 3) マップを配列化し、similarity降順でソート
  const results = Object.entries(urlBest).map(([url, info]) => ({
    url,
    title: info.title,
    snippet: info.snippet,
    similarity: info.bestSimilarity,
    userId: info.userId,
    path: info.path
  }));
  results.sort((a, b) => b.similarity - a.similarity);

  // 4) 上位N件
  return results.slice(0, topN);
}
