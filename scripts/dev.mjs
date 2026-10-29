import { spawn } from 'node:child_process';
const children = [];
const env = { ...process.env, NODE_ENV: 'development', PORT: '3001' };
children.push(spawn(process.execPath, ['--watch', 'server/index.ts'], { stdio: 'inherit', env }));
children.push(spawn(process.execPath, ['node_modules/vite/bin/vite.js', ...process.argv.slice(2)], { stdio: 'inherit' }));
function stop() { for (const child of children) child.kill(); }
process.on('SIGINT', stop);
process.on('SIGTERM', stop);
for (const child of children) child.on('exit', code => { stop(); process.exit(code ?? 0); });
