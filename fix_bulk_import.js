import fs from 'fs';
let content = fs.readFileSync('store/useAccountingStore.ts', 'utf8');

const t1 = "        productsToUpsert.push({";
const t2 = "          id: merged.id,";
const t3 = "          data: merged,";

let lines = content.split('\n');
let found = 0;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes("data: merged,") && lines[i-1].includes("id: merged.id,")) {
    lines.splice(i-1, 0, "          const { quantityOnHand, costPrice, initialCost, stockLevels, initialStockLevels, ...mergedRest } = merged as any;");
    lines[i+1] = lines[i+1].replace("data: merged,", "data: mergedRest,");
    found++;
    i++;
  } else if (lines[i].includes("data: newProduct,") && lines[i-1].includes("id: newProduct.id,")) {
    lines.splice(i-1, 0, "          const { quantityOnHand, costPrice, initialCost, stockLevels, initialStockLevels, ...newProductRest } = newProduct as any;");
    lines[i+1] = lines[i+1].replace("data: newProduct,", "data: newProductRest,");
    found++;
    i++;
  }
}

if (found > 0) {
  fs.writeFileSync('store/useAccountingStore.ts', lines.join('\n'));
  console.log(`Successfully patched ${found} occurrences in bulkImportProducts`);
} else {
  console.log("Target strings not found!");
}
