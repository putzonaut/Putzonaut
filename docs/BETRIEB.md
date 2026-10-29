# Betrieb auf dem eigenen Server

## Erstinstallation

1. Projekt auf den Zielrechner kopieren. Docker Engine und Compose müssen vorhanden sein.
2. `node scripts/configure.mjs --origin https://DEINE-DOMAIN` einmal ausführen. Node ist nur für diesen Konfigurationsschritt auf dem Host nötig; die Datei kann auch auf dem Entwicklungsrechner erzeugt und sicher übertragen werden.
3. Die entstandene `.env` sicher verwahren. Sie enthält das Datenbankpasswort und den Einrichtungscode. Keine dieser Angaben gehört ins Repository.
4. Mit `docker compose up -d --build` starten. `docker compose ps` zeigt den Zustand beider Dienste.
5. Cloudflare Tunnel auf den App-Dienst verweisen. Läuft `cloudflared` direkt auf demselben Host, ist die Standardadresse `http://localhost:3080`. Läuft es in einem Container, zeigt dessen `localhost` auf den Tunnelcontainer. Dann entweder ein gemeinsames Docker-Netzwerk mit dem App-Dienst verwenden oder den App-Port gezielt auf einer erreichbaren Host-Adresse binden.
6. Die konfigurierte Domain öffnen. Mit dem `SETUP_TOKEN` aus `.env` den ersten Administrator und die Familiencrew erstellen. Danach ist die Ersteinrichtung serverseitig gesperrt.
7. Unter „Crew“ eine Einladung erstellen und den Link selbst an das gewünschte Familienmitglied weitergeben. Der Link ist einmal nutzbar und läuft nach sieben Tagen ab.

## Cloudflare und lokale Adressen

Der Tunnel veröffentlicht ausschließlich den App-Dienst. Datenbank und Verwaltungszugang des Servers bleiben intern. Putzonaut besitzt eine eigene Anmeldung; die öffentliche Domain gewährt keinen Zugriff auf Familienaufgaben ohne Sitzung.

`APP_ORIGIN` legt fest, von welcher Adresse schreibende Anfragen akzeptiert werden. Sie muss exakt stimmen und darf keinen Pfad oder abschließenden Schrägstrich enthalten. Eine HTTPS-Origin aktiviert sichere Sitzungscookies. Für Installation als PWA sollte eine HTTPS-Adresse verwendet werden.

Soll die App vorübergehend über die LAN-Adresse erreichbar sein, beispielsweise `http://192.168.1.50:3080`, müssen sowohl `APP_ORIGIN` als auch `BIND_ADDRESS` passend gesetzt werden. `BIND_ADDRESS=0.0.0.0` veröffentlicht den Port auf allen Host-Schnittstellen; eine konkrete LAN-Adresse begrenzt die Bindung. Keine Router-Portfreigabe nötig, wenn der spätere externe Zugang über Cloudflare Tunnel erfolgt.

Die konkrete Netzwerkanbindung auf Umbrel wird bei der Installation geprüft. Das generische Compose-Paket verändert keine Umbrel-Systemdateien und ist noch kein Community-Store-Paket.

## Sicherung und Wiederherstellung

Anwendungsupdates sind von den Daten getrennt. Das Volume `putzonaut_data` bleibt bei `docker compose down` bestehen. `docker compose down -v` würde die Daten löschen und gehört nicht zum Updateablauf.

Sicherung in einem privaten Verzeichnis erstellen:

```bash
mkdir -p backups
chmod 700 backups
docker compose exec -T db pg_dump -U putzonaut -d putzonaut -Fc > backups/putzonaut.dump
chmod 600 backups/putzonaut.dump
```

Vor einer Wiederherstellung die bestehende Datenbank separat sichern. Für eine leere Zielinstallation:

```bash
docker compose stop app
docker compose exec -T db pg_restore -U putzonaut -d putzonaut --clean --if-exists < backups/putzonaut.dump
docker compose start app
```

`pg_restore --clean` ersetzt die vorhandenen Datenbankobjekte durch den Stand der Sicherung. Deshalb nur bewusst für eine Wiederherstellung verwenden. Die `.env` getrennt sichern. Eine zusätzliche Kopie der Sicherung sollte außerhalb des Servers liegen. Eine automatische Sicherungsplanung ist in 0.1.0 noch nicht eingerichtet.

## Updates

Zunächst sichern, dann den neuen Quellstand übernehmen und `docker compose up -d --build` ausführen. `docker compose logs --tail=100 app` zeigt Startfehler. Migrationen laufen vor Annahme von Anfragen. Alle Versionen benötigen einen eigenen geprüften Updatepfad; 0.1.0 ist die erste Datenbankschemaversion.

## Passwort vergessen

Der Betreiber kann im Terminal interaktiv ein neues Passwort setzen:

```bash
docker compose exec app node scripts/admin-reset.ts
```

Das Passwort wird verborgen eingegeben. Der Vorgang meldet alle bestehenden Sitzungen dieses Kontos ab. Im normalen Betrieb steht „Passwort ändern“ im Profil zur Verfügung. E-Mail-Versand und Passwort-zurücksetzen-Mails sind noch nicht enthalten.

## Verfügbarkeit

Für gemeinsamen aktuellen Datenstand müssen App, Datenbank, Internetverbindung und Tunnel erreichbar sein. Der Service Worker speichert die statische Oberfläche, jedoch keine privaten API-Antworten. Erledigungen werden ausschließlich nach erfolgreicher Bestätigung des Servers angezeigt; offline lassen sich noch keine Änderungen vormerken.
