// ■ runner.ts

// url_list.txt から行単位でURLを読み込む
// それぞれのURLに対して scrape.ts を実行し、HTMLからテキストを抽出してJSONファイルとして保存する
// その後、抽出して作成したJSONファイルを create_vectors.ts に渡し、ベクトル(Embedding)に変換して vectors/xxxx_vector.txt として保存する



import scrapeMain from './scrape.js';
import create_vectorsMain from './create_vectors.js';
import fs from 'fs';
import path from 'path';

// URLを安全なファイル名に変換する関数
const urlToFilename = (url: string): string => {
    return url.replace(/[^a-z0-9]/gi, '_').toLowerCase();
};

// url_list.txtからURLを取得してListにまとめる
const run = async () => {
    const urlFilePath = path.resolve('./url_list.txt');
    const urls_list = fs.readFileSync(urlFilePath, 'utf-8')
        .split('\n')
        .filter(url => url.trim().length > 0); // 空行を除外
    console.log(`urls_list: ${urls_list}`);
    
    for (const url of urls_list) {
        const filename = urlToFilename(url);
        console.log('filename:', filename);
        const outputFilePath = path.resolve('./scraped_docs', `${filename}.json`);
        // 実行対象URLと結果を保存するJSONファイルのpathを渡して、Scrapeする
        // HTMLを取得して、テキストへ変換した結果をJSON形式で、「.scraped_docs/<file_name>.json」として保存する
        await scrapeMain([url], outputFilePath);

        // 上部でscrapeして保存したjsonファイルを引数にEmbeddingを実行する
        // vectors/<filename>_vector.txtという名前で保存される
        await create_vectorsMain(filename) // filenameはURLの英数字以外を_に変更したもの
        
    }
    
    // const urls = ['https://lilianweng.github.io/posts/2023-06-23-agent/'];
    // const outputFilePath = './scraped_docs/web_test.json'; // 動的に変更する必要がある

    // await scrapeMain(urls, outputFilePath);
};

run().catch(console.error);
