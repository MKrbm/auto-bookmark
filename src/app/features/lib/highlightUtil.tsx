// highlightUtil.tsx
import React from 'react';

/**
 * Splits `text` on every occurrence of `query` (case-insensitive)
 * and wraps those matched parts in <span className="highlighted">...</span>.
 */
export function highlightText(
    text: string,
    query: string
): React.ReactNode {
    if (!query) return text; // If no query, return as-is

    // Convert to lower for case-insensitive searching
    const lowerText = text.toLowerCase();
    const lowerQuery = query.toLowerCase();

    let startIndex = 0;
    let index: number;
    const fragments: React.ReactNode[] = [];

    while ((index = lowerText.indexOf(lowerQuery, startIndex)) !== -1) {
        // Push the text chunk before the match
        if (index > startIndex) {
            fragments.push(text.slice(startIndex, index));
        }

        // Push the highlighted match
        const match = text.slice(index, index + query.length);
        fragments.push(
            <span className="highlighted" key={index}>
                {match}
            </span>
        );

        // Move past this match
        startIndex = index + query.length;
    }

    // Finally, push any remaining text after the last match
    if (startIndex < text.length) {
        fragments.push(text.slice(startIndex));
    }

    return <>{fragments}</>;
}
