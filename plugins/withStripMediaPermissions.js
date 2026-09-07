const { withAndroidManifest } = require('expo/config-plugins');

/**
 * Custom Expo config plugin to forcefully remove banned media/storage permissions
 * from the final Android manifest. This ensures Google Play compliance with the
 * Photo Picker policy (apps targeting API 33+ must use system pickers instead of
 * requesting broad READ_MEDIA_* permissions).
 *
 * This plugin runs AFTER all library manifests are merged, so it catches permissions
 * injected by expo-image-picker, expo-image, expo-file-system, etc.
 */

const BANNED_PERMISSIONS = [
  'android.permission.READ_MEDIA_IMAGES',
  'android.permission.READ_MEDIA_VIDEO',
  'android.permission.READ_MEDIA_AUDIO',
  'android.permission.READ_MEDIA_VISUAL_USER_SELECTED',
  'android.permission.READ_EXTERNAL_STORAGE',
];

function withStripMediaPermissions(config) {
  return withAndroidManifest(config, (config) => {
    const manifest = config.modResults;

    // The manifest structure has a top-level 'manifest' key with 'uses-permission' array
    if (manifest.manifest && Array.isArray(manifest.manifest['uses-permission'])) {
      const before = manifest.manifest['uses-permission'].length;

      manifest.manifest['uses-permission'] = manifest.manifest['uses-permission'].filter(
        (perm) => {
          const permName =
            perm?.$?.['android:name'] ||
            perm?.['$']?.['android:name'] ||
            '';
          return !BANNED_PERMISSIONS.includes(permName) && permName !== 'android.permission.WRITE_EXTERNAL_STORAGE';
        }
      );

      const after = manifest.manifest['uses-permission'].length;
      const removed = before - after;

      if (removed > 0) {
        console.log(
          `[withStripMediaPermissions] Removed ${removed} banned permission(s) from AndroidManifest.xml`
        );
      } else {
        console.log(
          `[withStripMediaPermissions] No banned permissions found in AndroidManifest.xml (already clean)`
        );
      }
      // Add explicit tools:node="remove" entries so Gradle Manifest Merger strips them from any AAR libraries
      BANNED_PERMISSIONS.forEach((banned) => {
        manifest.manifest['uses-permission'].push({
          $: {
            'android:name': banned,
            'tools:node': 'remove',
          },
        });
      });

      // Allow WRITE_EXTERNAL_STORAGE ONLY up to Android 9 (API 28) for camera cache on older devices
      // Google Play Policy explicitly allows WRITE_EXTERNAL_STORAGE when restricted with maxSdkVersion="28"
      manifest.manifest['uses-permission'].push({
        $: {
          'android:name': 'android.permission.WRITE_EXTERNAL_STORAGE',
          'android:maxSdkVersion': '28',
          'tools:replace': 'android:maxSdkVersion',
        },
      });
    }

    // Also strip from 'uses-permission-sdk-23' if present (runtime-only permissions)
    if (manifest.manifest && Array.isArray(manifest.manifest['uses-permission-sdk-23'])) {
      manifest.manifest['uses-permission-sdk-23'] = manifest.manifest['uses-permission-sdk-23'].filter(
        (perm) => {
          const permName =
            perm?.$?.['android:name'] ||
            perm?.['$']?.['android:name'] ||
            '';
          return !BANNED_PERMISSIONS.includes(permName);
        }
      );
    }

    return config;
  });
}

module.exports = withStripMediaPermissions;
