import {createCipheriv,createDecipheriv,createHash,randomBytes} from 'node:crypto';
import type {DatabaseSync} from 'node:sqlite';
import nodemailer from 'nodemailer';

export type Mail={to:string;subject:string;text:string};
export type MailTransport=(mail:Mail)=>Promise<void>;
export function smtpTransport(env:NodeJS.ProcessEnv):MailTransport{
 const host=env.SMTP_HOST,from=env.MAIL_FROM;
 if(!host||!from)throw new Error('SMTP_HOST and MAIL_FROM are required');
 const port=Number(env.SMTP_PORT??465);
 if(!Number.isInteger(port)||port<1||port>65535)throw new Error('Invalid SMTP_PORT');
 if(!!env.SMTP_USER!==!!env.SMTP_PASSWORD)throw new Error('Set both SMTP_USER and SMTP_PASSWORD');
 const transport=nodemailer.createTransport({host,port,secure:port===465,requireTLS:port!==465,
  auth:env.SMTP_USER?{user:env.SMTP_USER,pass:env.SMTP_PASSWORD}:undefined,
  connectionTimeout:10000,greetingTimeout:10000,socketTimeout:20000,
  disableFileAccess:true,disableUrlAccess:true});
 return async mail=>{await transport.sendMail({...mail,from});};
}

/** Durable encrypted outbox keeps SMTP latency out of account-existence responses. */
export function mailQueue(db:DatabaseSync,secret:string,send:MailTransport){
 db.exec('CREATE TABLE IF NOT EXISTS putzonaut_mail (id TEXT PRIMARY KEY, payload TEXT NOT NULL, attempts INTEGER NOT NULL DEFAULT 0, next_at INTEGER NOT NULL, expires_at INTEGER NOT NULL)');
 const key=createHash('sha256').update('putzonaut-mail-v1\0'+secret).digest();
 let draining:Promise<void>|null=null;
 function enqueue(mail:Mail){
  const iv=randomBytes(12),cipher=createCipheriv('aes-256-gcm',key,iv);
  const content=Buffer.concat([cipher.update(JSON.stringify(mail),'utf8'),cipher.final()]);
  const payload=Buffer.concat([iv,cipher.getAuthTag(),content]).toString('base64');
  db.prepare('INSERT INTO putzonaut_mail(id,payload,next_at,expires_at) VALUES(?,?,?,?)').run(crypto.randomUUID(),payload,Date.now(),Date.now()+30*60_000);
 }
 async function drain(){
  db.prepare('DELETE FROM putzonaut_mail WHERE expires_at<?').run(Date.now());
  const items=db.prepare('SELECT id,payload,attempts FROM putzonaut_mail WHERE next_at<=? ORDER BY next_at LIMIT 10').all(Date.now());
  for(const item of items){
   try{
    const payload=Buffer.from(String(item.payload),'base64');
    const cipher=createDecipheriv('aes-256-gcm',key,payload.subarray(0,12));cipher.setAuthTag(payload.subarray(12,28));
    const mail=JSON.parse(Buffer.concat([cipher.update(payload.subarray(28)),cipher.final()]).toString('utf8')) as Mail;
    await send(mail);db.prepare('DELETE FROM putzonaut_mail WHERE id=?').run(item.id);
   }catch{
    const attempts=Number(item.attempts)+1;
    db.prepare('UPDATE putzonaut_mail SET attempts=?,next_at=? WHERE id=?').run(attempts,Date.now()+Math.min(300_000,2**Math.min(attempts,8)*5000),item.id);
    // Never log addresses, message text, reset links, SMTP credentials or tokens.
    console.error('Putzonaut: E-Mail-Zustellung fehlgeschlagen; erneuter Versuch folgt.');
   }
  }
 }
 function flush(){if(!draining)draining=drain().finally(()=>{draining=null;});return draining;}
 return {enqueue,flush};
}
