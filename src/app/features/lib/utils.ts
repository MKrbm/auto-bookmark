// utils.ts
// Utility functions for flattening the Chrome bookmarks tree.

import { BookmarkNode, Bookmark } from './types';
import { createPath } from './path';

/**
 * Recursively flattens a bookmark tree into a map keyed by URL.
 * @param nodes - array of BookmarkNode objects from Chrome
 * @param parentSegments - path segments from ancestor folders
 */
export function flattenBookmarks(
    nodes: BookmarkNode[],
    parentSegments: string[] = []
): { [url: string]: Bookmark } {
    let flatMap: { [url: string]: Bookmark } = {};

    nodes.forEach((node) => {
        const newSegments = [...parentSegments];
        if (node.title) {
            newSegments.push(node.title);
        }

        // If the node has a URL, store it in the flatMap
        if (node.url) {
            flatMap[node.url] = {
                id: node.id,
                path: createPath(newSegments),
                url: node.url,
            };
        }

        // Recurse into children
        if (node.children) {
            flatMap = {
                ...flatMap,
                ...flattenBookmarks(node.children, newSegments),
            };
        }
    });

    return flatMap;
}
