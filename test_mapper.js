const { readFileSync } = require('fs');
const content = readFileSync('lib/supabase.ts', 'utf8');
const start = content.indexOf('function mapPayload');
const end = content.indexOf('function generateUUID', start);
console.log(content.slice(start, end));
