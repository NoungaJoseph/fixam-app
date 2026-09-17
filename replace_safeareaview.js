const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(function(file) {
    file = dir + '/' + file;
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else {
      if (file.endsWith('.js')) results.push(file);
    }
  });
  return results;
}

const excluded = ['HomeScreen.js', 'ProviderHomeScreen.js', 'ForgotPasswordScreen.js'];

const files = walk('src/screens');
files.forEach(file => {
  if (excluded.some(ex => file.endsWith(ex))) return;
  let content = fs.readFileSync(file, 'utf8');
  
  if (content.includes("import { SafeAreaView } from 'react-native-safe-area-context';")) {
    const parts = file.split('/');
    const depth = parts.length - 2;
    const relativePrefix = '../'.repeat(depth);
    const newImport = `import SafeAreaView from '${relativePrefix}components/Common/TealSafeAreaView';`;
    content = content.replace("import { SafeAreaView } from 'react-native-safe-area-context';", newImport);
    fs.writeFileSync(file, content, 'utf8');
    console.log('Updated ' + file);
  }
  else if (content.includes("import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';")) {
    const parts = file.split('/');
    const depth = parts.length - 2;
    const relativePrefix = '../'.repeat(depth);
    const newImport = `import { useSafeAreaInsets } from 'react-native-safe-area-context';\nimport SafeAreaView from '${relativePrefix}components/Common/TealSafeAreaView';`;
    content = content.replace("import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';", newImport);
    fs.writeFileSync(file, content, 'utf8');
    console.log('Updated ' + file);
  }
});
