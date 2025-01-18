// testExactSearchBase.ts
import { baseSearchEngine } from '../baseSearchEngine';    // パスを合わせて
import { Bookmark } from '../../src/lib/types';   
import { SearchMode } from '../baseSearchEngine';

const sampleBookmarks: Bookmark[] = [
  {
    id: '001',
    url: 'https://example.com/hello',
    path: {
      name: 'Hello Folder',
      parents: () => ['Root', 'Hello Folder'],
    },
    searchString: 'Hello World bookmark example',
  },
  {
    id: '002',
    url: 'https://example.com/test',
    path: {
      name: 'Test Folder',
      parents: () => ['Root', 'Test Folder'],
    },
    searchString: 'test something else',
  },
];

(async () => {
  // 同期関数ですが、baseSearchEngineが async のため一応 await する
  const searchTerm = 'hello world';
  const mode: SearchMode = 'exact';

  const results = await baseSearchEngine(sampleBookmarks, searchTerm, mode);

  console.log(`=== baseSearchEngine (mode='exact') Results for "${searchTerm}" ===`);
  results.forEach((res, i) => {
    console.log(`#${i + 1}`);
    console.log('Title :', res.highlightedTitle);
    console.log('URL   :', res.highlightedURL);
    console.log('Folder:', res.highlightedFolder);
    console.log('Context:', res.context);
    console.log('Original Bookmark ID:', res.original.id);
    console.log('-----');
  });
})();
