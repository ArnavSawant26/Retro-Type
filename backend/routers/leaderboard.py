from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from database import get_db
from models import TestResult, User

router = APIRouter(prefix="/leaderboard", tags=["leaderboard"])


@router.get("/")
def get_leaderboard(db: Session = Depends(get_db)):
    """Top 20 users by their best WPM score."""
    rows = (
        db.query(
            User.username,
            func.max(TestResult.wpm).label("best_wpm"),
            func.round(func.avg(TestResult.accuracy), 1).label("avg_accuracy"),
            func.count(TestResult.id).label("tests_taken"),
        )
        .join(TestResult, TestResult.user_id == User.id)
        .group_by(User.id, User.username)
        .order_by(func.max(TestResult.wpm).desc())
        .limit(20)
        .all()
    )

    return [
        {
            "rank": i + 1,
            "username": row.username,
            "best_wpm": row.best_wpm,
            "accuracy": float(row.avg_accuracy) if row.avg_accuracy else 0,
            "tests_taken": row.tests_taken,
        }
        for i, row in enumerate(rows)
    ]
