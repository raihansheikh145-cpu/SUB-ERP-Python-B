import fs from 'fs';
let content = fs.readFileSync('store/useAccountingStore.ts', 'utf8');

const t1 = "    // SYNC TO SUPABASE";
const t2 = "    const { error } = await supabase.from('docs_products').upsert({";
const t3 = "      id: newProduct.id,";
const t4 = "      data: newProduct,";
const t5 = "      company_id: newProduct?.companyIds[0],";

let lines = content.split('\n');
let found = false;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes(t1) && lines[i+1].includes(t2)) {
    lines.splice(i, 5, 
      "    // SYNC TO SUPABASE",
      "    const { quantityOnHand, costPrice, initialCost, stockLevels, initialStockLevels, ...newProductRest } = newProduct as any;",
      "    const { error } = await supabase.from('docs_products').upsert({",
      "      id: newProduct.id,",
      "      data: newProductRest,",
      "      company_id: newProduct?.companyIds[0],"
    );
    found = true;
    break;
  }
}

if (found) {
  fs.writeFileSync('store/useAccountingStore.ts', lines.join('\n'));
  console.log("Successfully patched addProduct in store/useAccountingStore.ts");
} else {
  console.log("Target string not found!");
}
