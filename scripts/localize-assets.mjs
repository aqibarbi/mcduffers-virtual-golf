// Downloads the files this site still loads from the original site's CDN
// (cdn.cmsmax.cloud, media.cmsmax.cloud), saves them in the project and
// rewrites the HTML to use the local copies.
//
// Run once, from the project root, with Node 18 or newer:
//   node scripts/localize-assets.mjs
//
// Safe to run again: files that already exist are not downloaded twice,
// and a failed download leaves that page's link untouched.

import { mkdir, readFile, writeFile, access } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const CDN = "https://cdn.cmsmax.cloud/production/width=1280,quality=70,format=webp/9vk1xpkxsellbbsw6kbrx/";
const MEDIA = "https://media.cmsmax.cloud/9vk1xpkxsellbbsw6kbrx/";

const assets = [
  { url: CDN + "IMG_3243.jpg-preview.jpg", file: "assets/img/gallery-photo-1.webp", type: "webp" },
  { url: CDN + "Golf%20Simulator%20Pic%201-preview.jpg", file: "assets/img/gallery-simulator-bay.webp", type: "webp" },
  { url: MEDIA + "Liability%20Waiver_%20Adult_1.pdf", file: "assets/docs/waiver-adult.pdf", type: "pdf" },
  { url: MEDIA + "Liability%20Waiver_Minor_1.pdf", file: "assets/docs/waiver-minor.pdf", type: "pdf" },
];
const pages = ["gallery.html", "waiver-safety-rules.html"];

const exists = (p) => access(p).then(() => true, () => false);

// Cheap check that we saved what we expected and not an HTML error page.
const looksRight = (buf, type) =>
  type === "pdf"
    ? buf.subarray(0, 5).toString("latin1") === "%PDF-"
    : buf.subarray(0, 4).toString("latin1") === "RIFF" && buf.subarray(8, 12).toString("latin1") === "WEBP";

async function fetchAsset({ url, file, type }) {
  const dest = join(root, file);
  if (await exists(dest)) return "kept";
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  if (!looksRight(buf, type)) throw new Error(`not a valid ${type} file`);
  await mkdir(dirname(dest), { recursive: true });
  await writeFile(dest, buf);
  return `${(buf.length / 1024).toFixed(0)} KB`;
}

const done = [];
for (const asset of assets) {
  try {
    const info = await fetchAsset(asset);
    done.push(asset);
    console.log(`ok    ${asset.file} (${info})`);
  } catch (err) {
    console.error(`FAIL  ${asset.file}: ${err.message}\n      ${asset.url}`);
  }
}

let changed = 0;
for (const page of pages) {
  const path = join(root, page);
  let html = await readFile(path, "utf8");
  const before = html;
  for (const { url, file } of done) html = html.split(url).join(file);
  if (html !== before) {
    await writeFile(path, html);
    changed++;
    console.log(`edit  ${page}`);
  }
}

const failed = assets.length - done.length;
console.log(`\n${done.length}/${assets.length} files local, ${changed} page(s) updated.`);
if (failed) {
  console.log("Failed files still load from the old CDN. Check your connection and run the script again.");
  process.exit(1);
}
