// baseSearchEngine.tsx
import { Bookmark } from '../lib/types';
import { exactSearchEngine } from './exactSearchEngine';
import { fuzzySearchEngine } from './fuzzySearchEngine';
import { aiSearchEngine } from './aiSearchEngine'; 

export type SearchMode = 'exact' | 'fuzzy' | 'ai';

export interface SearchResultItem {
  highlightedTitle: React.ReactNode | string;
  highlightedURL: React.ReactNode | string;
  highlightedFolder: React.ReactNode | string;
  context: string;
  score?: number;
  original: Bookmark;
}

// ❶ async 関数に変更 & 戻り値を Promise<SearchResultItem[]>
export async function baseSearchEngine(
  bookmarks: Bookmark[],
  searchTerm: string,
  searchMode: SearchMode
): Promise<SearchResultItem[]> {
  switch (searchMode) {
    case 'exact': {
      return Promise.resolve(exactSearchEngine(bookmarks, searchTerm));
    }
    case 'fuzzy': {
      return Promise.resolve(fuzzySearchEngine(bookmarks, searchTerm));
    }
    case 'ai': {
      // return Promise.resolve([]);
      return await aiSearchEngine(bookmarks, searchTerm);
    }
    default:
      return Promise.resolve([]);
  }
}