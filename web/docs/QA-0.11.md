# Putzonaut 0.11 – Prüfstand

## Automatisierte Prüfungen

167 Tests: 140 Integrationsfälle gegen Miniflare D1 und 27 Prüfungen für gemeinsame Regeln und Projektassets. `test/statistics.test.ts` ergänzt 15 Fälle; die bisherigen 152 bleiben erhalten.

- Alle 19 Erfolge kommen genau einmal in den zwei getrennten Sammlungen vor: zwölf Meilensteine und sieben besondere Abzeichen. Die vorhandenen Objekte, Freischaltungen und die Auswahl eines besonderen Abzeichens als nächstes Ziel bleiben verwendbar.
- Leere Profile liefern echte Nullwerte und sieben vollständige Tagespositionen. Es werden keine historischen Wochenziele erfunden. Statistikabfragen verändern weder Revision noch Guthaben.
- Bestätigte Abschlüsse zählen genau einmal. Bearbeiten oder Archivieren der Aufgabe verändert historische Kategorie, XP und Missionssterne nicht.
- Offene Kinderfreigaben zählen nicht; bestätigte Leistungen erscheinen beim Kinderprofil am Datum der Freigabe. Im Profil der erwachsenen Begleitung entstehen dafür keine eigenen Missionspunkte.
- Rücknahmen entfernen den ursprünglichen Abschluss aus Anzahl, Kategorien, XP, Missionssternen und Aktivitätstagen. Der Korrekturzeitpunkt erzeugt keinen neuen Aktivitätstag.
- Questboni, persönliche Einlösungen, gemeinsame Beiträge und Rücknahmen verändern die verdienten Missionssterne nicht. Die Kennzahl ist kein Kontostand.
- Berlin-Mitternacht, die doppelte Stunde der Winterzeit, der Wechsel zur Sommerzeit, inklusive Datumsgrenzen und noch zukünftige Ereignisse werden geprüft.
- 30 und 90 Tage bleiben über Wochen-, Monats- und Jahresgrenzen vollständig. Die Summe der Diagrammbalken entspricht den Kennzahlen; Randabschnitte bleiben auf den Zeitraum begrenzt.
- Ein Verlauf mit 151 Abschlüssen wird vollständig aggregiert, obwohl die normale Logbuchansicht nur 50 Einträge pro Seite liefert. Historisch eindeutige Kategorien werden übernommen; unklare Einträge verbleiben unter „Ohne Kategorie“.
- Frühere gespeicherte Wochenziele behalten ihren damaligen Wert. Änderungen betreffen das aktuelle Ziel; nicht gespeicherte Wochen bleiben unbekannt. Beim Wochenwechsel wird kein alter Wochenzähler übernommen.
- Eigenes Profil, andere Mitglieder, berechtigt begleitete Kinder und fremde Crews bleiben getrennt. Selbst eine Änderung der Kinderbegleitung zwischen erster Prüfung und Datenbanklesung führt zur erneuten Berechtigungsprüfung und verweigert den inzwischen veralteten Zugriff.
- Wiederherstellen einer Sicherung stellt auch die Statistik wieder her und liefert den neuen Wiederherstellungsstand. Ungültige Zeiträume werden ohne Datenänderung abgewiesen.

Typprüfung und Produktionsbuild gehören zur lokalen Freigabe. Die GitHub-Workflows prüfen zusätzlich die Web-App sowie die bestehende Docker-/PostgreSQL-Grundlage.

## Gestaltung und Bedienung

Die Abzeichengalerie verwendet die vorhandenen sieben Illustrationen. Meilensteine erscheinen als kompakte Karten; Voraussetzungen und Auswahlaktionen liegen im bestehenden Detaildialog. Die Profilseite enthält eine einzelne nächste Zielkarte und einen eigenen Einstieg in die Statistik.

Die Diagramme bestehen aus CSS und SVG. Balken und Kategorien sind über echte Schaltflächen bedienbar. Zahlen, Text, Legenden und eine ausklappbare Tabelle ergänzen Farben und Diagrammformen. Laden, Fehler, Wiederholen und leere Zeiträume haben eigene Zustände. Bewegungsreduktion bleibt wirksam. Diese Bedienung ist implementiert; sie wurde noch nicht am realen Gerät visuell geprüft.

## Prüfgrenze und offene Praxistests

Eine alte ignorierte Vinext-Sperrdatei verwies auf den nicht mehr vorhandenen Prozess 15. Nach deren Entfernung startete die verwaltete Vorschau unter der bereitgestellten Adresse `http://terminal.local:4173/`. Der bereitgestellte Browser konnte diese Adresse weiterhin nicht öffnen (`ERR_CONNECTION_REFUSED`). Es wurde keine alternative Browsertechnik oder Netzumgehung verwendet. Es liegen deshalb keine authentischen Screenshots oder abgeschlossenen visuellen Gerätetests für diese Version vor.

Auf Android und iPhone sind noch zu prüfen:

1. Sammlungen wechseln, lange Abzeichennamen lesen, Details öffnen und schließen, ein Ziel wählen und ein verdientes Abzeichen tragen.
2. Statistik aus dem Profil öffnen, 7/30/90 Tage wechseln und Balken sowie Kategorien antippen. Werte mit dem Logbuch vergleichen; der Wochenzielvergleich zeigt immer sechs Kalenderwochen.
3. Große Schrift, schmale Darstellung, Tastaturfokus, Screenreader-Ausgabe der Zahlen und reduzierte Bewegung prüfen.
4. Während einer Statistikabfrage Profil, Zeitraum oder Seite wechseln; es dürfen keine Daten aus dem vorherigen Profil erscheinen.
5. Eine Mission abschließen, eine Kinderleistung freigeben, einen Abschluss zurücknehmen und eine Sicherung wiederherstellen; geöffnete Statistik anschließend prüfen.
6. Verbindung unterbrechen und wiederherstellen; Ladefehler muss verständlich sein und „Erneut laden“ funktionieren.

Die Website bleibt privat; Anmeldung und Geräteinstallation werden durch dieses Update nicht ersetzt.
