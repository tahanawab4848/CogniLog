import logging
from typing import Dict, Any, List
import threading
import re
from sqlalchemy.orm import Session
from app.config import settings
from app import models

logger = logging.getLogger(__name__)

class GraphService:
    driver = None
    use_fallback = True

    @classmethod
    def initialize(cls):
        """Attempts to initialize connection to Neo4j. Falls back to Relational SQL mapping if offline."""
        try:
            from neo4j import GraphDatabase
            cls.driver = GraphDatabase.driver(
                settings.NEO4J_URI,
                auth=(settings.NEO4J_USER, settings.NEO4J_PASSWORD)
            )
            # Verify connectivity
            cls.driver.verify_connectivity()
            cls.use_fallback = False
            logger.info("Successfully connected to Neo4j database.")
        except Exception as e:
            logger.warning(f"Neo4j connection failed: {e}. GraphService will run in Relational-SQL Fallback mode.")
            cls.use_fallback = True

    @classmethod
    def get_graph(cls, project_id: str, db: Session) -> Dict[str, List[Dict[str, Any]]]:
        """
        Retrieves the knowledge graph for a project.
        Returns a dictionary of nodes and edges, compatible with React Flow.
        """
        # Fetch entities from SQL DB
        project = db.query(models.Project).filter(models.Project.id == project_id).first()
        if not project:
            return {"nodes": [], "edges": []}

        ideas = db.query(models.Idea).filter(models.Idea.project_id == project_id).all()
        decisions = db.query(models.Decision).filter(models.Decision.project_id == project_id).all()
        events = db.query(models.Event).filter(models.Event.project_id == project_id).all()
        tasks = db.query(models.Task).filter(models.Task.project_id == project_id).all()
        questions = db.query(models.OpenQuestion).filter(models.OpenQuestion.project_id == project_id).all()

        nodes = []
        edges = []

        # 1. Project Root Node
        nodes.append({
            "id": f"project_{project.id}",
            "type": "projectNode",
            "position": {"x": 250, "y": 50},
            "data": {
                "label": project.name,
                "description": project.description,
                "owner": "Owner"
            }
        })

        # Keep track of y levels for clean React Flow layout
        # Level 1: Topics/Ideas, Level 2: Decisions, Level 3: Tasks/Questions
        idea_y = 180
        decision_y = 300
        event_y = 420
        task_y = 540
        
        # Add Ideas
        for idx, idea in enumerate(ideas):
            idea_id = f"idea_{idea.id}"
            nodes.append({
                "id": idea_id,
                "type": "ideaNode",
                "position": {"x": 50 + (idx * 220), "y": idea_y},
                "data": {"label": idea.title, "description": idea.description}
            })
            edges.append({
                "id": f"edge_p_i_{idea.id}",
                "source": f"project_{project.id}",
                "target": idea_id,
                "label": "CONTAINS",
                "animated": True
            })

        # Add Decisions
        for idx, dec in enumerate(decisions):
            dec_id = f"decision_{dec.id}"
            nodes.append({
                "id": dec_id,
                "type": "decisionNode",
                "position": {"x": 50 + (idx * 240), "y": decision_y},
                "data": {
                    "label": dec.title, 
                    "reason": dec.reason, 
                    "evidence": dec.evidence,
                    "status": dec.status,
                    "date": dec.date
                }
            })
            edges.append({
                "id": f"edge_p_d_{dec.id}",
                "source": f"project_{project.id}",
                "target": dec_id,
                "label": "DECIDES",
                "animated": False
            })

            # Check if this decision is linked to any Ideas by keywords
            for idea in ideas:
                # Better string match: use regex word boundaries and length check
                if len(idea.title) > 3 and re.search(r'\b' + re.escape(idea.title.lower()) + r'\b', dec.reason.lower() + " " + dec.title.lower()):
                    edges.append({
                        "id": f"edge_d_i_{dec.id}_{idea.id}",
                        "source": dec_id,
                        "target": f"idea_{idea.id}",
                        "label": "RESOLVES_IDEA",
                        "animated": True
                    })

        # Add Events in a sequential chain
        sorted_events = sorted(events, key=lambda x: x.date if x.date else "")
        for idx, ev in enumerate(sorted_events):
            ev_id = f"event_{ev.id}"
            nodes.append({
                "id": ev_id,
                "type": "eventNode",
                "position": {"x": 100 + (idx * 220), "y": event_y},
                "data": {
                    "label": ev.title, 
                    "description": ev.description, 
                    "date": ev.date, 
                    "event_type": ev.event_type
                }
            })
            edges.append({
                "id": f"edge_p_e_{ev.id}",
                "source": f"project_{project.id}",
                "target": ev_id,
                "label": "OCCURRED",
                "animated": False
            })

            # Connect sequential events
            if idx > 0:
                prev_ev_id = f"event_{sorted_events[idx - 1].id}"
                edges.append({
                    "id": f"edge_chain_{prev_ev_id}_{ev_id}",
                    "source": prev_ev_id,
                    "target": ev_id,
                    "label": "EVOLVED_TO",
                    "style": {"stroke": "#8b5cf6", "strokeWidth": 2},
                    "animated": True
                })

        # Add Tasks
        for idx, tk in enumerate(tasks):
            tk_id = f"task_{tk.id}"
            nodes.append({
                "id": tk_id,
                "type": "taskNode",
                "position": {"x": 50 + (idx * 220), "y": task_y},
                "data": {
                    "label": tk.title, 
                    "status": tk.status, 
                    "assignee": tk.assignee
                }
            })
            edges.append({
                "id": f"edge_p_t_{tk.id}",
                "source": f"project_{project.id}",
                "target": tk_id,
                "label": "ASSIGNS",
                "animated": False
            })

        # Add Open Questions
        for idx, qn in enumerate(questions):
            qn_id = f"question_{qn.id}"
            nodes.append({
                "id": qn_id,
                "type": "questionNode",
                "position": {"x": 400 + (idx * 240), "y": task_y},
                "data": {
                    "label": qn.question, 
                    "status": qn.status, 
                    "context": qn.context
                }
            })
            edges.append({
                "id": f"edge_p_q_{qn.id}",
                "source": f"project_{project.id}",
                "target": qn_id,
                "label": "QUESTIONS",
                "animated": False
            })

            # Connect task to resolving question if keywords match
            for tk in tasks:
                if any(word in qn.question.lower() for word in tk.title.lower().split() if len(word) > 4):
                    edges.append({
                        "id": f"edge_t_q_{tk.id}_{qn.id}",
                        "source": f"task_{tk.id}",
                        "target": qn_id,
                        "label": "RESOLVES",
                        "animated": True
                    })

        # Write to Neo4j asynchronously if connected
        if not cls.use_fallback:
            threading.Thread(target=cls._sync_to_neo4j_async, args=(project_id, nodes, edges)).start()

        return {"nodes": nodes, "edges": edges}

    @classmethod
    def _sync_to_neo4j_async(cls, project_id: str, nodes: List[Dict], edges: List[Dict]):
        """Syncs the extracted knowledge structures to Neo4j nodes and edges."""
        if not cls.driver:
            return
        
        # Cypher query executes transactionally
        query = """
        MERGE (p:Project {id: $proj_id})
        ON CREATE SET p.name = $proj_name
        
        WITH p
        // Clear old relationships for this project to maintain graph integrity without deleting nodes
        MATCH (p)-[r:CONTAINS|DECIDES|OCCURRED|ASSIGNS|QUESTIONS]->(n)
        DELETE r
        """
        
        try:
            with cls.driver.session() as session:
                proj_name = next((n["data"]["label"] for n in nodes if n["type"] == "projectNode"), "Project")
                session.run(query, proj_id=f"project_{project_id}", proj_name=proj_name)
                
                # Write nodes
                for node in nodes:
                    if node["type"] == "projectNode":
                        continue
                    
                    label = node["type"].replace("Node", "").capitalize()
                    node_id = node["id"]
                    node_label = node["data"]["label"]
                    
                    session.run(
                        f"""
                        MATCH (p:Project {{id: $proj_id}})
                        MERGE (n:{label} {{id: $node_id}})
                        SET n.name = $node_label
                        MERGE (p)-[:CONTAINS]->(n)
                        """,
                        proj_id=f"project_{project_id}",
                        node_id=node_id,
                        node_label=node_label
                    )
                
                # Write edges
                for edge in edges:
                    # Skip basic containment edges already set
                    if edge["label"] == "CONTAINS":
                        continue
                    
                    session.run(
                        """
                        MATCH (a {id: $source_id})
                        MATCH (b {id: $target_id})
                        MERGE (a)-[r:RELATED_TO {label: $label}]->(b)
                        """,
                        source_id=edge["source"],
                        target_id=edge["target"],
                        label=edge["label"]
                    )
        except Exception as e:
            logger.error(f"Neo4j Transaction failed: {e}")

    @classmethod
    def close(cls):
        if cls.driver:
            cls.driver.close()

# Run initialization immediately
GraphService.initialize()
