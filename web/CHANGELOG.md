# Changelog

## 0.26.2 · 9. November 2026

- Footer-Anordnung korrigiert: Links und Copyright stehen in derselben Abschlusszeile, die Jahreszahl ist am rechten Rand ausgerichtet. Auf Smartphones bleibt das Logo darüber.

## 0.26.1 · 9. November 2026

- Die Copyright-Jahreszahl steht auf der Website in einer eigenen, zentrierten Abschlusszeile unter den Footer-Links – auch auf schmalen Smartphones sowie im Impressum und Datenschutz.

## 0.26.0

- Persönliche Textnachrichten zwischen Crew-Mitgliedern mit eigenem Konto unter „Crew → Nachrichten“, mit Ungelesen-Zähler und automatisch aktualisiertem Gespräch.
- Separate Speicherung, Zugriff nur für die beiden Beteiligten, begrenzte Nachrichtenlänge und Senderate, idempotentes Senden und seitenweises Nachladen.
- Gespräche werden beim Ende einer Crew-Mitgliedschaft für beide Seiten gelöscht. Crew-Exporte und Offline-Stände enthalten keine Nachrichten.
- Additive Datenbankmigration für bestehende Installationen; vorhandene Crew-Daten bleiben erhalten.

## 0.25.1 · 3. November 2026

- „Meine Aufgaben“ und „Bereiche“ stehen als gleich breite Filter direkt nebeneinander. Die große Lücke zwischen den Schaltflächen entfällt; längere Bereichsnamen können innerhalb der Schaltfläche umbrechen.

## 0.25.0 · 3. November 2026

- Saisonale Missionen mit optionalen aktiven Monaten direkt bei der Wiederholung. Außerhalb der Saison entsteht kein Rückstau; Kalenderanker bleiben erhalten.
- „Heute nicht nötig“ lässt eine offene Runde ohne Punkte aus. Feste Rhythmen laufen am nächsten regulären Termin weiter; bei abschlussabhängigen Aufgaben beginnt der Abstand ab heute.
- Automatische Putzrunden bündeln die gewählten Aufgaben nach Räumen. Persönliche Routinen behalten ihre Reihenfolge.
- Kurze Gießkannen-, Socken- und Glanzreaktionen begleiten bestätigte Erfolge beim vorhandenen Maskottchen. Sie beachten deaktivierte Animationen und reduzierte Bewegung.

## 0.24.0 · 3. November 2026

- Genauere Wiederholungen im bestehenden Aufgabenformular unter „Weitere Wiederholungen“: alle zwei, drei oder sechs Monate, jährlich sowie ein bestimmter Wochentag an erster, zweiter, dritter, vierter oder letzter Position im Monat.
- Kurze Monate und Schaltjahre behalten den ursprünglichen Kalenderrhythmus. Der 29. Februar wird in normalen Jahren am 28. Februar fällig.
- Eine kompakte Vorschau nennt den Rhythmus, den nächsten Termin und gegebenenfalls eine noch offene ältere Runde.
- Neue Regeln bleiben beim Bearbeiten, Fortsetzen von Entwürfen, Duplizieren und Sichern/Wiederherstellen erhalten. Pausen, Verschiebungen, Offline-Abschlüsse und die vorhandenen Punkteprüfungen gelten weiterhin.

## 0.23.0 · 3. November 2026

- Selbst gehostete Installationen verschicken Geräteerinnerungen auch bei geschlossener App. Eigene dauerhafte Push-Schlüssel werden automatisch angelegt; ein interner Zeitgeber prüft die gewählten Zeitfenster. Tageslimits, Auszeiten und offene Aufgaben bleiben maßgeblich.
- Unter „Konto & Anmeldung“ lässt sich die Login-E-Mail mit aktuellem Passwort und Bestätigung der neuen Adresse ändern. Crew, Sterne und Erfolge bleiben erhalten; bestehende Sitzungen und ältere Reset-Links werden danach ungültig.
- Eigene Konten lassen sich nach Verlassen oder Schließen der Crew dauerhaft löschen. Passwort und ausdrückliche Bestätigung sind erforderlich. Kinderbetreuung und Captain-Rolle müssen vorher geklärt sein; gemeinsame Crew-Inhalte bleiben bestehen.
- Bestätigungslinks für E-Mail-Änderungen sind an das konkrete Konto gebunden, laufen ab und werden durch neuere Links oder einen Passwort-Reset ungültig.
- Der Offline-Start speichert auch die JavaScript- und CSS-Dateien des eigenständigen Builds vollständig vor.

## 0.22.2 · 2. November 2026

