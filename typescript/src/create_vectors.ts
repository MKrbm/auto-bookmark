// create_vectors.ts

import { OpenAI } from '@langchain/openai';
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { OpenAIEmbeddings } from "@langchain/openai";
import { config } from './config.js';
import fs from 'fs';
import path from 'path';

// Document型 (scrape.ts から受け取る形)
interface Document {
  page_content: string;
  metadata: {
    url: string;
    title: string;
    userTitle: string;
  };
}

// OpenAI APIの設定 (LLM)
const llm = new OpenAI({
  apiKey: config.OPENAI_API_KEY,
});

// テキスト分割
const textSplitter = new RecursiveCharacterTextSplitter({
  chunkSize: 3000,
  chunkOverlap: 500,
});

// Embeddingモデル
const embedding_model = new OpenAIEmbeddings({
  openAIApiKey: config.OPENAI_API_KEY,
  model: "text-embedding-3-large",
  dimensions: 1024,
});

/**
 * create_vectorsMain
 * - scrape.ts から返された Document[] を受け取る
 * - 文字列を分割し、Embeddingを生成
 * - vectors/filename_vector.txt に出力する
 */
export async function create_vectorsMain(
  docs: Document[],
  filename: string,
  userTitle: string
) {
  try {
    // 1) テキスト分割
    //    doc => { pageContent: doc.page_content } の形に合わせる
    const allSplits = await textSplitter.splitDocuments(
      docs.map(doc => ({
        pageContent: doc.page_content,
        metadata: doc.metadata
      }))
    );

    // 2) チャンクごとに Embedding
    const embeddings = await Promise.all(
      allSplits.map(chunk => embedding_model.embedDocuments([chunk.pageContent]))
    );

    // 3) (index, text, vector) の形でまとめる
    const textAndVectorList = allSplits.map((chunk, index) => ({
      index,
      text: chunk.pageContent.replace(/\n/g, ' '),
      vector: embeddings[index],
    }));

    // 4) vectorsディレクトリへ保存
    const dir = 'vectors';
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir);
    }
    const filePath = path.join(dir, `${filename}_vector.txt`);

    // 1行目: filename, 2行目: userTitle
    let fileContent = `${filename}\n${userTitle}\n`;
    textAndVectorList.forEach(({ index, text, vector }) => {
      fileContent += `Chunk Index: ${index}\nText:\n${text}\nVector:\n${JSON.stringify(vector)}\n\n`;
    });

    fs.writeFileSync(filePath, fileContent.trimEnd(), 'utf8');
    console.log(`[Vectors] Written => ${filePath}`);
  } catch (error) {
    console.error(error);
  }
}
