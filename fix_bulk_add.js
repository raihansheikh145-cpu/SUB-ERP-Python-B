import fs from 'fs';
let content = fs.readFileSync('store/useAccountingStore.ts', 'utf8');

const t1 = "    // SYNC TO SUPABASE";
const t2 = "    const productsToUpsert = preparedProducts.map(p => ({";
const t3 = "      id: p.id,";
const t4 = "      data: p,";

let lines = content.split('\n');
let found = false;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes(t1) && lines[i+1].includes(t2)) {
    lines.splice(i+1, 3, 
      "    const productsToUpsert = preparedProducts.map(p => {",
      "      const { quantityOnHand, costPrice, initialCost, stockLevels, initialStockLevels, ...rest } = p as any;",
      "      return {",
      "      id: p.id,",
      "      data: rest,"
    );
    // find the closing bracket of the map
    for (let j = i + 1; j < lines.length; j++) {
      if (lines[j].includes("}));")) {
        lines[j] = lines[j].replace("}));", "}; });");
        break;
      }
    }
    found = true;
    break;
  }
}

if (found) {
  fs.writeFileSync('store/useAccountingStore.ts', lines.join('\n'));
  console.log("Successfully patched bulkAddProducts in store/useAccountingStore.ts");
} else {
  console.log("Target string not found!");
}
