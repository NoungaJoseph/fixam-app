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
    patch: (content) => {
      // Replace buildscript block with safeExtGet definition only
      return content.replace(/buildscript\s*\{[\s\S]*?\n\}\n/m, `buildscript {\n    ext.safeExtGet = {prop, fallback ->\n        rootProject.ext.has(prop) ? rootProject.ext.get(prop) : fallback\n    }\n}\n`);
    }
  },
  {
    path: path.join(__dirname, '..', 'node_modules', 'react-native-safe-area-context', 'android', 'build.gradle'),
    patch: (content) => {
      // Replace buildscript block with empty buildscript
      return content.replace(/buildscript\s*\{[\s\S]*?\n\}\n/m, `buildscript {}\n`);
    }
  },
  {
    path: path.join(__dirname, '..', 'node_modules', 'react-native-webview', 'android', 'build.gradle'),
    patch: (content) => {
      // Replace buildscript block with safeExtGet definition only
      return content.replace(/buildscript\s*\{[\s\S]*?\n\}\n/m, `buildscript {\n    ext.safeExtGet = {prop ->\n        rootProject.ext.has(prop) ? rootProject.ext.get(prop) : project.properties['ReactNativeWebView_' + prop]\n    }\n}\n`);
    }
  }
];

for (const sub of subprojectsToPatch) {
  if (fs.existsSync(sub.path)) {
    const raw = fs.readFileSync(sub.path, 'utf8');
    const updated = sub.patch(raw);
    if (updated !== raw) {
      fs.writeFileSync(sub.path, updated, 'utf8');
      console.log(`[patchBuildscripts] Successfully cleaned ${path.basename(path.dirname(path.dirname(sub.path)))} build.gradle`);
    }
  }
}
