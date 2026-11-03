import {generateKeyPairSync,createPrivateKey,createPublicKey} from 'node:crypto';
import type {DatabaseSync} from 'node:sqlite';
import type {PushConfig} from '../server/push.ts';

/** Installation-specific VAPID keys live in the persistent, private data volume. */
export function standalonePushConfig(db:DatabaseSync,origin:string):PushConfig{
 const key='standalone:vapid';
 if(!db.prepare('SELECT value FROM push_state WHERE key=?').get(key)){
  const pair=generateKeyPairSync('ec',{namedCurve:'prime256v1'});
  const privateJwk=pair.privateKey.export({format:'jwk'});
  db.prepare('INSERT INTO push_state(key,value) VALUES(?,?) ON CONFLICT(key) DO NOTHING').run(key,JSON.stringify(privateJwk));
 }
 const privateJwk=JSON.parse(String(db.prepare('SELECT value FROM push_state WHERE key=?').get(key)!.value));
 if(privateJwk.kty!=='EC'||privateJwk.crv!=='P-256'||!privateJwk.d)throw new Error('Invalid persisted push key; restore the installation backup.');
 const publicJwk=createPublicKey(createPrivateKey({key:privateJwk,format:'jwk'})).export({format:'jwk'});
 const publicKey=Buffer.concat([Buffer.from([4]),Buffer.from(publicJwk.x!,'base64url'),Buffer.from(publicJwk.y!,'base64url')]).toString('base64url');
 return {publicKey,privateJwk:JSON.stringify(privateJwk),subject:origin};
}

/** One process timer; persisted device claims and a DB lease also survive restarts. */
export function startPushScheduler(run:()=>Promise<unknown>,interval=60_000){
 let pending:Promise<void>|null=null,stopped=false;
 const tick=()=>{
  if(stopped||pending)return;
  pending=Promise.resolve().then(run).then(()=>{},()=>{console.error('Putzonaut: Geräteerinnerungen konnten nicht geprüft werden; erneuter Versuch folgt.');}).finally(()=>{pending=null;});
 };
 const timer=setInterval(tick,interval);timer.unref();tick();
 return async()=>{stopped=true;clearInterval(timer);await pending;};
}