- Website-CSS und -JavaScript erhalten automatisch Inhaltsversionen. Nach einem Update werden die passenden Dateien geladen, auch wenn der Browser noch das alte Design gespeichert hat.
- Unversionierte oder veraltete CSS-/JavaScript-Adressen werden erneut geprüft. Anmeldung, Daten und bestehende Website-Gestaltung bleiben unverändert.
- Regressionstest für den Wechsel von bereits zwischengespeicherten Layout-Dateien; mobile Darstellung bei 360 und 393 Pixeln geprüft.

## 0.22.1 · 2. November 2026

- Freigegebene dunkle Website mit Glasoptik, lokalem Nunito-Schriftbild und „Auf Hochglanzkurs“.
- Scharfer App-Einblick, animierte Funktionskarten und kompakte Raketenfigur mit Schrubber; reduzierte Bewegung und unsichtbare Tabs pausieren die Animation.
- Smartphone-Anleitung, acht häufige Fragen und Hilfe über sos@putzonaut.de oder GitHub-Issues auf allen Seiten.
- Produktionslinks und QR-Code folgen weiterhin der konfigurierten App-Adresse. Website und App bleiben auf getrennten Ports im selben Docker-Image.

## 0.22.0 · 2. November 2026

- Öffentliche Vorstellungsseite mit vorhandenem Artwork, echtem App-Einblick, lokal erzeugtem QR-Code und Anleitung für Android und iPhone.
- Website auf Port 3081 und App auf Port 3080 im selben Docker-Image; die Website hat keine Kontorouten und keinen Zugriff auf Haushaltsdaten.
- Konfigurierbare Website-Adresse, Weiterleitung von www und Links zu Impressum und Datenschutz im Anmeldebereich. Schriften und Bilder werden lokal ausgeliefert.
- Umbrel Community Store als bevorzugter Installationsweg. Persistente Daten und vorhandene Konten bleiben im bisherigen App-Speicher.
- 316 automatisierte Tests, zusätzliche Containerprüfung beider Oberflächen sowie Browserprüfung für Desktop und Smartphone.

## 0.21.0 · 1. November 2026

- Eigene Putzonaut-Konten mit E-Mail und Passwort, verpflichtender E-Mail-Bestätigung, Passwort-Reset, sicherer Abmeldung und optionalem Angemeldetbleiben.
- Eigenständiger Node-/SQLite-Server und Docker-Build mit vollständiger aktueller Oberfläche, persistenten Crew-Daten und privatem Fotospeicher.
- Better Auth, begrenzte Anmeldeversuche, servergeprüfte Sitzungen, Origin-Schutz und verschlüsselte SMTP-Warteschlange.
- Explizites Betreiberwerkzeug zur Zuordnung separat übernommener Altprofile; keine automatische Verknüpfung nach E-Mail.
- 16 zusätzliche Integrationstests; insgesamt 314 erfolgreiche Tests. Hinweise zu Betrieb, Datentransfer und noch ausstehender Live-Einrichtung in `standalone/README.md`.
- Die private Sites-Version behält ihre bestehende Anmeldung und Daten. Der eigenständige Build enthält keine ChatGPT-Anmeldepfade.

## 0.20.0 · 31. Oktober 2026

- Nachtrag bei gleicher Versionsnummer: zwölf weitere Missionssymbole (Besen, Sprühflasche, Fenster, Bett, Sofa, Kühlschrank, Kochen, Einkauf, Haustiere, Dusche, Toilette und Werkzeug), insgesamt 19. Einheitliche Auswahl, Anzeige und automatische Kategoriezuordnung; neue Symbole werden auch in Backups erhalten. Offline-Dateien erhalten bei Inhaltsänderungen einen eigenen Cache.

- Spontane bereits erledigte Aufgaben mit Standardpunkten direkt erfassen; atomare, wiederholbare Anfragen verhindern doppelte Buchungen. Kinderfreigaben, Logbuch und Rücknahme verwenden den bestehenden Abschlussweg.
- Einzelne offene Aufgabenrunden auf morgen, das Wochenende oder ein eigenes Datum verschieben. Runde, Checkliste und Zuständigkeit bleiben erhalten; überlappende Wiederholungen werden zusammengefasst. Veraltete Offline-Abschlüsse werden zurückgewiesen.
- Dezenter Hinweis auf neue App-Versionen mit „Jetzt aktualisieren“ und „Später“. Kein automatischer Neustart; offene Eingaben, aktive Putzrunden, laufende Schreibvorgänge und Offline-Vormerkungen sind geschützt.
- Service-Worker-Wechsel erst nach ausdrücklicher Aktualisierung; vorhandene Asset-Caches schützen weitere offene Tabs. Größere Schließen-Schaltflächen und erreichbare Formularaktionen auf schmalen Bildschirmen.

## 0.19.4 · 31. Oktober 2026

