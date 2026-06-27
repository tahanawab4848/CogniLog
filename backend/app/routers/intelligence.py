"""
intelligence.py — Global Intelligence Router

Provides platform-wide endpoints that operate across ALL documents/conversations,
not tied to any single project. The extension uses POST /intelligence/ingest
to send extracted conversation history directly.
"""

from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from app.database import get_db
from app.auth import get_current_user
from app.services.parser_service import ParserService
from app.services.ai_service import AIService
from app.services.vector_service import VectorService
from app import models, schemas

router = APIRouter(prefix="/intelligence", tags=["Intelligence"])


# ─── Removed Auto-create global "Chronicle Inbox" project ───────────────


# ─── POST /intelligence/ingest ────────────────────────────────────────────────
@router.post("/ingest", response_model=schemas.ExtractedKnowledge)
async def global_ingest(
    file: UploadFile = File(...),
    project_id: str = "inbox",
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Ingestion endpoint used by the Chronicle Bridge browser extension.
    Accepts any supported file format (JSON chat export, TXT, MD, PDF).
    """
    project = None
    if project_id != "inbox":
        project = db.query(models.Project).filter(models.Project.id == project_id, models.Project.owner_id == current_user.id).first()
        if not project:
            raise HTTPException(status_code=404, detail="Target Project not found")
    else:
        project = db.query(models.Project).filter(models.Project.name == "Chronicle Inbox", models.Project.owner_id == current_user.id).first()
        if not project:
            project = models.Project(name="Chronicle Inbox", owner_id=current_user.id, description="Default inbox for extension syncs")
            db.add(project)
            db.commit()
            db.refresh(project)

    contents = await file.read()
    if not contents:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    try:
        parsed_text = ParserService.parse_file(file.filename or "upload.txt", contents)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Parse error: {str(e)}")

    if not parsed_text.strip():
        raise HTTPException(status_code=400, detail="No readable text found in uploaded file.")

    # Save raw document
    db_doc = models.Document(
        project_id=project.id,
        name=file.filename or "chronicle_bridge_import.json",
        content=parsed_text,
        doc_type=(file.filename or "json").split(".")[-1].lower(),
    )
    db.add(db_doc)
    db.commit()
    db.refresh(db_doc)

    # Vector-index in chunks
    chunk_size, overlap = 800, 100
    chunks = [
        parsed_text[i : i + chunk_size]
        for i in range(0, len(parsed_text), chunk_size - overlap)
    ]
    for idx, chunk in enumerate(chunks):
        VectorService.index_document_chunk(
            f"global_{db_doc.id}_chunk_{idx}", chunk, project.id, file.filename or "import"
        )

    # AI extraction
    extracted: schemas.ExtractedKnowledge = AIService.extract_knowledge(parsed_text)

    # Persist extracted entities
    for idea in extracted.ideas:
        db.add(models.Idea(project_id=project.id, title=idea.title, description=idea.description))
    for topic in extracted.topics:
        db.add(models.Topic(project_id=project.id, name=topic.name, description=topic.description))
    for dec in extracted.decisions:
        db.add(models.Decision(
            project_id=project.id, title=dec.title, reason=dec.reason,
            evidence=dec.evidence, status=dec.status, date=dec.date,
        ))
    for ev in extracted.events:
        db.add(models.Event(
            project_id=project.id, title=ev.title, description=ev.description,
            event_type=ev.event_type, date=ev.date,
        ))
    for goal in extracted.goals:
        db.add(models.Goal(project_id=project.id, title=goal.title, status=goal.status, target_date=goal.target_date))
    for task in extracted.tasks:
        db.add(models.Task(project_id=project.id, title=task.title, status=task.status, assignee=task.assignee))
    for q in extracted.open_questions:
        db.add(models.OpenQuestion(
            project_id=project.id, question=q.question, status=q.status, context=q.context,
        ))

    db.commit()
    return extracted


# ─── GET /intelligence/overview ───────────────────────────────────────────────
@router.get("/overview")
def global_overview(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Aggregate stats across all of the user's projects/documents."""
    user_project_ids = [
        p.id
        for p in db.query(models.Project).filter(models.Project.owner_id == current_user.id).all()
    ]

    if not user_project_ids:
        return {
            "totalConversations": 0,
            "totalMessages": 0,
            "totalDecisions": 0,
            "totalInsights": 0,
            "totalQuestions": 0,
            "topicsDiscovered": 0,
            "analysisProgress": 0,
            "lastAnalyzed": None,
        }

    total_conversations = db.query(models.Document).filter(
        models.Document.project_id.in_(user_project_ids)
    ).count()

    total_decisions = db.query(models.Decision).filter(
        models.Decision.project_id.in_(user_project_ids)
    ).count()

    total_questions = db.query(models.OpenQuestion).filter(
        models.OpenQuestion.project_id.in_(user_project_ids)
    ).count()

    total_topics = db.query(models.Topic).filter(
        models.Topic.project_id.in_(user_project_ids)
    ).count()

    return {
        "totalConversations": total_conversations,
        "totalMessages": total_conversations * 42,   # estimate
        "totalDecisions": total_decisions,
        "totalInsights": total_topics,
        "totalQuestions": total_questions,
        "topicsDiscovered": total_topics,
        "analysisProgress": 100 if total_conversations > 0 else 0,
        "lastAnalyzed": None,
    }


# ─── GET /intelligence/categories ─────────────────────────────────────────────
@router.get("/categories")
def get_categories(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Return auto-categorised topic clusters across all user projects."""
    user_project_ids = [
        p.id
        for p in db.query(models.Project).filter(models.Project.owner_id == current_user.id).all()
    ]
    if not user_project_ids:
        return []

    topics = (
        db.query(models.Topic)
        .filter(models.Topic.project_id.in_(user_project_ids))
        .all()
    )
    # Group into synthetic categories by keyword matching on topic names
    category_map: dict = {}
    for t in topics:
        key = t.name.split()[0].lower() if t.name else "other"
        if key not in category_map:
            category_map[key] = {"id": key, "name": t.name, "icon": "🏷️", "count": 0,
                                  "decisions": 0, "insights": 0, "color": "linear-gradient(to right,#6366f1,#8b5cf6)",
                                  "description": t.description or ""}
        category_map[key]["count"] += 1

    return list(category_map.values())


# ─── GET /intelligence/chats ───────────────────────────────────────────────
@router.get("/chats")
def global_chats(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Extract individual chat titles and excerpts from the raw documents."""
    user_project_ids = [
        p.id
        for p in db.query(models.Project).filter(models.Project.owner_id == current_user.id).all()
    ]
    if not user_project_ids:
        return []
    
    docs = db.query(models.Document).filter(models.Document.project_id.in_(user_project_ids)).all()
    chats = []
    
    import re
    for doc in docs:
        if not doc.content: continue
        
        # Determine platform
        platform = "Unknown"
        name_lower = doc.name.lower() if doc.name else ""
        if "deepseek" in name_lower:
            platform = "DeepSeek"
        elif "chatgpt" in name_lower:
            platform = "ChatGPT"
        elif "claude" in name_lower:
            platform = "Claude"
        elif "gemini" in name_lower:
            platform = "Gemini"
        elif "sync_chunk" in name_lower:
            platform = "ChatGPT" # Legacy sync chunks were mostly ChatGPT
            
        parts = re.split(r'=== CONVERSATION: (.*?) ===', doc.content)
        if len(parts) > 1:
            for i in range(1, len(parts), 2):
                title = parts[i].strip()
                content = parts[i+1].strip() if i+1 < len(parts) else ""
                preview = content[:150].replace('\n', ' ') + "..."
                chats.append({
                    "id": f"{doc.id}_{i}",
                    "title": title,
                    "preview": preview,
                    "platform": platform,
                    "date": str(doc.created_at)[:19]
                })
        else:
            chats.append({
                "id": str(doc.id),
                "title": doc.name,
                "preview": doc.content[:150].replace('\n', ' ') + "...",
                "platform": platform,
                "date": str(doc.created_at)[:19]
            })
            
    chats.sort(key=lambda x: x["date"], reverse=True)
    return chats

# ─── GET /intelligence/prompt-coach ───────────────────────────────────────────────
@router.get("/prompt-coach")
def get_prompt_coach_analysis(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Extracts recent user prompts and evaluates them using the AI Prompt Coach."""
    user_project_ids = [
        p.id for p in db.query(models.Project).filter(models.Project.owner_id == current_user.id).all()
    ]
    if not user_project_ids:
        return AIService.analyze_prompts([])

    # Get the 10 most recent documents
    docs = db.query(models.Document)\
             .filter(models.Document.project_id.in_(user_project_ids))\
             .order_by(models.Document.created_at.desc())\
             .limit(10)\
             .all()
             
    import re
    import random
    
    user_prompts = []
    
    for doc in docs:
        if not doc.content: continue
        # Extract everything following [USER]: up to the next newline or tag
        matches = re.findall(r'\[USER\]: (.*?)(?=\n\[|$)', doc.content, re.DOTALL)
        for match in matches:
            text = match.strip()
            if text and len(text) > 20: # ignore very short inputs like "continue"
                user_prompts.append(text[:500]) # cap length
                
    if not user_prompts:
        return AIService.analyze_prompts([])
        
    # Pick a random sample of 5-8 prompts to avoid overloading the AI
    sample_size = min(len(user_prompts), random.randint(5, 8))
    sampled_prompts = random.sample(user_prompts, sample_size)
    
    return AIService.analyze_prompts(sampled_prompts)

# ─── GET /intelligence/timeline ───────────────────────────────────────────────
@router.get("/timeline")
def global_timeline(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user_project_ids = [
        p.id
        for p in db.query(models.Project).filter(models.Project.owner_id == current_user.id).all()
    ]
    if not user_project_ids:
        return []

    events = (
        db.query(models.Event)
        .filter(models.Event.project_id.in_(user_project_ids))
        .all()
    )
    return sorted(
        [{"id": e.id, "title": e.title, "description": e.description,
          "event_type": e.event_type, "date": str(e.date) if e.date else ""}
         for e in events],
        key=lambda x: x["date"],
        reverse=True,
    )


# ─── POST /intelligence/ask ────────────────────────────────────────────────────
@router.post("/ask")
def global_ask(
    body: dict,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Ask a question across all of the user's indexed conversation content."""
    query = body.get("query", "")
    if not query:
        raise HTTPException(status_code=400, detail="Query is required.")

    # Use the vector service to retrieve relevant context across all projects
    user_project_ids = [
        p.id
        for p in db.query(models.Project).filter(models.Project.owner_id == current_user.id).all()
    ]
    context_chunks: List[str] = []
    if user_project_ids:
        for pid in user_project_ids:
            results = VectorService.search_semantic(project_id=pid, query=query, limit=3)
            context_chunks.extend([r["content"] for r in results])
            
        decisions = db.query(models.Decision).filter(models.Decision.project_id.in_(user_project_ids)).all()
        events = db.query(models.Event).filter(models.Event.project_id.in_(user_project_ids)).all()
        questions = db.query(models.OpenQuestion).filter(models.OpenQuestion.project_id.in_(user_project_ids)).all()
    else:
        decisions = []
        events = []
        questions = []

    from app.services.ai_service import AIService
    response = AIService.ask_historian(
        project_name="Global Knowledge Base",
        query=query,
        decisions=decisions,
        events=events,
        questions=questions,
        raw_context="\n\n".join(context_chunks)
    )

    return {
        "answer": response.answer,
        "sources": [f"Project {pid}" for pid in user_project_ids[:3]] + response.sources,
        "key_decisions": response.key_decisions,
    }


# ─── GET /intelligence/progress ───────────────────────────────────────────────
@router.get("/progress")
def personal_progress(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Basic personal knowledge progress metrics."""
    user_project_ids = [
        p.id
        for p in db.query(models.Project).filter(models.Project.owner_id == current_user.id).all()
    ]
    if not user_project_ids:
        return {
            "knowledge_score": 0,
            "total_insights": 0,
            "resolved_questions": 0,
            "growth_chart": [{"date": "Now", "count": 0}],
            "top_topics": [],
            "milestones": [],
        }

    total_docs = db.query(models.Document).filter(
        models.Document.project_id.in_(user_project_ids)
    ).count()
    total_decisions = db.query(models.Decision).filter(
        models.Decision.project_id.in_(user_project_ids)
    ).count()

    return {
        "knowledge_score": min(total_docs * 15 + total_decisions * 8, 1000),
        "total_insights": total_docs * 3,
        "resolved_questions": total_decisions,
        "growth_chart": [{"date": "Now", "count": total_docs}],
        "top_topics": [],
        "milestones": [],
    }


# ─── GET & POST /intelligence/sync/state ──────────────────────────────────────
@router.get("/sync/state")
def get_sync_state(
    platform: str,
    account_email: Optional[str] = None,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get the last sync timestamp for a specific platform and account."""
    query = db.query(models.SyncState).filter(
        models.SyncState.user_id == current_user.id,
        models.SyncState.platform == platform
    )
    if account_email:
        query = query.filter(models.SyncState.account_email == account_email)
    
    state = query.first()
    return {
        "last_sync_timestamp": state.last_sync_timestamp.isoformat() if state and state.last_sync_timestamp else None,
        "last_synced_id": state.last_synced_id if state else None
    }

@router.post("/sync/state")
def update_sync_state(
    body: dict,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update the sync state after a successful extraction batch."""
    platform = body.get("platform")
    account_email = body.get("account_email")
    last_sync_timestamp_str = body.get("last_sync_timestamp")
    last_synced_id = body.get("last_synced_id")

    if not platform:
        raise HTTPException(status_code=400, detail="platform is required")

    state = db.query(models.SyncState).filter(
        models.SyncState.user_id == current_user.id,
        models.SyncState.platform == platform,
        models.SyncState.account_email == account_email
    ).first()

    last_sync_timestamp = None
    if last_sync_timestamp_str:
        try:
            # Handle ISO format strings safely
            parsed_dt = datetime.fromisoformat(last_sync_timestamp_str.replace('Z', '+00:00'))
            # SQLite stores naive datetimes. To prevent "can't compare offset-naive and offset-aware datetimes" error:
            last_sync_timestamp = parsed_dt.replace(tzinfo=None)
        except ValueError:
            pass

    if not state:
        state = models.SyncState(
            user_id=current_user.id,
            platform=platform,
            account_email=account_email,
            last_sync_timestamp=last_sync_timestamp,
            last_synced_id=last_synced_id
        )
        db.add(state)
    else:
        # Only update if the new timestamp is newer (or if we didn't have one)
        if last_sync_timestamp and (not state.last_sync_timestamp or last_sync_timestamp > state.last_sync_timestamp):
            state.last_sync_timestamp = last_sync_timestamp
        if last_synced_id:
            state.last_synced_id = last_synced_id

    db.commit()
    return {"status": "success"}
