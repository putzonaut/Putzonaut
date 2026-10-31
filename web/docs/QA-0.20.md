# Putzonaut 0.20.0 · Prüfstand

Stand: 31. Oktober 2026. Ausgangspunkt: 0.19.4, Quellstand `60b96cb15c978ad1cdf5f4925643c3ff03ac5a27`.

## Umfang

Spontane Abschlüsse, Verschieben einzelner Aufgabenrunden und ein bewusst auslösbarer Update-Hinweis. Bestehende Punkteempfehlungen, Freischaltungen, Kinderverwaltung, Hauptnavigation und die dreisekündige Startanimation bleiben erhalten. Das optionale Verschiebungsfeld liegt im bestehenden Crew-Dokument; eine SQL-Migration ist nicht erforderlich. Backups akzeptieren das zusätzliche Feld, ältere Backups bleiben lesbar.

## Automatisierte Absicherung

Der erste vollständige Durchlauf bestand mit 296 Tests. Die anschließende Codeprüfung ergänzte einen Test für das Verschieben einer späteren Runde bei „X Tage nach Erledigung“ und korrigierte die Unterscheidung zwischen vorherigem und nachfolgendem Abschluss. Danach bestanden alle 33 gezielten Kalender-, API-, Update- und Worker-Tests. Der abschließende vollständige Durchlauf bestand mit **297 Tests, 0 Fehlern, 0 übersprungenen Tests** in 168 Sekunden. Die Typprüfung war erfolgreich. Zusätzlich wurden Netzwerkfehler, ungültige JSON-Antworten, HTTP-Fehler und eine erfolgreiche Versionsantwort gezielt geprüft; Ladefehler zeigen eine verständliche Meldung.

Geprüfte Fälle:

- Fünf konkurrierende identische spontane Erfassungen erzeugen genau eine Aufgabe, einen Abschluss und eine Punktegutschrift. Geänderte Nutzlast bei gleicher Anfragekennung wird abgelehnt. Wiederholen nach Rücknahme vergibt keine neuen Punkte.
- Standardpunkte werden auf dem Server berechnet. Fremde Profile, nicht berechtigte Begleitpersonen, fremde Bereiche, zusätzliche Punktefelder, ungültige Dauer und Auszeiten werden abgewiesen. Gleichnamige offene eigene/freie Aufgaben verhindern das Umgehen der vorhandenen Checkliste.
- Spontane Kinderaufgaben erhalten erst nach Freigabe Punkte. Der erfassende Erwachsene ist protokolliert; konkurrierende Freigaben werden einmal gebucht.
- Tägliche, wöchentliche, monatliche, ausgewählte Wochentage und feste Wochenabstände behalten ihren Rhythmus. Termine bis einschließlich des Verschiebungsziels werden zusammengefasst; die ursprüngliche Rundennummer verhindert zusätzliche Abschlüsse. Wochen-/Monats-/Jahresgrenzen und Monatsende sind abgedeckt.
- Einmalige Aufgaben bleiben nach dem neuen Termin offen. Bei Abständen nach Erledigung beginnt der nächste Abstand erst mit dem tatsächlichen bestätigten Abschluss. Auch spätere Runden mit gespeichertem vorherigen Abschluss sind verschiebbar. Rücknahme öffnet die korrekte Runde wieder.
- Fremdzuständigkeit, gleichzeitiges Verschieben, Teamaufgaben, bereits gemeldete Abschlüsse, Pause am Zieltag und ungültige Termine werden abgewiesen. Verschieben erhöht die Aufgabenrevision; alte Offline-Vormerkungen können nicht mehr buchen.
- Zuständigkeit über einen Rotationswechsel und bereits gesetzte Häkchen bleiben erhalten. Ein tatsächlich exportiertes Backup mit spontaner und verschobener Aufgabe wird wieder eingelesen.
- Update-Erkennung vergleicht Versionsnummern numerisch und lehnt ungültige, alte oder fremde Versionsdateien ab. Formulare, Putzrunde, Offline-Zustand, Schreibvorgänge und offene Vormerkungen blockieren den Neustart; nach Netzwerkwartezeiten werden die Sperren erneut geprüft.
- Ein neuer Service Worker aktiviert sich nicht bei der Installation. Nur eine ausdrückliche Nachricht derselben Origin für seine Version aktiviert ihn. Alte Putzonaut-Caches bleiben bei offenen Tabs erhalten; ein alter Tab kann bereits gecachte Dateien mit altem Hash weiter laden. API-, Anmelde- und Versionsantworten werden nicht in diesen statischen Cache aufgenommen.

## Browserprüfung

Chromium mit den tatsächlichen Komponenten `AppLaunch`, `App`, `RecordMissionForm`, `PostponeMissionForm` und `AppUpdate`. Eine ausschließlich lokale Entwicklungsroute leitete Requests an die reale API mit einem synthetischen Testkonto und lokaler D1-Datenbank. Nur die Versionsdatei wurde für den Update-Hinweis simuliert. Diese Prüfrouten wurden vor dem Produktionsbuild entfernt; produktive Crew-Daten wurden nicht verwendet.

