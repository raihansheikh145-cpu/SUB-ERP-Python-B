const fs = require('fs');
const files = ['src/components/features/purchasing/BillManager.tsx', 'src/components/features/purchasing/PaymentManager.tsx'];
files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/number:\s*b\?\.\s*\}/g, 'number: b?.id }');
  content = content.replace(/id:\s*l\?\.,/g, 'id: l?.id,');
  content = content.replace(/status:\s*filterState\?\.\s*\}/g, 'status: filterState?.status }');
  content = content.replace(/filterState\?\.,/g, 'filterState?.status,');
  content = content.replace(/name=\{quickProductName\?\.\}/g, 'name={quickProductName}');
  content = content.replace(/liquidityAccounts\[0\]\?\.\);/g, 'liquidityAccounts[0]?.id);');
  fs.writeFileSync(file, content);
});
