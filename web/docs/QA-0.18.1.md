# Putzonaut 0.18.1 · Inhaltskorrekturen

Stand: 31. Oktober 2026 (Europe/Berlin). Ausgangspunkt: App 0.18.0, Quellstand `a4dcf472d7a7122551ee987261e9598508da7715`, Site-Version 22.

## Umfang

Die beauftragte Prüfung führte zu begrenzten Korrekturen an Begriffen, Vorlagen und dem Einstieg. Keine neuen Reiter, Spielwährungen oder Freischalthürden. Kinderprofile bleiben ausschließlich durch Eltern bedient. Vorhandene Crew-Dokumente und Missionspunkte werden nicht migriert oder neu berechnet.

Neue Crews starten mit zwei vorausgewählten täglichen Aufgaben. Das reguläre Ziel wird auf die mit der Auswahl möglichen wiederkehrenden Abschlüsse einer vollen Woche begrenzt. Das erste Ziel wird zusätzlich aufgerundet anteilig nach den verbleibenden Tagen Montag–Sonntag und auf die möglichen Abschlüsse begrenzt. Ohne Vorlagen oder bei ausschließlich einmaligen Aufgaben bleibt das Ziel mindestens eine selbst angelegte bzw. ausgewählte Mission. Es gibt keinen kostenlosen Erfolg für null Aufgaben. Spätere Zieländerungen gelten weiterhin ab Montag.

## Automatisierte Prüfung

- 276 Tests. Vier neue Prüfgruppen für die Punkte aller 51 Vorlagen, sämtliche 64 Startauswahlen an allen sieben Wochentagen und in allen vier Haushaltsarten, gespeicherte erste Ziele mit Wochenwechsel sowie unveränderte bestehende Ziele, Guthaben und Aufgabenwerte.
- Konkrete Szenarien: sechs Vorlagen am Freitag → 11 Missionen in der ersten und 24 in der folgenden Woche; zwei Standardvorlagen am Samstag → 4 und 14; eine wöchentliche Vorlage → 1 und 1; leerer Einstieg → 1, bei null Abschlüssen kein Stationsfortschritt.
- Berlin-Kalendergrenzen in Sommer- und Winterzeit geprüft. Auswahl mit einmaliger Vorlage berücksichtigt.
- Vorhandene Tests für alte Startbestände verwenden ausdrücklich die damaligen sechs Vorlagen. Der Entwurfstest erwartet bei der präzisierten Badvorlage deren drei unbeantwortete Schritte, keine erfundenen Fortschritte.
- Typprüfung und Produktionsbuild gehören zur abschließenden Veröffentlichung. Versionsnummer und Offline-Assets werden aus Paketversion 0.18.1 erzeugt.

## Browserprüfung

Tatsächliche React-Oberfläche mit dem bestehenden API-Handler und isolierten lokalen Testdaten. Temporäre QA-Routen werden vor dem Produktionsbuild entfernt.

- Standardmäßig zwei von sechs Vorlagen ausgewählt; korrigierte Sterne und vollständiger Badname sichtbar.
- Samstag mit allen sechs Vorlagen: 7 Missionen bis Sonntag, 24 ab nächster Woche. Ohne Vorlagen: 1 Mission und Hinweis auf das Anlegen einer eigenen Aufgabe. Mit den beiden Standardvorlagen: 4 bis Sonntag, 14 ab nächster Woche.
- Einrichtung tatsächlich abgeschickt. Danach zwei offene Missionen mit 13 Minuten und das gespeicherte Crew-Ziel 0/4. Keine Startpunkte.
- XP-/Sterne-Erklärung im Profil, klare Trennung von Crew-Ziel und Wünschen in der Crew-Ansicht.
- Kein horizontaler Seitenüberlauf bei 320, 360, 390 und 430 Pixel breiten Testfenstern. Der lange Badname und das erweiterte Formular passen auch in die schmale Ansicht.
- Badvorlage gespeichert und erneut geöffnet: drei konkrete, noch nicht abgehakte Schritte, 20 Minuten, 80 XP, 25 Sterne.
- Kühlschrankvorlage geöffnet: alle Fächer und Ablagen beschrieben, 20 Minuten, 80 XP, 25 Sterne; kein widersprüchlicher Einzel-Fach-Schritt mehr.

## Grenzen

Die Prüfung bestätigt Berechnung, Texte und Bedienabläufe. Ob die Wunschpreise langfristig motivieren, muss weiterhin im Alltag erprobt werden. Dafür wurden keine Preise oder späteren Freischaltschwellen verändert. Keine neue Prüfung auf physischer iPhone-/Android-Hardware in diesem Durchlauf. Keine Produktionsdaten wurden für QA verändert; die Erinnerungsautomatik bleibt deaktiviert.
