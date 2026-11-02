import { config } from "dotenv";
import express, { type ErrorRequestHandler } from "express";
import { MongoClient } from "mongodb";
import { fileURLToPath } from "node:url";

config({ path: fileURLToPath(new URL("../../.env", import.meta.url)) });

const app = express();
const port = Number(process.env.API_PORT ?? 3001);
const mongoUri = process.env.MONGODB_URI;
const databaseName = process.env.MONGODB_DB_NAME ?? "brewdbV01";
const collectionName = "beers";
const pageSizeLimit = 100;

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error("API_PORT muss eine gültige Portnummer sein.");
}

if (!mongoUri) {
  throw new Error("MONGODB_URI fehlt. Lege eine .env-Datei nach .env.example an.");
}

const client = new MongoClient(mongoUri, { serverSelectionTimeoutMS: 5000 });
const database = client.db(databaseName);
const collection = database.collection(collectionName);

const field = (names: string[]) => ({
  $ifNull: names.map((name) => `$${name}`),
});

const normalizedFields = [
  {
    $addFields: {
      _beerName: field(["name", "beerName", "beer_name", "title"]),
      _beerStyle: field(["style", "beerStyle", "beer_style", "category"]),
      _beerAbv: {
        $convert: {
          input: field(["abv", "ABV", "alcoholByVolume", "alcohol_by_volume"]),
          to: "double",
          onError: null,
          onNull: null,
        },
      },
    },
  },
];

class RequestValidationError extends Error {}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

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

app.get("/api/beers", async (request, response, next) => {
  try {
    const page = positiveInteger(request.query.page, 1, Number.MAX_SAFE_INTEGER);
    const pageSize = positiveInteger(request.query.pageSize, 25, pageSizeLimit);
    const search = typeof request.query.search === "string" ? request.query.search.trim() : "";
    const style = typeof request.query.style === "string" ? request.query.style.trim() : "";
    const minAbv = abvQueryValue(request.query.minAbv, "minAbv");
    const maxAbv = abvQueryValue(request.query.maxAbv, "maxAbv");
    const sort = typeof request.query.sort === "string" ? request.query.sort : "name";
    const order = request.query.order === "desc" ? -1 : 1;

    if (!["name", "style", "abv"].includes(sort)) {
      throw new RequestValidationError("sort muss name, style oder abv sein.");
    }
    if (minAbv !== undefined && maxAbv !== undefined && minAbv > maxAbv) {
      throw new RequestValidationError("minAbv darf nicht größer als maxAbv sein.");
    }

    const match: Record<string, unknown> = {};
    if (search) {
      const expression = new RegExp(escapeRegex(search), "i");
      match.$or = [{ _beerName: expression }, { _beerStyle: expression }];
    }
    if (style) match._beerStyle = style;
    if (minAbv !== undefined || maxAbv !== undefined) {
      match._beerAbv = {
        ...(minAbv !== undefined ? { $gte: minAbv } : {}),
        ...(maxAbv !== undefined ? { $lte: maxAbv } : {}),
      };
    }

    const matchStage = Object.keys(match).length ? [{ $match: match }] : [];
    const countResult = await collection.aggregate<{ total: number }>([
      ...normalizedFields,
      ...matchStage,
      { $count: "total" },
    ]).toArray();
    const total = countResult[0]?.total ?? 0;
    const sortField = sort === "abv" ? "_beerAbv" : sort === "style" ? "_beerStyle" : "_beerName";
    const documents = await collection.aggregate<{
      _id: unknown;
      name?: unknown;
      style?: unknown;
      abv?: unknown;
    }>([
      ...normalizedFields,
      ...matchStage,
      { $sort: { [sortField]: order, _id: 1 } },
      { $skip: (page - 1) * pageSize },
      { $limit: pageSize },
      {
        $project: {
          _id: 1,
          name: "$_beerName",
          style: "$_beerStyle",
          abv: "$_beerAbv",
        },
      },
    ]).toArray();

    response.json({
      items: documents.map((beer) => ({
        id: String(beer._id),
        name: typeof beer.name === "string" ? beer.name : "",
        style: typeof beer.style === "string" ? beer.style : "",
        abv: typeof beer.abv === "number" && Number.isFinite(beer.abv) ? beer.abv : null,
      })),
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
    const results = await collection.aggregate<{ style: string }>([
      ...normalizedFields,
      { $match: { _beerStyle: { $type: "string", $ne: "" } } },
      { $group: { _id: "$_beerStyle" } },
      { $sort: { _id: 1 } },
      { $limit: 200 },
      { $project: { _id: 0, style: "$_id" } },
    ]).toArray();
    response.json({ styles: results.map(({ style }) => style) });
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
    error: "Die Anfrage an die Bierdatenbank ist fehlgeschlagen. Prüfe MongoDB-Verbindung und Schema.",
  });
};
app.use(errorHandler);

const server = app.listen(port, "127.0.0.1", () => {
  console.log(`Bier-API läuft auf http://127.0.0.1:${port}`);
});

async function shutdown() {
  server.close();
  await client.close();
}

process.once("SIGINT", () => void shutdown());
process.once("SIGTERM", () => void shutdown());
