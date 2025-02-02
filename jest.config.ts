export default {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
  },
  testMatch: [
    '**/__tests__/**/*.test.[jt]s?(x)',
  ],
  setupFiles: ['<rootDir>/jest.setup.ts'],
};
