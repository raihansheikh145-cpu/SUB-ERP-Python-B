import fs from 'fs';
let content = fs.readFileSync('store/useAccountingStore.ts', 'utf8');
content = content.replace(/await dbService\.addDoc\('docs_categories', newCategory\);/g, "await dbService.upsertDoc('docs_categories', newCategory.id, newCategory);");
content = content.replace(/await dbService\.addDoc\('docs_brands', newBrand\);/g, "await dbService.upsertDoc('docs_brands', newBrand.id, newBrand);");
fs.writeFileSync('store/useAccountingStore.ts', content);
console.log("Replaced addDoc with upsertDoc");
