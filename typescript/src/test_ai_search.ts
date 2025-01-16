import { ai_search } from './ai_search.js';

(async () => {
  // 検索したい文字列
  const userQuery = "大会情報｜JSA";
  // ベクトルファイルを置いているフォルダ
  const directory = "./vectors";

  // ai_search を呼び出す (上位5件)
  console.log("\n=== AI SEARCH ===");
  const aiResults = await ai_search(userQuery, directory, 5);
  console.log("aiResults:", aiResults);
})();
