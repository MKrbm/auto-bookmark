// ■ runner.ts
// url_list.txt から行単位でURLを読み込む
// それぞれのURLに対して scrape.ts を実行し、HTMLからテキストを抽出してJSONファイルとして保存する
// その後、抽出して作成したJSONファイルを create_vectors.ts に渡し、ベクトル(Embedding)に変換して vectors/xxxx_vector.txt として保存する
import scrapeMain from './scrape.js';
import create_vectorsMain from './create_vectors.js';
import fs from 'fs';
import path from 'path';
// URLを安全なファイル名に変換する関数
const urlToFilename = (url) => {
    return url.replace(/[^a-z0-9]/gi, '_').toLowerCase();
};
// url_list_new.txt から (title, url) ペアを取得してリストにまとめる
const run = async () => {
    // 1) ファイル読み込み
    const urlFilePath = path.resolve('./url_list_new.txt');
    const lines = fs.readFileSync(urlFilePath, 'utf-8')
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0); // 空行除外
    // 2) タイトル→URL のペアをまとめる
    //    行数が奇数だとペアが崩れるので、念のためエラーチェック
    if (lines.length % 2 !== 0) {
        console.error('url_list_new.txt が (タイトル→URL) ペアになっていません。行数が奇数です。');
        return;
    }
    // 3) 2行ずつ処理
    for (let i = 0; i < lines.length; i += 2) {
        const userTitle = lines[i]; // タイトル
        const url = lines[i + 1]; // URL
        // URLをファイル名に変換
        const filename = urlToFilename(url);
        console.log(`[Info] Processing => title="${userTitle}", url="${url}", filename="${filename}"`);
        // (a) スクレイピング結果を scraped_docs/filename.json に保存
        const outputFilePath = path.resolve('./scraped_docs', `${filename}.json`);
        // ここで title も一緒に渡したい場合は scrapeMain(...) を拡張する
        await scrapeMain([url], userTitle, outputFilePath);
        // (b) 作成した JSONファイルを Embedding して vectors/filename_vector.txt に保存
        // create_vectorsMain もタイトルを受け取れる形にしたい場合は拡張する
        await create_vectorsMain(filename, userTitle);
    }
    console.log('All done!');
};
// 実行
run().catch(console.error);
