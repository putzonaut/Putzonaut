# Putzonaut · Web-App 0.10.0

Putzonaut macht Haushaltsaufgaben zu gemeinsamen Missionen – für Familien, Paare, WGs und Einzelhaushalte. Jede Crew hat eigene Mitglieder, Aufgaben, Belohnungen und Fortschritte.

**Web-App:** https://putzonaut-test.denny-subke.chatgpt.site

Die Versionsnummer steht unten im Profil. Der Kopfbereich bleibt ohne Versionszeile; die Korrektur des runden Profilbilds aus 0.6.1 bleibt erhalten.

## Putzrunden und gemeinsame Wünsche in Version 0.10

- **Geführte Putzrunde:** Auf der Basis 5, 10 oder 20 Minuten auswählen. Bis zu drei eigene oder freie offene Missionen passen zusammen in das Zeitbudget. Die Runde zeigt jeweils eine Aufgabe mit der vorhandenen Checkliste, anschließend die nächste und am Ende bestätigte XP, Sterne und den tatsächlichen Stationsfortschritt. Pro Profil bleibt eine laufende oder zuletzt beendete Runde gespeichert. Eine neue Runde ersetzt die vorherige Zusammenfassung.
- **Optionaler Timer:** Standardmäßig ohne Zeitdruck, auf Wunsch einschaltbar und pausierbar. Der Server speichert Start und verbrauchte Zeit; Tabwechsel oder Neuladen setzen den Timer nicht zurück. Ablauf und Überspringen erledigen keine Aufgabe und vergeben keine Punkte. Eine Runde kann jederzeit beendet werden; übrige Aufgaben bleiben offen.
- **Routinen:** Unter Missionen → Routinen kann der Captain bis zu zwölf Abläufe mit jeweils ein bis drei vorhandenen Aufgaben in eigener Reihenfolge speichern, bearbeiten oder entfernen. Ideen wie „Küche nach dem Essen“ verwenden vorhandene Missionen. Der manuelle Start nimmt nur aktuell verfügbare eigene oder freie Aufgaben mit. Es gibt keine neuen Aufgaben, zusätzlichen Punkte oder automatischen Abschlüsse.
- **Raumkarten:** Missionen → Räume zeigt offene Aufgaben, wartende Kinderfreigaben, Pausen, leere Räume und einen aktuell erledigten Plan. Die nächste eigene oder freie Mission lässt sich direkt öffnen. Fremde Zuständigkeiten werden mitgezählt, aber nicht als eigener Einstieg angeboten. Die Karten bilden den Aufgabenplan ab, keine automatisch gemessene Sauberkeit.
- **Gemeinsamer Wunsch:** Unter Beute startet der Captain einen gemeinsamen Wunsch mit festem Titel und Sternenziel. Jedes Profil kann freiwillig vorhandene Sterne einzahlen und den eigenen Beitrag bis zur Einlösung zurücknehmen. Beiträge werden sofort vom persönlichen Guthaben abgezogen. Bei voller Kasse löst der Captain genau einmal für alle ein, ohne weitere Belastung. Abbrechen erstattet alle Beiträge; gemeinsame Einlösungen sind für die gesamte Crew sichtbar. Persönliche Wünsche bleiben nutzbar.
- **Kleine Animationen:** Der Putzonaut reagiert beim Start und Abschluss; neue Abzeichen und die Station werden kurz hervorgehoben. Profil → „Kleine Animationen“ schaltet Bewegungen ab. Die Geräteeinstellung „Bewegung reduzieren“ hat Vorrang. Die vier Hauptreiter bleiben Basis, Missionen, Crew und Beute.

Putzrunden speichern die ursprüngliche Aufgabenrunde. Tageswechsel, geänderte Zuständigkeiten, Pausen und Archivierung ersetzen keine Mission unbemerkt. Kinderleistungen zählen erst nach erforderlicher Freigabe; Rücknahmen korrigieren auch die Rundenzusammenfassung. Für abgeschlossene Aufgaben gibt es ausschließlich die bisherigen normalen Punkte und gegebenenfalls bestehende Questboni. Die Zusammenfassung weist die normalen Missionspunkte aus.