- Die gesamte Startsequenz gleichmäßig auf drei Sekunden verlängert: 2,7 Sekunden für Anflug, Landung und Logo plus 0,3 Sekunden Ausblendung. Alle Effektdauern und Verzögerungen sind im gleichen Verhältnis angepasst.

## 0.19.3 · 31. Oktober 2026

- Umfangreichere Startsequenz: diagonaler Anflug mit Schubdüsen, federnde Landung auf einer leuchtenden Plattform, Druckwelle, Staub und einzelne Partikel.
- Sterne und Umlaufbahn ergänzen die Szene; die Logo-Buchstaben erscheinen nacheinander, gefolgt von einem Helmglanz.
- Gesamtdauer weiterhin 2,5 Sekunden. Ruhiger Ladezustand, reduzierte Bewegung und sofortige Fehleranzeige bleiben erhalten; bei niedrigen Bildschirmen wird die Szene kompakter.

## 0.19.2 · 31. Oktober 2026

- Startanimation gleichmäßig auf insgesamt 2,5 Sekunden verlängert: 2,25 Sekunden für die Landungsfolge plus 0,25 Sekunden Ausblendung.

## 0.19.1 · 31. Oktober 2026

- Startanimation auf insgesamt zwei Sekunden verlängert: 1,8 Sekunden für Landung, Staubwölkchen und Helmglanz, anschließend 0,2 Sekunden Ausblendung.
- Reduzierte Bewegung und sofortige Fehleranzeige bleiben erhalten.

## 0.19.0 · 31. Oktober 2026

- Kurzer Startbildschirm: Der bekannte Putzonaut landet sanft vor dem Logo, begleitet von zwei Staubwölkchen und einem Helmglanz.
- App und Daten laden parallel. Die Einblendung endet nach etwa einer Sekunde; langsames Laden bleibt ruhig, Fehler und Wiederholen werden direkt zugänglich.
- Einmal pro neu geladenem App-Dokument, ohne Wiederholung bei interner Navigation oder Rückkehr aus dem Hintergrund. Online- und Offline-Einstieg teilen den Ablauf.
- Profileinstellung für den nächsten Gerätestart gemerkt; reduzierte Bewegung und ausgeblendete Tabs unterbinden die Animation.

## 0.18.3 · 31. Oktober 2026

- Antippen des Putzonauten im Tagesabschluss oder in der Putzrunde putzt kurz das Visier; anschließend erscheint ein kleiner Glanzstern.
- Per Tastatur bedienbar; wiederholte Eingaben reihen keine Effekte aneinander. Reduzierte Bewegung zeigt nur einen ruhigen Glanzstern.
- Vorhandene Anzüge und der korrigierte Ausschnitt der Ruhepose bleiben erhalten. Paketversion aktualisiert den Offline-Cache.

## 0.18.2 · 31. Oktober 2026

- Blauen Bildrest oberhalb des sitzenden Starter-Astronauten im Tagesabschluss ausgeblendet. Der Ausschnitt behält die vollständige Figur sowie ihre Größe, Position und Animation bei.
- Paketversion für die Aktualisierung des Offline-Caches erhöht.

## 0.18.1 · 31. Oktober 2026

- Kurze Erklärung von XP und Sternen in Einrichtung und Profil; Crew-Ziel und Wünsche klarer voneinander abgegrenzt.
- Zwei statt sechs vorausgewählte Startmissionen; alle sechs bleiben verfügbar.
- Neue Crew-Ziele berücksichtigen ausgewählte Wiederholungen und die verbleibenden Tage der ersten Woche. Vorschau und gespeicherter Wert verwenden dieselbe Berechnung; bestehende Ziele bleiben erhalten.
- Konkrete Badvorlage mit drei Schritten und zum Titel passende Kühlschrank-Checkliste.
- Vier Vorlagenpunkte an die vorhandene Dauer-/Aufwandsformel angeglichen; keine rückwirkende Änderung gespeicherter Aufgaben oder Guthaben.
- 276 Tests, Typprüfung, Produktionsbuild und mobile Browserprüfung. Siehe `docs/QA-0.18.1.md`.
- Keine zusätzlichen Funktionen oder Menüs; Freischalthürden und Elternverwaltung bleiben erhalten. Erinnerungsautomatik bleibt deaktiviert.

## 0.18.0 · 31. Oktober 2026

