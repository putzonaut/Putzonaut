<p align="center">
  <img src="web/public/icons/icon-512.png" width="112" height="112" alt="Putzonaut – goldener Astronautenhelm mit türkisen Augen">
</p>

<h1 align="center">Putzonaut</h1>

<p align="center">
  <strong>Dein Haushalt. Eure Mission.</strong><br>
  Kleine Aufgaben. Gemeinsame Erfolge. Mehr Spaß im Alltag.
</p>

<p align="center">
  <a href="web/README.md">Funktionen</a> ·
  <a href="web/standalone/README.md">Installation</a> ·
  <a href="web/CHANGELOG.md">Änderungen</a>
</p>

---

Putzonaut macht aus Haushaltsaufgaben kleine Missionen. Erledige sie allein oder mit deiner Crew, sammle Sterne und erfülle persönliche oder gemeinsame Wünsche. Für Familien, Paare, WGs und alle, die ihren Haushalt allein organisieren.

## Das steckt drin

- **Missionen für deinen Alltag:** Vorlagen, Checklisten, wiederkehrende Aufgaben und kurze Putzrunden für 5, 10 oder 20 Minuten.
- **Erfolge, die motivieren:** Sterne, Level, Abzeichen, Anzüge und eigene Wünsche als Belohnung.
- **Gemeinsam organisiert:** Aufgaben verteilen, tauschen und Wochenziele erreichen. Kinderprofile werden von Erwachsenen begleitet.
- **Alles im Blick:** Wochenplan, Rückblick und persönliche Statistiken. Offline vorgemerkte Abschlüsse werden bei der nächsten Verbindung abgeglichen.

## Auf deinem Smartphone

Eine installierbare Web-App für Android und iPhone – mit eigenem Symbol auf dem Startbildschirm, hellem und dunklem Design. Die eigenständige Version verwendet Putzonaut-Konten mit E-Mail und Passwort.

**Version 0.22.2 · In Entwicklung.** Website und App laufen gemeinsam in einem Docker-Container. Den geprüften Umfang und die noch offenen Praxistests findest du im [Prüfstand](web/docs/QA-0.22.md).

## Selbst hosten

Installiere **Putzonaut** über [Denny’s Umbrel Community Store](https://github.com/dennysubke/dennys-umbrel-app-store). Website und App laufen gemeinsam in einem Docker-Container mit eigenem Datenspeicher. Für Bestätigungs- und Passwort-Mails wird ein SMTP-Zugang benötigt.

Die aktuelle Anwendung liegt in **`web/`**. Fertige Images für amd64 und arm64 sind auch für einen eigenständigen Docker-Compose-Betrieb verfügbar.

**[Zur Installationsanleitung →](web/standalone/README.md)**

<details>
<summary>Hinweis zum Repository</summary>

Die Dateien im Hauptverzeichnis stammen aus der früheren Version 0.1.0. Für neue Installationen mit fertigem Image verwende `web/standalone/compose.image.yaml`. Die [frühere Dokumentation](docs/LEGACY-0.1.md) bleibt zum Nachschlagen erhalten.

</details>
