# Prüfstand 0.14.0 · 30. Oktober 2026

## Funktionsumfang und Bestand

Ausgangspunkt ist der gespeicherte und veröffentlichte 0.13.2-Quellstand `d485c3dec7629650bca816b016f2dabcefc46cd3`. 24 Wunsch-Symbole, getrennte Sammlungen, Profilstatistik, Routinen, Offline-Abgleich, Erinnerungen und bestehende Crew-Funktionen bleiben erhalten. Vier Hauptreiter, kein zusätzlicher Versionshinweis im Kopfbereich, keine SQL-Migration.

## Neue automatisierte Prüfungen

20 zusätzliche API-/Integrationsprüfungen gegen die echte Serverlogik und eine isolierte D1-Datenbank decken ab:

- Kumulative Zeitbudgets, Schonmodus, geeignete Besuchsaufgaben und die zehn Vorlagen für Planung und Organisation.
- Persönliche und gemeinsame Auszeiten, Rollenrechte, ungültige Daten, frühe Rückkehr, ersetzte Auszeiten und Monats-/Wochenrunden ohne Nachholstau.
- Rotation nach Aufwand, stabile aktuelle Zuteilung, Abwesenheit aller gewählten Personen, ursprüngliche Wochenreihenfolge sowie noch offene künftige faire Zuständigkeiten.
- Exakte Teilung ungerader XP-/Sternenbeträge, keine vorzeitigen Punkte, getrennte und gleichzeitige Bestätigungen, Fremdprofile und normaler Abschluss als unzulässige Umgehung.
- Gemeinsame Checklisten, Kinderfreigaben, unberechtigte Freigabe, Zurückweisen und spätere Bestätigung; Freigabe vor dem Abschluss der anderen Person.
- Auflösen, Tageswechsel, Austritt und Auszeit ohne verbleibende gemeinsame Ansprüche; atomare Rücknahme beider Anteile.
- Questboni beider Mitwirkenden einschließlich ihrer gemeinsamen Korrektur; Statistik mit dem tatsächlichen individuellen Anteil.
- Dekorationsrechte, sichtbare Freischaltungen, keine Sternenausgaben und Sicherungen vor/nach gemeinsamem Abschluss einschließlich Freigaben, Aufwandsdaten und Auszeiten.

Die vorhandenen Prüfungen laufen unverändert weiter; zwei feste Vorlagenanzahlen wurden an die erweiterte Sammlung angepasst. Der endgültige Gesamtprüfstand steht unten.

## Endgültiger Gesamtprüfstand

- `npm run typecheck`: erfolgreich, keine TypeScript-Fehler.
- `npm test`: 233 Prüfungen bestanden, keine fehlgeschlagenen oder übersprungenen Prüfungen.
- Produktionsbuild einschließlich Offline-Einstieg: erfolgreich mit dem offiziellen Sites-Buildhelfer.
- `git diff --check`: erfolgreich. Keine Testadapter oder QA-Routen in Quellstand oder Build.

## Browserprüfung

Die echte React-Oberfläche wurde in der verwalteten Vorschau mit einem ausdrücklich gekennzeichneten isolierten Testadapter und ausschließlich synthetischen Daten bedient. Dieser Adapter wurde vor Typprüfung, Produktionsbuild und Veröffentlichung vollständig entfernt. Produktionsdaten wurden bei den UI-Prüfungen nicht gelesen oder verändert.

- 320-Pixel-Rahmen (303 Pixel nutzbare Inhaltsbreite): Schonmodus und Besuchsauswahl, Start einer Besuchsrunde, Aufgabendetail, Partnerauswahl, sichtbare Teilung, Bestätigung des eigenen Teils, Auszeitformular und Pausenansicht sowie Wohnkapsel und Dekorationswechsel. Keine horizontale Überbreite; Modus-Schaltflächen 48 Pixel hoch.
- 390-Pixel-Rahmen: Sammlung „Mitdenken & organisieren“ mit zehn Vorschlägen, Übernahme in das Missionsformular, Auswahl der fairen Rotation und geeigneter Mitglieder. Das Dialoglayout bleibt innerhalb seiner Breite (356 Pixel einschließlich der vorhandenen Scrollbar-Geometrie).
- 360- und 430-Pixel-Rahmen: Basis und vier Hauptreiter geprüft, keine horizontale Überbreite (343 bzw. 413 Pixel nutzbare Inhaltsbreite).
- Die Sternenanzeige bleibt nach der einzelnen gemeinsamen Bestätigung unverändert; deren serverseitige Wirkung ist zusätzlich in den D1-Integrationstests abgedeckt.

## Grenzen

Keine Prüfung auf einem physischen Android-Gerät oder iPhone, kein realer Mehrgeräte- oder authentifizierter Produktionsdurchlauf. Ein HTTPS-Offline-Neustart wurde in dieser Änderung nicht neu durchgespielt. Bestehende Offline-Abgleichstests bleiben Teil der Gesamtsuite. Gemeinsame Abschlüsse benötigen ausdrücklich eine Verbindung, normale Abschlüsse können weiterhin vorgemerkt werden. Die Freigaben der bestehenden Site bleiben unverändert.
