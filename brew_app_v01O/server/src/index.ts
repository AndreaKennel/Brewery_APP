import { config } from "dotenv";
import express, { type ErrorRequestHandler } from "express";
import { fileURLToPath } from "node:url";

config({ path: fileURLToPath(new URL("../../.env", import.meta.url)) });

const app = express();
const port = Number(process.env.API_PORT ?? 3001);
const ordsBeersUrl = process.env.ORDS_BEERS_URL;
const pageSizeLimit = 100;
const ordsPageSize = 100;
const cacheDurationMs = 30_000;

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error("API_PORT muss eine gültige Portnummer sein.");
}

if (!ordsBeersUrl) {
  throw new Error("ORDS_BEERS_URL muss in der .env-Datei gesetzt sein.");
}

const ordsUrl = new URL(ordsBeersUrl);
if (ordsUrl.protocol !== "https:") {
  throw new Error("ORDS_BEERS_URL muss aus Sicherheitsgründen eine HTTPS-URL sein.");
}

type Beer = {
  id: string;
  name: string;
  style: string;
  abv: number | null;
};

class RequestValidationError extends Error {}

function positiveInteger(value: unknown, fallback: number, max: number) {
  if (typeof value !== "string" || !/^\d+$/.test(value)) return fallback;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? Math.min(parsed, max) : fallback;
}

