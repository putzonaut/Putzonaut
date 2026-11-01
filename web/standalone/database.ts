import {DatabaseSync} from 'node:sqlite';
import {readFileSync, readdirSync, mkdirSync} from 'node:fs';
import {dirname, join} from 'node:path';
import {createHash} from 'node:crypto';
import type {Database} from '../server/repository.ts';

/** The same SQL and atomic batches as D1, backed by a persistent local SQLite file. */
export function openDatabase(path:string){
 mkdirSync(dirname(path),{recursive:true,mode:0o700});
 const sqlite=new DatabaseSync(path);
 sqlite.exec('PRAGMA foreign_keys=ON; PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000;');
 sqlite.exec('CREATE TABLE IF NOT EXISTS putzonaut_migrations (name TEXT PRIMARY KEY, checksum TEXT NOT NULL)');
 const migrations=new URL('../drizzle/',import.meta.url);
 for(const name of readdirSync(migrations).filter(n=>/^\d+.*\.sql$/.test(n)).sort()){
  const sql=readFileSync(new URL(name,migrations),'utf8');
  const checksum=createHash('sha256').update(sql).digest('hex');
  const prior=sqlite.prepare('SELECT checksum FROM putzonaut_migrations WHERE name=?').get(name);
  if(prior){if(prior.checksum!==checksum)throw new Error(`Migration ${name} was changed after application`);continue;}
  sqlite.exec('BEGIN IMMEDIATE');
  try{sqlite.exec(sql);sqlite.prepare('INSERT INTO putzonaut_migrations VALUES(?,?)').run(name,checksum);sqlite.exec('COMMIT');}
  catch(error){sqlite.exec('ROLLBACK');sqlite.close();throw error;}
 }
 return {sqlite,db:asD1(sqlite)};
}

export function asD1(sqlite:DatabaseSync):Database{
 class Statement{
  readonly sql:string;readonly values:unknown[];
  constructor(sql:string,values:unknown[]=[]){this.sql=sql;this.values=values;}
  bind(...values:unknown[]){return new Statement(this.sql,values);}
  execute(){
   const stmt=sqlite.prepare(this.sql);
   const values=this.values as Parameters<typeof stmt.all>;
   if(stmt.columns().length)return {success:true,results:stmt.all(...values),meta:{changes:0}};
   const result=stmt.run(...values);
   return {success:true,results:[],meta:{changes:Number(result.changes),last_row_id:Number(result.lastInsertRowid)}};
  }
  async first(column?:string){const result=this.execute().results[0]??null;return column&&result?result[column]:result;}
  async all(){return this.execute();}
  async run(){return this.execute();}
 }
 return {
  prepare:(sql:string)=>new Statement(sql),
  async batch(statements:Statement[]){
   // No await between BEGIN and COMMIT: one batch cannot interleave with another request.
   sqlite.exec('BEGIN IMMEDIATE');
   try{const result=statements.map(s=>s.execute());sqlite.exec('COMMIT');return result;}
   catch(error){sqlite.exec('ROLLBACK');throw error;}
  },
 } as unknown as Database;
}
