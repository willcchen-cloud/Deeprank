const fs = require("node:fs/promises");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..");
const DIST = path.join(ROOT, "dist");
const PUBLISH_FILES = Object.freeze([
  "index.html",
  "styles.css",
  "script.js",
  "favicon.svg",
  "assets/hero-galaxy.png",
  "assets/images/capture-systems-bg.png",
  "assets/images/confidential-delivery-bg.png",
  "assets/images/final-cta-bg.png",
  "assets/images/pipeline-bg.png",
  "assets/images/quality-layer-bg.png",
  "admin/contact-leads.html",
  "admin/contact-leads.css",
  "admin/contact-leads.js",
]);

function resolveInside(base, relativePath) {
  const resolved = path.resolve(base, relativePath);
  if (resolved !== base && !resolved.startsWith(`${base}${path.sep}`)) {
    throw new Error(`Path escapes its allowed root: ${relativePath}`);
  }
  return resolved;
}

async function copyPublishFile(relativePath) {
  const source = resolveInside(ROOT, relativePath);
  const destination = resolveInside(DIST, relativePath);
  const stat = await fs.lstat(source);
  if (stat.isSymbolicLink() || !stat.isFile()) {
    throw new Error(`Publish entry must be a regular file: ${relativePath}`);
  }

  await fs.mkdir(path.dirname(destination), { recursive: true });
  await fs.copyFile(source, destination);
}

async function buildStaticSite() {
  if (DIST !== path.join(ROOT, "dist") || path.basename(DIST) !== "dist") {
    throw new Error("Refusing to clean an unexpected publish directory");
  }

  await fs.rm(DIST, { recursive: true, force: true });
  await fs.mkdir(DIST, { recursive: true });
  for (const relativePath of PUBLISH_FILES) await copyPublishFile(relativePath);
  return [...PUBLISH_FILES];
}

if (require.main === module) {
  buildStaticSite()
    .then((files) => process.stdout.write(`Built dist with ${files.length} whitelisted files.\n`))
    .catch((error) => {
      process.stderr.write(`${error.message}\n`);
      process.exitCode = 1;
    });
}

module.exports = { DIST, PUBLISH_FILES, buildStaticSite };
