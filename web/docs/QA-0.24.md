# Prüfstand 0.24.0 · Genauere Wiederholungen

## Umsetzung

- Im bisherigen Missionsformular öffnet „Weitere Wiederholungen“ die drei zusätzlichen Rhythmen: alle 2, 3 oder 6 Monate, ein bestimmter Wochentag im Monat und jährlich an einem festen Datum. Die vier Hauptbereiche bleiben bestehen.
- Monatsabstände und jährliche Termine richten sich nach dem ersten Termin. Kurze Monate verwenden ihren letzten Tag; danach gilt wieder der ursprüngliche Monatstag. Der 29. Februar fällt in normalen Jahren auf den 28. Februar.
- Für Wochentage stehen der erste, zweite, dritte, vierte und letzte Montag bis Sonntag zur Auswahl. Das Startdatum begrenzt die erste Runde.
- Eine Vorschau nennt den Rhythmus und den nächsten Termin. Eine bereits überfällige Runde und eine aktive Pause werden ausdrücklich angezeigt.
- Entwürfe, Bearbeiten, Duplizieren und Sicherungen erhalten die neuen Regeln. Beim Duplizieren bleiben das Jahresdatum und der ursprüngliche Monatsabstand erhalten. Sicherungen mit diesen neuen Rhythmen benötigen mindestens Version 0.24.0; das Sicherungsformat bleibt unverändert.

## Lokal erfolgreich geprüft

- 343 App-Tests, TypeScript-Prüfung, Framework-/Offline-Build und eigenständiger Produktionsbuild.
- Alle drei Monatsabstände, Monatsenden, zukünftige Startdaten, jährliche Termine und Schaltjahre.
- Erster bis vierter sowie letzter Wochentag für alle sieben Wochentage und zwölf Monate in neun verschiedenen Jahren, gegen einen unabhängig berechneten Kalender geprüft.
- Pausen, ausgelassene Runden, Verschiebungen über mehrere Monate und Berliner Sommerzeitwechsel. Der ursprüngliche Rhythmus bleibt nach einer Verschiebung bestehen.
- Abgeschlossene Runden behalten beim Bearbeiten ihren Abschluss. Wiederholte Abschlussanfragen vergeben keine zusätzlichen Punkte; veraltete Rundenkennungen und verfrühte Abschlüsse werden abgewiesen.
- Servervalidierung, vollständige Sicherung/Wiederherstellung, ungültige Kalenderregeln, Entwurfsfelder und die tatsächliche Duplizierfunktion.
- Vorschau für neue, erledigte, überfällige, pausierte und geänderte Missionen sowie identische Regeln mit unterschiedlicher Reihenfolge der gespeicherten Felder.

## Prüfung der Veröffentlichung

Der Workflow `Web-App` prüft zusätzlich die Produktionscontainer für amd64 und arm64 vor der Veröffentlichung. Der Store-Workflow prüft das veröffentlichte Image in einer frischen Umbrel-Installation auf beiden Architekturen.

Der ergänzte Browsertest prüft das geschlossene Zusatzmenü, Anlegen und Bearbeiten der neuen Regeln, Schließen und Fortsetzen eines Entwurfs, Duplizieren eines Jahrestermins sowie die unveränderte Speicherung nach Update und Neustart. Bildschirmaufnahmen decken 360 Pixel breite Mobilansichten und die Desktopansicht ab. Bestehende Konto-, Einrichtungs- und Website-Prüfungen laufen weiterhin.

Ein veröffentlichtes Update aktualisiert einen bereits laufenden Server erst nach der Installation durch den Betreiber.
