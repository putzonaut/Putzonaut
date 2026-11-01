# Putzonaut

**Dein Haushalt. Eure Mission.** Haushaltsaufgaben als gemeinsame Missionen für Familien, Paare, WGs und Einzelhaushalte.

## Aktuelle Web-App 0.21.0

[Web-App öffnen](https://putzonaut-test.denny-subke.chatgpt.site) · [Funktionsbeschreibung](web/README.md) · [Änderungen](web/CHANGELOG.md) · [Prüfstand](web/docs/QA-0.21.md) · [GitHub-Abgleich](docs/SYNC-0.20.0.md)

Die aktive Entwicklung liegt in `web/`. Version 0.21.0 ergänzt den vollständigen App-Stand um eigene Putzonaut-Konten und einen eigenständigen Server. Die Versionsnummer steht unten im Profil.

- **Einfach loslegen:** 5, 10 oder 20 Minuten wählen, passende offene Missionen finden und eine Putzrunde starten. 51 anpassbare Vorlagen, Wochenplan, Bereiche, Checklisten, Routinen und Aufgabentausch helfen im Alltag.
- **Flexibel bleiben:** Spontane Aufgaben über „Schon erledigt!“ erfassen und einzelne Aufgabenrunden über „Heute passt nicht“ verschieben. Bestehende Häkchen, Zuständigkeiten und Wiederholungen werden berücksichtigt.
- **Gemeinsam Fortschritte sehen:** bestätigte XP und Sterne, Raumstation, Wochenquests, zwölf Meilensteine, zehn besondere Abzeichen und individuelle Anzüge. Kinderprofile werden ausschließlich durch Erwachsene verwaltet; erforderliche Freigaben bleiben erhalten.
- **Wünsche gestalten:** 24 Wunsch-Symbole, persönliche Sparziele und gemeinsame Crew-Wünsche. Missionen verfügen über 19 Symbole einschließlich Besen, Fenster, Bett, Einkauf und Haustieren.
- **Kleine Erfolgsmomente:** Sterneflug, animiertes Abhaken, passende Putzonaut-Posen, Visier-Wischer und eine dreisekündige Startsequenz. Reduzierte Bewegung wird berücksichtigt.
- **Eingaben bewahren:** Missionsentwürfe, Ansichten und Scrollpositionen bleiben erhalten. Offline-Abschlüsse werden vorgemerkt; Punkte gibt es erst nach bestätigtem Abgleich. Ein Update-Hinweis schützt offene Eingaben, laufende Putzrunden und ungesendete Abschlüsse.
- **Überblick behalten:** Wochenrückblick, persönliche Statistiken und eine Crew-Sicherung mit Vorschau, atomarer Wiederherstellung und Rücksprungpunkt.

Die vier Hauptreiter bleiben Basis, Missionen, Crew und Beute. Erinnerungen in der geöffneten App sind verfügbar. Optionaler Web Push ist vorbereitet und benötigt eine gesonderte Geräteaktivierung sowie die konfigurierte Versandautomatik; der technische Umfang und Betriebszustand sind in [PUSH-OPERATIONS.md](web/docs/PUSH-OPERATIONS.md) beschrieben. Eine Zustellung auf echten Geräten ist gesondert zu prüfen.

Der Abgleich vom 31. Oktober 2026 überträgt alle 218 App-Dateien aus dem veröffentlichten Quellstand `d990867dde56f87812be331b4cebf6b743f7c7f5` unverändert nach `web/`. Alle **298 automatisierten Tests**, die Typprüfung und der Produktions-/Offline-Build waren erfolgreich. Der Dateibaum wurde anhand der Git-Prüfsumme vollständig abgeglichen. Details und verbleibende Geräteprüfungen stehen im [Abgleichprotokoll](docs/SYNC-0.20.0.md).

Die bestehende Testseite bleibt privat und behält ihre Sites-Anmeldung. Für den eigenen Server verwendet die App jetzt E-Mail und Passwort: Registrierung, E-Mail-Bestätigung, Passwort-Reset und dauerhafte Sitzungen. Dort benötigen Nutzer kein ChatGPT. **Installation und Konfiguration: [web/standalone/README.md](web/standalone/README.md).**

Für den neuen Betrieb `web/standalone/compose.yaml` verwenden. Der Start unter `app.putzonaut.de` benötigt noch den tatsächlichen Serveranschluss, HTTPS und einen eingerichteten Mailversand. Bestehende Sites-Daten werden gesondert mit geprüfter Konto-Zuordnung umgezogen; sie werden nicht automatisch anhand einer E-Mail-Adresse übernommen. [Prüfstand 0.21.0](web/docs/QA-0.21.md).

## Frühere Docker-/PostgreSQL-Grundlage (0.1.0)

Die folgenden Angaben betreffen ausschließlich den früheren Stand im Hauptverzeichnis. Die aktuelle Web-App 0.21.0 und ihre neue Docker-Konfiguration liegen in `web/`. Die folgenden alten Startbefehle sind nicht der Einstieg für eine neue Installation.

Die Anwendung umfasst Basis, Missionen, Erfolgsanzeige, Crew, Beute und Avatar. Die Oberfläche verwendet die eigens gestalteten Putzonaut-Illustrationen, selbst gehostete Schriftdateien und echte Bedienelemente.

- Einrichtung eines Haushalts mit eigenem Administratorkonto; weitere Personen treten mit einmaligen, sieben Tage gültigen Einladungen bei.
- Aufgaben erstellen, bearbeiten und archivieren; einmalig, täglich oder wöchentlich. Räume, Dauer und Punkte sind anpassbar.
- Erledigte Aufgaben geben dauerhaft XP und ausgebbare Sterne. Jede Aufgabenrunde kann genau einmal von der Crew abgeschlossen werden.
- Gemeinsames Wochenziel, persönliche Beiträge und letzte Aktivitäten. Änderungen erscheinen über Server-Sent Events bei verbundenen Familienmitgliedern.
- Eigene Belohnungen, nachvollziehbare Einlösungen und Bestätigung erfüllter Wünsche durch die Crewverwaltung.
- Drei Anzüge: Starter, Komet für 300 Sterne und Sonnenheld ab Level 8. Gekaufte Anzüge bleiben dauerhaft freigeschaltet.
- Anmeldung, Passwortänderung, Abmeldung und eine Wiederherstellungsmöglichkeit für den Betreiber.
- PWA-Manifest, Icons und Cache der statischen Oberfläche. Änderungen erfordern eine Verbindung; es gibt noch keine Offline-Warteschlange und keine Push-Erinnerungen.

Ein neues System beginnt mit null XP und null Sternen. Die Daten aus den Screenshotentwürfen sind keine echten Familienkonten.

## Entwicklung der alten Grundlage

Voraussetzung: Node.js 24 oder neuer.

```bash
npm ci
npm run dev
```

Die Entwicklung verwendet eine lokale, persistente PostgreSQL-kompatible PGlite-Datenbank unter `.local/postgres`. Der Einrichtungscode lautet ausschließlich im Entwicklungsmodus `putzonaut-dev`. Diesen Entwicklungsserver nicht öffentlich betreiben. Die Produktionsanwendung erfordert ausdrücklich eine PostgreSQL-Verbindung, eine feste öffentliche Origin und einen eigenen Einrichtungscode.

```bash
npm test
npm run build
```

`test/ui.html` ist eine isolierte Browser-Prüfansicht mit künstlichen Daten im Arbeitsspeicher. Sie verwendet dieselben React-Komponenten, greift nicht auf echte Konten zu und wird nicht in den Produktionsbuild aufgenommen. Authentifizierung, Berechtigungen, Transaktionen und Live-Änderungsereignisse werden separat gegen die Server-API getestet.

## Docker der alten Grundlage

Voraussetzungen: Docker mit Compose; zum Erstellen der Konfiguration lokal Node.js. Den Projektordner auf den Zielrechner übertragen oder aus dem privaten Repository klonen.

```bash
node scripts/configure.mjs --origin https://DEINE-DOMAIN
docker compose up -d --build
```

`configure.mjs` erstellt `.env` mit zufälligen Geheimnissen und überschreibt keine bestehende Konfiguration. Der erste Administrator benötigt den Wert `SETUP_TOKEN` aus dieser Datei. Die Weboberfläche lauscht standardmäßig nur auf `127.0.0.1:3080`. PostgreSQL erhält keinen veröffentlichten Port; seine Daten liegen in einem eigenen Docker-Volume.

Die Origin muss exakt zur tatsächlich verwendeten Adresse passen, einschließlich Port bei HTTP. Hinter Cloudflare wird beispielsweise `APP_ORIGIN=https://DEINE-DOMAIN` gesetzt. Für Zugriff direkt im Heimnetz muss die Bind-Adresse bewusst angepasst werden; siehe [Betrieb](docs/BETRIEB.md). Änderungen an `.env` anschließend mit `docker compose up -d` übernehmen.

## Geprüft und noch offen

Die Tests prüfen unter anderem parallele Aufgabenabschlüsse, einmalige Einladungen, Haushaltsgrenzen, wiederkehrende Aufgaben, atomare Sternenausgaben, wiederholte Einlösungsanfragen, Anzüge, Sitzungswiderruf und Live-Ereignisse. Lokale Tests verwenden PGlite; der vorbereitete GitHub-Workflow verwendet PostgreSQL 17 und baut zusätzlich Docker für amd64 und arm64.

Ein echter Installations- und Update-Test auf Umbrel sowie der Gerätetest auf Android und iPhone stehen noch aus. Diese Version enthält noch kein fertiges Paket für den Umbrel Community Store. Erinnerungen, Offline-Änderungen, Kinderprofile ohne eigene Anmeldung und ein vereinfachter Wiederherstellungsablauf sind nächste Ausbaustufen.

## Aufbau

- `src/`: React/TypeScript-Oberfläche
- `server/`: Node.js/Express, Anmeldung und Transaktionen
- `public/art/`: optimierte Illustrationen; `public/icons/`: Installationsicons
- `test/`: API-Tests und isolierte UI-Prüfansicht
- `compose.yaml` und `Dockerfile`: eigener Betrieb
- `docs/`: Betrieb, Architektur und Versionsnotizen

Der Quellcode enthält keine echten Nutzerdaten oder Zugangsdaten. Datenbanksicherungen sind zusätzlich zum Git-Repository notwendig. Für spätere native Apps ist das gleiche Backend vorgesehen; eine Capacitor-Integration wurde noch nicht hinzugefügt.