- Ansichten, Suche, Filter und Scrollpositionen merken; Browser-Zurück schließt zuerst offene Details.
- Missionsentwürfe einschließlich Kurzeingabe, unvollständiger Felder und eigener Punkte fortsetzen; getrennt nach Konto, Crew und Profil, mit Ablauf und Versionsprüfung.
- Erreichbare Hauptaktionen und Schließen-Schaltfläche in Dialogen, angepasste Höhe bei Bildschirmtastatur sowie sichtbare Speicherfehler.
- Kompakte Übersicht offener Missionen und Zeitbedarf auf der Basis.
- Sterneabstand zum gewählten Wunsch direkt in der vorhandenen Abschlussmeldung, ausschließlich nach bestätigten Punkten.
- 272 erfolgreiche Tests, Typprüfung und Produktionsbuild; mobile Browserprüfung einschließlich Entwurfswiederherstellung und Speicherfehler. Siehe `docs/QA-0.18.md`.
- Vier Hauptreiter, Spielregeln, Elternverwaltung und bestehende Daten bleiben erhalten. Keine Push-, Automations-, Freigabe- oder Datenbankänderung durch diese Version.

## 0.17.0 · 30. Oktober 2026

- Kurzer Sterneflug zum sichtbaren Guthaben und Zähleranstieg nach bestätigten Abschlüssen, einschließlich des eigenen bestätigten Teamanteils. Kein Vorgriff auf vorgemerkte Punkte.
- Gezeichnetes Häkchen, dezentes Verschwinden der erledigten Missionskarte und nachrückende Liste; Rückgängig bleibt verfügbar.
- Neue Starter-Putzonaut-Posen für Bereitschaft, Winken und Tagesruhe; vorhandene freigeschaltete Anzüge bleiben erhalten.
- Einmalige Hervorhebung ausschließlich neuer Stationsmodule beim Sichtbarwerden.
- Tagesabschluss mit tatsächlichen heutigen Werten aus der Statistik; Schutz vor falschem Abschluss bei offenen Aufgaben, Freigaben, Vormerkungen und Auszeiten.
- Vorhandene Bewegungsreduktion für alle Effekte; keine zusätzlichen Menüs, Datenbankänderungen oder Push-Konfigurationsänderungen.
- 266 erfolgreiche Tests; mobile Browserprüfung und Typprüfung. Siehe `docs/QA-0.17.md`.

## 0.16.0 · 30. Oktober 2026

- Klarer Basis-Einstieg mit 5/10/20 Minuten und gerätebezogen gemerkter Dauer; besondere Rundenmodi unter „Runde anpassen“.
- Gemeinsame Liste für heute fällige und überfällige Missionen. Direktes Abhaken für einfache eigene oder freie Aufgaben; Details, Checklisten, gemeinsame Missionen und Rücknahme bleiben erhalten.
- Kürzere Missionsformulare mit zusätzlichen Angaben unter „Weitere Optionen“. Bestehende Punkte, Notizen, Schritte und Verteilungen bleiben beim Speichern erhalten; neue leere Missionen nutzen die vorhandene Punkteempfehlung.
- Kompakte Erfolgsmeldung in der aktuellen Ansicht mit Sternen, XP, Levelbalken und Rücknahme. Große Feieransicht für Levelaufstieg, eigene Erfolge, Stationsausbau und Questbonus.
- Vier Hauptreiter, vorhandene Daten, Spielregeln und ausschließlich elterlich verwaltete Kinderprofile beibehalten. Keine Server-, Datenbank-, Freigabe- oder Push-Konfigurationsänderungen.
- 260 erfolgreiche Tests; Typprüfung und Produktionsbuild. Reale lokale API-/Datenbankabläufe und Handybreiten 320/360/390/430 geprüft. Siehe `docs/QA-0.16.md`.

## 0.15.0 · 30. Oktober 2026

- Missionen aus einem kurzen Satz vorbereiten; Wiederholungen nach dem tatsächlichen bestätigten Abschluss.
- Einklappbare Missionshinweise mit optionalem, crewgeschütztem Referenzfoto.
- Ein persönliches Dankeschön ohne Zusatzpunkte; freiwillige Zeitrückmeldungen und ausdrücklich bestätigte Dauervorschläge.
- Optionaler Web Push mit allgemeinem Tageshinweis, eigener Geräteanmeldung und stündlichem Cloud-Versandlauf. Neue D1-Tabellen und privater R2-Bildspeicher; Geheimnisse ausschließlich in der Laufzeitkonfiguration.
- Bis zu drei verdiente Crew-Abzeichen im Trophäenregal der Wohnkapsel.
- Kinderprofile bleiben vollständig durch Eltern bedient. Keine Kinderoberfläche, kein Kinderkonto; passende Beschriftungen für die Erfassung durch Erwachsene.
- Vier Hauptreiter bleiben erhalten. Versionsanzeige und Offline-Cache werden aus der Paketversion erzeugt.
- 254 erfolgreiche automatisierte Prüfungen; Handyansichten und zentrale Abläufe mit isolierten Beispieldaten geprüft. Siehe `docs/QA-0.15.md` und `docs/PUSH-OPERATIONS.md`.

## 0.14.0 · 30. Oktober 2026

