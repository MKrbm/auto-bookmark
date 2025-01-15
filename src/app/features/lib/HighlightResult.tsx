// HighlightResult.ts
import React from 'react';

/**
 * Represents a single highlight result of searching within `title`.
 * 
 * - `title`: The unaltered original title of the bookmark (or text to search).
 * - `matchedText`: The substring(s) that match the query (could be empty for AI).
 * - `context`: Possibly the full snippet or path for AI usage, or extra text around the match.
 * - `highlightedString`: The React component that shows highlight spans in the matched areas.
 */
export interface HighlightResult {
    title: string;
    matchedText: string;
    context: string;
    highlightedString: React.ReactNode;
}
