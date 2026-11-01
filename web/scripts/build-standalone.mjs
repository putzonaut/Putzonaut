import {build} from 'vite';
import {copyFile,readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';

// Use the exact same app, artwork, styles and offline support as the Sites build.
process.env.VITE_PUTZONAUT_STANDALONE='true';
const result=await build({configFile:false,base:'/',publicDir:'public',define:{'import.meta.env.VITE_PUTZONAUT_STANDALONE':JSON.stringify('true')},build:{outDir:'dist/standalone',emptyOutDir:true,rollupOptions:{input:'offline/index.html',output:{entryFileNames:'assets/putzonaut-[name]-[hash].js',chunkFileNames:'assets/putzonaut-[name]-[hash].js',assetFileNames:'assets/putzonaut-[name]-[hash][extname]'}}}});
await copyFile('dist/standalone/offline/index.html','dist/standalone/index.html');
const output=(Array.isArray(result)?result:[result]).flatMap(r=>r.output??[]);
if(output.some(o=>o.type==='chunk'&&/signin-with-chatgpt|signout-with-chatgpt|Loslegen mit ChatGPT/.test(o.code)))throw new Error('Standalone bundle still contains the hosted login');
const files=[...new Set(output.map(o=>'/'+o.fileName))];
const {version}=JSON.parse(await readFile('package.json','utf8'));
await writeFile('dist/standalone/version.json',JSON.stringify({app:'putzonaut',version}));
await writeFile('dist/standalone/offline-assets.json',JSON.stringify({version,files}));
const buildId=createHash('sha256').update(JSON.stringify(files.sort())).digest('hex').slice(0,16);
await writeFile('dist/standalone/sw.js',(await readFile('public/sw.js','utf8')).replaceAll('__APP_VERSION__',version).replaceAll('__BUILD_ID__',buildId));
