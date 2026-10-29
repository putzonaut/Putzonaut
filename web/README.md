# Putzonaut · Web-App 0.5.0

Putzonaut macht Haushaltsaufgaben zu gemeinsamen Missionen – für Familien, Paare, WGs und Einzelhaushalte. Jede Crew hat eigene Mitglieder, Aufgaben, Belohnungen und Fortschritte.

**Web-App:** https://putzonaut-test.denny-subke.chatgpt.site

## Einstieg

Die Einrichtung führt durch Haushaltstyp, Crew-Namen und einzeln auswählbare Aufgabenvorlagen. Vor dem Start erscheint eine Zusammenfassung. Alle Profile beginnen mit 0 Sternen, 0 XP und einer leeren Historie. Wochenziel und Belohnungen lassen sich anschließend anpassen. Bestehende Crews aus Version 0.2 behalten ihre Daten.

Einladungslinks oder Codes können vor dem Beitritt geprüft werden. Sie gelten einmalig und sieben Tage. Die Vorschau zeigt nur Crew-Name, Haushaltstyp, Anzahl der Mitglieder und Ablaufdatum. Ein Konto gehört aktuell genau einer aktiven Crew an; jede Crew umfasst höchstens zwölf aktive Profile.

## Crew-Verwaltung

- Ein Captain verwaltet Missionen, Wünsche, Einladungen und Mitglieder.
- Die Captain-Rolle kann an ein anderes aktives Mitglied mit eigenem Konto übertragen werden. Der bisherige Captain bleibt normales Mitglied.
- Mitglieder können austreten; der Captain kann Mitglieder entfernen. Offene Zuständigkeiten werden freigegeben. Bereits erzielte Leistungen, Wochenbeiträge und Logbucheinträge bleiben der bisherigen Crew erhalten. Eine neue Crew beginnt wieder mit null Punkten.
- Kinderprofile benötigen weder E-Mail-Adresse noch eigenes Konto. Das anlegende Mitglied begleitet das Profil; der Captain kann die Begleitung übertragen. Nur diese Begleitperson und der Captain dürfen Aktionen für das Kind ausführen. Missionen, Sterne, Wünsche und Ausrüstung werden dem Kinderprofil zugeordnet; das Logbuch nennt bei Leistungen zusätzlich die Begleitperson.
- Die begleitete Ansicht kennzeichnet das aktive Kinderprofil deutlich und bietet den Rückweg zum eigenen Profil. Sie ist **kein gesperrter Kindermodus und keine eigenständige Kinderanmeldung**. Das Gerät bleibt beim Konto des Erwachsenen angemeldet. Crew-Verwaltung ist in der begleiteten Ansicht serverseitig gesperrt.
- Vor dem Austritt oder Entfernen einer Begleitperson müssen deren aktiven Kinderprofile einer anderen Person zugeordnet werden.
- Der Captain kann eine Crew nach Eingabe ihres Namens schließen. Alle Zugänge enden; die Crew wird archiviert. Die App bietet derzeit keine Wiederherstellung. Schließen und Entfernen sind **keine Datenlöschung**.
- Rollenübergabe, Austritt, Entfernen und Schließen widerrufen offene Einladungen. Neue Einladungen können bei einer aktiven Crew anschließend erstellt werden.

## Weitere Funktionen

