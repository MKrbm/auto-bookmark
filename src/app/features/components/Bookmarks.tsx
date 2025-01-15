// Bookmarks.tsx
// Main component that fetches bookmarks, filters them, and renders BookmarksList.

import React, { useEffect, useState } from 'react';
import { BookmarksList } from './BookmarksList';
import { flattenBookmarks } from '../lib/utils';
import { Bookmark } from '../lib/types';
import '../styles/highlight.css';

export const Bookmarks: React.FC = () => {
  const [bookmarks, setBookmarks] = useState<{ [url: string]: Bookmark }>({});
  const [searchTerm, setSearchTerm] = useState('');

  // Example fetch function that uses chrome.runtime API to get bookmarks
  // In your actual code, ensure you have the right permissions and context
  const fetchBookmarks = () => {
    chrome.runtime.sendMessage({ action: 'fetchBookmarks' }, (response) => {
      if (response && response.bookmarks) {
        setBookmarks(flattenBookmarks(response.bookmarks));
      }
    });
  };

  // Optionally call fetchBookmarks on mount
  // useEffect(() => {
  //   fetchBookmarks();
  // }, []);

  // Filter the bookmarks by matching the searchTerm in the entire path
  const filteredBookmarks = Object.values(bookmarks).filter((bookmark) =>
    bookmark.path.toString().toLowerCase().includes(searchTerm.toLowerCase())
  );

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
        <BookmarksList bookmarks={filteredBookmarks} searchTerm={searchTerm} />
      </div>
    </div>
  );
};
