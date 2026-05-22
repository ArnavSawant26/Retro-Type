from datetime import datetime
from pydantic import BaseModel, EmailStr


# ── Auth ──────────────────────────────────────────────

class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str


class UserLogin(BaseModel):
    username: str
    password: str


class UserOut(BaseModel):
    id: int
    username: str
    email: str
    created_at: datetime

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


# ── Results ───────────────────────────────────────────

class ResultCreate(BaseModel):
    wpm: int
    accuracy: float
    word_count: int
    mode: str = "words"
    mode_value: int = 30
    word_list: str = "common"


class ResultOut(BaseModel):
    id: int
    wpm: int
    accuracy: float
    word_count: int
    mode: str
    mode_value: int
    word_list: str
    created_at: datetime

    class Config:
        from_attributes = True


# ── Leaderboard ───────────────────────────────────────

class LeaderboardEntry(BaseModel):
    rank: int
    username: str
    best_wpm: int
    accuracy: float
    tests_taken: int
