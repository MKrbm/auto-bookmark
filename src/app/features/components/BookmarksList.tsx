// BookmarksList.tsx
// Renders a list of bookmarks and highlights matching text on hover.

import React from 'react';
import { Bookmark } from '../lib/types';

/**
 * This helper inserts <span className="highlighted"> around matched text.
 * We'll pair this with hover-based CSS highlighting.
 */
function highlightMatches(text: string, query: string): React.ReactNode {
    if (!query) return text; // no search term, return unaltered

    // Escape regex special chars if needed, or keep it simple if not
    const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escapedQuery})`, 'gi');

    // Split text by the matching query; wrap matches in <span>
    return text.split(regex).map((part, idx) =>
        part.toLowerCase() === query.toLowerCase()
            ? <span key={idx} className="highlighted">{part}</span>
            : part
    );
}

interface BookmarksListProps {
    bookmarks: Bookmark[];
    searchTerm: string;
}

export const BookmarksList: React.FC<BookmarksListProps> = ({ bookmarks, searchTerm }) => {
    return (
        <ul
            className="list-disc"
            style={{
                paddingLeft: '1rem',
                backgroundColor: 'yellow',
            }}
        >
            {bookmarks.map((bookmark) => {
                // Convert the entire Path to a string for display
                const fullPath = bookmark.path.toString();
                // Insert highlight spans around matched text
                const highlightedPath = highlightMatches(fullPath, searchTerm);

                return (
                    <li key={bookmark.id} className="pb-2">
                        <a
                            href={bookmark.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="title-link"
                        >
                            {highlightedPath}
                        </a>
                    </li>
                );
            })}
        </ul>
    );
};
