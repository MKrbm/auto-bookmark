import { OpenAIEmbeddings } from "@langchain/openai";
import { defaultEmbeddingConfig } from '../config/embeddingConfig';
import { getOpenAIApiKey } from '../config/envConfig';
import { type EmbeddingModelConfig, type EmbeddingResult } from './types';

/**
 * OpenAIのEmbeddingモデルを初期化
 */
export function createEmbeddingModel(config: EmbeddingModelConfig = {}) {
  return new OpenAIEmbeddings({
    openAIApiKey: getOpenAIApiKey(),
    model: config.model || defaultEmbeddingConfig.model,
    dimensions: config.dimensions || defaultEmbeddingConfig.dimensions,
    batchSize: config.batchSize || defaultEmbeddingConfig.batchSize,
    stripNewLines: config.stripNewLines || defaultEmbeddingConfig.stripNewLines,
    timeout: config.timeout || defaultEmbeddingConfig.timeout,
    maxRetries: config.max_retries || defaultEmbeddingConfig.max_retries,
  });
}

/**
 * テキストの配列をembeddingベクトルに変換
 */
export async function generateEmbeddings(
  texts: string[],
  config: EmbeddingModelConfig = {}
): Promise<EmbeddingResult[]> {
  if (config.signal?.aborted) {
    console.log('[generateEmbeddings] Aborted before embedding');
    return [];
  }

  if (texts.length === 0) {
    return [];
  }

  const model = createEmbeddingModel(config);
  console.time(`embedding-generation (${texts.length} texts)`);
  
  try {
    const vectors = await model.embedDocuments(texts);
    console.timeEnd(`embedding-generation (${texts.length} texts)`);

    return texts.map((text, index) => ({
      text,
      vector: vectors[index],
    }));
  } catch (error) {
    console.error('Error generating embeddings:', error);
    return [];
  }
}

/**
 * コサイン類似度を計算
 */
export function calculateCosineSimilarity(a: number[], b: number[]): number {
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
 * クエリテキストと対象テキストの類似度を計算
 */
export async function findSimilarTexts(
  queryText: string,
  targetTexts: string[],
  config: EmbeddingModelConfig = {}
): Promise<EmbeddingResult[]> {
  if (!queryText.trim() || targetTexts.length === 0) {
    return [];
  }

  // クエリと対象テキストのembeddingを生成
  const [queryEmbedding] = await generateEmbeddings([queryText], config);
  if (!queryEmbedding) {
    return [];
  }

  const targetEmbeddings = await generateEmbeddings(targetTexts, config);
  if (config.signal?.aborted) {
    return [];
  }

  // 類似度でソート
  return targetEmbeddings
    .map(target => ({
      text: target.text,
      vector: target.vector,
      similarity: calculateCosineSimilarity(queryEmbedding.vector, target.vector)
    }))
    .sort((a, b) => b.similarity - a.similarity);
}
