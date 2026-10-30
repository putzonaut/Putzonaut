# Putzonaut 0.12 – Freischaltungen und Plausibilität

Die meisten bestehenden Hürden steigen um 12,5–20 %. „Im Rhythmus“ erhält genau eine zusätzliche Woche (4 → 5, 25 %); eine kleinere ganzzahlige Erhöhung wäre hier nicht möglich. Einstiegserfolg und Teamgröße bleiben sinnvoll erreichbar. Keine bereits verdiente kosmetische Freischaltung wird entzogen.

## Neue Abzeichen

| Abzeichen | Voraussetzung | Gestaltung |
| --- | --- | --- |
| Harry Putzer | 75 bestätigte Missionen insgesamt | Violetter Zauberhut, runde Brille, Besen mit Glanzfunken |
| Albert Reinstein | In fünf frei gewählten Kategorien jeweils mindestens fünf bestätigte Missionen | Weißer Forscheranzug, wuschelige Helmaufsätze, Schwamm und Atom-Glanzsymbol |
| Clean Elisabeth | Zwölf erreichte persönliche Zielwochen | Lavendelfarbener königlicher Anzug, Krone, Perlen und Poliertuch |

Harry schließt die Lücke zwischen Staubbezwinger und Haushaltsheld. Albert belohnt wiederholte Einsätze in mehreren Bereichen: Mindestens 25 Abschlüsse, verteilt auf fünf Kategorien, sind nötig. Viele Abschlüsse in nur einer Kategorie reichen nicht. Die Detailansicht zeigt den aktuellen Stand aller sieben Kategorien; Haustiere oder Pflanzen sind für dieses Abzeichen nicht zwingend erforderlich. Clean Elisabeth setzt nach George Cleaney ein weiteres langfristiges Ziel. Persönliche Zielwochen dürfen durch beliebig lange Pausen getrennt sein.

## Bestehende Abzeichen

| Abzeichen | Bis 0.11 | Ab 0.12 | Änderung |
| --- | ---: | ---: | ---: |
| Franz Beckenkehrer, Aufräumen | 20 | 24 | +20 % |
| Kehrminator, Gesamtmissionen | 150 | 175 | +16,7 % |
| Jürgen Cleansman, Küche | 30 | 35 | +16,7 % |
| Helene Wischer, Bad | 25 | 30 | +20 % |
| George Cleaney, persönliche Zielwochen | 8 | 9 | +12,5 % |
| Otto von Wischmark, Haushalt | 40 | 45 | +12,5 % |
| Roberto Blanko, Wäsche | 30 | 35 | +16,7 % |

## Meilensteine und Anzüge

| Meilenstein | Bis 0.11 | Ab 0.12 | Anzug |
| --- | --- | --- | --- |
| Erster Einsatz | 1 Mission | 1 Mission | – |
| Dranbleiber | 10 Missionen | 12 Missionen | – |
| Teamgeist | 2 aktive Personen | 2 aktive Personen | – |
| Krümelkommandant | 10 Küchenmissionen | 12 Missionen der Kategorie Küche | – |
| Gartenpilot | 5 Pflanzenmissionen | 6 Missionen der Kategorie Pflanzen | Gartenpilot |
| Nebelläufer | 25 Missionen | 30 Missionen | Nebelläufer |
| Staubbezwinger | 50 Missionen | 60 Missionen | – |
| Haushaltsheld | 100 Missionen | 115 Missionen | Galaxiekapitän |
| Waschonaut | 10 Wäschemissionen | 12 Wäschemissionen | Waschonaut |
| Glanzpilot | 10 Badmissionen | 12 Badmissionen | Glanzpilot |
| Allroundonaut | 5 Kategorien mit mindestens 1 Mission | 6 frei gewählte Kategorien mit mindestens 1 Mission | Allroundonaut |
| Im Rhythmus | 4 persönliche Zielwochen | 5 persönliche Zielwochen | Polarstern |

Der Starter bleibt sofort verfügbar. Komet kostet künftig 350 statt 300 Sterne (+16,7 %). Sonnenheld benötigt Level 9 statt 8: 4.000 statt 3.500 XP (+14,3 %). Beide sind nach dem erstmaligen Freischalten dauerhaft und ohne erneute Belastung nutzbar. Die sieben übrigen Anzüge werden ausschließlich über ihre Meilensteine freigeschaltet.

„Erster Einsatz“ soll den ersten echten Abschluss würdigen. Teamgeist bleibt zu zweit erreichbar, damit Paare keine dritte Person benötigen. Im Solohaushalt wird Teamgeist weiterhin nicht als nächstes Ziel vorgeschlagen.

## Raumstation

