# ⏳ Project Chronicle – AI Knowledge Evolution Engine

Project Chronicle is a production-grade AI Knowledge Evolution Engine designed to ingest conversation histories, documentation files, and markdown notes, translating them into cohesive chronological timelines, decision maps, and interactive concept graphs.

Think of it as **GitHub for ideas**—capturing not just where a project stands today, but how it evolved, why pivot choices were made, and what challenges remain unresolved.

---

## 🚀 Key Features

* **Workspace Dashboard**: Distills metrics on projects, ideas, decisions, and open questions, charting corpus growth over time.
* **Data Ingestion System**: Accepts ChatGPT, Claude, and Gemini JSON exports, PDF documents, Markdown guides, and plain text notes, executing a multi-stage parser (Ingested ➔ Parsed ➔ Indexed ➔ Visualized).
* **AI Knowledge Extraction Engine**: Extracts ideas, topics, decisions, chronological milestones, and tasks using OpenAI, Gemini, or local Ollama pipelines (with local smart mock fallbacks if offline).
* **Chronicle Timeline Engine**: Visualizes project events chronologically (Creations, Pivots, Milestones, Blockers) using elegant, responsive line markers.
* **Interactive Knowledge Graph**: Maps relationships using React Flow, letting users drag nodes, trace linkages, and inspect properties of Ideas, Decisions, and Milestones.
* **Decision Intelligence Hub**: Tracks architectural shifts, justifications (reasons), and source transcripts (evidences).
* **AI Historian**: Supports contextual chat questions, synthesizing records from document search matchings and graphs.
* **Future Prediction Engine**: Suggests upcoming milestones, technical blockers, missing requirements, and similar cross-project development patterns.

---

## 🛠️ Technology Stack

* **Frontend**: React 18, Vite, TypeScript, Tailwind CSS, React Flow, Lucide Icons, Framer Motion
* **Backend**: Python 3.10, FastAPI, SQLAlchemy ORM, SQLite (default dev database) / PostgreSQL (production)
* **AI Layer**: OpenAI GPT-4o, Gemini 1.5 Flash, Ollama, Custom rule-based Mock engine
* **Database & Indexing**: PostgreSQL, Chroma Vector Database (local TF-IDF semantic fallback), Neo4j Graph DB (relational schema fallback)
* **Deployment**: Docker & Docker Compose

---

## 📂 Directory Layout

```
/
├── backend/
│   ├── app/
│   │   ├── services/       # Parser, AI extraction, Vector, Graph
│   │   ├── routers/        # Auth, Projects, Analytics, Query
│   │   ├── config.py       # Pydantic environment configurations
│   │   ├── database.py     # SQLAlchemy setups (SQLite & Postgres support)
│   │   ├── models.py       # Database model declarations
│   │   ├── schemas.py      # Pydantic input/validation models
│   │   └── main.py         # FastAPI main application
│   ├── tests/              # PyTest backend tests suite (coverage > 80%)
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/     # Dashboard, Graph, Timeline, Historian, DNA...
│   │   ├── context/        # Global React App state manager
│   │   ├── hooks/          # API hook with complete Mock DB fallbacks
│   │   ├── App.tsx         # Layout coordinator
│   │   └── index.css       # Tailwind base & custom CSS
│   ├── Dockerfile
│   ├── tailwind.config.js
│   ├── vite.config.ts
│   └── package.json
├── docker-compose.yml
├── sample_data.json        # Simulated ChatGPT export for testing
└── README.md
```

---

## ⚡ Quick Start (Local Setup)

The application has been carefully engineered to run locally with **zero external dependencies** using default SQLite and Python-based fallback databases. This allows immediate developer preview without installing PostgreSQL, Neo4j, or Chroma services.

### 1. Launch Backend
```bash
cd backend
python -m venv venv
source venv/Scripts/activate # On Windows
pip install -r requirements.txt
python -m app.main
```
The FastAPI documentation will be available at `http://localhost:8000/docs`.

### 2. Launch Frontend
```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:5173` to explore the dashboard.

---

## 🐳 Dockerized Production Setup

To spin up the complete multi-database ecosystem (PostgreSQL, Neo4j Community, Chroma Vector DB, FastAPI, and compiled Nginx static frontend):

```bash
docker-compose up --build
```
* Frontend: `http://localhost:3000`
* Backend API: `http://localhost:8000`
* Neo4j Browser: `http://localhost:7474`

---

## 🔌 Loading the Browser Extension (Chronicle Bridge)

The Chronicle Bridge extension allows you to scrape active chats from ChatGPT, Claude, and Gemini web interfaces and sync them directly to your Chronicle workspaces.

To install it:
1. Open Google Chrome (or any Chromium browser) and navigate to `chrome://extensions/`.
2. Enable **Developer mode** using the toggle switch in the top-right corner.
3. Click the **Load unpacked** button in the top-left corner.
4. Select the `extension` folder located in the root of this repository (`d:\AI Chro\extension`).
5. Open your active conversation page on ChatGPT or Claude, click the extension icon, select your project, and click **Sync to Project Chronicle**!
