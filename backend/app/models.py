import datetime
import uuid
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Table
from sqlalchemy.orm import relationship
from app.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, index=True, default=lambda: str(uuid.uuid4()))
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    projects = relationship("Project", back_populates="owner")
    sync_states = relationship("SyncState", back_populates="user", cascade="all, delete-orphan")

class Project(Base):
    __tablename__ = "projects"

    id = Column(String(36), primary_key=True, index=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(255), index=True, nullable=False)
    description = Column(Text, nullable=True)
    owner_id = Column(String(36), ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Project DNA Columns
    dna_origin_story = Column(Text, nullable=True)
    dna_purpose = Column(Text, nullable=True)
    dna_future_opportunities = Column(Text, nullable=True)

    owner = relationship("User", back_populates="projects")
    documents = relationship("Document", back_populates="project", cascade="all, delete-orphan")
    ideas = relationship("Idea", back_populates="project", cascade="all, delete-orphan")
    topics = relationship("Topic", back_populates="project", cascade="all, delete-orphan")
    decisions = relationship("Decision", back_populates="project", cascade="all, delete-orphan")
    events = relationship("Event", back_populates="project", cascade="all, delete-orphan")
    goals = relationship("Goal", back_populates="project", cascade="all, delete-orphan")
    tasks = relationship("Task", back_populates="project", cascade="all, delete-orphan")
    open_questions = relationship("OpenQuestion", back_populates="project", cascade="all, delete-orphan")

class Document(Base):
    __tablename__ = "documents"

    id = Column(String(36), primary_key=True, index=True, default=lambda: str(uuid.uuid4()))
    project_id = Column(String(36), ForeignKey("projects.id"))
    name = Column(String(255), nullable=False)
    content = Column(Text, nullable=False)
    doc_type = Column(String(50), default="txt") # json, txt, md, pdf
    source_url = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    project = relationship("Project", back_populates="documents")

class Idea(Base):
    __tablename__ = "ideas"

    id = Column(String(36), primary_key=True, index=True, default=lambda: str(uuid.uuid4()))
    project_id = Column(String(36), ForeignKey("projects.id"))
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    project = relationship("Project", back_populates="ideas")

class Topic(Base):
    __tablename__ = "topics"

    id = Column(String(36), primary_key=True, index=True, default=lambda: str(uuid.uuid4()))
    project_id = Column(String(36), ForeignKey("projects.id"))
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)

    project = relationship("Project", back_populates="topics")

class Decision(Base):
    __tablename__ = "decisions"

    id = Column(String(36), primary_key=True, index=True, default=lambda: str(uuid.uuid4()))
    project_id = Column(String(36), ForeignKey("projects.id"))
    title = Column(String(255), nullable=False)
    reason = Column(Text, nullable=False)
    evidence = Column(Text, nullable=True)
    status = Column(String(50), default="active") # active, superseded, proposed
    date = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    project = relationship("Project", back_populates="decisions")

class Event(Base):
    __tablename__ = "events"

    id = Column(String(36), primary_key=True, index=True, default=lambda: str(uuid.uuid4()))
    project_id = Column(String(36), ForeignKey("projects.id"))
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    event_type = Column(String(50), default="milestone") # creation, pivot, milestone, blocker
    date = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    project = relationship("Project", back_populates="events")

class Goal(Base):
    __tablename__ = "goals"

    id = Column(String(36), primary_key=True, index=True, default=lambda: str(uuid.uuid4()))
    project_id = Column(String(36), ForeignKey("projects.id"))
    title = Column(String(255), nullable=False)
    status = Column(String(50), default="active") # pending, active, completed
    target_date = Column(DateTime, nullable=True)

    project = relationship("Project", back_populates="goals")

class Task(Base):
    __tablename__ = "tasks"

    id = Column(String(36), primary_key=True, index=True, default=lambda: str(uuid.uuid4()))
    project_id = Column(String(36), ForeignKey("projects.id"))
    title = Column(String(255), nullable=False)
    status = Column(String(50), default="todo") # todo, in_progress, done
    assignee = Column(String(255), nullable=True)

    project = relationship("Project", back_populates="tasks")

class OpenQuestion(Base):
    __tablename__ = "open_questions"

    id = Column(String(36), primary_key=True, index=True, default=lambda: str(uuid.uuid4()))
    project_id = Column(String(36), ForeignKey("projects.id"))
    question = Column(Text, nullable=False)
    status = Column(String(50), default="open") # open, resolved
    context = Column(Text, nullable=True)

    project = relationship("Project", back_populates="open_questions")

class SyncState(Base):
    __tablename__ = "sync_states"

    id = Column(String(36), primary_key=True, index=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    platform = Column(String(50), nullable=False) # e.g., 'chatgpt', 'claude'
    account_email = Column(String(255), nullable=True)
    last_sync_timestamp = Column(DateTime, nullable=True)
    last_synced_id = Column(String(255), nullable=True)

    user = relationship("User", back_populates="sync_states")
