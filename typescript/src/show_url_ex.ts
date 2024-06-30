import { OpenAI } from '@langchain/openai';
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { OpenAIEmbeddings } from "@langchain/openai";
import { config } from './config.js';
import { JSONLoader } from "langchain/document_loaders/fs/json";
import fs from 'fs';
import path from 'path';
import * as tf from '@tensorflow/tfjs';

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
async function getEmbeddingVector(sentence: string): Promise<number[]> {
    const embedding = await embedding_model.embedDocuments([sentence]);
    console.log(`Input Sentence: ${sentence}`);
    console.log(`Embedding: ${embedding[0]}`);
    return embedding[0];
}

// ベクトルの文字列を配列に変換する関数
function parseVector(vectorStr: string): number[] {
    const vectorJson = JSON.parse(vectorStr);
    if (Array.isArray(vectorJson) && Array.isArray(vectorJson[0])) {
        return vectorJson[0];
    }
    throw new Error("Invalid vector format");
}

// コサイン類似度を計算する関数
function calculateCosineSimilarity(vecA: number[], vecB: number[]): number {
    const dotProduct = vecA.reduce((sum, a, idx) => sum + a * vecB[idx], 0);
    const magnitudeA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
    const magnitudeB = Math.sqrt(vecB.reduce((sum, a) => sum + a * a, 0));
    if (magnitudeA === 0 || magnitudeB === 0) return 0;
    return dotProduct / (magnitudeA * magnitudeB);
}

// 上位10個のURLをリアルタイムで更新する関数
function updateTop10SimilarUrls(top10: { url: string, similarity: number }[], url: string, similarity: number): void {
    const existingIndex = top10.findIndex(item => item.url === url);
    if (existingIndex !== -1) {
        if (similarity > top10[existingIndex].similarity) {
            top10[existingIndex].similarity = similarity;
        }
    } else {
        top10.push({ url, similarity });
    }
    top10.sort((a, b) => b.similarity - a.similarity);
    if (top10.length > 10) {
        top10.pop();
    }
}

// テキストファイルからベクトルとURLを取得してリアルタイムで上位10個を計算する関数
async function getTop10SimilarUrls(sentence: string, directory: string): Promise<string[]> {
    const inputVector = await getEmbeddingVector(sentence);
    const files = fs.readdirSync(directory);
    let top10: { url: string, similarity: number }[] = [];

    for (const file of files) {
        const filePath = path.join(directory, file);
        const content = fs.readFileSync(filePath, 'utf-8');
        const lines = content.split('\n');

        const url = lines[0].replace('URL: ', '').trim();
        for (let i = 0; i + 6 < lines.length; i += 6) {
            const textSentence = lines[i + 4];
            const vectorStr = lines[i + 6].trim();
            let vector;
            try {
                vector = parseVector(vectorStr);
            } catch (error) {
                console.error(`Error parsing vector in file: ${file}`, error);
                continue;
            }

            // ベクトルにNaNが含まれている場合はスキップ
            if (vector.length !== inputVector.length) {
                console.warn(`Skipping invalid vector in file: ${file}`);
                continue;
            }

            const similarity = calculateCosineSimilarity(inputVector, vector);
            console.log(`File: ${file}`);
            // console.log(`Text: ${textSentence}`);
            // console.log(`Vector: ${vector}`);
            console.log(`Similarity: ${similarity}`);
            updateTop10SimilarUrls(top10, url, similarity);
        }
    }

    console.log("Top 10 similar URLs and their similarities:", top10);
    return top10.map(item => item.url);
}

// 使用例
const sentence = "遊びに行く";
const directory = "./vectors";

getTop10SimilarUrls(sentence, directory).then(urls => {
    console.log("Top 10 similar URLs:", urls);
}).catch(error => {
    console.error("Error:", error);
});
