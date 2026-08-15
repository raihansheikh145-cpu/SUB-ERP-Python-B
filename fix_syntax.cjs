const fs = require('fs');
let content = fs.readFileSync('/app/applet/components/LoanManager.tsx', 'utf8');

// The replacement was done on the first </tbody> which is around line 881.
// Let's change it back to </tbody>
content = content.replace(
  / \}\)\}\)\(\)\}<\/tbody>/,
  ` </tbody>`
);

// Now for the real timeline table </tbody> which is at line 1327 currently.
// It looks like:
//                          })}
//                        </tbody>
content = content.replace(
  /                          \}\)\}\n                        <\/tbody>/,
  `                          })\n                        })()}</tbody>`
);

fs.writeFileSync('/app/applet/components/LoanManager.tsx', content);
console.log("Fixed syntax");
