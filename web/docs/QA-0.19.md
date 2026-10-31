# Putzonaut 0.19.0 · Prüfstand

Stand: 31. Oktober 2026. Ausgangspunkt: Version 0.18.3, Quellstand `018815be87752c95b426f6a390e42ffd570bd6c9`.

## Automatisiert

- Vorhandene vollständige Suite: 276 Tests erfolgreich, 0 fehlgeschlagen. Keine Spielregeln, Datenbanktabellen oder API-Buchungen geändert.
- TypeScript-Prüfung erfolgreich. Produktions- und Offline-Build gehören zur Veröffentlichung derselben Paketversion.

## Browserprüfung

Die tatsächlichen Komponenten `AppLaunch`, `App` und `LaunchScreen` wurden in einer ausschließlich lokalen Entwicklungsroute geprüft. Für Startzustände lieferte diese Route kontrollierte Antworten auf `/api/bootstrap`. Die Route wurde vor dem Produktionsbuild entfernt; Produktionsdaten und Zugriffsrechte wurden nicht geändert.

- Schnelle Antwort: Datenanfrage nach 51 ms gestartet, nach 93 ms beantwortet; Einblendung nach 1.117 ms beendet. Die Anmeldung war danach zugänglich. Die Einblendung verzögert den Beginn der Datenanfrage nicht.
- Langsame Antwort: Anfrage nach 21 ms gestartet, Einblendung nach 913 ms beendet, Antwort nach 2.422 ms. In der Zwischenzeit bleibt das gleiche Motiv als ruhiger Ladebildschirm erhalten.
- Serverfehler: Nach 119 ms beendet; Fehlermeldung und „Erneut versuchen“ sichtbar, Inhalt nicht mehr inert.
- Gemerkte Einstellung „Animationen aus“: Keine animierte Phase, Einblendung nach 24 ms entfernt; Anfrage läuft parallel weiter.
- 320/360/390/430 CSS-Pixel: kein horizontaler Überlauf, Wiederholen erreichbar. Größenwechsel startet die Einblendung nicht erneut.
- Landepose, beide kleinen Staubwölkchen, Helmglanz, Logo und Beschriftungen visuell geprüft. Vorhandener Visier-Wischer bleibt im Quellcode unverändert.

## Grenzen und weitere Absicherung

Chromium-Vorschau, keine physischen Android-/iPhone-Geräte und kein angemeldeter Produktionsdurchlauf. Gerätepräferenz und Tab-Sichtbarkeit wurden im Code geprüft: Reduzierte Bewegung bzw. Ausblenden beendet die Bewegung, spätere Sichtbarkeit startet sie nicht erneut. Der einmal am Wurzeleinstieg montierte Ablauf bleibt bei internen Ansichtswechseln erhalten. Online- und Offline-Einstieg importieren dieselbe Komponente. Die Profileinstellung wird als einzelner Ein-/Aus-Wert lokal gemerkt; blockierter Browserspeicher verhindert den Start nicht.

## Nachtrag 0.19.1

Die gewünschte Dauer beträgt jetzt insgesamt zwei Sekunden: 1.800 ms für die verdoppelte Landungsfolge plus 200 ms Ausblendung. Die tatsächliche Einblendung wurde mit den produktiven Komponenten in einer entfernten lokalen Prüfroute gemessen: 1.995 ms zwischen beobachtetem Animationsstart und Entfernen des Overlays. Nur Zeitwerte und Versionsdokumentation angepasst; bestehende Ausnahmen für reduzierte Bewegung und Fehler beibehalten. Typprüfung und Produktionsbuild erneut ausgeführt.

## Nachtrag 0.19.3

Die Startgrafik enthält jetzt Schubdüsen, einen größeren diagonalen Anflug mit federnder Landung, eine Plattform mit Druckwelle und Staubpartikeln, Sterne, eine Umlaufbahn sowie gestaffelt erscheinende Logo-Buchstaben. Der unveränderte Ablauf in `AppLaunch` bleibt bei 2.250 ms plus 250 ms Ausblendung.

- Die echten Komponenten in einer temporären lokalen Entwicklungsroute geprüft: Overlay nach 2.522 ms entfernt; Datenanfrage bereits nach 37 ms. Danach ist der reguläre Anmeldebildschirm zugänglich.
- Mit lokal gemerkter Einstellung „Animationen aus“ nach 24 ms zugänglich, Datenanfrage ebenfalls nach 24 ms. Die Gerätepräferenz bleibt zusätzlich in `AppLaunch` und der CSS-Media-Query berücksichtigt.
- Anflug bei 300 ms, Landung bei 850 ms, Logo/Helmglanz bei 1.750 ms und ruhiges Abschlussbild bei 2.200 ms visuell geprüft. Die Druckwelle beginnt erst mit dem Bodenkontakt.
- Vorschaugrößen 320 × 640, 390 × 844 und 430 × 460: kein horizontaler oder vertikaler Überlauf der Startansicht. Die Szene wird bei geringer Höhe kompakter. Der ausgeschriebene Markenname bleibt für Hilfstechnologien als Bildname zugänglich.
- Temporäre Prüfrouten vor dem Produktionsbuild entfernt. Typprüfung und Produktions-/Offline-Build werden für 0.19.3 erneut ausgeführt; die vollständige 276-Test-Suite wurde für diese rein visuelle Änderung nicht erneut gestartet.

Weiterhin Chromium-Vorschau, keine Prüfung auf physischen Mobilgeräten oder als angemeldeter Produktionsnutzer. Der bestehende Lade-/Fehlerablauf, Fachlogik und Datenhaltung sind unverändert.

## Nachtrag 0.19.4

Die vollständige Choreografie wurde um den Faktor 1,2 auf insgesamt drei Sekunden gestreckt. Alle CSS-Dauern und Verzögerungen sind proportional angepasst, einschließlich der Ausblendung (300 ms); der Starttimer beträgt 2.700 ms. Die Ausnahmen für deaktivierte Animationen, reduzierte Bewegung, Hintergrundtabs und Fehler bleiben unverändert. Für die reine Zeitwertänderung: Quellvergleich, Typprüfung und Produktions-/Offline-Build; keine erneute Browser- oder vollständige Regressionstestreihe.
