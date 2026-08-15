import fs from 'fs';
let content = fs.readFileSync('store/useAccountingStore.ts', 'utf8');

// The syntax error is:
// productsToUpsert.push({
//   const { quantityOnHand, costPrice, initialCost, stockLevels, initialStockLevels, ...mergedRest } = merged as any;
//   id: merged.id,
//   data: mergedRest,

content = content.replace(
  "        productsToUpsert.push({\n          const { quantityOnHand, costPrice, initialCost, stockLevels, initialStockLevels, ...mergedRest } = merged as any;\n          id: merged.id,",
  "        const { quantityOnHand, costPrice, initialCost, stockLevels, initialStockLevels, ...mergedRest } = merged as any;\n        productsToUpsert.push({\n          id: merged.id,"
);

content = content.replace(
  "        productsToUpsert.push({\n          const { quantityOnHand, costPrice, initialCost, stockLevels, initialStockLevels, ...newProductRest } = newProduct as any;\n          id: newProduct.id,",
  "        const { quantityOnHand, costPrice, initialCost, stockLevels, initialStockLevels, ...newProductRest } = newProduct as any;\n        productsToUpsert.push({\n          id: newProduct.id,"
);

fs.writeFileSync('store/useAccountingStore.ts', content);
console.log("Successfully fixed syntax");
