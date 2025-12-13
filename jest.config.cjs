/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'jsdom',
  cacheDirectory: '<rootDir>/.jest-cache',
  testMatch: ['<rootDir>/src/**/*.test.{js,jsx}', '<rootDir>/src/**/__tests__/**/*.{js,jsx}'],
  transform: {
    '^.+\\.(js|jsx)$': [
      '@swc/jest',
      {
        jsc: {
          parser: { syntax: 'ecmascript', jsx: true },
          transform: { react: { runtime: 'automatic' } },
        },
        module: { type: 'commonjs' },
      },
    ],
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '\\.(css|less|scss|sass)$': '<rootDir>/test/styleMock.cjs',
    '\\.(gif|ttf|eot|svg|png|jpg|jpeg|webp)$': '<rootDir>/test/fileMock.cjs',
  },
}
