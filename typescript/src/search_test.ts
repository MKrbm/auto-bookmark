// search_test.ts
import { exact_search, ai_search } from './search_engine.js'; // 相対パスは環境に合わせて調整

(async () => {
  // 検索したい文字列
  const userQuery = "大会情報｜JSA";
  const directory = "./vectors";

  // 1) exact_search を呼び出す
  console.log("=== EXACT SEARCH ===");
  const exactResults = await exact_search(userQuery, directory);
  console.log("exactResults:", exactResults);

  // 2) ai_search を呼び出す (上位5件)
  console.log("\n=== AI SEARCH ===");
  const aiResults = await ai_search(userQuery, directory, 5);
  console.log("aiResults:", aiResults);
})();
