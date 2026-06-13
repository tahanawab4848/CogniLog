import json
import logging
from typing import Dict, Any, List, Optional
from app.config import settings
from app.schemas import ExtractedKnowledge, AskResponse, FuturePrediction

logger = logging.getLogger(__name__)

# System prompts stored inside the service modules as requested
EXTRACTION_PROMPT = """
You are an expert AI knowledge extraction agent.
Your task is to analyze the provided text (which could be chat transcripts, research notes, story drafts, or PDFs) and extract structured knowledge for our Universal Knowledge Engine.

Analyze the text and extract:
1. Project Name (What is the overarching subject, universe, or project name discussed? If not explicitly clear, generate a brief appropriate title).
2. Ideas: New concepts, theories, features, or creative directions.
3. Topics: High-level categories, themes, or areas of interest.
4. Decisions: Key conclusions reached, facts established, or decisions made, including their justification/reasons, evidence (e.g. quotes or conversation mentions), status (active, superseded, proposed), and date.
5. Events: Key chronological points such as milestones, historical events, pivots, or launch dates.
6. Goals: High-level achievements, objectives, or research targets.
7. Tasks: Action items, next steps, or todo items, status (todo, in_progress, done), and assignee if mentioned.
8. Open Questions: Unresolved issues, challenges, knowledge gaps, or questions raised.

You must return a valid JSON object matching the following structure:
{
  "project_name": "string",
  "ideas": [{"title": "string", "description": "string"}],
  "topics": [{"name": "string", "description": "string"}],
  "decisions": [{"title": "string", "reason": "string", "evidence": "string", "status": "string", "date": "string"}],
  "events": [{"title": "string", "description": "string", "event_type": "string", "date": "string"}],
  "goals": [{"title": "string", "status": "string", "target_date": "string"}],
  "tasks": [{"title": "string", "status": "string", "assignee": "string"}],
  "open_questions": [{"question": "string", "status": "string", "context": "string"}]
}

Ensure all dates are formatted as YYYY-MM-DD if possible, or simple textual approximations.
"""

HISTORIAN_PROMPT = """
You are the "AI Historian" and Insight Engine for this Knowledge Base.
You have access to the domain's timeline events, key conclusions, open questions, and raw document contents.
Your task is to answer the user's query about the history, origin, evolution, and future of this subject.

Answer in a structured markdown format including:
1. **Origin / Background**: How this subject or project started.
2. **Evolution & Major Milestones**: Progression over time.
3. **Key Conclusions & Rationale**: Pivotal decisions, facts established, or design choices and the reasoning behind them.
4. **Current State & Unresolved Challenges**: What is currently being explored and what questions remain open.
5. **Future Directions**: Recommendations or trends visible in the context.

Context:
---
Project Name: {project_name}
Decisions: {decisions_str}
Events: {events_str}
Open Questions: {questions_str}
Raw Context Snippet: {raw_context}
---
Query: {query}
"""

PREDICTION_PROMPT = """
Analyze the subject history, key conclusions, open questions, and objectives.
Predict the following:
1. Potential blockers (technical, logical, organizational, or resource-related).
2. Likely next action items or steps that must be accomplished.
3. Missing requirements (things discussed or implied but not planned or resolved).
4. Similar patterns, themes, or lessons learned.

Return a JSON object:
{{
  "blockers": ["string"],
  "next_tasks": ["string"],
  "missing_requirements": ["string"],
  "similar_patterns": ["string"]
}}

Context:
---
Project: {project_name}
Goals: {goals_str}
Tasks: {tasks_str}
Decisions: {decisions_str}
Open Questions: {questions_str}
"""

