// baseSearchEngine.tsx
import { Bookmark } from '../lib/types';
import { ChunkData } from '../lib/chunkTypes';
import { exactSearchEngine } from './exactSearchEngine';
import { fuzzySearchEngine } from './fuzzySearchEngine';
import { aiSearchRepresentative } from './aiSearchRepresentative';
import { createPath } from '../lib/path';

export type SearchMode = 'exact' | 'fuzzy' | 'ai';

export interface SearchResultItem {
  highlightedTitle: React.ReactNode | string;
  highlightedURL: React.ReactNode | string;
  highlightedFolder: React.ReactNode | string;
  context: string;
  score?: number;
  original: Bookmark;
}

export async function baseSearchEngine(
  bookmarks: Bookmark[],
  searchTerm: string,
  searchMode: SearchMode,
  signal?: AbortSignal,
  chunkData?: ChunkData[]
): Promise<SearchResultItem[]> {
  if (!searchTerm.trim()) {
    return [];
  }

  if (!chunkData || chunkData.length === 0) {
    throw new Error('Chunk data is required for search');
  }

  // 検索モードに応じて検索を実行
  let matchedChunks: { chunk: ChunkData; score: number }[] = [];

  switch (searchMode) {
    case 'exact': {
      // 完全一致検索
      matchedChunks = chunkData
        .map(chunk => ({
          chunk,
          score: chunk.chunk_text.toLowerCase().includes(searchTerm.toLowerCase()) ? 1 : 0
        }))
        .filter(result => result.score > 0);
      break;
    }
    case 'fuzzy': {
      // あいまい検索（部分一致）
      const terms = searchTerm.toLowerCase().split(' ').filter(term => term.length > 0);
      matchedChunks = chunkData
        .map(chunk => {
          const text = chunk.chunk_text.toLowerCase();
          const matchCount = terms.filter(term => text.includes(term)).length;
          return {
            chunk,
            score: matchCount / terms.length
          };
        })
        .filter(result => result.score > 0);
      break;
    }
    case 'ai': {
      // AI検索はaiSearchRepresentativeを使用
      const representativeResults = await aiSearchRepresentative(searchTerm, chunkData, 5, signal);
      return representativeResults.map(result => ({
        highlightedTitle: result.title,
        highlightedURL: result.url,
        highlightedFolder: result.path.segments.join(' / '),
        context: result.snippet,
        score: result.similarity,
        original: {
          id: result.userId,
          url: result.url,
          path: createPath(result.path.segments),
          searchString: result.snippet
        }
      }));
    }
    default:
      throw new Error(`Unsupported search mode: ${searchMode}`);
  }

  // URLごとに最高スコアのチャンクを選択
  const urlBest: Record<string, { chunk: ChunkData; score: number }> = {};
  for (const result of matchedChunks) {
    const { chunk, score } = result;
    if (!urlBest[chunk.url] || score > urlBest[chunk.url].score) {
      urlBest[chunk.url] = { chunk, score };
    }
  }

  // 結果を変換してスコア順にソート
  const results = Object.values(urlBest)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5) // 上位5件に制限
    .map(({ chunk, score }) => ({
      highlightedTitle: chunk.path.name,
      highlightedURL: chunk.url,
      highlightedFolder: chunk.path.segments.join(' / '),
      context: chunk.chunk_text.slice(0, 200), // 先頭200文字を表示
      score,
      original: {
        id: chunk.userId,
        url: chunk.url,
        path: createPath(chunk.path.segments),
        searchString: chunk.chunk_text
      }
    }));

  return results;
}
