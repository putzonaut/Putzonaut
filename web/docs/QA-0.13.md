# Putzonaut 0.13 – Prüfstand

## Automatisierte Prüfung

201 Tests: die 178 bisherigen Fälle sowie 20 Fälle für Alltagshilfe/Offline-Daten und drei Service-Worker-Verhaltenstests. Typprüfung und Produktionsbuild gehören zur Freigabe. GitHub prüft die Web-App und weiterhin die vorhandene Docker-/PostgreSQL-Grundlage.

- Rückblick: vorige Kalenderwoche nach Berliner Datum, gespeichertes historisches Ziel, leere Wochen, einmaliges Schließen und echte spätere Rücknahme eines Abschlusses.
- Erinnerung: standardmäßig aus, gültige Uhrzeit, eigenes oder freies offenes Angebot, einmalige Anzeige bei parallelen Tabs, Datumswechsel, doppelte Herbststunde und übersprungene Frühlingsstunde. Kinderprofile haben getrennte Einstellungen und bestehende Begleitberechtigungen.
- Übergabe/Tausch: nur eigene zugeteilte offene Aufgaben; keine Änderung vor Annahme; gezielter Tausch mit gleichzeitigem Wechsel beider Aufgaben; fremde Annahme, doppelte Annahme, Wochenrotation und spätere Wiederholung. Bearbeitung, Pause, Archivierung, Abschluss und Mitgliedsaustritt invalidieren betroffene Anfragen.
- Offline-Abschluss: stabiler Anfrageschlüssel und gebundene Operation, paralleler Wiederholversuch, verlorene Antwort mit späterem Replay, bereits archivierte Aufgabe und Rücknahme eines früher bestätigten Abschlusses. Keine erneute Gutschrift.
- Offline-Checkliste und Abschluss werden gemeinsam bestätigt. Fehlende oder doppelte Schritte schreiben keine Teiländerung; geänderte Versionen, neue Runden, Pausen und übernommene Aufgaben werden abgewiesen.
- Kinderabschlüsse erhalten erst nach Freigabe Punkte. Ein späteres Replay der ursprünglichen Meldung erzeugt keine zweite Gutschrift.
- Konto-, Crew- und Wiederherstellungsgrenzen: zusätzlicher Viewer-Abgleich, vorhandene Household-/Epoch-Prüfung, getrennte lokale Bereiche und sichtbarer Konflikt nach Wiederherstellung. Höchstens 50 Vormerkungen und genau ein Eintrag pro Profil/Aufgabe/Runde.
- Sicherungen übernehmen neue Erinnerungs- und Übergabefelder. Unbekannte Profile und Tauschaufgaben werden abgewiesen; ältere Felder bleiben optional.
- Routinen verwenden die Tätigkeitskategorie und ausschließlich vorhandene, eindeutige Aufgaben, höchstens drei je Vorschlag.
- Service Worker: generische Offline-Seite nur bei fehlgeschlagener Root-Navigation, keine Überlagerung von 401/503 oder Anmeldeseiten, keine API-Caches, keine fremden URLs, keine gecachten HTML-Anmeldeseiten als JavaScript, Versionsprüfung und gezieltes Entfernen alter eigener statischer Caches.

## Browserprüfung mit synthetischen Daten

Nach Wiederherstellung der lokalen verwalteten Ausführungskonfiguration startet die Vorschau unter der vom Dienst ausgegebenen URL. Die echte Startseite zeigt den ChatGPT-Anmeldeeinstieg. Die angemeldete Oberfläche wurde zusätzlich mit denselben React-Komponenten, isolierten Testdaten und lokal simuliertem Netzwerk geprüft; dabei wurden keine Produktionsdaten geändert.

Geprüft: Basis und Wochenrückblick, Erinnerung aktivieren und Zeit auswählen, sichtbare Erinnerung auf der Basis, Aufgaben- und Tauschdialog, einklappbare Anfragen unter Missionen, alle vier Routinevorschläge, Profilzugänge und Offline-Vormerkung. Die Vormerkung ließ das Guthaben bei null; nach Wiederherstellung der simulierten Verbindung verschwand die Vormerkung und der bestätigte Testabschluss zeigte zehn Sterne. Dialog und Liste waren lesbar. Die Basis einschließlich Erinnerung und Rückblick wurde bei 360 Pixel Inhaltsbreite visuell geprüft. Das ist keine vollständige mobile Viewport- oder Geräteprüfung.

Die Prüfung deckte auf, dass der Erinnerungshinweis zunächst schon außerhalb der Basis als gezeigt markiert wurde. Die Anzeige beansprucht ihn nun erst auf der sichtbaren Basis ohne offenen Dialog; bei erledigten Aufgaben wird er ausgeblendet. Der Testaufbau liegt nicht im Produktionspaket. Die Datenbank- und Rechteprüfungen laufen separat gegen Miniflare D1.

## Bewusste Grenzen und nächste Praxistests

1. **Erinnerung nur in der geöffneten App.** Kein belegter Sites-Cron-Vertrag, keine Web-Push-Registrierung oder VAPID-Schlüssel, kein zusätzlicher Zeitdienst. Ein geschlossener Browser weckt sich nicht selbst für den Hinweis. Die UI benennt diese Grenze ausdrücklich.
2. **HTTPS-Offline-Neustart noch auf echten Geräten prüfen.** Die HTTP-Vorschau unterstützt hier keinen Service Worker. Die statische Produktionsoberfläche wird gebaut und das Cache-Verhalten automatisiert geprüft; Installation, Browser-Neustart im Flugmodus und Cache-Verdrängung müssen auf Android und iPhone praktisch geprüft werden.
3. **Gerätespeicher ist keine Serversicherung.** Erst bestätigte Abschlüsse sind bei der Crew gespeichert. Lokale Daten können durch den Browser verschwinden. Keine Zugangsdaten im Snapshot; bei abgelaufener Anmeldung bleibt die lokale Anzeige gesperrt. Explizites Abmelden nennt offene Vormerkungen und entfernt den Gerätestand.
4. **Runden werden nicht umdatiert.** Nach Tageswechsel, Aufgabenänderung oder Wiederherstellung wird ein Konflikt angezeigt. Die Nutzer prüfen den aktuellen Stand bzw. das Logbuch und verwerfen die alte Vormerkung. Kein automatisches Anwenden auf die neue Runde.
5. **Reale Mehrgeräte-Nutzung:** Zustimmung und Abgleich mit zwei Konten, Änderungen an begleiteten Kindern, mehrere Tabs und Wiederverbindung nach längerer Pause zusätzlich praktisch erproben. Parallelzugriffe und Berechtigungen sind bereits automatisiert geprüft.

Die Datenbank braucht keine neue SQL-Migration. Punkte- und Freischaltschwellen aus 0.12 bleiben unverändert.
