# Putzonaut 0.12 – Prüfstand

## Automatisierte Prüfung

178 erfolgreiche Tests: 151 Integrationsfälle gegen Miniflare D1 und 27 Prüfungen für gemeinsame Regeln und Projektassets. Die bisherigen Tests wurden auf die neuen fachlichen Schwellen angepasst. Drei zusätzliche Abzeichenfälle und acht neue Integrationsfälle in `test/balance.test.ts` prüfen den Ausbau und den Übergang. Typprüfung und Produktionsbuild gehören zur Freigabe; GitHub prüft die Web-App sowie die bestehende Docker-/PostgreSQL-Grundlage.

- Alle zehn besonderen Abzeichen sperren unterhalb ihrer exakten Schwelle, werden beim passenden bestätigten Abschluss genau einmal vergeben, lassen sich kostenlos tragen und bleiben nach einer echten Korrektur verdient.
- Harry verwendet Gesamtabschlüsse. Albert zählt ausschließlich gültige Kategorien mit mindestens fünf bestätigten Einsätzen; häufige Arbeit in einer einzigen Kategorie ersetzt keine weitere Kategorie. Clean Elisabeth verwendet zwölf gespeicherte persönliche Zielwochen mit erlaubten Pausen.
- Belegte bestehende Karrieren erhalten alle passenden neuen Erfolge einmalig und ohne Änderung von XP, Sternen oder Wünschen.
- Bereits verdiente Erfolge und Ausrüstung aus 0.11 bleiben auch unterhalb der neuen Voraussetzungen nutzbar, einschließlich gekauftem Komet und Sonnenheld. Nicht verdiente Erfolge benötigen die neuen Schwellen. Die erste Mission und Teamgeist zu zweit bleiben erreichbar.
- Komet kann mit 349 Sternen nicht, mit genau 350 Sternen einmalig gekauft werden. Sonnenheld ist bei 3.999 XP gesperrt und bei 4.000 XP kostenlos freischaltbar. Wiederholtes Anziehen belastet nicht erneut.
- Gartenpilot und Krümelkommandant zählen die bestätigte Kategorie, auch bei absichtlich abweichendem Raum oder Symbol. Bearbeitung, Archivierung, offene Kinderfreigaben und Rücknahmen verwenden weiterhin den ursprünglichen Abschluss.
- Alberts Kinderfreigabe zählt ausschließlich beim Kind. Eine nach der Meldung geänderte Aufgabenkategorie schreibt die Freigabe nicht um. Rücknahme des bestätigten Ereignisses korrigiert den Kategoriefortschritt; das verdiente Abzeichen bleibt tragbar.
- Alte Stationen mit vier, fünf, acht und zwölf erfolgreichen Wochen erhalten genau die schon verdienten Module zu ihren damaligen Schwellen. Noch offene Module nutzen die neuen Ziele. Der Übergang wird dauerhaft und ohne wiederholte Schreibzugriffe gespeichert. Neue Crews benötigen die neuen Schwellen.
- Eine reale Rücknahme kann einen übernommenen Stationsausbau weiterhin korrigieren. Erneutes Erledigen zählt wieder genau einmal; folgende gesperrte Module behalten die erhöhten Ziele.
- Abzeichenauswahl, Karriere und übernommene Stationsschwellen überstehen Sicherung und Wiederherstellung. Alte Sicherungen ohne Stationsfeld bleiben gültig; ungültige Werte wie −1, 7 oder Bruchteile werden abgewiesen.
- Alle 22 Erfolge gehören genau einmal zu den getrennten Sammlungen: zwölf Meilensteine und zehn besondere Abzeichen. Alle zehn Anzüge und alle Abzeichen haben echte Projektbilder.
- Bisherige Prüfungen zu Statistik, Aufgabenrunden, Crew-Wünschen, Profilrechten, Parallelzugriffen, Wiederherstellung, Kalendergrenzen und Punkten bleiben erfolgreich.

## Bilder und Bedienung

Die drei Motive wurden einzeln mit dem eingebauten Imagegen-Werkzeug erstellt, an der bestehenden goldenen Putzonaut-Medaille ausgerichtet und anschließend ausschließlich mit Sharp verkleinert und konvertiert. Alle finalen WebPs haben 640 × 640 Pixel, echte transparente Ecken und gemeinsam 395.804 Byte. Motiv, Figurensprache und 96-Pixel-Lesbarkeit wurden visuell geprüft. [Bildprompts und technische Assetprüfung](art-0.12-prompts.md).

Die vorhandene Abzeichengalerie bleibt zweispaltig. Alberts sieben Kategoriezeilen liegen nur im bestehenden Detaildialog. Die Angaben bestehen aus Text und Zahlen; ein zusätzliches Häkchen kennzeichnet abgeschlossene Kategorien. Die UI erklärt bei bereits verdienten Erfolgen unterhalb der aktuellen Schwelle den Bestandsschutz. Die Versionsnummer steht weiterhin ausschließlich unten im Profil.

## Offene visuelle Prüfung

Die verwaltete Vorschau startet und meldet `http://terminal.local:4173/` als laufend. Der bereitgestellte Browser kann die exakte Adresse weiterhin nicht öffnen (`net::ERR_CONNECTION_REFUSED`). Die Bilder sind separat visuell geprüft, die App-Oberfläche dieser Version jedoch nicht im Browser abgenommen. Es wurden keine alternative Browsertechnik, Netzumgehung oder künstlichen App-Screenshots verwendet.

Auf Android und iPhone sind noch zu prüfen:

1. Zehn Abzeichen in der Galerie, insbesondere lange Namen und die letzte Zeile, bei schmalem Bildschirm und größerer Schrift.
2. Harry, Albert und Elisabeth als gesperrtes Ziel, nach Freischaltung, als getragenes Profilabzeichen und in einer Freischaltungsmeldung.
3. Alberts Kategorieübersicht im Detaildialog, Scrollen, Schließen sowie Fokus und Screenreader-Ausgabe.
4. Weiterhin kompakte Profilübersicht, getrennte Sammlungen, Statistiknavigation und reduzierte Bewegung.
5. Reale Nutzungsdauer: Die rechnerisch mäßig erhöhten Schwellen sind noch nicht durch mehrwöchige Nutzung evaluiert.
