# Putzonaut 0.13.1 – Wiederaufnahme und Prüfstand

## Tatsächlicher Ausgangsstand

Am 30. Oktober 2026 wurde die bestehende Site mit unveränderter Projektkennung und Freigabe geöffnet. Der Server meldete als jüngsten gespeicherten und erfolgreich veröffentlichten Stand Site-Version 15 mit Commit `4289f029a7f4a2a96e0f95a54a50f3aaacfed7d2`. Die Veröffentlichung wurde am **30.10.2026 um 13:37:09 Uhr Europe/Berlin** bestätigt (12:37:09 UTC). Das zugehörige Repository `main` zeigte denselben Commit, erstellt um 13:34:03 Uhr. Zu Beginn dieser Wiederaufnahme gab es dort keinen neueren gespeicherten Commit oder neuere Site-Veröffentlichung.

`package.json`, Versionsquelle, README, Changelog, Tests und Quellcode belegten bereits App-Version **0.13.0**. Erinnerungen, Offline-Vormerkungen, Übergabe/Tausch, Routinevorschläge und Wochenrückblick waren vollständig eingecheckt; auch `docs/QA-0.13.md` war vorhanden. Nicht eingecheckte Inhalte eines früheren, nicht mehr verfügbaren Arbeitsverzeichnisses lassen sich daraus nicht rekonstruieren. Die vorhandene Historie wurde vollständig erhalten.

Die offenen Punkte waren vor allem weitergehende Oberflächen- und Gerätetests. Die Wiederaufnahme implementiert keine zusätzlich vermuteten Funktionen.

## Gefundene und behobene Fehler

1. **Vorübergehende Abgleichsfehler wurden dauerhaft aussortiert.** Die bisherige Behandlung markierte alle HTTP-Fehler unter 500, einschließlich 401 und 429, als Konflikt. Im isolierten Browserlauf wurde ein einmaliges HTTP 429 reproduziert: Die Vormerkung blieb dauerhaft bei „Bitte prüfen“. Jetzt behalten Netzwerkfehler, 408, 425, 429 und Serverfehler ihren ursprünglichen Anfrageschlüssel und Status. Ein späterer Abgleich kann sie bestätigen. Die Verarbeitung pausiert bei solchen Fehlern, statt weitere Aufträge gegen die gleiche Sperre zu senden.
2. **Anmeldungsablauf.** HTTP 401 sperrt den lokalen Offline-Zugriff, erhält aber die Vormerkungen. Ein frisch bestätigter Login desselben Zugangs erlaubt Wiederholung; Konto-, Crew- und Wiederherstellungsgrenzen werden weiterhin geprüft.
3. **Schmale Ansicht und lange Texte.** Die feste Mindestbreite von 320 CSS-Pixeln erzeugte bei einer 320-Pixel-Ansicht mit reserviertem Scrollbalken horizontales Scrollen. Die Seite passt sich nun der verfügbaren Breite an. Ein langer, ungetrennter Missionsname wurde in einer Tauschanfrage bei 360 Pixeln abgeschnitten (417 Pixel Inhalt bei 313 Pixel Kartenbreite); nach Korrektur sind beide Werte 313 Pixel. Dialogtexte und die Zeiteingabe sind ebenfalls begrenzt.

## Automatisierte Prüfung

Abschlussprüfung für 0.13.1: **212 Tests bestanden, null fehlgeschlagen oder übersprungen**. `npm run typecheck` und der Produktionsbuild über den Sites-Buildhelfer waren erfolgreich. Alle 13 im Offline-Manifest referenzierten Dateien sind vorhanden; Offline-Manifest und Service Worker tragen dieselbe Version 0.13.1. Der isolierte Testaufbau ist nicht im Build enthalten. Der Build meldete lediglich die Verwendung der vorhandenen Proxy-Umgebung, keinen Anwendungsfehler.

Der unveränderte Ausgangsstand bestand alle **201** vorhandenen Tests und die Typprüfung. Hinzu kommen **elf** Regressionstests in `test/offline-sync.test.ts`, die den tatsächlich von der Oberfläche verwendeten Abgleich ausführen:

