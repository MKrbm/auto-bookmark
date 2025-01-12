// runnerBookmarks.ts

import path from 'path';
import { Bookmark } from './bookmarkTypes.js'; 
import scrapeMain from './scrape.js';          
import { create_vectorsMain } from './create_vectors.js';

/**
 * URLを安全なファイル名に変換
 */
function urlToFilename(url: string): string {
  return url.replace(/[^a-z0-9]/gi, '_').toLowerCase();
}

/**
 * Bookmark配列を受け取り、スクレイピング＆ベクトル化
 */
export async function processBookmarks(bookmarks: Bookmark[]) {
  for (const bm of bookmarks) {
    // 1) userTitle: path.segments の最後 or path.name
    const segments = bm.path.segments;
    let userTitle = (segments.length > 0)
      ? segments[segments.length - 1]
      : bm.path.name;

    // 2) URLをファイル名に
    const filename = urlToFilename(bm.url);

    // 3) スクレイピング(メモリ上で Document[] を受け取る)
    const docs = await scrapeMain([bm.url], userTitle);

    // 4) ベクトル化 (メモリ上のdocsとfilename, userTitleを渡す)
    await create_vectorsMain(docs, filename, userTitle);
  }

  console.log('All done!');
}
