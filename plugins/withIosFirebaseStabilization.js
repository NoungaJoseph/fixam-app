const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

function modifyPodfile(podfileContent) {
  let contents = podfileContent;
  
  // Inject global use_modular_headers! at the very top of the Podfile
  if (!contents.includes("use_modular_headers!")) {
    contents = "use_modular_headers!\n\n" + contents;
  }

  // Keep post_install patch as a safety override for other modules
  const searchString = 'post_install do |installer|';
  if (contents.includes(searchString) && !contents.includes("CLANG_ALLOW_NON_MODULAR_INCLUDES_IN_FRAMEWORK_MODULES")) {
    const replacement = `post_install do |installer|
  installer.pods_project.targets.each do |target|
    target.build_configurations.each do |config|
      config.build_settings['CLANG_ALLOW_NON_MODULAR_INCLUDES_IN_FRAMEWORK_MODULES'] = 'YES'
    end
  end
`;
    contents = contents.replace(searchString, replacement);
  }

  return contents;
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
        console.log('[withIosFirebaseStabilization] Modified Podfile successfully with global use_modular_headers!');
      }
      return config;
    },
  ]);
};
