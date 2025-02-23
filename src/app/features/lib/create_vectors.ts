// create_vectors.ts

import { OpenAI } from '@langchain/openai';
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { OpenAIEmbeddings } from "@langchain/openai";
import { defaultEmbeddingConfig, type EmbeddingConfig } from './config/embeddingConfig';

import { getOpenAIApiKey } from './config/envConfig';

/** 
 * 環境変数的に取得できない場合はベタ書き or chrome.storage 経由のキーを使うなど 
 * セキュリティリスクに注意
 */
// APIキーを環境変数から取得
const OPENAI_API_KEY = getOpenAIApiKey();

// Document型 (scrape.ts と同じ構造)
interface Document {
  page_content: string;
  metadata: {
    url: string;
    title: string;
    userTitle: string;
  };
}

// テキスト分割とEmbeddingモデルの初期化関数
function initializeModels(config: Partial<EmbeddingConfig> = {}) {
  // デフォルト設定とマージ
  const finalConfig = { ...defaultEmbeddingConfig, ...config };

  // テキスト分割
  const textSplitter = new RecursiveCharacterTextSplitter({
    chunkSize: finalConfig.chunkSize,
    chunkOverlap: finalConfig.chunkOverlap,
    lengthFunction: finalConfig.lengthFunction,
  });

  // Embeddingモデル (langchain/browser で動く想定)
  const embedding_model = new OpenAIEmbeddings({
    openAIApiKey: OPENAI_API_KEY,
    model: finalConfig.model,
    dimensions: finalConfig.dimensions,
    batchSize: finalConfig.batchSize,
    stripNewLines: finalConfig.stripNewLines,
    timeout: finalConfig.timeout,
    maxRetries: finalConfig.max_retries,
  });

  return { textSplitter, embedding_model };
}

/**
 * create_vectorsMain
 * - scrape.ts から返された Document[] を受け取り
 * - テキストを分割し Embedding を生成
 * - チャンク情報を return
 */
export async function create_vectorsMain(
  pages: {
    docs: Document[];
    filename: string;
    userTitle: string;
  }[],
  config: Partial<EmbeddingConfig> = {}
): Promise<{
  chunk_index: number;
  chunk_text: string;
  chunk_vector: number[];
  url: string;
  title: string;
}[]> {
  try {
    // モデルの初期化（共有して使用）
    const { textSplitter, embedding_model } = initializeModels(config);

    // 各ページを並列で処理
    const processPage = async (page: { docs: Document[]; filename: string; userTitle: string }) => {
      const url = page.docs[0]?.metadata.url || 'Unknown URL';
      const title = page.docs[0]?.metadata.title || 'Unknown Title';

      try {
        // 1) テキスト分割
        console.time(`text-splitting (${title})`);
        const allSplits = await textSplitter.splitDocuments(
          page.docs.map(doc => ({
            pageContent: doc.page_content,
            metadata: doc.metadata,
          }))
        );
        console.timeEnd(`text-splitting (${title})`);

        // 2) チャンクごとに Embedding
        console.time(`document-embedding-generation (${title})`);
        const embeddings = await Promise.all(
          allSplits.map(chunk => embedding_model.embedDocuments([chunk.pageContent]))
        );
        console.timeEnd(`document-embedding-generation (${title})`);

        // 3) (index, text, vector) の形でまとめる
        console.time(`data-formatting (${title})`);
        const textAndVectorList = allSplits.map((chunk, index) => ({
          chunk_index: index,
          chunk_text: chunk.pageContent.replace(/\n/g, ' '),
          chunk_vector: embeddings[index][0] || [],
          url,
          title,
        }));

        console.timeEnd(`data-formatting (${title})`);
        console.log(`Processed: ${url}`);
        return textAndVectorList;
      } catch (error) {
        console.error(`Error processing page ${url}:`, error);
        return [];
      }
    };

    // 全ページを並列処理
    const results = await Promise.all(pages.map(processPage));
    
    // 結果をフラット化して返す
    return results.flat();
  } catch (error) {
    console.error('Error in create_vectorsMain:', error);
    return [];
  }
}
