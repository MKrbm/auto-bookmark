/**
 * searchFunctions.ts
 *
 * 以下のような構成を想定：
 * - vectors/配下に "xxxx_vector.txt" というファイルがあり、
 *   1行目: filename(例: https___squash_or_jp_game_)
 *   2行目: custom title（ユーザーがブックマーク時に付けた想定）
 *   以降、Chunk単位で以下パターンが繰り返される：
 *     例)
 *     Chunk Index: 0
 *     Text:
 *     ...ここにテキスト...
 *     Vector:
 *     [[ 0.0319, 0.0277, ... ]]
 */

import fs from 'fs';
import path from 'path';
import { config } from './config.js';
import { OpenAI } from '@langchain/openai';
import { OpenAIEmbeddings } from '@langchain/openai';
import * as tf from '@tensorflow/tfjs'; // （現状は未使用なら消してもOK）

// === Embeddingモデルの準備 ===
const embeddingModel = new OpenAIEmbeddings({
  openAIApiKey: config.OPENAI_API_KEY,
  model: "text-embedding-3-large",
  dimensions: 1024,
});

/** 
 * ベクトル文字列 "[[0.1, 0.2, ... ]]" を数値配列にパース
 */
function parseVector(vectorStr: string): number[] {
  const vectorJson = JSON.parse(vectorStr);
  if (Array.isArray(vectorJson) && Array.isArray(vectorJson[0])) {
    return vectorJson[0];
  }
  throw new Error("Invalid vector format");
}

/**
 * コサイン類似度を計算
 */
function calculateCosineSimilarity(vecA: number[], vecB: number[]): number {
  const dotProduct = vecA.reduce((sum, a, idx) => sum + a * vecB[idx], 0);
  const magnitudeA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
  const magnitudeB = Math.sqrt(vecB.reduce((sum, a) => sum + a * a, 0));
  if (magnitudeA === 0 || magnitudeB === 0) return 0;
  return dotProduct / (magnitudeA * magnitudeB);
}

/**
 * Levenshtein Distance (編集距離) を計算するヘルパー関数
 */
function getEditDistance(a: string, b: string): number {
  const dp: number[][] = [];
  const lenA = a.length;
  const lenB = b.length;

  // dp配列の初期化
  for (let i = 0; i <= lenA; i++) {
    dp[i] = [];
    for (let j = 0; j <= lenB; j++) {
      dp[i][j] = 0;
    }
  }

  // 初期条件
  for (let i = 0; i <= lenA; i++) {
    dp[i][0] = i; 
  }
  for (let j = 0; j <= lenB; j++) {
    dp[0][j] = j;
  }

  // DPで編集距離を計算
  for (let i = 1; i <= lenA; i++) {
    for (let j = 1; j <= lenB; j++) {
      const cost = a[i-1] === b[j-1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i-1][j] + 1,    // 削除
        dp[i][j-1] + 1,    // 挿入
        dp[i-1][j-1] + cost // 置換 (文字が同じならcost=0)
      );
    }
  }
  return dp[lenA][lenB];
}


/**
 * ある .txt ファイル（1つのURLに対応）をパースして
 *  - filename(URL整形版)
 *  - customTitle(ユーザーがつけたカスタムタイトル)
 *  - chunks[]: { index, text, vector }
 *  を取得する関数
 */
function parseVectorFile(filePath: string) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  
  const filename = lines[0].trim();           // 1行目
  const customTitle = lines[1]?.trim() || ""; // 2行目(ない場合は空に)

  // 3行目以降をChunk区切りでパースする
  // "Chunk Index: x", "Text:", (テキスト内容), "Vector:", (ベクトルJSON)
  // を1チャンクと想定
  const chunks: Array<{ index: number; text: string; vector: number[] }> = [];
  
  let i = 2; // 3行目から開始
  while (i < lines.length) {
    // チャンクが "Chunk Index: x" から始まるかチェック
    if (lines[i].startsWith("Chunk Index:")) {
      const idxLine = lines[i];
      const chunkIndexMatch = idxLine.match(/Chunk Index:\s*(\d+)/);
      const chunkIndex = chunkIndexMatch ? parseInt(chunkIndexMatch[1], 10) : -1;
      
      // 次行は "Text:" のはず
      // その次が実際のテキスト
      const textLineIndex = i + 2; 
      const chunkText = lines[textLineIndex]?.trim() || "";
      
      // 次行は "Vector:"
      // その次がベクトルJSON
      const vectorLineIndex = textLineIndex + 2; 
      let vectorArray: number[] = [];
      try {
        vectorArray = parseVector(lines[vectorLineIndex]?.trim() || "");
      } catch (error) {
        console.error(`Failed to parse vector at chunkIndex=${chunkIndex} in file=${filePath}`, error);
      }
      
      chunks.push({
        index: chunkIndex,
        text: chunkText,
        vector: vectorArray,
      });
      
      // 1チャンク分スキップ (ここまで合計 4行 = Index / Text: / 本文 / Vector: / ベクトルJSON)
      i = vectorLineIndex + 1;
    } else {
      i++;
    }
  }
  
  return {
    filename,
    customTitle,
    chunks,
  };
}

// =====================  exact_search 関数  =====================
/**
 * exact_search
 * - input文を完全一致で検索（テキスト or customTitle が match するか）
 * - matchした場合、URL / タイトル / マッチした文字列(あるいはテキスト前後) などを返す
 * 
 * @param input 検索文字列
 * @param directory vectorsディレクトリ
 * @returns  { url, title, matchedString }[] のリスト
 */
