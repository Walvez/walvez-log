// Cloudflare Workers 静态资源直传部署脚本
// 用法: node scripts/deploy.mjs <dist-dir> <script-name>
// 依赖: 环境变量 CLOUDFLARE_API_TOKEN（或 ~/.dsh/.env）
import { createHash } from "node:crypto";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, extname, relative } from "node:path";
import { existsSync, readFileSync as read } from "node:fs";

// --- token ---
let TOKEN = process.env.CLOUDFLARE_API_TOKEN;
if (!TOKEN && existsSync(join(process.env.HOME || "", ".dsh/.env"))) {
  const env = read(join(process.env.HOME || "", ".dsh/.env"), "utf8");
  const m = env.match(/^CLOUDFLARE_API_TOKEN=(.*)$/m);
  if (m) TOKEN = m[1].trim();
}
if (!TOKEN) { console.error("No CLOUDFLARE_API_TOKEN"); process.exit(1); }

const ACCOUNT_ID = "903ecee392049ce40f40230ff81bf4d7";
const distDir = process.argv[2] || "dist";
const SCRIPT = process.argv[3] || "walvez-log";
const API = "https://api.cloudflare.com/client/v4";

async function cf(path, opts = {}) {
  const res = await fetch(`${API}${path}`, {
    ...opts,
    headers: { Authorization: `Bearer ${TOKEN}`, ...(opts.headers || {}) },
  });
  const text = await res.text();
  let json;
  try { json = JSON.parse(text); } catch { json = { raw: text.slice(0, 500) }; }
  if (!res.ok) throw new Error(`CF ${res.status} ${path}: ${JSON.stringify(json).slice(0, 500)}`);
  return json;
}

// --- walk dist ---
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
  const hash = createHash("sha256").update(buf.toString("base64") + ext).digest("hex").slice(0, 32);
  manifest[`/${f.rel}`] = { hash, size: buf.length };
}
console.log(`Manifest: ${files.length} files, ${files.reduce((s, f) => s + statSync(f.full).size, 0)} bytes`);

// --- 1. manifest session ---
const session = await cf(`/accounts/${ACCOUNT_ID}/workers/scripts/${SCRIPT}/assets-upload-session`, {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ manifest }),
});
const { jwt: uploadJwt, buckets } = session.result;
console.log(`Session created. buckets=${buckets.length}, uploadJwt=${uploadJwt ? "yes" : "no"}`);

// --- 2. upload files per bucket (multipart, base64=true) ---
function multipart(payload, boundary) {
  const parts = [];
  for (const [hash, b64] of Object.entries(payload)) {
    parts.push(
      `--${boundary}\r\nContent-Disposition: form-data; name="${hash}"\r\nContent-Type: text/plain\r\n\r\n${b64}\r\n`
    );
  }
  parts.push(`--${boundary}--\r\n`);
  return parts.join("");
}

let completionJwt = uploadJwt;
let uploaded = 0;
for (const bucket of buckets) {
  const payload = {};
  for (const hash of bucket) {
    const entry = Object.entries(manifest).find(([, m]) => m.hash === hash);
    if (!entry) throw new Error(`hash ${hash} not in manifest`);
    payload[hash] = readFileSync(join(distDir, entry[0].slice(1))).toString("base64");
  }
  const boundary = `----walvez${Date.now()}${uploaded}`;
  const body = multipart(payload, boundary);
  const res = await cf(`/accounts/${ACCOUNT_ID}/workers/assets/upload?base64=true`, {
    method: "POST",
    headers: { Authorization: `Bearer ${uploadJwt}`, "content-type": `multipart/form-data; boundary=${boundary}` },
    body,
  });
  uploaded += Object.keys(payload).length;
  if (res.result?.jwt) completionJwt = res.result.jwt;
  console.log(`Uploaded bucket ${uploaded}/${files.length} files`);
}
console.log("All assets uploaded. completionJwt:", completionJwt ? "yes" : "no");

// --- 3. upload worker script version (module worker + assets binding) ---
const workerCode = `export default {
  fetch(request, env, ctx) {
    return env.ASSETS.fetch(request);
  },
};
`;
const boundary2 = `----walvez-script${Date.now()}`;
const metadata = {
  main_module: "index.js",
  compatibility_date: "2026-08-01",
  bindings: [{ type: "assets", name: "ASSETS" }],
  assets: { jwt: completionJwt },
};
const scriptBody =
  `--${boundary2}\r\nContent-Disposition: form-data; name="metadata"\r\nContent-Type: application/json\r\n\r\n` +
  `${JSON.stringify(metadata)}\r\n` +
  `--${boundary2}\r\nContent-Disposition: form-data; name="files"; filename="index.js"\r\nContent-Type: application/javascript+module\r\n\r\n` +
  `${workerCode}\r\n--${boundary2}--\r\n`;

const putRes = await cf(`/accounts/${ACCOUNT_ID}/workers/scripts/${SCRIPT}`, {
  method: "PUT",
  headers: { "content-type": `multipart/form-data; boundary=${boundary2}` },
  body: scriptBody,
});
console.log("Script uploaded:", putRes.success, putRes.result?.id || putRes.result?.modified_on || "");

// --- 4. find latest version & deploy 100% ---
const versions = await cf(`/accounts/${ACCOUNT_ID}/workers/scripts/${SCRIPT}/versions?per_page=1`);
const latest = versions.result?.items?.[0] || versions.result?.versions?.[0];
if (!latest) throw new Error("no version found");
console.log("Latest version:", latest.id, latest.resources?.script?.etag || "");

const dep = await cf(`/accounts/${ACCOUNT_ID}/workers/scripts/${SCRIPT}/deployments`, {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ strategy: "percentage", versions: [{ percentage: 100, version_id: latest.id }] }),
});
console.log("Deployment:", dep.success, dep.result?.deployment?.id || "");

// --- 5. enable workers.dev subdomain ---
try {
  const sub = await cf(`/accounts/${ACCOUNT_ID}/workers/scripts/${SCRIPT}/subdomain`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ enabled: true }),
  });
  console.log("Subdomain enabled:", sub.success);
} catch (e) {
  console.log("Subdomain enable (may already be on):", e.message.slice(0, 200));
}

console.log(`DONE. URL: https://${SCRIPT}.qx-sync-9f3a7c.workers.dev/`);
