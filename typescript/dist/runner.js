import scrapeMain from './scrape.js';
import create_vectorsMain from './create_vectors.js';
import fs from 'fs';
import path from 'path';
// URLを安全なファイル名に変換する関数
const urlToFilename = (url) => {
    return url.replace(/[^a-z0-9]/gi, '_').toLowerCase();
};
const run = async () => {
    const urlFilePath = path.resolve('./url_list.txt');
    const urls_list = fs.readFileSync(urlFilePath, 'utf-8')
        .split('\n')
        .filter(url => url.trim().length > 0);
    console.log(`urls_list: ${urls_list}`);
    for (const url of urls_list) {
        const filename = urlToFilename(url);
        console.log('filename:', filename);
        const outputFilePath = path.resolve('./scraped_docs', `${filename}.json`);
        await scrapeMain([url], outputFilePath);
        console.log('filename:', filename);
        await create_vectorsMain(filename); // ここで何かエラー起きているな
    }
    // const urls = ['https://lilianweng.github.io/posts/2023-06-23-agent/'];
    // const outputFilePath = './scraped_docs/web_test.json'; // 動的に変更する必要がある
    // await scrapeMain(urls, outputFilePath);
};
run().catch(console.error);
