# 文字化け問題の原因分析

## 主要な問題点

### 1. response.text()の問題
```typescript
let html = await response.text();
```
- `response.text()`は自動的にUTF-8でデコードを試みる
- Content-Typeのcharsetを考慮せずにデコードするため、Shift-JISやEUC-JPのコンテンツが文字化けする
- charsetの検出が`response.text()`の後になっているため、既に文字化けが発生した後

### 2. エンコーディング処理の順序
```typescript
const contentType = response.headers.get('content-type');
let charset = contentType?.match(/charset=([^;]+)/i)?.[1]?.toLowerCase() || 'utf-8';
```
- エンコーディング検出が実際のデコード処理の後に行われている
- 検出したcharsetが実際のデコード処理に使用されていない

### 3. linkedomのパース処理
```typescript
const { window } = parseHTML(html);
```
- 既に文字化けしたHTMLをパースしているため、DOM構築後も文字化けが継続
- parseHTML関数に文字エンコーディング情報が渡されていない

## 正しい処理順序

1. レスポンスのバイナリデータを取得
```typescript
const buffer = await response.arrayBuffer();
```

2. エンコーディングを検出
```typescript
const contentType = response.headers.get('content-type');
const charset = detectCharset(contentType, buffer);
```

3. 適切なエンコーディングでデコード
```typescript
const decoder = new TextDecoder(charset);
const html = decoder.decode(buffer);
```

4. デコードされたHTMLをパース
```typescript
const { window } = parseHTML(html);
```

## 具体的な修正案

```typescript
async function scrapeUrl(url: string): Promise<Document | null> {
  try {
    // 1. バイナリデータとして取得
    const response = await fetch(url);
    const buffer = await response.arrayBuffer();

    // 2. エンコーディング検出
    const contentType = response.headers.get('content-type');
    const charset = detectCharset(contentType, buffer);

    // 3. 適切なエンコーディングでデコード
    const decoder = new TextDecoder(charset);
    const html = decoder.decode(buffer);

    // 4. HTMLのパース
    const { window } = parseHTML(html);
    // ... 以降の処理 ...
  } catch (error) {
    console.error(`Error fetching ${url}:`, error);
    return null;
  }
}
```

## エンコーディング検出の改善

```typescript
function detectCharset(contentType: string | null, buffer: ArrayBuffer): string {
  // 1. Content-Typeからの検出
  const declaredCharset = contentType?.match(/charset=([^;]+)/i)?.[1]?.toLowerCase();
  if (declaredCharset) {
    return normalizeCharset(declaredCharset);
  }

  // 2. バイナリデータからの検出
  const bytes = new Uint8Array(buffer.slice(0, 1024)); // 先頭1024バイトを確認
  
  // Shift-JISの特徴的なバイトパターンをチェック
  const hasSjisPattern = bytes.some(byte => 
    (byte >= 0x81 && byte <= 0x9F) || (byte >= 0xE0 && byte <= 0xEF)
  );
  
  if (hasSjisPattern) {
    return 'shift_jis';
  }

  // デフォルトはUTF-8
  return 'utf-8';
}

function normalizeCharset(charset: string): string {
  switch (charset.toLowerCase()) {
    case 'shift_jis':
    case 'shift-jis':
    case 'x-sjis':
      return 'shift_jis';
    case 'euc-jp':
    case 'x-euc-jp':
      return 'euc-jp';
    default:
      return 'utf-8';
  }
}
```

## 期待される効果

1. **正確なエンコーディング処理**
   - バイナリデータを適切なエンコーディングでデコード
   - 文字化けの発生を防止

2. **より堅牢な文字コード判定**
   - Content-Type
   - バイナリパターン
   - メタタグ（必要に応じて）

3. **デバッグ性の向上**
   - エンコーディング検出プロセスの可視化
   - エラーケースの特定が容易に

## 注意点

1. **パフォーマンスへの影響**
   - バイナリデータの処理による若干のオーバーヘッド
   - エンコーディング検出処理の追加

2. **エラーハンドリング**
   - デコード失敗時の適切なフォールバック
   - 不正なエンコーディング指定への対応

3. **互換性**
   - 特殊なエンコーディングへの対応
   - レガシーサイトのサポート
