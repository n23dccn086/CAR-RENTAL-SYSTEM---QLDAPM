// Sinh docs/api-endpoints.md từ annotation của các Controller. Chạy ở thư mục gốc repo: node scripts/gen-api-endpoints.js
const fs = require("fs"), path = require("path");
const root = "backend/src/main/java/com/carrental";
const files = [];
(function walk(d) { for (const f of fs.readdirSync(d)) { const p = path.join(d, f); fs.statSync(p).isDirectory() ? walk(p) : p.endsWith("Controller.java") && files.push(p); } })(root);
const ctx = "/api/v1";
const rows = [];
for (const f of files.sort()) {
  const src = fs.readFileSync(f, "utf8").replace(/\r\n/g, "\n");
  if (!/@RestController\s*\n/.test(src)) continue;
  const base = (src.match(/@RequestMapping\(\s*(?:value\s*=\s*)?"([^"]*)"\s*\)\s*\n(?:@[^\n]*\n)*public class/) || [, ""])[1];
  const classAuth = (src.match(/@PreAuthorize\("([^"]+)"\)\s*\n(?:@[^\n]*\n)*public class/) || [, ""])[1];
  const lines = src.split("\n");
  const module = path.relative(root, f).split(path.sep)[0];
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/^\s*@(Get|Post|Put|Patch|Delete)Mapping(?:\((.*)\))?\s*$/);
    if (!m) continue;
    const args = m[2] || "";
    const p = (args.match(/(?:value\s*=\s*)?"([^"]*)"/) || [, ""])[1];
    const consumes = /MULTIPART/.test(args) ? " (multipart)" : /APPLICATION_JSON/.test(args) ? " (json)" : "";
    let auth = classAuth, name = "";
    for (let j = i + 1; j < Math.min(i + 12, lines.length); j++) {
      const a = lines[j].match(/@PreAuthorize\("([^"]+)"\)/); if (a) auth = a[1];
      const n = lines[j].match(/public\s+[\w.<>?,\s\[\]]+\s+(\w+)\s*\(/); if (n) { name = n[1]; break; }
    }
    if (!auth && (ctx + base).startsWith("/api/v1/admin")) auth = "ADMIN (SecurityConfig)";
    rows.push({ module, method: m[1].toUpperCase(), path: ctx + base + p, name, consumes, auth: auth.replace(/hasRole\('(\w+)'\)/g, "$1").replace(/hasAnyRole\(([^)]*)\)/g, (_, r) => r.replace(/'/g, "")) , ctrl: path.basename(f, ".java") });
  }
}
let out = `# Danh mục REST API (sinh tự động từ mã nguồn)\n\n> Sinh bằng \`node scripts/gen-api-endpoints.js\` (đọc annotation \`@Get/Post/Put/Patch/DeleteMapping\` trong \`backend/src/main/java/**/*Controller.java\`). Context path: \`/api/v1\`. Chạy lại script sau khi thêm/sửa endpoint.\n> Tổng: **${rows.length}** phương thức xử lý trong **${new Set(rows.map(r => r.ctrl)).size}** controller (một số đường dẫn có 2 biến thể JSON / multipart, hoặc alias tương thích ngược).\n> \`openapi.yaml\` là hợp đồng API chi tiết (request/response mẫu) cho các luồng chính; Swagger UI khi chạy backend (\`/api/v1/swagger-ui.html\`) sinh đặc tả đầy đủ theo code.\n> Cột "Quyền": \`@PreAuthorize\` ở controller/method; để trống = theo SecurityConfig (đa số yêu cầu JWT; nhóm \`/auth\`, \`/public\`, \`/health\`, \`/files\`, \`/payments/callback\`, \`/driver/assignments\` là public; \`GET /cars/**\` và \`GET /reviews/cars|owner/**\` công khai).\n\n`;
const byModule = {};
rows.forEach(r => (byModule[r.module] ||= []).push(r));
for (const [mod, rs] of Object.entries(byModule)) {
  out += `## ${mod} (${rs.length})\n\n| Method | Path | Handler | Quyền |\n|---|---|---|---|\n`;
  for (const r of rs) out += `| ${r.method} | \`${r.path}\`${r.consumes} | ${r.ctrl}.${r.name} | ${r.auth} |\n`;
  out += "\n";
}
fs.writeFileSync("docs/api-endpoints.md", out);
console.log(rows.length, Object.keys(byModule).map(k => k + ":" + byModule[k].length).join(" "));
