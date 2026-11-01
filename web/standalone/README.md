# Putzonaut mit eigenen Konten · 0.21.0

Die aktuelle App aus `web/` läuft als eigenständiger Node-Server mit E-Mail und Passwort. Nutzer benötigen dafür weder ChatGPT noch GitHub. Oberfläche, Missionen, Crew, Kinderprofile, Punkte, Fotos und Offline-Funktionen verwenden denselben Anwendungscode wie die private Sites-Version.

## Start auf einem eigenen Server

Voraussetzung: Docker mit Compose und ein HTTPS-Reverse-Proxy. Dies ist eine normale Docker-Anwendung, noch kein Paket für den Umbrel App Store.

```sh
cd web/standalone
cp .env.example .env
chmod 600 .env
# .env mit APP_ORIGIN, dauerhaftem zufälligem Secret und SMTP-Zugang ausfüllen.
docker compose up -d --build
docker compose ps
```

Ein Secret erzeugen:

```sh
node -e "console.log(require('node:crypto').randomBytes(48).toString('base64url'))"
```

Der Reverse-Proxy leitet `https://app.putzonaut.de` an `127.0.0.1:3080` weiter. DNS, Zertifikat und die konkrete Verbindung zu Umbrel müssen beim Betreiber eingerichtet werden. Der Containerport ist absichtlich nur am Loopback-Interface veröffentlicht. Bei einem Proxy in einem anderen Container ist ein gemeinsames privates Docker-Netz nötig; der interne App-Port darf nicht direkt aus dem Internet erreichbar sein. Im Proxy müssen mindestens 9 MB Request-Body erlaubt sein, damit Crew-Sicherungen importiert werden können.

`APP_ORIGIN` ist die genaue öffentliche HTTPS-Origin ohne abschließenden Schrägstrich. Host- und Forwarded-Header bestimmen weder die Origin noch die Identität. Für lokale Entwicklung ist HTTP ausschließlich für localhost erlaubt. Standardmäßig gilt die tatsächliche Socket-IP als Client-IP. Nur wenn `TRUSTED_PROXY_IPS` exakt die verbindenden Proxy-Adressen enthält, wird dessen einzelner `X-Real-IP`-Wert akzeptiert. Der Proxy muss diesen Header überschreiben. Keine pauschalen privaten Netze freigeben.

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
- Selbstbedienung für Kontolöschung und Änderung der Login-E-Mail ist in dieser Version noch nicht angeboten. Crew verlassen/schließen und Profilnamen ändern bleiben verfügbar.

## Bestehende Testdaten übernehmen

Eine neue Installation ist leer. Es werden keine bestehenden Sites-Daten gelöscht, keine Konten anhand gleicher Namen oder E-Mail-Adressen automatisch verknüpft und keine fremden Crews übernommen.

Vor einer tatsächlichen Migration ist ein vollständiger, vom Betreiber geprüfter Export der Sites-Datenbank **einschließlich der internen Mitgliedschaften** und der privaten Fotos erforderlich. Der normale Crew-Export enthält diese Identitäten bewusst nicht und ersetzt keine Plattformmigration. Eine allgemeine D1-/R2-Importautomatik ist hier noch nicht enthalten. Der Export und seine Überführung in die lokale Datenbank werden als eigener, geprüfter Umzug durchgeführt.

Nach diesem Datentransfer werden neue Putzonaut-Konten registriert und verifiziert. Der Betreiber prüft die Zugehörigkeit jedes alten Kontos und erstellt ausdrücklich eine Zuordnungsdatei:

```json
[{"oldAccountId":"geprüfte-alte-konto-id","newEmail":"bestaetigtes-konto@example.org"}]
```

Der Server wird angehalten und eine vollständige Sicherung angelegt. Im Ordner `web/` zeigt `node standalone/map-accounts.ts /sicherer/pfad/zuordnung.json` zunächst nur die Vorschau. Erst der zusätzliche Parameter `--apply` schreibt die Zuordnung atomar. Bei Docker kann der Befehl in einem einmaligen Container mit demselben Datenvolume ausgeführt werden. `DATA_DIR` muss auf das übernommene Datenverzeichnis zeigen.

Das Werkzeug verlangt bestätigte, noch nicht einer Crew zugeordnete Zielkonten sowie aktive erwachsene Altprofile. Bei einem Fehler wird nichts übertragen. Crew- und Profil-IDs, Punkte und Logbuch bleiben erhalten; vorhandene Rücksprungpunkte erhalten dieselbe Konto-Zuordnung. Ein neuer Wiederherstellungsstand verhindert, dass alte Offline-Aktionen ungeprüft angewendet werden. Zuordnungsdateien gehören nicht ins Repository.

## Vollständige Sicherung und Wiederherstellung

Für ein konsistentes Betreiber-Backup den Server anhalten und das gesamte Datenvolume `putzonaut-data` sichern: `crew.sqlite`, `accounts.sqlite`, gegebenenfalls SQLite-WAL/SHM-Dateien und `photos/`. Zusätzlich `.env` mit dem ursprünglichen `BETTER_AUTH_SECRET` getrennt und sicher aufbewahren. Das Secret schützt auch ausstehende E-Mails; ein unbeabsichtigter Wechsel macht diese unlesbar und bestehende Sitzungen ungültig.

Zur Wiederherstellung bei gestopptem Server das vollständige Volume und die zugehörige Konfiguration zurückspielen, Eigentümer UID/GID 1000 sicherstellen und zunächst mit derselben App-Version in einer isolierten Umgebung starten. Erst nach Prüfung von Anmeldung, Crew, Logbuch und Fotos die produktive Origin wieder verwenden. Keine einzelne Datenbank aus einem anderen Sicherungszeitpunkt beimischen. Sicherungen regelmäßig außerhalb des Servers aufbewahren und ihre Wiederherstellung erproben.

## Getrennte Laufzeit der privaten Testseite

`npm run build` erstellt weiterhin die Sites-Version mit der dortigen Zugangskontrolle. `npm run build:standalone` erstellt die unabhängige App; der Build schlägt fehl, wenn ChatGPT-Anmeldepfade im JavaScript verbleiben. Das Veröffentlichen der privaten Testseite schaltet `app.putzonaut.de` nicht frei.

Der private Sites-Endpunkt für den Push-Versand ist auf dem eigenen Server ausdrücklich gesperrt. Die Erinnerungen in der geöffneten App bleiben verfügbar; Web Push benötigt noch einen eigenen geschützten Scheduler und eine Geräteprüfung für die neue Origin. Ohne diese Einrichtung wird Push als nicht konfiguriert angezeigt.
