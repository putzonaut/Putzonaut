import {build} from 'vite';
import {writeFile} from 'node:fs/promises';
// A generic static shell, with no authenticated response or user data embedded.
const result=await build({configFile:false,publicDir:false,base:'/',build:{outDir:'dist/client',emptyOutDir:false,rollupOptions:{input:'offline/index.html',output:{entryFileNames:'assets/offline-[name]-[hash].js',chunkFileNames:'assets/offline-[name]-[hash].js',assetFileNames:'assets/offline-[name]-[hash][extname]'}}}});
const output=(Array.isArray(result)?result:[result]).flatMap(r=>r.output??[]);
const files=[...new Set(output.map(o=>'/'+o.fileName))];
if(!files.includes('/offline/index.html'))throw new Error('Offline shell was not emitted');
await writeFile('dist/client/offline-assets.json',JSON.stringify({version:'0.13.0',files}));
