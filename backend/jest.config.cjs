module.exports = {
  testEnvironment: "node",
  roots: ["<rootDir>/tests"],
  setupFiles: ["<rootDir>/tests/setup/register-ts.js"],
  collectCoverageFrom: ["dist/**/*.js", "!dist/index.js"],
  coverageDirectory: "coverage",
  clearMocks: true,
  testTimeout: 30000
};
