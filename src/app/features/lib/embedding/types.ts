import { type EmbeddingConfig } from '../config/embeddingConfig';

export interface EmbeddingModelConfig extends Partial<EmbeddingConfig> {
  signal?: AbortSignal;
}

export interface EmbeddingResult {
  text: string;
  vector: number[];
}

export interface EmbeddingSimilarity {
  text: string;
  similarity: number;
}
