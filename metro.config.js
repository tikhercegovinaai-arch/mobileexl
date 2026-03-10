const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Force Metro to use the CJS (CommonJS) entry point for packages
// that use import.meta in their ESM builds (e.g. Zod v4, zod-to-json-schema).
// Metro bundler does not support import.meta, so we must use require builds.
config.resolver.extraNodeModules = {
    ...config.resolver.extraNodeModules,
    xlsx: path.resolve(__dirname, 'node_modules/xlsx/xlsx.js'),
    zod: path.resolve(__dirname, 'node_modules/zod/index.cjs'),
    'zod-to-json-schema': path.resolve(__dirname, 'node_modules/zod-to-json-schema/dist/index.cjs'),
};

module.exports = config;
