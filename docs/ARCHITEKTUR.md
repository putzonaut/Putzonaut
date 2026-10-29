# Architektur und Spielregeln

Die mobile Oberfläche ist eine React/TypeScript-Anwendung mit Vite. Sie verwendet dieselbe Origin für statische Dateien und `/api`. Node.js 24/Express bedient die Produktionsoberfläche und die API. PostgreSQL 17 speichert den verbindlichen Datenstand. PGlite ist ausschließlich der lokale Entwicklungs- und Testadapter; es gibt keine SQLite-Produktionsvariante.

## Datenmodell

Ein Haushalt umfasst Benutzer, Aufgaben, Einladungen, Abschlüsse und Belohnungen. Ein Benutzer gehört in Version 0.1.0 genau einem Haushalt an. Die Ersteinrichtung erstellt einen Haushalt und einen Administrator; weitere Personen treten über Einladungen als Mitglieder bei. Die Datenbankstruktur hält Haushaltsgrenzen bereits ausdrücklich fest.

Aufgaben werden einmalig, täglich oder wöchentlich erledigt. Der Server bestimmt den Rundenschlüssel anhand `Europe/Berlin`; tägliche Runden beginnen um Mitternacht und wöchentliche am Montag. Einmalige Aufgaben verwenden einen festen Schlüssel. Ein eindeutiger Datenbankindex auf Aufgabe und Runde sowie eine Transaktion verhindern doppelte Belohnungen. Ein veralteter Rundenschlüssel im Browser wird abgewiesen, statt nach Mitternacht die neue Runde unbemerkt abzuschließen.

Abschlüsse enthalten eine Momentaufnahme der vergebenen XP und Sterne. Änderungen am Aufgabenkatalog verändern keine alten Abschlüsse. Alle 500 XP steigt der persönliche Level. XP werden nicht ausgegeben. Sterne werden beim Einlösen eines Wunsches oder erstmaligen Freischalten eines Anzugs abgezogen.

Einlösungen sperren den Benutzer-Datensatz innerhalb einer Transaktion. Dadurch bleiben Sternenguthaben auch bei gleichzeitig eintreffenden Anfragen nichtnegativ. Ein wiederverwendeter Anfrageschlüssel liefert dieselbe Einlösung zurück. Reale Wünsche bleiben als offen sichtbar, bis die Crewverwaltung sie als erfüllt markiert.

Erledigungen zählen zusätzlich zum gemeinsamen Wochenziel. Mitglieder werden nach Beitrittsreihenfolge angezeigt; es gibt keine Rangliste. Aufgaben und Wünsche können archiviert werden, frühere Erfolge und Einlösungen bleiben erhalten. Ein nachträgliches Zurücknehmen bereits belohnter Aufgaben ist noch nicht vorgesehen.

## Anmeldung und Zugriff

Passwörter werden mit scrypt und individuellen Salts abgeleitet. Sitzungstokens sind zufällig, liegen nur gehasht in der Datenbank und werden als HttpOnly-Cookies mit SameSite=Lax gesetzt. HTTPS aktiviert das Secure-Attribut. Schreibende Anfragen benötigen die konfigurierte Origin. Jede fachliche Route prüft Anmeldung, Haushalt und gegebenenfalls Administratorrolle. Es gibt keine offene Registrierung weiterer Haushalte.

Einladungen enthalten 192 Bit Zufall, werden nur gehasht gespeichert und unter Transaktionssperre einmalig eingelöst. Anmeldeversuche sind pro Proxy-/Clientadresse begrenzt. Für mehrere Serverinstanzen müssten Rate Limits und die interne Änderungsbenachrichtigung gemeinsam gespeichert werden; Version 0.1.0 ist für eine einzelne App-Instanz gedacht.

## Live-Aktualisierung

Ein Server-Sent-Events-Kanal pro angemeldetem Browser signalisiert Haushaltsänderungen. Er überträgt nur ein Änderungsereignis, danach liest der Client den autorisierten Datenstand neu. Beim Öffnen, Zurückkehren in die App und Wiederverbinden wird erneut geladen. Ein zusätzlicher Abruf alle 60 Sekunden gleicht verlorene Ereignisse und Tageswechsel aus, solange die App sichtbar ist.

## Illustration und spätere Apps

Die freigegebenen Entwürfe sind in getrennte Hintergrundszenen und echte React-Komponenten umgesetzt. WebP-Grafiken und Nunito-Schriftdateien werden mitgeliefert. Für native Android-/iOS-Versionen ist ein späterer Capacitor-Container vorgesehen. Dieser würde dieselben API-Verträge verwenden; er ist noch kein Teil dieser Version.

## Quellen für den späteren Betrieb

- [Cloudflare Tunnel](https://developers.cloudflare.com/tunnel/)
- [Capacitor](https://capacitorjs.com/docs)
- [Umbrel App Store Pakete](https://github.com/getumbrel/umbrel-apps)
