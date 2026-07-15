const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

function modifyPodfile(podfileContent) {
  const searchString = 'post_install do |installer|';
  if (!podfileContent.includes(searchString)) {
    return podfileContent;
  }

  // Check if we already injected our modification to avoid duplicate code
  if (podfileContent.includes("CLANG_ALLOW_NON_MODULAR_INCLUDES_IN_FRAMEWORK_MODULES")) {
    return podfileContent;
  }

  const replacement = `post_install do |installer|
  # Allow non-modular includes in framework modules for react-native-firebase
  installer.pods_project.targets.each do |target|
    target.build_configurations.each do |config|
      config.build_settings['CLANG_ALLOW_NON_MODULAR_INCLUDES_IN_FRAMEWORK_MODULES'] = 'YES'
    end
  end
`;

  return podfileContent.replace(searchString, replacement);
}

module.exports = function withIosFirebaseStabilization(config) {
  return withDangerousMod(config, [
    'ios',
    async (config) => {
      const podfilePath = path.join(config.modRequest.projectRoot, 'ios', 'Podfile');
      if (fs.existsSync(podfilePath)) {
        let podfileContent = fs.readFileSync(podfilePath, 'utf8');
        podfileContent = modifyPodfile(podfileContent);
        fs.writeFileSync(podfilePath, podfileContent, 'utf8');
        console.log('[withIosFirebaseStabilization] Modified Podfile successfully');
      }
      return config;
    },
  ]);
};
