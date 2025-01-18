// baseSearchEngine.tsx
import { Bookmark } from '../lib/types';
import { exactSearchEngine } from './exactSearchEngine';
import { fuzzySearchEngine } from './fuzzySearchEngine';
// import { aiSearchEngine } from './aiSearchEngine';

export type SearchMode = 'exact' | 'fuzzy' | 'ai';

/** 
 * A generic shape you might want to unify. 
 * For simplicity, we define a superset that includes optional fields like "score".
 */
export interface SearchResultItem {
    highlightedTitle: React.ReactNode | string;
    highlightedURL: React.ReactNode | string;
    highlightedFolder: React.ReactNode | string;
    context: string;
    score?: number;
    original: Bookmark;
}


/**
 * Base function that picks which search engine to call based on the searchMode.
 */
export function baseSearchEngine(
    bookmarks: Bookmark[],
    searchTerm: string,
    searchMode: SearchMode
): SearchResultItem[] {
    switch (searchMode) {
        case 'exact': {
            return exactSearchEngine(bookmarks, searchTerm);
        }
        case 'fuzzy': {
            return fuzzySearchEngine(bookmarks, searchTerm);
        }
        case 'ai': {
            return aiSearchEngine(bookmarks, searchTerm);
            // console.error('aiSearchEngine not implemented');
            // return [];
            // const aiResults = aiSearchEngine(bookmarks, searchTerm);
            // return aiResults.map((r) => ({ ...r }));
        }
        default:
            return [];
    }
}
