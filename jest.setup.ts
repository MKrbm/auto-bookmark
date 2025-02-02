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
