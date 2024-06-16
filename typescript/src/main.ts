import { OpenAI } from '@langchain/openai';
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { OpenAIEmbeddings } from "@langchain/openai";
import { config } from './config.js';
import { JSONLoader } from "langchain/document_loaders/fs/json";
import fs from 'fs';
import path from 'path';

// OpenAI APIの設定
const llm = new OpenAI({
  apiKey: config.OPENAI_API_KEY,
});


// console.log(process.cwd());


// docsの作成 (json形式でscrapingしていると仮定)

const filename = "web_test"
const loader = new JSONLoader(`../python/scraped_docs/${filename}.json`); // bookmarkしたフォルダの内容をscrapingしたファイルを指定する
const docs = await loader.load();


// テキストを分割
const textSplitter = new RecursiveCharacterTextSplitter({
  chunkSize: 3000,
  chunkOverlap: 500,
});
const allSplits = await textSplitter.splitDocuments(docs);
// console.log(allSplits[0].pageContent) // chunk0の文章
// console.log(allSplits.length); // 何個に区切ったか
// console.log(allSplits[0].pageContent.length); // 一区切りの文字数

// ベクトル化
// const embeddings = new OpenAIEmbeddings()
// const vectorstore = await MemoryVectorStore.fromDocuments(
//   allSplits,
//   embeddings
// );
// console.log(vectorstore);

// embedding
const embedding_model = new OpenAIEmbeddings({
  openAIApiKey: config.OPENAI_API_KEY,
  model: "text-embedding-3-large",
  dimensions: 1024,
})



async function getEmbeddings(allSplits: { page_content: string }[]) {
  const embeddings = await Promise.all(
    allSplits.map(chunk => embedding_model.embedDocuments([chunk.page_content]))
  );

  const textAndVectorList = allSplits.map((chunk, index) => ({
    index: index,
    // text: chunk.page_content,
    text: chunk.page_content.replace(/\n/g, ' '), // 改行なくしてみた
    vector: embeddings[index],
  }));

  // それぞれを一つのファイルにchunkごとに区切って保存
  const dir = 'vectors';
  if (!fs.existsSync(dir)){
    fs.mkdirSync(dir);
  }
  const filePath = path.join(dir, `${filename}_vector.txt`)

  let fileContent = '';
  textAndVectorList.forEach(({ index, text, vector }) => {
    // 表示
    // console.log(`Text: ${text}`);
    // console.log(`Vector: ${vector}`);
    // console.log(`vector type: ${typeof vector}`);
    // console.log(`vector size: ${vector.length}`);
    fileContent += `Chunk Index: ${index}\nText:\n${text}\nVector:\n${JSON.stringify(vector)}\n\n`;
  });
  fs.writeFileSync(filePath, fileContent, 'utf8');
}


(async () => {
  try {
    const pageContents = allSplits.map(doc => ({ page_content: doc.pageContent }));
    console.log(pageContents)
    await getEmbeddings(pageContents);
  } catch (error) {
    console.error(error);
  }
})();

// レトリーバーの設定
// const retriever = vectorstore.asRetriever({
//   searchType: 'similarity',
//   searchKwargs: { k: 3 },
// });



