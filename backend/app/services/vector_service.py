import logging
import math
import re
from typing import List, Dict, Any, Tuple
from app.config import settings

logger = logging.getLogger(__name__)

# Fallback basic TF-IDF indexer in pure Python
class LocalVectorFallback:
    def __init__(self):
        # Maps doc_id -> content string
        self.documents: Dict[str, str] = {}
        # Maps doc_id -> metadata dictionary
        self.metadata: Dict[str, Dict[str, Any]] = {}
        
    def add_documents(self, ids: List[str], documents: List[str], metadatas: List[Dict[str, Any]]):
        for doc_id, doc, meta in zip(ids, documents, metadatas):
            self.documents[doc_id] = doc
            self.metadata[doc_id] = meta
            
    def _tokenize(self, text: str) -> List[str]:
        return re.findall(r'\w+', text.lower())

    def _cosine_similarity(self, vec1: Dict[str, float], vec2: Dict[str, float]) -> float:
        intersection = set(vec1.keys()) & set(vec2.keys())
        numerator = sum([vec1[x] * vec2[x] for x in intersection])

        sum1 = sum([val**2 for val in vec1.values()])
        sum2 = sum([val**2 for val in vec2.values()])
        denominator = math.sqrt(sum1) * math.sqrt(sum2)

        if not denominator:
            return 0.0
        return numerator / denominator

    def _get_tf(self, tokens: List[str]) -> Dict[str, float]:
        tf = {}
        for token in tokens:
            tf[token] = tf.get(token, 0.0) + 1.0
        # Normalize
        total = len(tokens)
        if total > 0:
            for k in tf:
                tf[k] = tf[k] / total
        return tf

    def query(self, query_text: str, n_results: int = 5) -> Dict[str, Any]:
        query_tokens = self._tokenize(query_text)
        query_tf = self._get_tf(query_tokens)
        
        results = []
        for doc_id, doc_text in self.documents.items():
            doc_tokens = self._tokenize(doc_text)
            doc_tf = self._get_tf(doc_tokens)
            similarity = self._cosine_similarity(query_tf, doc_tf)
            results.append((similarity, doc_id, doc_text, self.metadata[doc_id]))
            
        # Sort by similarity descending
        results.sort(key=lambda x: x[0], reverse=True)
        top_results = results[:n_results]
        
        return {
            "ids": [[r[1] for r in top_results]],
            "documents": [[r[2] for r in top_results]],
            "metadatas": [[r[3] for r in top_results]],
            "distances": [[1.0 - r[0] for r in top_results]] # simulated distance
        }


class VectorService:
    client = None
    collection = None
    fallback_db = LocalVectorFallback()
    use_fallback = True

    @classmethod
    def initialize(cls):
        """Attempts to initialize Chroma DB client; switches to LocalVectorFallback if unsuccessful."""
        if settings.CHROMA_HOST is None:
            logger.info("Chroma host not configured. Running VectorService in Local Fallback mode.")
            cls.use_fallback = True
            return
            
        try:
            import chromadb
            cls.client = chromadb.HttpClient(
                host=settings.CHROMA_HOST,
                port=settings.CHROMA_PORT
            )
            cls.collection = cls.client.get_or_create_collection(name="chronicle_nodes")
            cls.use_fallback = False
            logger.info("Successfully connected to Chroma DB.")
        except Exception as e:
            logger.warning(f"Could not connect to Chroma DB: {e}. Falling back to in-memory TF-IDF indexer.")
            cls.use_fallback = True

    @classmethod
    def index_document_chunk(cls, doc_id: str, text: str, project_id: str, doc_name: str):
        """Indexes a slice of text with reference metadata."""
        if cls.use_fallback:
            cls.fallback_db.add_documents(
                ids=[doc_id],
                documents=[text],
                metadatas=[{"project_id": project_id, "document_name": doc_name}]
            )
            return

        try:
            cls.collection.add(
                ids=[doc_id],
                documents=[text],
                metadatas=[{"project_id": project_id, "document_name": doc_name}]
            )
        except Exception as e:
            logger.error(f"Failed to add document to Chroma: {e}. Indexing to local fallback.")
            cls.fallback_db.add_documents(
                ids=[doc_id],
                documents=[text],
                metadatas=[{"project_id": project_id, "document_name": doc_name}]
            )

    @classmethod
    def search_semantic(cls, project_id: str, query: str, limit: int = 5) -> List[Dict[str, Any]]:
        """Queries the vector base and filters by project_id."""
        if cls.use_fallback:
            res = cls.fallback_db.query(query, n_results=limit)
        else:
            try:
                res = cls.collection.query(
                    query_texts=[query],
                    n_results=limit,
                    where={"project_id": project_id}
                )
            except Exception as e:
                logger.error(f"Chroma query error: {e}. Querying local fallback.")
                res = cls.fallback_db.query(query, n_results=limit)

        output = []
        if res and "documents" in res and res["documents"]:
            ids = res["ids"][0]
            docs = res["documents"][0]
            metas = res["metadatas"][0]
            
            for doc_id, text, metadata in zip(ids, docs, metas):
                # Double-check project filter in fallback mode
                if metadata.get("project_id") == project_id:
                    output.append({
                        "id": doc_id,
                        "content": text,
                        "document_name": metadata.get("document_name", "Unknown Source")
                    })
        return output

# Run initialization immediately
VectorService.initialize()
