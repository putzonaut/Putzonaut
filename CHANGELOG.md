# Änderungen

## Web-App 0.21.0 – 1. November 2026

Eigene Putzonaut-Konten mit E-Mail und Passwort, Bestätigungslinks, Passwort-Reset und widerrufbaren Sitzungen. Die aktuelle App kann mit dem neuen Node-/SQLite-Server und Docker eigenständig betrieben werden. SMTP-Versand mit verschlüsselter Warteschlange, sichere explizite Zuordnung alter Konten und zusätzliche Integrationstests.

[Installation](web/standalone/README.md) · [Prüfstand und offene Live-Einrichtung](web/docs/QA-0.21.md). Die private Sites-Version bleibt ein getrennter Betriebsweg.

## Web-App 0.20.0 – 31. Oktober 2026

Der veröffentlichte Web-App-Stand einschließlich aller Änderungen seit 0.13.0 ist vollständig nach `web/` übertragen. Enthalten sind unter anderem 19 Missionssymbole, die dreisekündige Startsequenz, spontane Abschlüsse, das Verschieben einzelner Aufgabenrunden, geschützte App-Updates, Entwürfe, erweiterte Offline-Abläufe und zusätzliche Alltagsfunktionen.

Die App-Version bleibt 0.20.0. [Vollständige Versionshistorie](web/CHANGELOG.md) · [Abgleich und Prüfungen](docs/SYNC-0.20.0.md).

## Frühere Docker-/PostgreSQL-Grundlage 0.1.0 – 29. Oktober 2026

Erster entwickelter Teststand: illustrierte mobile Oberfläche, private Familiencrew, Anmeldung und Einladungen, wiederkehrende Aufgaben, XP und Sterne, Wochenziele, eigene Belohnungen, Anzüge, Live-Aktualisierung sowie Docker-Konfiguration für eigenen Betrieb.

Diese Grundlage liegt weiterhin im Hauptverzeichnis. Sie ist noch nicht mit dem aktuellen Web-App-Funktionsumfang zusammengeführt. Kein App-Store-Release und noch kein Umbrel-Store-Paket.