- Schonmodus und zeitlich begrenzte Besuchsrunde direkt im vorhandenen Basis-Einstieg; jeweils bis zu drei passende bestehende Missionen.
- Freiwillige faire Rotation nach geplantem und erfasstem Aufwand, geeigneten Crewmitgliedern und Auszeiten. Stabile aktuelle Einteilung; feste Wochenwechsel bleiben erhalten.
- Gemeinsame Missionen für zwei Profile mit sichtbaren festen XP-/Sternenanteilen, getrennten Bestätigungen und Kinderfreigaben. Atomare Buchung, Schutz vor doppelten Bestätigungen, gemeinsame Rücknahme und korrekte Questboni.
- Persönliche und Crew-Auszeiten mit Enddatum oder manueller Rückkehr, ohne nachzuholende wiederkehrende Runden.
- Sechs neue Vorlagen für unsichtbare Planungsarbeit; zehn passende Ideen unter „Mitdenken & organisieren“, insgesamt 51 Vorlagen.
- Gestaltbare Wohnkapsel mit acht Dekorationen in vier Bereichen, sichtbaren Voraussetzungen und ohne Sternenkosten.
- Vier Hauptreiter beibehalten. Abwärtskompatible Sicherungen und Offline-Stände; Version weiterhin im Profil. Prüfergebnisse in `docs/QA-0.14.md`.

## 0.13.2 · 30. Oktober 2026

- Wunsch-Symbole von vier auf 24 erweitert. Gemeinsame, beschriftete Auswahl mit Vorschau für persönliche und Crew-Wünsche; drei Spalten auf sehr schmalen Smartphones, sonst vier.
- Einheitliche Motive auf Wunschkarten, in Sparzielen und gemeinsamen Wunschdetails sowie passendere Symbole für vorhandene Wunschideen. Gespeicherte Wünsche behalten ihre Motive; Sicherungen unterstützen alte und neue Symbolkennungen.
- Fehlende Wunschkennung beim Öffnen der gemeinsamen Sparansicht ergänzt; aktive Crew-Wünsche werden wieder korrekt geöffnet.
- 213 erfolgreiche Tests einschließlich Anlegen aller 24 Symbole, Bearbeiten, gemeinsamem Wunsch und Sicherungsexport/-validierung. Typprüfung, Produktionsbuild und Browserprüfung dokumentiert in `docs/QA-0.13.2.md`.

## 0.13.1 · 30. Oktober 2026

- Unterbrochenen Arbeitslauf mit Repository- und Veröffentlichungshistorie abgeglichen: Alle vorgesehenen 0.13-Funktionen waren bereits im veröffentlichten Commit `4289f029a7f4a2a96e0f95a54a50f3aaacfed7d2` gespeichert.
- Offline-Abschlüsse bleiben bei Netzwerkfehlern, HTTP 408/425/429 und Serverfehlern vorgemerkt. Der Abgleich pausiert, statt die übrige Warteschlange sofort weiterzusenden. Derselbe Anfrageschlüssel schützt spätere Versuche vor doppelten Punkten.
- HTTP 401 sperrt die lokale Offline-Anzeige, ohne die Vormerkungen als dauerhafte Konflikte auszusortieren. Nach erneuter Anmeldung desselben Zugangs ist der Abgleich wieder möglich. Sachliche Konflikte bleiben sichtbar.
- Keine erzwungene Überbreite auf schmalen Ansichten; lange Missionsnamen in Tauschanfragen und Dialogtexten umbrechen, Zeitfelder bleiben im Dialog.
- 212 erfolgreiche Tests einschließlich elf neuer Regressionstests für Wiederholungen, Anmeldungsablauf, echte Konflikte, Profil-/Crewgrenzen und verlorene Antworten; Typprüfung und Produktionsbuild erfolgreich. Browser-Layoutprüfung bei 320, 360, 390 und 430 Pixeln. Prüfstand und verbleibende Geräteprüfungen stehen in `docs/QA-0.13.1.md`.

## 0.13.0 · 30. Oktober 2026

- Kompakter, schließbarer Wochenrückblick mit bestätigten Missionen und dem tatsächlichen Ziel der Vorwoche.
- Freiwillige tägliche Erinnerung auf der sichtbaren Basis zur gewählten Berliner Uhrzeit, nur bei offenen eigenen oder freien Missionen. Kein Push bei geschlossener App; diese Hosting-Grenze wird in der Oberfläche erklärt.
- Übernahme- und Tauschanfragen mit ausdrücklicher Annahme für genau eine Aufgabenrunde. Künftige Rotation bleibt bestehen; gleichzeitige oder veraltete Annahmen vergeben keine zweite Zuständigkeit.
- Alltagsroutinen „Besuch kommt“, „Feierabend schaffen“ und „Küche nach dem Kochen“ aus höchstens drei vorhandenen Missionen.
- Generische Offline-Oberfläche, letzter Gerätestand und atomar gespeicherte Vormerkungen. XP und Sterne erst nach bestätigtem Abgleich; wiederholte Übertragung, Kinderfreigaben, geänderte Aufgaben, Profilwechsel und Wiederherstellungen sind abgesichert. Keine authentifizierten API-Antworten im Service-Worker-Cache.
- Vier Hauptreiter bleiben erhalten. Einstellungen im Profil und Details direkt an der Aufgabe; neue Felder bleiben mit bisherigen Sicherungen kompatibel.
- 201 automatisierte Prüfungen, Typprüfung und Produktionsbuild. Isolierte Browserprüfung mit Testdaten einschließlich 360 Pixel Inhaltsbreite; authentifizierte Produktion, HTTPS-Offline-Neustart und reale Mobilgeräte sind gesondert zu prüfen.

