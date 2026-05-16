import os
from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    PROJECT_NAME: str = "Project Chronicle"
    API_V1_STR: str = "/api/v1"
    
    # JWT Auth
    SECRET_KEY: str = os.getenv("SECRET_KEY", "super-secret-chronicle-key-change-in-production")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    # Relational Database
    # Fallback to sqlite locally for ease of setup
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./chronicle.db")
    
    # Vector Database
    CHROMA_HOST: Optional[str] = os.getenv("CHROMA_HOST", None)
    CHROMA_PORT: int = int(os.getenv("CHROMA_PORT", 8000))
    
    # Graph Database
    NEO4J_URI: str = os.getenv("NEO4J_URI", "bolt://localhost:7687")
    NEO4J_USER: str = os.getenv("NEO4J_USER", "neo4j")
    NEO4J_PASSWORD: str = os.getenv("NEO4J_PASSWORD", "password")
    
    # AI Keys
    OPENAI_API_KEY: Optional[str] = os.getenv("OPENAI_API_KEY", None)
    GEMINI_API_KEY: Optional[str] = os.getenv("GEMINI_API_KEY", None)
    GROQ_API_KEY: Optional[str] = os.getenv("GROQ_API_KEY", None)
    OLLAMA_BASE_URL: str = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
    
    # Debug / Mock Mode
    FORCE_MOCK_AI: bool = os.getenv("FORCE_MOCK_AI", "false").lower() == "true"

    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()