- Verbindungsabbruch sowie HTTP 408, 425, 429, 500 und 503: Warteschlange unverändert, keine Punkte vor Bestätigung, Batch stoppt, späterer Versuch erfolgreich.
- Abgelaufene Anmeldung: lokaler Zugriff gesperrt, Vormerkungen weiterhin wiederholbar.
- Echter Konflikt: bleibt sichtbar, unabhängiger gültiger Abschluss kann weiterlaufen, konfliktbehafteter Eintrag wird nicht erneut gesendet.
- Konto-, Crew- und Wiederherstellungswechsel: kein Versand unter falschem Kontext.
- Verlorene Erfolgsantwort: Wiederholung mit demselben Schlüssel, Entfernen erst nach Bestätigung.
- Fehler beim lokalen Entfernen: Vormerkung und Schlüssel bleiben für sicheren Wiederholversuch erhalten.

Die bisherigen D1-Integrationstests prüfen weiterhin die tatsächliche atomare Gutschrift, parallele Wiederholungen, Kinderfreigaben, Tauschaktionen, historische Wochenziele, Backups und Zeitumstellungen. Die Service-Worker-Tests prüfen die passende Offline-Version und schließen API- und Anmeldeantworten vom statischen Cache aus.

## Browserprüfung

Die verwaltete Vorschau wurde nach Einrichtung ihres lokalen Ausführungsprofils erfolgreich geöffnet. Die angemeldete Oberfläche wurde mit unveränderten React-Komponenten und ausschließlich synthetischen Daten geprüft. Der Testaufbau ersetzt nur den Netzwerkpartner und liegt außerhalb des Produktionspakets; Produktionsdaten wurden nicht verändert.

- Offline abschließen: zunächst null Sterne, eine Vormerkung; nach Abgleich zehn bestätigte Teststerne, Warteschlange leer.
- Einmalige simulierte HTTP-429-Sperre: keine dauerhafte Konfliktmarkierung, automatische Wiederholung mit anschließender einmaliger Gutschrift.
- Erinnerungsanzeige auf der Basis, Erinnerungseinstellungen und Zeitfeld; Wochenrückblick mit tatsächlichem Vorwochenziel.
- Übernahme-/Tauschdialog, auswählbare Gegenmission, einklappbare Anfrage und lange Missionsnamen; die Zuständigkeit bleibt bis zur Zustimmung bestehen. Die echte Zustimmung und die einmalige Übertragung sind separat durch die D1-Tests belegt.
- Routinevorschlag „Besuch kommt“ mit drei vorhandenen Aufgaben; Auswahl begrenzt weitere Häkchen. Die übrigen Vorschläge und ihre eindeutige Auswahl sind automatisiert abgedeckt.
- Versionsanzeige 0.13.1 ausschließlich im Profil; vier Hauptreiter bleiben erhalten.
- Layout-Viewports von 320, 360, 390 und 430 CSS-Pixeln in Browser-Frames. Basis, Missionsansicht und untersuchte Dialoge ohne horizontale Überbreite; bei 320 Pixeln inklusive Scrollbalken 305 Pixel nutzbare Seitenbreite. Das ist eine Browser-Layoutprüfung, keine native Geräteemulation.

## Verbleibende Grenzen

- **Kein Push bei geschlossener App.** Erinnerungen sind freiwillige Hinweise in der geöffneten, verbundenen App. Es wurde kein Hintergrundversand ergänzt.
- **Android/iPhone und HTTPS-Offline-Neustart offen.** Die HTTP-Vorschau kann den Service Worker nicht installieren. Installation, Browser-Neustart im Flugmodus und Verhalten bei Cache-Verdrängung müssen auf echten Geräten geprüft werden. Der Produktionsbuild erzeugt die generische Offline-Oberfläche; das Worker-Verhalten ist automatisiert geprüft.
- **Echte Mehrgeräte-Nutzung offen.** Die Browserprüfung verwendet Testdaten, keine zwei angemeldeten Produktionskonten. Die serverseitigen Rechte- und Parallelzugriffe sind durch die Integrationstests abgedeckt.
- Bereits unter 0.13.0 als Konflikt gespeicherte Einträge werden nicht automatisch umgedeutet: Ihr alter Datensatz enthält keinen HTTP-Status. Sie bleiben sichtbar und müssen anhand des aktuellen Missionsstands und Logbuchs geprüft werden.

Keine neue SQL-Migration. Die Freischaltschwellen und bereits gespeicherten Crew-Daten bleiben unverändert.
