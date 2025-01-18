// aiSearchEngine.tsx
import { Bookmark } from '../lib/types';
import { SearchResultItem } from './baseSearchEngine';
import { highlightText } from '../lib/highlightUtil';
import { OpenAIEmbeddings } from 'langchain/embeddings/openai';

// こちらは OPENAI_API_KEY の読み込みなど、プロジェクト構成に合わせて
const embeddingModel = new OpenAIEmbeddings({
  openAIApiKey: '',
  model: "text-embedding-3-large",
  dimensions: 1024,
});

// 単純なコサイン類似度
function calculateCosineSimilarity(a: number[], b: number[]): number {
  const dot = a.reduce((acc, val, idx) => acc + val * b[idx], 0);
  const magA = Math.sqrt(a.reduce((acc, val) => acc + val * val, 0));
  const magB = Math.sqrt(b.reduce((acc, val) => acc + val * val, 0));
  return (magA && magB) ? (dot / (magA * magB)) : 0;
}

/**
 * AI検索 (Bookmark配列を受け取り、searchTermとの類似度を計算)
 * - bookmarkごとに searchString を Embedding
 * - searchTerm も Embedding
 * - コサイン類似度の高い順にソート
 * - SearchResultItem[] を返す
 */
export async function aiSearchEngine(
  bookmarks: Bookmark[],
  searchTerm: string
): Promise<SearchResultItem[]> {

  if (!searchTerm || !searchTerm.trim()) {
    return [];
  }

  // 1) 検索クエリを Embedding
  const [queryEmbedding] = await embeddingModel.embedDocuments([searchTerm]);
  //   queryEmbedding は 例えば 1536次元の配列

  // 2) Bookmarkごとの Embeddingを取得
  //    ここでは bookmark.searchString を埋め込む (リアルタイム)
  //    たとえば 10件の bookmark があれば 10要素の配列になる
  const texts = bookmarks.map(b => b.searchString);
  const embeddings = await embeddingModel.embedDocuments(texts);
  // embeddings[i] が bookmarks[i] に対応

  // 3) 類似度を計算 & Sort
  //    embeddings[i] と queryEmbedding を比べる
  const bookmarkScores = embeddings.map((emb, i) => {
    const similarity = calculateCosineSimilarity(emb, queryEmbedding);
    return { index: i, similarity };
  });
  bookmarkScores.sort((a, b) => b.similarity - a.similarity);

  // 4) Top Nなどに絞る場合
  //    例えば 10件だけ返す -> slice(0, 10)
  const topScores = bookmarkScores; // .slice(0, 10) など

  // 5) SearchResultItem[] を生成
  const results: SearchResultItem[] = topScores.map(({ index, similarity }) => {
    const bk = bookmarks[index];
    const title = bk.path.name || '';
    const url = bk.url || '';
    const fullPath = bk.path.parents().join(' / ');

    return {
      // 好みで highlightText を適用
      highlightedTitle: highlightText(title, searchTerm),
      highlightedURL: highlightText(url, searchTerm),
      highlightedFolder: highlightText(fullPath, searchTerm),
      context: bk.searchString,
      score: similarity,
      original: bk,
    };
  });

  return results;
}
