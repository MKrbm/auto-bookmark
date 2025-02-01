// Bookmarks.tsx
import React, { useEffect, useState, useRef } from 'react';
import { processFetchedBookmarks } from '../lib/runnerBookmarks_new';
import { FetchedBookmark } from '../lib/fetchBookmarkTypes';
import { SearchMode } from '../lib/HighlightMatches';
import { BookmarksList } from './BookmarksList';
import { flattenBookmarks } from '../lib/utils';
import { Bookmark } from '../lib/types';
import { baseSearchEngine, SearchResultItem } from '../search/baseSearchEngine';
import { ChunkData } from '../lib/chunkTypes';
import { aiSearchRepresentative } from '../search/aiSearchRepresentative';
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

    try {
      // まずブックマークを取得
      const fetchedData = await new Promise<FetchedBookmark[]>((resolve) => {
        chrome.runtime.sendMessage({ action: 'syncBookmarks' }, (response) => {
          if (response.success && response.fetchedBookmarks) {
            resolve(response.fetchedBookmarks);
          } else {
            throw new Error(response.error || 'Failed to fetch bookmarks');
          }
        });
      });

      // processFetchedBookmarksで処理
      const processedChunks = await processFetchedBookmarks(fetchedData);
      
      // 処理結果をストレージに保存
      await chrome.storage.local.set({ chunkData: processedChunks });
      
      // 状態を更新
      setChunkData(processedChunks);
      
    } catch (error) {
      console.error('Sync error:', error);
      setSyncError(error instanceof Error ? error.message : 'An error occurred during sync');
    } finally {
      setIsSyncing(false);
    }
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
          // AIモードの場合はaiSearchRepresentativeを使用
          const representativeResults = await aiSearchRepresentative(searchTerm, chunkData, 5, abortController.signal);
          
          // RepresentativeSearchResultをSearchResultItemに変換
          results = representativeResults.map(result => ({
            highlightedTitle: result.title,
            highlightedURL: result.url,
            highlightedFolder: result.path.segments.join(' / '),
            context: result.snippet,
            score: result.similarity,
            original: {
              id: result.userId,
              url: result.url,
              path: createPath(result.path.segments),
              searchString: result.snippet
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