Die Wunschkasse und das persönliche Guthaben werden gemeinsam mit dem Logbuch atomar geändert. Wiederholte Anfragen belasten nicht doppelt, parallele Beiträge überfüllen das Ziel nicht, persönliche Ausgaben können dieselben Sterne nicht erneut verwenden. Verlassen oder Entfernen eines Profils erstattet offene Beiträge an dessen bisheriges Profil; sie werden nicht in eine neue Crew übertragen. Auch vollständig zurückgenommene Beiträge hinterlassen keine ungültigen Mitgliedsverweise. Eine Rücknahme einer bereits abgeschlossenen Mission korrigiert das persönliche Guthaben und kann dieses negativ machen; der schon gebuchte Wunschbeitrag bleibt separat erhalten.

Sicherungen enthalten Rundenzustand, Routinen, Bewegungspräferenz, offene Wunschbeiträge, gemeinsame Einlösungen und Buchungen. Alte Sicherungen bleiben gültig. Bestehende Crew-Daten benötigen keine zusätzliche SQL-Migration. Änderungen erfordern weiterhin eine Onlineverbindung. [Prüfstand 0.10](docs/QA-0.10.md).

## Einstieg

Die Einrichtung führt durch Haushaltstyp, Crew-Namen und einzeln auswählbare Aufgabenvorlagen. Vor dem Start erscheint eine Zusammenfassung. Alle Profile beginnen mit 0 Sternen, 0 XP und einer leeren Historie. Wochenziel und Belohnungen lassen sich anschließend anpassen. Bestehende Crews aus Version 0.2 behalten ihre Daten.

Einladungslinks oder Codes können vor dem Beitritt geprüft werden. Sie gelten einmalig und sieben Tage. Die Vorschau zeigt nur Crew-Name, Haushaltstyp, Anzahl der Mitglieder und Ablaufdatum. Ein Konto gehört aktuell genau einer aktiven Crew an; jede Crew umfasst höchstens zwölf aktive Profile.

## Crew-Verwaltung

- Ein Captain verwaltet Missionen, Wünsche, Einladungen und Mitglieder.
- Die Captain-Rolle kann an ein anderes aktives Mitglied mit eigenem Konto übertragen werden. Der bisherige Captain bleibt normales Mitglied.
- Mitglieder können austreten; der Captain kann Mitglieder entfernen. Offene Zuständigkeiten werden freigegeben. Bereits erzielte Leistungen, Wochenbeiträge und Logbucheinträge bleiben der bisherigen Crew erhalten. Eine neue Crew beginnt wieder mit null Punkten.
- Kinderprofile benötigen weder E-Mail-Adresse noch eigenes Konto. Das anlegende Mitglied begleitet das Profil; der Captain kann die Begleitung übertragen. Nur diese Begleitperson und der Captain dürfen Aktionen für das Kind ausführen. Missionen, Sterne, Wünsche und Ausrüstung werden dem Kinderprofil zugeordnet; das Logbuch nennt bei Leistungen zusätzlich die Begleitperson.
- Die begleitete Ansicht kennzeichnet das aktive Kinderprofil deutlich und bietet den Rückweg zum eigenen Profil. Sie ist **kein gesperrter Kindermodus und keine eigenständige Kinderanmeldung**. Das Gerät bleibt beim Konto des Erwachsenen angemeldet. Crew-Verwaltung ist in der begleiteten Ansicht serverseitig gesperrt.
- Vor dem Austritt oder Entfernen einer Begleitperson müssen deren aktiven Kinderprofile einer anderen Person zugeordnet werden.
- Der Captain kann eine Crew nach Eingabe ihres Namens schließen. Alle Zugänge enden; die Crew wird archiviert. Die App bietet derzeit keine Wiederherstellung. Schließen und Entfernen sind **keine Datenlöschung**.
- Rollenübergabe, Austritt, Entfernen und Schließen widerrufen offene Einladungen. Neue Einladungen können bei einer aktiven Crew anschließend erstellt werden.

## Weitere Funktionen

- Einmalige, tägliche, wöchentliche und monatliche Missionen; ausgewählte Wochentage und Abstände von 1 bis 12 Wochen.
- Heute, überfällige Missionen, nächste Termine, erledigte Runden und Pausen; Filter für die aktuelle eigene Zuständigkeit und Räume.
- Wöchentlicher Zuständigkeitswechsel, Aufgabenpausen, optionale Freigabe für Kinder und nachvollziehbare Rücknahmen.
- XP, Level, Sterne, dauerhaft freigeschaltete Outfits und gemeinsame Wochenziele.
- Eigene Wünsche, bestätigtes Einlösen und Markieren erfüllter Belohnungen.
- Logbuch mit älteren Einträgen und nachvollziehbaren Änderungen der Crew.
- Synchronisierung alle 15 Sekunden, beim Zurückkehren und nach eigenen Änderungen. Offline werden keine Änderungen bestätigt.
- Vollständige Crew-Sicherung mit Profilen, Punkten, Aufgaben, offenen Freigaben, Wünschen, Raumstation und dem gesamten Logbuch. Wiederherstellung im Profil mit Vorschau und automatischem Rücksprungpunkt; genaue Grenzen unten. Der bisherige Export-Endpunkt (Format 5) bleibt für vorhandene Nutzer verfügbar, ist aber nicht importierbar.

