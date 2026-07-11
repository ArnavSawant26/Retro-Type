from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(120), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    results = relationship("TestResult", back_populates="user")


class TestResult(Base):
    __tablename__ = "test_results"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    wpm = Column(Integer, nullable=False)
    accuracy = Column(Float, nullable=False)
    word_count = Column(Integer, nullable=False)
    mode = Column(String(30), nullable=False, default="words")        # "words" or "time"
    mode_value = Column(Integer, nullable=False, default=30)          # e.g. 30 words or 60 seconds
    word_list = Column(String(30), nullable=False, default="common")  # "common", "code", "quotes"
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="results")


class Room(Base):
    __tablename__ = "rooms"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    code = Column(String(8), unique=True, index=True, nullable=False)
    host_user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    status = Column(String(20), nullable=False, default="waiting")  # "waiting", "playing", "finished"
    is_private = Column(String(5), nullable=False, default="false")  # "true" or "false"
    max_players = Column(Integer, nullable=False, default=8)
    test_mode = Column(String(30), nullable=False, default="words")   # "words", "time"
    mode_value = Column(Integer, nullable=False, default=30)
    word_list = Column(String(30), nullable=False, default="common200")
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    host = relationship("User", foreign_keys=[host_user_id])
    players = relationship("RoomPlayer", back_populates="room", cascade="all, delete-orphan")
    matches = relationship("MultiplayerMatch", back_populates="room", cascade="all, delete-orphan")


class RoomPlayer(Base):
    __tablename__ = "room_players"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    room_id = Column(Integer, ForeignKey("rooms.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    is_ready = Column(String(5), nullable=False, default="false")  # "true" or "false"
    joined_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    room = relationship("Room", back_populates="players")
    user = relationship("User")


class MultiplayerMatch(Base):
    __tablename__ = "multiplayer_matches"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    room_id = Column(Integer, ForeignKey("rooms.id", ondelete="CASCADE"), nullable=False)
    started_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    ended_at = Column(DateTime, nullable=True)

    room = relationship("Room", back_populates="matches")
    results = relationship("MatchResult", back_populates="match", cascade="all, delete-orphan")


class MatchResult(Base):
    __tablename__ = "match_results"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    match_id = Column(Integer, ForeignKey("multiplayer_matches.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    rank = Column(Integer, nullable=True)
    wpm = Column(Integer, nullable=False, default=0)
    accuracy = Column(Float, nullable=False, default=0.0)
    mistakes = Column(Integer, nullable=False, default=0)
    correct_words = Column(Integer, nullable=False, default=0)
    incorrect_words = Column(Integer, nullable=False, default=0)
    time_taken = Column(Float, nullable=False, default=0.0)
    finished = Column(String(5), nullable=False, default="false")  # "true" or "false"
    finished_at = Column(DateTime, nullable=True)

    match = relationship("MultiplayerMatch", back_populates="results")
    user = relationship("User")