## 0.12.0 · 30. Oktober 2026

- Drei neue illustrierte Abzeichen: Harry Putzer für 75 Missionen, Albert Reinstein für je fünf Missionen in fünf frei gewählten Kategorien und Clean Elisabeth für zwölf persönliche Zielwochen. Zehn besondere Abzeichen und weiterhin zwölf getrennte Meilensteine.
- Bestehende Freischalthürden überwiegend um 12,5–20 % erhöht; Polarstern um eine Woche. Komet kostet 350 Sterne, Sonnenheld benötigt Level 9. Späte Stationsmodule folgen nach 6, 9 und 14 Crew-Zielwochen. Einstieg und Teamgeist bleiben erreichbar.
- Bereits verdiente Abzeichen, Titel und Anzüge bleiben erhalten. Schon erreichte Stationsmodule behalten beim einmaligen Übergang ihre bisherigen Voraussetzungen; tatsächliche Korrekturen bleiben wirksam. Alte Sicherungen werden unterstützt, keine SQL-Migration.
- Küche und Pflanzen zählen anhand der bestätigten Tätigkeitskategorie statt Raum oder Symbol. Alberts Detailansicht zeigt die nötigen Kategorieeinsätze; die Galerie bleibt kompakt.
- 178 automatisierte Tests, Typprüfung und Produktionsbuild. Drei Bildassets visuell geprüft; App-Browserprüfung und echte Android-/iPhone-Tests wegen der nicht erreichbaren Vorschau weiterhin offen.

## 0.11.0 · 30. Oktober 2026

- „Deine Erfolge“ trennt zwölf kompakte Meilensteine und sieben illustrierte Abzeichen mit eigenen Zählern. „Alle“ entfällt; eine einzelne nächste Zielkarte ersetzt den bisherigen Ziele-Reiter. Details und Tragefunktion öffnen beim Antippen.
- Neuer Profileintrag „Deine Statistik“ mit Kennzahlen für 7, 30 und 90 Tage, interaktiven Balken- und Ringdiagrammen, auslesbarer Wertetabelle sowie einem Wochenzielvergleich über sechs Wochen.
- Statistik aus bestätigten Logbuchabschlüssen, einschließlich archivierter Aufgaben und korrekter Rücknahmen. Kinderleistungen zählen ab Freigabe; unbekannte Kategorien und fehlende historische Ziele bleiben ausdrücklich erkennbar.
- Persönliche Profilgrenzen, konsistente Datenbanklesungen, Zeitumstellungen und Wiederherstellung berücksichtigt. Keine zusätzlichen Trackingdaten, Datenbankmigrationen oder Diagrammabhängigkeiten.
- 167 automatisierte Prüfungen, Typprüfung und Produktionsbuild. Visuelle Browserprüfung und reale Android-/iPhone-Tests wegen der nicht erreichbaren Vorschau weiterhin offen.

## 0.10.0 · 30. Oktober 2026

- Geführte Putzrunden mit bis zu drei Aufgaben innerhalb von insgesamt 5, 10 oder 20 Minuten, optionalem pausierbarem Timer, gespeichertem Stand und Abschlussübersicht.
- Bis zu zwölf manuell startbare Routinen aus vorhandenen Missionen; Raumkarten mit Aufgabenstatus und direktem Einstieg. Die vier Hauptreiter bleiben erhalten.
- Gemeinsamer Crew-Wunsch mit freiwilligen Sternenbeiträgen, eigenen Rücknahmen, Erstattung beim Abbruch und einmaliger gemeinsamer Einlösung. Parallele Buchungen und persönliche Sternenausgaben bleiben atomar geschützt.
- Kleine abschaltbare Putzonaut-, Erfolgs- und Stationsanimationen; Geräteeinstellung für reduzierte Bewegung wird berücksichtigt.
- Rundenzusammenfassungen berücksichtigen Kinderfreigaben, Rücknahmen, ursprüngliche Termine und archivierte Aufgaben. Neue Daten sind in Sicherungen enthalten; alte Sicherungen bleiben kompatibel.
- 152 automatisierte Tests, Typprüfung und Produktionsbuild. Browser- und echte Gerätetests bleiben wegen der nicht erreichbaren Vorschau offen.

