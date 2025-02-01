import { FetchedBookmark } from './fetchBookmarkTypes';
import scrapeMain from './scrape';
import { create_vectorsMain } from './create_vectors';

function urlToFilename(url: string): string {
  return url.replace(/[^a-z0-9]/gi, '_').toLowerCase();
}

/**
 * FetchedBookmark配列を受け取り、スクレイピング＆ベクトル化した結果を返す
 *  - userId, url, path, chunk_index, chunk_strings, chunk_vector
 */
export async function processFetchedBookmarks(
  fetched: FetchedBookmark[]
): Promise<{
  userId: string;
  url: string;
  path: FetchedBookmark["path"];
  chunk_index: number;
  chunk_strings: string;
  chunk_vector: number[];
}[]> {
  const results: {
    userId: string;
    url: string;
    path: FetchedBookmark['path'];
    chunk_index: number;
    chunk_strings: string;
    chunk_vector: number[];
  }[] = [];

  for (const item of fetched) {
    // 1) userTitle: pathの末尾 or path.name
    const segments = item.path.segments;
    const userTitle = segments.length > 0
      ? segments[segments.length - 1]
      : item.path.name;

    // 2) URLをファイル名に
    const filename = urlToFilename(item.url);

    // 3) スクレイピング
    const docs = await scrapeMain([item.url], userTitle);

    // 4) ベクトル化（searchStringsも含める）
    const textAndVectorList = await create_vectorsMain(
      docs.map(doc => ({
        ...doc,
        page_content: `${doc.page_content}\n${item.searchStrings}` // searchStringsを本文に追加
      })),
      filename,
      userTitle
    );

    // 5) まとめる
    for (const chunk of textAndVectorList) {
      results.push({
        userId: item.userid,
        url: item.url,
        path: item.path,
        chunk_index: chunk.chunk_index,
        chunk_strings: chunk.chunk_text,
        chunk_vector: chunk.chunk_vector
      });

      // LocalStorageに保存（キーはURL_チャンク番号）
      const storageKey = `${item.url}_${chunk.chunk_index}`;
      localStorage.setItem(storageKey, JSON.stringify({
        userId: item.userid,
        url: item.url,
        path: item.path,
        chunk_index: chunk.chunk_index,
        chunk_strings: chunk.chunk_text,
        chunk_vector: chunk.chunk_vector
      }));
    }
  }

  console.log('All done (fetched bookmarks)!');
  return results;
}
