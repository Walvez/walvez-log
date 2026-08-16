// 读取 dist/ 目录，生成 Cloudflare Workers 静态资源 manifest 和上传载荷
// 用法: node scripts/make-manifest.mjs <dist-dir> <out-dir>
import { createHash } from "node:crypto";
import { readdirSync, readFileSync, mkdirSync, writeFileSync, statSync } from "node:fs";
import { join, extname, relative } from "node:path";

const distDir = process.argv[2] || "dist";
const outDir = process.argv[3] || "scripts/.deploy";
mkdirSync(outDir, { recursive: true });

function walk(dir, base = "") {
  const entries = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const rel = join(base, entry);
    if (statSync(full).isDirectory()) entries.push(...walk(full, rel));
    else entries.push({ full, rel: rel.replace(/\\/g, "/") });
  }
  return entries;
}

const files = walk(distDir);
const manifest = {};
for (const f of files) {
  const buf = readFileSync(f.full);
  const ext = extname(f.rel).substring(1);
  const hash = createHash("sha256")
    .update(buf.toString("base64") + ext)
    .digest("hex")
    .slice(0, 32);
  manifest[`/${f.rel}`] = { hash, size: buf.length };
}

writeFileSync(join(outDir, "manifest.json"), JSON.stringify(manifest, null, 2));

// 按 ~150KB base64 分组生成载荷文件
const payloads = [];
let current = {};
let currentSize = 0;
for (const [path, meta] of Object.entries(manifest)) {
  const buf = readFileSync(join(distDir, path.slice(1)));
  const b64 = buf.toString("base64");
  if (currentSize + b64.length > 150_000 && Object.keys(current).length > 0) {
    payloads.push(current);
    current = {};
    currentSize = 0;
  }
  current[meta.hash] = b64;
  currentSize += b64.length;
}
if (Object.keys(current).length > 0) payloads.push(current);

payloads.forEach((p, i) => writeFileSync(join(outDir, `payload-${i}.json`), JSON.stringify(p)));

console.log(JSON.stringify({
  fileCount: files.length,
  totalBytes: files.reduce((s, f) => s + statSync(f.full).size, 0),
  payloadCount: payloads.length,
  manifestPath: join(outDir, "manifest.json"),
}, null, 2));
