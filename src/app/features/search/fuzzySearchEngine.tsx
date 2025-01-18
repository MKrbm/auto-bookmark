// fuzzySearchEngine.tsx
import React from 'react';
import { Bookmark } from '../lib/types';
import { SearchResultItem } from './baseSearchEngine';
import uFuzzy from '@leeoniya/ufuzzy';
import { highlightText } from '../lib/highlightUtil.tsx';




interface State {
    haystack: string[];
    uf: uFuzzy;
}

let state: State | null = null;
/**
 * Fuzzy search engine. 
 * This is just a skeleton to demonstrate how you might do it, 
 * you can implement your actual fuzzy logic or integrate an external library.
 */
export function fuzzySearchEngine(
    bookmarks: Bookmark[],
    searchTerm: string
): SearchResultItem[] {



    debugger;
    let opts: uFuzzy.Options = {
        intraIns: Math.round(0.6 * 4.2),
        intraDel: 1,
        intraSub: 1,
        intraTrn: 1,
        intraMode: 1,

    };
    state = {
        haystack: bookmarks.map((bookmark) => bookmark.searchString),
        uf: new uFuzzy(opts),
    }


    let filteredIdx: uFuzzy.HaystackIdxs | null = Array.from({ length: state.haystack.length }, (_, index) => index);

    const needles = searchTerm.length > 0 ? searchTerm.toLowerCase().split(' ') : [];
    for (const term of needles) {
        if (term.length === 0) { continue; }
        filteredIdx = state.uf.filter(state.haystack, term, filteredIdx ? filteredIdx : undefined);
    }

    // Highlight the search term in the filtered bookmarks
    const results: SearchResultItem[] = [];
    debugger;

    for (const needle of needles) {
        if (filteredIdx && filteredIdx?.length > 0) {
            const info = state.uf.info(filteredIdx, state.haystack, needle);
            for (let i = 0; i < info.idx.length; i++) {
                const idx = info.idx[i];
                const bookmark = bookmarks[idx];
                const highlight = uFuzzy.highlight(bookmark.searchString, info.ranges[i]);
                const highlightArray = highlight.split('¦')


                const titleHighlighted = highlightArray[0] && highlightArray[0].includes('<mark>') ? highlightArray[0] : highlightText(bookmark.path.name, searchTerm);
                const urlHighlighted = highlightArray[1] && highlightArray[1].includes('<mark>') ? highlightArray[1] : highlightText(bookmark.url, searchTerm);
                const folderHighlighted = highlightArray[3] && highlightArray[3].includes('<mark>') ? highlightArray[3] : highlightText(bookmark.path.parents().toString(), searchTerm);

                console.log('titleHighlighted', titleHighlighted);

                results.push({
                    highlightedTitle: titleHighlighted,
                    highlightedURL: urlHighlighted,
                    highlightedFolder: folderHighlighted,
                    context: '',
                    original: bookmark,
                });
            }
        }
    }


    return results;
}
