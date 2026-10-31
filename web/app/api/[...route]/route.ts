import {dispatchPush} from '../../../server/push';
import { env } from 'cloudflare:workers';
import { getChatGPTUser } from '../../chatgpt-auth';
import { handleApi } from '../../../server/api';
import { Repository } from '../../../server/repository';
export const dynamic='force-dynamic';
async function route(request:Request){
 if(!env.DB)return Response.json({error:'Die Datenbank ist noch nicht erreichbar.'},{status:503,headers:{'Cache-Control':'no-store'}});
 const config={publicKey:env.PUSH_VAPID_PUBLIC_KEY,privateJwk:env.PUSH_VAPID_JWK};
 if(new URL(request.url).pathname==='/api/push/dispatch')return dispatchPush(request,new Repository(env.DB),config);
 return handleApi(request,await getChatGPTUser(),new Repository(env.DB),{development:import.meta.env.DEV,bucket:env.BUCKET,push:config});
}
export const GET=route;
export const POST=route;
export const PATCH=route;
export const DELETE=route;
