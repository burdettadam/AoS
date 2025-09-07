/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.ts'],
  verbose: false,
  // Allow transforming our workspace package written in TS
  transformIgnorePatterns: [
    'node_modules/(?!@botc/shared)'
  ],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'json'],
  roots: ['<rootDir>']
};
