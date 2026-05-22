from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from models import TestResult, User
from schemas import ResultCreate, ResultOut
from auth import get_current_user

router = APIRouter(prefix="/results", tags=["results"])


@router.post("/", response_model=ResultOut, status_code=201)
def save_result(
    data: ResultCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    result = TestResult(
        user_id=current_user.id,
        wpm=data.wpm,
        accuracy=data.accuracy,
        word_count=data.word_count,
        mode=data.mode,
        mode_value=data.mode_value,
        word_list=data.word_list,
    )
    db.add(result)
    db.commit()
    db.refresh(result)
    return result


@router.get("/me", response_model=list[ResultOut])
def get_my_results(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    results = (
        db.query(TestResult)
        .filter(TestResult.user_id == current_user.id)
        .order_by(TestResult.created_at.desc())
        .limit(50)
        .all()
    )
    return results
