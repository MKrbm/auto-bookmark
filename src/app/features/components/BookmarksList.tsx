// BookmarksList.tsx
// Renders a list of bookmarks and highlights matching text on hover.

import React from 'react';
import { SearchMode, SearchResultItem } from '../search/baseSearchEngine';

interface BookmarksListProps {
    searchResults: SearchResultItem[];
    searchTerm: string;
    searchMode?: SearchMode; // 'exact', 'fuzzy', or 'ai'
}

export const BookmarksList: React.FC<BookmarksListProps> = ({
    searchResults,
    searchTerm,
    searchMode = 'exact',
}) => {
    return (
        <ul
            className="list-disc"
            style={{
                // paddingLeft: '1rem',
                // backgroundColor: 'orange',
            }}
        >
            {searchResults.map((searchResult) => {
                // For example, we always highlight the "name" field 
                // (since user has already pre-filtered by name vs. path in Bookmarks.tsx).
                return (
                    <li key={searchResult.original.id} className="bookmark-item">
                        <a
                            href={searchResult.original.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="title-link"
                        >
                            {searchResult.highlightedTitle}

                            {/* The folder badge */}
                            {searchResult.highlightedFolder && (
                                <div className="folder-badge">
                                    {searchResult.highlightedFolder}
                                </div>
                            )}

                            {/* If not AI mode and we found matched text, show it */}
                            {searchMode !== 'ai' && searchResult.context && (
                                <div style={{ fontSize: '0.8rem', color: 'gray' }}>
                                    Matched Text: {searchResult.context}
                                </div>
                            )}

                            {/* If AI mode, show context */}
                            {searchMode === 'ai' && (
                                <div style={{ fontSize: '0.8rem', color: 'gray' }}>
                                    Context: {searchResult.context}
                                </div>
                            )}
                        </a>
                    </li>

                );
            })}
        </ul>
    );
};
