# Putzonaut mit eigenen Konten · 0.26.3

Die aktuelle App aus `web/` läuft als eigenständiger Node-Server mit E-Mail und Passwort. Nutzer benötigen dafür weder ChatGPT noch GitHub. Oberfläche, Missionen, Crew, Kinderprofile, Punkte, Fotos und Offline-Funktionen verwenden denselben Anwendungscode wie die private Sites-Version.

## Umbrel Community Store

Auf Umbrel OS 2.0 oder neuer Putzonaut über [Denny’s Umbrel Community Store](https://github.com/dennysubke/dennys-umbrel-app-store) installieren. Die App führt beim ersten Start zu ihren nativen Umbrel-App-Einstellungen. Dort APP_ORIGIN, WEBSITE_ORIGIN, den Absender und die SMTP-Verbindung setzen; SMTP_PASSWORD als eigene Variable für den Dienst `web` eintragen. Zugangsdaten gehören nicht in GitHub oder in einen Chat.

Website und App laufen im selben Container. Der öffentliche Tunnel zeigt auf `http://denny-putzonaut_web_1:3081` für `putzonaut.de` und `www.putzonaut.de`; die App auf `http://denny-putzonaut_web_1:3080` für `app.putzonaut.de`. Der lokale Umbrel-App-Proxy bleibt geschützt. Die Website ist bereits erreichbar, während die App noch auf vollständige SMTP-Einstellungen wartet.

## Installation mit fertigem Docker-Image

Die geprüften Images für **amd64 und arm64** liegen unter `ghcr.io/putzonaut/putzonaut`. Auf dem Zielserver sind nur Docker mit Compose und die Konfiguration nötig. Quellcode, Git, Node.js und ein Build auf dem Server sind dafür nicht erforderlich.

Der Workflow **Web-App** veröffentlicht erst nach erfolgreichen App-Tests und einem Starttest beider Container-Architekturen. Das Artefakt **putzonaut-install** enthält `compose.yaml`, `compose.tunnel.yaml`, `.env.example` und `IMAGE.txt`. Seine Konfigurationsvorlage ist bereits auf den geprüften Image-Digest festgelegt. Versionen heißen `0.26.3-<Commit-Kürzel>`; zusätzlich gibt es einen vollständigen Commit-Tag und `latest`.

Das Container-Image ist öffentlich und lässt sich ohne GitHub-Anmeldung laden. Das Quellcode-Repository bleibt davon unabhängig.

Die Installationsdateien in einem eigenen Putzonaut-Konfigurationsordner ablegen. Dort:

```sh
cp .env.example .env
chmod 600 .env
openssl rand -hex 48
```

Den ausgegebenen Zufallswert einmalig als `BETTER_AUTH_SECRET` in `.env` eintragen. Ebenso `SMTP_USER` und `SMTP_PASSWORD` aus Brevo ergänzen. Der Absender ist `Putzonaut <info@putzonaut.de>`. Danach:

```sh
docker compose pull
docker compose up -d
docker compose ps
```

### Vorhandener Cloudflare-Connector in Docker

Wenn `cloudflared` in einem eigenen Container läuft, muss dieser die App über ein gemeinsames Docker-Netz erreichen. Die Namen der vorhandenen Netzwerke lassen sich ohne Ausgabe von Zugangsdaten anzeigen:

```sh
docker inspect cloudflared_connector_1 --format '{{range $name, $settings := .NetworkSettings.Networks}}{{println $name}}{{end}}'
```

Das passende bestehende Netzwerk als `PUTZONAUT_TUNNEL_NETWORK` in `.env` eintragen und mit der mitgelieferten Ergänzung starten:

```sh
docker compose -f compose.yaml -f compose.tunnel.yaml pull
docker compose -f compose.yaml -f compose.tunnel.yaml up -d
```

Die veröffentlichte Route im bestehenden Cloudflare-Tunnel lautet:

| Hostname | Service |
| --- | --- |
| `app.putzonaut.de` | `http://putzonaut-origin:3080` |
| `putzonaut.de` | `http://putzonaut-origin:3081` |
| `www.putzonaut.de` | `http://putzonaut-origin:3081` (Weiterleitung zur Hauptadresse) |

Die Domain und das HTTPS-Zertifikat müssen bei Cloudflare aktiv sein. `APP_ORIGIN=https://app.putzonaut.de` und `WEBSITE_ORIGIN=https://putzonaut.de` bleiben die öffentlichen HTTPS-Adressen. Für eigene Installationen die Betreiberangaben in `website/impressum.html` und `website/datenschutz.html` an den tatsächlichen Betrieb anpassen. Beim Betrieb ohne Container-Connector leitet der lokale HTTPS-Proxy an `127.0.0.1:3080` weiter.

### Daten und Aktualisierungen

Die App erhält ein eigenes benanntes Docker-Volume für Datenbanken und Fotos. Sie läuft als Benutzer 1000 mit schreibgeschütztem Container-Dateisystem und temporärem `/tmp`. Es werden weder das Host-Rootverzeichnis noch das Homeverzeichnis, der Docker-Socket oder Daten anderer Apps eingebunden. Docker selbst und die Konfigurationsdateien benötigen weiterhin Speicherplatz auf dem Server.

Für Updates zuerst die unten beschriebene Sicherung erstellen, dann `PUTZONAUT_IMAGE` auf den neuen geprüften Digest setzen und denselben Compose-Aufruf mit `pull` und `up -d` wiederholen. Projektname, Compose-Dateien, Datenvolume und ursprüngliches `BETTER_AUTH_SECRET` beibehalten. `docker compose down -v` würde das Datenvolume löschen und gehört nicht zum Update.

## Eigener Build für Entwicklung

Die ursprüngliche `compose.yaml` im Repository bleibt für einen lokalen Build verfügbar:

```sh
cd web/standalone
cp .env.example .env
chmod 600 .env
# .env mit APP_ORIGIN, dauerhaftem zufälligem Secret und SMTP-Zugang ausfüllen.
docker compose up -d --build
```

Dies ist weiterhin eine normale Docker-Anwendung; ein Eintrag im Umbrel App Store ist damit noch nicht veröffentlicht.

Der Proxy muss mindestens 9 MB Request-Body erlauben. `APP_ORIGIN` ist die genaue öffentliche HTTPS-Origin ohne abschließenden Schrägstrich. Host- und Forwarded-Header bestimmen weder Origin noch Identität. Standardmäßig gilt die tatsächliche Socket-IP als Client-IP. Nur wenn `TRUSTED_PROXY_IPS` exakt die verbindenden Proxy-Adressen enthält, wird dessen einzelner `X-Real-IP`-Wert akzeptiert. Der Proxy muss diesen Header überschreiben. Keine pauschalen privaten Netze freigeben.

Ohne Docker (Node 24.22.1 oder neuer in der 24er-Reihe): im Ordner `web/` zuerst `npm ci`, `npm run build:standalone`, dann `npm run start:standalone`. Die Konfiguration wird aus `standalone/.env` geladen. Daten liegen standardmäßig in `web/data/`; `DATA_DIR` kann ein anderes privates Verzeichnis festlegen.

## E-Mail-Versand

`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD` und `MAIL_FROM` sind in `.env.example` beschrieben. Port 465 nutzt TLS ab Verbindungsbeginn; andere Ports erfordern STARTTLS. Zertifikatsprüfung bleibt aktiv. Der Absender muss beim Mailanbieter erlaubt sein. Für `info@putzonaut.de` müssen die vom gewählten Mailanbieter vorgegebenen DNS-Einträge eingerichtet und echte Zustellungen geprüft werden.

Die App startet ohne Mailkonfiguration nicht. Sie verschickt Bestätigungs- und Reset-Mails über eine dauerhafte, verschlüsselte Warteschlange. SMTP-Fehler führen zu erneuten Versuchen bis maximal 30 Minuten; fehlgeschlagene Zustellung wird ohne Adressen, Tokens oder Mailtext protokolliert. Mails und ihre Links werden nicht als Vorschau oder Logausgabe an Nutzer zurückgegeben. Ein Bestätigungslink gilt eine Stunde, ein Reset-Link 30 Minuten. SMTP-Zustellung an echte Postfächer ist separat zu testen; automatisierte Tests verwenden ausschließlich einen lokalen Testtransport.

## Konten und Schutz der Daten

- Better Auth 1.7.14 übernimmt Passwort-Hashing, Sitzungen, E-Mail-Bestätigung und Reset-Tokens.
- Erst nach Bestätigung der E-Mail kann sich ein Konto anmelden und einer Crew beitreten. Kinderprofile bleiben an Erwachsene gebunden.
- Passwörter benötigen 12–128 Zeichen. Anmeldung und Wiederherstellung werden serverseitig begrenzt.
- Sitzungen liegen auf dem Server. Cookies sind bei HTTPS Secure, HttpOnly und SameSite=Lax. „Angemeldet bleiben“ gilt bis zu 30 Tage und wird bei Nutzung täglich verlängert; ohne Auswahl wird ein Sitzungscookie verwendet.
- Ein Passwort-Reset widerruft alle bisherigen Sitzungen. Abmeldung widerruft die aktuelle Sitzung. Persönliche API-Antworten werden nicht gecacht.
- Mitgliedschaft und Rollen werden weiterhin bei jeder Aktion auf dem Server geprüft. ChatGPT-Header und vom Browser übermittelte Profil-IDs erzeugen keine Identität.
- **Profil → Konto & Anmeldung** (auch ohne Crew erreichbar): Login-E-Mail mit aktuellem Passwort ändern. Die bisherige Adresse gilt bis zur Bestätigung der neuen Adresse. Der neueste Link gilt eine Stunde; danach werden alle Sitzungen und bisherigen Passwort-Reset-Links widerrufen. Crew-Zuordnung, Sterne und Erfolge bleiben erhalten. Die bisherige Adresse erhält eine Änderungsmitteilung.
- **Konto löschen:** zuerst die Crew verlassen oder schließen; Captain-Rolle und Begleitung von Kinderprofilen gegebenenfalls übertragen. Anschließend mit aktuellem Passwort, „KONTO LÖSCHEN“ und Bestätigung löschen. Zugang, Passwort, Sitzungen, ausstehende E-Mail-Änderungen und Reset-Links werden entfernt. Gemeinsame Crew-Inhalte und Logbucheinträge bleiben bestehen. Die App bereinigt Offline-Daten auf dem aktuellen Gerät; andere Geräte verlieren ihren Serverzugriff sofort und erkennen dies beim nächsten Abgleich.
- Gleichzeitige Konto- und Crew-Anfragen werden pro Konto nacheinander ausgeführt, damit während der Löschung keine neue verwaiste Mitgliedschaft entsteht. Eine Installation betreibt einen App-Prozess pro Datenvolume.

## Bestehende Testdaten übernehmen

Eine neue Installation ist leer. Es werden keine bestehenden Sites-Daten gelöscht, keine Konten anhand gleicher Namen oder E-Mail-Adressen automatisch verknüpft und keine fremden Crews übernommen.

Vor einer tatsächlichen Migration ist ein vollständiger, vom Betreiber geprüfter Export der Sites-Datenbank **einschließlich der internen Mitgliedschaften** und der privaten Fotos erforderlich. Der normale Crew-Export enthält diese Identitäten bewusst nicht und ersetzt keine Plattformmigration. Eine allgemeine D1-/R2-Importautomatik ist hier noch nicht enthalten. Der Export und seine Überführung in die lokale Datenbank werden als eigener, geprüfter Umzug durchgeführt.

Nach diesem Datentransfer werden neue Putzonaut-Konten registriert und verifiziert. Der Betreiber prüft die Zugehörigkeit jedes alten Kontos und erstellt ausdrücklich eine Zuordnungsdatei:

```json
[{"oldAccountId":"geprüfte-alte-konto-id","newEmail":"bestaetigtes-konto@example.org"}]
```

Der Server wird angehalten und eine vollständige Sicherung angelegt. Im Ordner `web/` zeigt `node standalone/map-accounts.ts /sicherer/pfad/zuordnung.json` zunächst nur die Vorschau. Erst der zusätzliche Parameter `--apply` schreibt die Zuordnung atomar. Bei Docker kann der Befehl in einem einmaligen Container mit demselben Datenvolume ausgeführt werden. `DATA_DIR` muss auf das übernommene Datenverzeichnis zeigen.

Das Werkzeug verlangt bestätigte, noch nicht einer Crew zugeordnete Zielkonten sowie aktive erwachsene Altprofile. Bei einem Fehler wird nichts übertragen. Crew- und Profil-IDs, Punkte und Logbuch bleiben erhalten; vorhandene Rücksprungpunkte erhalten dieselbe Konto-Zuordnung. Ein neuer Wiederherstellungsstand verhindert, dass alte Offline-Aktionen ungeprüft angewendet werden. Zuordnungsdateien gehören nicht ins Repository.

## Persönliche Nachrichten

Seit 0.26.0 können Crew-Mitglieder mit eigenem Konto miteinander schreiben. Die Tabelle `messages` in `crew.sqlite` ist Teil einer vollständigen Betreiber-Sicherung. Die JSON-Crew-Sicherung in der App und ihr Offline-Cache enthalten keine Nachrichten. Gespräche sind innerhalb der App nur für die beiden Beteiligten zugänglich, jedoch nicht Ende-zu-Ende-verschlüsselt; der Betreiber kann die Datenbank technisch einsehen. Beim Ende einer Crew-Mitgliedschaft werden ihre Gespräche für beide Seiten gelöscht. Vor dem ersten Start einer neuen Version das vollständige Datenvolume sichern; die neue Tabelle wird beim Start automatisch angelegt.

## Vollständige Sicherung und Wiederherstellung

Für ein konsistentes Betreiber-Backup den Server anhalten und das gesamte Datenvolume `putzonaut-data` sichern: `crew.sqlite`, `accounts.sqlite`, gegebenenfalls SQLite-WAL/SHM-Dateien und `photos/`. Zusätzlich `.env` mit dem ursprünglichen `BETTER_AUTH_SECRET` getrennt und sicher aufbewahren. Das Secret schützt auch ausstehende E-Mails; ein unbeabsichtigter Wechsel macht diese unlesbar und bestehende Sitzungen ungültig.

Zur Wiederherstellung bei gestopptem Server das vollständige Volume und die zugehörige Konfiguration zurückspielen, Eigentümer UID/GID 1000 sicherstellen und zunächst mit derselben App-Version in einer isolierten Umgebung starten. Erst nach Prüfung von Anmeldung, Crew, Logbuch und Fotos die produktive Origin wieder verwenden. Keine einzelne Datenbank aus einem anderen Sicherungszeitpunkt beimischen. Sicherungen regelmäßig außerhalb des Servers aufbewahren und ihre Wiederherstellung erproben.

## Getrennte Laufzeit der privaten Testseite

`npm run build` erstellt weiterhin die Sites-Version mit der dortigen Zugangskontrolle. `npm run build:standalone` erstellt die unabhängige App; der Build schlägt fehl, wenn ChatGPT-Anmeldepfade im JavaScript verbleiben. Das Veröffentlichen der privaten Testseite schaltet `app.putzonaut.de` nicht frei.

## Geräteerinnerungen bei geschlossener App

Ab 0.23.0 prüft der laufende Server jede Minute bis zu 30 Geräte im gewählten Stundenfenster. Installationseigene VAPID-Schlüssel werden automatisch in `crew.sqlite` erzeugt und bei Updates/Neustarts beibehalten. Weder zusätzliche Umgebungsvariablen noch Cron- oder ChatGPT-Aufträge sind erforderlich. Das vollständige Backup muss diese Datenbank enthalten. Der private Sites-Endpunkt `/api/push/dispatch` bleibt auf dem eigenen Server gesperrt.

Unter **Profil → Deine Erinnerung → Auch wenn die App geschlossen ist** die Benachrichtigung auf jedem gewünschten Gerät ausdrücklich aktivieren. Bis zu drei Geräte pro Erwachsenenprofil, höchstens ein Versandversuch täglich je Gerät, Berliner Zeit. Es wird nur bei offenen eigenen, freien oder betreuten Kinderaufgaben erinnert; Auszeiten werden berücksichtigt. Ein allgemeiner Hinweis enthält keine Namen oder Aufgabeninhalte. Abgelaufene Geräteanmeldungen werden entfernt; bei unklaren Netzwerkfehlern erfolgt am selben Tag kein zweiter Versuch.

HTTPS und ausgehende HTTPS-Verbindungen zu den Push-Diensten von Apple, Google oder Mozilla sind erforderlich. Auf unterstützten iPhones die App zuerst zum Home-Bildschirm hinzufügen. Auch bei geschlossener App muss der Server laufen; Systemberechtigungen, Energiesparregeln und Erreichbarkeit beeinflussen die tatsächliche Zustellung. Nach einem Domainwechsel Geräte neu aktivieren. Echte Zustellung auf Android und iPhone nach dem Update prüfen.