## Wunschideen und besondere Abzeichen in Version 0.9

- 16 anpassbare Wunschideen für jede Haushaltsart (Familie, Paar, WG und solo), insgesamt 64 statt 16. Kleine Wünsche beginnen bei 60 Sternen; größere gemeinsame Erlebnisse reichen bis 500 Sterne. Zunächst erscheinen drei Ideen, die vollständige Auswahl bietet Suche und einen Sternefilter. Bereits vorhandene gleichnamige Wünsche werden ausgeblendet. Eine Auswahl öffnet den bekannten Editor; Name und Sterne bleiben frei anpassbar. Bestehende Wünsche werden nicht verändert oder ungefragt angelegt.
- Sieben eigenständig illustrierte Abzeichen ergänzen die zwölf bisherigen Meilensteine. Die Namen sind lesbarer Oberflächentext; die transparenten Medaillen zeigen den bestehenden Putzonaut-Charakter mit passenden Kostümen und Werkzeugen.
- Im Profil wechseln „Nächste Ziele“, „Abzeichen“ und „Alle“ zwischen drei erreichbaren Zielen, den sieben besonderen Abzeichen und allen 19 Erfolgen. Auf der Basis bleibt genau ein nächstes Ziel; auch ein besonderes Abzeichen lässt sich dafür auswählen.
- Freigeschaltete Abzeichen können unmittelbar auf der Erfolgsseite und in der Sammlung getragen werden. Das ändert nur das Abzeichen und kostet keine Sterne; persönliches Wochenziel, Titel und Anzug bleiben erhalten. Sie erscheinen am Avatar und im Profil.

| Abzeichen | Bestätigte Leistung | Motiv |
| --- | --- | --- |
| Franz Beckenkehrer | 20 Missionen der Kategorie Aufräumen | Fußballkapitän mit Krone und Besen |
| Kehrminator | 150 Missionen insgesamt | Freundlicher silberner Putzcyborg |
| Jürgen Cleansman | 30 Missionen der Kategorie Küche | Sportlicher Coach mit Schwamm und Fußball |
| Helene Wischer | 25 Missionen der Kategorie Bad | Violetter Bühnenstar mit Wischmikrofon |
| George Cleaney | Acht erreichte persönliche Zielwochen | Eleganter Smoking und Poliertuch |
| Otto von Wischmark | 40 Missionen der Kategorie Haushalt | Verspielter Admiral mit Schnurrbart und Wischstab |
| Roberto Blanko | 30 Missionen der Kategorie Wäsche | Weißer Showanzug mit Bürstenmikrofon und Schaum |

Bestehende belegte Kategorieleistungen und Gesamtabschlüsse zählen mit. Bereits in 0.8 gespeicherte persönliche Zielwochen zählen ebenfalls; die acht Wochen müssen nicht aufeinanderfolgen. Es werden weiterhin keine unbekannten historischen Wochenziele erfunden. Nachträglich erreichte Abzeichen werden beim Lesen einmalig dauerhaft gespeichert. Kinderleistungen zählen erst nach einer erforderlichen Freigabe. Korrekturen reduzieren den Fortschritt, bereits verdiente Abzeichen bleiben erhalten. Sicherungen übernehmen Abzeichen, Auswahl und Fortschritt ohne neue SQL-Migration.

[Prüfstand 0.9](docs/QA-0.9.md) · [Abzeichengalerie und vollständige Imagegen-Prompts](docs/art-0.9-prompts.md)

## Meilensteine und Spind in Version 0.8

Zwölf Meilensteine und zehn Anzüge geben kurzfristige und längerfristige Ziele. Die Basis ersetzt die kompakte Levelanzeige durch genau ein nächstes Ziel mit verbleibenden Missionen. Im Profil und bei noch gesperrten Meilenstein-Anzügen lässt sich ein eigenes Ziel wählen; nach Erreichen folgt automatisch das nächste passende. Bei Einzelhaushalten wird Teamgeist nicht als nächstes Ziel vorgeschlagen.

