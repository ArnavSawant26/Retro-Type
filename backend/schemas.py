from datetime import datetime
from typing import Optional
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


# ── Multiplayer ──────────────────────────────────

class RoomCreate(BaseModel):
    is_private: bool = False
    max_players: int = 8
    test_mode: str = "words"
    mode_value: int = 30
    word_list: str = "common200"


class RoomSettingsUpdate(BaseModel):
    test_mode: Optional[str] = None
    mode_value: Optional[int] = None
    word_list: Optional[str] = None
    max_players: Optional[int] = None


class PlayerOut(BaseModel):
    user_id: int
    username: str
    is_ready: bool
    is_host: bool

    class Config:
        from_attributes = True


class RoomOut(BaseModel):
    id: int
    code: str
    host_user_id: int
    status: str
    is_private: bool
    max_players: int
    test_mode: str
    mode_value: int
    word_list: str
    player_count: int
    players: list[PlayerOut] = []
    created_at: datetime

    class Config:
        from_attributes = True


class MatchResultOut(BaseModel):
    user_id: int
    username: str
    rank: Optional[int] = None
    wpm: int
    accuracy: float
    mistakes: int
    correct_words: int
    incorrect_words: int
    time_taken: float
    finished: bool

    class Config:
        from_attributes = True


class MatchOut(BaseModel):
    id: int
    room_id: int
    started_at: datetime
    ended_at: Optional[datetime] = None
    results: list[MatchResultOut] = []

    class Config:
        from_attributes = True
