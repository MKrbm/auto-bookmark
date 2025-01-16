// Bookmarks.tsx
// Main component that fetches bookmarks, filters them, and renders BookmarksList.

import React, { useEffect, useState } from 'react';
import { SearchMode} from '../lib/highlightMatches'; 
import { BookmarksList } from './BookmarksList';
import { flattenBookmarks } from '../lib/utils';
import { Bookmark } from '../lib/types';
import { baseSearchEngine } from '../search/baseSearchEngine';
import '../styles/highlight.css';

export const Bookmarks: React.FC = () => {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchMode, setSearchMode] = useState<SearchMode>('exact');
  /**
   *  NEW: add search scope to decide whether we search only title
   *  (i.e. bookmark.path.name) or entire path (bookmark.path.toString()).
   */
  // const [searchScope, setSearchScope] = useState<'title' | 'path'>('title');
  // const [searchScope, setSearchScope] = useState<SearchScope>('title');

  // Example fetch function that uses chrome.runtime API to get bookmarks
  const fetchBookmarks = () => {
    chrome.runtime.sendMessage({ action: 'fetchBookmarks' }, (response) => {
      if (response && response.bookmarks) {
        setBookmarks(flattenBookmarks(response.bookmarks));
      }
    });
  };

  // Uncomment to fetch automatically:
  // useEffect(() => {
  //   fetchBookmarks();
  // }, []);

  /**
   * Filter logic:
   * - If searchScope = 'title', we only check bookmark.path.name
   * - If searchScope = 'path', we use bookmark.path.toString()
   * - Then we do a simple "includes" ignoring case
   */
  // const filteredBookmarks = Object.values(bookmarks).filter((bookmark) => {
  //   const textToSearch =
  //     // searchScope === 'title'
  //     //   ? bookmark.path.name
  //     //   : bookmark.path.toString();
  //     bookmark.path.name;

  //   return textToSearch.toLowerCase().includes(searchTerm.toLowerCase());
  // });

  const filteredBookmarks = baseSearchEngine(bookmarks, searchTerm, "exact")

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        paddingLeft: '1rem',
        paddingRight: '1rem',
        paddingBottom: '2rem',
        height: '100%',
        overflow: 'auto',
      }}
    >
      <input
        type="text"
        placeholder="Search bookmarks..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="mb-4 p-2 border border-gray-300 rounded"
      />

      {/* 
        1) Search Mode Buttons: 
           - highlight the active mode
           - e.g. use a simple style or a class. 
      */}
      <div style={{ marginBottom: '1rem', display: 'flex', gap: '0.5rem' }}>
        <button
          onClick={() => setSearchMode('exact')}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: searchMode === 'exact' ? '#007BFF' : '#ccc',
            color: searchMode === 'exact' ? '#fff' : '#000',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          Exact
        </button>
        <button
          onClick={() => setSearchMode('fuzzy')}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: searchMode === 'fuzzy' ? '#007BFF' : '#ccc',
            color: searchMode === 'fuzzy' ? '#fff' : '#000',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          Fuzzy
        </button>
        <button
          onClick={() => setSearchMode('ai')}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: searchMode === 'ai' ? '#007BFF' : '#ccc',
            color: searchMode === 'ai' ? '#fff' : '#000',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          AI
        </button>
      </div>

      {/* 
        2) Search Scope Toggle: "Title Only" or "Entire Path"
      */}
      {/* <div style={{ marginBottom: '1rem', display: 'flex', gap: '0.5rem' }}>
        <button
          onClick={() => setSearchScope('title')}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: searchScope === 'title' ? '#28a745' : '#ccc',
            color: searchScope === 'title' ? '#fff' : '#000',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          Title Only
        </button>
        <button
          onClick={() => setSearchScope('path')}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: searchScope === 'path' ? '#28a745' : '#ccc',
            color: searchScope === 'path' ? '#fff' : '#000',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          Entire Path
        </button>
      </div> */}

      <button onClick={fetchBookmarks} className="mb-4 p-2 bg-blue-500 text-white rounded">
        Sync Bookmarks
      </button>

      <div
        className="custom-scrollbar"
        style={{
          paddingLeft: '1rem',
          height: '100%',
          marginBottom: '1rem',
          backgroundColor: 'cyan',
        }}
      >
        {/* Pass searchTerm, searchMode, and searchScope down if needed */}
        <BookmarksList
          searchResults={filteredBookmarks}
          searchTerm={searchTerm}
          searchMode={searchMode}
        />
      </div>
    </div>
  );
};
