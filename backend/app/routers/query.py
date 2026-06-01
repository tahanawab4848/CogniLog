from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.auth import get_current_user
from app.services.ai_service import AIService
from app.services.vector_service import VectorService
from app import models, schemas

router = APIRouter(prefix="/projects/{project_id}", tags=["Query & Analysis"])

@router.post("/ask", response_model=schemas.AskResponse)
def ask_historian(
    project_id: str,
    query_in: schemas.AskQuery,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    project = db.query(models.Project).filter(models.Project.id == project_id, models.Project.owner_id == current_user.id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # 1. Semantic Vector Search to fetch text matches
    matches = VectorService.search_semantic(project_id, query_in.query, limit=4)
    raw_context = "\n\n".join([f"Source: {m['document_name']}\n{m['content']}" for m in matches])

    # 2. Retrieve structured metadata context
    decisions = db.query(models.Decision).filter(models.Decision.project_id == project_id).all()
    events = db.query(models.Event).filter(models.Event.project_id == project_id).all()
    questions = db.query(models.OpenQuestion).filter(models.OpenQuestion.project_id == project_id).all()

    # 3. Call AI Service Historian
    response = AIService.ask_historian(
        project_name=project.name,
        query=query_in.query,
        decisions=decisions,
        events=events,
        questions=questions,
        raw_context=raw_context
    )
    return response

@router.get("/search")
def semantic_search(
    project_id: str,
    q: str,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    project = db.query(models.Project).filter(models.Project.id == project_id, models.Project.owner_id == current_user.id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
        
    if not q:
        raise HTTPException(status_code=400, detail="Query string 'q' is required")

    return VectorService.search_semantic(project_id, q, limit=6)

@router.get("/predict", response_model=schemas.FuturePrediction)
def predict_project_future(
    project_id: str,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    project = db.query(models.Project).filter(models.Project.id == project_id, models.Project.owner_id == current_user.id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    goals = db.query(models.Goal).filter(models.Goal.project_id == project_id).all()
    tasks = db.query(models.Task).filter(models.Task.project_id == project_id).all()
    decisions = db.query(models.Decision).filter(models.Decision.project_id == project_id).all()
    questions = db.query(models.OpenQuestion).filter(models.OpenQuestion.project_id == project_id).all()

    return AIService.predict_future(
        project_name=project.name,
        goals=goals,
        tasks=tasks,
        decisions=decisions,
        questions=questions
    )