| Modul | Bisherige Crew-Zielwochen | Neue Crew-Zielwochen |
| --- | ---: | ---: |
| Pflanzenecke | 1 | 1 |
| Roboterhelfer | 2 | 2 |
| Aussichtskuppel | 3 | 3 |
| Werkstatt | 5 | 6 |
| Solardeck | 8 | 9 |
| Andockbucht | 12 | 14 |

Beim ersten Zugriff auf einen bisherigen Spielstand wird ausschließlich für bereits erreichte Stationsmodule die alte Schwelle beibehalten. Beispiel: Nach acht erfolgreichen Wochen bleiben Werkstatt und Solardeck zugänglich; die noch gesperrte Andockbucht benötigt künftig vierzehn Wochen. Die angezeigten Modulvoraussetzungen entsprechen den tatsächlich geltenden Schwellen.

Dies wird einmalig als `game.legacyStationStage` (0 bis 6) im bestehenden Crew-Dokument gespeichert. Neue Crews starten mit 0. Alte Sicherungen ohne dieses Feld werden entsprechend übernommen, neue Sicherungen enthalten es. Keine SQL-Migration. Der Übergang verwendet dieselbe Transaktions- und Revisionsprüfung wie andere Fortschrittsänderungen. Eine tatsächliche Rücknahme darf den Stationsausbau weiterhin korrigieren; kosmetische Erfolge bleiben wie bisher dauerhaft.

## Geprüfte Plausibilität

- **Eindeutige Leistung:** Für Kategorien zählt die Kategorie des bestätigten Abschlusses, unabhängig von Raum oder Symbol. Krümelkommandant und Gartenpilot verwenden jetzt denselben belegten Karrierefortschritt wie die übrigen Kategoriezielsetzungen. Pflanzenpflege in der Küche zählt ausschließlich als Pflanzenpflege. Eindeutig rekonstruierbare alte Abschlüsse und archivierte Aufgaben zählen mit; unbekannte Kategorien werden nicht erfunden.
- **Tatsächliche Arbeit:** Eine Aufgabenrunde zählt einmal. Teilschritte, Timerablauf, Überspringen, Questbonus, Sterneneinzahlung und Wunschkäufe erzeugen keine zusätzlichen Missionen. Kinderleistungen mit Freigabe zählen erst nach deren Bestätigung. Spätere Bearbeitungen ändern die damalige Leistung nicht.
- **Faire Korrekturen:** Rücknahmen reduzieren die zutreffenden Kategorie-, Gesamt- und Wochenwerte. Verdiente Abzeichen, Titel und Anzüge bleiben erhalten. Bei einem bereits verdienten Erfolg unterhalb der aktuellen Schwelle erklärt die Detailansicht den Bestandsschutz.
- **Erreichbare Vielfalt:** Albert benötigt fünf von sieben Kategorien, Allroundonaut sechs von sieben. Keine bestimmte zusätzliche Kategorie wird vorgeschrieben. Allroundonaut belohnt erste Vielfalt, Albert wiederholten Einsatz in mehreren Bereichen.
- **Nachvollziehbare Zeiträume:** Bei angenommenen zehn bestätigten Missionen pro Woche liegen Harry bei ungefähr acht Wochen und Kehrminator bei etwa achtzehn Wochen. Bei fünf pro Woche ergeben sich etwa fünfzehn bzw. fünfunddreißig Wochen. Das sind Rechenbeispiele, keine gemessenen Nutzungsdaten. Eine Badmission pro Woche benötigt für Helene jetzt dreißig statt fünfundzwanzig Wochen; zwei pro Woche etwa fünfzehn. Die Erhöhung bleibt auf fünf zusätzliche Badmissionen begrenzt.
- **Kein Zeitdruck:** Persönliche und gemeinsame Ziele bleiben anpassbar; es gibt keine Pflicht zu aufeinanderfolgenden Tagen oder Wochen. Der letzte neue persönliche Wochenorden benötigt zwölf erfolgreiche Wochen, die vollständige neue Station vierzehn Crew-Zielwochen. Mehrere Missionen an einem Tag verkürzen diese Wochenhürden nicht.
- **Übersicht:** Weiterhin zwölf Meilensteine in einer kompakten Sammlung und nun zehn besondere Abzeichen in der bestehenden zweispaltigen Galerie. Eine nächste Zielkarte, vier Hauptreiter und der vorhandene Spind bleiben die Navigation. Detailfortschritte zu Albert erscheinen nur nach Antippen.

Missionspunkte und persönliche Wunschpreise bleiben bestehende, anpassbare Werte; sie sind keine neue Freischalthürde. Sehr hoch eingestellte Aufgaben-XP können den Levelanzug schneller erreichbar machen. Die Beispiele setzen normale, ehrlich abgeschlossene Haushaltsaufgaben voraus; Putzonaut ist kein manipulationssicherer Wettbewerb.

[Automatisierte Prüfungen und offene Gerätetests](QA-0.12.md) · [Motive und vollständige Bildprompts](art-0.12-prompts.md)
