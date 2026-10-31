# Putzonaut 0.17.0 · Prüfstand

Stand: 30. Oktober 2026. Ausgangspunkt: Version 0.16.0, Quellstand `68eefa9c5822f1c1fe9b68841e1e037314b76efc`. Keine Produktionsdaten für Tests verändert.

## Automatisiert

- Vollständige Suite: 266 Tests erfolgreich, 0 fehlgeschlagen. Vorhandene Server-/D1-/R2-Tests einschließlich Teamanteilen, Freigaben, Rücknahmen, Offline-Abgleich und Push bleiben erfolgreich.
- Sechs neue Prüfungen: exakter bestätigter Guthabenzuwachs einschließlich eigenem Questbonus, Ausschluss vorgemerkter/wiederholter/fremder/veralteter Abschlüsse, nur neu freigeschaltete Stationsmodule, frische Tagesstatistik, offene eigene/freie/gemeinsame Aufgaben und Freigaben, Berliner Tageswechsel und Rücknahme der letzten heutigen Mission.
- TypeScript-Typprüfung und Produktionsbuild. Paketversion und generierter Offline-Cache: 0.17.0.

## Browser

Die tatsächlichen React-Komponenten und der bestehende API-Handler wurden gegen isolierte lokale D1-Beispieldaten geprüft. Temporäre, nur im Entwicklungsmodus verfügbare QA-Routen wurden vor dem Produktionsbuild entfernt.

- Bestätigte Abschlüsse aktualisieren Guthaben und XP. Beim Zähleranstieg wurden 180, 181, 182, 183, 184 und 185 Sterne beobachtet; das zugängliche Buttonlabel enthält den bestätigten Gesamtstand.
- Gewöhnlicher Abschluss bleibt in der Missionsliste; ein kurzlebiges Kartenhäkchen und Sterne-Elemente erscheinen. Die verbleibenden Karten erhalten ihren Positionsübergang. Es bleibt genau eine kompakte Erfolgsmeldung; kein doppeltes Feedback bei weiteren Renderdurchläufen.
- Rückgängig öffnet den vorhandenen Dialog, bucht Punkte zurück und öffnet die Mission wieder. Der Tagesabschluss entfällt, solange die Aufgabe erneut offen ist.
- Tagesabschluss zeigt nach drei bestätigten Beispielmissionen genau 3 Missionen, 60 XP und 15 Sterne. Rücknahme und erneuter Abschluss erhöhen diesen Wert nicht doppelt.
- Starter-Putzonaut in Bereitschaft in der Runde, winkende Reaktion nach dem Abschluss und entspannte Pose auf der Tageskarte. Verdiente Anzüge nutzen weiterhin ihre eigenen Bilder.
- Separate Testcrew vor erster Stationsfreischaltung: Abschluss schaltet nur die Pflanzenecke frei. Ein neues Modul wird hervorgehoben, danach ist die Station wieder ruhig. Rücknahme sperrt das Modul korrekt; erneute Bestätigung öffnet die passende Stationsansicht.
- „Kleine Animationen“ im Profil deaktiviert: keine Sterne-/Kartenanimation, sofort korrekter Punktestand und weiterhin erreichbare Bestätigung/Rücknahme. CSS und JavaScript berücksichtigen zusätzlich `prefers-reduced-motion`; laufende Effekte werden beim Verlassen oder Verstecken der Ansicht beendet.
- 320/360/390/430 CSS-Pixel geprüft, jeweils ohne horizontalen Seitenüberlauf; vier Hauptreiter beibehalten. Rundenansicht, kompakte Bestätigung, Station und Tageskarte visuell geprüft.

## Grenzen

Chromium-Vorschau mit schmalen Ansichten, keine physischen Android-/iPhone-Geräte und kein angemeldeter Produktionsdurchlauf. Die Gerätepräferenz für reduzierte Bewegung wurde im Code geprüft; der Browserlauf verwendete die Profileinstellung. Bereits dokumentierte physische Push-Gerätetests bleiben in `QA-0.15.md`; keine Push-Aktivierung, Änderung der Automation oder Testnachricht.
