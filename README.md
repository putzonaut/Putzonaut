<p align="center">
  <img src="docs/assets/putzonaut-logo.png" width="160" height="160" alt="Putzonaut – goldener Astronautenhelm mit leuchtenden türkisen Augen">
</p>

<h1 align="center">Putzonaut</h1>

<p align="center">
  <strong>Haushaltsaufgaben als Missionen. Sterne als Belohnung.</strong>
</p>

<p align="center">
  Putzonaut verbindet Aufgabenplanung, gemeinsame Ziele und spielerische Belohnungen für den Haushalt.
</p>

<p align="center">
  <a href="https://putzonaut.de">Website</a> &nbsp;·&nbsp;
  <a href="https://app.putzonaut.de">App öffnen</a> &nbsp;·&nbsp;
  <a href="docs/INSTALLATION.md">Selbst hosten</a> &nbsp;·&nbsp;
  <a href="web/CHANGELOG.md">Changelog</a>
</p>

<p align="center">
  <sub>Android &amp; iOS · Installierbare Web-App · Docker · amd64 &amp; arm64</sub>
</p>

---

## Haushalt mit Fortschritt

Für Familien, Paare, Wohngemeinschaften und Einpersonenhaushalte.

| | Funktionen |
| :--- | :--- |
| 🧹 **Missionen** | Aufgabenvorlagen, Checklisten, Wiederholungen und Putzrunden für 5, 10 oder 20 Minuten. |
| ⭐ **Belohnungen** | Sterne, Level, Abzeichen, Anzüge und persönliche oder gemeinsame Wünsche. |
| 👥 **Zusammenarbeit** | Aufgaben verteilen, Zuständigkeiten tauschen und gemeinsame Wochenziele erreichen. Kinderprofile werden von Erwachsenen verwaltet. |
| 📊 **Überblick** | Wochenplan, Rückblicke und Statistiken. Offline vorgemerkte Abschlüsse erhalten Sterne nach erfolgreichem Abgleich. |

## Selbst hosten

Putzonaut läuft mit **Docker Compose auf einem eigenen Server**. Fertige Images stehen für **amd64 und arm64** bereit. Konten, Haushaltsdaten und Fotos liegen im eigenen Datenvolume; Bestätigungs- und Passwort-Mails werden über einen konfigurierbaren SMTP-Dienst versendet.

Benötigt werden Docker Compose, eine HTTPS-Adresse und ein SMTP-Zugang. Die Anmeldung erfolgt über eigene Putzonaut-Konten mit E-Mail und Passwort.

**[Zur Docker-Installationsanleitung →](docs/INSTALLATION.md)**

## Dokumentation & Hilfe

[Funktionsübersicht](web/README.md) · [Versionshistorie](web/CHANGELOG.md) · [Prüfstand](web/docs/QA-0.22.md)

Fehlerberichte und Vorschläge: [GitHub Issues](https://github.com/putzonaut/putzonaut/issues)  
Hilfe bei Problemen: [sos@putzonaut.de](mailto:sos@putzonaut.de)

<details>
<summary><strong>Quellcode & Entwicklung</strong></summary>

Die aktuelle Anwendung liegt in [`web/`](web/). Die [Entwicklungsdokumentation](web/README.md) beschreibt Funktionen, Prüfungen und die Projektstruktur.

Die Dateien im Hauptverzeichnis enthalten außerdem die frühere Grundlage aus Version 0.1.0. Diese ist in der [Legacy-Dokumentation](docs/LEGACY-0.1.md) eingeordnet. Für aktuelle Installationen dient [`web/standalone/compose.image.yaml`](web/standalone/compose.image.yaml).

</details>

---

<p align="center">
  <sub>Version 0.22.2 · In Entwicklung</sub>
</p>
