# Putzonaut · Web-App 0.22.1

Putzonaut macht Haushaltsaufgaben zu gemeinsamen Missionen – für Familien, Paare, WGs und Einzelhaushalte. Jede Crew hat eigene Mitglieder, Aufgaben, Belohnungen und Fortschritte.

**Web-App:** https://putzonaut-test.denny-subke.chatgpt.site

Die Versionsnummer steht unten im Profil. Der Kopfbereich bleibt ohne Versionszeile; die Korrektur des runden Profilbilds aus 0.6.1 bleibt erhalten.

## Website und App · Version 0.22.1

Die öffentliche Website (`putzonaut.de`) und die Smartphone-App (`app.putzonaut.de`) laufen gemeinsam in einem Docker-Container. Website-Port 3081 und App-Port 3080 bleiben getrennt. Der bevorzugte Installationsweg ist der [Umbrel Community Store](https://github.com/dennysubke/dennys-umbrel-app-store). Die Website nutzt lokale Schriften, einen scharfen App-Einblick, die animierte Raketenfigur und einen aus APP_ORIGIN erzeugten QR-Code. Details zur freigegebenen Gestaltung und Auslieferung stehen in [Website](docs/WEBSITE.md).

[Prüfstand 0.22](docs/QA-0.22.md) · [Installation](standalone/README.md)

## Eigene Konten · seit Version 0.21.0

Die aktuelle App kann mit eigenen Putzonaut-Konten betrieben werden: E-Mail und Passwort, Bestätigungslink, Passwort-Reset und widerrufbare Sitzungen. Nutzer benötigen im eigenständigen Betrieb kein ChatGPT. Docker-/Node-Server, SQLite, privater Fotospeicher und SMTP-Anbindung sind im Ordner `standalone/` enthalten.

[Einrichtung und tatsächlicher Umzug](standalone/README.md) · [Prüfstand 0.21](docs/QA-0.21.md). Die bestehende private Testseite behält ihre Sites-Zugangskontrolle. Domain, eigener Server, echte Mailzustellung und Transfer der bisherigen Daten werden separat eingerichtet.

## Flexibler im Alltag · Version 0.20.0

- **Schon erledigt!** erfasst zusätzliche spontane Aufgaben mit Titel, Dauer, Bereich und Aufwand. Die einmalige Mission erhält die üblichen Punkte; Kinderaufgaben warten immer auf Bestätigung. Gleichnamige offene Missionen verweisen auf die vorhandene Aufgabe und ihre Checkliste.
- **Heute passt nicht** verschiebt eine offene Aufgabenrunde auf morgen, das Wochenende oder ein eigenes Datum. Zuständigkeit und bisherige Häkchen bleiben an der Runde. Überlappende Termine werden zusammengefasst; danach gilt der bisherige Rhythmus. Das Verschieben selbst vergibt keine Punkte.
- **Update-Hinweis:** Eine neue Version lässt sich bewusst laden oder auf später verschieben. Offene Formulare, laufende Putzrunden, Speichervorgänge und vorgemerkte Abschlüsse sperren den Neustart. Andere offene Tabs werden nicht neu geladen.

[Prüfstand](docs/QA-0.20.md). Die Startsequenz bleibt bei insgesamt drei Sekunden.

## Kleine Raumlandung beim Start · Version 0.19.4

Beim frischen Öffnen schwebt der bekannte Putzonaut mit zwei leuchtenden Schubdüsen auf eine kleine Landeplattform. Eine Druckwelle, Staubwölkchen und wenige Partikel begleiten die federnde Landung; Sterne und eine Umlaufbahn rahmen die Szene ein. Danach erscheinen die Buchstaben des Logos nacheinander und das Visier glänzt kurz auf. Die Daten laden gleichzeitig; der Einstieg dauert insgesamt 3 Sekunden inklusive Ausblendung und wiederholt sich nicht beim Wechsel zwischen Ansichten oder beim Zurückkehren aus dem Hintergrund. Bei längerer Ladezeit bleibt das Motiv ruhig, Fehler und Wiederholen bleiben erreichbar. Die Profileinstellung wird für den nächsten Start auf diesem Gerät gemerkt; die Geräteoption für reduzierte Bewegung gilt zusätzlich. Online- und Offline-Einstieg verwenden denselben Ablauf.

[Prüfstand](docs/QA-0.19.md).

## Kleiner Visier-Wischer · Version 0.18.3

Tippe den Astronauten im Tagesabschluss oder in deiner Putzrunde an: Ein kleines Tuch wischt über das Visier, danach blitzt ein Glanzstern auf. Die Reaktion dauert 1,2 Sekunden und lässt sich auch mit Enter oder Leertaste auslösen. Bei ausgeschalteten Animationen oder reduzierter Gerätebewegung erscheint ausschließlich ein ruhiger Glanzstern.

## Saubere Astronauten-Pose · Version 0.18.2

Der kleine blaue Strich über dem sitzenden Astronauten im Tagesabschluss ist entfernt. Der sichtbare Ausschnitt blendet den Rest der benachbarten Pose aus; Größe, Position und Figur bleiben erhalten.

## Klarere Inhalte und erreichbare Startziele · Version 0.18.1

- Einrichtung und Profil erklären XP als Erfahrungspunkte für Level und Sterne als Guthaben für Wünsche und bestimmte Anzüge. Das Crew-Wochenziel wird sprachlich dem Stationsfortschritt zugeordnet; Wünsche werden unter Beute eingelöst.
- Die sechs Startvorlagen bleiben auswählbar. Vorausgewählt sind nur Spülmaschine einräumen und Müll rausbringen; ein Start ohne Vorlagen ist weiterhin möglich.
- Neue Crews erhalten ein zur Auswahl passendes Wochenziel. In der ersten, eventuell kurzen Woche wird es zusätzlich anteilig nach den verbleibenden Berliner Kalendertagen begrenzt. Beispiel: alle sechs Vorlagen am Freitag → 11 statt 24 Missionen bis Sonntag, danach 24 pro voller Woche. Bei nur einer wöchentlichen Vorlage bleibt das Ziel bei einer Mission. Ohne Vorlagen beginnt es mit der ersten selbst angelegten Mission; ein leeres Ziel erzeugt keinen Stationsfortschritt.
- Die Badvorlage benennt Waschbecken, Toilette und Badspiegel und enthält drei passende Schritte. Die Kühlschrankvorlage beschreibt alle Fächer und Ablagen.
- Vier Vorlagen verwenden jetzt dieselbe Punkteempfehlung wie neue eigene Aufgaben. Gespeicherte Missionen, manuelle Punkte, Guthaben und bestehende Crew-Ziele werden nicht nachträglich verändert.

Die Freischalthürden, vier Hauptreiter und ausschließlich elterlich verwalteten Kinderprofile bleiben erhalten. [Prüfstand](docs/QA-0.18.1.md).

## Weniger Eingaben verlieren · Version 0.18.0

- Missionensuche, Filter, Wochenplantag, weitere Listenansichten und Scrollpositionen bleiben beim Bereichswechsel erhalten. Browser-Zurück schließt zuerst offene Details. Die letzte Hauptansicht wird innerhalb der Browsersitzung wiederhergestellt.
- Ungespeicherte neue und bearbeitete Missionen lassen sich als Entwurf fortsetzen. Auch Kurzeingabe, unvollständige Zahlenfelder, eigene Punkte, Teilschritte und Notizen bleiben erhalten. Nur das Aufklappen von Optionen erzeugt keinen leeren Entwurf.
- Speichern und Mission erledigen bleiben am unteren Dialogrand erreichbar; Schließen bleibt oben griffbereit. Die sichtbare Bildschirmhöhe wird bei eingeblendeter Tastatur berücksichtigt. Speicherfehler bleiben sichtbar und erhalten den Entwurf.
- Die Basis zeigt die Anzahl offener eigener und freier Missionen mit geschätztem Zeitbedarf. Bereits bestätigte eigene Teamanteile und vorgemerkte Abschlüsse werden nicht erneut als offen gezählt.
- Nach einem bestätigten Abschluss erscheint der verbleibende Sternebedarf zum bereits gewählten Wunsch in der vorhandenen Erfolgsmeldung. Es entsteht kein zusätzlicher Dialog.

Ansichten und Entwürfe sind nach Konto, Crew, Profil und Wiederherstellungsstand getrennt. Entwürfe gelten sieben Tage, werden nach erfolgreichem Speichern entfernt und beim Abmelden gelöscht. Geänderte Missionsversionen werden vor dem Fortsetzen erkannt. Bei gesperrtem Browserspeicher bleibt nur der Arbeitsspeicher dieser geöffneten App verfügbar. Vier Hauptreiter und ausschließlich elterlich verwaltete Kinderprofile bleiben erhalten. [Prüfstand](docs/QA-0.18.md).

## Kleine Erfolgsmomente · Version 0.17.0

- Nach einem bestätigten Abschluss fliegen wenige Sterne zum sichtbaren Guthaben; der Zähler läuft zum tatsächlichen neuen Stand. Ein kurzes Häkchen lässt die erledigte Karte verschwinden, verbleibende Missionen rücken nach. Die kompakte Meldung mit Rückgängig bleibt erreichbar.
- Der Starter-Putzonaut hat passende Bereitschafts-, Winke- und Ruheposen. Andere ausgerüstete Anzüge bleiben sichtbar und reagieren mit einer kurzen Bewegung ihres vorhandenen Porträts.
- Nur frisch freigeschaltete Stationsmodule werden kurz beleuchtet, sobald der Ausbau ins Blickfeld kommt. Danach bleibt die Ansicht ruhig.
- „Für heute geschafft!“ ersetzt den Rundenstart, sobald die eigenen und freien fälligen Missionen erledigt sind. Die Karte zeigt heutige bestätigte Missionen, XP und Missionssterne aus der vorhandenen Statistik. Offene gemeinsame Missionen, Freigaben, Offline-Vormerkungen, Auszeiten und fehlende Verbindung schließen den Tagesabschluss aus. Die letzte Putzrunde bleibt über die Karte erreichbar.
- Effekte laufen kurz, blockieren keine Bedienelemente und beachten sowohl die Profileinstellung als auch die Gerätepräferenz für reduzierte Bewegung. Vormerkungen und wiederholte Abschlussantworten lösen keine Punkteanimation aus.

Vier Hauptreiter und ausschließlich durch Eltern verwaltete Kinderprofile bleiben erhalten. Kein neuer Menüpunkt, keine Änderung der Punkte- oder Freischaltregeln. [Prüfstand](docs/QA-0.17.md).

## Einfach starten und Erfolge direkt sehen · Version 0.16.0

- **Basis:** 5, 10 oder 20 Minuten wählen und die Putzrunde starten. Die zuletzt gewählte Dauer bleibt pro Profil und Crew auf diesem Gerät gespeichert. „Wenig Energie“ und „Besuch kommt“ liegen unter „Runde anpassen“; Ziele und Raumstation bleiben auf der Basis.
- **Missionen → Jetzt offen:** Heute fällige und überfällige Aufgaben stehen zusammen, die ältesten überfälligen zuerst. Einfache eigene oder freie Missionen lassen sich direkt am Häkchen erledigen. Der Titel öffnet die Details; Checklisten und gemeinsame Aufgaben behalten ihren vollständigen Ablauf. Rücknahmen bleiben möglich.
- **Neue Mission / Bearbeiten:** Name, Bereich, Dauer, Rhythmus und Zuständigkeit stehen zuerst. Unter „Weitere Optionen“ bleiben Checkliste, Notiz, Symbol, Kategorie, Rotation und eigene Punkte verfügbar. Neue leere Missionen erhalten den vorhandenen Punktvorschlag passend zu Dauer und Aufwand. Bestehende Aufgaben und Vorlagen behalten ihre festgelegten Punkte, auch wenn die Optionen eingeklappt bleiben.
- **Abschluss:** Eine kompakte Meldung mit Putzonaut, Sternen, XP, Levelbalken und „Rückgängig“ lässt die aktuelle Ansicht stehen. Levelaufstiege, neue eigene Erfolge, Stationsausbauten und eigene Questboni öffnen weiterhin die große Erfolgsansicht. Offline-Vormerkungen vergeben weiterhin erst nach bestätigtem Abgleich Punkte.

Die vier Hauptreiter, Spielregeln, vorhandenen Daten und Freischaltschwellen bleiben erhalten. Kinderprofile werden ausschließlich von Eltern verwaltet. Keine neue Kinderoberfläche, Datenbankmigration, Geräteaktivierung oder Änderung am Push-Zeitplan.

[Prüfstand und Geräteabgrenzung](docs/QA-0.16.md).

## Weniger Eingaben, mehr Alltagshilfe · Version 0.15.0

Kinder verwenden die App **nicht selbst**. Ein angemeldetes Elternteil erfasst ihre Leistungen und verwaltet ihre Profile. Es gibt keine Kinderoberfläche und keinen Kinderzugang. Die vier Hauptreiter bleiben Basis, Missionen, Crew und Beute; neue Details sind freiwillig und überwiegend eingeklappt.

- **Mission erstellen → Mit einem Satz starten:** etwa „Staubsaugen, jeden Samstag, 10 Minuten“. Erkannte Angaben werden vor dem Speichern im normalen Formular geprüft. Die lokale Erkennung versteht feste deutsche Zeitangaben; unerkannte Wörter bleiben zur Kontrolle stehen.
- **Wiederholung → Nach Erledigung:** 1–365 Tage ab bestätigtem Abschluss. Eine verspätete Mission bleibt eine einzelne offene Runde; erst ihr Abschluss setzt den nächsten Termin. Bei erforderlicher Kinderfreigabe zählt der Freigabetag. Pausen erzeugen keinen Rückstau, Rücknahmen öffnen die ursprüngliche Runde.
- **Mission → So geht’s:** kurze Hinweise und ein optionales Referenzfoto. Der Captain pflegt diese Angaben. Bilder werden vor dem Upload verkleinert und ohne Originalmetadaten gespeichert; Abruf nur innerhalb der angemeldeten Crew. Fotos benötigen eine Verbindung.
- **Crew / Logbuch → Danke sagen:** einmal pro Person und bestätigtem fremden Abschluss. Kein zusätzlicher Punktestand; beim verwalteten Kinderprofil stammt der Dank weiterhin vom angemeldeten Elternteil.
- **Nach ausgewählten Abschlüssen → Passte die Zeit?:** freiwillig „Ging schneller“, „Passte“ oder „Dauerte länger“. Erst nach mindestens drei unterschiedlichen Runden erscheint ein konkreter Vorschlag; der Captain bestätigt oder behält die bisherige Dauer. XP und Sterne ändern sich dadurch nicht. Rücknahmen entfernen die betreffende Rückmeldung.
- **Profil → Deine Erinnerung → Auch wenn die App geschlossen ist:** optional pro Gerät aktivieren und ein tägliches Stundenfenster wählen. Ein stündlicher Cloud-Auftrag prüft offene eigene, freie und betreute Kinderaufgaben. Höchstens ein Versandversuch täglich je Gerät, in Berliner Zeit; Auszeiten werden berücksichtigt. Der Sperrbildschirm zeigt einen allgemeinen Hinweis ohne Namen oder Missionsdetails. Bis zu drei Geräte pro Erwachsenenprofil. Zum Ausschalten dieselbe Einstellung verwenden; explizites Abmelden widerruft die Geräteanmeldung. Unterstützte iPhones benötigen die zum Home-Bildschirm hinzugefügte App. Eine erfolgreiche Annahme durch den Push-Dienst beweist noch keine Zustellung am Endgerät.
- **Basis → Ausbau ansehen → Trophäenregal:** bis zu drei bereits verdiente besondere Abzeichen aus der Crew ausstellen. Der Captain wählt sie aus, ohne Sternenkosten.

Notizen, Rückmeldungen, Dank und Trophäen sind in Crew-Sicherungen enthalten. Fotoverweise bleiben für eine Wiederherstellung derselben Crew erhalten; die Bilddateien liegen getrennt im privaten Objektspeicher und sind nicht in der JSON-Sicherung enthalten. Geräteendpunkte und Versandgeheimnisse gehören nicht in Crew-Sicherungen. Die neue SQL-Migration ergänzt ausschließlich die Tabellen für Geräteanmeldungen und Versandstatus.

[Prüfstand und offene Gerätetests](docs/QA-0.15.md) · [Betrieb der Push-Erinnerungen](docs/PUSH-OPERATIONS.md)

## Einfach zusammen anpacken · Version 0.14.0

Die vier Hauptreiter bleiben **Basis, Missionen, Crew und Beute**. Die neuen Möglichkeiten erscheinen an der passenden Stelle und sind freiwillig:

- **Basis → Wenig Energie:** ein bis drei verfügbare eigene oder freie Missionen mit jeweils höchstens fünf Minuten und maximal zehn Minuten Gesamtzeit. Aufwendige Aufgaben entfallen. Es wird nichts verschoben oder automatisch erledigt.
- **Basis → Besuch kommt:** die bestehende Putzrunde priorisiert passende vorhandene Aufgaben für Eingang, Gäste-WC und Wohnbereich. 5, 10 oder 20 Minuten bilden das gesamte Zeitbudget. Unpassende Aufgaben werden nicht zum Auffüllen ergänzt. Die gespeicherte Besuchsroutine bleibt ebenfalls erhalten.
- **Mission bearbeiten → Wer übernimmt?:** neben der festen Wochenreihenfolge lässt sich „Fair nach Aufwand und Verfügbarkeit“ wählen. Der Captain wählt geeignete Personen aus. Neue Runden berücksichtigen deren offene Einteilung sowie den seit diesem Update erfassten bestätigten Aufwand der laufenden Woche (Dauer × Aufwandfaktor). Gleichstände bevorzugen eine andere Person als zuletzt. Eine bestehende Einteilung springt nicht mit jedem Abschluss um; Auszeiten oder geänderte Mitglieder können eine Neuzuteilung auslösen. Künftige faire Zuständigkeiten bleiben im Wochenplan zunächst offen. Die bisherige Wochenreihenfolge bleibt der Standard und überspringt Auszeiten, ohne die ursprüngliche Reihenfolge zu verschieben.
- **Mission → Zu zweit erledigen:** ein verfügbares Crewmitglied auswählen, die festen Anteile prüfen und gemeinsam starten. XP und Sterne werden hälftig geteilt; der startenden Person fällt ein unteilbarer Rest zu. Beide bestätigen ihren Teil, erforderliche Kinderfreigaben gelten weiterhin. Erst dann werden beide Anteile atomar gebucht. Jede Person erhält eine bestätigte Beteiligung für Statistik, eigene Ziele und die gemeinsame Wochenzählung; die normalen Missionssterne und XP werden insgesamt nur einmal vergeben. Bestehende Questboni gelten unverändert pro beteiligtem Profil. Auflösen vergibt keine Punkte. Eine Rücknahme im Logbuch korrigiert beide Anteile, Fortschritte und gegebenenfalls Questboni gemeinsam. Gemeinsame Bestätigungen benötigen eine Verbindung; normale Offline-Vormerkungen bleiben erhalten.
- **Crew / Profil → Auszeit:** für das eigene bzw. berechtigt begleitete Profil, durch den Captain auch für die ganze Crew. Beginn und optionales Ende wählen oder manuell zurückkehren. Feste wiederkehrende Aufgaben pausieren, verfügbare Personen übernehmen rotierende Aufgaben. Sind alle gewählten Personen weg, ruht die Aufgabe. Verpasste wiederkehrende Runden werden nicht nachgeholt, einmalige Aufgaben bleiben erhalten. Neue Abschlüsse und Erinnerungen pausieren für das abwesende Profil. Laufende gemeinsame Runden werden bei Beginn ohne Punkte aufgelöst. Bereits verdiente Sterne und Erfolge bleiben bestehen; Wochenziele werden nicht künstlich erfüllt oder verkleinert.
- **Vorlagen → Mitdenken & organisieren:** sechs neue Vorschläge und vier passende bestehende Vorlagen, etwa Mahlzeiten planen, Termine abstimmen oder eine Wartung organisieren. Insgesamt 51 Vorlagen, weiterhin sechs beim Einstieg. Vorhandene Tätigkeitskategorien und deren Zählung bleiben unverändert.
- **Basis → Ausbau ansehen → Wohnkapsel gestalten:** der Captain wählt Pflanzen, Möbel, Ausblick und Helfer für die gemeinsame Vorschau. Acht Dekorationen, davon drei sofort verfügbar. Mondblume, Bücherinsel und Robi benötigen 10, 25 bzw. 50 bestätigte Crew-Beteiligungen; Polarlicht eine erreichte Zielwoche, die goldene Kehrmaschine ein Kehrminator-Abzeichen in der Crew. Keine Sternenkosten oder Käufe. Noch gesperrte Gegenstände zeigen ihre Voraussetzung. Korrekturen wirken auf zählerbasierte Freischaltungen; bereits verdiente Abzeichen bleiben erhalten.

Bestehende Aufgaben und Wünsche werden nicht automatisch umkonfiguriert. Die neuen Daten sind in Sicherungen enthalten; ältere Sicherungen und lokale Offline-Stände bleiben lesbar. Keine SQL-Migration erforderlich. [Prüfstand und Grenzen](docs/QA-0.14.md).

## Mehr Wunsch-Symbole in Version 0.13.2

Persönliche und gemeinsame Wünsche haben jetzt **24 statt vier Symbole**: unter anderem Gaming, Lesen, Pizza, Kaffee, Schwimmen, Radfahren, Camping, Wellness und Ausflüge. Beim Anlegen oder Bearbeiten öffnet „Symbol“ eine beschriftete Auswahl mit Vorschau. Nach dem Antippen klappt sie wieder zu. Sehr schmale Smartphone-Ansichten zeigen drei Spalten, größere vier.

Wunschkarten, persönliche Sparziele, gemeinsame Wunschdetails und passende Wunschideen verwenden dieselben Motive. Vorhandene Wünsche behalten ihr gespeichertes Symbol; neue Symbole sind in Crew-Sicherungen enthalten. Das Öffnen eines gemeinsamen Wunsches übergibt nun korrekt dessen Kennung, sodass die Sparansicht erreichbar bleibt. Keine Datenbankmigration erforderlich.

[Prüfergebnisse und Grenzen der Browserprüfung](docs/QA-0.13.2.md).

## Nachprüfung und Korrekturen in Version 0.13.1

Der am 30. Oktober um 13:37 Uhr deutscher Zeit veröffentlichte Stand enthielt bereits die vollständige Alltagshilfe aus 0.13.0. Die Wiederaufnahme baut auf genau diesem Repository-Stand auf.

- Vorübergehende Abgleichsfehler (Verbindungsabbruch, Zeitüberschreitung, kurzzeitige Sperre oder Serverfehler) lassen Offline-Abschlüsse vorgemerkt. Ein späterer Versuch verwendet denselben Anfrageschlüssel; Sterne und XP bleiben bis zur Bestätigung unverändert.
- Eine abgelaufene Anmeldung sperrt die lokale Offline-Anzeige. Vormerkungen bleiben für denselben Zugang erhalten und werden nach erneut bestätigter Anmeldung wieder versucht. Echte Änderungen an Aufgabe, Runde, Crew oder Wiederherstellung bleiben prüfpflichtige Konflikte.
- Schmale Ansichten nutzen die tatsächlich verfügbare Breite; lange Missionsnamen in Tauschanfragen und Dialogtexten werden umgebrochen. Auch das Zeitfeld der Erinnerung bleibt innerhalb des Dialogs.

[Wiederaufnahme, Prüfergebnisse und offene Gerätetests](docs/QA-0.13.1.md). Vier Hauptreiter, bestehende Daten und Freischaltschwellen bleiben erhalten; keine SQL-Migration.

## Alltagshilfe in Version 0.13

Die vier Hauptreiter bleiben **Basis, Missionen, Crew und Beute**. Der nächste kleine Einsatz steht weiterhin im Mittelpunkt.

- **Wochenrückblick:** Eine schließbare Karte auf der Basis zeigt die bestätigten Missionen der vergangenen Kalenderwoche und das damalige persönliche Ziel. Leere Wochen erzeugen keine Karte; Korrekturen werden berücksichtigt. Ein Link führt zur vorhandenen Statistik.
- **Freiwillige Erinnerung:** Unter Profil → Deine Erinnerung eine Uhrzeit wählen. Ein kleiner Hinweis erscheint einmal täglich auf der sichtbaren Basis, wenn eine eigene oder freie Mission offen ist. Es gilt Berlin einschließlich Zeitumstellung. Damals nur bei geöffneter App mit Verbindung. Seit 0.15 ergänzt die gesondert aktivierbare Geräteerinnerung den Hintergrundversand.
- **Übernahme und Tausch:** Im Detail einer eigenen zugeteilten Mission um Übernahme bitten oder eine andere zugeteilte Mission zum Tausch auswählen. Die andere Person muss ausdrücklich zustimmen. Nur die aktuelle Runde wechselt; künftige Termine und Rotation bleiben erhalten. Anfragen liegen einklappbar unter Missionen. Veränderte, erledigte oder archivierte Aufgaben machen alte Anfragen ungültig.
- **Passende Alltagsroutinen:** „Besuch kommt“, „Feierabend schaffen“ und „Küche nach dem Kochen“ ergänzen die vorhandenen Vorschläge. Höchstens drei passende bestehende Missionen; keine duplizierten Aufgaben oder zusätzlichen Punkte.
- **Offline vormerken:** Nach einem verbundenen Aufruf bleiben der letzte Aufgabenstand, lokale Häkchen und bis zu 50 vorgemerkte Abschlüsse auf diesem Gerät. Erst der bestätigte Abgleich vergibt Punkte. Wiederholte Übertragung zählt einmal; veraltete Runden, geänderte Aufgaben und Wiederherstellungen werden zur Prüfung markiert. Kinderfreigaben bleiben erforderlich. Unter Profil → Offline auf diesem Gerät sind Bereitschaft, Grenzen und das Ausschalten mit Löschen erreichbar.

Der Offline-Start benötigt einen Browser mit Service-Worker-Unterstützung auf der HTTPS-Website und einen erfolgreich vorbereiteten Cache. Die lokale Sicherung ist gerätebezogen, enthält keine Zugangsdaten und ersetzt keinen Crew-Backup. Eine abgelaufene Anmeldung sperrt die lokale Anzeige bis zum erneuten bestätigten Login; Vormerkungen bleiben für denselben Zugang erhalten. Explizites Abmelden entfernt lokale Daten und nennt noch offene Vormerkungen. Bei Konto- oder Crewwechsel wird der alte Gerätestand verworfen. Browser können lokale Daten selbst löschen. Synchronisierung läuft bei geöffneter sichtbarer App, nicht als Hintergrundversand.

[Prüfstand und verbleibende Gerätetests](docs/QA-0.13.md). Neue Profil- und Übergabefelder sind in Sicherungen enthalten; ältere Sicherungen bleiben kompatibel. Keine SQL-Migration.

## Neue Abzeichen und feinere Freischaltungen in Version 0.12

**Harry Putzer**, **Albert Reinstein** und **Clean Elisabeth** ergänzen die Sammlung auf zehn besondere Abzeichen. Ihre Motive zeigen den vertrauten Putzonauten als Zauberer, Forscher und königliche Glanzfigur. Harry benötigt 75 bestätigte Missionen, Albert in fünf frei gewählten Kategorien jeweils mindestens fünf bestätigte Missionen, Elisabeth zwölf erreichte persönliche Zielwochen. Alberts Detailansicht zeigt den Stand jeder Kategorie.

Die bisherigen Hürden steigen überwiegend um 12,5–20 %. Polarstern benötigt eine zusätzliche Zielwoche (fünf statt vier); erster Einsatz und Teamgeist bleiben bei einer Mission bzw. zwei Personen. Komet kostet 350 Sterne, Sonnenheld benötigt Level 9. Die späteren Stationsmodule folgen nach sechs, neun und vierzehn Crew-Zielwochen. Bereits verdiente Abzeichen, Titel und Anzüge bleiben erhalten; schon erreichte Stationsmodule behalten ihre alten Voraussetzungen. Korrekturen zählen weiterhin korrekt. Der Übergang und alte Sicherungen werden ohne SQL-Migration unterstützt.

Küchen- und Pflanzenmeilensteine verwenden nun wie die übrigen Kategorieziele die bestätigte Tätigkeitskategorie. Raum und Symbol erzeugen keinen zusätzlichen Fortschritt. Kinderfreigaben, ursprüngliche Kategorien, historische Abschlüsse und archivierte Aufgaben werden berücksichtigt. Die Übersicht bleibt bei zwölf Meilensteinen, einer getrennten Abzeichengalerie, einem nächsten Ziel und den vier Hauptreitern.

[Alle Voraussetzungen und Plausibilitätsprüfung](docs/BALANCE-0.12.md) · [Prüfstand 0.12](docs/QA-0.12.md) · [Drei Motive und vollständige Prompts](docs/art-0.12-prompts.md)

Die folgenden versionsbezogenen Abschnitte beschreiben den jeweiligen früheren Ausbaustand. Für aktuelle Freischalthürden gilt die Tabelle für 0.12.

## Sammlungen und Statistik in Version 0.11

**Profil → Deine Erfolge** enthält zwei voneinander getrennte Sammlungen: zwölf Meilensteine als kompakte Fortschrittskarten und sieben besondere Abzeichen als Galerie mit zwei Motiven nebeneinander. Jede Sammlung hat ihren eigenen Zähler. „Alle“ entfällt; statt „Nächste Ziele“ steht genau ein empfohlenes oder selbst gewähltes Ziel darüber. Antippen öffnet Voraussetzung, Belohnung, Zielauswahl und bei freigeschalteten Abzeichen die Möglichkeit zum Tragen. Bestehende Erfolge, Anzüge, Titel, Abzeichen und Zielauswahlen bleiben erhalten.

**Profil → Deine Statistik** ist direkt unter dem persönlichen Wochenziel erreichbar. Die vier Hauptreiter bleiben unverändert. Die Ansicht gilt für das ausgewählte eigene oder berechtigt begleitete Kinderprofil und zeigt:

- Kennzahlen für **7, 30 oder 90 Tage**: bestätigte Missionen, verdiente Missionssterne, XP und Tage mit mindestens einem bestätigten Einsatz.
- Ein antippbares **Balkendiagramm**: sieben Tage einzeln, 30 Tage nach Kalenderwochen, 90 Tage nach Kalendermonaten. Randwochen und Randmonate enthalten ausschließlich Tage des gewählten Zeitraums. Alle Werte sind zusätzlich als Tabelle verfügbar.
- Ein **Ringdiagramm nach Tätigkeitskategorien** mit auswählbarer Legende, absoluten Zahlen und gerundeten Prozentanteilen. Historische Kategorien werden aus dem damaligen Abschluss bestimmt; unklare Zuordnungen heißen „Ohne Kategorie“.
- Ein **Wochenziel-Diagramm für die letzten sechs Kalenderwochen**, unabhängig vom gewählten Zeitraum. Erreichte Ziele werden farblich hervorgehoben; fehlende historische Zielwerte werden nicht erfunden.

Die Statistik liest bestätigte, nicht zurückgenommene Abschlüsse aus dem vollständigen passenden Logbuch. Sie ist nicht auf die letzte Logbuchseite beschränkt. Kinderleistungen zählen am Tag ihrer Freigabe, archivierte Aufgaben weiterhin; nachträgliche Änderungen an Kategorien, Aufgabenpunkten oder Titeln schreiben die Historie nicht um. Missionssterne sind die normalen Aufgabenpunkte, ohne Questboni, Wunschbeiträge, Rückerstattungen oder Ausgaben. Das aktuelle ausgebbare Guthaben steht weiterhin im Profil und Kopfbereich. Wochenziele verwenden den gespeicherten persönlichen Wochenfortschritt.

Kalendertage richten sich nach Europe/Berlin einschließlich Zeitumstellungen. Die API liest Profildaten und aggregierte Ereignisse gemeinsam in einer Datenbanktransaktion und prüft die Profilberechtigung nochmals gegen diesen Stand. Die Ansicht lädt bei Profil-, Daten- und Tageswechsel neu, verwirft überholte Antworten und bietet einen manuellen Aktualisierungsknopf. Leere Zeiträume zeigen echte Nullwerte und einen Einstieg in eine kleine Putzrunde.

Es werden keine zusätzlichen Nutzungsdaten oder Diagrammstände gespeichert. Bestehende Sicherungen enthalten bereits alle benötigten Belege; Wiederherstellen aktualisiert auch die Statistik. Keine zusätzliche Datenbankmigration oder Diagrammbibliothek erforderlich. Native SVG- und CSS-Diagramme verwenden die bestehende Gestaltung und berücksichtigen reduzierte Bewegung. [Prüfstand 0.11](docs/QA-0.11.md).

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
- Synchronisierung alle 15 Sekunden, beim Zurückkehren und nach eigenen Änderungen. Offline werden keine Änderungen bestätigt; seit 0.13 können Abschlüsse lokal vorgemerkt werden.
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

Die eigenständige Web-App mit eigener Anmeldung, E-Mail-Bestätigung und Passwort-Wiederherstellung ist seit 0.21.0 in `standalone/` enthalten. Kontolöschung, der tatsächliche Datenumzug, ein erprobter vollständiger Backup-/Restore-Ablauf, Serveranschluss und echte Mailzustellung bleiben vor dem öffentlichen Start zu erledigen. Die frühere Docker-/PostgreSQL-Grundlage im Hauptverzeichnis bleibt als Altstand erhalten. Die Bereitstellung auf dem tatsächlichen Umbrel und die SMTP-Konfiguration müssen separat abgeschlossen sein; das Image allein startet keinen öffentlichen Dienst.

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

Die automatisierten Prüfungen decken Profilrechte, Kalendergrenzen, Aufgabenrunden, Punkte, Sicherungen, Rückblicke, Erinnerungen, Übergaben und Offline-Abgleiche ab. Typprüfung und Produktionsbuild gehören zur Freigabe.

Die verwaltete Vorschau ist für 0.13 erreichbar. Einstieg und eine ausdrücklich gekennzeichnete isolierte UI-Prüfansicht mit synthetischen Daten wurden im Browser geprüft: Wochenrückblick und Erinnerung bei 360 Pixel Inhaltsbreite, Offline-Vormerkung ohne Punkte, automatischer Abgleich, Tauschdialog, einklappbare Anfragen und neue Routinevorschläge. Authentifizierter Produktionsbetrieb, HTTPS-Offline-Neustart und echte Android-/iPhone-Tests sind damit nicht ersetzt; sie bleiben gesonderte Praxistests. Die temporäre Prüfansicht ist nicht Teil des Produktionspakets.