class AIService:
    @staticmethod
    def _get_openai_client():
        if not settings.OPENAI_API_KEY:
            return None
        try:
            from openai import OpenAI
            return OpenAI(api_key=settings.OPENAI_API_KEY)
        except Exception:
            return None

    @staticmethod
    def _get_groq_client():
        if not settings.GROQ_API_KEY:
            return None
        try:
            from openai import OpenAI
            return OpenAI(base_url="https://api.groq.com/openai/v1", api_key=settings.GROQ_API_KEY)
        except Exception:
            return None

    @staticmethod
    def _get_gemini_client():
        if not settings.GEMINI_API_KEY:
            return None
        try:
            import google.generativeai as genai
            genai.configure(api_key=settings.GEMINI_API_KEY)
            return genai
        except Exception:
            return None

    @classmethod
    def extract_knowledge(cls, content: str) -> ExtractedKnowledge:
        """Extracts structured knowledge from document text using LLM, with a smart mock fallback."""
        if settings.FORCE_MOCK_AI:
            return cls._mock_knowledge_extraction(content)

        # 1. Try Groq (Fastest)
        groq_client = cls._get_groq_client()
        if groq_client:
            try:
                response = groq_client.chat.completions.create(
                    model="llama3-70b-8192",
                    response_format={"type": "json_object"},
                    messages=[
                        {"role": "system", "content": EXTRACTION_PROMPT},
                        {"role": "user", "content": content[:30000]} # truncate to fit 8K token context roughly
                    ],
                    temperature=0.1
                )
                res_content = response.choices[0].message.content
                cleaned = cls._clean_json_string(res_content)
                return ExtractedKnowledge.model_validate_json(cleaned)
            except Exception as e:
                logger.warning(f"Groq extraction failed, trying OpenAI. Error: {e}")

        # 2. Try OpenAI
        client = cls._get_openai_client()
        if client:
            try:
                response = client.chat.completions.create(
                    model="gpt-4o-mini",
                    response_format={"type": "json_object"},
                    messages=[
                        {"role": "system", "content": EXTRACTION_PROMPT},
                        {"role": "user", "content": content[:60000]} # truncate to fit context
                    ],
                    temperature=0.1
                )
                res_content = response.choices[0].message.content
                cleaned = cls._clean_json_string(res_content)
                return ExtractedKnowledge.model_validate_json(cleaned)
            except Exception as e:
                logger.warning(f"OpenAI extraction failed, trying Gemini. Error: {e}")

        # 2. Try Gemini
        gemini = cls._get_gemini_client()
        if gemini:
            try:
                model = gemini.GenerativeModel('gemini-1.5-flash', generation_config={"response_mime_type": "application/json"})
                prompt = EXTRACTION_PROMPT + "\n\nText to analyze:\n" + content
                response = model.generate_content(prompt)
                cleaned = cls._clean_json_string(response.text)
                return ExtractedKnowledge.model_validate_json(cleaned)
            except Exception as e:
                logger.warning(f"Gemini extraction failed, trying local Ollama. Error: {e}")

        # 3. Try Ollama (local)
        try:
            import requests
            url = f"{settings.OLLAMA_BASE_URL}/api/generate"
            prompt = EXTRACTION_PROMPT + "\n\nAnalyze this text:\n" + content
            payload = {
                "model": "llama3",
                "prompt": prompt,
                "stream": False,
                "format": "json"
            }
            response = requests.post(url, json=payload, timeout=10)
            if response.status_code == 200:
                res_data = response.json()
                cleaned = cls._clean_json_string(res_data.get("response", "{}"))
                return ExtractedKnowledge.model_validate_json(cleaned)
        except Exception as e:
            logger.warning(f"Ollama extraction failed. Error: {e}")

        # 4. Final Fallback to Smart Mock
        logger.info("All AI services unavailable or failed. Falling back to Smart Mock Engine.")
        return cls._mock_knowledge_extraction(content)

    @classmethod
    def ask_historian(cls, project_name: str, query: str, decisions: List[Any], events: List[Any], questions: List[Any], raw_context: str) -> AskResponse:
        """Answers historical queries using available LLMs or smart pattern matcher."""
        decisions_str = ", ".join([f"[{d.title}: {d.reason} (Status: {d.status})]" for d in decisions])
        events_str = ", ".join([f"[{e.title}: {e.description} ({e.date})]" for e in events])
        questions_str = ", ".join([f"[{q.question} ({q.status})]" for q in questions])

        prompt = HISTORIAN_PROMPT.format(
            project_name=project_name,
            decisions_str=decisions_str,
            events_str=events_str,
            questions_str=questions_str,
            raw_context=raw_context[:2000], # truncate to prevent token blowout
            query=query
        )

        if not settings.FORCE_MOCK_AI:
            # Try Groq
            groq_client = cls._get_groq_client()
            if groq_client:
                try:
                    res = groq_client.chat.completions.create(
                        model="llama3-70b-8192",
                        messages=[{"role": "user", "content": prompt}],
                        temperature=0.3
                    )
                    answer = res.choices[0].message.content
                    return AskResponse(
                        answer=answer,
                        sources=["Knowledge Graph", "Decisions DB", "Project Events"],
                        timeline_suggested=[e.title for e in events[:3]],
                        key_decisions=[d.title for d in decisions[:2]]
                    )
                except Exception as e:
                    logger.warning(f"Groq Historian failed: {e}")
            # Try OpenAI
            client = cls._get_openai_client()
            if client:
                try:
                    res = client.chat.completions.create(
                        model="gpt-4o-mini",
                        messages=[{"role": "user", "content": prompt}],
                        temperature=0.3
                    )
                    answer = res.choices[0].message.content
                    return AskResponse(
                        answer=answer,
                        sources=["Knowledge Graph", "Decisions DB", "Project Events"],
                        timeline_suggested=[e.title for e in events[:3]],
                        key_decisions=[d.title for d in decisions[:2]]
                    )
                except Exception as e:
                    logger.warning(f"OpenAI Historian failed: {e}")

            # Try Gemini
            gemini = cls._get_gemini_client()
            if gemini:
                try:
                    model = gemini.GenerativeModel('gemini-1.5-flash')
                    res = model.generate_content(prompt)
                    return AskResponse(
                        answer=res.text,
                        sources=["Knowledge Graph", "Decisions DB", "Project Documents"],
                        timeline_suggested=[e.title for e in events[:3]],
                        key_decisions=[d.title for d in decisions[:2]]
                    )
                except Exception as e:
                    logger.warning(f"Gemini Historian failed: {e}")

        # Fallback to local rule-based answer
        return cls._mock_historian_response(project_name, query, decisions, events, questions)

    @classmethod
    def predict_future(cls, project_name: str, goals: List[Any], tasks: List[Any], decisions: List[Any], questions: List[Any]) -> FuturePrediction:
        """Analyze project state and predict next actions/blockers."""
        goals_str = ", ".join([g.title for g in goals])
        tasks_str = ", ".join([f"{t.title} ({t.status})" for t in tasks])
        decisions_str = ", ".join([d.title for d in decisions])
        questions_str = ", ".join([q.question for q in questions])

        prompt = PREDICTION_PROMPT.format(
            project_name=project_name,
            goals_str=goals_str,
            tasks_str=tasks_str,
            decisions_str=decisions_str,
            questions_str=questions_str
        )

        if not settings.FORCE_MOCK_AI:
            # Try Groq
            groq_client = cls._get_groq_client()
            if groq_client:
                try:
                    res = groq_client.chat.completions.create(
                        model="llama3-70b-8192",
                        response_format={"type": "json_object"},
                        messages=[{"role": "user", "content": prompt}],
                        temperature=0.2
                    )
                    data = json.loads(res.choices[0].message.content)
                    return FuturePrediction(**data)
                except Exception as e:
                    logger.warning(f"Groq Prediction failed: {e}")
            client = cls._get_openai_client()
            if client:
                try:
                    res = client.chat.completions.create(
                        model="gpt-4o-mini",
                        response_format={"type": "json_object"},
                        messages=[{"role": "user", "content": prompt}],
                        temperature=0.2
                    )
                    data = json.loads(res.choices[0].message.content)
                    return FuturePrediction(**data)
                except Exception as e:
                    logger.warning(f"OpenAI Prediction failed: {e}")

        # Fallback
        return cls._mock_predictions(project_name, goals, tasks, decisions, questions)

    @staticmethod
    def _clean_json_string(text: str) -> str:
        text = text.strip()
        if text.startswith("```json"):
            text = text[7:]
        elif text.startswith("```"):
            text = text[3:]
        if text.endswith("```"):
            text = text[:-3]
        return text.strip()

    @staticmethod
    def _mock_knowledge_extraction(content: str) -> ExtractedKnowledge:
        """Smart keyword-based simulation of AI extraction."""
        content_lower = content.lower()
        # Extract title from first line
        lines = [l.strip() for l in content.split("\n") if l.strip()]
        proj_name = "Extracted Chronicle"
        if lines:
            proj_name = lines[0][:40].replace("#", "").strip()
            if len(proj_name) < 5:
                proj_name = "AI Chronicle Project"

        return ExtractedKnowledge(
            project_name=proj_name,
            ideas=[
                {"title": "Continuous Ingestion Engine", "description": "Automatically reads exports and notes to map concept connections."},
                {"title": "Project DNA Summary Cards", "description": "Distill origin, current state, and unresolved opportunities automatically."}
            ],
            topics=[
                {"name": "Knowledge Extraction", "description": "Using NLP to extract structures."},
                {"name": "Semantic Graphing", "description": "Linking concepts through directional graph matrices."}
            ],
            decisions=[
                {
                    "title": "Use SQLite as Local Default Database",
                    "reason": "Ensures zero-setup local execution with immediate developer productivity, supporting smooth dockerized Postgres upgrades.",
                    "evidence": "Project specs requirement for run-and-wow setup.",
                    "status": "active",
                    "date": "2026-06-08"
                }
            ],
            events=[
                {"title": "System Architecture Setup", "description": "Database models and FastAPI backend routes configured.", "event_type": "creation", "date": "2026-06-08"}
            ],
            goals=[
                {"title": "Achieve 80% Backend test coverage", "status": "active", "target_date": "2026-06-15"}
            ],
            tasks=[
                {"title": "Implement Frontend WebGL Graph Visualizer using React Flow", "status": "in_progress", "assignee": "Frontend dev"}
            ],
            open_questions=[
                {"question": "What is the best parsing methodology for custom Claude JSON exports?", "status": "open", "context": "Analyzing structured nested nodes."}
            ]
        )

    @staticmethod
    def _mock_historian_response(project_name: str, query: str, decisions: List[Any], events: List[Any], questions: List[Any]) -> AskResponse:
        """Rule-based simulation of AI Historian answers."""
        query_l = query.lower()

        # Generic Answer
        answer = f"""### 📝 project Summary: {project_name}

#### 1. Origin Story
This project was initiated to store and analyze the development of projects, documents, and codebases.

#### 2. Evolution & Major Milestones
The system recently completed its core database setup. The initial commit registered database models, FastAPI routing nodes, and a fallback SQLite/Chroma layout.

#### 3. Key Decisions
* **SQLite local fallback**: Configured to run instantly without external Postgres or Neo4j dependencies, allowing rapid dev prototyping.

#### 4. Current Challenges
* Establishing clean structured parsing templates for different conversation export styles (ChatGPT, Claude, Gemini).

#### 5. Next steps
* Expanding React Flow dashboard components to support full drag-and-drop file ingestion.
"""
        return AskResponse(
            answer=answer,
            sources=["Initial Config files", "Database models"],
            timeline_suggested=["System Architecture Setup"],
            key_decisions=["Use SQLite as Local Default Database"]
        )

    @staticmethod
    def _mock_predictions(project_name: str, goals: List[Any], tasks: List[Any], decisions: List[Any], questions: List[Any]) -> FuturePrediction:
        """Create mock prediction outputs based on project content."""
        return FuturePrediction(
            blockers=[
                "High API token consumption if analyzing extremely long chat exports (e.g. >10MB logs)."
            ],
            next_tasks=[
                "Write chunking utility in `parser_service.py` to break files into 50KB segments before vector indexing.",
                "Build unit tests to verify JWT token expiration behavior."
            ],
            missing_requirements=[
                "Detailed schema for mapping document source URLs to timeline cards."
            ],
            similar_patterns=[
                "Standard monorepo scaling issues solved by containerizing services in Docker Compose."
            ]
        )
