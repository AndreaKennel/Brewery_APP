# Brewery App

Lokale React-Anwendung zum Durchsuchen der MongoDB-Datenbank `brewdbV01`, Collection `beers`. Das Frontend verbindet sich nur mit einer Express-API; MongoDB-Zugangsdaten bleiben serverseitig.

## Voraussetzungen

- Node.js 20 oder neuer
- npm
- Eine erreichbare MongoDB mit der Datenbank `brewdbV01` und der Collection `beers`

## Starten

1. Im Projektordner Abhängigkeiten installieren:

   ```sh
   npm install
   ```

2. `.env.example` nach `.env` kopieren. Für eine lokale MongoDB kann die Beispiel-URI verwendet werden. Bei einem Server oder MongoDB Atlas `MONGODB_URI` lokal in `.env` anpassen. Zugangsdaten nicht in den Quellcode oder ins Frontend schreiben.

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

Die API erkennt derzeit diese Feldvarianten: Name (`name`, `beerName`, `beer_name`, `title`), Bierstil (`style`, `beerStyle`, `beer_style`, `category`) und ABV (`abv`, `ABV`, `alcoholByVolume`, `alcohol_by_volume`). Wenn die Dokumente andere Felder oder ein verschachteltes Schema verwenden, müssen diese Aliaslisten in `server/src/index.ts` angepasst werden.

## Prüfen

```sh
npm run typecheck
npm run build
```