## 0.9.0 · 30. Oktober 2026

- 16 anpassbare Wunschideen je Haushaltsart, insgesamt 64. Drei Vorschläge im Einstieg, vollständige Sammlung mit Suche und Sternefilter; vorhandene Wünsche werden ausgeblendet.
- Sieben besondere Abzeichen im Putzonaut-Stil: Franz Beckenkehrer, Kehrminator, Jürgen Cleansman, Helene Wischer, George Cleaney, Otto von Wischmark und Roberto Blanko. Alle Motive wurden einzeln illustriert und mit transparentem Rand optimiert.
- 19 Erfolge insgesamt; Profilansichten für nächste Ziele, besondere Abzeichen und die gesamte Sammlung. Neue Abzeichen lassen sich als nächstes Ziel auswählen und nach der Freischaltung direkt tragen.
- Vorhandene bestätigte Leistungen zählen mit. Nachträgliche Freischaltungen werden dauerhaft gespeichert; Korrekturen und erforderliche Kinderfreigaben bleiben berücksichtigt. Abzeichen kosten keine Sterne und ändern weder Titel noch Wochenziel oder Anzug.
- 130 automatisierte Tests; Typprüfung und Build geprüft. Neue Bilder separat geprüft, visuelle Browser- und echte Gerätetests wegen der nicht erreichbaren Vorschau weiterhin offen.

## 0.8.0 · 30. Oktober 2026

- Zwölf Meilensteine und zehn individuell illustrierte Anzüge. Neu: Staubbezwinger, Haushaltsheld, Waschonaut, Glanzpilot, Allroundonaut und Im Rhythmus.
- Eine nächste Zielanzeige auf der Basis; frei wählbare Meilensteine und automatische Fortsetzung nach dem Erreichen.
- Spind mit „Meine Anzüge“ und „Entdecken“, zunächst drei nächste Meilensteine und vollständige Sammlung auf Wunsch.
- Neue Freischaltungen auf der Erfolgsseite mit direktem Anziehen ohne zusätzliche Sternenkosten.
- Belegbasierte Übernahme alter Kategorieerfolge; vier persönliche Zielwochen ohne Pflicht zur ununterbrochenen Serie. Historische persönliche Ziele werden ab 0.8 gespeichert.
- Sechs illustrierte Stationsausbauten bei 1/2/3/5/8/12 erreichten Crew-Zielwochen; neue Werkstatt, Solardeck und Andockbucht.
- Neue Fortschritte und Zielauswahl bleiben mit Sicherungen und Rücknahmen kompatibel. Bestätigungen und Kategorien werden dem richtigen Profil zugeordnet.
- 118 erfolgreiche automatisierte Tests. Visuelle Browserprüfung weiterhin wegen nicht erreichbarer Vorschau offen; neue Grafiken separat geprüft.

## 0.7.0 · 30. Oktober 2026

- Kurzstart mit 5, 10 oder 20 Minuten und bis zu drei tatsächlich verfügbaren Missionen; eigene Zuständigkeiten werden berücksichtigt.
- Aufgeräumte Basis mit einer klaren nächsten Handlung, kompakter Levelanzeige und nachgeordnetem Stationsfortschritt.
- 45 editierbare Haushaltsvorlagen in sieben Kategorien mit Suche und portionsweiser Anzeige; weiterhin sechs Startervorlagen beim Einrichten.
- Vollständige Crew-Sicherung einschließlich Logbuch, Vorschau vor Wiederherstellung und automatischer Rücksprungpunkt.
- Wiederherstellung nur für dieselbe bestehende Crew bei unveränderten Mitgliedern, Rollen und Kinderbegleitungen; aktuelle Zugänge bleiben erhalten und offene Einladungen werden widerrufen.
- Atomare Wiederherstellung mit Versionsprüfung, Validierung und Sperre veralteter Browseranfragen. Additive Datenbankmigration für zwei Rücksprungtabellen.
- Versionsanzeige weiterhin nur im Profil; API-Gesundheitsstatus verwendet dieselbe Versionsquelle.
- 104 automatisierte Tests. Typprüfung und Build gehören zur Veröffentlichung. Die visuelle Browser- und reale Geräteprüfung bleibt wegen der nicht erreichbaren Vorschau offen.

## 0.6.1 · 30. Oktober 2026

- Profilbild im Kopfbereich wieder sicher rund begrenzt; freigeschaltete Abzeichen bleiben außen sichtbar.
- Versionsnummer im Profil, einheitlich aus der Paketversion.
- Feste Größe für den Profilknopf und Zeilenumbruch bei wenig Platz oder großen Sterneständen.

