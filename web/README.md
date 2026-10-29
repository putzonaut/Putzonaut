# Putzonaut · Web-App 0.2.0

Putzonaut macht Haushaltsaufgaben zu gemeinsamen Missionen. Diese Webversion verwendet echte Crew-Konten und speichert den Fortschritt zentral in Cloudflare D1.

**Web-App:** https://putzonaut-test.denny-subke.chatgpt.site

## Einstieg

Mit ChatGPT anmelden, eigenen Namen und einen Crew-Namen eingeben. Wahlweise werden sechs Aufgaben als bearbeitbare Vorlagen angelegt. Alle Personen beginnen mit 0 Sternen, 0 XP und einer leeren Historie; Belohnungen legt die Familie selbst fest. Die alten Beispieldaten aus der Browser-Demo werden nicht als echte Leistungen übernommen.

Die Website bleibt privat. Eine Crew-Einladung gilt einmalig und sieben Tage. Die eingeladene Person braucht ihr eigenes ChatGPT-Konto **und** eine Freigabe für diese Website. Einladungen innerhalb der App ändern die Website-Freigabe nicht. Einladungen werden nicht automatisch verschickt und können vom Captain widerrufen werden.

## Funktionen

- Eigene Crew, Profilnamen und rollenbasierte Verwaltung.
- Einmalige, tägliche und wöchentliche Missionen; optionale Zuständigkeiten und Fälligkeiten.
- XP, Level, Sterne, dauerhaft freigeschaltete Outfits und gemeinsame Wochenziele.
- Eigene Wünsche, bestätigtes Einlösen und Markieren erfüllter Belohnungen.
- Logbuch mit älteren Einträgen; archivierte Aufgaben behalten ihre bereits vergebenen Punkte und Historie.
- Synchronisierung alle 15 Sekunden, beim Zurückkehren zur App und nach eigenen Änderungen. Offline erfolgen keine bestätigten Änderungen.
- JSON-Export der aktuellen Crew, Profile, Punkte, Aufgaben und Wünsche. Der Export enthält keine ChatGPT-Identitäten oder Einladungsschlüssel. Ein Import in die spätere selbst gehostete Version ist noch gesondert zu implementieren; der Export ist kein vollständiges Datenbankbackup und enthält nicht das gesamte Logbuch.

## Daten und Nebenläufigkeit

Die aktuelle Crew wird als versioniertes JSON-Dokument in D1 gespeichert. `memberships` ordnet die vom Hosting verifizierte Identität genau einer Crew zu. Historieneinträge stehen in einer eigenen, indizierten Tabelle. Konten-IDs und Einladungshashes gelangen nicht in die normalen API-Antworten.

Jede Änderung liest den aktuellen Crewstand, prüft die Berechtigungen erneut und schreibt mittels Vergleich der Revision. Dokument, Punkte und gegebenenfalls Historie werden in einer D1-Transaktion gespeichert. Bei konkurrierenden Änderungen wird erneut gelesen; doppelte Aufgabenabschlüsse und überzogene Kontostände werden abgewiesen. Einlösungen haben zusätzlich eindeutige Anfrageschlüssel. Crew-Gründung und Einladungsannahme speichern Mitgliedschaft und Crew atomar.

Zeitregeln verwenden `Europe/Berlin`; die Woche beginnt montags. Schreibanfragen müssen vom gleichen Ursprung kommen, sind auf 16 KiB begrenzt und werden serverseitig validiert. Persönliche API-Antworten sind nicht cachebar. Die Anmeldung gehört zur Sites-Plattform; es gibt keinen zusätzlichen Passwort- oder Sitzungsspeicher in dieser Webversion.

## Entwicklung und Prüfung

```sh
npm ci
npm test
npm run typecheck
npm run build
```

Die Integrationstests laufen gegen die lokale D1-Implementierung von Miniflare. Sie prüfen Persistenz, konkurrierende Zugriffe, Konto- und Crew-Isolation, Einladungen, Rollen, Punkte, Einlösungen, Kalendergrenzen, Ausrüstung und geschützte Schreibanfragen. Browser-Prüfungen verwenden die vorhandene Sites-Vorschau. Der verwaltete lokale Vorschaumodus simuliert keine ChatGPT-Anmeldung.

Schemaänderungen: `db/schema.ts` bearbeiten und `npm run db:generate` ausführen. Bereits angewendete Migrationen bleiben unverändert. Die Plattform wendet neue Migrationen beim Veröffentlichen an. Produktionsdaten werden nicht bei jedem Start oder Deployment zurückgesetzt.

## Späterer Betrieb

Die Webadresse und das Hosting sind vorläufig. Die vorhandene Docker-/PostgreSQL-Variante im Hauptprojekt ist weiterhin die Grundlage für den späteren Betrieb auf einem eigenen Server. Authentifizierung und Datenübernahme müssen beim Umzug ausdrücklich angepasst werden; Domains oder Tunnel werden durch diese Web-App nicht eingerichtet.
