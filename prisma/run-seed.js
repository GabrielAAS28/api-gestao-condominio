// Dispatcher: roda o seed compilado (prisma/seed.js) em produção,
// ou cai para ts-node prisma/seed.ts em desenvolvimento.
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const compiled = path.join(__dirname, 'seed.js');
const source = path.join(__dirname, 'seed.ts');

let cmd, args;
if (fs.existsSync(compiled)) {
  cmd = 'node';
  args = [compiled];
} else if (fs.existsSync(source)) {
  cmd = 'npx';
  args = ['ts-node', source];
} else {
  console.error('Nenhum seed encontrado (prisma/seed.js ou prisma/seed.ts).');
  process.exit(1);
}

const result = spawnSync(cmd, args, { stdio: 'inherit', shell: process.platform === 'win32' });
process.exit(result.status ?? 1);
