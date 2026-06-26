import { useState, useEffect } from 'react';

const API_BASE_URL = 'http://localhost:8000/api/v1';

// Static seed data for Mock Mode
const MOCK_PROJECTS = [
  {
    id: 101,
    name: "CampusVerse Virtual Campus",
    description: "An interactive, web-based 3D simulation of a university campus populated by AI students and professors.",
    created_at: "2026-05-15T10:00:00Z",
    dna_origin_story: "CampusVerse emerged during an education hackathon in mid-2026. The initial goal was to construct a multiplayer classroom. However, it quickly pivoted into a persistent virtual academy to help remote students overcome feelings of isolation.",
    dna_purpose: "To provide accessible, high-fidelity collaborative classrooms in a browser canvas, resolving remote learning engagement gaps.",
    dna_future_opportunities: "Integrate offline local teacher LLM model agents and introduce cryptographic Activity Tokens for peer tutor exchanges."
  },
  {
    id: 102,
    name: "Project Chronicle",
    description: "AI Knowledge Evolution Engine translating conversation exports into chronological timelines and interactive graphs.",
    created_at: "2026-06-08T09:00:00Z",
    dna_origin_story: "Initiated to address AI context limits. Standard chat windows are ephemeral; Chronicle stores ideas, decisions, and task maps persistently across chat engines.",
    dna_purpose: "To build a GitHub-like version history for project conceptualization.",
    dna_future_opportunities: "Develop a Chrome context bridge extension to auto-save sessions from ChatGPT, Claude, and Gemini portals."
  }
];

const MOCK_DECISIONS: Record<number, any[]> = {
  101: [
    {
      id: 201,
      project_id: 101,
      title: "Migrate Client from Unreal to Unity Engine",
      reason: "Unreal Engine 5 officially deprecated direct WebGL compilation templates. Building with Unity enables lightweight native browser canvas files essential for low-powered school Chromebooks.",
      evidence: "Conversation session 2: WebGL performance bottlenecks on target systems.",
      status: "active",
      date: "2026-06-01",
      created_at: "2026-06-01T14:00:00Z"
    },
    {
      id: 202,
      project_id: 101,
      title: "Adopt WebGL Canvas over Pixel Streaming",
      reason: "Cloud pixel streaming requires dedicated GPU nodes costing upwards of $1.50/hour per student. Client-side WebGL compilation runs on local CPU cycles, keeping infrastructure cost at zero.",
      evidence: "Hackathon server budgeting sheet.",
      status: "active",
      date: "2026-06-03",
      created_at: "2026-06-03T16:20:00Z"
    },
    {
      id: 203,
      project_id: 101,
      title: "Utilize WebSockets for Multiplayer State Sync",
      reason: "Real-time positioning needs sub-50ms latency. HTTP pooling created extreme server loads; switching to persistent WebSocket rooms lowered overhead.",
      evidence: "Performance benchmark logs.",
      status: "active",
      date: "2026-06-05",
      created_at: "2026-06-05T09:15:00Z"
    }
  ],
  102: [
    {
      id: 204,
      project_id: 102,
      title: "Use SQLite as Local Default Database",
      reason: "Allows zero-setup running for immediate developer preview, with seamless migration to PostgreSQL/Neo4j for Dockerized multi-tenant environments.",
      evidence: "Sprint 1 Architecture design doc.",
      status: "active",
      date: "2026-06-08",
      created_at: "2026-06-08T10:10:00Z"
    }
  ]
};

const MOCK_TIMELINES: Record<number, any[]> = {
  101: [
    { id: 301, project_id: 101, title: "Project Inception", description: "First brainstorm ideas and conceptualize campus simulator structure.", event_type: "creation", date: "2026-05-15", created_at: "2026-05-15" },
    { id: 302, project_id: 101, title: "Unreal WebGL Testing Failed", description: "Encountered export issues. UE5 lacks official in-browser export blocks.", event_type: "blocker", date: "2026-05-28", created_at: "2026-05-28" },
    { id: 303, project_id: 101, title: "Engine Pivot Decision", description: "Formally migrated 3D visual assets to Unity to leverage WebGL target.", event_type: "pivot", date: "2026-06-01", created_at: "2026-06-01" },
    { id: 304, project_id: 101, title: "WebSocket Integration", description: "Established student avatar position synchronizations.", event_type: "milestone", date: "2026-06-05", created_at: "2026-06-05" },
    { id: 305, project_id: 101, title: "WebGL Memory Limit Blocker", description: "High-resolution audio assets causing browser tab tab-crashes (1GB ceiling).", event_type: "blocker", date: "2026-06-07", created_at: "2026-06-07" }
  ],
  102: [
    { id: 306, project_id: 102, title: "System Architecture Setup", description: "Initial setup of schemas, routers, and mock fallbacks.", event_type: "creation", date: "2026-06-08", created_at: "2026-06-08" }
  ]
};