| Neuer Meilenstein | Voraussetzung | Belohnung |
| --- | --- | --- |
| Staubbezwinger | 50 bestätigte Missionen insgesamt | Titel und Abzeichen |
| Haushaltsheld | 100 bestätigte Missionen insgesamt | Galaxiekapitän in Dunkelblau/Gold |
| Waschonaut | Zehn bestätigte Wäschemissionen | Waschonaut in Eisblau |
| Glanzpilot | Zehn bestätigte Badezimmermissionen | Glanzpilot in Türkis |
| Allroundonaut | Bestätigte Missionen aus fünf verschiedenen Kategorien | Allroundonaut in Orange/Violett |
| Im Rhythmus | Persönliches Wochenziel in vier beliebigen Wochen erreicht | Polarstern in Weiß/Eisblau |

- Der Spind trennt **Meine Anzüge** und **Entdecken**. Meilensteine zeigen zuerst höchstens drei nächste Ziele; die vollständige Sammlung erscheint auf Wunsch. Die vier Hauptreiter bleiben bestehen.
- Neu erreichte Meilensteine erscheinen nach einem direkten Abschluss auf der Erfolgsseite. Neue Anzüge können dort unmittelbar und ohne Sternenkosten angezogen werden. Bei einer Kinderfreigabe erhält die Begleitperson die Freischaltungsmeldung; der Anzug liegt anschließend im Spind des Kindes.
- Gesamtabschlüsse zählen unverändert weiter. Wäsche, Bad und Kategorienvielfalt übernehmen beim ersten Zugriff alle eindeutig belegten, nicht zurückgenommenen Abschlüsse aus dem gesamten Logbuch, auch archivierter Aufgaben. Unklare alte Kategorien werden nicht erraten. Vorlagen speichern ihre Kategorie; eigene Missionen bieten eine eingeklappte Kategorieauswahl, unabhängig vom Raum.
- Persönliche Wochenziele wurden früher nicht historisch gespeichert. Ihre neue Wochenzählung beginnt daher beim ersten Zugriff mit 0.8 und berücksichtigt bereits bestätigte Abschlüsse der laufenden Woche. Es wird kein früheres Wochenziel erfunden. Änderungen gelten für die laufende Woche; vergangene Wochen behalten ihr damaliges Ziel. Vier Zielwochen müssen nicht aufeinanderfolgen, es gibt keinen Serienverlust bei Pausen.
- Kinderabschlüsse zählen erst nach einer erforderlichen Freigabe. Kategorien stammen aus der damaligen Aufgabenmeldung und bleiben bei späterem Bearbeiten unverändert. Rücknahmen berichtigen Zähler und historische Zielwochen. Bereits verdiente kosmetische Freischaltungen bleiben erhalten.
- Die Raumstation wächst auf sechs Ausbauten: Pflanzenecke nach 1, Roboterhelfer nach 2, Aussichtskuppel nach 3, Werkstatt nach 5, Solardeck nach 8 und Andockbucht nach 12 erreichten Crew-Zielwochen. Frühere Stationserfolge zählen mit. Die Illustration zeigt den tatsächlichen Freischaltungsstand; Rücknahmen können den Ausbau entsprechend korrigieren.
- Sicherungen enthalten auch die neuen Fortschritte, historischen persönlichen Ziele und das gewählte nächste Ziel. Sicherungen im Format von 0.7 bleiben wiederherstellbar und erhalten danach dieselbe belegbasierte Übernahme. Es ist keine neue SQL-Migration erforderlich.

[Prüfstand 0.8](docs/QA-0.8.md) · [Bildquellen und vollständige Prompts](docs/art-0.8-prompts.md)

## Einfach loslegen in Version 0.7

