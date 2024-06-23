import axios from 'axios';
import cheerio from 'cheerio';
import fs from 'fs';
import path from 'path';

interface Document {
    page_content: string;
    metadata: {
        url: string;
        title: string;
    };
}

const scrapeAndSave = async (urls: string[], outputFilePath: string) => {
    const documents: Document[] = [];

    for (const url of urls) {
        try {
            const response = await axios.get(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3'
                }
            });
            // console.log('response.data:', response.data);
            const $ = cheerio.load(response.data);

            // セレクタが実際に存在するかチェック
            const postTitle = $('.post-title').text() || $('h1').text() || $('title').text();
            const postHeader = $('.post-header').text() || $('header').text() || $('h2').text();
            const postContent = $('.post-content').text() || $('article').text() || $('main').text() || $('body').text();
            

            if (postTitle || postHeader || postContent) {
                const pageContent = `${postTitle}\n${postHeader}\n${postContent}`;
                const metadata = {
                    url: url,
                    title: $('title').text(),
                };
                console.log(`pageContent: `, pageContent)
                documents.push({ page_content: pageContent, metadata });
            } else {
                console.warn(`No content found for ${url}.`);
            }
        } catch (error) {
            console.error(`Error fetching ${url}:`, error);
        }
    }

    const outputDir = path.dirname(outputFilePath);
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    fs.writeFileSync(outputFilePath, JSON.stringify(documents, null, 2));
    console.log('Scraping and saving completed.');
};



const main = async (urls: string[], outputFilePath: string) => {
    console.log(process.cwd());
    await scrapeAndSave(urls, outputFilePath);
};


export default main;
if (import.meta.url === `file://${process.argv[1]}`) {
    // const urls = ['https://lilianweng.github.io/posts/2023-06-23-agent/']; // urlsとしているが、urlは一つの想定です。。
    const urls = ['https://www.langchain.com/'];
    const outputFilePath = './scraped_docs/web_test.json'; // 動的に変更する必要がある
    main(urls, outputFilePath).catch(console.error);
}
