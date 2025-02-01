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

                            {/* スコアを表示 */}
                            {searchResult.score !== undefined && (
                                <div style={{ fontSize: '0.8rem', color: '#666' }}>
                                    Score: {(searchResult.score * 100).toFixed(2)}%
                                </div>
                            )}

                            {/* コンテキストを表示 */}
                            {searchResult.context && (
                                <div style={{ 
                                    fontSize: '0.8rem', 
                                    color: 'gray',
                                    marginTop: '0.5rem',
                                    padding: '0.5rem',
                                    backgroundColor: '#f5f5f5',
                                    borderRadius: '4px'
                                }}>
                                    {searchResult.context}
                                </div>
                            )}
                        </a>
                    </li>
                );
            })}
        </ul>
    );
};
