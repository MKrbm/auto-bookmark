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
import { OpenAIEmbeddings } from '@langchain/openai';
// === Embeddingモデルの準備 ===
const embeddingModel = new OpenAIEmbeddings({
    openAIApiKey: config.OPENAI_API_KEY,
    model: "text-embedding-3-large",
    dimensions: 1024,
});
/**
 * ベクトル文字列 "[[0.1, 0.2, ... ]]" を数値配列にパース
 */
function parseVector(vectorStr) {
    const vectorJson = JSON.parse(vectorStr);
    if (Array.isArray(vectorJson) && Array.isArray(vectorJson[0])) {
        return vectorJson[0];
    }
    throw new Error("Invalid vector format");
}
/**
 * コサイン類似度を計算
 */
function calculateCosineSimilarity(vecA, vecB) {
    const dotProduct = vecA.reduce((sum, a, idx) => sum + a * vecB[idx], 0);
    const magnitudeA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
    const magnitudeB = Math.sqrt(vecB.reduce((sum, a) => sum + a * a, 0));
    if (magnitudeA === 0 || magnitudeB === 0)
        return 0;
    return dotProduct / (magnitudeA * magnitudeB);
}
/**
 * Levenshtein Distance (編集距離) を計算するヘルパー関数
 */
function getEditDistance(a, b) {
    const dp = [];
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
            const cost = a[i - 1] === b[j - 1] ? 0 : 1;
            dp[i][j] = Math.min(dp[i - 1][j] + 1, // 削除
            dp[i][j - 1] + 1, // 挿入
            dp[i - 1][j - 1] + cost // 置換 (文字が同じならcost=0)
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
function parseVectorFile(filePath) {
    var _a, _b, _c;
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    const filename = lines[0].trim(); // 1行目
    const customTitle = ((_a = lines[1]) === null || _a === void 0 ? void 0 : _a.trim()) || ""; // 2行目(ない場合は空に)
    // 3行目以降をChunk区切りでパースする
    // "Chunk Index: x", "Text:", (テキスト内容), "Vector:", (ベクトルJSON)
    // を1チャンクと想定
    const chunks = [];
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
            const chunkText = ((_b = lines[textLineIndex]) === null || _b === void 0 ? void 0 : _b.trim()) || "";
            // 次行は "Vector:"
            // その次がベクトルJSON
            const vectorLineIndex = textLineIndex + 2;
            let vectorArray = [];
            try {
                vectorArray = parseVector(((_c = lines[vectorLineIndex]) === null || _c === void 0 ? void 0 : _c.trim()) || "");
            }
            catch (error) {
                console.error(`Failed to parse vector at chunkIndex=${chunkIndex} in file=${filePath}`, error);
            }
            chunks.push({
                index: chunkIndex,
                text: chunkText,
                vector: vectorArray,
            });
            // 1チャンク分スキップ (ここまで合計 4行 = Index / Text: / 本文 / Vector: / ベクトルJSON)
            i = vectorLineIndex + 1;
        }
        else {
            i++;
        }
    }
    return {
        filename,
        customTitle,
        chunks,
    };
}
// --- exact_search ----------------------------------------------------
/**
 * exact_search
 * - input文を完全一致(includes)で検索
 * - **同じファイル内で複数ヒットしても、1件にまとめて返す**ようにする
 *
 * @param input 検索文字列
 * @param directory vectorsディレクトリ
 * @returns
 *   {
 *     url: string;
 *     title: string;
 *     matchedStrings: string[];  // 同ファイル内の複数ヒットをまとめる
 *   }[]
 */
