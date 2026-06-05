// metro.config.js
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// EAS validation fails on this property, so we must remove it from the default config
delete config.watcher.unstable_workerThreads;

module.exports = config;
