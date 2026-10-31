# Prüfstand 0.13.2 · 30. Oktober 2026

## Umfang

24 gemeinsame Symbolkennungen für persönliche Wünsche, gemeinsame Crew-Wünsche und Wunschideen. Alte Kennungen `gift`, `film`, `ice` und `meal` bleiben gültig. Die Auswahl klappt nach dem Antippen wieder zu; der Fokus kehrt zum Auswahlknopf zurück. Aufgaben behalten ihre getrennte Symbolauswahl. Bestehende Wünsche werden nicht umgeschrieben.

Zusätzlich wurde beim Öffnen eines gemeinsamen Wunsches die fehlende Übergabe der Wunschkennung korrigiert. Ohne diese Kennung zeigte der Detaildialog fälschlich einen beendeten Wunsch.

## Automatisiert

- `npm test`: 213 Tests bestanden, keine fehlgeschlagen oder übersprungen. Der neue API-Integrationstest legt alle 24 Symbole an, bearbeitet einen Wunsch, erstellt einen gemeinsamen Wunsch, exportiert und validiert die Sicherung und prüft die Ablehnung unbekannter bzw. für Aufgaben unzulässiger Symbole.
- `npm run typecheck`: erfolgreich.
- Produktionsbuild über den Sites-Build-Helper: erfolgreich, einschließlich Offline-Bundle.
- Bestehende Tests für Sternenbuchungen, gemeinsame Beiträge, Sicherungen und Offline-Abgleich laufen mit.

## Browserprüfung mit isolierten Testdaten

Die echte App-Oberfläche wurde in einer lokalen Vorschau mit einem ausdrücklich isolierten API-Testadapter geprüft; keine Produktionsdaten wurden geändert. Dieser Browserdurchlauf ergänzt die Integrationstests gegen die echte API und lokale D1-Datenbank.

- 320 Pixel breite Smartphone-Vorschau: alle 24 Motive erreichbar; dreispaltige Auswahl ohne horizontale Überbreite. Kleinste Symbolschaltfläche rund 75 Pixel breit und mindestens 77 Pixel hoch.
- 390 Pixel breite Vorschau: vier Spalten, alle 24 Motive erreichbar, keine horizontale Überbreite; kleinste Symbolschaltfläche rund 72 Pixel breit.
- Persönlichen Wunsch mit Pizza-Symbol angelegt, erneut geöffnet und auf Camping geändert. Vorschau und gespeicherte Auswahl korrekt; nach Auswahl kehrt der Fokus zum Knopf zurück.
- Gemeinsamen Wunsch mit Schwimmsymbol erstellt; Karte und Sparansicht zeigen das Motiv. Detaildialog öffnet den aktiven Wunsch korrekt.

## Grenzen

Kein Test auf einem physischen iPhone oder Android-Gerät. Die authentifizierte Produktionsoberfläche und ein erneuter HTTPS-Offline-Start wurden in diesem Durchlauf nicht bedient. Die bestehende Zugriffseinstellung bleibt erhalten; der bestätigte Sites-Veröffentlichungsstatus wird nach dem Build geprüft.
