module.exports = {
  preset: 'jest-expo',
  clearMocks: true,
  collectCoverage: true,
  coverageDirectory: 'coverage',
  roots: ['<rootDir>', '<rootDir>/../../tests'],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testMatch: ['**/__tests__/**/*.?([mc])[jt]s?(x)', '**/?(*.)+(spec|test).?([mc])[jt]s?(x)'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  collectCoverageFrom: ['src/**/*.{ts,tsx}', '!src/**/*.d.ts'],
};
