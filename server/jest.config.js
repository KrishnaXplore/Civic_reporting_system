module.exports = {
  testEnvironment: 'node',
  setupFilesAfterEnv: ['./tests/setup.js'],
  testMatch: ['**/tests/**/*.test.js'],
  testTimeout: 30000,
  verbose: true,
  forceExit: true,
  clearMocks: true,
};