const MOCK_GRAPHS: Record<number, any> = {
  101: {
    nodes: [
      { id: "project_101", type: "projectNode", position: { x: 300, y: 30 }, data: { label: "CampusVerse", description: "University Simulator", owner: "Taha" } },
      { id: "idea_1", type: "ideaNode", position: { x: 50, y: 150 }, data: { label: "AI Teachers", description: "NPC teachers powered by Ollama" } },
      { id: "idea_2", type: "ideaNode", position: { x: 280, y: 150 }, data: { label: "Activity Economy", description: "Token-based rewards system" } },
      { id: "idea_3", type: "ideaNode", position: { x: 510, y: 150 }, data: { label: "Unity WebGL client", description: "Lightweight browser engine client" } },
      { id: "decision_201", type: "decisionNode", position: { x: 50, y: 300 }, data: { label: "Pivot to Unity Engine", status: "active", reason: "Unreal WebGL deprecation.", date: "2026-06-01" } },
      { id: "decision_202", type: "decisionNode", position: { x: 300, y: 300 }, data: { label: "Adopt WebGL Canvas", status: "active", reason: "GPU Pixel Streaming is too expensive.", date: "2026-06-03" } },
      { id: "event_303", type: "eventNode", position: { x: 100, y: 440 }, data: { label: "Engine Pivot Decision", event_type: "pivot", date: "2026-06-01" } },
      { id: "event_305", type: "eventNode", position: { x: 350, y: 440 }, data: { label: "WebGL Memory Blocker", event_type: "blocker", date: "2026-06-07" } },
      { id: "question_1", type: "questionNode", position: { x: 220, y: 550 }, data: { label: "How to fit assets under 1GB?", status: "open" } }
    ],
    edges: [
      { id: "e1", source: "project_101", target: "idea_1", label: "CONTAINS", animated: true },
      { id: "e2", source: "project_101", target: "idea_2", label: "CONTAINS", animated: true },
      { id: "e3", source: "project_101", target: "idea_3", label: "CONTAINS", animated: true },
      { id: "e4", source: "project_101", target: "decision_201", label: "DECIDES" },
      { id: "e5", source: "project_101", target: "decision_202", label: "DECIDES" },
      { id: "e6", source: "decision_201", target: "idea_3", label: "RESOLVES", animated: true },
      { id: "e7", source: "decision_201", target: "event_303", label: "TRIGGERED" },
      { id: "e8", source: "event_303", target: "event_305", label: "EVOLVED_TO", animated: true },
      { id: "e9", source: "event_305", target: "question_1", label: "RAISED" }
    ]
  },
  102: {
    nodes: [
      { id: "project_102", type: "projectNode", position: { x: 250, y: 50 }, data: { label: "Project Chronicle", description: "AI Knowledge Evolution Engine" } },
      { id: "idea_4", type: "ideaNode", position: { x: 50, y: 180 }, data: { label: "Continuous Ingestion Engine", description: "Auto parse chat exports" } },
      { id: "decision_204", type: "decisionNode", position: { x: 450, y: 180 }, data: { label: "SQLite Local Default", status: "active", reason: "Zero-setup execution priority.", date: "2026-06-08" } },
      { id: "event_306", type: "eventNode", position: { x: 250, y: 300 }, data: { label: "System Architecture Setup", event_type: "creation", date: "2026-06-08" } }
    ],
    edges: [
      { id: "e10", source: "project_102", target: "idea_4", label: "CONTAINS", animated: true },
      { id: "e11", source: "project_102", target: "decision_204", label: "DECIDES" },
      { id: "e12", source: "project_102", target: "event_306", label: "OCCURRED" }
    ]
  }
};

const MOCK_PREDICTIONS: Record<number, any> = {
  101: {
    blockers: [
      "WebGL browser tab crashes due to heap memory limits (1GB threshold).",
      "High latency in local Ollama response streaming inside Unity WebGL build."
    ],
    next_tasks: [
      "Implement Unity Addressable asset splitting to download textures incrementally.",
      "Develop lightweight WebSocket connector between Unity Client and local AI teacher servers."
    ],
    missing_requirements: [
      "Detailed networking protocol definition (UDP vs WebSockets) for real-time multiplayer simulation.",
      "Local teacher model quantization standards to run smoothly on standard laptops."
    ],
    similar_patterns: [
      "Similar memory constraints were seen in the 'Virtual Classroom 2024' project, which solved asset load-times by using asset bundles.",
      "AI teacher latency resembles the Ollama integrations in the 'Continuum-AI Extension' project, where Web Workers prevented UI blocking."
    ]
  },
  102: {
    blockers: [
      "High API token consumption if analyzing extremely long chat exports (e.g. >10MB logs)."
    ],
    next_tasks: [
      "Write chunking utility in `parser_service.py` to break files into 50KB segments before vector indexing.",
      "Build unit tests to verify JWT token expiration behavior."
    ],
    missing_requirements: [
      "Detailed schema for mapping document source URLs to timeline cards."
    ],
    similar_patterns: [
      "Standard monorepo scaling issues solved by containerizing services in Docker Compose."
    ]
  }
};

