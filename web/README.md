# Putzonaut · Web-App 0.3.0

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

- Einmalige, tägliche und wöchentliche Missionen, Zuständigkeiten und optionale Fälligkeiten.
- XP, Level, Sterne, dauerhaft freigeschaltete Outfits und gemeinsame Wochenziele.
- Eigene Wünsche, bestätigtes Einlösen und Markieren erfüllter Belohnungen.
- Logbuch mit älteren Einträgen und nachvollziehbaren Änderungen der Crew.
- Synchronisierung alle 15 Sekunden, beim Zurückkehren und nach eigenen Änderungen. Offline werden keine Änderungen bestätigt.
- JSON-Export des aktuellen Crewstands (Format 2) mit Profilen, Punkten, Aufgaben und Wünschen, einschließlich ausgeschiedener Profile. Keine Konten-Identitäten oder Einladungsschlüssel. Dies ist kein vollständiges Datenbankbackup; das gesamte Logbuch ist nicht enthalten. Ein Import ist noch nicht implementiert.

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

24 Integrationstests laufen gegen Miniflare D1. Sie prüfen Persistenz, Konto- und Crew-Isolation, gleichzeitige Änderungen, Punkte, Einlösungen, Kalendergrenzen, Kinderprofile, Rollenübergabe, Austritt, Widerruf von Zugängen, geschützte Schreibanfragen und Kompatibilität mit Version 0.2.

Browserprüfungen erfolgen über die verwaltete Vorschau. Der lokale Modus simuliert keine ChatGPT-Anmeldung; Komponentenansichten lassen sich zusätzlich mit ausdrücklich gekennzeichneten, temporären Beispieldaten prüfen. Solche Prüfseiten werden nicht veröffentlicht. Vollständige Anmeldung auf der veröffentlichten Website und reale Android-/iPhone-Geräte bleiben gesonderte Praxistests.