- Auf der Basis steht zuerst die Frage „Wie viel Zeit hast du?“. 5, 10 oder 20 Minuten ergeben bis zu drei passende, aktuell offene Aufgaben. Eine Mission wird deutlich hervorgehoben; „Andere Mission“ wechselt durch die Vorschläge. „Loslegen“ öffnet die gewohnte Aufgabenansicht mit Checkliste und Abschluss.
- Es zählen die geschätzten Minuten für die ganze Aufgabe. Eigene Zuständigkeiten werden bevorzugt, danach überfällige und freie Aufgaben. Fremd zugeteilte, pausierte, erledigte, zur Freigabe gemeldete und zukünftige Runden werden nicht vorgeschlagen – auch nicht für Captains. Der Kurzstart vergibt keine Zusatzpunkte und meldet nichts automatisch als erledigt.
- Die Basis zeigt höchstens zwei weitere verfügbare Aufgaben. Level, Raumstation und vorhandene Ziele bleiben erreichbar, während die ausführlichen Einstellungen im Profil bzw. in den Missionen liegen. Die vier Hauptreiter bleiben unverändert.
- 45 anpassbare Tätigkeiten statt bisher sechs: Küche, Bad, Wäsche, Aufräumen, allgemeiner Haushalt, Pflanzen/draußen und Haustiere. Suche und Kategorieauswahl grenzen die Vorlagen ein; zunächst erscheinen acht, weitere auf Wunsch. Aufgaben mit mehreren Arbeitsschritten bringen eine editierbare Checkliste mit.
- Bestehende Crews erhalten keine automatisch hinzugefügten Aufgaben. Der Einstieg bietet weiterhin nur die sechs bekannten Startervorlagen, einzeln abwählbar.

## Sicherung und Wiederherstellung

Unter **Profil → Sichern & wiederherstellen** lädt der Captain eine JSON-Datei herunter. Sie enthält alle fachlichen Crew-Daten einschließlich des vollständigen Logbuchs und ausgeschiedener Profile, jedoch keine Konto-IDs, Anmeldedaten oder Einladungsschlüssel. Maximal 8 MB und 10.000 Logbucheinträge; größere Sicherungen werden ausdrücklich abgebrochen und nie gekürzt.

Die Datei lässt sich in **derselben noch bestehenden Crew** wiederherstellen, solange Mitglieder, Rollen und Kinderbegleitungen unverändert sind. Vorschau und Bestätigung mit dem Crew-Namen gehen dem Ersetzen voraus. Punkte, Missionen, Wünsche und Logbuch werden gemeinsam zurückgesetzt. Neuere Änderungen werden dabei verworfen. Offene Einladungen werden widerrufen, bestehende Konto-Zuordnungen bleiben erhalten. Ältere Exporte bis Version 0.6 lassen sich nicht importieren.

Unmittelbar vor jeder Wiederherstellung wird der aktuelle Crewstand einschließlich Logbuch in derselben Datenbanktransaktion als Rücksprungpunkt gespeichert. Er kann heruntergeladen und über dieselbe Vorschau wieder eingespielt werden. Es gibt **einen** Rücksprungpunkt je Crew; die nächste Wiederherstellung ersetzt ihn. Ändert jemand die Crew nach der Vorschau, wird das Einspielen abgewiesen. Veraltete Browseranfragen werden nach einer Wiederherstellung ebenfalls abgewiesen, bis die Ansicht aktualisiert wurde.

Die Prüfsumme erkennt beschädigte oder veränderte Dateien; sie ist keine digitale Signatur. Die Wiederherstellung ist eine ausschließlich dem aktuell berechtigten Captain erlaubte Änderung. Dateien anderer Crews, ungültige Daten und geänderte Berechtigungsstände werden abgewiesen.

Das ist kein Backup der gesamten Plattform und keine Kontowiederherstellung: Eine geschlossene oder gelöschte Crew sowie verlorene Konto-Zuordnungen lassen sich damit nicht neu anlegen. Der Betreiber benötigt zusätzlich eine vollständige Datenbanksicherung außerhalb dieser Datenbank. Das wird vor dem öffentlichen Betrieb und dem späteren Serverumzug ergänzt.

Die additive Migration `0001_bent_manta.sql` legt nur die zwei Tabellen für den Rücksprungpunkt an. Vorhandene Crew-Daten und bisherige Migrationen werden nicht verändert. [Prüfablauf und offene Gerätetests](docs/QA-0.7.md).

## Alltag und Übersicht in Version 0.6

