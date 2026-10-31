# Putzonaut 0.16.0 · Prüfstand

Stand: 30. Oktober 2026. Ausgangspunkt: veröffentlichte Version 0.15.0, Quellstand `685feea5b122f53d51cbadd2c0a4ee802fcb3afb`. Keine Produktionsdaten für Tests verändert.

## Automatisiert

- Vollständige Suite: 260 erfolgreich, 0 fehlgeschlagen. Bestehende D1-/R2-Integrationstests einschließlich Punktebuchung, Rücknahmen, Offline-Abgleich, Profilgrenzen, Pausen und Push bleiben erfolgreich.
- Sechs neue Prüfungen sichern den direkten Abschluss eigener/freier Aufgaben, den Ausschluss von Checklisten/gemeinsamen/fremd zugeteilten Missionen, die sortierte Fälligkeitsliste ohne Datenmutation, gewöhnliche Abschlüsse gegenüber echten Meilensteinen, Profil-/Crew-/Wiederherstellungsgrenzen und gültige gespeicherte Rundendauern.
- TypeScript-Typprüfung und Produktionsbuild. Paketversion und daraus generierter Offline-Cache: 0.16.0.

## Browser

Geprüft wurden die echten React-Komponenten und der bestehende API-Handler gegen eine isolierte lokale D1-Datenbank im verwalteten Preview. Eine synthetische Prüfcrew mit zwei Erwachsenen hatte eigene Beispielmissionen. Die temporären QA-Routen und Testidentitäten wurden vor dem Produktionsbuild entfernt.

- 5/10/20-Minuten-Auswahl sofort sichtbar, Zusatzmodi zunächst eingeklappt. „Wenig Energie“ begrenzt die Auswahl auf 5/10 Minuten. Gewählte Dauer nach Wechsel der Ansicht und erneutem Laden erhalten.
- Überfällige und heutige Missionen zusammen; überfällige zuerst. Eigene/freie einfache Missionen direkt abhackbar; fremde Zuständigkeit und Checklisten ohne Direktabschluss.
- Direkter Abschluss bleibt in der Missionsliste, verbucht die tatsächlichen Sterne/XP und zeigt die kompakte Meldung. Rücknahme über bestehenden Bestätigungsdialog bucht Punkte zurück und öffnet die Mission wieder. Freiwillige Zeitrückmeldung erreichbar.
- Bestehende Mission umbenannt und mit eingeklappten Optionen gespeichert: eigene 20 XP/5 Sterne, 15 Minuten, zwei Schritte, 14-Tage-Rhythmus und Notiz erhalten. Abschluss erst nach beiden Schritten möglich.
- Neue Mission nur mit Hauptangaben angelegt. Änderung von 10 auf 5 Minuten aktualisiert die bestehende Punkteempfehlung von 40 XP/15 Sternen auf 20 XP/5 Sterne. Gespeicherte Aufgabe korrekt in der Liste.
- Leerer Pflicht-Teilschritt bei eingeklappten Optionen öffnet den Bereich automatisch und erhält den Eingabefokus.
- Putzrunde gestartet und Mission abgeschlossen: Rückkehr in dieselbe Runde mit aktualisiertem Fortschritt und kompakter Bestätigung.
- Separater Teststand vor Levelgrenze: bestätigter Abschluss öffnet „Level 3 erreicht!“ mit korrekt neuem Fortschritt 15/500 XP.
- Missionsliste und erweitertes Formular bei 320, 360, 390 und 430 CSS-Pixeln ohne horizontalen Seitenüberlauf. Kompakte Meldung, Basis und große Feieransicht bei 320 Pixeln visuell geprüft. Hauptreiter bleiben vier; Touchfläche für direkten Abschluss mindestens 44 Pixel.

## Grenzen

Die Browserprüfung nutzt Chromium mit schmalen Ansichten, keine physischen Android-/iPhone-Geräte und keinen angemeldeten Produktionsdurchlauf. Push-Zustellung und Betriebseinstellungen wurden für dieses reine Oberflächenupdate nicht verändert. Die weiterhin offenen physischen Gerätetests sind in `QA-0.15.md` dokumentiert.
