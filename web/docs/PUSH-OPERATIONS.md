# Betrieb der Putzonaut-Erinnerungen

## Eigenständiger Server ab 0.23.0

Der App-Prozess startet den internen Zeitgeber automatisch und prüft jede Minute bis zu 30 Geräte. VAPID-Schlüssel und Tagesansprüche bleiben in `crew.sqlite`; die konfigurierte `APP_ORIGIN` ist der Absenderkontakt. Ein Datenbank-Lease und atomare Tagesansprüche verhindern doppelte Versuche auch nach Neustarts. Beim Herunterfahren wartet der Server auf einen laufenden Versand.

Keine öffentliche Dispatch-Route und kein externer Cron-Aufruf sind vorgesehen. `GET /api/push` zeigt angemeldeten Mitgliedern nur den öffentlichen Schlüssel, eigene Geräte und den letzten Prüfzeitpunkt. Geräte müssen für die tatsächliche HTTPS-Origin ausdrücklich aktiviert werden. Den alten privaten Sites-Auftrag nicht auf die öffentliche App umleiten.

## Private Sites-Version: Grenzen und Zugang

Site: `appgprj_6ae3a46ecfb481919ed08a7764106ace`.
Adresse: `https://putzonaut-test.denny-subke.chatgpt.site`.

Der Dispatcher `/api/push/dispatch` ist eine gemeinsame interne Operation der **owner-privaten Site**. Sites prüft den Dienstzugriff; der Handler benötigt absichtlich keine künstliche Besucheridentität. Vor jedem unbeaufsichtigten Lauf mit Sites `get_site` bestätigen, dass ausschließlich der Eigentümer Zugriff hat. Bei erweiterter Zielgruppe oder fehlender Gewissheit abbrechen. Vor jeder späteren öffentlichen oder breiteren Freigabe muss diese interne Route separat authentifiziert werden. Freigabeeinstellungen nicht automatisch ändern.

Den kurzlebigen `siwc_bypass_bearer_token` aus dem aktuellen `get_site` ausschließlich im Header `OAI-Sites-Authorization: Bearer …` an diese genaue HTTPS-Site senden. Keine Weiterleitungen verfolgen, keine Cookies/Browsersitzung verwenden, Token nicht protokollieren, speichern oder in Aufgabenprompts einfügen. Dieser Dienstzugriff berechtigt nur die Site-Operation, keine anderen Konten oder Dienste.

## Lauf

1. Metadaten und private Zielgruppe prüfen; frischen Dienstzugriff beziehen.
2. `POST /api/push/dispatch`, JSON `{}`, `Content-Type: application/json`, mit obigem Dienstheader, keine Besucherheader. Der Server bestimmt alle Empfänger selbst; keine Crew-/Mitgliedskennungen oder freien Ziele mitgeben.
3. Der Server prüft höchstens 30 Geräte; bei `more: true` erneut aufrufen, maximal 20 Batches pro Lauf. Bei `busy: true` läuft bereits eine Ausführung: beenden. Keine blinden Wiederholungen nach HTTP-/Netzwerkfehlern.
4. `GET /api/push/dispatch` über denselben Zugang liest den gespeicherten `lastRun`. Zeitstempel und aggregierte Zähler mit dem letzten POST vergleichen. Bei leerem Ergebnis, Fehler oder überschrittener Batchgrenze präzise melden. Erfolgreiche Routineausführung braucht keinen Chat-Bericht.
5. Keine Veröffentlichung, Benutzeranmeldung oder sonstige Datenänderung ist pro Lauf nötig.

Zeitplan: stündlich, Minute 5, Zeitzone Europe/Berlin. Jedes Gerät wählt ein Stundenfenster; Ausführung und Geräteauslieferung können sich verzögern. Ein verpasstes Fenster wird nicht später am selben Tag nachgeholt. Für Erstprüfung `POST` mit `{"dryRun":true}` verwenden: schreibt nur aggregierten Prüfstatus, versendet nichts, reserviert keine Tagesversuche. Danach GET zum unabhängigen Lesen.

## Laufzeit und Speicherung

- Native Sites-Umgebung: `PUSH_VAPID_JWK` (privater P-256-JWK) und `PUSH_VAPID_PUBLIC_KEY` (unkomprimierter öffentlicher Punkt, base64url), beide als Secret gespeichert. Keine Schlüssel in Quellcode, Manifest, Prompt oder Crew-Sicherung. Umgebung nach Änderungen über ein gespeichertes Deployment anwenden.
- D1 `DB`, Migration `0002_white_norrin_radd.sql`: `push_devices` und `push_state`. Geräteendpunkte sind betriebliche Zugangsdaten und werden niemals durch Zustands-/Backup-APIs ausgegeben. VAPID-Autorisierung wird pro Push-Dienst zwischengespeichert, spätestens vor Ablauf erneuert; nicht für jede Nachricht neu signiert.
- R2 `BUCKET`: private Referenzfotos unter crewgebundenem Pfad. Abruf erfordert angemeldete Crew-Mitgliedschaft und eine aktuelle Aufgabenreferenz. Entfernte/ersetzte Dateien bleiben für Wiederherstellungen derselben Crew erhalten; 600 Objekte pro Crew, 256 KiB pro Foto. Vor einem Speicherumzug separat sichern; JSON exportiert nur Referenzen.

## Versandverhalten

Nur ausdrücklich angemeldete Erwachsenenprofile erhalten höchstens einen Versandversuch täglich je Gerät. Eigene, freie und dem eigenen verwalteten Kind zugeteilte offene Aufgaben zählen; Auszeiten und abgeschlossene/zu bestätigende Runden werden berücksichtigt. Kinder haben keine eigenen Anmeldungen. Geräteobergrenze: drei je Erwachsenenprofil.

Payloadloser Standard-Web-Push: HTTPS-Allowlist für Google FCM, Mozilla und Apple; keine Redirects, acht Sekunden Timeout, TTL eine Stunde, konstantes Topic. Der Service Worker zeigt sofort einen allgemeinen Hinweis ohne Namen und Aufgabeninhalt. 201 bedeutet vom Dienst angenommen, nicht am Endgerät zugestellt. 404/410 entfernt die Anmeldung. Unklare Fehler werden am selben Tag nicht wiederholt. Zehn-Minuten-Lease plus atomare Geräteclaims begrenzen parallele Läufe. Authentifizierte Eltern können Geräte an-/abmelden; explizites Abmelden widerruft lokal und serverseitig, offline zunächst lokal.

Ein stündlicher Sites-Cloud-Auftrag ist erforderlich. Es wird kein unbelegter nativer Worker-Cron vorausgesetzt. Bei Pausierung/Entfernung des Auftrags läuft kein automatischer Hintergrundversand. Vorhandene In-App-Erinnerungen bleiben getrennt nutzbar.

## Standardquellen

- https://w3c.github.io/push-api/
- https://www.rfc-editor.org/rfc/rfc8292
- https://developer.apple.com/documentation/usernotifications/sending-web-push-notifications-in-web-apps-and-browsers
- https://developers.cloudflare.com/workers/runtime-apis/web-crypto/