- Die Sieben-Tage-Ansicht zeigt offene und kommende Aufgabenrunden mit der am jeweiligen Tag geltenden Zuständigkeit, einschließlich des Wechsels am Montag. Jede offene Runde erscheint einmal am ersten möglichen Tag; Wochenaufgaben bleiben bis Sonntag erledigbar. Bereits erledigte Runden stehen weiterhin in der Listenansicht. Zukünftige Runden lassen sich ansehen, aber nicht vorzeitig abhaken.
- Vier feste Standardbereiche werden um bis zu 20 eigene Bereiche ergänzt. Der Captain vergibt Namen und eines von zwölf Symbolen. Umbenennen aktualisiert die zugeordneten Aufgaben, nicht frühere Logbucheinträge. Ein eigener Bereich kann entfernt werden, wenn keine aktiven Missionen mehr zugeordnet sind.
- Missionen können bis zu zwölf Teilschritte enthalten. Die Checkliste gehört zur jeweiligen Aufgabenrunde und ist für die Crew sichtbar; ändern dürfen sie zuständige Profile und der Captain. Einzelne Schritte vergeben keine Punkte. Erst der vollständige Abschluss schreibt XP und Sterne dem abschließenden Profil gut, bei Kinderfreigaben nach Bestätigung.
- Wiederholungen beginnen mit leeren Checklisten. In offenen Runden bleiben unveränderte Schritte bei einer Bearbeitung erhalten; neue oder umbenannte Schritte sind wieder offen. Gemeldete Kinderaufgaben und erledigte Runden behalten ihre ursprüngliche Checkliste. Veraltete Anfragen nach Bearbeiten oder Zurücknehmen werden abgewiesen. Die Korrektur einer alten Runde verändert keine Checkliste einer neueren Runde.
- Die Suche berücksichtigt Titel, Bereiche und Teilschritte. Bereichsfilter und „Meine Aufgaben“ lassen sich kombinieren; im Wochenplan gilt die geplante Zuständigkeit des jeweiligen Tages.
- Aufgabenvorlagen sind jederzeit über „Missionen → Vorlagen“ erreichbar und vor dem Anlegen editierbar. „Mission duplizieren“ übernimmt die Definition mit frischen Teilschritten und Startdatum heute; Zuständigkeit, Rotation, Pause und bisherige Abschlüsse werden nicht kopiert. Kinderfreigabe und Punkte bleiben als editierbare Einstellungen erhalten.
- Nach einem direkten Abschluss führt „Rückgängig“ ohne Umweg ins Logbuch zur vorhandenen Rücknahmebestätigung. Punkte und mögliche Questboni werden weiterhin nachvollziehbar korrigiert. Für spätere Korrekturen bleibt das Logbuch verfügbar.
- Exportformat 5 enthält zusätzlich Bereiche, Teilschritte und ihren aktuellen Rundenzustand. Bestehende Daten werden ohne SQL-Migration und ohne Zurücksetzen weitergeführt.

## Raumstation und Motivation in Version 0.5

- Die gemeinsame Raumstation erhält für jede erreichte Zielwoche einen Ausbau: Pflanzenecke, Roboterhelfer, Aussichtskuppel. Eine Woche zählt genau einmal. Änderungen am gemeinsamen Wochenziel gelten ab dem nächsten Montag; der aktuelle Zielwert bleibt bestehen. Rücknahmen korrigieren auch frühere Zielwochen und damit die Station. Frühere Wochen vor Einführung der Station werden nicht rekonstruiert.
- Der Captain verbindet ein bis fünf verfügbare Aufgaben zu einer Wochenquest. Sobald alle einmal in dieser Woche bestätigt wurden, erhält jedes beteiligte Profil genau **20 Bonussterne**, ohne zusätzliche XP oder Missionszählung. Wiederholte Abschlüsse erzeugen keinen weiteren Bonus für dasselbe Profil in derselben Woche. Bestätigungszeitpunkt und Europe/Berlin bestimmen die Woche; eine verspätete Kinderfreigabe zählt in der Freigabewoche.
- Bereits bestätigte, eindeutig zuordenbare Abschlüsse derselben Woche zählen beim Anlegen mit. Nach der ersten Bonusvergabe bleibt die Questauswahl für diese Woche fest. Beim optionalen Neustart am Montag entfallen archivierte, die ganze Woche pausierte oder bereits in früheren Wochen erledigte Runden ohne neue Fälligkeit. Teilweise pausierte Aufgaben bleiben wählbar, wenn eine Runde in der Woche möglich ist.
- Eine Rücknahme berechnet die Quest neu: Wird sie unvollständig, werden ihre Bonussterne bei allen Beteiligten zurückgebucht. Bleibt sie durch andere Abschlüsse vollständig, verliert nur ein nicht mehr beteiligtes Profil seinen Bonus. Erneutes Erfüllen stellt den Bonus wieder her, ohne ihn zu vervielfachen. Bereits eingelöste Wünsche bleiben erhalten; ein negatives Sterneguthaben wird mit späteren Sternen ausgeglichen.
- Jedes Profil kann einen bestehenden Wunsch als Sparziel anheften. Angezeigt wird das aktuelle Sterneguthaben, kein getrenntes Sparkonto. Änderungen am Wunsch aktualisieren das Ziel; Einlösen oder Archivieren entfernt die Verknüpfung. Familien, Paare, WGs und Einzelhaushalte erhalten jeweils passende, vor dem Anlegen editierbare Wunschvorschläge.
- Fünf Pflanzenmissionen schalten den grünen Gartenpilot-Anzug frei; 25 bestätigte Missionen den violetten Nebelläufer. Dazu kommen auswählbare Titel und Abzeichen. Gesamtabschlüsse berücksichtigen bestehende Leistungen; Küchen- und Pflanzenzähler starten mit Version 0.5. Einmal erreichte kosmetische Freischaltungen bleiben auch bei späteren Rücknahmen erhalten.
- Ein persönliches Wochenziel von 1 bis 30 Missionen unterstützt das eigene Tempo, unabhängig vom Crew-Ziel und ohne Extra-Punkte. Beim Erstellen oder Bearbeiten einer Aufgabe schlägt die App XP und Sterne aus Dauer und Aufwand vor. Der Captain übernimmt den Vorschlag ausdrücklich oder setzt eigene Werte.
- Exportformat 4 enthält zusätzlich Wochenfortschritt, Quests, Freischaltungen und Sparziele. Es ersetzt weiterhin kein vollständiges Backup.

