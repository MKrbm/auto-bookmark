// Mock fetch
global.fetch = jest.fn(() => 
  Promise.resolve({
    text: () => Promise.resolve(''),
    ok: true,
  } as Response)
);

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
    embedDocuments: jest.fn().mockImplementation((texts) => 
      Promise.resolve(texts.map(() => Array(1024).fill(0.1))) // 1024次元のベクトルを返す
    )
  }))
}));

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
