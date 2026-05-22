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
