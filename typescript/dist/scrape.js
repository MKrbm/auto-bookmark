// scrape.ts
import axios from 'axios';
import cheerio from 'cheerio';
/**
 * scrapeMain
 * - urls & userTitle を受け取り、HTMLを取得してテキスト抽出
 * - それらを Document[] で返す（ファイルには保存しない）
 */
export default async function scrapeMain(urls, userTitle) {
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
                const pageContent = `${postTitle}\n${postHeader}\n${postContent}`.trim();
                const metadata = {
                    url,
                    title: $('title').text(),
                    userTitle
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
    return documents; // メモリ上で返す
}
