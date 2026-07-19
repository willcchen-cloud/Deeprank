const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const path = require("node:path");
const test = require("node:test");

const { DIST, PUBLISH_FILES, buildStaticSite } = require("../scripts/build-static");

async function listFiles(directory, prefix = "") {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const relativePath = path.posix.join(prefix, entry.name);
    if (entry.isDirectory()) files.push(...(await listFiles(path.join(directory, entry.name), relativePath)));
    else files.push(relativePath);
  }
  return files;
}

function localReferences(contents, attributePattern) {
  return [...contents.matchAll(attributePattern)]
    .map((match) => match[1])
    .filter((reference) => !/^(?:#|https?:|mailto:|data:|\/api\/)/.test(reference))
    .map((reference) => reference.replace(/^\/+/, "").split(/[?#]/)[0]);
}

test("dist contains exactly the whitelisted static runtime files", async () => {
  await buildStaticSite();
  const actualFiles = (await listFiles(DIST)).sort();
  assert.deepEqual(actualFiles, [...PUBLISH_FILES].sort());

  const forbiddenPaths = [
    ".git",
    "README.md",
    "db",
    "netlify",
    "netlify.toml",
    "node_modules",
    "package-lock.json",
    "package.json",
    "playwright.config.js",
    "scripts",
    "tests",
  ];
  for (const forbiddenPath of forbiddenPaths) {
    await assert.rejects(fs.access(path.join(DIST, forbiddenPath)));
  }
});

test("every local resource referenced by published HTML and CSS exists in dist", async () => {
  await buildStaticSite();
  const indexHtml = await fs.readFile(path.join(DIST, "index.html"), "utf8");
  const siteCss = await fs.readFile(path.join(DIST, "styles.css"), "utf8");
  const adminHtml = await fs.readFile(path.join(DIST, "admin/contact-leads.html"), "utf8");
  const references = [
    ...localReferences(indexHtml, /(?:href|src)="([^"]+)"/g),
    ...localReferences(siteCss, /url\(["']?([^"')]+)["']?\)/g),
    ...localReferences(adminHtml, /(?:href|src)="([^"]+)"/g).map((reference) => `admin/${reference}`),
  ];

  for (const reference of references) {
    await assert.doesNotReject(fs.access(path.join(DIST, reference)), `Missing published resource: ${reference}`);
  }
});

test("dist does not publish the unverified contact email", async () => {
  await buildStaticSite();
  const textFiles = PUBLISH_FILES.filter((relativePath) => /\.(?:css|html|js|svg)$/.test(relativePath));
  for (const relativePath of textFiles) {
    const contents = await fs.readFile(path.join(DIST, relativePath), "utf8");
    assert.doesNotMatch(contents, /contact@deeprank\.tech/i, `Unverified email found in ${relativePath}`);
  }
});