## Planung und Punkte seit Version 0.4

- Kalender und Wochenwechsel richten sich nach **Europe/Berlin**. Tägliche Runden beginnen um Mitternacht. „Jede Woche“ ist eine Runde von Montag bis Sonntag. Ausgewählte Wochentage und Wochenabstände sind ab ihrem Termin fällig; Monatsangaben wie der 31. fallen in kürzeren Monaten auf den letzten Tag. Das Startdatum begrenzt neue Serien, bei Wochenrunden auf die Startwoche.
- Pro Aufgabe ist jeweils die jüngste Runde offen. Eine verpasste wiederkehrende Runde bleibt bis zur nächsten Runde überfällig; es entsteht keine unbegrenzte Nachholliste. Einmalige Aufgaben bleiben bis zum Abschluss offen. Bestehende tägliche und wöchentliche Abschlüsse und Punkte bleiben kompatibel; alte optionale Datumsangaben wiederkehrender Aufgaben werden durch deren regulären Rhythmus ersetzt.
- Bei Rotation zählt die Reihenfolge der gewählten Mitglieder. Beginn ist die Woche, in der eine neue Reihenfolge gespeichert wird; danach wechselt die Zuständigkeit jeden Montag, unabhängig davon, ob eine Mission erledigt wurde. Entfernte Profile scheiden aus der Reihenfolge aus. Der Captain kann weiterhin einspringen. „Meine Aufgaben“ zeigt die aktuelle Einteilung, einschließlich der Vorschau für diese Aufgaben.
- Pausen gelten pro Aufgabe, ab einem Datum bis **einschließlich** Enddatum oder bis zur manuellen Fortsetzung. Währenddessen sind Abschlüsse gesperrt. Nach einer Pause startet die nächste reguläre Runde; frühere Runden werden übersprungen. Einmalige Aufgaben bleiben erhalten. Bereits verdiente Punkte werden durch Pausen nicht entfernt.
- Die optionale Kinderfreigabe wird pro Aufgabe aktiviert. Eine Meldung reserviert die Runde, vergibt aber keine Punkte. Begleitperson oder Captain bestätigt oder gibt sie wieder frei; das Kind kann eine offene Meldung zurückziehen. Dazu muss die erwachsene Person in ihr eigenes Profil wechseln. Es handelt sich weiterhin um ein begleitetes Profil auf dem Konto des Erwachsenen. Freigaben zählen zum Wochenziel der **Freigabewoche**. Offene Meldungen älterer Runden bleiben einzeln bearbeitbar; beim Entfernen eines Kinderprofils werden seine offenen Meldungen verworfen.
- Seit Version 0.4 protokollierte Abschlüsse lassen sich im **Profil → Logbuch** zurücknehmen: eigene Abschlüsse, als Begleitperson die des Kindes, als Captain alle. Freigegebene Kinderabschlüsse können nicht aus der Kinderansicht zurückgenommen werden. XP, Sterne und Zähler werden einmalig korrigiert. Eine Rücknahme einer früheren Woche ändert das aktuelle Wochenziel nicht und öffnet keine spätere bereits erledigte Runde erneut.
- Bereits eingelöste Wünsche und freigeschaltete Ausrüstung bleiben erhalten. Nach einer Rücknahme kann ein Sternestand deshalb negativ werden; neue Sterne gleichen ihn aus. Weitere Einlösungen benötigen wieder genügend Guthaben. Alte Logbucheinträge vor 0.4 ohne eindeutige Aufgabenreferenz bleiben lesbar, sind aber nicht rücknehmbar.
- Neue Datenfelder benötigen keine SQL-Migration. Freigaben, Punkte und Logbucheinträge werden zusammen gespeichert; doppelte Rücknahmen sind über einen eindeutigen Ereignisschlüssel abgesichert.

