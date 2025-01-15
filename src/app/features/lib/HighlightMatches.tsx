// highlightMatches.ts
import React from 'react';
import { HighlightResult } from './HighlightResult';

export type SearchMode = 'exact' | 'fuzzy' | 'ai';

export function highlightMatches(
    text: string,
    query: string,
    mode: SearchMode = 'exact'
): HighlightResult {
    // Always store the full (original) text and context
    // This might be the same for your use case, or you can differentiate them
    const baseResult: Omit<HighlightResult, 'highlightedString'> = {
        title: text,
        matchedText: '',
        context: text, // For AI we might consider this the entire snippet
    };

    // If we’re in AI mode, skip any highlighting and matched substring
    if (mode === 'ai') {
        return {
            ...baseResult,
            highlightedString: text, // can also be <span>{text}</span> or similar
        };
    }

    // For exact/fuzzy, do the highlight logic if there's a query
    if (!query) {
        return {
            ...baseResult,
            // No highlight if no query
            highlightedString: text,
        };
    }

    // Basic regex escaping:
    const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    // For fuzzy, you could alter how you build the regex, or apply a library
    // For now, we’ll treat "fuzzy" similarly to "exact" with a case-insensitive search
    const regex = new RegExp(`(${escapedQuery})`, 'gi');

    // Split the text by the matching query; wrap matches in <span>
    const splittedParts = text.split(regex);

    let matchedText = '';
    const highlightedNodes = splittedParts.map((part, idx) => {
        const isMatch = part.toLowerCase() === query.toLowerCase();
        if (isMatch) {
            // Capture this matched piece for matchedText
            matchedText = part;
            return (
                <span key={idx} className="highlighted">
                    {part}
                </span>
            );
        }
        return part;
    });

    return {
        ...baseResult,
        matchedText,
        highlightedString: <>{highlightedNodes}</>,
    };
}
