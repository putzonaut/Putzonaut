# Putzonaut 0.8 – Prüfstand

## Automatisiert

118 Tests bestanden: 93 Integrationsfälle mit Miniflare D1 sowie 25 Prüfungen für gemeinsame Regeln und Assets. Die bestehenden 104 Fälle bleiben unverändert erfolgreich; hinzu kommen 14 Fälle in `test/career.test.ts`.

- Migration aus mehr als 50 alten Logbucheinträgen, einschließlich archivierter Missionen und Rücknahmen. Keine Änderung vorhandener XP oder Sterne; wiederholtes Lesen ist stabil.
- Waschonaut, Glanzpilot und Allroundonaut werden nur für bestätigte passende Leistungen freigeschaltet. Keine Verdopplung durch wiederholte oder gleichzeitige Anfragen.
- Kategorien bleiben unabhängig vom Raum und nach einer Kinderaufgabenmeldung unverändert. Änderungen an der Aufgabe oder Archivierung verfälschen spätere Rücknahmen nicht.
- Vier getrennte persönliche Zielwochen zählen ohne Serienpflicht. Änderungen des aktuellen Ziels verändern keine vergangenen Ziele. Historische Korrekturen reduzieren den Zähler; verdiente Anzüge bleiben erhalten.
- Individuelle Zielwahl, automatische Auswahl des nächsten offenen Ziels, korrekte Restmengen und keine Aufforderung zum Teamziel im Einzelhaushalt.
- Sechs Stationserweiterungen an den richtigen Schwellen 1/2/3/5/8/12, auch bei Wochen zwischen den Schwellen und nach vollständigem Ausbau.
- Sicherung/Wiederherstellung der neuen Daten sowie Migration alter 0.7-Sicherungen. Ungültige negative Zähler werden zurückgewiesen.
- Alle zehn Anzüge verweisen auf vorhandene eigenständige Bilddateien.

Typprüfung und Produktionsbuild gehören zur Veröffentlichung. Der abschließende GitHub-Prüflauf muss für denselben veröffentlichten Commit erfolgreich sein.

## Visuell geprüft

Alle fünf neuen Anzüge und die erweiterte Raumstation wurden als Bilder geprüft: Charakter, Stil, Bildausschnitt, Helm-, Abzeichen- und Ausrüstungsdetails sowie die sechs Stationsmodule. Die Masken orientieren sich an den tatsächlichen Positionen im Stationsbild. Prompts und Herkunft stehen in `art-0.8-prompts.md`.

## Noch offen

Die verwaltete Vorschau lief unter der vom System gelieferten Adresse. Der Browser meldete erneut `ERR_CONNECTION_REFUSED`. Es wurde keine andere Browsertechnik oder Umgehung verwendet. Die Oberfläche ist daher noch nicht visuell im Browser abgenommen.

Für Android und iPhone bleiben als praktische Prüfung: Basis mit Zielanzeige, Profil und beide Spindansichten bei schmaler Breite, lange Anzugnamen, Zielwechsel, erstmalige Freischaltung mit „Gleich anziehen“, Kinderfreigabe, neue Stationsstufen und Bedienung mit vergrößerter Schrift. Bestehende Anmeldungs- und Backup-Praxistests aus 0.7 bleiben offen.
