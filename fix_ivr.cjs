const fs = require('fs');
const file = 'src/components/features/inventory/InventoryValuationReport.tsx';
let text = fs.readFileSync(file, 'utf8');

text = text.replace(/\"report\" ===/g, 'view ===');
text = text.replace(/\"report\" \?/g, 'view ?');
text = text.replace(/\(\(a:any\) => \{\}\)\(/g, 'setView(');

// Now we need to add `const [view, setView] = useState('summary');` inside the component
// The component starts with: `const InventoryValuationReport: React.FC<any> = ({ store, defaultView }) => {`
// Let's find it.
text = text.replace(
  /const InventoryValuationReport: React\.FC<any> = \(\{ store, defaultView \}\) => \{/,
  "const InventoryValuationReport: React.FC<any> = ({ store, defaultView }) => {\n  const [view, setView] = useState<string>(defaultView || 'summary');"
);

// Actually, `defaultView` might not exist, let's just match the component declaration.
text = text.replace(
  /const InventoryValuationReport: React\.FC<(.*?)> = \((.*?)\) => \{/,
  "const InventoryValuationReport: React.FC<$1> = ($2) => {\n  const [view, setView] = useState<string>('summary');"
);

fs.writeFileSync(file, text);
console.log("Fixed InventoryValuationReport");
