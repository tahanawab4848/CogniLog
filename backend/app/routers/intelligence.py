"""
intelligence.py — Global Intelligence Router

Provides platform-wide endpoints that operate across ALL documents/conversations,
not tied to any single project. The extension uses POST /intelligence/ingest
to send extracted conversation history directly.
"""

from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from sqlalchemy.orm import Session
from typing import List
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
    project_id: str,
    file: UploadFile = File(...),
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Ingestion endpoint used by the Chronicle Bridge browser extension.
    Accepts any supported file format (JSON chat export, TXT, MD, PDF).
    """
    project = db.query(models.Project).filter(models.Project.id == project_id, models.Project.owner_id == current_user.id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Target Project not found")

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
    for pid in user_project_ids:
        results = VectorService.query_similar(query, project_id=pid, top_k=3)
        context_chunks.extend(results)

    from app.services.ai_service import AIService
    answer = AIService.answer_question(query, "\n\n".join(context_chunks))

    return {
        "answer": answer,
        "sources": [f"Project {pid}" for pid in user_project_ids[:3]],
        "key_decisions": [],
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
