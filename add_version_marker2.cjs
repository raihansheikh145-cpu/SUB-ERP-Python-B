const fs = require('fs');
let content = fs.readFileSync('/app/applet/components/LoanManager.tsx', 'utf8');

const target = `<h1 className="text-lg font-bold text-slate-800 tracking-tight">Loan & Financing</h1>`;
const rep = `<h1 className="text-lg font-bold text-slate-800 tracking-tight flex items-center gap-2">Loan & Financing <span className="bg-indigo-100 text-indigo-700 text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-widest border border-indigo-200">v2.1</span></h1>`;

if (content.includes(target) && !content.includes('v2.1')) {
    content = content.replace(target, rep);
    fs.writeFileSync('/app/applet/components/LoanManager.tsx', content);
    console.log("Added version marker");
} else {
    console.log("Could not add marker");
}
