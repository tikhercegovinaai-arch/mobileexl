const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Force Metro to use the main entry point for xlsx
config.resolver.extraNodeModules = {
    ...config.resolver.extraNodeModules,
    xlsx: path.resolve(__dirname, 'node_modules/xlsx/xlsx.js'),
};

module.exports = config;
