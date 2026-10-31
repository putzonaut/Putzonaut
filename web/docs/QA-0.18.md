# Putzonaut 0.18.0 · Prüfstand

Stand: 31. Oktober 2026 (Europe/Berlin). Ausgangspunkt: App 0.17.0, Quellstand `cecbad7d5e108fcb15f545ca47055850c8f42c8b`, Site-Version 21. Die fünf beauftragten Komfortverbesserungen sind umgesetzt. Kein Produktionsdatensatz wurde zum Testen verändert.

## Automatisiert

- Vollständige Suite: 272 Tests erfolgreich, keine Fehler. Die vorhandenen Server-, D1-, R2-, Freigabe-, Rücknahme-, Offline- und Push-Prüfungen bleiben enthalten.
- Sechs neue Prüfgruppen: korrekte Tagesübersicht für eigene/freie/gemeinsame Aufgaben; bestätigter Wunschfortschritt ohne Wiederholungen, fremde oder veraltete Stände; validierte Ansichtsfilter; vollständige und begrenzte Entwürfe mit Ablauf; getrennte Speicherbereiche und Löschen; Tastaturhöhe, Viewport-Versatz und Vergrößerung.
- Nach dem letzten Entwurfsfeinschliff wurden Typprüfung und die zwölf unmittelbar betroffenen Komfort-/Abschlusstests erneut ausgeführt. Abschließend Typprüfung, Produktionsbuild und vollständige Suite für den Veröffentlichungskandidaten.
- Die Produktionspaketprüfung schließt temporäre QA-Routen aus. Paketversion und neu generierter Offline-Cache: 0.18.0.

## Browser

Die tatsächliche App und der bestehende API-Handler liefen mit isolierten lokalen Testdaten. Temporäre Entwicklungsrouten wurden vor dem Produktionsbuild entfernt.

- Suche „Küche“ bleibt beim Wechsel zu Beute und zurück erhalten. Browser-Zurück schließt zunächst die Missionsdetails und wechselt beim nächsten Zurück zum vorherigen Bereich.
- Eine lange Missionsliste behält beim Wechsel über Crew exakt ihre Scrollposition (beobachtet: 1655 CSS-Pixel). Nach Neuladen wird die Missionsansicht mit gespeicherter Position wiederhergestellt.
- Entwurf mit Titel, leerem Minutenfeld, manuellen 33 XP/7 Sternen, Checkliste und Notiz schließen und fortsetzen: alle Eingaben erhalten. Nach erfolgreichem Speichern erscheint ein leeres neues Formular ohne alte Entwurfsabfrage.
- „Mit einem Satz starten“ schließen, fortsetzen, Vorschau öffnen und übernehmen: „Staubsaugen, jeden Samstag, 10 Minuten“ wird mit Samstag, zehn Minuten und passendem Titel übernommen. Das reine Öffnen weiterer Optionen erzeugt keinen Entwurf.
- Ein gezielt in der lokalen QA-Route erzeugter HTTP-503-Speicherfehler lässt das Formular und den Entwurf erhalten. Der Fehler wird sichtbar in den Dialog gescrollt und nicht durch den periodischen Datenabgleich gelöscht. Nach Schließen ist der Entwurf weiterhin fortsetzbar.
- Bei 320/360/390/430 Pixel breiten Testfenstern kein horizontaler Seitenüberlauf. Zusätzlich 430 Pixel Fensterhöhe: Hauptbutton vollständig innerhalb des Dialogs (Unterkante 415, Dialogunterkante 428), Schließen bleibt erreichbar. Missionsdetails mit Checkliste ebenfalls geprüft.
- Die Basis zeigt zunächst zwölf offene Missionen mit 72 Minuten; Änderungen und bestätigte Abschlüsse aktualisieren Anzahl und Dauer passend.
- Gewählter Wunsch „Filmabend“ für 200 Sterne: nach Abschluss von 180 auf 185 Sterne „Noch 15 Sterne“, danach bei 190 Sternen „Noch 10 Sterne“. Sowohl große Feieransicht als auch kompakte Meldung geprüft; bestehende Rücknahme bleibt vorhanden.

## Grenzen und Umfang

Chromium-Vorschau mit schmalen Fenstern und verkleinerter Höhe, keine physischen Android-/iPhone-Geräte. Die konkrete Bildschirmtastatur wurde nicht auf Hardware getestet; ihre Viewport-Berechnung ist automatisiert geprüft. Bei gesperrtem Browserstorage ist die Wiederherstellung auf die laufende App beschränkt. Die Einstellungen und Serverregeln für Kinderprofile, Punkte und Erinnerungen wurden nicht erweitert. Die separat vom Nutzer deaktivierte Erinnerungsautomation bleibt deaktiviert.
