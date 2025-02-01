export interface ChunkData {
  userId: string;       // 元のブックマークID (あるいは userid)
  url: string;
  path: {
    segments: string[];
    name: string;
  };
  chunk_index: number;
  chunk_text: string;   // スクレイピングで得た本文の一部
  chunk_vector: number[]; // create_vectors.ts で作ったEmbedding
}

export interface ChunkSearchResult {
  chunk: ChunkData;
  score: number;
}
