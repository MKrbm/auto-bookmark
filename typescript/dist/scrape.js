// scrape.ts
// URLを受け取り、axios + cheerioを使ってHTML本文を取得し、タイトルや本文をパースします。
// パースしたテキスト(page_content)とメタデータ(url, title, userTitle)を documents 配列に格納して
// 最終的に outputFilePath に JSON形式で保存します。
import axios from 'axios';
import cheerio from 'cheerio';
import fs from 'fs';
import path from 'path';
const scrapeAndSave = async (urls, userTitle, outputFilePath) => {
    const documents = [];
    for (const url of urls) {
        try {
            // 1) HTTPリクエストでHTMLを取得
            const response = await axios.get(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
                }
            });
            // 2) cheerioでDOMパース
            const $ = cheerio.load(response.data);
            // 3) タイトルや本文を複数セレクタで試す
            const postTitle = $('.post-title').text() || $('h1').text() || $('title').text();
            const postHeader = $('.post-header').text() || $('header').text() || $('h2').text();
            const postContent = $('.post-content').text() || $('article').text() || $('main').text() || $('body').text();
            // 4) 何らかのテキストが取得できた場合のみ追加
            if (postTitle || postHeader || postContent) {
                const pageContent = `${postTitle}\n${postHeader}\n${postContent}`;
                const metadata = {
                    url: url,
                    title: $('title').text(),
                    userTitle: userTitle // ユーザー指定のタイトル
                };
                documents.push({ page_content: pageContent, metadata });
            }
            else {
                console.warn(`No content found for ${url}.`);
            }
        }
        catch (error) {
            console.error(`Error fetching ${url}:`, error);
        }
    }
    // 5) 出力先ディレクトリがなければ作成
    const outputDir = path.dirname(outputFilePath);
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }
    // 6) JSONファイルとして保存
    fs.writeFileSync(outputFilePath, JSON.stringify(documents, null, 2));
    console.log('Scraping and saving completed.');
};
// main関数 (urls, userTitle, outputFilePath)
const main = async (urls, userTitle, outputFilePath) => {
    await scrapeAndSave(urls, userTitle, outputFilePath);
};
export default main;
// 単体テスト用のエントリポイント例
if (import.meta.url === `file://${process.argv[1]}`) {
    const urls = ['https://www.langchain.com/'];
    const userTitle = "LangChainのサイト"; // テスト用タイトル
    const outputFilePath = './scraped_docs/web_test.json';
    main(urls, userTitle, outputFilePath).catch(console.error);
}
