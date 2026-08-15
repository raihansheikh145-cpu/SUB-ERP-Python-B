import fs from 'fs';
let content = fs.readFileSync('store/useAccountingStore.ts', 'utf8');

content = content.replace(
  "          contactsToUpsertMap[merged.id] = {\n            const { quantityOnHand, costPrice, initialCost, stockLevels, initialStockLevels, ...mergedRest } = merged as any;\n            id: merged.id,\n            data: mergedRest,",
  "          contactsToUpsertMap[merged.id] = {\n            id: merged.id,\n            data: merged,"
);

content = content.replace(
  "          contactsToUpsertMap[newContact.id] = {\n            const { quantityOnHand, costPrice, initialCost, stockLevels, initialStockLevels, ...newProductRest } = newProduct as any;\n            id: newProduct.id,\n            data: newProductRest,",
  "          contactsToUpsertMap[newContact.id] = {\n            id: newContact.id,\n            data: newContact,"
);

// Wait, the second one might use newContact.id and newContact, let's just do a regex if needed
content = content.replace(
  /contactsToUpsertMap\[(.*?)\] = \{\n\s*const \{ quantityOnHand, costPrice, initialCost, stockLevels, initialStockLevels, \.\.\..*?Rest \} = .*? as any;\n\s*id: (.*?),\n\s*data: .*?Rest,/g,
  "contactsToUpsertMap[$1] = {\n            id: $2,\n            data: $2,"
);
// Wait, the second capture group is `merged.id`, so `$2` will be `merged.id`. The data should be `merged`.
// Let's use a function
content = content.replace(
  /contactsToUpsertMap\[(.*?)\] = \{\n\s*const \{ quantityOnHand, costPrice, initialCost, stockLevels, initialStockLevels, \.\.\.(.*?)Rest \} = (.*?) as any;\n\s*id: (.*?),\n\s*data: (.*?)Rest,/g,
  "contactsToUpsertMap[$1] = {\n            id: $4,\n            data: $3,"
);

fs.writeFileSync('store/useAccountingStore.ts', content);
console.log("Successfully fixed syntax 2");
