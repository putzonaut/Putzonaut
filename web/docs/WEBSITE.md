# Öffentliche Website · 0.22.1

Die freigegebene Website liegt unter `website/`. `npm run build:standalone` kopiert sie nach `dist/website` und ergänzt Nunito-Schriften sowie das vorhandene App-Symbol. Das Docker-Image liefert diese Oberfläche auf Port 3081 aus; die App bleibt auf Port 3080.

`__APP_ORIGIN__` und `__SITE_ORIGIN__` werden beim Serverstart durch die konfigurierten Adressen ersetzt. Der QR-Code entsteht aus `APP_ORIGIN`. Rechtstexte verwenden die Routen `/impressum` und `/datenschutz`. Die Startseite hat keine Vorschau-Suchmaschinen-Sperre; `robots.txt` und Sitemap erzeugt der Server.

Die Gestaltung stammt aus der freigegebenen Website-Vorschau, Commit `4ba14f044ba0d0b2e811783386857bdc7b32eefd`: dunkle Glasflächen, Nunito, „Auf Hochglanzkurs“, Smartphone-Anleitung und Hilfe über `sos@putzonaut.de` sowie GitHub-Issues. Die bestehenden Rechtstexte wurden inhaltlich beibehalten.

## Bilder und Animation

`website-assets/screens/home.svg` ist ein skalierbarer App-Einblick mit synthetischem Beispielhaushalt und „Hey, Katharina!“. Er enthält Schriften und kleine Bildbestandteile direkt. Nur diese SVG-Antwort erlaubt eingebettete Schrift- und Bilddaten sowie internes CSS; Skripte sind gesperrt. Die HTML-Seiten behalten ihre strikte Content Security Policy ohne Inline-Skripte oder Inline-Styles.

`website-assets/putzonaut-rocket.webp` ist die optimierte transparente Raketenillustration (1200 × 600 Pixel, etwa 133 KiB). Sie wurde mit Imagegen anhand der bestehenden Putzonaut-Figur erstellt. Original-PNG, Charakterreferenz und Erzeugungsprompt bleiben im Quellprojekt der freigegebenen Vorschau. Im App-Repository wird nur das benötigte WebP ausgeliefert.

SVG-Clips trennen Rakete und Schrubberarm. CSS animiert Schubflamme, Schweben und Geste ohne Videodatei oder Animationsbibliothek. Die Szene ist dekorativ, startet automatisch und hat keine Wiedergabeschaltfläche. Sie pausiert außerhalb des Sichtbereichs und in unsichtbaren Tabs; reduzierte Bewegung zeigt ein Standbild. Die drei Funktionskarten animieren einmal beim Einblenden.

## Prüfung

`npm test` prüft die Website-Isolation, konfigurierten Links und die auf das App-Bild begrenzte CSP. Der Docker-Workflow startet auf amd64 und arm64 jeweils den Container und prüft App, Website, neue Assets, QR-Code und Rechtstexte, bevor er das Image veröffentlicht. Der Umbrel-Store verwendet weiterhin seinen bisherigen Digest, bis er separat aktualisiert wird.