## 0.6.0 · 30. Oktober 2026

- Sieben-Tage-Plan mit offenen und kommenden Runden, Tagesauswahl und geplanter Zuständigkeit.
- Eigene Bereiche mit zwölf Symbolen, Bearbeitung und passenden Missionsfiltern.
- Bis zu zwölf Teilschritte pro Mission, serverseitige Vollständigkeitsprüfung und Punkte erst für den gesamten Abschluss.
- Schutz gegen veraltete Checklisten, sichere parallele Änderungen sowie ursprüngliche Checklisten bei Kinderfreigaben.
- Suche in Titel, Bereich und Teilschritten; editierbare Aufgabenkopien und jederzeit erreichbare Vorlagen.
- Direkter Rücknahmeweg nach einem Abschluss; Missionen und Wochenplan vor der ausführlichen Wochenquest.
- Exportformat 5, kompatible Weiterführung bestehender Daten und 87 erfolgreiche automatisierte Tests.

## 0.5.0

- Wachsende gemeinsame Raumstation mit drei illustrierten Ausbauten und dauerhaft gespeicherten Zielwochen.
- Wochenquests mit automatisch wiederholbarer Aufgabenauswahl und einmalig 20 Bonussternen pro beteiligtem Profil.
- Transaktionale Bonusvergabe bei parallelen Abschlüssen; korrekte Rücknahmen, Nachmeldungen und Wochenwechsel.
- Persönliche Sparziele und editierbare Wunschvorschläge für Familien, Paare, WGs und Einzelhaushalte.
- Zwei neue Astronautenanzüge, sechs Erfolge sowie auswählbare Titel und Abzeichen.
- Individuelle Wochenziele und übernehmbare Punktevorschläge aus Dauer und Aufwand.
- Exportformat 4, kompatible Weiterführung bestehender Daten, 61 automatisierte Tests.

# Änderungen

## Web-App 0.4.0 · 29. Oktober 2026

- Kalenderplanung für bestimmte Wochentage, Abstände von 1 bis 12 Wochen und monatliche Termine einschließlich kurzer Monate.
- Automatisch wechselnde Zuständigkeiten mit frei gewählter Reihenfolge und Montag als Wechseltermin.
- Heute, überfällige Aufgaben, nächste Termine, erledigte Runden, Pausen und Filter für die eigene Einteilung.
- Aufgabenpausen mit Enddatum oder manueller Fortsetzung, ohne angesammelte Nachholrunden.
- Optionale Freigabe für Kinderabschlüsse; bestätigen, wieder öffnen oder Meldung zurückziehen.
- Rücknahme neuer Abschlüsse im Logbuch mit einmaliger Punktekorrektur; Schutz neuerer Runden und bestehender Einlösungen.
- Klare Anzeige negativer Sternestände nach Korrekturen bereits ausgegebener Sterne.
- Exportformat 3 mit offenen Freigaben; bestehende Dokumente bleiben kompatibel.
- 42 erfolgreiche automatisierte Prüfungen sowie Browserprüfung der Planungskomponenten bei schmaler Darstellung.

## Web-App 0.3.0 · 29. Oktober 2026

- Dreistufiger Einstieg für Familien, Paare, WGs und Einzelhaushalte; Aufgaben einzeln auswählbar.
- Vorschau und Prüfung von Einladungen vor dem Beitritt.
- Begleitete Kinderprofile mit eigenem Fortschritt, Wünschen und Ausrüstung, ohne eigenes Konto.
- Mitglieder entfernen, Crew verlassen, Captain-Rolle und Kinderbegleitung übertragen.
- Crew schließen und archivieren mit ausdrücklicher Bestätigung.
- Crew-Aktionen im Logbuch; Begleitperson bei Kinderleistungen nachvollziehbar.
- Atomare Aufhebung von Mitgliedschaften, Schutz vor veralteten Änderungen und Prüfung auf verwaiste Kinderprofile.
- Bestehende Daten bleiben kompatibel. Exportformat auf Version 2 erweitert.
- 24 Integrationstests gegen D1 und aktualisierte Dokumentation.

## Web-App 0.2.0 · 29. Oktober 2026

- Browser-Demo durch serverseitige Datenhaltung mit echten Konten ersetzt.
- Crew-Gründung, optionale Aufgabenvorlagen und Start mit null Punkten.
- Einmalige, widerrufbare Einladungen, Profiländerungen und Rollenprüfung.
- Zuständigkeiten, Fälligkeiten, Logbuch und Export des aktuellen Crewstands ergänzt.
- Punkte und Einlösungen gegen gleichzeitige Zugriffe abgesichert.
- Bestehendes Design und private Website-Freigabe beibehalten.
