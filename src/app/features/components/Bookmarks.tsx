// Bookmarks.tsx
import React, { useEffect, useState, useRef } from 'react';
import { SearchMode } from '../lib/HighlightMatches';
import { BookmarksList } from './BookmarksList';
import { flattenBookmarks } from '../lib/utils';
import { Bookmark } from '../lib/types';
import { baseSearchEngine, SearchResultItem } from '../search/baseSearchEngine';
import { ChunkData } from '../lib/chunkTypes';
import { aiSearchEngineChunks } from '../search/aiSearchEngineChunks';
import { createPath } from '../lib/path';

export const Bookmarks: React.FC = () => {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchMode, setSearchMode] = useState<SearchMode>('fuzzy');
  const [filteredBookmarks, setFilteredBookmarks] = useState<SearchResultItem[]>([]);
  const [chunkData, setChunkData] = useState<ChunkData[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);

  const searchInputRef = useRef<HTMLInputElement>(null);

  const fetchBookmarks = () => {
    chrome.runtime.sendMessage({ action: 'fetchBookmarks' }, (response) => {
      if (response && response.bookmarks) {
        setBookmarks(flattenBookmarks(response.bookmarks));
      }
    });
  };

  const syncBookmarks = async () => {
    setIsSyncing(true);
    setSyncError(null);

    chrome.runtime.sendMessage({ action: 'syncBookmarks' }, async (response) => {
      if (response.success) {
        // チャンクデータを読み込む
        const result = await chrome.storage.local.get('chunkData');
        if (result.chunkData) {
          setChunkData(result.chunkData);
        }
      } else {
        setSyncError(response.error || 'An error occurred during sync');
      }
      setIsSyncing(false);
    });
  };

  // 初期ロード時にブックマークとチャンクデータを取得
  useEffect(() => {
    fetchBookmarks();
    chrome.storage.local.get('chunkData', (result) => {
      if (result.chunkData) {
        setChunkData(result.chunkData);
      }
    });
  }, []);

  useEffect(() => {
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [searchMode]);

  useEffect(() => {
    const abortController = new AbortController();
    const debounceTimer = setTimeout(async () => {
      try {
        let results: SearchResultItem[] = [];
        
        if (searchMode === 'ai' && chunkData.length > 0) {
          // AIモードの場合はチャンクデータを使用
          const chunkResults = await aiSearchEngineChunks(chunkData, searchTerm, abortController.signal);
          
          // ChunkSearchResultをSearchResultItemに変換
          results = chunkResults.map(result => ({
            highlightedTitle: result.chunk.path.name,
            highlightedURL: result.chunk.url,
            highlightedFolder: result.chunk.path.segments.join(' / '),
            context: result.chunk.chunk_text,
            score: result.score,
            original: {
              id: result.chunk.userId,
              url: result.chunk.url,
              path: createPath(result.chunk.path.segments),
              searchString: result.chunk.chunk_text
            }
          }));
        } else {
          // その他のモードは通常の検索を使用
          results = await baseSearchEngine(bookmarks, searchTerm, searchMode, abortController.signal);
        }

        if (!abortController.signal.aborted) {
          setFilteredBookmarks(results);
        }
      } catch (err: unknown) {
        if (err instanceof Error && err.name !== 'AbortError') {
          console.error('Search error:', err);
        }
      }
    }, 100);

    return () => {
      abortController.abort();
      clearTimeout(debounceTimer);
    };
  }, [bookmarks, searchTerm, searchMode, chunkData]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', padding: '1rem', height: '100%', overflow: 'auto' }}>
      <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button
          onClick={syncBookmarks}
          disabled={isSyncing}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: isSyncing ? '#ccc' : '#28a745',
            color: '#fff',
            borderRadius: '4px',
            cursor: isSyncing ? 'not-allowed' : 'pointer',
          }}
        >
          {isSyncing ? 'syncing...' : 'sync'}
        </button>
        {syncError && <span style={{ color: 'red', fontSize: '0.8rem' }}>{syncError}</span>}
      </div>
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
