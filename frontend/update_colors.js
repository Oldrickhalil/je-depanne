const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) { 
      results = results.concat(walk(file));
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) { 
      results.push(file);
    }
  });
  return results;
}

const files = walk('frontend/src');

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;

  // Backgrounds
  content = content.replace(/bg-\[#0c0c0c\]/g, 'bg-card');
  content = content.replace(/bg-\[#111111\]/g, 'bg-card');
  content = content.replace(/bg-\[#111\]/g, 'bg-card');
  content = content.replace(/bg-\[#121212\]/g, 'bg-card');
  content = content.replace(/bg-\[#161616\]/g, 'bg-background');
  content = content.replace(/bg-\[#070707\]/g, 'bg-background');
  content = content.replace(/bg-\[#0a0a0a\]/g, 'bg-background');
  
  // Texts
  content = content.replace(/text-gray-400/g, 'text-muted-text');
  content = content.replace(/text-gray-500/g, 'text-muted-text');
  content = content.replace(/text-gray-600/g, 'text-muted-text');
  
  content = content.replace(/className=\"[^\"]*text-white[^\"]*\"/g, match => match.replace('text-white', 'text-foreground'));
  
  // Borders
  content = content.replace(/border-white\/5/g, 'border-card-border');
  content = content.replace(/border-white\/10/g, 'border-card-border');
  content = content.replace(/border-\[#1f1f1f\]/g, 'border-card-border');

  if (content !== original) {
    fs.writeFileSync(file, content);
    console.log('Updated', file);
  }
});