import {DatabaseSync} from 'node:sqlite';
import {readFile} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {relinkAccounts} from './relink.ts';

const args=process.argv.slice(2),input=args.find(a=>!a.startsWith('--'));
if(!input||args.some(a=>a.startsWith('--')&&a!=='--apply'))throw new Error('Usage: node standalone/map-accounts.ts mapping.json [--apply]. Stop the server and make a full backup first.');
const directory=resolve(process.env.DATA_DIR??'data');
const crew=new DatabaseSync(join(directory,'crew.sqlite'));
const accounts=new DatabaseSync(join(directory,'accounts.sqlite'),{readOnly:true});
try{
 const result=relinkAccounts(crew,accounts,JSON.parse(await readFile(input,'utf8')),args.includes('--apply'));
 console.table(result.map(({crew,member,newEmail})=>({Crew:crew,Profil:member,'Bestätigtes neues Konto':newEmail})));
 console.log(args.includes('--apply')?'Zuordnung gespeichert.':'Nur Vorschau. Keine Daten verändert. Für die Anwendung erneut mit --apply ausführen.');
}finally{crew.close();accounts.close();}
