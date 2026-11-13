# TAC — Frontend

React 19 + Vite, Material UI, ApexCharts. Colourful theme with dark / light mode, global search `Ctrl+K`
and a collapsible sidebar (ideas taken from [shadcn-admin](https://github.com/satnaing/shadcn-admin), MIT).

> Only the frontend is published: the two fine-tuned models, the vector database and the Hybrid RAG engine
> cannot be published in this repository. See the root README ("Why this repository only contains the frontend").

## Run

```bash
# Frontend (http://localhost:5173)
cd tac-frontend
npm install
npm run dev
```

By default, sign-in runs in **demo mode** (no backend): accounts are simulated in the browser (`src/demo/authMock.js`).
Demo account: `admin@tac.demo` / `admin123`. New sign-ups must be approved by the admin (Administration page).

Demo only: see the README at the root of the repository (core code, fine-tuned models and real data are not published).
To generate with a base Mistral model (Ollama or Mistral API), see the section "Option: generate with a real Mistral" in the root README.

## Service configuration

The service URLs are in `src/config.js` and can be overridden with a `.env` file:

```
VITE_API_AUTH=http://localhost:8010
VITE_API_TERMES=http://localhost:8000
VITE_API_CONCEPTS=http://localhost:8001
VITE_API_THESAURUS=http://localhost:8002
VITE_API_ALIGNEMENTS=http://localhost:8003
VITE_API_EXPORT=http://localhost:8005
```

## Structure

```
src/
  api/http.js            JSON calls + token
  auth/                  sign-in context, route protection
  layout/                collapsible sidebar, header (search, dark mode, profile), CommandMenu (Ctrl+K)
  pages/Login.jsx        sign-in / sign-up
  pages/dashboard/       dashboard (KPIs + charts)
  pages/                 Terms, Concepts, Thesaurus, Alignments, Export, Synchronisation, Administration
  demo/                  EXAMPLE data, simulation, Mistral call (mistral.js), graph (graph.js)
  components/            StatCard, ChartCard, KnowledgeGraph (Neo4j view), VectorBaseExplorer (Qdrant view)
  theme.js               colours (chart palette, light and dark modes) and typography
  colorMode.jsx          light / dark / system switch, remembered in the browser
public/                  logos (Espadon, FSP), favicons, login background image
```