export async function exact_search(
  input: string,
  directory: string
): Promise<Array<{ url: string; title: string; matchedString: string }>> {
  const files = fs.readdirSync(directory).filter(f => f.endsWith(".txt"));
  const results: Array<{ url: string; title: string; matchedString: string }> = [];
  
  for (const file of files) {
    const filePath = path.join(directory, file);
    const { filename, customTitle, chunks } = parseVectorFile(filePath);

    // 1) タイトルが完全一致する場合
    if (customTitle === input) {
      results.push({
        url: filename,
        title: customTitle,
        matchedString: customTitle, // タイトル全文をそのまま返す例
      });
      // 要件次第で「タイトル合致したらチャンク検索せずに continue」でもOK
    }

    // 2) 各 chunk text に対して exact match (inputを含むかどうか)
    for (const chunk of chunks) {
      if (chunk.text.includes(input)) {
        // 前後文脈を抜き出したい場合は substring や slice で調整可
        // 例: 前後30文字を抜粋するなど
        const matchedString = input;
        results.push({
          url: filename,
          title: customTitle,
          matchedString,
        });
      }
    }
  }

  return results;
}

// =====================  ai_search 関数  =====================
/**
 * ai_search
 * - input を Embedding して、各 chunk.vector とのコサイン類似度を計算
 * - 上位 n 個の { url, title, snippet, similarity } を返す
 */
export async function ai_search(
  input: string,
  directory: string,
  topN: number = 10
): Promise<Array<{ url: string; title: string; snippet: string; similarity: number }>> {
  // 1) input 文 を ベクトル化
  const [embeddedInput] = await embeddingModel.embedDocuments([input]);
  
  // vectorsディレクトリ内のファイル一覧を取得
  const files = fs.readdirSync(directory).filter(f => f.endsWith(".txt"));

  // 一時的に「ファイル単位での maxSimilarity と そのチャンク情報」を格納するマップ
  // キー: filename(URL整形), 値: { title, snippet, similarity }
  const fileBest: Record<string, { title: string; snippet: string; similarity: number }> = {};

  for (const file of files) {
    const filePath = path.join(directory, file);
    const { filename, customTitle, chunks } = parseVectorFile(filePath);

    // 初期値として "similarity = -Infinity" などにしておく
    let bestSimilarity = -Infinity;
    let bestSnippet = "";
    
    for (const chunk of chunks) {
      if (chunk.vector.length !== embeddedInput.length) {
        console.warn(`Skipping invalid dimension chunk in file: ${file}`);
        continue;
      }
      // コサイン類似度計算
      const similarity = calculateCosineSimilarity(embeddedInput, chunk.vector);

      if (similarity > bestSimilarity) {
        bestSimilarity = similarity;
        bestSnippet = chunk.text.slice(0, 100); // 先頭100文字など
      }
    }

    // ファイル内で最も類似度が高い chunk を代表値としてセット
    if (bestSimilarity > -Infinity) {
      fileBest[filename] = {
        title: customTitle,
        snippet: bestSnippet,
        similarity: bestSimilarity,
      };
    }
  }

  // 2) fileBest の値たちを配列化して、similarity 降順にソート
  const results = Object.entries(fileBest).map(([url, data]) => ({
    url,
    title: data.title,
    snippet: data.snippet,
    similarity: data.similarity,
  }));
  
  // similarity 降順で sort
  results.sort((a, b) => b.similarity - a.similarity);

  // 上位 topN を返す
  return results.slice(0, topN);
}

// =====================  fuzzyResults 関数  =====================
/**
 * fuzzyResults (簡易版)
 * - input と各チャンク(の単語)との「編集距離(Levenshtein Distance)」を計算し、
 *   一定の閾値以下であれば「曖昧一致」とみなす。
 * - 曖昧一致したチャンクをリストアップし、distance 昇順で上位 n 件返す。
 * 
 * 【注意】本格的なFuzzy Searchには Fuse.jsなどのライブラリを使用するほうが良いです。
 *         以下は概念実装です。
 */
export async function fuzzyResults(
  input: string,
  directory: string,
  threshold: number = 3,  // どの程度までを "曖昧一致" とみなすか (小さいほど厳密)
  topN: number = 10       // 返す上限数
): Promise<Array<{
  url: string;
  title: string;
  snippet: string;
  distance: number; 
}>> {
  const files = fs.readdirSync(directory).filter(f => f.endsWith(".txt"));
  const results: Array<{
    url: string;
    title: string;
    snippet: string;
    distance: number;
  }> = [];

  for (const file of files) {
    const filePath = path.join(directory, file);
    const { filename, customTitle, chunks } = parseVectorFile(filePath);

    for (const chunk of chunks) {
      // チャンク全文を単語に分割
      const words = chunk.text.split(/\s+/);
      
      // 「最も近い単語の編集距離」を調べる
      let minDistance = Infinity;
      for (const word of words) {
        const dist = getEditDistance(input.toLowerCase(), word.toLowerCase());
        if (dist < minDistance) {
          minDistance = dist;
          // 完全一致なら早期終了しても良い
          if (minDistance === 0) break;
        }
      }

      // minDistance が閾値以下なら「曖昧一致」とみなす
      if (minDistance <= threshold) {
        // snippet はチャンク冒頭100文字を例示
        const snippet = chunk.text.slice(0, 100);
        results.push({
          url: filename,
          title: customTitle,
          snippet,
          distance: minDistance,
        });
      }
    }
  }

  // distance (編集距離) 昇順に並べ、上位N件を返す
  results.sort((a, b) => a.distance - b.distance);
  return results.slice(0, topN);
}
