const fs = require('fs');
const path = require('path');

const deps = [
  'react-native-reanimated',
  'react-native-gesture-handler',
  'react-native-screens',
  'react-native-safe-area-context',
  '@react-navigation/native',
  '@react-navigation/drawer',
  '@react-navigation/stack',
  '@react-navigation/bottom-tabs'
];

console.log('--- Dependency Check ---');
deps.forEach(dep => {
  const p = path.join(__dirname, 'node_modules', dep);
  if (fs.existsSync(p)) {
    const pkg = JSON.parse(fs.readFileSync(path.join(p, 'package.json'), 'utf8'));
    console.log(`✅ ${dep}: ${pkg.version}`);
  } else {
    console.log(`❌ ${dep}: NOT FOUND`);
  }
});

console.log('\n--- Babel Config ---');
const babelPath = path.join(__dirname, 'babel.config.js');
if (fs.existsSync(babelPath)) {
  console.log('✅ babel.config.js found');
  console.log(fs.readFileSync(babelPath, 'utf8'));
} else {
  console.log('❌ babel.config.js NOT FOUND');
}