- Einmalige, tägliche, wöchentliche und monatliche Missionen; ausgewählte Wochentage und Abstände von 1 bis 12 Wochen.
- Heute, überfällige Missionen, nächste Termine, erledigte Runden und Pausen; Filter für die aktuelle eigene Zuständigkeit und Räume.
- Wöchentlicher Zuständigkeitswechsel, Aufgabenpausen, optionale Freigabe für Kinder und nachvollziehbare Rücknahmen.
- XP, Level, Sterne, dauerhaft freigeschaltete Outfits und gemeinsame Wochenziele.
- Eigene Wünsche, bestätigtes Einlösen und Markieren erfüllter Belohnungen.
- Logbuch mit älteren Einträgen und nachvollziehbaren Änderungen der Crew.
- Synchronisierung alle 15 Sekunden, beim Zurückkehren und nach eigenen Änderungen. Offline werden keine Änderungen bestätigt.
- JSON-Export des aktuellen Crewstands (Format 4) mit Profilen, Punkten, Aufgaben, offenen Freigaben und Wünschen, einschließlich ausgeschiedener Profile. Keine Konten-Identitäten oder Einladungsschlüssel. Dies ist kein vollständiges Datenbankbackup; das gesamte Logbuch ist nicht enthalten. Ein Import ist noch nicht implementiert.

## Raumstation und Motivation in Version 0.5

- Die gemeinsame Raumstation erhält für jede erreichte Zielwoche einen Ausbau: Pflanzenecke, Roboterhelfer, Aussichtskuppel. Eine Woche zählt genau einmal. Änderungen am gemeinsamen Wochenziel gelten ab dem nächsten Montag; der aktuelle Zielwert bleibt bestehen. Rücknahmen korrigieren auch frühere Zielwochen und damit die Station. Frühere Wochen vor Einführung der Station werden nicht rekonstruiert.
- Der Captain verbindet ein bis fünf verfügbare Aufgaben zu einer Wochenquest. Sobald alle einmal in dieser Woche bestätigt wurden, erhält jedes beteiligte Profil genau **20 Bonussterne**, ohne zusätzliche XP oder Missionszählung. Wiederholte Abschlüsse erzeugen keinen weiteren Bonus für dasselbe Profil in derselben Woche. Bestätigungszeitpunkt und Europe/Berlin bestimmen die Woche; eine verspätete Kinderfreigabe zählt in der Freigabewoche.
- Bereits bestätigte, eindeutig zuordenbare Abschlüsse derselben Woche zählen beim Anlegen mit. Nach der ersten Bonusvergabe bleibt die Questauswahl für diese Woche fest. Beim optionalen Neustart am Montag entfallen archivierte, die ganze Woche pausierte oder bereits in früheren Wochen erledigte Runden ohne neue Fälligkeit. Teilweise pausierte Aufgaben bleiben wählbar, wenn eine Runde in der Woche möglich ist.
- Eine Rücknahme berechnet die Quest neu: Wird sie unvollständig, werden ihre Bonussterne bei allen Beteiligten zurückgebucht. Bleibt sie durch andere Abschlüsse vollständig, verliert nur ein nicht mehr beteiligtes Profil seinen Bonus. Erneutes Erfüllen stellt den Bonus wieder her, ohne ihn zu vervielfachen. Bereits eingelöste Wünsche bleiben erhalten; ein negatives Sterneguthaben wird mit späteren Sternen ausgeglichen.
- Jedes Profil kann einen bestehenden Wunsch als Sparziel anheften. Angezeigt wird das aktuelle Sterneguthaben, kein getrenntes Sparkonto. Änderungen am Wunsch aktualisieren das Ziel; Einlösen oder Archivieren entfernt die Verknüpfung. Familien, Paare, WGs und Einzelhaushalte erhalten jeweils passende, vor dem Anlegen editierbare Wunschvorschläge.
- Fünf Pflanzenmissionen schalten den grünen Gartenpilot-Anzug frei; 25 bestätigte Missionen den violetten Nebelläufer. Dazu kommen auswählbare Titel und Abzeichen. Gesamtabschlüsse berücksichtigen bestehende Leistungen; Küchen- und Pflanzenzähler starten mit Version 0.5. Einmal erreichte kosmetische Freischaltungen bleiben auch bei späteren Rücknahmen erhalten.
- Ein persönliches Wochenziel von 1 bis 30 Missionen unterstützt das eigene Tempo, unabhängig vom Crew-Ziel und ohne Extra-Punkte. Beim Erstellen oder Bearbeiten einer Aufgabe schlägt die App XP und Sterne aus Dauer und Aufwand vor. Der Captain übernimmt den Vorschlag ausdrücklich oder setzt eigene Werte.
- Exportformat 4 enthält zusätzlich Wochenfortschritt, Quests, Freischaltungen und Sparziele. Es ersetzt weiterhin kein vollständiges Backup.

