import {mkdir, readFile, readdir, rename, unlink, writeFile} from 'node:fs/promises';
import {dirname, join, resolve} from 'node:path';
import type {PhotoBucket} from '../server/photos.ts';

export function photoStore(directory:string):PhotoBucket{
 const root=resolve(directory);
 const file=(key:string)=>{
  if(!/^knowledge\/[0-9a-f-]{36}\/[0-9a-f-]{36}$/.test(key))throw new Error('Invalid photo key');
  return join(root,key+'.json');
 };
 async function get(key:string){
  try{const obj=JSON.parse(await readFile(file(key),'utf8'));const bytes=Buffer.from(obj.data,'base64');return {size:bytes.length,httpMetadata:{contentType:obj.mime},async arrayBuffer(){return Uint8Array.from(bytes).buffer;}};}
  catch(error){if((error as NodeJS.ErrnoException).code==='ENOENT')return null;throw error;}
 }
 return {
  get,head:get,
  async put(key,value,options){
   const path=file(key),temporary=path+'.'+crypto.randomUUID()+'.tmp';
   await mkdir(dirname(path),{recursive:true,mode:0o700});
   await writeFile(temporary,JSON.stringify({mime:options.httpMetadata.contentType,data:Buffer.from(value).toString('base64')}),{mode:0o600,flag:'wx'});
   await rename(temporary,path);
  },
  async list({prefix,limit}){
   if(!/^knowledge\/[0-9a-f-]{36}\/$/.test(prefix))throw new Error('Invalid photo prefix');
   let names:string[]=[];try{names=(await readdir(join(root,prefix))).filter(n=>n.endsWith('.json'));}catch(error){if((error as NodeJS.ErrnoException).code!=='ENOENT')throw error;}
   return {objects:names.slice(0,limit).map(n=>({key:prefix+n.slice(0,-5)})),truncated:names.length>limit};
  },
  async delete(key){try{await unlink(file(key));}catch(error){if((error as NodeJS.ErrnoException).code!=='ENOENT')throw error;}},
 };
}
