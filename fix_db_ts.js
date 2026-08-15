import fs from 'fs';
let content = fs.readFileSync('services/db.ts', 'utf8');

const target = `    } else if (table === 'docs_products') {
      payload.name = cleanDoc.name;
      payload.sku = cleanDoc.sku || \`SKU-\${id.substring(0, 8)}\`;
      payload.price = Number(cleanDoc.price || 0);
      payload.cost_price = Number(cleanDoc.costPrice || 0);
      payload.data = cleanDoc;
    } else if (table === 'docs_contacts') {`;

const replacement = `    } else if (table === 'docs_products') {
      payload.name = cleanDoc.name;
      payload.sku = cleanDoc.sku || \`SKU-\${id.substring(0, 8)}\`;
      payload.price = Number(cleanDoc.price || 0);
      
      if (cleanDoc.trackInventory !== undefined) payload.track_inventory = cleanDoc.trackInventory !== false;
      if (cleanDoc.canBeSold !== undefined) payload.can_be_sold = cleanDoc.canBeSold !== false;
      if (cleanDoc.canBePurchased !== undefined) payload.can_be_purchased = cleanDoc.canBePurchased !== false;
      if (cleanDoc.isInPos !== undefined) payload.is_in_pos = cleanDoc.isInPos;
      if (cleanDoc.taxCode !== undefined) payload.tax_code = cleanDoc.taxCode;
      
      // Explicitly DO NOT include cost_price, quantityOnHand, or initialCost as flat columns
      delete payload.cost_price;
      delete payload.quantity_on_hand;
      delete payload.initial_cost;
      
      payload.data = cleanDoc;
    } else if (table === 'docs_contacts') {`;

if (content.includes(target)) {
  content = content.replace(target, replacement);
  fs.writeFileSync('services/db.ts', content);
  console.log("Successfully patched db.ts");
} else {
  console.log("Target string not found in db.ts!");
}
