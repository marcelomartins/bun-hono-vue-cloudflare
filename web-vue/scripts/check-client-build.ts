import { readdir } from "node:fs/promises";
import { gzipSync } from "node:zlib";

import { NOT_FOUND_SSG_ROUTE, PUBLIC_SSG_ROUTES } from "@bhvc/contracts/routes";

import { FORBIDDEN_CHUNK_PREFIX } from "./forbidden-dependencies";

const decoder = new TextDecoder();
const outputDirectory = "../dist/web-vue";

function outputPath(relativePath: string): string {
  return `${outputDirectory}/${relativePath}`;
}

function htmlFile(route: string): string {
  return route === "/" ? "index.html" : `${route.slice(1)}.html`;
}

async function text(path: string): Promise<string> {
  return decoder.decode(await Bun.file(path).arrayBuffer());
}

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const publicHtmlFiles = [...PUBLIC_SSG_ROUTES, NOT_FOUND_SSG_ROUTE].map(htmlFile);
const expectedHtmlFiles = [...publicHtmlFiles, "index-spa.html"];
const emittedHtml = new Map<string, string>();
for (const relativePath of expectedHtmlFiles) {
  const path = outputPath(relativePath);
  assert(await Bun.file(path).exists(), `${path} was not emitted`);
  emittedHtml.set(relativePath, await text(path));
}

for (const relativePath of publicHtmlFiles) {
  const html = emittedHtml.get(relativePath) ?? "";
  assert(/<html[^>]+lang="[a-z]{2}(-[A-Z]{2})?"/u.test(html), `${outputPath(relativePath)} must declare a language`);
  assert(html.includes('data-server-rendered="true"'), `${outputPath(relativePath)} must contain SSG markup`);
}

const privateShell = emittedHtml.get("index-spa.html") ?? "";
assert(!privateShell.includes('data-server-rendered="true"'), "the private shell must not be pre-rendered");
assert(await Bun.file(outputPath("_headers")).exists(), "Cloudflare static headers were not emitted");

const assetFiles = await readdir(outputPath("assets"));
assert(
  !assetFiles.some((file) => file.startsWith(FORBIDDEN_CHUNK_PREFIX)),
  "a forbidden dependency reached the browser graph"
);
assert(!assetFiles.some((file) => file.endsWith(".map")), "browser source maps must not be emitted");

const javascriptFiles = assetFiles.filter((file) => file.endsWith(".js"));
const totalGzipBytes = (
  await Promise.all(javascriptFiles.map(async (file) => gzipSync(await Bun.file(outputPath(`assets/${file}`)).arrayBuffer()).byteLength))
).reduce((total, size) => total + size, 0);
assert(totalGzipBytes <= 300_000, `client JavaScript exceeds 300 kB gzip: ${totalGzipBytes}`);

console.log(JSON.stringify({ publicSsgPages: publicHtmlFiles.length, clientJavaScriptGzipBytes: totalGzipBytes }));
