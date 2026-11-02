import {cp,mkdir,rm,copyFile,readFile} from 'node:fs/promises';
import {resolve} from 'node:path';

const root=resolve('dist/website');
await rm(root,{recursive:true,force:true});await mkdir(root,{recursive:true});
await cp('website',root,{recursive:true});
await mkdir(resolve(root,'website-assets/fonts'),{recursive:true});
for(const weight of [400,700,800,900])await copyFile(`node_modules/@fontsource/nunito/files/nunito-latin-${weight}-normal.woff2`,resolve(root,`website-assets/fonts/nunito-${weight}.woff2`));
await copyFile('public/icons/icon-192.png',resolve(root,'website-assets/icon.png'));
const source=await readFile(resolve(root,'index.html'),'utf8');
if(/https?:\/\/[^"' ]+\.(?:woff2|js|css)/.test(source))throw new Error('Website assets must stay local.');
console.log('Putzonaut website built: separate static surface, local fonts and artwork.');
