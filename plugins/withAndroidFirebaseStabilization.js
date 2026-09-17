const {
  withAppBuildGradle,
  withProjectBuildGradle,
} = require('@expo/config-plugins');

const GOOGLE_SERVICES_CLASSPATH = "classpath 'com.google.gms:google-services:4.4.2'";
const GOOGLE_SERVICES_PLUGIN = "apply plugin: 'com.google.gms.google-services'";

function ensureProjectGoogleServices(buildGradle) {
  let contents = buildGradle.replace(
    /^\s*classpath\s+['"]com\.google\.gms:google-services:[^'"]+['"]\s*$/gm,
    `        ${GOOGLE_SERVICES_CLASSPATH}`,
  );

  if (!contents.includes(GOOGLE_SERVICES_CLASSPATH)) {
    contents = contents.replace(
      /dependencies\s*\{\s*\n/,
      (match) => `${match}        ${GOOGLE_SERVICES_CLASSPATH}\n`,
    );
  }

  return contents;
}

function ensureAppGoogleServices(buildGradle) {
  const withoutDuplicates = buildGradle
    .replace(/^\s*apply plugin:\s*['"]com\.google\.gms\.google-services['"]\s*$/gm, '')
    .replace(/\n{3,}/g, '\n\n')
    .trimEnd();

  return `${withoutDuplicates}\n${GOOGLE_SERVICES_PLUGIN}\n`;
}

module.exports = function withAndroidFirebaseStabilization(config) {
  config = withProjectBuildGradle(config, (config) => {
    config.modResults.contents = ensureProjectGoogleServices(config.modResults.contents);
    return config;
  });

  return withAppBuildGradle(config, (config) => {
    config.modResults.contents = ensureAppGoogleServices(config.modResults.contents);
    return config;
  });
};
