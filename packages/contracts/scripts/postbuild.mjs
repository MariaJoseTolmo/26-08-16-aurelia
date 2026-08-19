import { writeFileSync } from 'node:fs';

writeFileSync(
  new URL('../dist/esm/package.json', import.meta.url),
  `${JSON.stringify({ type: 'module' }, null, 2)}\n`,
);
writeFileSync(
  new URL('../dist/cjs/package.json', import.meta.url),
  `${JSON.stringify({ type: 'commonjs' }, null, 2)}\n`,
);
