// search_test.ts

import { exact_search, ai_search, fuzzyResults } from './search_engine.js'; 
// ※ "search_engine.js" はあなたの実際のファイル名に合わせてください

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

  // 3) fuzzyResults (簡易版) を呼び出す
  //    例: "大会情ほう" と打ち間違えたようなケースを想定
  console.log("\n=== FUZZY SEARCH ===");
  const fuzzyQuery = "大会情ほう";     // 少し誤字あり
  // 第3引数 threshold=2: 編集距離が2以下を「曖昧一致」とみなす
  // 第4引数 topN=5: 上位5件
  const fuzzyMatches = await fuzzyResults(fuzzyQuery, directory, 2, 5);
  console.log("fuzzyMatches:", fuzzyMatches);

})();
