from pydantic import BaseModel, EmailStr
from typing import Optional, List
import datetime

# --- Auth ---
class UserBase(BaseModel):
    email: EmailStr
    full_name: Optional[str] = None

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: str
    created_at: datetime.datetime

    class Config:
        from_attributes = True

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

# --- DNA / Extractions ---
class IdeaCreate(BaseModel):
    title: str
    description: str

class IdeaResponse(IdeaCreate):
    id: str
    project_id: str
    created_at: datetime.datetime

    class Config:
        from_attributes = True

class TopicCreate(BaseModel):
    name: str
    description: Optional[str] = None

class TopicResponse(TopicCreate):
    id: str
    project_id: str

    class Config:
        from_attributes = True

class DecisionCreate(BaseModel):
    title: str
    reason: str
    evidence: Optional[str] = None
    status: Optional[str] = "active"
    date: Optional[datetime.datetime] = None

class DecisionResponse(DecisionCreate):
    id: str
    project_id: str
    created_at: datetime.datetime

    class Config:
        from_attributes = True

class EventCreate(BaseModel):
    title: str
    description: str
    event_type: Optional[str] = "milestone"
    date: Optional[datetime.datetime] = None

class EventResponse(EventCreate):
    id: str
    project_id: str
    created_at: datetime.datetime

    class Config:
        from_attributes = True

class GoalCreate(BaseModel):
    title: str
    status: Optional[str] = "active"
    target_date: Optional[datetime.datetime] = None

class GoalResponse(GoalCreate):
    id: str
    project_id: str

    class Config:
        from_attributes = True

class TaskCreate(BaseModel):
    title: str
    status: Optional[str] = "todo"
    assignee: Optional[str] = None

class TaskResponse(TaskCreate):
    id: str
    project_id: str

    class Config:
        from_attributes = True

class OpenQuestionCreate(BaseModel):
    question: str
    status: Optional[str] = "open"
    context: Optional[str] = None

class OpenQuestionResponse(OpenQuestionCreate):
    id: str
    project_id: str

    class Config:
        from_attributes = True

# --- Document ---
class DocumentCreate(BaseModel):
    name: str
    content: str
    doc_type: Optional[str] = "txt"
    source_url: Optional[str] = None

class DocumentResponse(DocumentCreate):
    id: str
    project_id: str
    created_at: datetime.datetime

    class Config:
        from_attributes = True

# --- Project ---
class ProjectCreate(BaseModel):
    name: str
    description: Optional[str] = None

class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    dna_origin_story: Optional[str] = None
    dna_purpose: Optional[str] = None
    dna_future_opportunities: Optional[str] = None

class ProjectResponse(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    created_at: datetime.datetime
    dna_origin_story: Optional[str] = None
    dna_purpose: Optional[str] = None
    dna_future_opportunities: Optional[str] = None

    class Config:
        from_attributes = True

# --- Extraction schemas ---
class ExtractedKnowledge(BaseModel):
    project_name: str
    ideas: List[IdeaCreate] = []
    topics: List[TopicCreate] = []
    decisions: List[DecisionCreate] = []
    events: List[EventCreate] = []
    goals: List[GoalCreate] = []
    tasks: List[TaskCreate] = []
    open_questions: List[OpenQuestionCreate] = []

# --- Queries and Predictions ---
class AskQuery(BaseModel):
    query: str

class AskResponse(BaseModel):
    answer: str
    sources: List[str] = []
    timeline_suggested: List[str] = []
    key_decisions: List[str] = []

class FuturePrediction(BaseModel):
    blockers: List[str]
    next_tasks: List[str]
    missing_requirements: List[str]
    similar_patterns: List[str]

# --- Dashboard Statistics ---
class DashboardStats(BaseModel):
    total_projects: int
    total_ideas: int
    total_decisions: int
    total_open_questions: int
    recent_activity: List[str]
    growth_chart_data: List[dict] # list of {"date": str, "count": int}
