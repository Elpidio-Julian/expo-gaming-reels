const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');
const defaultResolver = require('metro-resolver').resolve;

const config = getDefaultConfig(__dirname);

// Custom resolver to handle alias imports starting with '@/'
config.resolver.resolveRequest = (context, moduleName, platform, moduleOptions) => {
  if (moduleName.startsWith('@/')) {
    // Remove the '@/'
    const relativeModulePath = moduleName.replace(/^@\//, '');
    // Resolve the module path relative to the project root.
    const newModuleName = path.resolve(__dirname, relativeModulePath);
    return defaultResolver(context, newModuleName, platform, moduleOptions);
  }
  return defaultResolver(context, moduleName, platform, moduleOptions);
};

module.exports = config;