// utils.ts
// Utility functions for flattening the Chrome bookmarks tree.

import { BookmarkNode, Bookmark } from './types';
import { createPath } from './path';
import { Path } from './path';
/**
 * Recursively flattens a bookmark tree into a map keyed by URL.
 * @param nodes - array of BookmarkNode objects from Chrome
 * @param parentSegments - path segments from ancestor folders
 */
export function flattenBookmarks(
    nodes: BookmarkNode[],
    parentSegments: string[] = []
): Bookmark[] {
    let flatMap: Bookmark[] = [];

    nodes.forEach((node) => {
        const newSegments = [...parentSegments];
        if (node.title) {
            newSegments.push(node.title);
        }

        // If the node has a URL, store it in the flatMap
        if (node.url) {
            const path = createPath(newSegments)
            const searchString = createSearchString(path, node.url, '')
            flatMap.push({
                id: node.id,
                path: path,
                url: node.url,
                searchString: searchString,
            });
        }

        // Recurse into children
        if (node.children) {
            flatMap = [
                ...flatMap,
                ...flattenBookmarks(node.children, newSegments),
            ];
        }
    });

    return flatMap;
}


export function createSearchString(path: Path, url: string, tags: string) {
    const separator = '¦'
    let searchString = ''
    const title = path.name
    const folder = path.parents().toString()
    if (!url) {
        console.error('createSearchString: No URL given', { title, url, tags, folder })
        return searchString
    }
    if (title && !title.toLowerCase().includes(url.toLowerCase())) {
        searchString += title + separator + url
    } else {
        searchString += url
    }
    if (tags) {
        searchString += separator + tags
    }
    if (folder) {
        searchString += separator + folder
    }
    return searchString
}