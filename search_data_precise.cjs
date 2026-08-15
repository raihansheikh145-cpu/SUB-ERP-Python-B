const fs = require('fs');
const path = require('path');

// Patterns that indicate accessing the old data JSONB column (not API response .data)
const badPatterns = [
    /\.data\?\.(items|invoiceNumber|billNumber|total|subtotal|status|companyId|customerId|vendorId|customerNote|deliveryPerson|salesperson|note|amortizationSchedule|stockLevels|stock_levels|initialStockLevels|messages|preparedBy|createdById|billId|invoiceId)/g,
    /\.data\s*\|\|\s*\{\}/g,  // .data || {}
    /\.data\s*\?\s*\.\s*number/g,  // .data?.number
    /data\.data\s/g, // data.data (nested)
];

let count = 0;
function searchFiles(dir, filter, callback) {
    if (!fs.existsSync(dir)) return;
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat.isDirectory()) {
            searchFiles(filePath, filter, callback);
        } else if (filter.test(filePath)) {
            count++;
            const content = fs.readFileSync(filePath, 'utf-8');
            const lines = content.split('\n');
            for (let i = 0; i < lines.length; i++) {
                for (const pattern of badPatterns) {
                    pattern.lastIndex = 0;
                    if (pattern.test(lines[i])) {
                        callback(filePath, i + 1, lines[i].trim());
                    }
                }
            }
        }
    }
}

let foundCount = 0;
searchFiles('src', /\.(tsx|ts)$/, (filePath, lineNum, line) => {
    foundCount++;
    console.log(`${filePath}:${lineNum}: ${line.substring(0, 200)}`);
});

console.log(`\nScanned ${count} files. Found ${foundCount} problematic .data references.`);