function abvQueryValue(value: unknown, label: string) {
  if (value === undefined) return undefined;
  if (typeof value !== "string" || value.trim() === "") {
    throw new RequestValidationError(`${label} muss eine Zahl zwischen 0 und 100 sein.`);
  }
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0 || parsed > 100) {
    throw new RequestValidationError(`${label} muss eine Zahl zwischen 0 und 100 sein.`);
  }
  return parsed;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizedAbv(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

let beerCache: { items: Beer[]; expiresAt: number } | undefined;
let beerRequest: Promise<Beer[]> | undefined;

async function fetchAllBeers(): Promise<Beer[]> {
  const beers: Beer[] = [];
  let offset = 0;
  let hasMore = true;

  while (hasMore) {
    const url = new URL(ordsUrl);
    url.searchParams.set("limit", String(ordsPageSize));
    url.searchParams.set("offset", String(offset));

    const response = await fetch(url, {
      signal: AbortSignal.timeout(20_000),
      headers: { Accept: "application/json" },
    });
    if (!response.ok) {
      throw new Error(`OCI-Bier-Endpunkt antwortete mit HTTP ${response.status}.`);
    }

    const result: unknown = await response.json();
    if (!isRecord(result) || !Array.isArray(result.items) || typeof result.hasMore !== "boolean") {
      throw new Error("OCI-Antwort enthält kein gültiges ORDS-Resultset.");
    }
    if (result.items.length === 0 && result.hasMore) {
      throw new Error("OCI meldet weitere Biere, liefert aber eine leere Ergebnisseite.");
    }

    for (const [index, item] of result.items.entries()) {
      if (!isRecord(item) || !isRecord(item.data)) {
        throw new Error("OCI-Antwort enthält einen ungültigen Biereintrag.");
      }
      const data = item.data;
      const recordIndex = offset + index;
      beers.push({
        id: typeof data.id === "string" || typeof data.id === "number"
          ? String(data.id)
          : String(recordIndex),
        name: typeof data.name === "string" ? data.name : "",
        style: typeof data.style === "string" ? data.style : "",
        abv: normalizedAbv(data.abv),
      });
    }

    hasMore = result.hasMore;
    offset += result.items.length;
  }

  return beers;
}

async function getBeers(): Promise<Beer[]> {
  if (beerCache && beerCache.expiresAt > Date.now()) return beerCache.items;
  if (beerRequest) return beerRequest;

  beerRequest = fetchAllBeers();
  try {
    const items = await beerRequest;
    beerCache = { items, expiresAt: Date.now() + cacheDurationMs };
    return items;
  } finally {
    beerRequest = undefined;
  }
}

function filterAndSortBeers(
  beers: Beer[],
  search: string,
  style: string,
  minAbv: number | undefined,
  maxAbv: number | undefined,
  sort: string,
  order: "asc" | "desc",
) {
  const normalizedSearch = search.toLocaleLowerCase();
  const filtered = beers.filter((beer) => {
    if (style && beer.style !== style) return false;
    if (normalizedSearch &&
      !beer.name.toLocaleLowerCase().includes(normalizedSearch) &&
      !beer.style.toLocaleLowerCase().includes(normalizedSearch)) return false;
    if (minAbv !== undefined && (beer.abv === null || beer.abv < minAbv)) return false;
    if (maxAbv !== undefined && (beer.abv === null || beer.abv > maxAbv)) return false;
    return true;
  });

  const sortMultiplier = order === "desc" ? -1 : 1;
  const sortField = sort === "abv" ? "abv" : sort === "style" ? "style" : "name";
  filtered.sort((left, right) => {
    const leftValue = left[sortField];
    const rightValue = right[sortField];
    if (leftValue === null) return rightValue === null ? 0 : 1;
    if (rightValue === null) return -1;
    if (typeof leftValue === "number" && typeof rightValue === "number") {
      return (leftValue - rightValue) * sortMultiplier;
    }
    return String(leftValue).localeCompare(String(rightValue)) * sortMultiplier;
  });
  return filtered;
}

app.get("/api/beers", async (request, response, next) => {
  try {
    const page = positiveInteger(request.query.page, 1, Number.MAX_SAFE_INTEGER);
    const pageSize = positiveInteger(request.query.pageSize, 25, pageSizeLimit);
    const search = typeof request.query.search === "string" ? request.query.search.trim() : "";
    const style = typeof request.query.style === "string" ? request.query.style.trim() : "";
    const minAbv = abvQueryValue(request.query.minAbv, "minAbv");
    const maxAbv = abvQueryValue(request.query.maxAbv, "maxAbv");
    const sort = typeof request.query.sort === "string" ? request.query.sort : "name";
    const order = request.query.order === "desc" ? "desc" : "asc";

    if (!["name", "style", "abv"].includes(sort)) {
      throw new RequestValidationError("sort muss name, style oder abv sein.");
    }
    if (minAbv !== undefined && maxAbv !== undefined && minAbv > maxAbv) {
      throw new RequestValidationError("minAbv darf nicht größer als maxAbv sein.");
    }

    const filteredBeers = filterAndSortBeers(
      await getBeers(),
      search,
      style,
      minAbv,
      maxAbv,
      sort,
      order,
    );
    const total = filteredBeers.length;
    const documents = filteredBeers.slice((page - 1) * pageSize, page * pageSize);

    response.json({
      items: documents,
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (error) {
    next(error);
  }
});

app.get("/api/beers/styles", async (_request, response, next) => {
  try {
    const beers = await getBeers();
    response.json({
      styles: [...new Set(beers.map(({ style }) => style).filter(Boolean))]
        .sort((left, right) => left.localeCompare(right))
        .slice(0, 200),
    });
  } catch (error) {
    next(error);
  }
});

app.get("/api/health", (_request, response) => {
  response.json({ status: "ok" });
});

const errorHandler: ErrorRequestHandler = (error, _request, response, _next) => {
  if (error instanceof RequestValidationError) {
    response.status(400).json({ error: error.message });
    return;
  }
  console.error("API-Fehler:", error);
  response.status(500).json({
    error: "Die Anfrage an den OCI-Bier-Endpunkt ist fehlgeschlagen. Prüfe URL und Berechtigungen.",
  });
};
app.use(errorHandler);

const server = app.listen(port, "127.0.0.1", () => {
  console.log(`Bier-API läuft auf http://127.0.0.1:${port}`);
});

async function shutdown() {
  server.close();
}

process.once("SIGINT", () => void shutdown());
process.once("SIGTERM", () => void shutdown());
