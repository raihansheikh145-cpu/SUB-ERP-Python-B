const fs = require('fs');
let content = fs.readFileSync('/app/applet/components/LoanManager.tsx', 'utf8');

const target = `<h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center">`;
const rep = `<h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center">
                <span className="bg-indigo-100 text-indigo-700 text-[10px] px-2 py-0.5 rounded-full mr-3 align-middle font-bold uppercase tracking-widest border border-indigo-200">v2.1</span>`;

if (content.includes(target) && !content.includes('v2.1')) {
    content = content.replace(target, rep);
    fs.writeFileSync('/app/applet/components/LoanManager.tsx', content);
    console.log("Added version marker");
} else {
    console.log("Could not add marker");
}
