# Prüfstand 0.25.0 · Saison und Alltag

## Verhalten

- Optionale Monatsauswahl im bestehenden Wiederholungsformular. Außerhalb der Saison gibt es keine offene Runde und keinen Rückstau. Zusammenhängende Wintermonate können über den Jahreswechsel reichen. Kalenderabstände behalten ihren Anker; eine Wochenrunde gehört zum Monat ihres Montags.
- „Heute nicht nötig“ unter „Heute passt nicht“ lässt eine offene wiederkehrende Runde ohne Sterne, XP oder Erledigungszählung aus. Feste Rhythmen behalten den nächsten regulären Termin. Bei abschlussabhängigen Wiederholungen beginnt der Abstand am Tag des Auslassens neu.
- Der Server prüft Profilrechte, Auszeiten, Aufgabenrevision und Rundenkennung. Gemeinsame Runden und ausstehende Kinderfreigaben können nicht so übersprungen werden. Wiederholte Übertragungen gelten einmal; alte Offline-Abschlüsse werden abgewiesen. Laufende Putzrunden markieren den Eintrag als übersprungen.
- Automatisch ausgewählte Putzrunden bündeln Aufgaben nach Bereichen, ohne Auswahl, Zeitbudget oder erste Aufgabe zu verändern. Explizite Routinen behalten die gespeicherte Reihenfolge.
- Gießkanne, Socke und Glanz erscheinen für höchstens 1,4 Sekunden beim bestehenden Erfolgsmaskottchen. Nur frisch bestätigte eigene Abschlüsse lösen eine Reaktion aus. Deaktivierte Animationen, reduzierte Bewegung und ein nicht sichtbares Fenster unterdrücken sie. Der Wechsel zurück von der Erfolgsseite spielt sie nach Ablauf nicht erneut ab.
- Keine neue Hauptnavigation und keine SQL-Migration. Sicherungen mit Saison-/Auslassfeldern benötigen mindestens Version 0.25.0. Saisonangaben bleiben in Entwürfen und Kopien erhalten; Kopien enthalten keine alten Abschlüsse oder Auslassungen.

## Automatisierte Prüfung

Die Freigabe umfasst 363 App-Tests, TypeScript-Prüfung, Framework-/Offline-Build und den eigenständigen Produktionsbuild.

20 zusätzliche Tests decken Saisonwechsel, Wintermonate, Lücken, sämtliche Kalenderarten, Anker über Schaltjahre und Monatsenden, Pausen, alte Verschiebungen und unabhängige Terminenumeration ab. Dazu kommen API-Prüfungen für gleichzeitiges Auslassen/Abschließen, idempotente Wiederholung, unveränderte Punkte, veraltete Offline-Runden, Kinderprofile, Aufgabenrechte, Sicherung/Wiederherstellung, ungültige Konfigurationen sowie Raumreihenfolge und unveränderte persönliche Routinen.

## Veröffentlichung und Browser

Der Workflow `Web-App` prüft die Produktionscontainer für amd64 und arm64 vor Veröffentlichung. Der Store-Workflow installiert das veröffentlichte Image nativ auf frischen Umbrel-2.0-Testhosts beider Architekturen.

Der Browsertest bedient Saisonwahl, leere/ungültige Auswahl, Entwurf fortsetzen, Duplizieren und „Heute nicht nötig“. Er vergleicht die tatsächlichen Kontostände, prüft Raumreihenfolge, alle drei Reaktionen sowie deaktivierte und reduzierte Bewegung. Bildschirmaufnahmen erfassen 360 Pixel breite Mobilansichten und Desktopdarstellung. Das bestehende Konto-, Website- und Wiederholungsprogramm läuft weiterhin; Saison-/Auslassdaten werden nach Update und Neustart erneut geprüft.

Die Updateprüfung installiert dieselbe veröffentlichte Version erneut; sie ist kein separater Migrationstest von 0.24.0. Ein bereits laufender privater Server erhält das Update erst nach Installation durch seinen Betreiber.
