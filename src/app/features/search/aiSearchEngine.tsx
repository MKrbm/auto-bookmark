// aiSearchEngine.tsx
import { Bookmark } from '../lib/types';
import { SearchResultItem } from './baseSearchEngine';
import { highlightText } from '../lib/highlightUtil';
import { OpenAIEmbeddings } from "@langchain/openai";

// Example: If the library doesn't accept an AbortSignal in embedDocuments,
// we can do manual checks for `signal?.aborted`.
console.log(import.meta.env.VITE_OPENAI_API_KEY);
const embeddingModel = new OpenAIEmbeddings({
  openAIApiKey: import.meta.env.VITE_OPENAI_API_KEY || '',
  model: "text-embedding-3-large",
  dimensions: 1024,
});

function calculateCosineSimilarity(a: number[], b: number[]): number {
  const dot = a.reduce((acc, val, idx) => acc + val * b[idx], 0);
  const magA = Math.sqrt(a.reduce((acc, val) => acc + val * val, 0));
  const magB = Math.sqrt(b.reduce((acc, val) => acc + val * val, 0));
  return (magA && magB) ? (dot / (magA * magB)) : 0;
}

export async function aiSearchEngine(
  bookmarks: Bookmark[],
  searchTerm: string,
  signal?: AbortSignal
): Promise<SearchResultItem[]> {

  if (!searchTerm.trim()) {
    return [];
  }
  if (signal?.aborted) {
    // If the effect was cleaned up before we even started, bail out
    console.log('[aiSearchEngine] Aborted before starting with searchTerm: ', searchTerm);
    return [];
  }

  // 1) Embedding for search term
  const [queryEmbedding] = await embeddingModel.embedDocuments([searchTerm]);
  if (signal?.aborted) {
    console.log('[aiSearchEngine] Aborted after query embedding with searchTerm: ', searchTerm);
    return [];
  }

  // 2) Embeddings for each bookmark
  const texts = bookmarks.map(b => b.searchString);
  const embeddings = await embeddingModel.embedDocuments(texts);
  if (signal?.aborted) {
    console.log('[aiSearchEngine] Aborted after bookmark embeddings with searchTerm: ', searchTerm);
    return [];
  }

  // 3) Compute similarity
  const bookmarkScores = embeddings.map((emb, i) => {
    const similarity = calculateCosineSimilarity(emb, queryEmbedding);
    return { index: i, similarity };
  });
  bookmarkScores.sort((a, b) => b.similarity - a.similarity);

  // 4) Build SearchResultItem[]
  const results: SearchResultItem[] = bookmarkScores.map(({ index, similarity }) => {
    const bk = bookmarks[index];
    const title = bk.path.name || '';
    const url = bk.url || '';
    const fullPath = bk.path.parents().toString();

    return {
      highlightedTitle: highlightText(title, searchTerm),
      highlightedURL: highlightText(url, searchTerm),
      highlightedFolder: highlightText(fullPath, searchTerm),
      context: "context",
      score: similarity,
      original: bk,
    };
  });

  return results;
}
