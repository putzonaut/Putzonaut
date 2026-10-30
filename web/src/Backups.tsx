'use client';
import {useEffect,useState} from 'react';
import {Download,FileCheck2,History,ShieldCheck,Upload} from 'lucide-react';
import {BACKUP_MAX_BYTES} from '../shared/backup';
import type {BackupPreview} from '../shared/backup';

type Request=<T=unknown>(url:string,options?:RequestInit)=>Promise<T>;
const date=(value:string)=>new Date(value).toLocaleString('de-DE',{dateStyle:'medium',timeStyle:'short'});
export default function Backups({crewName,busy,request,onRun,onRestored}:{crewName:string;busy:boolean;request:Request;onRun:(fn:()=>Promise<void>)=>Promise<void>;onRestored:()=>Promise<void>}) {
  const [backup,setBackup]=useState<unknown>(null),[preview,setPreview]=useState<BackupPreview|null>(null);
  const [fileName,setFileName]=useState(''),[confirmation,setConfirmation]=useState('');
  const [recoveryAt,setRecoveryAt]=useState<string|null>(null),[statusError,setStatusError]=useState(''),[message,setMessage]=useState('');
  useEffect(()=>{let active=true;void request<{recoveryAt:string|null}>('/backups/status').then(data=>{if(active)setRecoveryAt(data.recoveryAt);}).catch(()=>{if(active)setStatusError('Der letzte Rücksprungpunkt konnte gerade nicht geladen werden.');});return()=>{active=false;};},[request]);
  async function download(recovery=false){await onRun(async()=>{
    setMessage('');const data=await request('/backups'+(recovery?'/recovery':''));
    const blob=new Blob([JSON.stringify(data)],{type:'application/json'}),url=URL.createObjectURL(blob);
    const a=document.createElement('a');a.href=url;a.download=`putzonaut-${recovery?'ruecksprung':'sicherung'}-${new Date().toISOString().slice(0,10)}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),10000);
    setMessage('Die Sicherung ist zum Speichern bereit. Bewahre die Datei an einem sicheren Ort auf.');
  });}
  async function inspect(value:unknown){setPreview(null);setConfirmation('');const result=await request<BackupPreview>('/backups/preview',{method:'POST',body:JSON.stringify({backup:value})});setPreview(result);}
  async function selectFile(file:File){setPreview(null);setBackup(null);setConfirmation('');setMessage('');setFileName(file.name);await onRun(async()=>{
    if(file.size>BACKUP_MAX_BYTES)throw new Error('Die Datei ist größer als 8 MB. Bitte wähle eine passende Putzonaut-Sicherung.');
    let value:unknown;try{value=JSON.parse(await file.text());}catch{throw new Error('Diese Datei konnte nicht gelesen werden. Bitte wähle eine unveränderte Putzonaut-Sicherung.');}
    setBackup(value);await inspect(value);
  });}
  return <><div className="sheet-illustration"><ShieldCheck size={45}/></div><h2>Sichern & wiederherstellen</h2><p>Missionen, Profile, Punkte, Wünsche, Raumstation und das vollständige Logbuch – zusammen in einer Datei.</p>
    <button className="button primary" disabled={busy} onClick={()=>download()}><Download size={19}/>Sicherung herunterladen</button>
    {message&&<p className="backup-status" role="status"><FileCheck2 size={19}/>{message}</p>}
    <p className="game-note">Ohne Anmeldedaten oder Einladungslinks. Die Datei enthält die Namen und Aktivitäten eurer Crew.</p>
    <section className="backup-import"><h3><Upload size={19}/>Einen Stand wiederherstellen</h3><p>Für diese Crew bei unveränderten Mitgliedern, Rollen und Kinderbegleitungen. Ältere Crew-Exporte bis Version 0.6 haben keine Wiederherstellungsfunktion.</p>
      <label className="backup-file">Sicherungsdatei auswählen<input type="file" accept=".json,application/json" disabled={busy} onChange={e=>{const file=e.target.files?.[0];if(file)void selectFile(file);e.target.value='';}}/></label>
      {fileName&&<p className="backup-filename">{fileName}</p>}
      {backup!==null&&!preview&&<button className="button secondary" disabled={busy} onClick={()=>onRun(()=>inspect(backup))}>Datei erneut prüfen</button>}
      {preview&&<><dl className="setup-summary backup-summary"><div><dt>Sicherung vom</dt><dd>{date(preview.createdAt)}</dd></div><div><dt>Crew</dt><dd>{preview.crewName}</dd></div><div><dt>Profile · Missionen · Wünsche</dt><dd>{preview.memberCount} · {preview.taskCount} · {preview.rewardCount}</dd></div><div><dt>Logbucheinträge</dt><dd>{preview.historyCount}</dd></div></dl>
      <p className="backup-warning">Dieser Stand ersetzt eure aktuellen Aufgaben, Punkte und Wünsche. Neuere Änderungen werden zurückgesetzt. Direkt davor wird der aktuelle Stand automatisch als Rücksprungpunkt gesichert. Offene Einladungen werden ungültig.</p>
      <label>Zur Bestätigung „{crewName}“ eingeben<input value={confirmation} disabled={busy} maxLength={60} autoComplete="off" onChange={e=>setConfirmation(e.target.value)}/></label>
      <button className="button danger" disabled={busy||confirmation!==crewName} onClick={()=>onRun(async()=>{try{await request('/backups/restore',{method:'POST',body:JSON.stringify({backup,expectedRevision:preview.expectedRevision,confirmation})});}catch(error){setPreview(null);setConfirmation('');throw error;}await onRestored();})}>Diesen Stand wiederherstellen</button>
      <button className="text-button centered" disabled={busy} onClick={()=>onRun(()=>inspect(backup))}>Vorschau aktualisieren</button></>}
    </section>
    {recoveryAt&&<section className="backup-recovery"><h3><History size={19}/>Vor der letzten Wiederherstellung</h3><p>Stand vom {date(recoveryAt)}. Lade ihn herunter und wähle ihn oben aus, um zurückzukehren.</p><button className="button secondary" disabled={busy} onClick={()=>download(true)}>Rücksprungpunkt herunterladen</button></section>}
    {statusError&&<p className="game-note">{statusError}</p>}
    <details className="backup-details"><summary>Umfang der Sicherung</summary><p>Eine vollständige Sicherung eurer Crew-Daten, einschließlich ausgeschiedener Profile und Logbuch. Sie stellt keine Anmeldung oder gelöschte Crew wieder her und ersetzt kein Betreiber-Backup der gesamten Datenbank. Bis zu 8 MB und 10.000 Logbucheinträge; größere Sicherungen werden mit einer Meldung abgebrochen und niemals gekürzt. Der automatische Rücksprungpunkt wird bei der nächsten Wiederherstellung ersetzt.</p></details>
  </>;
}
