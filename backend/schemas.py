from datetime import datetime
from typing import Literal, Optional
from pydantic import BaseModel, EmailStr, Field


# ── Auth ──────────────────────────────────────────────

class UserCreate(BaseModel):
    username: str = Field(min_length=3, max_length=50, pattern=r"^[A-Za-z0-9_-]+$")
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)


class UserLogin(BaseModel):
    username: str = Field(min_length=1, max_length=50)
    password: str = Field(min_length=1, max_length=128)


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
    wpm: int = Field(ge=0, le=500)
    accuracy: float = Field(ge=0, le=100)
    word_count: int = Field(ge=0, le=200)
    mode: Literal["words", "time"] = "words"
    mode_value: int = Field(ge=1, le=120)
    word_list: Literal["common100", "common200", "code", "quotes"] = "common200"


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
    max_players: int = Field(default=8, ge=2, le=8)
    test_mode: Literal["words", "time"] = "words"
    mode_value: int = Field(default=30, ge=1, le=120)
    word_list: Literal["common100", "common200", "code", "quotes"] = "common200"


class RoomSettingsUpdate(BaseModel):
    test_mode: Optional[Literal["words", "time"]] = None
    mode_value: Optional[int] = Field(default=None, ge=1, le=120)
    word_list: Optional[Literal["common100", "common200", "code", "quotes"]] = None
    max_players: Optional[int] = Field(default=None, ge=2, le=8)


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
