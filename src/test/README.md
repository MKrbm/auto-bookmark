# テストランナーの説明

## testRunnerFetched.ts について

このテストランナーは、ブックマークのスクレイピング、チャンク分割、Embedding、および検索機能をテストするためのツールです。

## 実装の背景

従来のブックマーク検索では、ブックマーク単位でsearchStringをリアルタイムにEmbeddingしていましたが、
以下の課題がありました：

1. 検索時に毎回Embeddingが必要
2. ページの実際の内容ではなく、searchStringのみが検索対象
3. 長文コンテンツの場合、文脈の一部しか捉えられない

これらの課題を解決するため、新しいアプローチとして：

1. 事前にページをスクレイピングしてコンテンツを取得
2. コンテンツをチャンクに分割してEmbedding
3. チャンク単位で検索を実行

という方式を採用しました。これにより：

- 検索時の処理が高速化（事前計算されたベクトルを利用）
- より正確な検索（実際のコンテンツに基づく）
- きめ細かい文脈の把握（チャンク単位での類似度計算）

が可能になりました。

### 主な機能

1. スクレイピングとEmbedding
   - FetchedBookmark形式のデータを受け取り
   - スクレイピングでコンテンツを取得
   - チャンク分割とEmbedding処理を実行
   - LocalStorageにベクトル情報を保存

2. 代表チャンク検索
   - 「物理学」をキーワードとした検索を実行
   - URL単位でグループ化された結果を取得
   - 各URLの最適なチャンクを表示
   - 類似度スコアの分布を確認

### テストデータ

テスト用のブックマークデータには以下が含まれます：
1. 光学に関する記事（物理学関連）
2. LangChainのドキュメント（AI関連）
3. 物理学の入門サイト

### 実行方法

1. 環境設定
```bash
# プロジェクトルートに.envファイルを作成し、以下を設定
VITE_OPENAI_API_KEY=your_api_key_here

# 注: OpenAI APIキーは以下から取得可能
# https://platform.openai.com/api-keys
```


2. Chrome拡張機能として読み込み
- chrome://extensions/ を開く
- デベロッパーモードを有効化
- 「パッケージ化されていない拡張機能を読み込む」で dist/ を選択

3. テストページにアクセス
```
chrome-extension://<拡張機能ID>/test/testFetched.html
```

4. DevToolsのコンソールを開いて結果を確認
- Console タブを選択
- 「=== testRunnerFetched.ts loaded ===」が表示されることを確認
- スクレイピングとEmbeddingの進行状況を確認
- 最終的な検索結果と類似度スコアを確認

### 期待される出力

1. processFetchedBookmarksの実行結果
```json
[
  {
    "userId": "u-001",
    "url": "http://fnorio.com/0074trichromatism1/trichromatism1.html",
    "path": {
      "segments": ["Bookmarks Bar", "cameras"],
      "name": "光と絵の具の三原色（色とは何か）"
    },
    "chunk_index": 0,
    "chunk_text": "光の三原色について...(省略)...",
    "chunk_vector": [0.123, -0.456, 0.789]
  },
  // ... 他のチャンク
]
```

2. 「物理学」での検索結果
```json
[
  {
    "url": "https://example.com/physics",
    "title": "現代物理学入門",
    "snippet": "物理学の基本概念について...(省略)...",
    "similarity": 0.8765
  },
  // ... 他の検索結果
]
```

3. 類似度スコアの範囲
```
=== 類似度スコア ===
最大: 0.8765
最小: 0.2345
```

### 注意点

- HMRは無効化されているため、コード変更時は再ビルドが必要
- スクレイピング対象のサイトによってはCORSエラーが発生する可能性あり
- テスト用URLは適宜変更可能（testRunnerFetched.ts内のfetchedBookmarksを編集）

### 今後の展望

1. 検索機能の拡張
   - 複数キーワードでの検索
   - 類似度の閾値設定
   - チャンクの重要度による重み付け

2. パフォーマンスの最適化
   - ベクトルのキャッシュ戦略
   - チャンクサイズの最適化
   - 並列処理の導入

3. UI/UX の改善
   - 検索結果のハイライト表示
   - チャンク間の関連性の可視化
   - インタラクティブな検索結果の絞り込み

### 関連ファイル

- src/test/testFetched.html - テストページ
- src/app/features/lib/runnerBookmarks_new.ts - スクレイピング＆Embedding処理
- src/app/features/search/aiSearchRepresentative.ts - 代表チャンク検索
