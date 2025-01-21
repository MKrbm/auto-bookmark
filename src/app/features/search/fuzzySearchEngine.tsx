// fuzzySearchEngine.tsx
import React from 'react';
import { Bookmark } from '../lib/types';
import { SearchResultItem } from './baseSearchEngine';
import uFuzzy from '@leeoniya/ufuzzy';
import { highlightText } from '../lib/highlightUtil.tsx';




function replaceMarkAndConvert(htmlString: string): React.ReactNode {
    const replacedString = htmlString
        .replace(/<mark>/g, '<span class="highlighted">')
        .replace(/<\/mark>/g, '</span>');

    return <span dangerouslySetInnerHTML={{ __html: replacedString }} />;
}



/* Fuzzy search engine. 
* This is just a skeleton to demonstrate how you might do it, 
* you can implement your actual fuzzy logic or integrate an external library.
*/
export function fuzzySearchEngine(
    bookmarks: Bookmark[],
    searchTerm: string
): SearchResultItem[] {



    const fuzziness = Math.round(0.6 * 4.2);
    let opts: uFuzzy.Options = {
        intraMode: 0,
        intraIns: fuzziness,
        intraDel: 1,
        intraSub: 1,
        intraTrn: 1,
    };
    const state = {
        haystack: bookmarks.map((bookmark) => bookmark.searchString),
        uf: new uFuzzy(opts),
    }


    let filteredIdx: uFuzzy.HaystackIdxs | null = Array.from({ length: state.haystack.length }, (_, index) => index);

    // const needles = searchTerm.length > 0 ? searchTerm.toLowerCase().split('3000') : [];
    // for (const term of needles) {
    // if (term.length === 0) { continue; }
    if (searchTerm.length > 0) {
        filteredIdx = state.uf.filter(state.haystack, searchTerm, filteredIdx ? filteredIdx : undefined);
    }
    // }

    // Highlight the search term in the filtered bookmarks
    const results: SearchResultItem[] = [];

    if (searchTerm.length > 0) {
        if (filteredIdx && filteredIdx?.length > 0) {
            const info = state.uf.info(filteredIdx, state.haystack, searchTerm);
            for (let j = 0; j < info.idx.length; j++) {
            const idx = info.idx[j];
            const bookmark = bookmarks[idx];
            const highlight = uFuzzy.highlight(bookmark.searchString, info.ranges[j]);
            const highlightArray = highlight.split('¦')


                const titleHighlighted = highlightArray[0] && highlightArray[0].includes('<mark>') ? replaceMarkAndConvert(highlightArray[0]) : bookmark.path.name;
                const urlHighlighted = highlightArray[1] && highlightArray[1].includes('<mark>') ? replaceMarkAndConvert(highlightArray[1]) : bookmark.url;
                const folderHighlighted = highlightArray[2] && highlightArray[2].includes('<mark>') ? replaceMarkAndConvert(highlightArray[2]) : bookmark.path.parents().toString();

                console.log('folderHighlighted', folderHighlighted)


                // if (i == needles.length - 1) {
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