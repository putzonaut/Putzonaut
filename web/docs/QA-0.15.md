# Putzonaut 0.15.0 · Prüfstand

Stand: 30. Oktober 2026. Ausgangspunkt: veröffentlichte Version 0.14.0, Quellstand e3bf2d21a19aad6a033216c6c3e66c9499a6cb2b. Keine Produktionsdaten für Tests verändert.

## Automatisiert

- Vollständige Suite: 254 erfolgreich, 0 fehlgeschlagen. D1- und R2-Integration auf isoliertem Miniflare; keine Produktionsbindungen.
- 20 neue Komfort-/Integrationstests: deutsche Satzangaben, verspätete relative Wiederholungen, Monats-/Jahreswechsel, Schaltjahr und Berliner Zeitumstellung, Kinderfreigabe, Pausen und Rücknahmen, Validierung und Sicherungen, paralleler/idempotenter Dank, Crew-Grenzen, Zeitrückmeldungen und Korrekturen, gemeinsame Runden als eine Evidenz, Trophäenberechtigungen, Bildgrößen und authentifizierter Bildabruf, Geräteobergrenze, SSRF-Abwehr, Elternzuordnung, Auszeiten und Tagesfenster.
- Push-Integration: trockener Versandlauf, gespeicherter Status über getrennten GET lesbar, konkurrierende Versandläufe, ein Tagesversuch, kryptografische VAPID-Signaturprüfung, erlaubte Ziele ohne Redirect, 410-Bereinigung und kein erneuter Versuch bei unklarem Timeout.
- Service Worker: allgemeine Benachrichtigung wird unmittelbar ohne Datenabruf angezeigt; Klick fokussiert/öffnet dieselbe App. Bestehende Offline-Isolationstests bleiben grün.
- TypeScript-Typprüfung und Produktionsbuild vor Veröffentlichung. Die gebaute Offline-Manifestversion und der Cache entsprechen 0.15.0.

## Browser

Die echten React-Komponenten wurden im verwalteten Preview mit synthetischem Zustand und isoliertem HTTP-Adapter geprüft. Die vorübergehende QA-Route und ihr Seed wurden danach entfernt. Diese Prüfung ergänzt die echten D1/R2-Tests, ist kein angemeldeter Produktionsdurchlauf.

- Satz „Staubsaugen, jeden Samstag, 10 Minuten“ korrekt vorgeschlagen und ins normale Formular übernommen; auf „14 Tage nach Erledigung“ geändert, Hinweis gespeichert und im Detail wieder angezeigt.
- Dauer von 10 auf vorgeschlagene 13 Minuten ausdrücklich übernommen; Missionsbelohnung unverändert. Abschluss und freiwillige Rückmeldung erfolgreich dargestellt.
- Dank wird einmal angezeigt, anschließend deaktiviert; keine Änderung des Sternenguthabens.
- Drei Abzeichen ausgestellt, weitere Auswahl deaktiviert; Entfernen ausgewählter Abzeichen bleibt möglich.
- Elternhinweis und „Für das Kind erfassen“ sichtbar. Kein neuer Hauptreiter, keine Kinderoberfläche.
- Erinnerungsdialog erklärt getrennte Geräteaktivierung. Auf nicht unterstütztem unsicherem Preview zeigt er die passende Grenze, ohne einen Browserdialog zu öffnen.
- 320, 360, 390 und 430 CSS-Pixel: kein horizontaler Überlauf im geprüften Stationsbereich; 320-Pixel-Missionsdialog mit Satzaufnahme und Hinweis innerhalb seiner Breite. Screenshots von Missionsdetail und Trophäenregal geprüft.

## Grenzen

Die tatsächliche Zustellung auf einem physischen Android-Gerät und einer iPhone-Home-Bildschirm-App muss nach ausdrücklicher Aktivierung auf dem jeweiligen Gerät geprüft werden. Im Testbrowser wurden keine Benachrichtigungsberechtigungen erteilt und keine echte Geräteanmeldung angelegt. Ein akzeptierter Push ist kein Zustellnachweis. Produktionszugriff und dauerhafter Versandstatus werden nach Deployment mit dem vorgesehenen unbeaufsichtigten Dienstzugriff geprüft; der Zeitplan wird erst danach verknüpft.

Die JSON-Crew-Sicherung enthält Fotoverweise, keine Bilddateien. R2-Dateien müssen für einen Umzug separat gesichert werden. Geräteanmeldungen bleiben getrennte Betriebsdaten.
