const fs = require('fs');
const path = require('path');

const storeDir = path.join(__dirname, 'src', 'store', 'modules');
const files = fs.readdirSync(storeDir).filter(f => f.endsWith('.ts'));

files.forEach(file => {
  const filePath = path.join(storeDir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  
  if (content.includes('JSON.stringify(options)')) {
    content = content.replace(/JSON\.stringify\(options\)/g, 'JSON.stringify(options && options.nativeEvent ? {} : options)');
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Fixed', file);
  }
});
