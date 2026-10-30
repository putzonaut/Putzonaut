# Putzonaut 0.10 – Prüfstand

## Automatisierte Prüfungen

152 Tests: 126 Integrationsfälle mit Miniflare D1 und 26 Prüfungen für gemeinsame Regeln und Projektassets. `test/rounds-wishes.test.ts` ergänzt 22 neue Fälle; die bisherigen 130 bleiben erhalten.

- Zeitbudgets gelten für die Summe der höchstens drei gewählten Missionen. Eine laufende Runde verhindert einen zweiten Start. Eigene und freie Aufgaben werden berücksichtigt, pausierte und fremd zugeteilte nicht angeboten.
- Runde, Aufgabenreihenfolge, ursprünglicher Termin und Timerstand bleiben gespeichert. Ablauf, Pause, Fortsetzen, Überspringen und Beenden vergeben keine zusätzlichen Punkte. Veraltete gleichzeitige Timeränderungen werden abgewiesen.
- Ein Tageswechsel ersetzt keine alte Runde. Pausen und neue Zuständigkeiten sperren betroffene Einträge; ein Abschluss durch die Crew zählt als Crewleistung mit null eigenen Punkten. Erledigte archivierte Aufgaben bleiben nachvollziehbar; Rücknahmen korrigieren die Zusammenfassung.
- Kinderabschlüsse bleiben bis zur Freigabe ohne Punkte. Ablehnen öffnet den Eintrag wieder. Entfernen eines Kinderprofils gibt dessen offene Meldung auch in anderen Putzrunden frei.
- Routinen nutzen nur bestehende unterschiedliche Aufgaben und erhalten deren Reihenfolge. Nicht verfügbare oder archivierte Aufgaben entfallen beim Start. Löschen der Routine löscht weder Aufgaben noch laufende Runden. Vorschläge enthalten keine doppelten Aufgaben.
- Raumkarten unterscheiden leere Räume, offene Aufgaben, fremde Einteilungen, wartende Freigaben, Pausen und aktuell erledigte Pläne.
- Doppelt gesendete Beitrags-, Rücknahme-, Abbruch- und Einlösungsanfragen werden einmalig gebucht. Derselbe Anfrageschlüssel kann nicht für einen anderen Betrag oder eine andere Aktion verwendet werden.
- Gleichzeitige Beiträge überziehen kein Profil und überfüllen keinen Wunsch. Gleichzeitiges persönliches Einlösen und Einzahlen kann dieselben Sterne nicht doppelt ausgeben. Abbruch gegen Einzahlung sowie Abbruch gegen Einlösung erhalten das korrekte Gesamtguthaben.
- Beiträge lassen sich nur vom eigenen Profil zurücknehmen. Der Captain löst erst bei vollständiger Finanzierung ein; die gemeinsame Einlösung ist für alle sichtbar und kann als erfüllt markiert werden. Eine zweite Belastung findet nicht statt.
- Crew-Austritt und Entfernen eines Kindes erstatten offene Beiträge an das bisherige Profil. Auch ein zuvor vollständig zurückgenommener Beitrag lässt sich anschließend sichern. Neue Crews übernehmen kein Guthaben.
- Korrigieren einer Mission nach Einzahlung ändert das persönliche Guthaben, nicht nochmals den Beitrag. Ein negatives persönliches Guthaben verhindert weitere Einzahlungen.
- Fremde Kinderprofile und unberechtigte Verwaltungsaktionen werden abgewiesen. Die Bewegungspräferenz gilt nur für das ausgewählte Profil.
- Sicherung und Wiederherstellung erhalten die neuen Felder. Alte Sicherungen ohne diese Felder bleiben gültig. Zu hohe Wunschstände, unbekannte Beitragsprofile und inkonsistente gemeinsame Einlösungen auch im Logbuch werden abgewiesen.

Typprüfung und Produktionsbuild gehören zur lokalen Freigabe. Die GitHub-Workflows prüfen zusätzlich die Web-App sowie die unveränderte Docker-/PostgreSQL-Grundlage.

## Oberfläche und Prüfgrenze

Die verwaltete Vorschau meldete `http://terminal.local:4173/` als laufend. Der bereitgestellte Chrome-Browser konnte genau diese Adresse nicht öffnen (`ERR_CONNECTION_REFUSED`). Es wurde keine alternative Browsertechnik oder Netzumgehung verwendet. Neue Ansichten und CSS-Animationen sind deshalb noch nicht visuell im Browser abgenommen. Für 0.10 wurden keine neuen Rasterbilder erzeugt; die bestehenden Putzonaut-Illustrationen werden wiederverwendet.

Offene Praxistests auf Android und iPhone:

1. Kurze Putzrunde starten, Checkliste abschließen, zur Runde zurückkehren, überspringen, vorzeitig beenden und die Zusammenfassung ansehen.
2. Timer pausieren und fortsetzen, Tab wechseln, Display sperren, Seite neu laden und mit der tatsächlichen verbleibenden Zeit vergleichen.
3. Routine anlegen, Reihenfolge ändern, eine zugehörige Aufgabe archivieren und Routine erneut starten.
4. Raumkarten bei langer Raumbezeichnung, großer Schrift, leeren Räumen und Kinderfreigaben prüfen.
5. Mit zwei Profilen beitragen, eigene Sterne zurücknehmen, gemeinsam einlösen und einen anderen Wunsch abbrechen. Ein offener alter Dialog darf nach Wunschwechsel keinen neuen Wunsch bebuchen.
6. Bewegungen im Profil und über die Geräteeinstellung abschalten; lange Wunsch- und Abzeichennamen bei schmaler Ansicht prüfen.
7. Anmeldung, Installation auf dem Startbildschirm, Sicherungsdownload und Wiederherstellung auf beiden Plattformen testen.

Die Website bleibt eine private Entwicklungsveröffentlichung. Der spätere öffentliche Start und die eigene Anmeldung sind nicht Teil dieses Updates.
