import { ChunkData } from '../lib/chunkTypes';
import { defaultEmbeddingConfig } from '../lib/config/embeddingConfig';
import { generateEmbeddings, calculateCosineSimilarity } from '../lib/embedding';
import type { EmbeddingModelConfig } from '../lib/embedding/types';

interface SearchConfig extends Omit<EmbeddingModelConfig, 'topN' | 'snippetLength'> {
  topN?: number;
  snippetLength?: number;
}

// 検索用の設定を作成
function createSearchConfig(config: SearchConfig, signal?: AbortSignal): EmbeddingModelConfig {
  const { topN, snippetLength, ...embeddingConfig } = config;
  const finalConfig = { ...defaultEmbeddingConfig, ...embeddingConfig };
  return {
    ...finalConfig,
    signal,
  };
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
  config: SearchConfig = {},
  signal?: AbortSignal
): Promise<RepresentativeSearchResult[]> {
  if (!input.trim() || chunks.length === 0) {
    return [];
  }

  const searchConfig = createSearchConfig(config, signal);

  const topN = config.topN || defaultEmbeddingConfig.topN;
  const snippetLength = config.snippetLength || defaultEmbeddingConfig.snippetLength;

  // 1) クエリのembedding生成
  const [queryEmbedding] = await generateEmbeddings([input], searchConfig);
  if (!queryEmbedding || signal?.aborted) {
    return [];
  }

  // 2) URLをキーに、{ bestSimilarity, snippet, title } を追跡するマップ
  console.time(`similarity-calculation (${chunks.length} chunks)`);
  const urlBest: Record<string, {
    bestSimilarity: number;
    snippet: string;
    title: string;
    userId: string;
    path: ChunkData['path'];
  }> = {};

  for (const chunk of chunks) {
    const similarity = calculateCosineSimilarity(chunk.chunk_vector, queryEmbedding.vector);

    // 初期値がなければ作る
    if (!urlBest[chunk.url]) {
      urlBest[chunk.url] = {
        bestSimilarity: similarity,
        snippet: chunk.chunk_text.slice(0, snippetLength),
        title: chunk.path.name,
        userId: chunk.userId,
        path: chunk.path
      };
    } else {
      // 既にある場合、最高スコアを更新
      if (similarity > urlBest[chunk.url].bestSimilarity) {
        urlBest[chunk.url].bestSimilarity = similarity;
        urlBest[chunk.url].snippet = chunk.chunk_text.slice(0, snippetLength);
      }
    }
  }
  console.timeEnd(`similarity-calculation (${chunks.length} chunks)`);

  // 3) マップを配列化し、similarity降順でソート
  console.time(`sort-results (${Object.keys(urlBest).length} URLs)`);
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
  const finalResults = results.slice(0, topN);
  console.timeEnd(`sort-results (${Object.keys(urlBest).length} URLs)`);
  console.log('Top results:', finalResults.map(r => `${r.title} (${r.url})`));
  return finalResults;
}
