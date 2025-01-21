// BookmarksList.tsx
// Renders a list of bookmarks and highlights matching text on hover.

import React from 'react';
import { SearchMode, SearchResultItem } from '../search/baseSearchEngine';

interface BookmarksListProps {
    searchResults: SearchResultItem[];
    searchTerm: string;
    searchMode?: SearchMode; // 'exact', 'fuzzy', or 'ai'
}

// BookmarksList.tsx

export const BookmarksList: React.FC<BookmarksListProps> = ({
    searchResults,
    searchTerm,
    searchMode = 'exact',
}) => {
    return (
        <ul className="list-disc">
            {searchResults.map((searchResult) => {
                return (
                    <li key={searchResult.original.id} className="bookmark-item">
                        <a
                            href={searchResult.original.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="title-link"
                        >
                            {/* Title */}
                            {searchResult.highlightedTitle}

                            {/* Folder badge */}
                            {searchResult.highlightedFolder && (
                                <div className="folder-badge">
                                    {searchResult.highlightedFolder}
                                </div>
                            )}

                            {/* URL (less visible) */}
                            {searchResult.highlightedURL && (
                                <div className="bookmark-url">
                                    {searchResult.highlightedURL}
                                </div>
                            )}

                            {/* If not AI mode and we found matched text, show it */}
                            {/* {searchMode !== 'ai' && searchResult.context && (
                                <div style={{ fontSize: '0.8rem', color: 'gray' }}>
                                    Matched Text: {searchResult.context}
                                </div>
                            )} */}

                            {/* If AI mode, show context */}
                            {/* {searchMode === 'ai' && (
                                <div style={{ fontSize: '0.8rem', color: 'gray' }}>
                                    Context: {searchResult.context}
                                </div>
                            )} */}
                        </a>
                    </li>
                );
            })}
        </ul>
    );
};

