// runnerBookmarks.ts

import path from 'path';
import { Bookmark } from './bookmarkTypes.js'; // (1) インターフェースをimport
import scrapeMain from './scrape.js';          // (2) スクレイプ関数
import create_vectorsMain from './create_vectors.js'; // (3) ベクトル化関数

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
    // 1) userTitle: path.segmentsの最後、無い場合は path.name
    const segments = bm.path.segments;
    let userTitle = (segments.length > 0)
      ? segments[segments.length - 1]
      : bm.path.name;  // もし segments が空なら name を代わりに使う

    // 2) url を ファイル名に
    const filename = urlToFilename(bm.url);

    // 3) スクレイピング → scraped_docs/filename.json
    const outputFilePath = path.resolve('./scraped_docs', `${filename}.json`);
    await scrapeMain([bm.url], userTitle, outputFilePath);

    // 4) ベクトル化 → vectors/filename_vector.txt
    await create_vectorsMain(filename, userTitle);
  }

  console.log('All done!');
}
