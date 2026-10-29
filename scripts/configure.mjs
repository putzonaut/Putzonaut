import { randomBytes } from 'node:crypto';
import { writeFile } from 'node:fs/promises';
const args=process.argv.slice(2);
const index=args.indexOf('--origin');
const origin=index<0?'http://localhost:3080':args[index+1];
const url=new URL(origin);
if(!['http:','https:'].includes(url.protocol)||url.origin!==origin) throw new Error('Bitte eine vollständige HTTP(S)-Adresse ohne Pfad und ohne abschließenden Schrägstrich verwenden.');
const config=`APP_ORIGIN=${origin}\nPORT=3080\nBIND_ADDRESS=127.0.0.1\nPOSTGRES_PASSWORD=${randomBytes(32).toString('hex')}\nSETUP_TOKEN=${randomBytes(24).toString('hex')}\n`;
try { await writeFile('.env',config,{flag:'wx',mode:0o600}); }
catch(error) { if(error.code==='EEXIST') throw new Error('.env existiert bereits und wurde nicht verändert.'); throw error; }
console.log('Konfiguration erstellt. Den Einrichtungscode findest du in .env unter SETUP_TOKEN. Bewahre die Datei sicher auf.');
