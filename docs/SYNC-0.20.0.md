# GitHub-Abgleich · Putzonaut 0.20.0

Stand: 31. Oktober 2026.

## Übertragener Stand

- Ausgangspunkt auf GitHub: `92c5670e9d51232d1e92ab86f545874470fb28a1`, Web-App 0.13.0.
- Veröffentlichte Site-Quelle: `d990867dde56f87812be331b4cebf6b743f7c7f5`, App-Version 0.20.0.
- Veröffentlichung des Quellstands: 31. Oktober 2026, 23:31 Uhr Europe/Berlin.
- Alle 218 versionierten Dateien der Site liegen unverändert unter `web/`: 57 neue und 55 geänderte Dateien gegenüber GitHub, keine entfernten Dateien.
- Git-Tree-Prüfsumme des vollständigen `web/`-Ordners: `10ed29e8eabb40892eb78fe4796102f9b924ff1e`. Sie entspricht exakt dem Quellbaum der veröffentlichten Site, einschließlich Dateipfaden, Dateimodi und Inhalten.
- Die bisherige GitHub-Historie sowie die frühere Docker-/PostgreSQL-Grundlage bleiben erhalten. Die Übersicht und das Changelog im Hauptverzeichnis verweisen nun auf den aktuellen Web-Stand.

## Erneut ausgeführte Prüfungen

| Prüfung | Ergebnis |
| --- | --- |
| Vollständige Web-Testsuite (`npm test`) | 298 erfolgreich; 0 Fehler, 0 übersprungen, 0 abgebrochen; Laufzeit rund 188 Sekunden |
| Typprüfung (`npm run typecheck`) | Erfolgreich |
| Produktionsbuild mit dem bestehenden Sites-Buildworkflow | Erfolgreich |
| Separater Offline-Build | Erfolgreich; alle 13 aufgeführten Offline-Dateien vorhanden |
| Versionskonsistenz | Paket, Lockdatei, Versionsmanifest und Offline-Manifest enthalten 0.20.0 |
| Neue Putzonaut-Posen | Asset im Quellstand und im Build vorhanden und bytegleich |
| Service Worker | Versions- und Build-Platzhalter ersetzt |
| Quellstand nach allen Prüfungen | Unverändert; sauberer Git-Arbeitsbaum |
| Übertragung aller App-Dateien | Git-Tree-Prüfsumme stimmt vollständig mit der Site-Quelle überein |

Die vollständige Suite enthält auch den letzten Symbol-Nachtrag. Sie prüft unter anderem alle 19 Symbolkennungen, reale API-Abschlüsse und Backups, Kalendergrenzen, Kinderfreigaben, Konkurrenzfälle, Punktebuchungen, Offline-Abgleich und Update-/Cache-Regeln. Für den gesamten Versionsumfang gelten zusätzlich die detaillierten Prüfberichte in `web/docs/QA-*.md`.

## GitHub und Grenzen

Die vorhandenen GitHub-Workflows prüfen nach dem Push den aktuellen Commit: Web-App (Typen, Tests, Build), die frühere PostgreSQL-Anwendung und deren Docker-Build für amd64/arm64. Ihr jeweils tatsächlicher Status ist unter [GitHub Actions](https://github.com/putzonaut/putzonaut/actions) einsehbar.

Dieser Abgleich verändert die veröffentlichte Anwendung und produktive Crew-Daten nicht. Keine zusätzlichen Geräteanmeldungen, Versandaufträge oder Datenbankänderungen werden durch die Quellcodeübertragung ausgeführt. Ein erneuter physischer Android-/iPhone-Test, ein angemeldeter Produktionsdurchlauf und ein echter PWA-Versionswechsel über mehrere Geräte sind durch diesen Abgleich nicht belegt; die Grenzen der bisherigen Browserprüfungen stehen in `web/docs/QA-0.20.md`.

Der Docker-Stand im Hauptverzeichnis bleibt ausdrücklich die frühere Version 0.1.0. Der Transfer nach GitHub macht daraus noch keine eigenständig gehostete Version 0.20.0.

## Repository-Umzug · 1. November 2026

Das Repository liegt nun privat unter [putzonaut/putzonaut](https://github.com/putzonaut/putzonaut). Es wurde als bestehendes Repository übertragen; seine ID `1438875766`, die 15 vorhandenen Commits und der Hauptzweig blieben erhalten. Unmittelbar nach dem Eigentümerwechsel stand `main` unverändert auf `e60f2bc8af7e1a7c5770cc149cd0a88d176556fc`; der vollständige Quellbaum entsprach weiterhin `7bf77ca4970508c64354e5f61ad291b5a2a6497a`. Insbesondere sind sämtliche 218 App-Dateien und die oben dokumentierte `web/`-Prüfsumme unverändert.

Die alte Repository-Adresse leitet zum neuen Standort weiter. `dennysubke` bleibt als Mitarbeiter mit Schreibzugriff eingebunden. Der ChatGPT Codex Connector ist im Putzonaut-Konto ausschließlich für dieses Repository freigegeben. Die bestehende Workflow-Historie wurde übernommen. Die App-Version bleibt 0.20.0.
