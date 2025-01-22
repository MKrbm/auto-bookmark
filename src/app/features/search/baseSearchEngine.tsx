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

// Extend signature to accept optional AbortSignal
export async function baseSearchEngine(
  bookmarks: Bookmark[],
  searchTerm: string,
  searchMode: SearchMode,
  signal?: AbortSignal
): Promise<SearchResultItem[]> {

  switch (searchMode) {
    case 'exact':
      return exactSearchEngine(bookmarks, searchTerm);
    case 'fuzzy':
      return fuzzySearchEngine(bookmarks, searchTerm);
    case 'ai':
      return aiSearchEngine(bookmarks, searchTerm, signal);
    default:
      throw new Error(`Unsupported search mode: ${searchMode}`);
  }
}
