import {betterAuth} from 'better-auth';
import type {BetterAuthOptions} from 'better-auth';
import {getMigrations} from 'better-auth/db/migration';
import type {DatabaseSync} from 'node:sqlite';
import type {Mail} from './mail.ts';

export async function createAuth(database:DatabaseSync,origin:string,secret:string,enqueue:(mail:Mail)=>void){
 if(secret.length<32)throw new Error('BETTER_AUTH_SECRET must contain at least 32 random characters');
 const url=new URL(origin);
 if(url.origin!==origin||url.username||url.password||!(url.protocol==='https:'||(url.protocol==='http:'&&['localhost','127.0.0.1','[::1]'].includes(url.hostname))))throw new Error('APP_ORIGIN must be an HTTPS origin (HTTP is allowed only on localhost)');
 const options={
  appName:'Putzonaut',baseURL:origin,basePath:'/api/account',secret,database,
  trustedOrigins:[origin],
  emailAndPassword:{
   enabled:true,requireEmailVerification:true,autoSignIn:false,
   minPasswordLength:12,maxPasswordLength:128,
   resetPasswordTokenExpiresIn:30*60,revokeSessionsOnPasswordReset:true,
   async sendResetPassword({user,url}){enqueue({to:user.email,subject:'Dein neues Putzonaut-Passwort',text:`Hallo!\n\nHier kannst du dein Putzonaut-Passwort neu festlegen:\n${url}\n\nDer Link gilt 30 Minuten und kann nur einmal verwendet werden. Wenn du das nicht angefordert hast, ignoriere diese Nachricht.\n\nDein Putzonaut`});},
  },
  emailVerification:{
   sendOnSignUp:true,sendOnSignIn:false,autoSignInAfterVerification:false,expiresIn:60*60,
   async sendVerificationEmail({user,url}){enqueue({to:user.email,subject:'Bestätige deine E-Mail für Putzonaut',text:`Hallo!\n\nBestätige deine E-Mail-Adresse, um mit deiner Crew zu starten:\n${url}\n\nDer Link gilt eine Stunde. Wenn du kein Konto angelegt hast, ignoriere diese Nachricht.\n\nDein Putzonaut`});},
  },
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
  }},
  logger:{level:'error',log(){console.error('Putzonaut: Kontoanfrage fehlgeschlagen.');}},
 } satisfies BetterAuthOptions;
 const migrations=await getMigrations(options);await migrations.runMigrations();
 return betterAuth(options);
}
