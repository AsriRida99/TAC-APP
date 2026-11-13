# TAC — interface demo

Demo of the **TAC** (*Thesaurus Automation & Curation*) interface: an application that helps build SKOS
thesauri for cultural heritage, where a curator stays in control of every proposal made by a language model
(concept generation, thesaurus assignment, alignments, export).

> **⚠️ This repository is a demo only.**
>
> - **The core code is not published.** The Hybrid RAG engine (vector databases, knowledge graph, reranker),
>   the agent, the Opentheso synchronisation and the training scripts belong to the Fondation des Sciences du
>   Patrimoine and are not part of this repository.
> - **The fine-tuned models are not published.** The demo uses either a **base Mistral model (not
>   fine-tuned)** or simulated answers. The results therefore do not reflect the quality of the real system.
> - **The data are fictitious examples.** The concepts, thesauri, users, statistics and histories shown are
>   made up to illustrate how the application works. No real data is included.

## Why this repository only contains the frontend

The complete TAC system relies on three components that we are **not allowed to publish** in this Git
repository (they belong to the Fondation des Sciences du Patrimoine):

| Unpublished component | Role in TAC |
|---|---|
| **Two fine-tuned models** | language models trained on our curation data, used to generate concepts and assign them to thesauri |
| **Vector database** (Qdrant) | concept and thesaurus collections indexed with embeddings (`bge-m3`) to retrieve similar examples |
| **Hybrid RAG** | hybrid retrieval combining the vector database, the knowledge graph (Neo4j) and a reranker (`bge-reranker-v2-m3`) to build the context sent to the models |

### Complete application tested on the laboratory server

The **complete** application (frontend + backend + models) has been deployed and tested on our laboratory
server. There, the backend is organised as independent services called by the interface:

| Service | Port | Role |
|---|---|---|
| Authentication | 8010 | accounts, roles (admin, curator), login tokens |
| Terms | 8000 | import (CSV, JSON) and management of the terms to process |
| Concepts | 8001 | concept generation by a fine-tuned model, using the context provided by the Hybrid RAG |
| Thesaurus | 8002 | choice of the target thesaurus (similarity + vote), then decision by a fine-tuned model |
| Alignments | 8003 | agent that queries external vocabularies (via MCP) and proposes SKOS mappings — 🚧 *under development* |
| Export | 8005 | export of validated thesauri in SKOS format (Turtle) — 🚧 *under development* |

Around these services:

- **Qdrant** stores the vector database (concept and thesaurus collections);
- **Neo4j** stores the knowledge graph (`BROADER` and `APPARTIENT` relations);
- the **Hybrid RAG** combines both, then reorders the results with the reranker, to build the prompt;
- the **two fine-tuned models** run on the server's GPU;
- the **synchronisation** reads the Opentheso thesauri and updates Qdrant and Neo4j.

Every model proposal is then reviewed by a curator in the interface.

> 🚧 **Under development: Alignments and Export.** These two modules are not finalised yet, including on the
> laboratory server: the alignment agent (external vocabularies via MCP) and the SKOS export (Turtle
> generation, upload to Opentheso) are still being tested and may change. In the demo, their pages are marked
> "Under development".

### What is published on Git

In this Git repository we have published **only the frontend** (the React interface). So that the interface
remains usable without the components above, it runs in **demo mode**: backend calls are replaced by example
data and a simulation computed in the browser (`tac-frontend/src/demo/`). The knowledge graph and vector
databases shown on the Synchronisation page reflect how the real system is organised, but on this fictitious
data.

## Running the demo

Requirements: Node.js 20 or later.

```bash
cd tac-frontend
npm install
npm run dev
```

Open http://localhost:5173 and sign in with the demo account `admin@tac.demo` / `admin123`.
Everything runs in the browser, with no server.

## Option: generate with a real Mistral (base model)

Without configuration, the Concepts and Thesaurus pages show simulated answers. To make them call a base
Mistral model, create `tac-frontend/.env.local`:

**With [Ollama](https://ollama.com), locally (recommended, free):**

```bash
ollama pull mistral
```

```env
VITE_MISTRAL_URL=http://localhost:11434/v1
VITE_MISTRAL_MODEL=mistral
```

**With the Mistral API:**

```env
VITE_MISTRAL_URL=https://api.mistral.ai/v1
VITE_MISTRAL_MODEL=mistral-small-latest
VITE_MISTRAL_KEY=your_key
```

The key can then be read in the browser: use this locally only, never on a public website.

Restart `npm run dev` after editing `.env.local`. Each result shows whether it comes from Mistral or from the
simulation. On a computer without a GPU, an Ollama generation can take about a minute.

## What the demo shows

| Page | Content |
|---|---|
| Dashboard | indicators and charts of the curation activity |
| Terms | import and management of the terms to process |
| Concepts | similar examples → editable prompt → generation → validation, correction or rejection |
| Thesaurus | candidate thesauri (similarity + vote) → choice by the model → validation |
| Alignments 🚧 | alignments to external vocabularies — *under development* |
| Export 🚧 | SKOS export (Turtle) — *under development* |
| Synchronisation | simulated update, **knowledge graph view** and **vector database explorer** |
| Administration | account and role approval |

On the Synchronisation page:

- **Knowledge graph**: `BROADER` relations between concepts and `APPARTIENT` relations to thesauri.
  Clicking a node shows its properties and relations.
- **Vector databases**: the points of the concept and thesaurus collections (payload), and a similarity
  search with the vector, reranker and vote scores.

These views reproduce how the real system is organised, but they are computed in the browser on the example
data.

The graph is displayed like Neo4j Browser: automatic layout, draggable nodes, mouse-wheel zoom, relation
names on the arrows and the matching Cypher query.

## Interface

- **Colourful theme** with one colour per page, and **dark / light mode** (button in the header, choice remembered).
- **Global search** `Ctrl+K` (`⌘K` on Mac): pages, terms, concepts, thesauri and quick actions.
- **Collapsible sidebar** that folds into a column of icons.
- Interface available in **French and English**.

These interface features are inspired by the open-source template
[shadcn-admin](https://github.com/satnaing/shadcn-admin) (MIT licence), re-implemented with Material UI.

## Technologies

React 19, Vite, Material UI, ApexCharts, React Router.
