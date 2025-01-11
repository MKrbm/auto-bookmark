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
export async function exact_search(input, directory) {
    const files = fs.readdirSync(directory).filter(f => f.endsWith(".txt"));
    const results = [];
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
export async function ai_search(input, directory, topN = 10) {
    // 1) input 文 を ベクトル化
    const [embeddedInput] = await embeddingModel.embedDocuments([input]);
    // 2) vectorsディレクトリのファイルを走査
    const files = fs.readdirSync(directory).filter(f => f.endsWith(".txt"));
    let topResults = [];
    for (const file of files) {
        const filePath = path.join(directory, file);
        const { filename, customTitle, chunks } = parseVectorFile(filePath);
        for (const chunk of chunks) {
            if (chunk.vector.length !== embeddedInput.length) {
                console.warn(`Skipping invalid dimension chunk in file: ${file}`);
                continue;
            }
            // コサイン類似度計算
            const similarity = calculateCosineSimilarity(embeddedInput, chunk.vector);
            // snippetは chunk.text全部 or 先頭100文字など適宜調整
            const snippet = chunk.text.slice(0, 100);
            topResults.push({
                url: filename,
                title: customTitle,
                snippet,
                similarity,
            });
        }
    }
    // similarity 降順にソートして上位N件を返す
    topResults.sort((a, b) => b.similarity - a.similarity);
    return topResults.slice(0, topN);
}
