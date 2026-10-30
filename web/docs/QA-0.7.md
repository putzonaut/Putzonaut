# Putzonaut 0.7 – Prüfung und Abnahme

## Automatisiert

`npm run typecheck`, `npm test` und `npm run build` sind die Veröffentlichungsprüfungen.
104 Tests insgesamt, einschließlich echter Miniflare-D1-Transaktionen und beider SQL-Migrationen für die Sicherungsfälle.

- Einrichtung für Familie, Paar, WG und Einzelhaushalt; Einladungen und Grenzen zwischen Haushalten.
- Zwei gleichzeitig aktive Konten, doppelte Abschlüsse, Checklistenänderungen und einmalige Bonusvergabe.
- Begleitete Kinderprofile, Freigabe/Rücknahme, Rollenübergabe, Austritt und entzogenes Zugriffsrecht.
- Aufgabenplanung einschließlich Monatsenden, Sommerzeit, Pausen und Wochenrotation.
- Vorlagen: alle 45 werden über die echte API angelegt, ohne dabei Punkte zu vergeben. Der Einstieg behält sechs Startervorlagen.
- Kurzstart: nur offene, eigene oder freie Aufgaben innerhalb des Zeitbudgets; höchstens drei Vorschläge.
- Sicherung über die erste 50er-Logbuchseite hinaus; keine Konto-IDs oder Einladungsschlüssel in der Datei.
- Wiederherstellung inklusive Checklisten, Kinderfreigaben, Quests, Einlösungen und ausgeschiedener Profile.
- Rücksprungpunkt wieder eingespielt; alter und neuer Stand vergeben keine doppelten Punkte.
- Gleichzeitige Wiederherstellungen, geänderte Berechtigungen und veraltete Vorschauen/Browseranfragen werden abgewiesen.

## Noch auf echten Geräten zu prüfen

Der verwaltete Vorschau-Server startet. Der bereitgestellte Browser erreichte ihn am 30.10.2026 nicht; nach der Verbindungsablehnung war die Beobachtung durch die Browser-Sicherheitsrichtlinie blockiert. Es wurden keine Browser-, Authentifizierungs- oder Netzwerksperren umgangen. Diese Tests sind deshalb ausdrücklich **offen**:

1. Android/Chrome und iPhone/Safari: Einrichtung, Anmeldung und erneutes Öffnen, auch über das Home-Bildschirm-Symbol.
2. Schmale Displays (320/360/390 px), größere Systemschrift, Bildschirmtastatur, lange Namen und hohe Sternestände; Header, Dialoge und Navigation müssen frei bedienbar bleiben.
3. 5/10/20-Minuten-Auswahl, Wechsel der Vorschläge, Checkliste und vollständiger Abschluss inklusive Rückgängig.
4. Vorlagen durchsuchen, Kategorie wechseln, weitere anzeigen, eine Vorlage ändern und speichern.
5. Zweites angemeldetes Gerät: Aufgabe erledigen, Aktualisierung im anderen Gerät, Kinderfreigabe und Einlösung.
6. Verbindung unterbrechen und zurückkehren; keine unbestätigten Aktionen als erledigt anzeigen.
7. Ausschließlich mit einer Testcrew: Sicherung herunterladen, Änderung durchführen, Datei auswählen, Vorschau prüfen, Wiederherstellung bestätigen; Rücksprungpunkt herunterladen und wieder einspielen.
8. Dateiauswahl und JSON-Download besonders auf iPhone überprüfen.

Eine öffentliche Beta setzt zusätzlich unabhängige Anmeldung, Kontowiederherstellung/-löschung sowie extern gespeicherte und getestete Betreiber-Backups voraus.
