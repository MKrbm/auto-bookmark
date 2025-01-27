// runnerBookmarks.ts

import { Bookmark } from './bookmarkTypes.js';
import scrapeMain from './scrape.js';
import { create_vectorsMain } from './create_vectors.js';

/**
 * URLを安全なファイル名に変換
 * - ファイル操作自体はしないが、識別用キーとして使う
 */
function urlToFilename(url: string): string {
  return url.replace(/[^a-z0-9]/gi, '_').toLowerCase();
}

/**
 * Bookmark配列を受け取り、スクレイピング＆ベクトル化した結果を返す
 * userId, url, path, chunk_index, chunk_strings, chunk_vector を含むオブジェクト配列
 */
export async function processBookmarks(
  bookmarks: Bookmark[]
): Promise<{
  userId: string;
  url: string;
  path: Bookmark['path'];
  chunk_index: number;
  chunk_strings: string;
  chunk_vector: number[];
}[]> {
  const results: {
    userId: string;
    url: string;
    path: Bookmark['path'];
    chunk_index: number;
    chunk_strings: string;
    chunk_vector: number[];
  }[] = [];

  for (const bm of bookmarks) {
    // 1) userTitle を決定 (path.segments の最後, なければ path.name)
    const segments = bm.path.segments;
    const userTitle = segments.length > 0
      ? segments[segments.length - 1]
      : bm.path.name;

    // 2) URLをファイル名に変換 (識別用キーとして使用)
    const filename = urlToFilename(bm.url);

    // 3) スクレイピング
    const docs = await scrapeMain([bm.url], userTitle);

    // 4) ベクトル生成 (チャンク情報を受け取る)
    const textAndVectorList = await create_vectorsMain(docs, filename, userTitle);

    // 5) 合体して results に push
    for (const item of textAndVectorList) {
      results.push({
        userId: bm.id,
        url: bm.url,
        path: bm.path,
        chunk_index: item.chunk_index,
        chunk_strings: item.chunk_text,
        chunk_vector: item.chunk_vector,
      });
    }
  }

  console.log('All done!');
  return results;
}
