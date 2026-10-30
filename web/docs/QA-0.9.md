# Putzonaut 0.9 – Prüfstand

## Automatisierte Prüfungen

130 Tests: 104 Integrationsfälle mit Miniflare D1 und 26 Prüfungen für gemeinsame Regeln und Projektassets. Zwölf neue Fälle in `test/badges.test.ts` ergänzen die bisherigen 118 Fälle.

- Jeder der sieben neuen Erfolge wird unmittelbar unter, an und nach seiner Schwelle geprüft. Nur bestätigte passende Missionen zählen, unabhängig vom Raum; für George Cleaney zählen acht getrennte persönliche Zielwochen ohne Serienpflicht.
- Ein Abzeichen kann vor der Freischaltung nicht getragen werden. Danach ist die Auswahl kostenlos, behält Titel und persönliches Ziel bei, kann wieder entfernt werden und übersteht eine spätere Rücknahme. Doppelte Abschlüsse werden abgewiesen und verdiente Auszeichnungen nicht doppelt angelegt.
- Schon in 0.8 belegte Leistungen schalten passende Abzeichen dauerhaft frei. Wiederholtes Lesen ändert die Revision nicht weiter. XP, Sterne und vorhandene Wünsche bleiben unverändert.
- Kinderleistungen zählen erst nach Freigabe. Das Abzeichen gehört dem Kinderprofil, kann dort von der berechtigten Begleitung gewählt werden und ist keinem fremden Profil zugänglich.
- Sicherung und Wiederherstellung erhalten die neuen Abzeichen, das getragene Abzeichen, das nächste Ziel und Kategorienfortschritte. Bestehende Prüfungen für alte Sicherungen bleiben erhalten.
- Je Haushaltsart stehen 16 gültige Ideen in unterschiedlichen Sternebereichen bereit. Suche, Grenzen der Sternefilter, unbekannte Suchbegriffe und das Ausblenden bestehender Wünsche werden geprüft.
- Alle sieben besonderen Abzeichen und zehn bestehenden Anzüge verweisen auf echte Projektdateien.

Typprüfung, Produktionsbuild und GitHub-Prüfungen gehören zur Veröffentlichung.

## Bildprüfung

Die sieben Medaillen wurden einzeln mit dem eingebauten Imagegen-Werkzeug erstellt, auf Stil, Unterscheidbarkeit, Werkzeugdetails und transparenten Außenbereich geprüft und als WebP optimiert. Die Namen werden in HTML gesetzt und bleiben unabhängig von der Grafik lesbar. Galerie, vollständige Prompts und technische Details: [Bildmaterial 0.9](art-0.9-prompts.md).

## Prüfgrenze

Die verwaltete Vorschau ließ sich nach Entfernen einer veralteten lokalen Vinext-Sperrdatei starten. Der bereitgestellte Browser erreichte die exakte Vorschauadresse erneut nicht (`ERR_CONNECTION_REFUSED`). Es wurde keine andere Browsertechnik oder Netzumgehung verwendet. Die Oberfläche ist daher noch nicht im Browser visuell abgenommen.

Offene Praxistests: schmale Android-/iPhone-Ansichten, größere Schrift, Suche und Sternefilter der Wünsche, neue Abzeichensammlung mit langen Namen, Wechsel und Entfernen des getragenen Abzeichens, neue Freischaltung auf der Erfolgsseite und Kinderfreigabe. Die bisherigen Anmeldungs- und Sicherungstests auf echten Geräten bleiben offen.
