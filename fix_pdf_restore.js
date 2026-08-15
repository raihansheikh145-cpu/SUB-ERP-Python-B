import fs from 'fs';
let content = fs.readFileSync('services/pdfService.ts', 'utf8');

// The original file had `format: 'a4',\n    });` or similar.
// Since I deleted `\n    });\n    const pageHeight = doc.internal.pageSize.height;`
// It means wherever `format: 'a4',` was followed by that string, it now just says `format: 'a4',`
// Let's replace `format: 'a4',` where it is NOT followed by `\n    });` with `format: 'a4',\n    });\n    const pageHeight = doc.internal.pageSize.height;`

// Actually, I can just find `format: 'a4',` and if it is followed by `\n    const ` or something, wait.
// Let's look at the occurrences of `format: 'a4',`
let lines = content.split('\n');
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes("format: 'a4',") || lines[i].includes("format: 'a4'")) {
    if (!lines[i+1].includes("});")) {
       lines.splice(i+1, 0, "    });", "    const pageHeight = doc.internal.pageSize.height;");
    }
  }
}
fs.writeFileSync('services/pdfService.ts', lines.join('\n'));
console.log("Restored closures");
