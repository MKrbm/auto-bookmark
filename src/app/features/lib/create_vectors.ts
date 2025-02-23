// create_vectors.ts

import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { defaultEmbeddingConfig, type EmbeddingConfig } from './config/embeddingConfig';
import { generateEmbeddings } from './embedding';
import type { EmbeddingModelConfig } from './embedding/types';

// Document型 (scrape.ts と同じ構造)
interface Document {
  page_content: string;
  metadata: {
    url: string;
    title: string;
    userTitle: string;
  };
}

// テキスト分割の初期化関数
function initializeTextSplitter(config: Partial<EmbeddingConfig> = {}) {
  // デフォルト設定とマージ
  const finalConfig = { ...defaultEmbeddingConfig, ...config };

  return new RecursiveCharacterTextSplitter({
    chunkSize: finalConfig.chunkSize,
    chunkOverlap: finalConfig.chunkOverlap,
    lengthFunction: finalConfig.lengthFunction,
  });
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
  config: EmbeddingModelConfig = {}
): Promise<{
  chunk_index: number;
  chunk_text: string;
  chunk_vector: number[];
  url: string;
  title: string;
}[]> {
  try {
    // テキスト分割の初期化
    const textSplitter = initializeTextSplitter(config);

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
        const chunks = allSplits.map(split => split.pageContent);
        const embeddings = await generateEmbeddings(chunks, config);

        // 3) (index, text, vector) の形でまとめる
        console.time(`data-formatting (${title})`);
        const textAndVectorList = embeddings.map((embedding, index) => ({
          chunk_index: index,
          chunk_text: embedding.text.replace(/\n/g, ' '),
          chunk_vector: embedding.vector,
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
