// Mock fetch with headers and blob support
global.fetch = jest.fn(() => 
  Promise.resolve({
    text: () => Promise.resolve(''),
    ok: true,
    headers: {
      get: (name: string) => {
        if (name.toLowerCase() === 'content-type') {
          return 'text/html; charset=utf-8';
        }
        return null;
      }
    },
    blob: () => Promise.resolve(new Blob(['<!DOCTYPE html><html><head><title>Test</title></head><body>Test content</body></html>'], { type: 'text/html' }))
  } as Response)
);

// Mock FileReader
class MockFileReader {
  onload: (() => void) | null = null;
  result: string = '<!DOCTYPE html><html><head><title>Test</title></head><body>Test content</body></html>';
  readAsText(blob: Blob, encoding?: string) {
    setTimeout(() => this.onload?.(), 0);
  }
}
(global as any).FileReader = MockFileReader;

// Mock chrome.storage.local
global.chrome = {
  storage: {
    local: {
      get: jest.fn(),
      set: jest.fn(),
    },
  },
} as any;

// Mock linkedom
jest.mock('linkedom', () => ({
  parseHTML: (html: string) => ({
    window: {
      document: new DOMParser().parseFromString(html, 'text/html'),
    },
  }),
}));

// Mock OpenAI
jest.mock('@langchain/openai', () => ({
  OpenAI: jest.fn().mockImplementation(() => ({
    // Add any methods you need to mock
  })),
  OpenAIEmbeddings: jest.fn().mockImplementation(() => ({
    embedDocuments: jest.fn().mockImplementation((texts: string[]) => {
      // クエリベクトルの生成
      if (texts[0] === '物理学') {
        const queryVector = Array(1024).fill(0);
        // 物理学に関連する次元で高い値を設定
        for (let i = 0; i < 100; i++) queryVector[i] = 1.0;
        return Promise.resolve([queryVector]);
      }

      // ドキュメントベクトルの生成
      return Promise.resolve(texts.map((text: string) => {
        const vector = Array(1024).fill(0);
        
        if (text.includes('物理学') && text.includes('光')) {
          // fnorioのコンテンツ - 物理学に最も関連
          for (let i = 0; i < 100; i++) vector[i] = 1.0;  // 物理学の次元で完全一致
        } else if (text.includes('Quantum') || text.includes('Annealing')) {
          // D-WAVEのコンテンツ - 物理学に部分的に関連
          for (let i = 0; i < 100; i++) vector[i] = 0.5;  // 物理学の次元で部分一致
        } else {
          // LangChainのコンテンツ - 物理学にほとんど関連なし
          for (let i = 0; i < 100; i++) vector[i] = 0.1;  // 物理学の次元でほとんど一致しない
        }
        
        return vector;
      }));
    })
  }))
}));

// Mock Vite's import.meta.env
Object.defineProperty(global, 'import', {
  value: {
    meta: {
      env: {
        VITE_OPENAI_API_KEY: 'test-api-key',
        MODE: 'test',
        DEV: false,
        PROD: false,
        SSR: false
      }
    }
  }
});

// Set environment variables for testing
process.env.OPENAI_API_KEY = 'test-api-key';

// Add Web API polyfills for Node.js environment
import { ReadableStream, TextDecoderStream, TextEncoderStream } from 'node:stream/web';
import { TextDecoder, TextEncoder } from 'node:util';

Object.assign(global, {
  ReadableStream,
  TextDecoderStream,
  TextEncoderStream,
  TextDecoder,
  TextEncoder
});
