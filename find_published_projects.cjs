const fs = require('fs');
const content = fs.readFileSync('src/context/AppContext.js', 'utf8');
const lines = content.split('\n');
lines.forEach((line, index) => {
  if (line.includes('publishedProjects') || line.includes('published_projects')) {
    console.log(`L${index + 1}: ${line}`);
  }
});
