import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile, readdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const modernRoot = resolve(scriptDir, "..");
const repositoryRoot = resolve(modernRoot, "..");
const distRoot = resolve(modernRoot, "dist");

const historicalBaseline = {
  "assets/icons8-whatsapp-100.png": "9987cfc24c1dab39ac231a0ddd4d8cfb54edbf89",
  "assets/imagenesTutores/tutorEnzo.jpg":
    "ebed2a6173e20b2c5545c1e91a917beb1ca35624",
  "assets/imagenesTutores/tutorFernanda.jpeg":
    "7c958651ffcd0ecba64168706d8a12c2ec5edc9b",
  "assets/imagenesTutores/tutorMaria.jpeg":
    "0163192bfed54c4540e6d2ff5697b34658179f72",
  "assets/imagenesTutores/tutorMartin.jpeg":
    "b850a09dfdf59e0f7b131d9f222a07ad83ca41f8",
  "assets/linea-divisoria.png": "74498de29c59b608524f4a06c50bcffa9a0d84a5",
  "assets/muro-hormigon-gris.jpg": "da436d690025bfd01ce80e8f5a7859cbbc4855f0",
  "assets/usuariopng.jfif": "68ec90a912e241ae2175a09d40fac6a24893e599",
  "estilos/style.css": "dfa7c30255b65422a595507d7426e3cfe88dd37f",
  "index.html": "f7540fb89e7b7819283d0dbfb77eb41f93eb24e0",
  "js/main.js": "ebc8662e0b44c2758ccfb42c8194973a59ed5067",
  "js/principal.js": "36df95e9c763a567c25102bfeb7aae254ef103af",
  "json/tutores.json": "55d86567fc5038a48166520c011334d168fd4864",
  "views/principal.html": "83995c261eed3e8bc3941ab527070104ee60b9ce",
};

async function assertFilesEqual(left, right, label) {
  const [leftBytes, rightBytes] = await Promise.all([
    readFile(left),
    readFile(right),
  ]);
  assert.deepEqual(leftBytes, rightBytes, `${label} is out of sync`);
}

async function gitBlobSha(path) {
  const bytes = await readFile(path);
  const header = Buffer.from(`blob ${bytes.length}\0`);
  return createHash("sha1").update(header).update(bytes).digest("hex");
}

for (const fileName of ["index.html", "robots.txt", "sitemap.xml"]) {
  await assertFilesEqual(
    resolve(distRoot, fileName),
    resolve(repositoryRoot, fileName),
    `root Pages mirror ${fileName}`,
  );
}

const distAssets = (await readdir(resolve(distRoot, "assets")))
  .filter((name) => /^index-.*\.(?:js|css)$/.test(name))
  .sort();
const rootAssets = (await readdir(resolve(repositoryRoot, "assets")))
  .filter((name) => /^index-.*\.(?:js|css)$/.test(name))
  .sort();

assert.deepEqual(
  rootAssets,
  distAssets,
  "root Pages mirror must contain exactly the generated JS/CSS assets",
);

for (const assetName of distAssets) {
  await assertFilesEqual(
    resolve(distRoot, "assets", assetName),
    resolve(repositoryRoot, "assets", assetName),
    `root Pages mirror asset ${assetName}`,
  );
}

await readFile(resolve(repositoryRoot, ".nojekyll"));

for (const [relativePath, expectedSha] of Object.entries(historicalBaseline)) {
  const actualSha = await gitBlobSha(
    resolve(repositoryRoot, "historical", "2023", relativePath),
  );
  assert.equal(
    actualSha,
    expectedSha,
    `historical/2023/${relativePath} no longer matches baseline d6a38f57`,
  );
}

console.log(
  `Pages mirror valid: ${distAssets.length} generated assets match dist and ${Object.keys(historicalBaseline).length} historical files match the 2023 baseline byte-for-byte.`,
);
