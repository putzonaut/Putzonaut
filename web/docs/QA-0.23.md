# Prüfstand 0.23.0 · Eigene Konten und Geräteerinnerungen

## Umsetzung

- Interner Push-Zeitgeber für den eigenständigen Node-Server, dauerhafte installationseigene VAPID-Schlüssel und zur Installation passender Absenderkontakt. Keine neue öffentliche Versandroute.
- Eigener Kontobereich im Profil und während der Crew-Einrichtung. Änderung der Login-E-Mail erst nach aktuellem Passwort und Bestätigung der neuen Adresse.
- Dauerhafte Kontolöschung mit Passwort und ausdrücklicher Bestätigung. Aktive Crew-Mitgliedschaften müssen zuvor aufgelöst sein; vorhandene Captain- und Kinderbetreuungsregeln gelten weiter.
- Vollständiges Vorladen der eigenständigen JavaScript-/CSS-Dateien für den Offline-Start.

## Automatisiert geprüft

- Gesamte bestehende App-Testsuite, TypeScript-Prüfung, Framework-/Offline-Build und eigenständiger Produktionsbuild.
- Falsche/fehlende Passwörter, ausdrückliche Löschbestätigung, serverseitige Versuchslimits und fremde Origins.
- Neue Login-Adresse bleibt bis zur Bestätigung unwirksam. Crew, Mitgliedskennung, Sterne und XP bleiben danach erhalten. Frühere Sitzungen und Reset-Links werden widerrufen.
- Ersetzte, abgelaufene und erneut verwendete Bestätigungslinks werden zurückgewiesen. Links können nach Kontolöschung und Neuregistrierung derselben Adresse kein anderes Konto übernehmen. Ein Passwort-Reset widerruft ausstehende Adressänderungen.
- Belegte Zieladressen sind nicht über die Antwort unterscheidbar und werden nicht überschrieben.
- Löschen entfernt Konto, Passwort, Sitzungen, Reset-Links, ausstehende Adressänderungen und zugehörige ausstehende Mails. Gemeinsame Crew-Inhalte bleiben erhalten.
- Paralleles Crew-Anlegen und Löschen erzeugt keine verwaiste Mitgliedschaft. Fremde Geräteanmeldungen werden nicht verwendet.
- Geräteerinnerungen ohne offenen Browser; installationseigener VAPID-Absender, unveränderte Schlüssel und keine zweite Tagesnachricht nach Neustart. Zeitgeber überlappt nicht und wartet beim Herunterfahren auf den laufenden Versand.
- Unveränderte Regeln für Berliner Zeit, offene Aufgaben, Kinderbetreuung, Auszeiten, Tageslimit und abgelaufene Geräteanmeldungen.
- Neue Kontoseiten und bestehende HTTP-/Cookie-/Header-Grenzen; Offline-Cache enthält auch die Dateien des eigenständigen Builds.

## Noch praktisch zu prüfen

Die Browser-Vorschau konnte in der Arbeitsumgebung nicht gestartet werden (`preview relay unavailable`). Die neue Oberfläche wurde daher hier nicht visuell auf echten Bildschirmgrößen geprüft. Echte SMTP-Zustellung sowie Push-Zustellung auf Android und auf einem unterstützten iPhone mit Home-Bildschirm-App sind nach dem Server-Update zu prüfen. Automatisierte Mail-/Push-Tests verwenden isolierte Testtransporte, keine echten Empfänger.

Die Docker-Prüfungen für amd64 und arm64 laufen zusätzlich im Workflow `Web-App` vor der Image-Veröffentlichung. Änderungen am Repository oder ein neues Image aktualisieren einen bereits laufenden Server nicht von selbst.
