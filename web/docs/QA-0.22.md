# Prüfstand 0.22.0 · 2. November 2026

- 316 automatisierte Tests ohne Fehler oder übersprungene Fälle; nach Ergänzung der Rechtslinks erneut alle 18 betroffenen Server- und Website-Tests erfolgreich.
- TypeScript, Sites-Produktionsbuild, Offline-Build und eigenständiger Docker-Frontend-Build erfolgreich.
- Öffentliche Website: konfigurierte Adressen, QR-Code, www-Weiterleitung, sichere Header, GET/HEAD, Ablehnung schreibender Requests, gesperrte Konto-/Daten-/Service-Worker-Pfade und Schutz vor Pfad- und Symlink-Ausbrüchen.
- Echte App-Ansicht eines synthetischen Beispielhaushalts für die Website aufgenommen. Browserprüfung der Website für Desktop sowie 390 und 320 Pixel breite Vorschaufenster; lokale Bilder/Schriften, Navigation, Installationsanleitungen, FAQ und Rechtsseiten geprüft.
- Der GitHub-Workflow baut und startet das Produktionsimage auf amd64 und arm64 und prüft beide HTTP-Oberflächen einschließlich des App-Zugriffsschutzes. Veröffentlichte Image-Tags enthalten den geprüften Commit, der Store pinnt den Manifest-Digest.
- Der Store-Workflow prüft die tatsächliche Umbrel-Installation, Einrichtung, Anmeldung, Website während der Einrichtung sowie Update und Neustart auf nativen amd64- und arm64-Systemen.

Die lokale Vorschau ist kein Nachweis für die Installation auf dem privaten Umbrel. Reale Brevo-Zustellung, vollständiger Produktionsdatenumzug und Installation auf echten Android-/iPhone-Geräten benötigen den laufenden Zielserver. Kontolöschung und Änderung der Login-E-Mail bleiben ohne Selbstbedienung; Löschanfragen sind über den in der Datenschutzerklärung genannten Kontakt möglich. Web Push bleibt im eigenständigen Betrieb unkonfiguriert.
