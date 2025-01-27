// create_vectors.ts

import { OpenAI } from '@langchain/openai';
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { OpenAIEmbeddings } from "@langchain/openai";

/** 
 * 環境変数的に取得できない場合はベタ書き or chrome.storage 経由のキーを使うなど 
 * セキュリティリスクに注意
 */
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "YOUR_OPENAI_API_KEY";

// Document型 (scrape.ts と同じ構造)
interface Document {
  page_content: string;
  metadata: {
    url: string;
    title: string;
    userTitle: string;
  };
}

// LLMモデル（実際は未使用でもOK）
const llm = new OpenAI({
  apiKey: OPENAI_API_KEY,
});

// テキスト分割
const textSplitter = new RecursiveCharacterTextSplitter({
  chunkSize: 3000,
  chunkOverlap: 500,
});

// Embeddingモデル (langchain/browser で動く想定)
// ただし Node.js 専用機能が混ざっている場合は要ブラウザ用モジュール
const embedding_model = new OpenAIEmbeddings({
  openAIApiKey: OPENAI_API_KEY,
  // "text-embedding-ada-002" 等を指定することが多い
  model: "text-embedding-3-large",
  dimensions: 1024,
});

/**
 * create_vectorsMain
 * - scrape.ts から返された Document[] を受け取り
 * - テキストを分割し Embedding を生成
 * - ブラウザ拡張のみ想定: localStorage に保存しつつ、チャンク情報を return
 */
export async function create_vectorsMain(
  docs: Document[],
  filename: string,
  userTitle: string
): Promise<{
  chunk_index: number;
  chunk_text: string;
  chunk_vector: number[];
}[]> {
  try {
    // 1) テキスト分割
    const allSplits = await textSplitter.splitDocuments(
      docs.map(doc => ({
        pageContent: doc.page_content,
        metadata: doc.metadata,
      }))
    );

    // 2) チャンクごとに Embedding
    //    embedDocuments() は 2次元配列[ [vector], [vector], ... ] を返す想定
    const embeddings = await Promise.all(
      allSplits.map(chunk => embedding_model.embedDocuments([chunk.pageContent]))
    );

    // 3) (index, text, vector) の形でまとめる
    const textAndVectorList = allSplits.map((chunk, index) => ({
      chunk_index: index,
      chunk_text: chunk.pageContent.replace(/\n/g, ' '),
      chunk_vector: embeddings[index][0] || [],
    }));

    // 4) ブラウザ拡張ではファイル操作できないので localStorage に書き込む
    //    (必要に応じて chrome.storage.* に置き換えてもOK)
    const storageKey = `${filename}_vector.txt`;

    let fileContent = `${filename}\n${userTitle}\n`;
    textAndVectorList.forEach(({ chunk_index, chunk_text, chunk_vector }) => {
      fileContent += `Chunk Index: ${chunk_index}\n`;
      fileContent += `Text:\n${chunk_text}\n`;
      fileContent += `Vector:\n${JSON.stringify(chunk_vector)}\n\n`;
    });

    // localStorage書き込み
    localStorage.setItem(storageKey, fileContent);
    console.log(`[Vectors] Written => localStorage key = ${storageKey}`);

    // 5) メモリ上でも返す
    return textAndVectorList;

  } catch (error) {
    console.error(error);
    return [];
  }
}