export async function exact_search(input, directory) {
    const files = fs.readdirSync(directory).filter(f => f.endsWith(".txt"));
    // ここでは 'url' (filename) をキーとするオブジェクトを作り、
    // 同じURLなら matchedStrings[] に追記して1件にまとめる
    const resultsMap = {};
    for (const file of files) {
        const filePath = path.join(directory, file);
        const { filename, customTitle, chunks } = parseVectorFile(filePath);
        let foundAny = false;
        let matchedSet = new Set();
        // 1) まずタイトルが完全一致するかチェック
        if (customTitle === input) {
            matchedSet.add(customTitle);
            foundAny = true;
        }
        // 2) 各 chunk text に対して exact match
        for (const chunk of chunks) {
            if (chunk.text.includes(input)) {
                matchedSet.add(input);
                foundAny = true;
            }
        }
        // 3) もし一つでもマッチがあれば resultsMap に登録
        if (foundAny) {
            // 既に resultsMap に同じURLがあれば title の上書き or 追記
            if (!resultsMap[filename]) {
                resultsMap[filename] = {
                    title: customTitle,
                    matchedStrings: matchedSet,
                };
            }
            else {
                // もし同じファイルを再度マッチした場合、matchedStrings を合成
                for (const m of matchedSet) {
                    resultsMap[filename].matchedStrings.add(m);
                }
            }
        }
    }
    // 4) 結果を配列化して返す
    const resultArray = Object.entries(resultsMap).map(([url, data]) => ({
        url,
        title: data.title,
        matchedStrings: Array.from(data.matchedStrings), // Set -> 配列に変換
    }));
    // 必要に応じてソートなど行う
    return resultArray;
}
// =====================  ai_search 関数  =====================
/**
 * ai_search
 * - input を Embedding して、各 chunk.vector とのコサイン類似度を計算
 * - 上位 n 個の { url, title, snippet, similarity } を返す
 */
export async function ai_search(input, directory, topN = 10) {
    // 1) input 文 を ベクトル化
    const [embeddedInput] = await embeddingModel.embedDocuments([input]);
    // vectorsディレクトリ内のファイル一覧を取得
    const files = fs.readdirSync(directory).filter(f => f.endsWith(".txt"));
    // 一時的に「ファイル単位での maxSimilarity と そのチャンク情報」を格納するマップ
    // キー: filename(URL整形), 値: { title, snippet, similarity }
    const fileBest = {};
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
 *   ファイル内で最小のdistanceを記録(= 最も曖昧一致が高いチャンク) として扱う。
 * - 全ファイルを通して distance 昇順に並べ、上位n件返す。
 *
 * 【注意】本格的なFuzzy Searchには Fuse.jsなどのライブラリを使用するほうが良いです。
 *         以下は概念実装です。
 */
export async function fuzzyResults(input, directory, threshold = 3, // どの程度までを "曖昧一致" とみなすか
topN = 10 // 返す上限数
) {
    // 1) vectors ディレクトリ内の .txt ファイルを取得
    const files = fs.readdirSync(directory).filter(f => f.endsWith(".txt"));
    // 2) ファイル単位で「最小distance」を格納するマップ
    //    { [filename]: { title, snippet, distance } }
    const fileBest = {};
    for (const file of files) {
        const filePath = path.join(directory, file);
        const { filename, customTitle, chunks } = parseVectorFile(filePath);
        // このファイル(=URL) における "最小distance" とその snippet
        let bestDistance = Infinity;
        let bestSnippet = "";
        // 3) 各チャンクに対して
        for (const chunk of chunks) {
            // チャンク全文を単語に分割
            const words = chunk.text.split(/\s+/);
            // 「最も近い単語の編集距離」を調べる
            let minDistanceInChunk = Infinity;
            for (const word of words) {
                const dist = getEditDistance(input.toLowerCase(), word.toLowerCase());
                if (dist < minDistanceInChunk) {
                    minDistanceInChunk = dist;
                    if (minDistanceInChunk === 0)
                        break; // 完全一致なら早期終了
                }
            }
            // もしこのチャンクの最小distanceが従来の bestDistance より小さければ更新
            if (minDistanceInChunk < bestDistance) {
                bestDistance = minDistanceInChunk;
                bestSnippet = chunk.text.slice(0, 100); // 先頭100文字
            }
        }
        // 4) 閾値以下なら「曖昧一致がある」とみなして登録
        if (bestDistance <= threshold && bestDistance < Infinity) {
            fileBest[filename] = {
                title: customTitle,
                snippet: bestSnippet,
                distance: bestDistance,
            };
        }
    }
    // 5) fileBest を配列化 & distance 昇順で並べ、上位 n件を返す
    const results = Object.entries(fileBest).map(([url, data]) => ({
        url,
        title: data.title,
        snippet: data.snippet,
        distance: data.distance,
    }));
    results.sort((a, b) => a.distance - b.distance);
    return results.slice(0, topN);
}