- 390 × 844, 320 × 640 und 390 × 460 CSS-Pixel: neue Formulare ohne horizontalen Überlauf. Schließen 44 × 44 Pixel, Aufwandswahl mindestens 44 Pixel hoch, Speicheraktion mindestens 48 Pixel hoch. Bei 458 Pixel nutzbarer Höhe lagen Eingabefeld und Speichern innerhalb des sichtbaren Dialogs; die übrigen Inhalte bleiben scrollbar.
- Gleichnamige offene Aufgabe im spontanen Formular erkannt, Speichern gesperrt, vorhandene Mission erreichbar. Währenddessen bleibt „Jetzt aktualisieren“ deaktiviert und erklärt den Grund.
- „Kühlschrank auswischen“, 15 Minuten, normal, Küche: einmalig gespeichert, 60 XP und 20 Sterne gutgeschrieben, vorhandene Erfolgsmeldung und Crew-Fortschritt aktualisiert.
- „Müll rausbringen“ vom 31. Oktober auf den 2. November verschoben: aus „Jetzt offen“ entfernt, in „Demnächst“ vorhanden, Details zeigen „Verschoben auf: 02. Nov.“. Keine Punkte durch das Verschieben. Eigenes Datum per nativer Tastatureingabe gewählt.
- Für Mila „Bücherregal aufräumen“ gemeldet: Freigabehinweis, zunächst 0 Sterne, Meldung unter „Noch bestätigen“. Nach Bestätigung durch Alex: 15 Sterne ausschließlich im Kinderprofil; Meldung aus der Freigabeliste entfernt.
- Laufende Putzrunde sperrt Aktualisieren mit verständlichem Hinweis. Während des Beendens gilt die Schreibsperre; danach wird Aktualisieren wieder möglich. Klick startet die App neu, gespeicherte Punkte und Termine bleiben erhalten. „Später“ blendet den Hinweis aus; interner Seitenwechsel lässt ihn ausgeblendet.
- Profil zeigt Version 0.20.0. Keine neuen Anwendungsfehler in der getesteten Browsersequenz; ältere Entwicklungs-/Browsererweiterungslogs wurden nicht als App-Fehler gewertet.

![Spontane Erfassung in der lokalen mobilen Prüfung](qa-0.20-form.jpg)

## Grenzen

Produktions- und Offline-Build erfolgreich erstellt. Die Versionsdatei und der gebaute Worker enthalten 0.20.0; sämtliche im Offline-Manifest genannten Dateien sind vorhanden. Temporäre Prüfrouten sind aus dem App-Verzeichnis entfernt. Der Quellstand wird zusammen mit diesem Build veröffentlicht.

Keine physischen Android-/iPhone-Geräte. Die geringe Fensterhöhe prüft die Erreichbarkeit bei wenig Platz, ersetzt aber keinen Test der jeweiligen Bildschirmtastatur. Kein angemeldeter Produktionsdurchlauf und kein echter Versionswechsel einer installierten PWA auf mehreren physischen Geräten. Worker-Lebenszyklus, Cache-Erhalt und konkurrierende Änderungen wurden automatisiert geprüft; die sichtbare Update-Bedienung im Browser verwendete eine simulierte neuere Versionsdatei.

Die Lifecycle-Entscheidung folgt der offiziellen Dokumentation: [MDN: waiting](https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorkerRegistration/waiting), [MDN: skipWaiting](https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorkerGlobalScope/skipWaiting), [Service worker lifecycle](https://web.dev/articles/service-worker-lifecycle). Andere Tabs werden bewusst nicht automatisch neu geladen. Alte Dateien können nur dann aus dem Cache nachgeladen werden, wenn sie zuvor bereits dort gespeichert wurden.

## Nachtrag: mehr Missionssymbole, weiterhin 0.20.0

Zwölf neue Motive ergänzen die sieben bisherigen Symbole: Besen, Sprühflasche, Fenster, Bett, Sofa, Kühlschrank, Kochen, Einkauf, Haustiere, Dusche, Toilette und Werkzeug. Auswahl, API und Kategoriezuordnung verwenden gemeinsame Symbolkennungen. Eine ausdrücklich gewählte Kategorie hat weiterhin Vorrang; bestehende Aufgaben werden nicht umgeschrieben.

- 41 gezielte Tests für API, Karriere/Kategorien, Offline-Worker und Missionsdarstellung/-planung erfolgreich. Der zusätzliche Integrationstest legt alle 19 Symbole über die API an, prüft Bearbeitung, Abschluss und einen tatsächlichen Backup-Export mit erneutem Einlesen. Unbekannte Kennungen werden abgelehnt; reine Symbolwahl vergibt keine Punkte.
- Typprüfung und Produktions-/Offline-Build erfolgreich. Paket, Lockdatei, sichtbare App-Version und Versionsmanifest bleiben 0.20.0. Ein aus den Offline-Dateinamen berechneter Hash unterscheidet den Cache auch bei Ergänzungen innerhalb derselben Version. Gebauter Cache-Hash und sämtliche Offline-Dateien wurden geprüft.
- Browserprüfung mit dem tatsächlichen Missionsformular und Missionseinträgen in einer temporären lokalen Entwicklungsroute: alle 19 Auswahloptionen vorhanden, alle 19 SVG-Motive gerendert. Haustiersymbol ausgewählt, Formulareingabe übernommen und beim erneuten Bearbeiten korrekt vorbelegt. Bei 320 Pixel Breite kein horizontaler Überlauf des vollständigen Dialoglayouts. Prüfrouten vor dem Build entfernt; keine produktiven Aufgaben angelegt.
- Die vorherige vollständige 297-Test-Suite bleibt der Basisprüfstand; für diesen begrenzten Nachtrag wurden die betroffenen 41 Tests erneut ausgeführt. Keine physischen Gerätetests.
