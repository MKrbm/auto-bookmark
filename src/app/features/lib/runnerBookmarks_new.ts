import { FetchedBookmark } from './fetchBookmarkTypes';
import { ChunkData } from './chunkTypes';
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
): Promise<ChunkData[]> {
  // 全てのブックマークを並列で処理
  const processBookmark = async (item: FetchedBookmark): Promise<ChunkData[]> => {
    try {
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
      const textAndVectorList = await create_vectorsMain([{
        docs: docs.map(doc => ({
          ...doc,
          page_content: `${doc.page_content}\n${item.searchStrings}` // searchStringsを本文に追加
        })),
        filename,
        userTitle
      }]);

      // 5) チャンクデータに変換
      return textAndVectorList.map(chunk => ({
        userId: item.userid,
        url: item.url,
        path: item.path,
        chunk_index: chunk.chunk_index,
        chunk_text: chunk.chunk_text,
        chunk_vector: chunk.chunk_vector
      }));
    } catch (error) {
      console.error(`Error processing bookmark ${item.url}:`, error);
      return [];
    }
  };

  // 全ブックマークを並列処理
  const allResults = await Promise.all(fetched.map(processBookmark));
  
  // 結果をフラット化
  const results = allResults.flat();

  console.log('All done (fetched bookmarks)!');
  return results;
}
