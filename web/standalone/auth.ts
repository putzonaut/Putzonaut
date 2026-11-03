import {betterAuth} from 'better-auth';
import type {BetterAuthOptions} from 'better-auth';
import {getMigrations} from 'better-auth/db/migration';
import {APIError,createAuthMiddleware,getAuthoritativeSessionFromCtx} from 'better-auth/api';
import {createHash} from 'node:crypto';
import {z} from 'zod';
import type {DatabaseSync} from 'node:sqlite';
import type {Mail} from './mail.ts';

type AccountUser={id:string;email:string};
type AccountLifecycle={beforeDelete:(user:AccountUser)=>Promise<void>;afterDelete:(user:AccountUser)=>Promise<void>};
const tokenHash=(value:string)=>createHash('sha256').update(value).digest('hex');
function tokenPayload(token:string):Record<string,unknown>{try{const value:unknown=JSON.parse(Buffer.from(token.split('.')[1],'base64url').toString());return value&&typeof value==='object'&&!Array.isArray(value)?value as Record<string,unknown>:{};}catch{return {};}}
export async function createAuth(database:DatabaseSync,origin:string,secret:string,enqueue:(mail:Mail)=>void,lifecycle:AccountLifecycle){
 if(secret.length<32)throw new Error('BETTER_AUTH_SECRET must contain at least 32 random characters');
 const url=new URL(origin);
 if(url.origin!==origin||url.username||url.password||!(url.protocol==='https:'||(url.protocol==='http:'&&['localhost','127.0.0.1','[::1]'].includes(url.hostname))))throw new Error('APP_ORIGIN must be an HTTPS origin (HTTP is allowed only on localhost)');
 database.exec('CREATE TABLE IF NOT EXISTS putzonaut_email_changes (token_hash TEXT PRIMARY KEY, user_id TEXT NOT NULL UNIQUE, old_email TEXT NOT NULL, new_email TEXT NOT NULL, expires_at INTEGER NOT NULL)');
 const options={
  appName:'Putzonaut',baseURL:origin,basePath:'/api/account',secret,database,
  trustedOrigins:[origin],
  emailAndPassword:{
   enabled:true,requireEmailVerification:true,autoSignIn:false,
   minPasswordLength:12,maxPasswordLength:128,
   resetPasswordTokenExpiresIn:30*60,revokeSessionsOnPasswordReset:true,
   async onPasswordReset({user}){database.prepare('DELETE FROM putzonaut_email_changes WHERE user_id=?').run(user.id);},
   async sendResetPassword({user,url}){enqueue({accountId:user.id,to:user.email,subject:'Dein neues Putzonaut-Passwort',text:`Hallo!\n\nHier kannst du dein Putzonaut-Passwort neu festlegen:\n${url}\n\nDer Link gilt 30 Minuten und kann nur einmal verwendet werden. Wenn du das nicht angefordert hast, ignoriere diese Nachricht.\n\nDein Putzonaut`});},
  },
  emailVerification:{
   sendOnSignUp:true,sendOnSignIn:false,autoSignInAfterVerification:false,expiresIn:60*60,
   async sendVerificationEmail({user,url,token}){
    const change=tokenPayload(token).requestType==='change-email-verification';
    if(change){
     const current=database.prepare('SELECT email FROM user WHERE id=?').get(user.id);
     if(!current)throw new APIError('UNAUTHORIZED',{message:'Bitte melde dich erneut an.'});
     database.prepare('DELETE FROM putzonaut_email_changes WHERE expires_at<?').run(Date.now());
     database.prepare('INSERT INTO putzonaut_email_changes(token_hash,user_id,old_email,new_email,expires_at) VALUES(?,?,?,?,?) ON CONFLICT(user_id) DO UPDATE SET token_hash=excluded.token_hash,old_email=excluded.old_email,new_email=excluded.new_email,expires_at=excluded.expires_at').run(tokenHash(token),user.id,current.email,user.email,Date.now()+3600_000);
    }
    enqueue({accountId:user.id,to:user.email,subject:change?'Bestätige deine neue Putzonaut-Adresse':'Bestätige deine E-Mail für Putzonaut',text:`Hallo!\n\n${change?'Bestätige deine neue Login-E-Mail-Adresse. Bis dahin bleibt deine bisherige Adresse gültig.':'Bestätige deine E-Mail-Adresse, um mit deiner Crew zu starten:'}\n${url}\n\nDer Link gilt eine Stunde. Wenn du das nicht angefordert hast, ignoriere diese Nachricht.\n\nDein Putzonaut`});
   },
   async afterEmailVerification(user){
    const change=database.prepare('SELECT old_email FROM putzonaut_email_changes WHERE user_id=? AND new_email=?').get(user.id,user.email);
    if(!change)return;
    // Revoke sessions and earlier password-reset links, including on other devices.
    database.prepare('DELETE FROM session WHERE userId=?').run(user.id);
    database.prepare('DELETE FROM verification WHERE value=?').run(user.id);
    database.prepare('DELETE FROM putzonaut_email_changes WHERE user_id=?').run(user.id);
    enqueue({accountId:user.id,to:String(change.old_email),subject:'Deine Putzonaut-Adresse wurde geändert',text:'Hallo!\n\nDie Login-E-Mail deines Putzonaut-Kontos wurde geändert. Alle bisherigen Sitzungen wurden beendet. Falls du das nicht selbst veranlasst hast, wende dich an den Betreiber deiner Putzonaut-Installation.\n\nDein Putzonaut'});
   },
  },
  user:{changeEmail:{enabled:true,updateEmailWithoutVerification:false},deleteUser:{enabled:true,
   beforeDelete:lifecycle.beforeDelete,
   async afterDelete(user){
    database.prepare('DELETE FROM verification WHERE value=?').run(user.id);
    database.prepare('DELETE FROM putzonaut_email_changes WHERE user_id=?').run(user.id);
    await lifecycle.afterDelete(user);
   },
  }},
  hooks:{before:createAuthMiddleware(async ctx=>{
   if(ctx.path==='/verify-email'&&typeof ctx.query?.token==='string'&&tokenPayload(ctx.query.token).updateTo){
    const pending=database.prepare('SELECT c.user_id FROM putzonaut_email_changes c JOIN user u ON u.id=c.user_id AND u.email=c.old_email WHERE c.token_hash=? AND c.expires_at>?').get(tokenHash(ctx.query.token),Date.now());
    if(!pending){
     if(ctx.query.callbackURL===origin+'/konto/email-bestaetigt')throw ctx.redirect(origin+'/konto/email-bestaetigt?error=INVALID_TOKEN');
     throw new APIError('BAD_REQUEST',{code:'INVALID_TOKEN',message:'Der Link ist ungültig oder abgelaufen.'});
    }
   }
   if(!['/change-email','/delete-user'].includes(ctx.path))return;
   const schema=ctx.path==='/delete-user'
    ?z.object({password:z.string().min(1).max(128),confirmation:z.literal('KONTO LÖSCHEN')}).strict()
    :z.object({password:z.string().min(1).max(128),newEmail:z.string().email().max(254),callbackURL:z.literal(origin+'/konto/email-bestaetigt')}).strict();
   const input=schema.safeParse(ctx.body);
   if(!input.success)throw new APIError('BAD_REQUEST',{code:'INVALID_ACCOUNT_CONFIRMATION',message:'Bitte prüfe Passwort und Bestätigung.'});
   const session=await getAuthoritativeSessionFromCtx(ctx);
   if(!session?.user.emailVerified)throw new APIError('UNAUTHORIZED',{message:'Bitte melde dich erneut an.'});
   if(ctx.path==='/change-email'){
    const credential=await ctx.context.internalAdapter.findCredentialAccount(session.user.id);
    if(!credential?.password||!await ctx.context.password.verify({hash:credential.password,password:input.data.password}))throw new APIError('BAD_REQUEST',{code:'INVALID_PASSWORD',message:'Das aktuelle Passwort stimmt nicht.'});
   }
  })},
  session:{expiresIn:30*24*60*60,updateAge:24*60*60,freshAge:10*60,cookieCache:{enabled:false}},
  account:{accountLinking:{enabled:false}},
  advanced:{cookiePrefix:'putzonaut',useSecureCookies:url.protocol==='https:',
   defaultCookieAttributes:{httpOnly:true,sameSite:'lax',path:'/'},
   ipAddress:{ipAddressHeaders:['x-putzonaut-client-ip']},
  },
  rateLimit:{enabled:true,storage:'database',window:60,max:60,customRules:{
   '/sign-up/email':{window:3600,max:5},
   '/sign-in/email':{window:60,max:10},
   '/request-password-reset':{window:300,max:3},
   '/send-verification-email':{window:300,max:3},
   '/reset-password':{window:300,max:10},
   '/change-email':{window:300,max:5},
   '/delete-user':{window:300,max:5},
  }},
  logger:{level:'error',log(){console.error('Putzonaut: Kontoanfrage fehlgeschlagen.');}},
 } satisfies BetterAuthOptions;
 const migrations=await getMigrations(options);await migrations.runMigrations();
 return betterAuth(options);
}
