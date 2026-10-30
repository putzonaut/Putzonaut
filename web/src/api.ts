export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) { super(message); this.status = status; }
}
export async function api<T = any>(url: string, options: RequestInit = {}): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`/api${url}`, { credentials: 'same-origin', ...options,
      headers: { 'Content-Type': 'application/json', ...options.headers } });
  } catch { throw new ApiError(0, 'Keine Verbindung. Bitte prüfe dein Internet und versuche es erneut.'); }
  if(response.redirected)throw new ApiError(401,'Bitte melde dich erneut an.');
  const body:unknown = await response.json().catch(() => {throw new ApiError(response.ok?502:response.status,'Die Antwort konnte nicht gelesen werden.');});
  if (!response.ok) throw new ApiError(response.status, (body && typeof body==='object' && 'error' in body && typeof body.error==='string' ? body.error : 'Das hat gerade nicht geklappt.'));
  return body as T;
}
export const post = <T = any>(url: string, body: any = {}) => api<T>(url, { method: 'POST', body: JSON.stringify(body) });
