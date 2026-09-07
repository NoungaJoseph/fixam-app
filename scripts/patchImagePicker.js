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
