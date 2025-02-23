# ブックマーク処理と検索のテスト仕様

## テストの実行方法

### 全テストの実行
```bash
npm test
```

### 特定のテストファイルの実行
```bash
npm test src/app/features/lib/__tests__/runnerBookmarks.test.ts
```

### テスト実行時の注意点
- Node.js v18以上が必要
- 必要な環境変数（OPENAI_API_KEY等）が設定されていること
- 依存パッケージがインストールされていること（`npm install`）

## テスト環境の共通設定

テストは`jest.setup.ts`で以下の環境を設定しています：

```typescript
// ブラウザAPIのエミュレーション
- TextEncoder/TextDecoder
- ReadableStream
- DOMParser
- Fetch API
- Chrome Storage API

// 外部サービスのモック
- OpenAI Embeddings API
- HTML解析（linkedom）
```

## 拡張機能環境でのテスト

### テスト実行手順
1. 拡張機能のビルド
```bash
npm run build
```

2. テストの実行
```bash
npm test src/app/features/lib/__tests__/runnerBookmarks.test.ts
```

### 確認観点
- Chrome Storage APIが正しく動作していること
- ブックマークの取得と保存が正常に行われること
- エラー時の適切なハンドリングがされること
- パフォーマンス（処理時間が許容範囲内であること）

### 1. ブックマーク処理テスト

```typescript
describe('processFetchedBookmarks', () => {
  test('should process bookmarks and store chunks', async () => {
    // テスト内容
    - Chrome拡張のストレージAPIを使用してチャンクを保存
    - ブックマークのHTMLコンテンツをfetchして解析
    - 解析したコンテンツからチャンクを生成
    - 生成したチャンクをChrome Storageに保存
  });
});
```

### 2. AI検索ランキングテスト

```typescript
describe('AI検索のランキング', () => {
  test('should rank "物理学" in the order of fnorio -> dwave -> langchain', async () => {
    // テスト内容
    - Chrome Storageから保存されたチャンクを取得
    - OpenAI Embeddingsを使用してクエリとチャンクのベクトルを生成
    - コサイン類似度に基づいて検索結果をランキング
    - 物理学に関連する順序で結果が返されることを確認
      1. fnorio.com（物理学の基礎）
      2. dwavesys.com（量子物理学）
      3. langchain.com（AI関連）
  });
});
```

## Node.js環境でのテスト

### テスト実行手順
1. Node.js用の設定ファイルを使用
```bash
npm test -- --config=jest.config.ts
```

2. 特定のテストの実行
```bash
npm test src/app/features/lib/__tests__/scrape.test.ts
npm test src/app/features/lib/__tests__/create_vectors.test.ts
```

### 確認観点
- HTMLスクレイピングが正しく動作すること
- 文字エンコーディングが適切に処理されること
- ベクトル生成が期待通りに行われること
- メモリ使用量が適切な範囲内であること
- エラーハンドリングが適切に行われること

### 1. スクレイピングテスト

#### 確認ポイント
- HTML解析の正確性
  - メタデータ（タイトル、説明）の抽出
  - 本文コンテンツの抽出
  - 不要なタグの除去
- エンコーディング処理
  - UTF-8の処理
  - Shift-JISの処理
  - 文字化けの防止
- エラー処理
  - 無効なURLの処理
  - タイムアウト時の処理
  - 不正なHTMLの処理

```typescript
describe('scrapeMain', () => {
  test('should scrape and clean HTML content', async () => {
    // テスト内容
    - fetch APIを使用してHTMLコンテンツを取得
    - linkedomを使用してHTMLを解析
    - 不要なタグを削除（script, style等）
    - テキストコンテンツを抽出して正規化
    - メタデータ（タイトル、URL）を取得
  });
});
```

### 2. ベクトル生成テスト

#### 確認ポイント
- テキスト分割の正確性
  - 適切な長さでのチャンク分割
  - 文脈の保持
  - 重要な情報の分断防止
- ベクトル生成の品質
  - 次元数の正確性（1024次元）
  - ベクトル値の範囲チェック
  - 類似度計算の妥当性
- メタデータの処理
  - URLの保持
  - タイトルの保持
  - タイムスタンプの正確性
- リソース効率
  - メモリ使用量
  - API呼び出し回数
  - 処理時間

```typescript
describe('create_vectorsMain', () => {
  test('should create vectors from text content', async () => {
    // テスト内容
    - テキストをチャンクに分割
    - OpenAI Embeddingsを使用してベクトルを生成
    - 生成したベクトルとメタデータを組み合わせて保存
  });
});
```

## テストデータ

テストでは以下のサンプルURLとコンテンツを使用：

1. `http://fnorio.com/0074trichromatism1/trichromatism1.html`
   - 物理学、色、光の原理に関する内容
   - 物理学クエリに対して最も関連性が高い

2. `https://docs.dwavesys.com/docs/latest/c_gs_2.html`
   - 量子コンピューティングと量子物理学に関する内容
   - 物理学クエリに対して2番目に関連性が高い

3. `https://www.langchain.com/`
   - AIとLLMに関する内容
   - 物理学クエリに対して最も関連性が低い

## モックの実装

### OpenAI Embeddings

```typescript
embedDocuments: (texts: string[]) => {
  // テキストの内容に基づいて異なるベクトルを返す
  return texts.map(text => {
    if (text.includes('physics')) return [0.9, ...]; // 高いスコア
    if (text.includes('quantum')) return [0.7, ...]; // 中程度のスコア
    return [0.1, ...]; // 低いスコア
  });
}
```

### Chrome Storage

```typescript
chrome.storage.local = {
  get: jest.fn(),
  set: jest.fn(),
};
```

### Fetch API

```typescript
global.fetch = (url: string) => {
  return Promise.resolve({
    text: () => Promise.resolve(`
      <html>
        <body>
          ${url.includes('fnorio.com') ? '物理学の内容...' : ''}
          ${url.includes('dwavesys.com') ? '量子物理学の内容...' : ''}
          ${url.includes('langchain.com') ? 'AI/LLMの内容...' : ''}
        </body>
      </html>
    `),
  });
};
