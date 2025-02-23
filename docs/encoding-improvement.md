# エンコーディング処理の改善案

## 現状の問題点
- Content-Typeヘッダーのcharsetに依存した文字コード判定
- Shift-JIS/EUC-JPサイトでの文字化け発生
- 特にメタデータ（タイトル、見出し）での文字化けが顕著

## 改善案

### 1. エンコーディング検出の強化
```typescript
async function detectEncoding(response: Response): Promise<string> {
  // 1. Content-Typeヘッダーのチェック
  const contentType = response.headers.get('content-type');
  const declaredCharset = contentType?.match(/charset=([^;]+)/i)?.[1]?.toLowerCase();

  // 2. HTMLメタタグのチェック
  const buffer = await response.arrayBuffer();
  const detector = new TextDecoder('utf-8');
  const html = detector.decode(buffer);
  const metaCharset = html.match(/<meta[^>]+charset=["']?([^"'>]+)/i)?.[1]?.toLowerCase();

  // 3. コンテンツの特徴に基づく判定
  const hasJapaneseChars = /[\u3000-\u303f\u3040-\u309f\u30a0-\u30ff\uff00-\uff9f\u4e00-\u9faf]/.test(html);
  const hasSjisSpecificChars = /[\u8140-\u9ffc]/.test(html);

  // 4. 優先順位付きの判定ロジック
  if (declaredCharset === 'shift_jis' || declaredCharset === 'shift-jis' || declaredCharset === 'x-sjis') {
    return 'shift_jis';
  }
  if (declaredCharset === 'euc-jp') {
    return 'euc-jp';
  }
  if (metaCharset === 'shift_jis' || metaCharset === 'shift-jis') {
    return 'shift_jis';
  }
  if (metaCharset === 'euc-jp') {
    return 'euc-jp';
  }
  if (hasJapaneseChars && hasSjisSpecificChars) {
    return 'shift_jis';
  }
  
  return 'utf-8'; // デフォルト
}
```

### 2. デコード処理の改善
```typescript
async function decodeContent(response: Response): Promise<string> {
  const encoding = await detectEncoding(response);
  const buffer = await response.arrayBuffer();
  
  try {
    const decoder = new TextDecoder(encoding);
    return decoder.decode(buffer);
  } catch (error) {
    console.warn(`Failed to decode with ${encoding}, falling back to utf-8`);
    const fallbackDecoder = new TextDecoder('utf-8');
    return fallbackDecoder.decode(buffer);
  }
}
```

### 3. 文字化け検出と自動修正
```typescript
function detectAndFixGarbledText(text: string): string {
  // 文字化けパターンの検出
  const hasGarbledPattern = /�/.test(text) || 
                           /[\ufffd\uffff]/.test(text) ||
                           /[\u0000-\u001f\u007f-\u009f]/.test(text);

  if (hasGarbledPattern) {
    // 1. 不正なバイト列の除去
    text = text.replace(/[\ufffd\uffff]/g, '');
    
    // 2. 制御文字の除去（改行とタブを除く）
    text = text.replace(/[\x00-\x09\x0B\x0C\x0E-\x1F\x7F]/g, '');
    
    // 3. 全角スペースの正規化
    text = text.replace(/\u3000/g, ' ');
    
    // 4. サロゲートペア文字の正規化
    text = Array.from(text).join('');
  }

  return text;
}
```

### 4. 実装手順

1. **エンコーディング検出の強化**
   - Content-Typeヘッダー
   - HTMLメタタグ
   - コンテンツの特徴分析
   - 日本語文字の存在確認

2. **デコード処理の改善**
   - 適切なエンコーディングでのデコード
   - フォールバック処理の実装
   - エラーハンドリングの強化

3. **文字化け検出と修正**
   - パターンベースの検出
   - 自動修正ロジックの適用
   - ログ出力による追跡

4. **テストケースの追加**
   - 各種エンコーディングのテスト
   - 文字化けパターンのテスト
   - 自動修正のテスト

## 期待される効果

1. **文字化けの大幅な削減**
   - より正確なエンコーディング検出
   - 適切なデコード処理
   - 文字化け時の自動修正

2. **日本語サイトへの対応強化**
   - Shift-JIS対応の改善
   - EUC-JP対応の改善
   - 文字コード混在サイトへの対応

3. **デバッグ性の向上**
   - 詳細なログ出力
   - エラーの追跡容易性
   - 問題箇所の特定

## 注意点

1. **パフォーマンスへの影響**
   - エンコーディング検出による処理時間の増加
   - バッファ処理のメモリ使用量

2. **互換性の考慮**
   - レガシーサイトへの対応
   - 特殊な文字コードへの対応

3. **エラー処理**
   - デコード失敗時の適切なフォールバック
   - エラーログの管理