export const useApi = () => {
  const [token, setToken] = useState<string | null>(localStorage.getItem('chronicle_token'));
  const [isBackendConnected, setIsBackendConnected] = useState<boolean | null>(null);

  // Sync token to storage
  const saveToken = (newToken: string) => {
    localStorage.setItem('chronicle_token', newToken);
    setToken(newToken);
  };

  const clearToken = () => {
    localStorage.removeItem('chronicle_token');
    setToken(null);
  };

  // Check backend server presence
  useEffect(() => {
    fetch('http://localhost:8000/')
      .then(res => res.json())
      .then(() => setIsBackendConnected(true))
      .catch(() => {
        setIsBackendConnected(false);
        console.warn("Backend server not detected at http://localhost:8000. Running Project Chronicle in local Mock Fallback mode.");
      });
  }, []);

  const getHeaders = () => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  };

  // --- Auth API ---
  const registerUser = async (email: string, pass: string, name: string) => {
    if (isBackendConnected === false) {
      // Mock Register
      return { email, full_name: name, id: 999, created_at: new Date().toISOString() };
    }
    const res = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ email, password: pass, full_name: name })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Failed to register');
    }
    return res.json();
  };

  const loginUser = async (email: string, pass: string) => {
    if (isBackendConnected === false) {
      // Mock Login
      saveToken("mock_jwt_token_for_offline_chronicle_demo");
      return { access_token: "mock_jwt_token_for_offline_chronicle_demo", token_type: "bearer" };
    }

    const formData = new FormData();
    formData.append('username', email);
    formData.append('password', pass);

    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      body: formData
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Login failed');
    }
    const data = await res.json();
    saveToken(data.access_token);
    return data;
  };

  // --- Projects API ---
  const getProjects = async () => {
    if (isBackendConnected === false) {
      return MOCK_PROJECTS;
    }
    const res = await fetch(`${API_BASE_URL}/projects`, { headers: getHeaders() });
    if (!res.ok) throw new Error("Could not fetch projects");
    return res.json();
  };

  const createProject = async (name: string, description: string) => {
    if (isBackendConnected === false) {
      const newProj = {
        id: Math.floor(Math.random() * 1000) + 200,
        name,
        description,
        created_at: new Date().toISOString(),
        dna_origin_story: `Project '${name}' was initialized locally. Waiting for chat export logs to analyze origin evolution.`,
        dna_purpose: `Targeting development of: ${description}`,
        dna_future_opportunities: "Upload exports to identify upcoming technical targets."
      };
      MOCK_PROJECTS.push(newProj);
      MOCK_DECISIONS[newProj.id] = [];
      MOCK_TIMELINES[newProj.id] = [];
      MOCK_GRAPHS[newProj.id] = {
        nodes: [
          { id: `project_${newProj.id}`, type: "projectNode", position: { x: 250, y: 50 }, data: { label: name, description } }
        ],
        edges: []
      };
      MOCK_PREDICTIONS[newProj.id] = {
        blockers: ["No documents uploaded yet to calculate blockers."],
        next_tasks: ["Upload your first ChatGPT/Claude export to generate task cards."],
        missing_requirements: ["Ingest conversations to trace requirements."],
        similar_patterns: []
      };
      return newProj;
    }
    const res = await fetch(`${API_BASE_URL}/projects`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ name, description })
    });
    if (!res.ok) throw new Error("Could not create project");
    return res.json();
  };

  const getProjectTimeline = async (projectId: number) => {
    if (isBackendConnected === false) {
      if (projectId === 0) {
        // Global: combine all mock timelines sorted by date
        const all = Object.values(MOCK_TIMELINES).flat() as any[];
        return all.sort((a, b) => (a.date > b.date ? -1 : 1));
      }
      return MOCK_TIMELINES[projectId] || [];
    }
    const url = projectId === 0
      ? `${API_BASE_URL}/intelligence/timeline`
      : `${API_BASE_URL}/projects/${projectId}/timeline`;
    const res = await fetch(url, { headers: getHeaders() });
    if (!res.ok) throw new Error('Could not fetch timeline');
    return res.json();
  };

  const getProjectDecisions = async (projectId: number) => {
    if (isBackendConnected === false) {
      return MOCK_DECISIONS[projectId] || [];
    }
    const res = await fetch(`${API_BASE_URL}/projects/${projectId}/decisions`, { headers: getHeaders() });
    if (!res.ok) throw new Error("Could not fetch decisions");
    return res.json();
  };

  const getProjectGraph = async (projectId: number) => {
    if (isBackendConnected === false) {
      return MOCK_GRAPHS[projectId] || { nodes: [], edges: [] };
    }
    const res = await fetch(`${API_BASE_URL}/projects/${projectId}/graph`, { headers: getHeaders() });
    if (!res.ok) throw new Error("Could not fetch graph");
    return res.json();
  };

  const getProjectDNA = async (projectId: number) => {
    if (isBackendConnected === false) {
      return MOCK_PROJECTS.find(p => p.id === projectId) || null;
    }
    const res = await fetch(`${API_BASE_URL}/projects/${projectId}/dna`, { headers: getHeaders() });
    if (!res.ok) throw new Error("Could not fetch project DNA");
    return res.json();
  };

  const getPredictions = async (projectId: number) => {
    if (isBackendConnected === false) {
      return MOCK_PREDICTIONS[projectId] || { blockers: [], next_tasks: [], missing_requirements: [], similar_patterns: [] };
    }
    const res = await fetch(`${API_BASE_URL}/projects/${projectId}/predict`, { headers: getHeaders() });
    if (!res.ok) throw new Error("Could not fetch predictions");
    return res.json();
  };

  // --- Document Upload / AI Extraction ---
  const uploadDocument = async (projectId: number, file: File) => {
    if (isBackendConnected === false) {
      // Simulate file upload delay and return detailed mockup
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const fileNameLower = file.name.toLowerCase();
      let extractedPayload;

      // Detect keywords to return specific simulated extraction structures
      if (fileNameLower.includes("campus") || fileNameLower.includes("unity") || fileNameLower.includes("simulator")) {
        extractedPayload = {
          project_name: "CampusVerse Virtual Campus",
          ideas: [
            { title: "AI Teachers", description: "NPC teachers running on local Ollama models to answer curriculum questions inside the simulation." },
            { title: "In-Game Economy", description: "Student activity token system enabling peer-to-peer tutoring rewards and asset trading." },
            { title: "Unity WebGL Portal", description: "3D virtual campus playable directly in modern web browsers." }
          ],
          topics: [
            { name: "Unity Engine", description: "Primary game engine for CampusVerse client development." },
            { name: "AI NPCs", description: "Interactive autonomous agents within the 3D model." },
            { name: "WebGL Performance", description: "Optimizing memory footprints and draw calls for browser access." }
          ],
          decisions: [
            { title: "Migrate Client from Unreal to Unity Engine", reason: "WebGL support in Unreal Engine 5 is officially deprecated. Moving to Unity enables lightweight web deployment essential for school Chromebook accessibility.", evidence: "Conversation 2: Switch client to Unity due to hardware limits.", status: "active", date: "2026-06-01" },
            { title: "Adopt WebGL Canvas over Pixel Streaming", reason: "GPU cloud streaming servers cost too much for educational scale. Canvas compilation allows direct browser client execution.", evidence: "Conversation 3: Pixel streaming pricing model is non-viable.", status: "active", date: "2026-06-03" }
          ],
          events: [
            { title: "Project Inception", description: "Initial design specs drafted for a 3D campus simulator.", event_type: "creation", date: "2026-05-15" },
            { title: "Engine Pivot Decision", description: "Decision finalized to migrate Unreal assets to Unity.", event_type: "pivot", date: "2026-06-01" },
            { title: "AI Teacher Prototyping", description: "Integrated LLM agent inside the Unity scripting engine.", event_type: "milestone", date: "2026-06-05" },
            { title: "WebGL Memory Limit Blocker", description: "Encountered browser tab crashes due to audio asset size.", event_type: "blocker", date: "2026-06-07" }
          ],
          goals: [
            { title: "Deploy playable WebGL Sandbox", status: "active", target_date: "2026-06-20" },
            { title: "Integrate Minutiae Fingerprint Biometrics", status: "pending", target_date: "2026-07-01" }
          ],
          tasks: [
            { title: "Configure Unity Addressables for Audio assets", status: "in_progress", assignee: "Taha" },
            { title: "Set up SQLite fallback database for local server", status: "done", assignee: "Architect" }
          ],
          open_questions: [
            { question: "How to handle credentials storage safely for local Ollama deployments?", status: "open", context: "Discussed in conversation 4 regarding local offline schools." }
          ]
        };

        // Merge into simulated mock db
        MOCK_TIMELINES[projectId] = extractedPayload.events.map((e, idx) => ({ ...e, id: 500 + idx, project_id: projectId }));
        MOCK_DECISIONS[projectId] = extractedPayload.decisions.map((d, idx) => ({ ...d, id: 600 + idx, project_id: projectId }));
        
        // Custom graph nodes
        MOCK_GRAPHS[projectId] = {
          nodes: [
            { id: `project_${projectId}`, type: "projectNode", position: { x: 300, y: 30 }, data: { label: "CampusVerse", description: "Virtual Simulator", owner: "Taha" } },
            ...extractedPayload.ideas.map((id, index) => ({ id: `idea_${index}`, type: "ideaNode", position: { x: 50 + (index * 240), y: 160 }, data: { label: id.title, description: id.description } })),
            ...extractedPayload.decisions.map((d, index) => ({ id: `decision_${index}`, type: "decisionNode", position: { x: 100 + (index * 300), y: 280 }, data: { label: d.title, status: d.status, reason: d.reason, date: d.date } })),
            ...extractedPayload.events.map((ev, index) => ({ id: `event_${index}`, type: "eventNode", position: { x: 50 + (index * 180), y: 420 }, data: { label: ev.title, date: ev.date, event_type: ev.event_type } }))
          ],
          edges: [
            ...extractedPayload.ideas.map((_, index) => ({ id: `ep_id_${index}`, source: `project_${projectId}`, target: `idea_${index}`, label: "CONTAINS", animated: true })),
            ...extractedPayload.decisions.map((_, index) => ({ id: `ep_d_${index}`, source: `project_${projectId}`, target: `decision_${index}`, label: "DECIDES" })),
            { id: "e_chain_1", source: "event_0", target: "event_1", label: "EVOLVED_TO", animated: true },
            { id: "e_chain_2", source: "event_1", target: "event_2", label: "EVOLVED_TO", animated: true },
            { id: "e_chain_3", source: "event_2", target: "event_3", label: "EVOLVED_TO", animated: true }
          ]
        };

        // Update Project DNA details
        const project = MOCK_PROJECTS.find(p => p.id === projectId);
        if (project) {
          project.name = "CampusVerse Virtual Campus";
          project.dna_origin_story = "Formulated from educational workshops in mid-2026. Started as a Unity WebGL simulator mapping virtual classrooms for local Chromebook operations.";
          project.dna_purpose = "To deliver affordable browser classroom models bypassing expensive GPU cloud pixel streams.";
          project.dna_future_opportunities = "Adding minutiae biometric access gates and multiplayer WebSocket positioning nodes.";
        }
      } else {
        // Generic fallback upload simulation
        extractedPayload = {
          project_name: "Extracted Project",
          ideas: [{ title: "Continuous Extraction Core", description: "Continuous scan for ideas." }],
          topics: [{ name: "General Knowledge Mapping", description: "Parsing core metrics." }],
          decisions: [{ title: "Run SQLite Fallback Layout", reason: "Simple running parameters.", evidence: "File parse metadata.", status: "active", date: new Date().toISOString().split('T')[0] }],
          events: [{ title: "Uploaded File Ingestion", description: "Document ingested successfully.", event_type: "milestone", date: new Date().toISOString().split('T')[0] }],
          goals: [{ title: "Identify timeline pivots", status: "active", target_date: "2026-06-15" }],
          tasks: [{ title: "Extract detailed notes", status: "done", assignee: "Chronicle Bot" }],
          open_questions: [{ question: "How to parse nested chat nodes?", status: "open", context: "JSON hierarchy" }]
        };

        MOCK_TIMELINES[projectId] = extractedPayload.events.map((e, idx) => ({ ...e, id: 800 + idx, project_id: projectId }));
        MOCK_DECISIONS[projectId] = extractedPayload.decisions.map((d, idx) => ({ ...d, id: 900 + idx, project_id: projectId }));
      }
      return extractedPayload;
    }

    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch(`${API_BASE_URL}/projects/${projectId}/documents`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || "Upload failed");
    }
    return res.json();
  };

  // --- Query APIs ---
  const askHistorian = async (projectId: number, query: string) => {
    if (isBackendConnected === false) {
      await new Promise(resolve => setTimeout(resolve, 800));
      const qLower = query.toLowerCase();

      if (qLower.includes("campusverse") || qLower.includes("evolve") || qLower.includes("unity")) {
        return {
          answer: `### 🚀 CampusVerse Evolution History\n\n#### 1. Origin Story\nCampusVerse started as an ambitious project to build an immersive 3D simulation of school environments. The primary goal was to improve remote education through interactive environments where students could meet, collaborate, and learn from AI-driven NPCs.\n\n#### 2. Evolution & Major Milestones\n* **Phase 1: Unreal Inception**: Originally spec'd out on Unreal Engine 5 to target high-fidelity graphics.\n* **Phase 2: The Engine Pivot**: In early June 2026, severe deployment barriers arose. School Chromebooks couldn't handle Unreal web assemblies, and cloud GPU streaming was prohibitively expensive.\n* **Phase 3: Unity Migration**: The project migrated to Unity WebGL to build native client packages executing directly on browser canvases.\n\n#### 3. Key Decisions & Rationale\n* **Pivot to Unity**: Finalized on **2026-06-01** to guarantee standard browser compatibility. Unreal WebGL targets were officially deprecated.\n* **WebGL Canvas over Pixel Streaming**: Opted for direct browser rendering. Cloud pixel streaming was budgeted at $1.50/hour per user, which was completely non-viable.\n\n#### 4. Current State & Challenges\nThe project is currently optimizing loading files. The main blocker is browser tab tab-crashes caused by larger audio buffers. The developers are implementing Unity Addressables.\n\n#### 5. Future Directions\n* Introduce biometric fingerprint verification for secure test administration.\n* Enable localized offline LLM integration within classroom nodes so schools can run AI teachers without external API subscriptions.`,
          sources: ["Conversation 2 (Engine Pivot)", "Conversation 3 (Pixel Streaming limits)", "WebGL Memory blocker logs"],
          timeline_suggested: ["Project Inception", "Engine Pivot Decision", "WebGL Memory Limit Blocker"],
          key_decisions: ["Migrate Client from Unreal to Unity Engine", "Adopt WebGL Canvas over Pixel Streaming"]
        };
      }

      return {
        answer: `### 📝 Project Chronicle Summary\n\n#### 1. Origin Story\nThis project was designed as a persistency engine to record decisions, ideas, and timelines across ephemeral LLM chat sessions.\n\n#### 2. Key Decisions\n* **SQLite fallback integration**: Implemented to support zero-setup local previews while maintaining Postgres compatibility.\n\n#### 3. Current State\nModels, schemas, and router connections have been successfully written. Active testing is in progress.`,
        sources: ["Initial Config files", "Database models"],
        timeline_suggested: ["System Architecture Setup"],
        key_decisions: ["Use SQLite as Local Default Database"]
      };
    }

    const res = await fetch(`${API_BASE_URL}/projects/${projectId}/ask`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ query })
    });
    if (!res.ok) throw new Error("Historian query failed");
    return res.json();
  };

  const getDashboardStats = async () => {
    if (isBackendConnected === false) {
      // Aggregate stats from mock lists
      const totalProjects = MOCK_PROJECTS.length;
      let totalIdeas = 0;
      let totalDecisions = 0;
      let totalQuestions = 0;

      MOCK_PROJECTS.forEach(p => {
        totalIdeas += MOCK_GRAPHS[p.id]?.nodes.filter((n: any) => n.type === 'ideaNode').length || 0;
        totalDecisions += MOCK_DECISIONS[p.id]?.length || 0;
        totalQuestions += MOCK_GRAPHS[p.id]?.nodes.filter((n: any) => n.type === 'questionNode').length || 0;
      });

      return {
        total_projects: totalProjects,
        total_ideas: totalIdeas || 4,
        total_decisions: totalDecisions || 4,
        total_open_questions: totalQuestions || 1,
        recent_activity: [
          "Project loaded: 'CampusVerse Virtual Campus' loaded in sandbox.",
          "Timeline event: 'Engine Pivot Decision' - Finalized migrating unreal assets to Unity...",
          "Decision registered: 'Use SQLite as Local Default Database' (Status: active)",
          "New Idea captured: 'Continuous Ingestion Engine'"
        ],
        growth_chart_data: [
          { date: "Jun 02", count: 2 },
          { date: "Jun 03", count: 4 },
          { date: "Jun 04", count: 1 },
          { date: "Jun 05", count: 5 },
          { date: "Jun 06", count: 2 },
          { date: "Jun 07", count: 6 },
          { date: "Jun 08", count: 3 }
        ]
      };
    }

    const res = await fetch(`${API_BASE_URL}/analytics/dashboard`, { headers: getHeaders() });
    if (!res.ok) throw new Error("Could not fetch dashboard stats");
    return res.json();
  };

  // ─── Global Intelligence APIs ─────────────────────────────────────────────

  const MOCK_CATEGORIES = [
    { id: 'cat_tech',    name: 'Software Engineering',    icon: '💻', count: 142, decisions: 34, insights: 88, color: 'linear-gradient(to right,#6366f1,#8b5cf6)', description: 'Architecture decisions, frameworks, debugging sessions, and code reviews.' },
    { id: 'cat_ai',      name: 'AI & Machine Learning',   icon: '🤖', count: 97,  decisions: 21, insights: 63, color: 'linear-gradient(to right,#8b5cf6,#a78bfa)', description: 'Model selection, prompt engineering, fine-tuning strategies, and AI ethics.' },
    { id: 'cat_biz',     name: 'Business & Strategy',     icon: '📈', count: 61,  decisions: 18, insights: 41, color: 'linear-gradient(to right,#10b981,#34d399)', description: 'Product decisions, market analysis, go-to-market planning, and revenue models.' },
    { id: 'cat_learn',   name: 'Research & Learning',     icon: '📚', count: 54,  decisions: 7,  insights: 52, color: 'linear-gradient(to right,#f59e0b,#fbbf24)', description: 'Academic topics, book summaries, paper breakdowns, and concept exploration.' },
    { id: 'cat_create',  name: 'Creative Projects',       icon: '🎨', count: 39,  decisions: 12, insights: 27, color: 'linear-gradient(to right,#ec4899,#f43f5e)', description: 'Writing, design systems, naming, branding, and creative brainstorming.' },
    { id: 'cat_personal',name: 'Personal Development',    icon: '🌱', count: 28,  decisions: 9,  insights: 35, color: 'linear-gradient(to right,#14b8a6,#06b6d4)', description: 'Goals, habits, productivity systems, and reflective thinking.' },
    { id: 'cat_data',    name: 'Data & Analytics',        icon: '📊', count: 22,  decisions: 6,  insights: 19, color: 'linear-gradient(to right,#3b82f6,#6366f1)', description: 'Databases, SQL, data pipelines, visualization, and metrics design.' },
    { id: 'cat_devops',  name: 'DevOps & Infrastructure', icon: '⚙️', count: 18,  decisions: 11, insights: 14, color: 'linear-gradient(to right,#64748b,#94a3b8)', description: 'Docker, CI/CD, cloud deployments, monitoring, and infrastructure as code.' },
  ];

  const getGlobalStats = async () => {
    if (isBackendConnected === false) {
      return {
        totalConversations: 461,
        totalMessages: 8342,
        totalDecisions: 118,
        totalInsights: 339,
        totalQuestions: 47,
        topicsDiscovered: MOCK_CATEGORIES.length,
        analysisProgress: 100,
        lastAnalyzed: new Date().toISOString(),
      };
    }
    const res = await fetch(`${API_BASE_URL}/intelligence/overview`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Could not fetch global stats');
    return res.json();
  };

  const getCategories = async () => {
    if (isBackendConnected === false) return MOCK_CATEGORIES;
    const res = await fetch(`${API_BASE_URL}/intelligence/categories`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Could not fetch categories');
    return res.json();
  };

  const getCategoryDetails = async (categoryId: string) => {
    if (isBackendConnected === false) {
      const cat = MOCK_CATEGORIES.find(c => c.id === categoryId);
      return {
        insights: [
          `Most discussions in "${cat?.name}" focus on architectural trade-offs and long-term maintainability.`,
          'Performance optimization and scalability constraints appear as recurring themes.',
          'Open-source tooling is strongly preferred over proprietary solutions.',
          'Testing strategies and CI pipeline efficiency are frequently revisited.',
        ],
        decisions: [
          { title: 'Adopt TypeScript for all new modules', reason: 'Type safety reduces runtime bugs by ~40% based on prior project data.', date: '2026-05-20' },
          { title: 'Migrate from REST to GraphQL for internal APIs', reason: 'Reduces over-fetching and simplifies client data requirements.', date: '2026-06-01' },
        ],
        conversations: [
          { title: 'WebGL Memory Optimization Strategy', date: '2026-06-07' },
          { title: 'Unity vs Unreal for Browser Targets', date: '2026-06-01' },
          { title: 'FastAPI vs Django REST Architecture', date: '2026-05-28' },
          { title: 'PostgreSQL vs SQLite for Local Dev', date: '2026-05-22' },
        ],
      };
    }
    const res = await fetch(`${API_BASE_URL}/intelligence/categories/${categoryId}`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Could not fetch category details');
    return res.json();
  };

  const askGlobalAnalyst = async (query: string) => {
    if (isBackendConnected === false) {
      await new Promise(r => setTimeout(r, 900));
      const q = query.toLowerCase();
      if (q.includes('topic') || q.includes('common') || q.includes('most')) {
        return {
          answer: `### 🧠 Your Most Common Topics\n\nBased on analysis of **461 conversations** across your full history:\n\n**1. Software Engineering** (142 conversations, 31%)\nYour dominant domain. Key patterns: architecture debates, technology migrations, and performance tuning.\n\n**2. AI & Machine Learning** (97 conversations, 21%)\nHeavy focus on prompt engineering and model selection. You've revisited RAG architecture 12+ times.\n\n**3. Business & Strategy** (61 conversations, 13%)\nProduct decisions clustered around 3 major pivots in Q2 2026.\n\n→ You spend **3× more time on technical problems** than any other category.`,
          sources: ['Chat history analysis', '461 conversations indexed'],
          key_decisions: ['Migrate to TypeScript', 'Adopt Unity WebGL', 'Use SQLite for local dev'],
        };
      }
      if (q.includes('decision')) {
        return {
          answer: `### ⚖️ Your Decision Patterns\n\n**118 decisions** extracted across all conversations.\n\n**Technology Decisions (52%)** — You consistently favour open-source, browser-compatible solutions over proprietary stacks.\n\n**Architecture Decisions (31%)** — Strong preference for modular, microservice-style architectures even in early projects.\n\n**Process Decisions (17%)** — Agile iteration preferred; formal specs avoided until prototypes are validated.\n\n**Pattern**: You tend to revisit decisions 2–3 weeks after making them, which suggests healthy second-guessing behaviour.`,
          sources: ['Decision extraction engine', 'NLP pattern analysis'],
          key_decisions: ['Migrate to Unity WebGL', 'Adopt FastAPI over Django', 'Use ChromaDB for vector search'],
        };
      }
      return {
        answer: `### 📊 Chronicle Intelligence Analysis\n\nYour full conversation history has been indexed: **461 conversations · 8,342 messages · 8 categories**.\n\nI can answer questions like:\n- *"What technologies do I use most?"*\n- *"What problems am I stuck on?"*\n- *"How has my thinking about X evolved?"*\n- *"Summarise all decisions about Y"*\n\nWhat would you like to explore?`,
        sources: ['Global index: 461 conversations'],
        key_decisions: [],
      };
    }
    const res = await fetch(`${API_BASE_URL}/intelligence/ask`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ query }),
    });
    if (!res.ok) throw new Error('Global analyst query failed');
    return res.json();
  };

  const getPersonalProgress = async () => {
    if (isBackendConnected === false) {
      return {
        knowledge_score: 847,
        total_insights: 339,
        resolved_questions: 31,
        growth_chart: [
          { date: 'Jan', count: 18 }, { date: 'Feb', count: 24 }, { date: 'Mar', count: 31 },
          { date: 'Apr', count: 45 }, { date: 'May', count: 62 }, { date: 'Jun', count: 79 },
        ],
        top_topics: [
          { name: 'Software Architecture', count: 89 }, { name: 'AI Systems', count: 74 },
          { name: 'WebGL / Unity',         count: 52 }, { name: 'Database Design', count: 41 },
          { name: 'API Design',            count: 38 }, { name: 'Docker & DevOps', count: 29 },
        ],
        milestones: [
          { date: 'Jun 2026', type: 'breakthrough', title: 'Solved Unity WebGL Memory Problem', description: 'After 3 weeks of investigation across 14 conversations, identified Unity Addressables as the solution to the 1GB browser heap limit.' },
          { date: 'May 2026', type: 'growth', title: 'Mastered FastAPI Architecture', description: 'Transitioned from Django REST to FastAPI — 47 conversations documenting the learning curve, now handling production deployments confidently.' },
          { date: 'May 2026', type: 'resolved', title: 'Resolved JWT Token Management Pattern', description: 'Recurring question about refresh token strategies finally resolved with a sliding-window approach backed by Redis.' },
          { date: 'Apr 2026', type: 'recurring', title: 'Recurring: Microservice vs Monolith Debate', description: 'This debate appears in 23 different conversations. Still oscillating — not yet resolved.' },
        ],
      };
    }
    const res = await fetch(`${API_BASE_URL}/intelligence/progress`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Could not fetch personal progress');
    return res.json();
  };

  return {
    token,
    isBackendConnected,
    loginUser,
    registerUser,
    logoutUser: clearToken,
    // Project APIs (kept for compatibility)
    getProjects,
    createProject,
    getProjectTimeline,
    getProjectDecisions,
    getProjectGraph,
    getProjectDNA,
    getPredictions,
    uploadDocument,
    askHistorian,
    getDashboardStats,
    // Global Intelligence APIs
    getGlobalStats,
    getCategories,
    getCategoryDetails,
    askGlobalAnalyst,
    getPersonalProgress,
  };
};

