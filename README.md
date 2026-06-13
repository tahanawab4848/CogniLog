# ⏳ CogniLog – AI Chat Knowledge Extraction Engine

**CogniLog** is a production-grade platform built specifically to solve a modern development problem: **making sense of your endless AI conversations**. 

It is designed primarily to ingest, analyze, and index your chat histories from **ChatGPT, Claude, and Gemini**. Instead of letting valuable brainstorming sessions, coding decisions, and architectural pivots get lost in long chat threads, CogniLog automatically extracts these insights and transforms them into cohesive chronological timelines, decision maps, and interactive concept graphs.

While it also supports traditional documentation (PDFs, Markdown), its core purpose is acting as a **Knowledge Graph for your AI interactions**—capturing exactly how your ideas evolved alongside your AI assistants, logging why technical pivots were made, and mapping out the DNA of your projects.

---

## 🚀 Primary Focus & Key Features

* **AI Chat Ingestion & Scraping**: Purpose-built to ingest JSON exports from ChatGPT, Claude, and Gemini. Includes the custom **CogniLog Bridge browser extension** to instantly scrape and sync active live chats directly to your workspace.
* **AI Knowledge Extraction**: Automatically parses unstructured chat threads to extract distinct ideas, topics, architectural decisions, chronological milestones, and pending tasks using OpenAI, Gemini, or local Ollama pipelines.
* **Chronicle Timeline Engine**: Visualizes the progression of your project based on your chat history (Creations, Pivots, Milestones, Blockers) using elegant, responsive line markers.
* **Interactive Knowledge Graph**: Maps the relationships between concepts discussed in your AI chats using React Flow, letting you drag nodes, trace linkages, and inspect the properties of ideas and decisions.
* **Decision Intelligence Hub**: Tracks architectural shifts and saves the source chat transcripts (evidences) and justifications (reasons) behind them.
* **Workspace Dashboard**: Distills metrics on projects, ideas, decisions, and open questions, charting corpus growth over time.
* **AI Historian**: Supports contextual chat questions, synthesizing records from document search matchings and graphs to answer questions like *"Why did we choose Postgres over MongoDB three months ago?"*

---

## 🛠️ Technology Stack

* **Frontend**: React 18, Vite, TypeScript, Tailwind CSS, React Flow, Lucide Icons, Framer Motion
* **Backend**: Python 3.10, FastAPI, SQLAlchemy ORM, SQLite (default dev database) / PostgreSQL (production)
* **AI Layer**: OpenAI GPT-4o, Gemini 1.5 Flash, Ollama, Custom rule-based Mock engine
* **Database & Indexing**: PostgreSQL, Chroma Vector Database (local TF-IDF semantic fallback), Neo4j Graph DB (relational schema fallback)
* **Deployment**: Docker & Docker Compose

---

## 📂 Directory Layout

```text
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
source venv/Scripts/activate # On Windows: venv\Scripts\activate
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

## 🔌 Loading the Browser Extension (CogniLog Bridge)

Because the primary focus is extracting knowledge from AI chats, the **CogniLog Bridge** browser extension is the easiest way to scrape active chats from ChatGPT, Claude, and Gemini web interfaces and sync them directly to your CogniLog workspaces.

To install it:
1. Open Google Chrome (or any Chromium browser) and navigate to `chrome://extensions/`.
2. Enable **Developer mode** using the toggle switch in the top-right corner.
3. Click the **Load unpacked** button in the top-left corner.
4. Select the `extension` folder located in the root of this repository (`d:\CogniLog\extension`).
5. Open your active conversation page on ChatGPT or Claude, click the extension icon, select your project, and click **Sync to CogniLog**!