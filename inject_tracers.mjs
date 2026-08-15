import fs from 'fs';
let code = fs.readFileSync('src/components/features/purchasing/BillManager.tsx', 'utf8');

// Add a general tracer halfway through
code = code.replace('const handleConfirm = async', 'console.log("TRACER: Reached handleConfirm"); const handleConfirm = async');
code = code.replace('if (showForm) {', 'console.log("TRACER: Checking showForm=" + showForm); if (showForm) {');

fs.writeFileSync('src/components/features/purchasing/BillManager.tsx', code);
