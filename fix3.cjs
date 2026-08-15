const fs = require('fs');
const files = ['src/components/features/purchasing/BillManager.tsx', 'src/components/features/purchasing/PaymentManager.tsx', 'src/components/features/accounting/JournalManager.tsx'];
files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  
  content = content.replace(/id:\s*([a-zA-Z0-9_]+)\?\.,\s*name:\s*\1\?\./g, 'id: $1?.id, name: $1?.name');
  content = content.replace(/id:\s*([a-zA-Z0-9_]+)\?\.,\s*label:\s*\1\?\./g, 'id: $1?.id, label: $1?.name');
  content = content.replace(/\$\{([a-zA-Z0-9_]+)\?\.\}\s*-\s*\$\{\1\?\.\}/g, '${$1?.code} - ${$1?.name}');
  content = content.replace(/p\?\.,\s*description:\s*p\?\./g, 'p?.id, description: p?.name');
  content = content.replace(/key=\{([a-zA-Z0-9_]+)\?\.\}/g, 'key={$1?.id}');
  content = content.replace(/([a-zA-Z0-9_]+)\?\.\s*===\s*'POSTED'/g, '$1?.status === \'POSTED\'');
  content = content.replace(/([a-zA-Z0-9_]+)\?\.\s*===\s*'DRAFT'/g, '$1?.status === \'DRAFT\'');
  content = content.replace(/([a-zA-Z0-9_]+)\?\.\s*===\s*'DELETED'/g, '$1?.status === \'DELETED\'');
  
  // Specific variables:
  content = content.replace(/bill\?\./g, 'bill?.id');
  content = content.replace(/pay\?\./g, 'pay?.id');
  content = content.replace(/inv\?\./g, 'inv?.id');
  content = content.replace(/entry\?\./g, 'entry?.id');
  content = content.replace(/c\?\./g, 'c?.id');
  content = content.replace(/a\?\./g, 'a?.id');
  content = content.replace(/opt\?\./g, 'opt?.id');
  content = content.replace(/data\?\./g, 'data?.id');
  content = content.replace(/p\?\./g, 'p?.id');
  content = content.replace(/acc\?\./g, 'acc?.id');
  content = content.replace(/item\?\./g, 'item?.id');
  content = content.replace(/rate\?\./g, 'rate?.id');
  content = content.replace(/doc\?\./g, 'doc?.id');
  content = content.replace(/emp\?\./g, 'emp?.id');

  content = content.replace(/currentCompany\?\./g, 'currentCompany?.name');
  content = content.replace(/linkedJournalEntry\?\./g, 'linkedJournalEntry?.id');
  content = content.replace(/currentPayment\?\./g, 'currentPayment?.id');
  content = content.replace(/selectedEntry\?\./g, 'selectedEntry?.id');
  content = content.replace(/line\?\./g, 'line?.id');

  content = content.replace(/\(options\.filters as any\)\?\.\s*=\s*search/g, '(options.filters as any).id = search');
  
  // Clean up any double ids
  content = content.replace(/\?\.idid/g, '?.id');
  content = content.replace(/\?\.idname/g, '?.name');
  content = content.replace(/\?\.idcode/g, '?.code');
  content = content.replace(/\?\.idstatus/g, '?.status');
  
  fs.writeFileSync(file, content);
});
