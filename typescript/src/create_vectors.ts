// create_vectors.ts

// runner.ts から受け取ったファイル名( = URLを整形したもの )を使って、
// scraped_docs/filename.json を読み込みます。
// langchain の JSONLoader + RecursiveCharacterTextSplitter を用いて、ある程度の長さに分割します。
// 文字列を OpenAIEmbeddings で Embedding(数値ベクトル) にし、
// 最終的に vectors ディレクトリ配下に filename_vector.txt として出力します。

import { OpenAI } from '@langchain/openai';
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { OpenAIEmbeddings } from "@langchain/openai";
import { config } from './config.js';
import { JSONLoader } from "langchain/document_loaders/fs/json";
import fs from 'fs';
import path from 'path';

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

// ベクトル生成＆ファイル書き込み
async function getEmbeddings(
  allSplits: { page_content: string }[],
  filename: string,
  userTitle: string
) {
  // 1) テキストごとにEmbedding
  const embeddings = await Promise.all(
    allSplits.map(chunk => embedding_model.embedDocuments([chunk.page_content]))
  );

  // 2) (index, text, vector) の形でまとめる
  const textAndVectorList = allSplits.map((chunk, index) => ({
    index: index,
    text: chunk.page_content.replace(/\n/g, ' '),  // 改行をスペースに
    vector: embeddings[index],
  }));

  // 3) vectorsディレクトリへ保存
  const dir = 'vectors';
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
  }
  const filePath = path.join(dir, `${filename}_vector.txt`);

  // 4) 1行目: filename, 2行目: userTitle
  let fileContent = `${filename}\n${userTitle}\n`;

  textAndVectorList.forEach(({ index, text, vector }) => {
    fileContent += `Chunk Index: ${index}\nText:\n${text}\nVector:\n${JSON.stringify(vector)}\n\n`;
  });

  fs.writeFileSync(filePath, fileContent.trimEnd(), 'utf8');
  console.log(`[Vectors] Written => ${filePath}`);
}

const main = async (filename: string, userTitle: string) => {
  try {
    // 1) scraped_docs/filename.json を読み込み (JSONLoader)
    const loader = new JSONLoader(`./scraped_docs/${filename}.json`);
    const docs = await loader.load();

    // // 2) userTitle を取得 (1つめのドキュメントから)
    // const userTitle = docs[0]?.metadata?.userTitle || "";

    // 3) テキスト分割
    const allSplits = await textSplitter.splitDocuments(docs);
    const pageContents = allSplits.map(doc => ({ page_content: doc.pageContent }));

    // 4) Embedding 作成 & filename_vector.txt に書き込み
    await getEmbeddings(pageContents, filename, userTitle);

  } catch (error) {
    console.error(error);
  }
};

export default main;

// // 単体テスト用
// if (import.meta.url === `file://${process.argv[1]}`) {
//   const filename = 'web_test';
//   main(filenamem, "AAA").catch(console.error);
// }

// const loader = new JSONLoader(`./scraped_docs/${filename}.json`); // bookmarkしたフォルダの内容をscrapingしたファイルを指定する
// const docs = await loader.load();


// (async () => {
//   try {
//     const pageContents = allSplits.map(doc => ({ page_content: doc.pageContent }));
//     console.log(pageContents)
//     await getEmbeddings(pageContents);
//   } catch (error) {
//     console.error(error);
//   }
// })();

// レトリーバーの設定
// const retriever = vectorstore.asRetriever({
//   searchType: 'similarity',
//   searchKwargs: { k: 3 },
// });



