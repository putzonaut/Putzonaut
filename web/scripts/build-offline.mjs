import {build} from 'vite';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
// A generic static shell, with no authenticated response or user data embedded.
const result=await build({configFile:false,publicDir:false,base:'/',build:{outDir:'dist/client',emptyOutDir:false,rollupOptions:{input:'offline/index.html',output:{entryFileNames:'assets/offline-[name]-[hash].js',chunkFileNames:'assets/offline-[name]-[hash].js',assetFileNames:'assets/offline-[name]-[hash][extname]'}}}});
const output=(Array.isArray(result)?result:[result]).flatMap(r=>r.output??[]);
const files=[...new Set(output.map(o=>'/'+o.fileName))];
if(!files.includes('/offline/index.html'))throw new Error('Offline shell was not emitted');
const {version}=JSON.parse(await readFile('package.json','utf8'));
await writeFile('dist/client/version.json',JSON.stringify({app:'putzonaut',version}));
await writeFile('dist/client/offline-assets.json',JSON.stringify({version,files}));
// A content fingerprint also refreshes offline assets for edits within one app version.
const buildId=createHash('sha256').update(JSON.stringify([...files].sort())).digest('hex').slice(0,16);
const worker=(await readFile('public/sw.js','utf8')).replaceAll('__APP_VERSION__',version).replaceAll('__BUILD_ID__',buildId);
await writeFile('dist/client/sw.js',worker);
