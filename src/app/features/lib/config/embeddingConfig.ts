// デフォルトの埋め込み設定
export const defaultEmbeddingConfig = {
  // テキスト分割設定
  chunkSize: 5000,
  chunkOverlap: 500,
  
  // 埋め込みモデル設定
  model: "text-embedding-3-large",
  dimensions: 1024,

  // 検索結果設定
  sort: "desc" as const,
  topN: 5,
  snippetLength: 200,
  
  // バッチ処理設定
  batchSize: 16,
  
  // テキスト前処理設定
  stripNewLines: true,
  
  // API設定
  timeout: 60000,
  check_embedding_ctx_length: true,
  embedding_ctx_length: 8191,
  max_retries: 2,
  
  // テキスト長計算関数
  lengthFunction: (text: string) => text.length,
} as const;

// 設定の型定義
export type EmbeddingConfig = typeof defaultEmbeddingConfig;
