const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, '..', 'node_modules', 'expo-image-picker', 'android', 'src', 'main', 'java', 'expo', 'modules', 'imagepicker', 'ImagePickerModule.kt');

if (fs.existsSync(targetFile)) {
  let content = fs.readFileSync(targetFile, 'utf8');
  if (content.includes('Manifest.permission.WRITE_EXTERNAL_STORAGE.takeIf')) {
    const oldCode = `  private suspend fun ensureCameraPermissionsAreGranted(): Unit = suspendCancellableCoroutine { continuation ->
    val permissions = appContext.permissions ?: throw ModuleNotFoundException("Permissions")

    permissions.askForPermissions(
      { permissionsResponse ->
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
          if (permissionsResponse[Manifest.permission.CAMERA]?.status == PermissionsStatus.GRANTED) {
            continuation.resume(Unit)
          } else {
            continuation.resumeWithException(UserRejectedPermissionsException())
          }
        } else if (
          permissionsResponse[Manifest.permission.WRITE_EXTERNAL_STORAGE]?.status == PermissionsStatus.GRANTED &&
          permissionsResponse[Manifest.permission.CAMERA]?.status == PermissionsStatus.GRANTED
        ) {
          continuation.resume(Unit)
        } else {
          continuation.resumeWithException(UserRejectedPermissionsException())
        }
      },
      *listOfNotNull(
        Manifest.permission.WRITE_EXTERNAL_STORAGE.takeIf { Build.VERSION.SDK_INT < Build.VERSION_CODES.Q },
        Manifest.permission.CAMERA
      ).toTypedArray()
    )
  }`;

    const newCode = `  private suspend fun ensureCameraPermissionsAreGranted(): Unit = suspendCancellableCoroutine { continuation ->
    val permissions = appContext.permissions ?: throw ModuleNotFoundException("Permissions")

    permissions.askForPermissions(
      { permissionsResponse ->
        if (permissionsResponse[Manifest.permission.CAMERA]?.status == PermissionsStatus.GRANTED) {
          continuation.resume(Unit)
        } else {
          continuation.resumeWithException(UserRejectedPermissionsException())
        }
      },
      Manifest.permission.CAMERA
    )
  }`;

    content = content.replace(oldCode, newCode);
    fs.writeFileSync(targetFile, content, 'utf8');
    console.log('[patchImagePicker] Successfully patched ImagePickerModule.kt for CAMERA-only permission check');
  } else {
    console.log('[patchImagePicker] ImagePickerModule.kt is already patched or up to date');
  }
} else {
  console.log('[patchImagePicker] Target file does not exist yet (node_modules not installed)');
}

// Patch subproject buildscripts to prevent downloading old standalone AGP plugins
const subprojectsToPatch = [
  {
    path: path.join(__dirname, '..', 'node_modules', 'react-native-vector-icons', 'android', 'build.gradle'),
    pattern: /repositories\s*\{\s*google\(\)\s*gradlePluginPortal\(\)\s*\}\s*dependencies\s*\{\s*classpath\(["']com\.android\.tools\.build:gradle:7\.0\.4["']\)\s*\}/,
    replacement: `if (project == rootProject) {\n        repositories {\n            google()\n            gradlePluginPortal()\n        }\n        dependencies {\n            classpath("com.android.tools.build:gradle:7.0.4")\n        }\n    }`
  },
  {
    path: path.join(__dirname, '..', 'node_modules', 'react-native-safe-area-context', 'android', 'build.gradle'),
    pattern: /buildscript\s*\{([\s\S]*?)dependencies\s*\{[\s\S]*?com\.android\.tools\.build:gradle:7\.3\.1[\s\S]*?\}\s*\}/,
    replacement: `buildscript {\n    if (project == rootProject) {\n        def kotlin_version = rootProject.ext.has('kotlinVersion') ? rootProject.ext.get('kotlinVersion') : project.properties['RNSAC_kotlinVersion']\n        repositories { mavenCentral(); google() }\n        dependencies {\n            classpath("org.jetbrains.kotlin:kotlin-gradle-plugin:$kotlin_version")\n            classpath("com.android.tools.build:gradle:7.3.1")\n            classpath("com.diffplug.spotless:spotless-plugin-gradle:6.11.0")\n        }\n    }\n}`
  },
  {
    path: path.join(__dirname, '..', 'node_modules', 'react-native-webview', 'android', 'build.gradle'),
    pattern: /repositories\s*\{\s*google\(\)\s*gradlePluginPortal\(\)\s*\}\s*dependencies\s*\{[\s\S]*?com\.android\.tools\.build:gradle:7\.0\.4["']\)\s*\}/,
    replacement: `if (project == rootProject) {\n        repositories {\n            google()\n            gradlePluginPortal()\n        }\n        dependencies {\n            classpath("org.jetbrains.kotlin:kotlin-gradle-plugin:\${safeExtGet('kotlinVersion')}")\n            classpath("com.android.tools.build:gradle:7.0.4")\n        }\n    }`
  }
];

for (const sub of subprojectsToPatch) {
  if (fs.existsSync(sub.path)) {
    let raw = fs.readFileSync(sub.path, 'utf8');
    if (sub.pattern.test(raw)) {
      raw = raw.replace(sub.pattern, sub.replacement);
      fs.writeFileSync(sub.path, raw, 'utf8');
      console.log(`[patchBuildscripts] Patched ${path.basename(path.dirname(path.dirname(sub.path)))} build.gradle`);
    }
  }
}
