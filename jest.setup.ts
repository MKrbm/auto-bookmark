// Setup required globals before importing JSDOM
import { TextEncoder, TextDecoder } from 'util';
import { ReadableStream, TextDecoderStream, TextEncoderStream } from 'node:stream/web';

Object.assign(global, {
  TextEncoder: TextEncoder,
  TextDecoder: TextDecoder,
  ReadableStream: ReadableStream,
  TextDecoderStream: TextDecoderStream,
  TextEncoderStream: TextEncoderStream,
});

// Now import and setup JSDOM
import { JSDOM } from 'jsdom';
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
  url: 'http://localhost',
  pretendToBeVisual: true,
});

// Setup remaining globals
Object.assign(global, {
  document: dom.window.document,
  window: dom.window,
  DOMParser: dom.window.DOMParser,
  Headers: dom.window.Headers,
  Blob: dom.window.Blob,
});

// Set environment variables for testing
process.env.OPENAI_API_KEY = 'test-api-key';

// Mock fetch with sample HTML content
global.fetch = jest.fn((input: RequestInfo | URL, init?: RequestInit) => {
  const url = input.toString();
  const sampleHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Sample Page</title>
      </head>
      <body>
        <article>
          <h1>Sample Content</h1>
          <p>This is sample content for testing purposes.</p>
          ${url.includes('fnorio.com') ? '<p>Content about physics, colors, and the principles of light. This article explores the fundamental concepts of physics in color theory.</p>' : ''}
          ${url.includes('langchain.com') ? '<p>Content about AI and LLMs. Using artificial intelligence for natural language processing.</p>' : ''}
          ${url.includes('dwavesys.com') ? '<p>Content about quantum computing and quantum physics. Understanding the principles of quantum mechanics and quantum annealing.</p>' : ''}
        </article>
      </body>
    </html>
  `;

  return Promise.resolve({
    headers: new Headers({
      'content-type': 'text/html; charset=utf-8'
    }),
    text: () => Promise.resolve(sampleHtml),
    ok: true,
  } as Response);
});

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
      // テキストの内容に基づいて異なるベクトルを返す
      return Promise.resolve(texts.map((text: string) => {
        const vector = Array(1024).fill(0.1);
        if (text.toLowerCase().includes('physics') || text.toLowerCase().includes('物理')) {
          vector[0] = 0.9; // 物理学関連のコンテンツは高いスコア
        } else if (text.toLowerCase().includes('quantum')) {
          vector[0] = 0.7; // 量子関連のコンテンツは中程度のスコア
        }
        return vector;
      }));
    }),
    embedQuery: jest.fn().mockImplementation((query) => {
      const vector = Array(1024).fill(0.1);
      if (query.includes('物理学')) {
        vector[0] = 0.9; // 物理学クエリは物理学コンテンツと高い類似度
      }
      return Promise.resolve(vector);
    })
  }))
}));
