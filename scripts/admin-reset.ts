// Run interactively on the host/container; never accept passwords as CLI args.
import { createInterface } from 'node:readline/promises';
import { Writable } from 'node:stream';
import { database } from '../server/database.ts';
import { hashPassword } from '../server/auth.ts';
if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL fehlt.');
if (!process.stdin.isTTY) throw new Error('Bitte interaktiv in einem Terminal ausführen.');
let muted=false;
const output=new Writable({ write(chunk,_encoding,callback){ if(!muted) process.stdout.write(chunk); callback(); } });
const rl=createInterface({input:process.stdin,output,terminal:true});
const username=(await rl.question('Benutzername: ')).trim().toLowerCase();
process.stdout.write('Neues Passwort (mindestens 10 Zeichen, Eingabe verborgen): '); muted=true;
const password=await rl.question(''); muted=false; process.stdout.write('\n'); rl.close();
if(password.length<10||password.length>128) throw new Error('Das Passwort muss 10 bis 128 Zeichen enthalten.');
const db=await database(process.env.DATABASE_URL);
try {
  const hash=await hashPassword(password);
  await db.transaction(async q=>{
    const result=await q.query('UPDATE users SET password_hash=$1 WHERE username=$2 RETURNING id',[hash,username]);
    if(!result.rows.length) throw new Error('Benutzer nicht gefunden.');
    await q.query('DELETE FROM sessions WHERE user_id=$1',[result.rows[0].id]);
  });
  console.log('Passwort geändert. Alle bisherigen Sitzungen dieses Kontos wurden abgemeldet.');
} finally { await db.close(); }
