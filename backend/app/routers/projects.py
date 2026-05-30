import uuid
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.auth import get_current_user
from app.services.parser_service import ParserService
from app.services.ai_service import AIService
from app.services.vector_service import VectorService
from app.services.graph_service import GraphService
from app import models, schemas

router = APIRouter(prefix="/projects", tags=["Projects"])

@router.post("", response_model=schemas.ProjectResponse)
def create_project(project_in: schemas.ProjectCreate, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    project = models.Project(
        name=project_in.name,
        description=project_in.description,
        owner_id=current_user.id
    )
    db.add(project)
    db.commit()
    db.refresh(project)
    return project

@router.get("", response_model=List[schemas.ProjectResponse])
def list_projects(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(models.Project).filter(models.Project.owner_id == current_user.id).all()

@router.get("/{project_id}", response_model=schemas.ProjectResponse)
def get_project(project_id: str, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    project = db.query(models.Project).filter(models.Project.id == project_id, models.Project.owner_id == current_user.id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project

@router.put("/{project_id}", response_model=schemas.ProjectResponse)
def update_project(project_id: str, project_in: schemas.ProjectUpdate, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    project = db.query(models.Project).filter(models.Project.id == project_id, models.Project.owner_id == current_user.id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    for field, val in project_in.model_dump(exclude_unset=True).items():
        setattr(project, field, val)
        
    db.commit()
    db.refresh(project)
    return project

@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_project(project_id: str, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    project = db.query(models.Project).filter(models.Project.id == project_id, models.Project.owner_id == current_user.id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    db.delete(project)
    db.commit()
    return

@router.post("/{project_id}/documents", response_model=schemas.ExtractedKnowledge)
async def upload_document(
    project_id: str, 
    file: UploadFile = File(...),
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    project = db.query(models.Project).filter(models.Project.id == project_id, models.Project.owner_id == current_user.id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # Read and parse file content
    contents = await file.read()
    try:
        parsed_text = ParserService.parse_file(file.filename, contents)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to parse document: {str(e)}")

    if not parsed_text.strip():
        raise HTTPException(status_code=400, detail="Uploaded file contains no readable text")

    # 1. Save Document in DB
    db_doc = models.Document(
        project_id=project_id,
        name=file.filename,
        content=parsed_text,
        doc_type=file.filename.split(".")[-1].lower()
    )
    db.add(db_doc)
    db.commit()
    db.refresh(db_doc)

    # 2. Vector Indexing of Content in Chunks
    chunk_size = 800
    overlap = 100
    chunks = [parsed_text[i:i + chunk_size] for i in range(0, len(parsed_text), chunk_size - overlap)]
    for idx, chunk in enumerate(chunks):
        chunk_id = f"doc_{db_doc.id}_chunk_{idx}"
        VectorService.index_document_chunk(chunk_id, chunk, project_id, file.filename)

    # 3. AI Extraction
    extracted: schemas.ExtractedKnowledge = AIService.extract_knowledge(parsed_text)

    # Save ideas
    for idea in extracted.ideas:
        db_idea = models.Idea(project_id=project_id, title=idea.title, description=idea.description)
        db.add(db_idea)

    # Save topics
    for topic in extracted.topics:
        db_topic = models.Topic(project_id=project_id, name=topic.name, description=topic.description)
        db.add(db_topic)

    # Save decisions
    for dec in extracted.decisions:
        db_dec = models.Decision(
            project_id=project_id,
            title=dec.title,
            reason=dec.reason,
            evidence=dec.evidence,
            status=dec.status,
            date=dec.date
        )
        db.add(db_dec)

    # Save events
    for ev in extracted.events:
        db_ev = models.Event(
            project_id=project_id,
            title=ev.title,
            description=ev.description,
            event_type=ev.event_type,
            date=ev.date
        )
        db.add(db_ev)

    # Save goals
    for goal in extracted.goals:
        db_goal = models.Goal(project_id=project_id, title=goal.title, status=goal.status, target_date=goal.target_date)
        db.add(db_goal)

    # Save tasks
    for task in extracted.tasks:
        db_task = models.Task(project_id=project_id, title=task.title, status=task.status, assignee=task.assignee)
        db.add(db_task)

    # Save open questions
    for question in extracted.open_questions:
        db_q = models.OpenQuestion(
            project_id=project_id,
            question=question.question,
            status=question.status,
            context=question.context
        )
        db.add(db_q)

    db.commit()

    # 4. Update Project DNA based on extracted events/decisions
    if not project.dna_origin_story:
        project.dna_origin_story = f"Project '{project.name}' evolved through ingestion of '{file.filename}' containing milestones like: " + \
                                   ", ".join([e.title for e in extracted.events[:2]])
    if not project.dna_purpose:
        project.dna_purpose = f"To focus on key architectural areas such as: " + \
                              ", ".join([t.name for t in extracted.topics[:3]]) if extracted.topics else "Not yet fully defined."
    if not project.dna_future_opportunities:
        project.dna_future_opportunities = "Targeting completion of goals: " + \
                                           ", ".join([g.title for g in extracted.goals[:2]]) if extracted.goals else "Continuing core ingestion."
    
    db.commit()

    # 5. Populate and Sync React Flow / Neo4j Graph
    GraphService.get_graph(project_id, db)

    return extracted

@router.get("/{project_id}/graph")
def get_project_graph(
    project_id: str,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    project = db.query(models.Project).filter(models.Project.id == project_id, models.Project.owner_id == current_user.id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Retrieve visual nodes and edges
    return GraphService.get_graph(project_id, db)

@router.get("/{project_id}/decisions", response_model=List[schemas.DecisionResponse])
def get_project_decisions(
    project_id: str,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return db.query(models.Decision).filter(models.Decision.project_id == project_id).all()

@router.get("/{project_id}/timeline", response_model=List[schemas.EventResponse])
def get_project_timeline(
    project_id: str,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Retrieve chronologically
    events = db.query(models.Event).filter(models.Event.project_id == project_id).all()
    return sorted(events, key=lambda x: x.date if x.date else "")

@router.get("/{project_id}/dna", response_model=schemas.ProjectResponse)
def get_project_dna(
    project_id: str,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    project = db.query(models.Project).filter(models.Project.id == project_id, models.Project.owner_id == current_user.id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project
