import { baseSearchEngine } from '../baseSearchEngine';
import { Bookmark } from '../../lib/types';
import { SearchMode } from '../baseSearchEngine';
import { createPath } from '../../lib/path';

describe('AI-based bookmark search tests (30 queries)', () => {
  // 12個のBookmark (英語10 + 日本語2)
  const mockBookmarks: Bookmark[] = [
    {
      id: "b001",
      url: "https://example.com/rust-vs-cpp",
      path: createPath(["Root","Engineering","Engineering Folder"]),
      searchString:
        "A detailed comparison of Rust and C++ covering memory safety, concurrency, advanced generics, zero-cost abstractions, and performance benchmarks in HPC environments. Explores how modern language design influences developer productivity."
    },
    {
      id: "b002",
      url: "https://example.com/stock-market-basics",
      path: createPath(["Root","Investing Topics","Finance Folder"]),
      searchString:
        "Comprehensive introduction to stock markets, including fundamental analysis, technical signals, day trading strategies, portfolio diversification, and value investing. Perfect for novice or intermediate investors seeking stable long-term growth."
    },
    {
      id: "b003",
      url: "https://example.com/dog-grooming-tips",
      path: createPath(["Root","Animal Care","Pets Folder"]),
      searchString:
        "Essential dog grooming knowledge with coat care, bathing guidelines, safe nail trimming, and recommended schedules for various breeds. Also covers how to handle anxious dogs during grooming sessions."
    },
    {
      id: "b004",
      url: "https://example.com/football-match-result",
      path: createPath(["Root","Sports News","Sports Folder"]),
      searchString:
        "Extensive coverage of football match results from the Premier League, analyzing player performance, manager tactics, and goal statistics for the latest fixtures. Includes expert commentary on top scorers and defensive strategies."
    },
    {
      id: "b005",
      url: "https://example.com/weather-forecast-local",
      path: createPath(["Root","Daily Info","Weather Updates"]),
      searchString:
        "Accurate local weather forecast data, incorporating temperature changes, precipitation probability, wind speed predictions, and climate patterns. Helps readers plan outdoor activities effectively."
    },
    {
      id: "b006",
      url: "https://example.com/yoga-beginner-guide",
      path: createPath(["Root","Lifestyle","Health & Wellness"]),
      searchString:
        "A beginner-friendly yoga guide that covers basic asanas, correct breathing techniques, mindfulness practices, and stress relief routines. Includes safety tips and sample sequences for daily practice."
    },
    {
      id: "b007",
      url: "https://example.com/ml-intro",
      path: createPath(["Root","AI & Machine Learning","Engineering Folder"]),
      searchString:
        "Introduction to machine learning concepts, including supervised and unsupervised methods, neural network fundamentals, and real-world applications. Also explores ethical considerations in AI deployment."
    },
    {
      id: "b008",
      url: "https://example.com/eu-travel-tips",
      path: createPath(["Root","Leisure","Travel Folder"]),
      searchString:
        "Travel tips for visiting multiple European countries on a budget, focusing on rail passes, cultural highlights, local cuisines, and cost-saving hacks for accommodation and city transport."
    },
    {
      id: "b009",
      url: "https://example.com/advanced-cooking-techniques",
      path: createPath(["Root","Gastronomy","Cooking Folder"]),
      searchString:
        "Advanced cooking methods such as sous-vide, molecular gastronomy basics, plating presentations, and flavor pairing for aspiring chefs. Provides step-by-step recipes to elevate culinary skills."
    },
    {
      id: "b010",
      url: "https://example.com/sports-nutrition-guide",
      path: createPath(["Root","Health","Sports Folder"]),
      searchString:
        "A sports nutrition guide for athletes detailing optimal protein intake, carbohydrate loading protocols, hydration strategies, and recovery supplements. Useful for improving endurance and muscle strength."
    },
    // 日本語Bookmark
    {
      id: "b011",
      url: "https://example.com/konnichiwa-nihongo",
      path: createPath(["ルート","日本語","挨拶"]),
      searchString:
        "こんにちは 世界。日本語のサンプルテキストであり、RustやC++などの技術要素は含まれていません。挨拶や自己紹介などの日常的なフレーズを中心に解説します。"
    },
    {
      id: "b012",
      url: "https://example.com/sports-jp",
      path: createPath(["ルート","日本語","スポーツ"]),
      searchString:
        "プレミアリーグの試合結果や選手の活躍、最新のサッカー情報を日本語で紹介。得点ランキングや守備面などの詳細な分析を含むスポーツ総合記事。"
    },
  ];

  // 30件のテストケース
  const testCases = [
    // 1) 
    {
      name: "Engineering short",
      searchTerm: "rust concurrency",
      expectedTopIDs: ["b001","b007"]
    },
    // 2)
    {
      name: "C++ HPC",
      searchTerm: "c++ HPC",
      expectedTopIDs: ["b001"]
    },
    // 3)
    {
      name: "Pets grooming nails",
      searchTerm: "dog nails grooming",
      expectedTopIDs: ["b003"]
    },
    // 4)
    {
      name: "Finance investing",
      searchTerm: "stock investing",
      expectedTopIDs: ["b002"]
    },
    // 5)
    {
      name: "Yoga stress relief",
      searchTerm: "yoga stress",
      expectedTopIDs: ["b006"]
    },
    // 6)
    {
      name: "Weather local short",
      searchTerm: "weather local",
      expectedTopIDs: ["b005"]
    },
    // 7)
    {
      name: "Machine learning ethics",
      searchTerm: "ML ethics",
      expectedTopIDs: ["b007"]
    },
    // 8)
    {
      name: "Travel budget EU",
      searchTerm: "europe travel budget",
      expectedTopIDs: ["b008"]
    },
    // 9)
    {
      name: "Cooking molecular",
      searchTerm: "molecular cooking",
      expectedTopIDs: ["b009"]
    },
    // 10)
    {
      name: "Sports nutrition",
      searchTerm: "sports nutrition",
      expectedTopIDs: ["b010"]
    },
    // 11)
    {
      name: "Japanese greet",
      searchTerm: "日本語 挨拶",
      expectedTopIDs: ["b011"]
    },
    // 12)
    {
      name: "Rustの性能 C++",
      searchTerm: "Rustの性能 C++",
      expectedTopIDs: ["b001"]
    },
    // 13)
    {
      name: "premier league sports (English->JP)",
      searchTerm: "premier league sports",
      expectedTopIDs: ["b012"]
    },
    // 14)
    {
      name: "anxious dog grooming",
      searchTerm: "anxious dog grooming",
      expectedTopIDs: ["b003"]
    },
    // 15)
    {
      name: "rail passes highlight",
      searchTerm: "rail passes highlight",
      expectedTopIDs: ["b008"]
    },
    // 16)
    {
      name: "sous-vide cooking",
      searchTerm: "sous-vide cooking",
      expectedTopIDs: ["b009"]
    },
    // 17)
    {
      name: "day trading signals",
      searchTerm: "day trading signals",
      expectedTopIDs: ["b002"]
    },
    // 18)
    {
      name: "machine learning real-world",
      searchTerm: "machine learning real-world",
      expectedTopIDs: ["b007"]
    },
    // 19)
    {
      name: "beginner yoga safety",
      searchTerm: "beginner yoga safety",
      expectedTopIDs: ["b006"]
    },
    // 20)
    {
      name: "football analysis short",
      searchTerm: "football analysis",
      expectedTopIDs: ["b004"]
    },
    // 21)
    {
      name: "日本語 Rustは含みませんか？",
      searchTerm: "Rust 含む？",
      expectedTopIDs: ["b001","b011"], 
      // b001にはRustあるがb011には「含まれない」と書いてる→微妙？
      // とりあえずb001を想定
    },
    // 22)
    {
      name: "サッカー プレミア",
      searchTerm: "サッカー プレミア",
      expectedTopIDs: ["b012"]
    },
    // 23)
    {
      name: "health protein",
      searchTerm: "health protein",
      expectedTopIDs: ["b010","b006"]
    },
    // 24)
    {
      name: "cultural highlights travel",
      searchTerm: "cultural highlights travel",
      expectedTopIDs: ["b008"]
    },
    // 25)
    {
      name: "molecular plating recipes",
      searchTerm: "molecular plating recipes",
      expectedTopIDs: ["b009"]
    },
    // 26)
    {
      name: "ethical AI concepts",
      searchTerm: "ethical AI",
      expectedTopIDs: ["b007"]
    },
    // 27)
    {
      name: "local wind speed climate",
      searchTerm: "local wind speed climate",
      expectedTopIDs: ["b005"]
    },
    // 28)
    {
      name: "dog breed differences",
      searchTerm: "dog breed differences",
      expectedTopIDs: ["b003"]
    },
    // 29)
    {
      name: "C++ generics HPC",
      searchTerm: "c++ generics HPC",
      expectedTopIDs: ["b001"]
    },
    // 30)
    {
      name: "英語で挨拶",
      searchTerm: "english greeting",
      expectedTopIDs: ["b011"], 
      // ここは無理やり"b011"を期待(失敗するかも)
    },
  ];

  for (const tc of testCases) {
    it(`(AI) ${tc.name}`, async () => {
      // 実行
      const results = await baseSearchEngine(mockBookmarks, tc.searchTerm, 'ai');
      // 結果が空でない
      expect(results.length).toBeGreaterThan(0);

      // 1位の情報
      const topItem = results[0];
      const topID = topItem.original.id;
      const topScore = topItem.score ?? 0;
      const topSearchString = topItem.original.searchString;

      // ログ出力
      console.log(
        `[TESTCASE] "${tc.name}"\n` +
        `  Query       : "${tc.searchTerm}"\n` +
        `  TopResultID : "${topID}" (score=${topScore.toFixed(4)})\n` +
        `  BookmarkTxt : "${topSearchString.slice(0,50)}..."  -- truncated\n`
      );

      // 順位チェック
      const passCondition = tc.expectedTopIDs.includes(topID);
      if (!passCondition) {
        console.error(
          `TestCase "${tc.name}" failed. ` +
          `Expected top ID in [${tc.expectedTopIDs.join(', ')}], ` +
          `but got "${topID}".`
        );
      }
      expect(passCondition).toBe(true);
    });
  }
});
