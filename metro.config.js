// metro.config.js
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// EAS validation fails on this property, so we must remove it from the default config
if (config.watcher && config.watcher.unstable_workerThreads !== undefined) {
  delete config.watcher.unstable_workerThreads;
}

// Exclude unnecessary file types from bundle
config.resolver.assetExts = config.resolver.assetExts
  .filter(ext => ext !== 'svg')  // use react-native-svg instead
  
// Add source extensions
config.resolver.sourceExts = [
  ...config.resolver.sourceExts,
  'cjs'
]

// Optimize transformer
config.transformer = {
  ...config.transformer,
  minifierConfig: {
    keep_fnames: true,
    mangle: {
      keep_fnames: true
    }
  }
}

module.exports = config;
