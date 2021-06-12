// Sync object
const config = {
  preset: 'ts-jest',
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
  testEnvironment: 'node',
  testMatch: ['**/*.spec.ts'],
};

export default config;
