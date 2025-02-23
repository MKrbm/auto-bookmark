# Webページスクレイピングモジュール技術仕様

## 概要

`scrape.ts`は、WebページのHTMLコンテンツを取得し、構造化されたテキストデータとして抽出するモジュールです。Service Worker環境での動作を考慮した設計となっており、マルチエンコーディング対応と堅牢なコンテンツ抽出ロジックを実装しています。

## 主要機能

### 1. テキスト正規化 (`cleanText`)

```typescript
function cleanText(text: string): string
```

#### 処理内容
- HTMLエンティティのデコード
- 制御文字の除去（改行とタブを除く）
- 全角スペースの半角統一
- サロゲートペア文字の正規化
- 改行・連続スペースの正規化

#### 特徴
- 見出しの改行は保持
- 文字化け対策実装済み
- 不要な空白文字の適切な処理

### 2. メインスクレイピング処理 (`scrapeMain`)

```typescript
async function scrapeMain(
  urls: string[],
  userTitle: string
): Promise<Document[]>
```

#### 入力
- `urls`: スクレイピング対象URLの配列
- `userTitle`: ユーザー指定のタイトル

#### 出力
```typescript
interface Document {
  page_content: string;
  metadata: {
    url: string;
    title: string;
    userTitle: string;
  };
}
```

## アーキテクチャ設計

### 1. エンコーディング処理

- Content-Typeヘッダーからエンコーディングを自動検出
- 主要な日本語エンコーディングに対応
  - UTF-8
  - Shift-JIS（各種異表記対応）
  - EUC-JP

### 2. HTML解析

- `linkedom`パーサーを使用
- 不要要素の除去
  - script
  - style
  - svg
  - iframe

### 3. コンテンツ抽出ロジック

#### メインコンテンツセレクタ（優先順）
1. `.post-content`
2. `article`
3. `main`
4. `.entry-content`
5. `.article-content`
6. `#main-content`
7. `.container`（フォールバック）
8. `.content`（フォールバック）

#### 除外要素
1. 広告関連
   - `[class*="ad"]`
   - `[id*="ad"]`
   - `[class*="advertisement"]`

2. ナビゲーション要素
   - `nav`
   - `.navigation`
   - `#navigation`

3. サイドバー
   - `aside`
   - `.sidebar`
   - `#sidebar`

4. その他の補助要素
   - `footer`
   - `.social-share`
   - `.related-posts`
   - `.comments`
   - `.widget`

### 4. 見出し抽出

- h1〜h6までの階層的な抽出
- マークダウン形式での階層表現（#の数で階層を表現）
- 短すぎる見出し（10文字未満）の除外

## エラーハンドリング

1. HTMLバリデーション
   - DOCTYPE/HTML開始タグの確認
   - 無効なHTMLの検出とスキップ

2. コンテンツ検証
   - 見出しの有効性確認（10文字以上）
   - メインコンテンツの最小長チェック（100文字以上）
   - 有効なコンテンツが無い場合のnull返却

3. 例外処理
   - fetch失敗時のエラーログ出力
   - パース失敗時のエラーハンドリング
   - 無効なURLのスキップ

## パフォーマンス最適化

1. 並列処理
   - 複数URLの同時処理（Promise.all）
   - 非同期処理の適切な利用

2. メモリ効率
   - 不要なDOM要素の早期削除
   - 大きなテキストの適切な処理

## 使用例

```typescript
// 単一URLのスクレイピング
const docs = await scrapeMain(['https://example.com'], 'Example Page');

// 複数URLの一括スクレイピング
const urls = ['https://site1.com', 'https://site2.com'];
const results = await scrapeMain(urls, 'Multiple Pages');
```

## 注意点

1. **エンコーディング**
   - 特殊なエンコーディングを使用するサイトへの対応が必要な場合がある
   - Content-Typeヘッダーが不正確な場合の対応

2. **コンテンツ抽出**
   - サイト固有のレイアウトによっては追加のセレクタが必要
   - 動的コンテンツは取得できない場合がある

3. **パフォーマンス**
   - 大量のURL処理時のメモリ使用量に注意
   - 同時接続数の制限考慮

## 今後の展望

1. **機能拡張**
   - 動的コンテンツのサポート強化
   - より多くのサイトレイアウトへの対応
   - メタデータ抽出の拡充

2. **パフォーマンス改善**
   - キャッシング機能の実装
   - 並列処理の最適化
   - メモリ使用量の最適化

3. **エラーハンドリング**
   - より詳細なエラーレポート
   - リトライメカニズムの実装
   - エラー回復機能の強化
