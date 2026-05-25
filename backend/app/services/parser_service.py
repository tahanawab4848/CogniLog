import json
import io
from typing import Dict, Any, List
from pypdf import PdfReader

class ParserService:
    @staticmethod
    def parse_txt(content: bytes) -> str:
        """Parse raw txt content."""
        return content.decode("utf-8", errors="ignore")

    @staticmethod
    def parse_markdown(content: bytes) -> str:
        """Parse markdown content."""
        return content.decode("utf-8", errors="ignore")

    @staticmethod
    def parse_pdf(content: bytes) -> str:
        """Parse PDF binary content to clean string."""
        pdf_file = io.BytesIO(content)
        reader = PdfReader(pdf_file)
        text_parts = []
        for page in reader.pages:
            text = page.extract_text()
            if text:
                text_parts.append(text)
        return "\n".join(text_parts)

    @staticmethod
    def parse_chatgpt_json(content_json: Dict[str, Any]) -> str:
        """Parse standard ChatGPT export JSON structure."""
        # Standard ChatGPT export lists conversations
        # Each conversation has title and mapping of node IDs to messages
        transcript = []
        conversations = content_json if isinstance(content_json, list) else [content_json]
        
        for convo in conversations:
            title = convo.get("title", "Untitled Conversation")
            transcript.append(f"=== CONVERSATION: {title} ===")
            
            mapping = convo.get("mapping", {})
            # Sort mapping nodes chronologically if possible, or just extract human-assistant pairings
            for node_id, node in mapping.items():
                message = node.get("message")
                if message and message.get("content"):
                    author = message.get("author", {}).get("role", "system")
                    content_parts = message.get("content", {}).get("parts", [])
                    content_str = ""
                    for part in content_parts:
                        if isinstance(part, str):
                            content_str += part
                        elif isinstance(part, dict):
                            content_str += json.dumps(part)
                    if content_str.strip():
                        transcript.append(f"[{author.upper()}]: {content_str.strip()}")
            transcript.append("\n")
            
        return "\n".join(transcript)

    @staticmethod
    def parse_claude_json(content_json: Dict[str, Any]) -> str:
        """Parse standard Claude export JSON structure.
        Also handles the Chronicle Bridge extension format which emits
        sender values of 'human' or 'assistant'.
        """
        transcript = []
        conversations = content_json if isinstance(content_json, list) else [content_json]
        for convo in conversations:
            name = convo.get("name", convo.get("title", "Untitled Conversation"))
            created = convo.get("created_at", "")
            date_str = f" [{created[:10]}]" if created else ""
            transcript.append(f"=== CONVERSATION: {name}{date_str} ===")
            chat_messages = convo.get("chat_messages", [])
            for msg in chat_messages:
                # Normalise: human → user, assistant stays assistant
                raw_sender = msg.get("sender", msg.get("role", "user"))
                sender = "user" if raw_sender in ("human", "user") else "assistant"
                text = msg.get("text", msg.get("content", ""))
                ts = msg.get("created_at", "")
                date_tag = f" ({ts[:10]})" if ts else ""
                if text:
                    transcript.append(f"[{sender.upper()}]{date_tag}: {text}")
            transcript.append("\n")
        return "\n".join(transcript)

    @classmethod
    def parse_file(cls, filename: str, content: bytes) -> str:
        """Unified parser dispatcher."""
        ext = filename.split(".")[-1].lower()
        if ext == "txt":
            return cls.parse_txt(content)
        elif ext in ["md", "markdown"]:
            return cls.parse_markdown(content)
        elif ext == "pdf":
            return cls.parse_pdf(content)
        elif ext == "json":
            try:
                data = json.loads(content.decode("utf-8", errors="ignore"))
                # ── Chronicle Bridge extension format ──────────────────────────
                # List of {uuid, name, chat_messages: [{sender: human|assistant, text}]}
                if isinstance(data, list) and len(data) > 0 and "chat_messages" in data[0]:
                    return cls.parse_claude_json(data)   # same shape, now normalised
                # ── Standard ChatGPT export ────────────────────────────────────
                elif isinstance(data, list) and len(data) > 0 and "mapping" in data[0]:
                    return cls.parse_chatgpt_json(data)
                elif isinstance(data, dict) and "mapping" in data:
                    return cls.parse_chatgpt_json(data)
                elif isinstance(data, dict) and "chat_messages" in data:
                    return cls.parse_claude_json(data)
                else:
                    return json.dumps(data, indent=2)
            except Exception:
                return content.decode("utf-8", errors="ignore")
        else:
            return content.decode("utf-8", errors="ignore")
