from typing import Any, Literal
from pydantic import BaseModel


class HistoryMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str


class ChatRequest(BaseModel):
    message: str
    history: list[HistoryMessage] = []


class ProposedAction(BaseModel):
    entity_type: str
    data: dict[str, Any]


class ChatResponse(BaseModel):
    type: Literal["text", "action"]
    content: str | None = None
    action: ProposedAction | None = None
