# Putzonaut

**Dein Haushalt. Eure Mission.** Haushaltsaufgaben als gemeinsame Missionen für Familien, Paare, WGs und Einzelhaushalte.

## Aktuelle Web-App 0.9.0

[Web-App öffnen](https://putzonaut-test.denny-subke.chatgpt.site) · [Funktionsbeschreibung](web/README.md) · [Änderungen](web/CHANGELOG.md) · [Prüfstand](web/docs/QA-0.9.md)

Die aktive Entwicklung liegt in `web/`. Die App stellt den nächsten kleinen Einsatz in den Mittelpunkt: 5, 10 oder 20 Minuten wählen, eine passende offene Mission finden und loslegen. Die Vorlagenbibliothek umfasst 45 anpassbare Tätigkeiten in sieben Kategorien; beim Einrichten bleibt die Auswahl auf sechs Startervorlagen beschränkt.

Version 0.9 bietet 19 Erfolge mit sieben neu illustrierten Abzeichen, zehn individuell illustrierte Anzüge und sechs Stationsausbauten. Franz Beckenkehrer, Kehrminator, Jürgen Cleansman, Helene Wischer, George Cleaney, Otto von Wischmark und Roberto Blanko belohnen bestätigte Leistungen. Abzeichen lassen sich direkt tragen. Je Haushaltsart gibt es jetzt 16 anpassbare Wunschideen mit Suche und Sternefilter. [Abzeichengalerie und Prompts](web/docs/art-0.9-prompts.md). Die Basis zeigt genau ein nächstes Ziel. Der Spind trennt eigene Anzüge und noch erreichbare Belohnungen; zunächst sind nur drei nächste Meilensteine sichtbar. Bestätigte historische Leistungen zählen soweit belegbar mit, persönliche Zielwochen werden ab 0.8 gespeichert und dürfen durch Pausen getrennt sein.

Integriert ist eine vollständige Crew-Sicherung einschließlich Logbuch, mit geprüfter Vorschau, atomarer Wiederherstellung und automatischem Rücksprungpunkt. Sie funktioniert in derselben bestehenden Crew bei unveränderten Mitgliedern und Berechtigungen. Konten- und Betreiber-Backups bleiben ein gesonderter Schritt vor der öffentlichen Beta. Die vollständigen Grenzen stehen in der Web-Dokumentation.

Wochenplan, Bereiche, Checklisten, Rotation, begleitete Kinderprofile, Freigaben, Rücknahmen, Raumstation, Wochenquests und Belohnungen bleiben integriert. Version 0.6.1 mit dem begrenzten Profilbild und der Versionsnummer ausschließlich unten im Profil ist ebenfalls enthalten. 130 automatisierte Tests prüfen die Anwendung; die visuelle Prüfung der Oberfläche von 0.9 und echte Android-/iPhone-Tests stehen noch aus, weil die bereitgestellte Browser-Vorschau nicht erreichbar war.

Die Website bleibt privat und verwendet weiterhin ChatGPT zur Anmeldung. Eine Crew-Einladung ersetzt die Website-Freigabe nicht. Unabhängige Anmeldung, Kontoverwaltung und öffentlicher Start folgen als nächste Phase; Domain, eigener Server und native Apps später.

## Frühere Docker-/PostgreSQL-Grundlage (0.1.0)

Die folgenden Angaben betreffen ausschließlich den früheren Stand im Hauptverzeichnis. Die aktuelle Web-App 0.9 wird in `web/` entwickelt. Der spätere Umzug ist noch nicht abgeschlossen.

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

## Entwicklung

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

## Eigener Server mit Docker

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

