/**
 * For a detailed explanation regarding each configuration property, visit:
 * https://jestjs.io/docs/configuration
 */

import type { Config } from 'jest'

const config: Config = {

    // Automatically clear mock calls, instances, contexts and results before every test
    clearMocks: true,
    testEnvironment: 'jsdom',
    // Indicates whether the coverage information should be collected while executing the test
    collectCoverage: true,

    // An array of glob patterns indicating a set of files for which coverage information should be collected
    // collectCoverageFrom: undefined,

    // The directory where Jest should output its coverage files
    coverageDirectory: 'coverage',

    moduleFileExtensions: [
        'js',
        'mjs',
        'cjs',
        'jsx',
        'ts',
        'tsx',
        'json',
        'node'
    ],
    // The root directory that Jest should scan for tests and modules within
    rootDir: '.',
    moduleDirectories: ['node_modules', '<rootDir>/src'],
    // An array of regexp pattern strings that are matched against all test paths, matched tests are skipped
    testPathIgnorePatterns: [
        '\\\\node_modules\\\\'
    ],

    // A list of paths to directories that Jest should use to search for files in
    roots: [
        '<rootDir>/src/'
    ],

    moduleNameMapper: {
        '^.+\\.(css|less|scss)$': 'identity-obj-proxy',
        '.+\\.(png|jpg|ttf|woff|woff2)$': '<rootDir>/config/SetUpJest/mockJest.ts'
    },

    setupFilesAfterEnv: [
        '<rootDir>config/SetUpJest/SetUpTest.ts'
    ],
    globals: {
        __IS_DEV__: false,
        __API__: true
    }

}

export default config
