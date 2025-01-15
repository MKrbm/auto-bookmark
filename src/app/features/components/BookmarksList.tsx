// BookmarksList.tsx
import React from 'react';
import { Bookmark } from '../lib/types';
import { highlightMatches, SearchMode } from '../lib/HighlightMatches';

interface BookmarksListProps {
    bookmarks: Bookmark[];
    searchTerm: string;
    // Let’s say we pass in a search mode from the parent for demonstration
    searchMode?: SearchMode;
}

export const BookmarksList: React.FC<BookmarksListProps> = ({
    bookmarks,
    searchTerm,
    searchMode = 'exact', // default to "exact"
}) => {
    return (
        <ul
            className="list-disc"
            style={{
                paddingLeft: '1rem',
                backgroundColor: 'orange',
            }}
        >
            {bookmarks.map((bookmark) => {
                // For now, we’re just searching the name. 
                // Or you could use the entire path: `bookmark.path.toString()`
                const name = bookmark.path.name;

                // 1) Call highlightMatches, which now returns a “HighlightResult” object
                const highlightResult = highlightMatches(name, searchTerm, searchMode);

                // 2) Grab whatever fields you need
                //    highlightResult.highlightedString
                //    highlightResult.title
                //    highlightResult.matchedText
                //    highlightResult.context
                const { highlightedString, matchedText, context } = highlightResult;

                return (
                    <li key={bookmark.id} className="pb-2">
                        <a
                            href={bookmark.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="title-link"
                        >
                            {highlightedString}
                        </a>
                        {searchMode !== 'ai' && matchedText && (
                            <div style={{ fontSize: '0.8rem', color: 'gray' }}>
                                Matched Text: {matchedText}
                            </div>
                        )}
                        {searchMode === 'ai' && (
                            <div style={{ fontSize: '0.8rem', color: 'gray' }}>
                                Context: {context}
                            </div>
                        )}
                    </li>
                );
            })}
        </ul>
    );
};