## Planung und Punkte seit Version 0.4

- Kalender und Wochenwechsel richten sich nach **Europe/Berlin**. Tägliche Runden beginnen um Mitternacht. „Jede Woche“ ist eine Runde von Montag bis Sonntag. Ausgewählte Wochentage und Wochenabstände sind ab ihrem Termin fällig; Monatsangaben wie der 31. fallen in kürzeren Monaten auf den letzten Tag. Das Startdatum begrenzt neue Serien, bei Wochenrunden auf die Startwoche.
- Pro Aufgabe ist jeweils die jüngste Runde offen. Eine verpasste wiederkehrende Runde bleibt bis zur nächsten Runde überfällig; es entsteht keine unbegrenzte Nachholliste. Einmalige Aufgaben bleiben bis zum Abschluss offen. Bestehende tägliche und wöchentliche Abschlüsse und Punkte bleiben kompatibel; alte optionale Datumsangaben wiederkehrender Aufgaben werden durch deren regulären Rhythmus ersetzt.
- Bei Rotation zählt die Reihenfolge der gewählten Mitglieder. Beginn ist die Woche, in der eine neue Reihenfolge gespeichert wird; danach wechselt die Zuständigkeit jeden Montag, unabhängig davon, ob eine Mission erledigt wurde. Entfernte Profile scheiden aus der Reihenfolge aus. Der Captain kann weiterhin einspringen. „Meine Aufgaben“ zeigt die aktuelle Einteilung, einschließlich der Vorschau für diese Aufgaben.
- Pausen gelten pro Aufgabe, ab einem Datum bis **einschließlich** Enddatum oder bis zur manuellen Fortsetzung. Währenddessen sind Abschlüsse gesperrt. Nach einer Pause startet die nächste reguläre Runde; frühere Runden werden übersprungen. Einmalige Aufgaben bleiben erhalten. Bereits verdiente Punkte werden durch Pausen nicht entfernt.
- Die optionale Kinderfreigabe wird pro Aufgabe aktiviert. Eine Meldung reserviert die Runde, vergibt aber keine Punkte. Begleitperson oder Captain bestätigt oder gibt sie wieder frei; das Kind kann eine offene Meldung zurückziehen. Dazu muss die erwachsene Person in ihr eigenes Profil wechseln. Es handelt sich weiterhin um ein begleitetes Profil auf dem Konto des Erwachsenen. Freigaben zählen zum Wochenziel der **Freigabewoche**. Offene Meldungen älterer Runden bleiben einzeln bearbeitbar; beim Entfernen eines Kinderprofils werden seine offenen Meldungen verworfen.
- Seit Version 0.4 protokollierte Abschlüsse lassen sich im **Profil → Logbuch** zurücknehmen: eigene Abschlüsse, als Begleitperson die des Kindes, als Captain alle. Freigegebene Kinderabschlüsse können nicht aus der Kinderansicht zurückgenommen werden. XP, Sterne und Zähler werden einmalig korrigiert. Eine Rücknahme einer früheren Woche ändert das aktuelle Wochenziel nicht und öffnet keine spätere bereits erledigte Runde erneut.
- Bereits eingelöste Wünsche und freigeschaltete Ausrüstung bleiben erhalten. Nach einer Rücknahme kann ein Sternestand deshalb negativ werden; neue Sterne gleichen ihn aus. Weitere Einlösungen benötigen wieder genügend Guthaben. Alte Logbucheinträge vor 0.4 ohne eindeutige Aufgabenreferenz bleiben lesbar, sind aber nicht rücknehmbar.
- Neue Datenfelder benötigen keine SQL-Migration. Freigaben, Punkte und Logbucheinträge werden zusammen gespeichert; doppelte Rücknahmen sind über einen eindeutigen Ereignisschlüssel abgesichert.

