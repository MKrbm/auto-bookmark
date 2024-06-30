import { OpenAI } from '@langchain/openai';
import { OpenAIEmbeddings } from "@langchain/openai";
import { config } from './config.js';
import fs from 'fs';
import path from 'path';
import cosineSimilarity from 'cosine-similarity';
// OpenAI APIの設定
const llm = new OpenAI({
    apiKey: config.OPENAI_API_KEY,
});
// OpenAIEmbeddingsの初期化
const embedding_model = new OpenAIEmbeddings({
    openAIApiKey: config.OPENAI_API_KEY,
    model: "text-embedding-3-large",
    dimensions: 1024,
});
// 文字列をベクトル化する関数
async function getEmbeddingVector(sentence) {
    const embedding = await embedding_model.embedDocuments([sentence]);
    return embedding[0];
}
// ベクトルの文字列を配列に変換する関数
function parseVector(vectorStr) {
    return vectorStr.split(',').map(Number);
}
// 上位10個のURLをリアルタイムで更新する関数
function updateTop10SimilarUrls(top10, url, similarity) {
    top10.push({ url, similarity });
    top10.sort((a, b) => b.similarity - a.similarity);
    if (top10.length > 10) {
        top10.pop();
    }
}
// テキストファイルからベクトルとURLを取得してリアルタイムで上位10個を計算する関数
async function getTop10SimilarUrls(sentence, directory) {
    const inputVector = await getEmbeddingVector(sentence);
    const files = fs.readdirSync(directory);
    let top10 = [];
    for (const file of files) {
        const filePath = path.join(directory, file); // scraped_docs内のファイルパスすべて一つ一つ
        const content = fs.readFileSync(filePath, 'utf-8'); // ファイルの内容全部
        const lines = content.split('\n'); //改行で分けた
        // linesの内容の具体例
        // [
        //     'URL: http://example.com',    → 1行目
        //     '',                           → 2行目の空行
        //     'Chunk Index: 1',             → 3行目のchunk数
        //     'Text: This is a sample text.',
        //     'Vector: 0.1,0.2,0.3,0.4',
        //     '',
        //     'Chunk Index: 2',
        //     'Text: This is another sample text.',
        //     'Vector: 0.5,0.6,0.7,0.8',
        //     ''
        // ]
        // console.log(`filePath: ${filePath}`);
        // console.log(`content: ${content}`);
        // console.log(`lines[0]: ${lines[0]}`);
        // console.log(`lines[1]: ${lines[1]}`);
        // console.log(`lines[2]: ${lines[2]}`);
        // console.log(`lines[5]: ${lines[5]}`);
        // console.log(`lines.length: ${lines.length}`);
        // console.log(`lines[${lines.length-4}]: ${lines[lines.length-4]}`);
        // console.log(`lines[${lines.length-3}]: ${lines[lines.length-3]}`);
        // console.log(`lines[${lines.length-2}]: ${lines[lines.length-2]}`);
        // console.log(`lines[${lines.length-1}]: ${lines[lines.length-1]}`);
        const url = lines[0].replace('URL: ', '').trim();
        console.log(`URL: ${url}`);
        for (let i = 0; i + 6 < lines.length; i += 9) {
            const textSentence = lines[i + 4];
            console.log(`i: ${i}`);
            console.log(`lines.length: ${lines.length}`);
            const vectorStr = lines[i + 6].trim();
            const vector = parseVector(vectorStr); // 文字列から数値に変換
            // console.log(`File: ${file}`);
            // console.log(`i: ${i}`);
            // console.log(`lines.length: ${lines.length}`);
            // console.log(`textSentence: ${textSentence}`);
            // console.log(`Vector String: ${vectorStr}`);
            // console.log(`Vector: ${vector}`);
            const similarity = cosineSimilarity(inputVector, vector);
            updateTop10SimilarUrls(top10, url, similarity);
        }
    }
    return top10.map(item => item.url);
}
// 使用例
const sentence = "謎解き的な";
const directory = "./vectors";
getTop10SimilarUrls(sentence, directory).then(urls => {
    console.log("Top 10 similar URLs:", urls);
}).catch(error => {
    console.error("Error:", error);
});
