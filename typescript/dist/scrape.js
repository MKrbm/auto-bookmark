import axios from 'axios';
import cheerio from 'cheerio';
import fs from 'fs';
import path from 'path';
const scrapeAndSave = async (urls, outputFilePath) => {
    const documents = [];
    for (const url of urls) {
        try {
            const response = await axios.get(url);
            const $ = cheerio.load(response.data);
            const pageContent = $('.post-title, .post-header, .post-content').text();
            const metadata = {
                url: url,
                title: $('title').text(),
            };
            documents.push({ page_content: pageContent, metadata });
        }
        catch (error) {
            console.error(`Error fetching ${url}:`, error);
        }
    }
    const outputDir = path.dirname(outputFilePath);
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }
    fs.writeFileSync(outputFilePath, JSON.stringify(documents));
    console.log('Scraping and saving completed.');
};
console.log(process.cwd());
const urls = ['https://lilianweng.github.io/posts/2023-06-23-agent/'];
const outputFilePath = './scraped_docs/web_test.json'; // 動的に変更する必要がある
scrapeAndSave(urls, outputFilePath).catch(console.error);
