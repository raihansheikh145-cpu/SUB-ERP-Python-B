const fs = require('fs');
let content = fs.readFileSync('vite.config.ts', 'utf8');
if (!content.includes('__log_error__')) {
  content = content.replace('plugins: [react()]', 'plugins: [react(), { name: "error-logger", configureServer(server) { server.middlewares.use("/__log_error__", (req, res) => { let body = ""; req.on("data", chunk => body += chunk.toString()); req.on("end", () => { fs.writeFileSync("error.log", body); res.end("ok"); }); }); } }]');
  fs.writeFileSync('vite.config.ts', content);
}
let content2 = fs.readFileSync('src/components/common/ErrorBoundary.tsx', 'utf8');
if (!content2.includes('__log_error__')) {
  content2 = content2.replace('this.setState({ errorInfo: info });', 'this.setState({ errorInfo: info }); fetch("/__log_error__", { method: "POST", body: error.stack + "\\n" + info.componentStack }).catch(() => {});');
  fs.writeFileSync('src/components/common/ErrorBoundary.tsx', content2);
}
console.log('Patched');
