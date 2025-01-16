// fuzzySearchEngine.tsx
import React from 'react';
import { Bookmark } from '../lib/types';
import { SearchResultItem } from './baseSearchEngine';

/** 
 * Return object shape for fuzzy results. 
 * It can match the shape of the exact result so we can unify them later. 
 */
export interface FuzzySearchResult {
    highlightedTitle: React.ReactNode;
    highlightedURL: React.ReactNode;
    highlightedPath: React.ReactNode;
    context: string;
    score: number;    // maybe we have a fuzzy match score
    original: Bookmark;
}

/**
 * Fuzzy search engine. 
 * This is just a skeleton to demonstrate how you might do it, 
 * you can implement your actual fuzzy logic or integrate an external library.
 */
export function fuzzySearchEngine(
    bookmarks: Bookmark[],
    searchTerm: string
): SearchResultItem[] {
    // We'll assume you have some fuzzy utility or code:
    // For demonstration, let's just do partial includes + "score"
    const { highlightText } = require('./highlightUtil');
    const lowerTerm = searchTerm.toLowerCase();

    const results: SearchResultItem[] = [];

    for (const bookmark of bookmarks) {
        const title = bookmark.path.name || '';
        const url = bookmark.url || '';
        const fullPath = bookmark.path.toString();

        // For demonstration, let's do a very naive scoring approach:
        // +1 if title includes the term, +1 if url includes the term, +1 if path includes the term
        let score = 0;
        if (title.toLowerCase().includes(lowerTerm)) score++;
        if (url.toLowerCase().includes(lowerTerm)) score++;
        if (fullPath.toLowerCase().includes(lowerTerm)) score++;

        // If score > 0, we consider it a fuzzy match (or you can do something more advanced).
        if (score > 0) {
            results.push({
                highlightedTitle: highlightText(title, searchTerm),
                highlightedURL: highlightText(url, searchTerm),
                highlightedFolder: highlightText(fullPath, searchTerm),
                context: '',   // fuzzy doesn't have special context
                score: score,  // store how "good" the match is
                original: bookmark,
            });
        }
    }

    // Optionally, you could sort the results by `score` descending
    results.sort((a, b) => b.score - a.score);

    return results;
}
