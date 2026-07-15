const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

function modifyPodfile(podfileContent) {
  let contents = podfileContent;
  
  // Inject pre_install at the very top of the Podfile to enable modular headers for Firebase pods
  if (!contents.includes("pod.use_modular_headers!")) {
    const preInstallHook = `
pre_install do |installer|
  installer.pod_targets.each do |pod|
    if pod.name.start_with?('Firebase') || pod.name.start_with?('Google') || pod.name.start_with?('PromisesObjC') || pod.name.start_with?('nanopb')
      pod.use_modular_headers!
    end
  end
end
`;
    contents = preInstallHook + "\n" + contents;
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
        console.log('[withIosFirebaseStabilization] Modified Podfile successfully with pre_install modular headers');
      }
      return config;
    },
  ]);
};
