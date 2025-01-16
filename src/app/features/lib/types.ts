// types.ts
// Shared TypeScript interfaces for bookmarks.

import { Path } from './path';

export interface BookmarkNode {
    id: string;
    title: string;
    url?: string;
    children?: BookmarkNode[];
}

export interface Bookmark {
    id: string;
    path: Path;
    url: string;
    searchString: string;
}
