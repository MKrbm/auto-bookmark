import { ChunkData, ChunkSearchResult } from '../lib/chunkTypes';
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

/**
 * aiSearchEngineChunks
 * - searchTermを1回Embedding
 * - stateに持ってる各chunk_vectorと類似度を計算
 * - ソートして上位を返す
 */
export async function aiSearchEngineChunks(
  chunks: ChunkData[],
  searchTerm: string,
  signal?: AbortSignal
): Promise<ChunkSearchResult[]> {
  if (!searchTerm.trim()) {
    return [];
  }
  if (signal?.aborted) {
    console.log('[aiSearchEngineChunks] Aborted before embedding');
    return [];
  }

  // 1) クエリのEmbedding (単一)
  const [queryEmbedding] = await embeddingModel.embedDocuments([searchTerm]);
  if (signal?.aborted) {
    console.log('[aiSearchEngineChunks] Aborted after query embedding');
    return [];
  }

  // 2) 各chunkとの類似度を計算
  const results = chunks.map((cd) => ({
    chunk: cd,
    score: calculateCosineSimilarity(cd.chunk_vector, queryEmbedding)
  }));

  // 3) ソート
  results.sort((a, b) => b.score - a.score);

  // 4) return
  return results;
}
