const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/store/useAccountingStore.ts');
let content = fs.readFileSync(filePath, 'utf8');

const oldStr = "token ? `Bearer ${token}` : ''";
const newStr = "localStorage.getItem('access_token') ? `Bearer ${localStorage.getItem('access_token')}` : ''";

const count = content.split(oldStr).length - 1;
content = content.replaceAll(oldStr, newStr);

fs.writeFileSync(filePath, content, 'utf8');
console.log(`Replaced ${count} occurrences.`);