## Entwicklungsstand und öffentliche Nutzung

Die aktuelle Website bleibt eine private Entwicklungsveröffentlichung. Erwachsene melden sich dort über ChatGPT an und benötigen zusätzlich Website-Zugriff. Eine Crew-Einladung ändert diese Freigabe nicht. Einladungen werden nicht automatisch versandt.

Das Produktziel ist eine unabhängig nutzbare Web-App. Eigene Anmeldung ohne ChatGPT, Kontolöschung, Wiederherstellungsverfahren, vollständige Backups, öffentlicher Betrieb und der Umzug auf eine eigene Domain sind noch vor dem öffentlichen Start umzusetzen. Dafür bleibt die Docker-/PostgreSQL-Grundlage im Hauptverzeichnis erhalten; sie enthält noch nicht die neuen Webfunktionen. Ein öffentlicher Zugang wird durch dieses Update nicht eingerichtet.

## Daten und Berechtigungen

Cloudflare D1 speichert versionierte Crew-Dokumente, eine Konto-Zuordnung und ein separates Logbuch. Änderungen prüfen Mitgliedschaft und Berechtigungen nach jedem konkurrierenden Zugriff erneut. Dokument, Punkte, Ereignis und gegebenenfalls das Entfernen der Konto-Zuordnung werden gemeinsam in einer D1-Transaktion geändert. Einmalige Anfrageschlüssel sichern Einlösungen gegen doppelte Belastung.

Der Server bindet eine Änderung an die ursprünglich gelesene Crew und Mitgliedschaft. Ein verspäteter Wiederholungsversuch darf nach Austritt und erneutem Beitritt nicht in eine andere Crew wechseln. Die UI sendet bei Änderungen zusätzlich die erwartete Crew. Das gewählte Kinderprofil ist nur eine Profil-ID, keine Authentifizierung: Jede Anfrage prüft die tatsächliche Konto-Identität und Begleitberechtigung.

Die zusätzlichen JSON-Felder sind abwärtskompatibel. Bestehende Dokumente werden beim Lesen ergänzt; keine SQL-Migration, kein Zurücksetzen der Daten. Bereits angewendete Migrationen bleiben unverändert.

## Entwicklung und Prüfung

```sh
npm ci
npm run typecheck
npm test
npm run build
```

61 automatisierte Prüfungen: 51 Integrationstests gegen Miniflare D1, 8 Kalendertests und 2 Prüfungen für Punktevorschläge und Wunschideen. Sie prüfen Persistenz, Konto- und Crew-Isolation, gleichzeitige Änderungen, Punkte, Einlösungen, Kalendergrenzen, Kinderprofile, Rollenübergabe, Austritt, Widerruf von Zugängen, geschützte Schreibanfragen und Kompatibilität mit bestehenden Crew-Dokumenten. Hinzu kommen Stationsausbau, Questboni bei gleichzeitigen Aktionen, nachträgliche Korrekturen und Wochenwechsel, Sparziele, Freischaltungen, persönliche Ziele, frühe oder pausierte Abschlüsse, Freigaben, Rücknahmen, gleichzeitige Einlösungen, Monatsenden, Schaltjahre, Sommerzeit und Aufgabenwechsel.

Browserprüfungen erfolgen über die verwaltete Vorschau. Der lokale Modus simuliert keine ChatGPT-Anmeldung; Komponentenansichten lassen sich zusätzlich mit ausdrücklich gekennzeichneten, temporären Beispieldaten prüfen. Solche Prüfseiten werden nicht veröffentlicht. Vollständige Anmeldung auf der veröffentlichten Website und reale Android-/iPhone-Geräte bleiben gesonderte Praxistests.
