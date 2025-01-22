// Bookmarks.tsx
import React, { useEffect, useState, useRef } from 'react';
import { SearchMode } from '../lib/HighlightMatches';
import { BookmarksList } from './BookmarksList';
import { flattenBookmarks } from '../lib/utils';
import { Bookmark } from '../lib/types';
import { baseSearchEngine, SearchResultItem } from '../search/baseSearchEngine';

export const Bookmarks: React.FC = () => {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchMode, setSearchMode] = useState<SearchMode>('fuzzy');
  const [filteredBookmarks, setFilteredBookmarks] = useState<SearchResultItem[]>([]);

  const searchInputRef = useRef<HTMLInputElement>(null);

  const fetchBookmarks = () => {
    chrome.runtime.sendMessage({ action: 'fetchBookmarks' }, (response) => {
      if (response && response.bookmarks) {
        setBookmarks(flattenBookmarks(response.bookmarks));
      }
    });
  };

  useEffect(() => {
    fetchBookmarks();
  }, []);

  useEffect(() => {
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [searchMode]);

  useEffect(() => {
    // --- 1) Create a new controller for each search ---
    const abortController = new AbortController();

    // --- 2) Debounce search: wait 300ms before calling search ---
    const debounceTimer = setTimeout(() => {
      // If this effect hasn't been cleaned up in 300ms, proceed with search
      baseSearchEngine(bookmarks, searchTerm, searchMode, abortController.signal)
        .then((results) => {
          // If the request wasn't aborted, set the results
          if (!abortController.signal.aborted) {
            setFilteredBookmarks(results);
          }
        })
        .catch((err) => {
          // If it's an abort error, ignore; otherwise, log
          if (err.name !== 'AbortError') {
            console.error('Error in baseSearchEngine:', err);
          }
        });
    }, 300); // 300ms debounce delay

    // --- 3) Cleanup: if either the user typed again (before 300ms),
    //                or unmounted, we abort and clear the timer ---
    return () => {
      abortController.abort(); // cancel the in-flight search if any
      clearTimeout(debounceTimer);
    };
  }, [bookmarks, searchTerm, searchMode]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', padding: '1rem', height: '100%', overflow: 'auto' }}>
      <input
        type="text"
        placeholder="Search bookmarks..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="mb-4 p-2 border border-gray-300 rounded"
        ref={searchInputRef}
      />

      <div style={{ marginBottom: '1rem', display: 'flex', gap: '0.5rem' }}>
        <button
          onClick={() => setSearchMode('exact')}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: searchMode === 'exact' ? '#007BFF' : '#ccc',
            color: searchMode === 'exact' ? '#fff' : '#000',
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
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          AI
        </button>
      </div>

      <div className="custom-scrollbar" style={{ paddingLeft: '1rem', height: '100%', marginBottom: '1rem', backgroundColor: 'cyan' }}>
        <BookmarksList
          searchResults={filteredBookmarks}
          searchTerm={searchTerm}
          searchMode={searchMode}
        />
      </div>
    </div>
  );
};
