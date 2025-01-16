import fs from 'fs';
import path from 'path';
import { config } from './config.js';
import { OpenAIEmbeddings } from '@langchain/openai';
// ===================== Embeddingモデルの準備 =====================
const embeddingModel = new OpenAIEmbeddings({
    openAIApiKey: config.OPENAI_API_KEY,
    model: "text-embedding-3-large",
    dimensions: 1024,
});
/**
 * ベクトル文字列 "[[0.1, 0.2, ... ]]" を数値配列にパースする関数
 */
function parseVector(vectorStr) {
    const vectorJson = JSON.parse(vectorStr);
    if (Array.isArray(vectorJson) && Array.isArray(vectorJson[0])) {
        // "[[0.1, 0.2, ...]]" のように二重配列になっている前提
        return vectorJson[0];
    }
    throw new Error("Invalid vector format");
}
/**
 * 指定ファイル(.txt)をパースし、以下を取得する
 *   - filename (URL整形版)
 *   - customTitle (ユーザーがつけたカスタムタイトル)
 *   - chunks[]: { index, text, vector }
 */
function parseVectorFile(filePath) {
    var _a, _b, _c, _d;
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    const filename = ((_a = lines[0]) === null || _a === void 0 ? void 0 : _a.trim()) || ""; // 1行目
    const customTitle = ((_b = lines[1]) === null || _b === void 0 ? void 0 : _b.trim()) || ""; // 2行目 (ない場合は空)
    // 3行目以降を Chunk 区切りでパース
    // "Chunk Index: x" → 次の行 "Text:" → 本文 → 次の行 "Vector:" → ベクトルJSON
    const chunks = [];
    let i = 2; // 3行目スタート
    while (i < lines.length) {
        if (lines[i].startsWith("Chunk Index:")) {
            // 例: "Chunk Index: 0"
            const chunkIndexMatch = lines[i].match(/Chunk Index:\s*(\d+)/);
            const chunkIndex = chunkIndexMatch ? parseInt(chunkIndexMatch[1], 10) : -1;
            // "Text:" の行をスキップして次が本文
            const textLineIndex = i + 2;
            const chunkText = ((_c = lines[textLineIndex]) === null || _c === void 0 ? void 0 : _c.trim()) || "";
            // "Vector:" の行をスキップして次がベクトルJSON
            const vectorLineIndex = textLineIndex + 2;
            let vectorArray = [];
            try {
                vectorArray = parseVector(((_d = lines[vectorLineIndex]) === null || _d === void 0 ? void 0 : _d.trim()) || "");
            }
            catch (error) {
                console.error(`Failed to parse vector at chunkIndex=${chunkIndex} in file=${filePath}`, error);
            }
            chunks.push({
                index: chunkIndex,
                text: chunkText,
                vector: vectorArray,
            });
            // 次のチャンクへ進む（Chunk Index～Vectorまで合計4行を消費する）
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
/**
 * コサイン類似度を計算する関数
 */
function calculateCosineSimilarity(vecA, vecB) {
    const dotProduct = vecA.reduce((sum, a, idx) => sum + a * vecB[idx], 0);
    const magnitudeA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
    const magnitudeB = Math.sqrt(vecB.reduce((sum, a) => sum + a * a, 0));
    if (magnitudeA === 0 || magnitudeB === 0)
        return 0;
    return dotProduct / (magnitudeA * magnitudeB);
}
// =====================  ai_search 関数  =====================
/**
 * ai_search
 * - input を Embedding して、各 chunk.vector とのコサイン類似度を計算
 * - 上位 n 個の { url, title, snippet, similarity } を返す
 */
export async function ai_search(input, directory, topN = 10) {
    // 1) 検索クエリをベクトル化
    const [embeddedInput] = await embeddingModel.embedDocuments([input]);
    // 2) .txt ファイル一覧を取得
    const files = fs.readdirSync(directory).filter(f => f.endsWith(".txt"));
    // 3) ファイル単位で「最大類似度チャンク」を記録するマップを作成
    const fileBest = {};
    for (const file of files) {
        const filePath = path.join(directory, file);
        const { filename, customTitle, chunks } = parseVectorFile(filePath);
        let bestSimilarity = -Infinity;
        let bestSnippet = "";
        // 各チャンクとの類似度をチェック
        for (const chunk of chunks) {
            // ベクトル次元が違う場合はスキップ
            if (chunk.vector.length !== embeddedInput.length) {
                console.warn(`Skipping invalid dimension chunk in file: ${file}`);
                continue;
            }
            // コサイン類似度を計算
            const similarity = calculateCosineSimilarity(embeddedInput, chunk.vector);
            // 最良スコアを更新
            if (similarity > bestSimilarity) {
                bestSimilarity = similarity;
                // 先頭100文字を抜粋
                bestSnippet = chunk.text.slice(0, 100);
            }
        }
        // そのファイルで最も近いチャンクを1つだけ代表とする
        if (bestSimilarity > -Infinity) {
            fileBest[filename] = {
                title: customTitle,
                snippet: bestSnippet,
                similarity: bestSimilarity,
            };
        }
    }
    // 4) fileBest の値を配列化して、類似度の高い順にソート
    const results = Object.entries(fileBest).map(([url, data]) => ({
        url,
        title: data.title,
        snippet: data.snippet,
        similarity: data.similarity,
    }));
    results.sort((a, b) => b.similarity - a.similarity);
    // 5) 上位 topN 件を返す
    return results.slice(0, topN);
}
