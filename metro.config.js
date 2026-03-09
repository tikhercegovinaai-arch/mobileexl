const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Fix for import.meta in React Native Web
config.resolver.sourceExts = ['jsx', 'js', 'ts', 'tsx', 'json', 'node'];

// Blocklist problematic packages for web if needed
config.resolver.resolutionFunc = 'highest';

module.exports = config;