## Entwicklungsstand und öffentliche Nutzung

Die aktuelle Website bleibt eine private Entwicklungsveröffentlichung. Erwachsene melden sich dort über ChatGPT an und benötigen zusätzlich Website-Zugriff. Eine Crew-Einladung ändert diese Freigabe nicht. Einladungen werden nicht automatisch versandt.

Das Produktziel ist eine unabhängig nutzbare Web-App. Eigene Anmeldung ohne ChatGPT, Kontolöschung, Kontowiederherstellung, unabhängige Betreiber-Backups, öffentlicher Betrieb und der Umzug auf eine eigene Domain sind noch vor dem öffentlichen Start umzusetzen. Dafür bleibt die Docker-/PostgreSQL-Grundlage im Hauptverzeichnis erhalten; sie enthält noch nicht die neuen Webfunktionen. Ein öffentlicher Zugang wird durch dieses Update nicht eingerichtet.

## Daten und Berechtigungen

Cloudflare D1 speichert versionierte Crew-Dokumente, eine Konto-Zuordnung und ein separates Logbuch. Änderungen prüfen Mitgliedschaft und Berechtigungen nach jedem konkurrierenden Zugriff erneut. Dokument, Punkte, Ereignis und gegebenenfalls das Entfernen der Konto-Zuordnung werden gemeinsam in einer D1-Transaktion geändert. Einmalige Anfrageschlüssel sichern Einlösungen gegen doppelte Belastung.

Der Server bindet eine Änderung an die ursprünglich gelesene Crew und Mitgliedschaft. Ein verspäteter Wiederholungsversuch darf nach Austritt und erneutem Beitritt nicht in eine andere Crew wechseln. Die UI sendet bei Änderungen zusätzlich die erwartete Crew. Das gewählte Kinderprofil ist nur eine Profil-ID, keine Authentifizierung: Jede Anfrage prüft die tatsächliche Konto-Identität und Begleitberechtigung.

Die zusätzlichen JSON-Felder sind abwärtskompatibel. Bestehende Dokumente werden beim Lesen ergänzt; keine SQL-Migration, kein Zurücksetzen der Daten. Bereits angewendete Migrationen bleiben unverändert.

## Entwicklung und Prüfung

```sh
npm ci
npm run typecheck
npm test
npm run build
```

152 automatisierte Prüfungen: 126 Integrationsfälle gegen Miniflare D1 und 26 Prüfungen für Planung, Auswahlregeln, Vorlagen, Punkte und Projektassets. Die 22 neuen Fälle prüfen Putzrunden, Timer, Routinen, Raumzustände, Kinderfreigaben, gemeinsame Wunschbeiträge mit konkurrierenden Zugriffen, Rückerstattungen, Profilgrenzen und Sicherungen. Alle 130 bisherigen Fälle bleiben erhalten.

Browserprüfungen erfolgen über die verwaltete Vorschau. Der lokale Modus simuliert keine ChatGPT-Anmeldung. Für 0.10 meldete die Vorschau einen laufenden Server, der bereitgestellte Browser erreichte die exakte Adresse jedoch nicht (`ERR_CONNECTION_REFUSED`). Die neuen Ansichten und Animationen sind noch nicht visuell im Browser abgenommen. Vollständige Anmeldung auf der veröffentlichten Website sowie reale Android-/iPhone-Geräte bleiben gesonderte Praxistests. Automatisierte API-Prüfungen ersetzen diese Gerätetests nicht.
