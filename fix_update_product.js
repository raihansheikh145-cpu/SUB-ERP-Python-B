import fs from 'fs';
let content = fs.readFileSync('store/useAccountingStore.ts', 'utf8');

const t1 = "      const updatedProd = { ...product, ...updates };";
const t2 = "      const { adjustmentContactId, reason, ...restSync } = updatedProd as any;";
const t3 = "      console.log('Dummy close for updateProduct');";

let lines = content.split('\n');
let found = false;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes(t1) && lines[i+1].includes(t2)) {
    lines.splice(i, 4, 
      "      const updatedProd = { ...product, ...updates };",
      "      ",
      "      // DO NOT send quantityOnHand, costPrice, initialCost, stockLevels to DB",
      "      const { ",
      "        adjustmentContactId, ",
      "        reason, ",
      "        quantityOnHand, ",
      "        costPrice, ",
      "        initialCost, ",
      "        stockLevels,",
      "        initialStockLevels,",
      "        ...restSync ",
      "      } = updatedProd as any;",
      "      ",
      "      const payload: any = {",
      "        name: restSync.name,",
      "        sku: restSync.sku,",
      "        price: Number(restSync.price) || 0,",
      "        description: restSync.description || '',",
      "        category: restSync.category || 'All',",
      "        brand: restSync.brand || '',",
      "        type: restSync.type || 'Goods',",
      "        uom: restSync.uom || 'Units',",
      "        track_inventory: restSync.trackInventory !== false,",
      "        can_be_sold: restSync.canBeSold !== false,",
      "        can_be_purchased: restSync.canBePurchased !== false,",
      "        updated_at: new Date().toISOString(),",
      "        data: restSync",
      "      };",
      "      ",
      "      if (restSync.isInPos !== undefined) payload.is_in_pos = restSync.isInPos;",
      "      if (restSync.taxCode !== undefined) payload.tax_code = restSync.taxCode;",
      "",
      "      const { error } = await supabase.from('docs_products').update(payload).eq('id', id);",
      "      if (error) {",
      "        console.error('Failed to sync updated product to Supabase:', error);",
      "      }"
    );
    found = true;
    break;
  }
}

if (found) {
  fs.writeFileSync('store/useAccountingStore.ts', lines.join('\n'));
  console.log("Successfully patched updateProduct in store/useAccountingStore.ts");
} else {
  console.log("Target string not found!");
}
