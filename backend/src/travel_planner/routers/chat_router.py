from uuid import UUID

import requests
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from travel_planner.db.session import get_db
from travel_planner.schemas.chat import ChatRequest, ChatResponse
from travel_planner.services import chat_service, trip_service

router = APIRouter(prefix="/trips/{trip_id}/chat", tags=["chat"])


@router.post("/", response_model=ChatResponse)
def chat(trip_id: UUID, body: ChatRequest, db: Session = Depends(get_db)):
    trip = trip_service.get_by_id(db, trip_id)
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    try:
        return chat_service.chat(db, trip_id, body.message, body.history)
    except requests.exceptions.ConnectionError:
        raise HTTPException(status_code=503, detail="Ollama not reachable — run: ollama serve")
    except requests.exceptions.Timeout:
        raise HTTPException(status_code=504, detail="Ollama timeout")
