import { readdir, readFile, writeFile } from 'node:fs/promises';
import { relative, resolve } from 'node:path';

const distRoot = resolve(process.cwd(), 'dist');
const physicalContractsRequire = /require\((["'])[^"']*packages[\\/]contracts[\\/]dist[\\/](?:cjs|types)(?:[\\/][^"']*)?\1\)/g;
const physicalContractsPath = /packages[\\/]contracts[\\/]dist[\\/]/;

async function listJavaScriptFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = resolve(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...await listJavaScriptFiles(fullPath));
    } else if (entry.isFile() && entry.name.endsWith('.js')) {
      files.push(fullPath);
    }
  }

  return files;
}

async function main() {
  const files = await listJavaScriptFiles(distRoot);
  let rewrittenFiles = 0;
  let rewrittenImports = 0;

  for (const file of files) {
    const source = await readFile(file, 'utf8');
    let replacementsInFile = 0;
    const normalized = source.replace(physicalContractsRequire, () => {
      replacementsInFile += 1;
      return 'require("@aurelia/contracts")';
    });

    if (replacementsInFile > 0) {
      await writeFile(file, normalized, 'utf8');
      rewrittenFiles += 1;
      rewrittenImports += replacementsInFile;
    }

    if (physicalContractsPath.test(normalized)) {
      throw new Error(
        `Physical @aurelia/contracts build path remains in ${relative(process.cwd(), file)}`,
      );
    }
  }

  console.log(
    `Normalized ${rewrittenImports} Swagger contract import(s) across ${rewrittenFiles} compiled file(s)`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
