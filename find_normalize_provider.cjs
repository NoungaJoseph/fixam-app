const fs = require('fs');
const content = fs.readFileSync('src/context/AppContext.js', 'utf8');
const lines = content.split('\n');
lines.forEach((line, index) => {
  if (line.includes('normalizeProvider') || line.includes('function normalizeProvider') || line.includes('const normalizeProvider')) {
    console.log(`L${index + 1}: ${line}`);
  }
});
