# Brewery App

Lokale React-Anwendung zum Durchsuchen der Biertabelle `beer_v01` in einer Oracle-Datenbank. Ein OCI-ORDS-GET-Endpunkt liefert die JSON-Daten; das Backend ruft ihn per HTTPS ab und stellt sie der Oberfläche bereit.

## Voraussetzungen

- Node.js 20 oder neuer
- npm
- Einen erreichbaren HTTPS-ORDS-GET-Endpunkt, der die Biere als paginierte JSON-Antwort liefert

## Starten

1. Im Projektordner Abhängigkeiten installieren:

   ```sh
   npm install
   ```

2. `.env.example` nach `.env` kopieren und `ORDS_BEERS_URL` auf den vollständigen HTTPS-Endpunkt setzen, zum Beispiel `https://<host>/ords/<schema-alias>/<modul>/beers`.

3. Beide Entwicklungsserver starten:

   ```sh
   npm run dev
   ```

4. Die angezeigte Vite-Adresse im Browser öffnen (standardmäßig `http://127.0.0.1:5173`). Das Backend läuft standardmäßig unter `http://127.0.0.1:3001`.

## Funktionen

- Anzeige von Name, Bierstil und Alkoholgehalt (ABV)
- Suche in Name und Bierstil
- Filter nach Bierstil und ABV-Minimum/-Maximum
- Sortierung nach Name oder ABV, serverseitige Pagination
- Lesender Datenbankzugriff; keine Anmeldung oder Schreibfunktionen

Der GET-Endpunkt sollte eine ORDS-Antwort mit `items`, `hasMore` und Einträgen der Form `{"data":{"name":"…","style":"…","abv":5.4}}` zurückgeben und `limit`/`offset` unterstützen. Das Backend lädt die Seiten und hält die Einträge 30 Sekunden im Speicher; Suche, Filter, Sortierung und Seitenwechsel erfolgen anschliessend in der API.

## Prüfen

```sh
npm run typecheck
npm run build
```
