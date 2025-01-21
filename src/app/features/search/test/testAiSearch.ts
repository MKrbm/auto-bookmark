// testAiSearch.ts
import { baseSearchEngine } from './../baseSearchEngine';
import { Bookmark } from '../lib/types';
import { SearchMode } from './../baseSearchEngine';

// テスト用Bookmark
const sampleBookmarks: Bookmark[] = [
  {
    id: "book1",
    url: "https://example.com/react-hooks",
    path: {
      name: "React Hooks folder",
      parents: () => ["Root", "React Topics"],
    },
    searchString: "React Hooks tutorial for building custom hooks"
  },
  {
    id: "book2",
    url: "https://example.com/nextjs",
    path: {
      name: "Next.js folder",
      parents: () => ["Root", "React Topics"],
    },
    searchString: "Next.js guide for SSR and static export"
  },
];

(async () => {
  const searchTerm = "how to write react hooks";
  const mode: SearchMode = 'ai';

  const results = await baseSearchEngine(sampleBookmarks, searchTerm, mode);

  console.log(`=== AI Search Results for "${searchTerm}" ===`);
  results.forEach((item, i) => {
    console.log(`#${i + 1}`);
    console.log("Title :", item.highlightedTitle);
    console.log("URL   :", item.highlightedURL);
    console.log("Folder:", item.highlightedFolder);
    console.log("Context:", item.context);
    console.log("Score:", item.score);
    console.log("Original Bookmark ID:", item.original.id);
    console.log("-----");
  });
})();