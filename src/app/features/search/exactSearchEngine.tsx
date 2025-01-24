// exactSearchEngine.tsx
import React from 'react';
import { Bookmark } from '../lib/types';
import { highlightText } from '../lib/highlightUtil.tsx';
import { SearchResultItem } from './baseSearchEngine';
/** 
 * Return object shape. 
 * Adjust as you wish (title, url, path, context, etc.). 
 * Typically for each bookmark, we'll highlight the areas that match the `searchTerm`. 
 */


/**
 * EXACT SEARCH:
 * - For each bookmark, if it contains the searchTerm, build a highlighted version.
 * - If you want a stricter approach (like "must match everything"), you can adapt.
 */
export async function exactSearchEngine(
    bookmarks: Bookmark[],
    searchTerm: string
): Promise<SearchResultItem[]> {
    // Import the highlightText utility from your new file
    // (adjust the path to match your project structure)


    if (searchTerm.length === 0) {
        return [];
    }

    const searchTermArray = searchTerm.toLowerCase().split(' ')

    // filter bookmarks
    let filteredBookmarks = bookmarks
    for (const term of searchTermArray) {
        filteredBookmarks = filteredBookmarks.filter(bookmark => bookmark.searchString.toLowerCase().includes(term))
    }

    const results: SearchResultItem[] = []
    for (const bookmark of filteredBookmarks) {
        const title = bookmark.path.name || '';
        const url = bookmark.url || '';
        const fullPath = bookmark.path.parents().toString();

        results.push({
            highlightedTitle: highlightText(title, searchTerm),
            highlightedURL: highlightText(url, searchTerm),
            highlightedFolder: highlightText(fullPath, searchTerm),
            context: '',
            original: bookmark,
        });
    }



    // // Filter + highlight in one go:
    // const results: ExactSearchResult[] = [];

    // for (const bookmark of bookmarks) {
    //     const title = bookmark.path.name || '';
    //     const url = bookmark.url || '';
    //     const fullPath = bookmark.path.toString();

    //     // Check if either title, url, or path contains the searchTerm
    //     const matchTitle = title.toLowerCase().includes(lowerTerm);
    //     const matchURL = url.toLowerCase().includes(lowerTerm);
    //     const matchPath = fullPath.toLowerCase().includes(lowerTerm);

    //     // If you only want to include items that match at least in title or url or path:
    //     if (matchTitle || matchURL || matchPath) {
    //         results.push({
    //             highlightedTitle: highlightText(title, searchTerm),
    //             highlightedURL: highlightText(url, searchTerm),
    //             highlightedPath: highlightText(fullPath, searchTerm),
    //             // For exact search, maybe we don't have a special "context"; or you can store path, etc.
    //             context: '',
    //             original: bookmark,
    //         });
    //     }
    // }

    return results;
}
