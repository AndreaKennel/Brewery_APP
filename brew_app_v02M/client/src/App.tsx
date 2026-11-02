import { useEffect, useState } from "react";
import {
  Button,
  Dropdown,
  Input,
  Option,
  Spinner,
} from "@fluentui/react-components";

type Beer = {
  id: string;
  name: string;
  style: string;
  abv: number | null;
};

type BeerResponse = {
  items: Beer[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

const pageSize = 25;

async function readJson<T>(url: string, signal: AbortSignal): Promise<T> {
  const response = await fetch(url, { signal });
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as
      | { error?: string }
      | null;
    throw new Error(body?.error ?? `Die Anfrage ist fehlgeschlagen (${response.status}).`);
  }
  return response.json() as Promise<T>;
}

function App() {
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [style, setStyle] = useState("");
  const [minAbv, setMinAbv] = useState("");
  const [maxAbv, setMaxAbv] = useState("");
  const [sort, setSort] = useState("name:asc");
  const [page, setPage] = useState(1);
  const [beers, setBeers] = useState<BeerResponse | null>(null);
  const [styles, setStyles] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const timer = window.setTimeout(() => setSearch(searchInput.trim()), 250);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams({
      page: String(page),
      pageSize: String(pageSize),
      sort: sort.split(":")[0] ?? "name",
      order: sort.split(":")[1] ?? "asc",
    });
    if (search) params.set("search", search);
    if (style) params.set("style", style);
    if (minAbv) params.set("minAbv", minAbv);
    if (maxAbv) params.set("maxAbv", maxAbv);

    setLoading(true);
    setError("");

    Promise.all([
      readJson<BeerResponse>(`/api/beers?${params.toString()}`, controller.signal),
      readJson<{ styles: string[] }>("/api/beers/styles", controller.signal),
    ])
      .then(([beerResponse, styleResponse]) => {
        setBeers(beerResponse);
        setStyles(styleResponse.styles);
      })
      .catch((requestError: unknown) => {
        if (requestError instanceof DOMException && requestError.name === "AbortError") return;
        setError(
          requestError instanceof Error
            ? requestError.message
            : "Die Bierdaten konnten nicht geladen werden.",
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [page, search, style, minAbv, maxAbv, sort]);

  const updateFilter = (update: () => void) => {
    update();
    setPage(1);
  };

  return (
    <main className="page-shell">
      <header className="hero">
        <div className="hero-copy">
          <p className="eyebrow">BREWERY · BIERBIBLIOTHEK</p>
          <h1>Finde dein nächstes Lieblingsbier.</h1>
          <p className="hero-description">
            Durchsuche die Sammlung nach Name, Bierstil und Alkoholgehalt.
          </p>
        </div>
        <div className="hero-mark" aria-hidden="true">B</div>
      </header>

      <section className="content" aria-label="Bierübersicht">
        <div className="section-heading">
          <div>
            <p className="eyebrow">DIE SAMMLUNG</p>
            <h2>Alle Biere</h2>
          </div>
          {beers && <span className="result-count">{beers.total} Biere</span>}
        </div>

        <div className="filters" aria-label="Biere filtern">
          <Input
            className="search-input"
            aria-label="Nach Name oder Bierstil suchen"
            placeholder="Name oder Bierstil suchen"
            value={searchInput}
            onChange={(_, data) => updateFilter(() => setSearchInput(data.value))}
          />
          <Dropdown
            aria-label="Bierstil filtern"
            placeholder="Alle Bierstile"
            value={style || "Alle Bierstile"}
            selectedOptions={style ? [style] : [""]}
            onOptionSelect={(_, data) => {
              updateFilter(() => setStyle(data.optionValue ?? ""));
            }}
          >
            <Option value="">Alle Bierstile</Option>
            {styles.map((item) => <Option key={item} value={item}>{item}</Option>)}
          </Dropdown>
          <Input
            aria-label="Minimaler Alkoholgehalt"
            type="number"
            min="0"
            max="100"
            step="0.1"
            placeholder="ABV min %"
            value={minAbv}
            onChange={(_, data) => updateFilter(() => setMinAbv(data.value))}
          />
          <Input
            aria-label="Maximaler Alkoholgehalt"
            type="number"
            min="0"
            max="100"
            step="0.1"
            placeholder="ABV max %"
            value={maxAbv}
            onChange={(_, data) => updateFilter(() => setMaxAbv(data.value))}
          />
          <Dropdown
            aria-label="Sortierreihenfolge"
            value={sort === "name:asc" ? "Name A–Z" : sort === "name:desc" ? "Name Z–A" : sort === "abv:asc" ? "ABV aufsteigend" : "ABV absteigend"}
            selectedOptions={[sort]}
            onOptionSelect={(_, data) => {
              if (data.optionValue) updateFilter(() => setSort(data.optionValue!));
            }}
          >
            <Option value="name:asc">Name A–Z</Option>
            <Option value="name:desc">Name Z–A</Option>
            <Option value="abv:asc">ABV aufsteigend</Option>
            <Option value="abv:desc">ABV absteigend</Option>
          </Dropdown>
        </div>

        {error && (
          <div className="state-panel error-panel" role="alert">
            <strong>Die Bierdaten konnten nicht geladen werden.</strong>
            <span>{error}</span>
            <span>Prüfe, ob das Backend läuft und die MongoDB-Verbindung eingerichtet ist.</span>
          </div>
        )}

        {!error && loading && (
          <div className="state-panel"><Spinner label="Biere werden geladen …" /></div>
        )}

        {!error && !loading && beers && beers.items.length === 0 && (
          <div className="state-panel">
            <strong>Keine passenden Biere gefunden</strong>
            <span>Ändere deine Suche oder lockere die Filter.</span>
          </div>
        )}

        {!error && !loading && beers && beers.items.length > 0 && (
          <>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr><th scope="col">Bier</th><th scope="col">Bierstil</th><th scope="col" className="abv-column">ABV</th></tr>
                </thead>
                <tbody>
                  {beers.items.map((beer) => (
                    <tr key={beer.id}>
                      <td className="beer-name">{beer.name || "Unbekanntes Bier"}</td>
                      <td><span className="style-tag">{beer.style || "Nicht angegeben"}</span></td>
                      <td className="abv-column">{beer.abv === null ? "–" : `${beer.abv.toLocaleString("de-CH", { maximumFractionDigits: 2 })} %`}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <nav className="pagination" aria-label="Seitennavigation">
              <span>Seite {beers.page} von {Math.max(beers.totalPages, 1)}</span>
              <div>
                <Button
                  appearance="secondary"
                  disabled={beers.page <= 1}
                  onClick={() => setPage((current) => current - 1)}
                >Zurück</Button>
                <Button
                  appearance="primary"
                  disabled={beers.page >= beers.totalPages}
                  onClick={() => setPage((current) => current + 1)}
                >Weiter</Button>
              </div>
            </nav>
          </>
        )}
      </section>
      <footer>Eine gute Wahl beginnt mit Neugier.</footer>
    </main>
  );
}

export default App;
