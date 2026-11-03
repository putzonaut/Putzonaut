# Installation mit Docker

Putzonaut lässt sich mit Docker Compose auf einem eigenen Server betreiben. Die fertigen Images unterstützen **Linux amd64 und arm64**. Website und App laufen im selben Container; Konten, Haushaltsdaten und Fotos werden in einem dauerhaften Datenvolume gespeichert.

## Voraussetzungen

- Docker Engine mit Docker Compose.
- Eine HTTPS-Adresse für die App und ein HTTPS-Reverse-Proxy.
- Ein SMTP-Dienst für Bestätigungs- und Passwort-Mails.

## 1. Dateien vorbereiten

Diese beiden Dateien in einem gemeinsamen Konfigurationsordner ablegen:

| Vorlage | Dateiname im Konfigurationsordner |
| --- | --- |
| [compose.image.yaml](../web/standalone/compose.image.yaml) | `compose.yaml` |
| [.env.image.example](../web/standalone/.env.image.example) | `.env.example` |

Im Konfigurationsordner:

```sh
cp .env.example .env
chmod 600 .env
openssl rand -hex 48
```

Der erzeugte Zufallswert wird einmalig als `BETTER_AUTH_SECRET` in `.env` eingetragen und bei späteren Updates beibehalten.

## 2. Konfiguration setzen

Die mitgelieferten Domain- und Mailwerte sind Beispiele und werden durch die Angaben der jeweiligen Installation ersetzt.

| Variable | Bedeutung |
| --- | --- |
| `PUTZONAUT_IMAGE` | Container-Image; der geprüfte Stand ist unten angegeben. |
| `APP_ORIGIN` | Öffentliche HTTPS-Adresse der App ohne abschließenden Schrägstrich, z. B. `https://app.example.org`. |
| `WEBSITE_ORIGIN` | HTTPS-Adresse der optionalen Vorstellungsseite, z. B. `https://example.org`. |
| `BETTER_AUTH_SECRET` | Der zuvor erzeugte dauerhafte Zufallswert. |
| `MAIL_FROM` | Beim SMTP-Anbieter bestätigter Absender, z. B. `Putzonaut <mail@example.org>`. |
| `SMTP_HOST` | Serveradresse des gewählten SMTP-Anbieters. |
| `SMTP_PORT` | `587` für STARTTLS oder `465` für TLS ab Verbindungsbeginn. |
| `SMTP_USER` / `SMTP_PASSWORD` | SMTP-Zugangsdaten des gewählten Anbieters. |

Geprüftes Image für **0.24.0**:

```dotenv
PUTZONAUT_IMAGE=ghcr.io/putzonaut/putzonaut:0.24.0-ca964bf69a05@sha256:5c1de351c5fa2d570f3de925e78a06e7efabb679cd1b9077bdce39e50a9b1217
```

Das Image ist öffentlich abrufbar. Zugangsdaten verbleiben in der privaten `.env`-Datei.

## 3. Starten

```sh
docker compose pull
docker compose up -d
docker compose ps
```

## 4. HTTPS einrichten

Die Compose-Datei bindet beide Ports ausschließlich an die lokale Adresse des Servers. Ein auf dem Host laufender HTTPS-Reverse-Proxy leitet die öffentlichen Adressen an diese Ziele weiter:

| Beispieladresse | Lokales Ziel |
| --- | --- |
| `https://app.example.org` | `http://127.0.0.1:3080` |
| `https://example.org` — optionale Vorstellungsseite | `http://127.0.0.1:3081` |

Der Proxy muss mindestens **9 MB Request-Body** erlauben. `APP_ORIGIN` und `WEBSITE_ORIGIN` müssen mit den veröffentlichten Adressen übereinstimmen.

<details>
<summary>Reverse-Proxy in einem eigenen Container</summary>

Die zusätzliche Datei [compose.tunnel.yaml](../web/standalone/compose.tunnel.yaml) verbindet Putzonaut mit einem bestehenden Docker-Netzwerk des Proxys. Dessen Namen enthält `PUTZONAUT_TUNNEL_NETWORK` in `.env`.

```sh
docker compose -f compose.yaml -f compose.tunnel.yaml pull
docker compose -f compose.yaml -f compose.tunnel.yaml up -d
```

Innerhalb dieses Netzwerks lauten die Ziele `http://putzonaut-origin:3080` für die App und `http://putzonaut-origin:3081` für die Vorstellungsseite.

</details>

Die optionale Vorstellungsseite enthält Betreiberangaben für putzonaut.de. Bei einer anderen öffentlichen Installation werden [Impressum](../web/website/impressum.html) und [Datenschutzerklärung](../web/website/datenschutz.html) vor der Veröffentlichung angepasst und in ein eigenes Image übernommen.

## Daten & Updates

Das benannte Volume `putzonaut-data` enthält die Datenbanken und Fotos. Vor Updates wird der Dienst angehalten und das gesamte Volume gesichert; die private `.env`-Datei mit dem ursprünglichen Secret wird separat aufbewahrt.

Für ein Update den geprüften Image-Verweis in `.env` ändern und anschließend erneut `docker compose pull` sowie `docker compose up -d` ausführen. Bei Verwendung der Netzwerk-Ergänzung gelten dieselben `-f`-Argumente wie beim ersten Start. Projektname, Volume und Secret bleiben erhalten. `docker compose down -v` löscht das Datenvolume.

Eine Wiederherstellung erfolgt bei gestopptem Dienst aus zusammengehörigen Daten und Konfiguration; UID/GID 1000 muss Zugriff auf das Volume haben. Die erste Prüfung erfolgt isoliert mit derselben App-Version.

[Zur Projektübersicht](../README.md) · [Änderungen](../web/CHANGELOG.md) · [Hilfe](mailto:sos@putzonaut.de)
