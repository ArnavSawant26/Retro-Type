import string
import random
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
from models import Room, RoomPlayer, User
from schemas import RoomCreate, RoomSettingsUpdate
from auth import get_current_user
from room_manager import room_manager

router = APIRouter(prefix="/multiplayer", tags=["multiplayer"])


def _gen_code(length: int = 6) -> str:
    chars = string.ascii_uppercase + string.digits
    return "".join(random.choices(chars, k=length))


@router.post("/rooms", status_code=status.HTTP_201_CREATED)
def create_room(
    data: RoomCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    code = _gen_code()
    # Ensure unique code in database
    while db.query(Room).filter(Room.code == code).first():
        code = _gen_code()

    is_private_str = "true" if data.is_private else "false"

    room = Room(
        code=code,
        host_user_id=current_user.id,
        is_private=is_private_str,
        max_players=data.max_players,
        test_mode=data.test_mode,
        mode_value=data.mode_value,
        word_list=data.word_list,
    )
    db.add(room)
    db.commit()
    db.refresh(room)

    # Add host user to database room_players
    rp = RoomPlayer(room_id=room.id, user_id=current_user.id)
    db.add(rp)
    db.commit()

    # Register in-memory room state
    room_manager.create_room(
        room_id=room.id,
        code=code,
        host_user_id=current_user.id,
        host_username=current_user.username,
        is_private=data.is_private,
        max_players=data.max_players,
        test_mode=data.test_mode,
        mode_value=data.mode_value,
        word_list=data.word_list,
    )

    return {
        "id": room.id,
        "code": code,
        "status": room.status,
        "host_user_id": current_user.id,
        "max_players": data.max_players,
        "test_mode": data.test_mode,
        "mode_value": data.mode_value,
        "word_list": data.word_list,
        "is_private": data.is_private,
    }


@router.get("/rooms")
def list_rooms(current_user: User = Depends(get_current_user)):
    return room_manager.list_public_rooms()


@router.get("/rooms/{room_code}")
def get_room(
    room_code: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    room_state = room_manager.get_room(room_code)
    if not room_state:
        # Fallback to database check in case server restarted but database has it
        db_room = db.query(Room).filter(Room.code == room_code).first()
        if not db_room:
            raise HTTPException(status_code=404, detail="Room not found")
        
        # Recover room state in memory
        db_players = db.query(RoomPlayer).filter(RoomPlayer.room_id == db_room.id).all()
        host_user = db.query(User).filter(User.id == db_room.host_user_id).first()
        host_username = host_user.username if host_user else "Unknown"

        room_state = room_manager.create_room(
            room_id=db_room.id,
            code=db_room.code,
            host_user_id=db_room.host_user_id,
            host_username=host_username,
            is_private=(db_room.is_private == "true"),
            max_players=db_room.max_players,
            test_mode=db_room.test_mode,
            mode_value=db_room.mode_value,
            word_list=db_room.word_list,
        )

        for rp in db_players:
            if rp.user_id != db_room.host_user_id:
                u = db.query(User).filter(User.id == rp.user_id).first()
                if u:
                    room_manager.add_player(db_room.code, u.id, u.username)

    return {
        "id": room_state.room_id,
        "code": room_state.code,
        "status": room_state.status,
        "host_user_id": room_state.host_user_id,
        "max_players": room_state.max_players,
        "test_mode": room_state.test_mode,
        "mode_value": room_state.mode_value,
        "word_list": room_state.word_list,
        "is_private": room_state.is_private,
        "players": room_manager.get_players_info(room_code),
    }


@router.post("/rooms/{room_code}/join")
def join_room(
    room_code: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    room_state = room_manager.get_room(room_code)
    if not room_state:
        raise HTTPException(status_code=404, detail="Room not found")
    if room_state.status != "waiting":
        raise HTTPException(status_code=400, detail="Game already in progress")
    if len(room_state.players) >= room_state.max_players:
        raise HTTPException(status_code=400, detail="Room is full")

    player = room_manager.add_player(room_code, current_user.id, current_user.username)
    if not player:
        raise HTTPException(status_code=400, detail="Could not join room")

    # Sync to DB
    existing = db.query(RoomPlayer).filter(
        RoomPlayer.room_id == room_state.room_id,
        RoomPlayer.user_id == current_user.id
    ).first()
    if not existing:
        rp = RoomPlayer(room_id=room_state.room_id, user_id=current_user.id)
        db.add(rp)
        db.commit()

    return {"message": "Joined room", "code": room_code}


@router.post("/rooms/{room_code}/leave")
def leave_room(
    room_code: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    room_state = room_manager.get_room(room_code)
    if room_state:
        room_manager.remove_player(room_code, current_user.id)
        
        # Clean up database
        db.query(RoomPlayer).filter(
            RoomPlayer.room_id == room_state.room_id,
            RoomPlayer.user_id == current_user.id,
        ).delete()
        
        # If host changed, update host in database
        db_room = db.query(Room).filter(Room.id == room_state.room_id).first()
        if db_room:
            if not room_state.players:
                # No players left, delete room
                db.delete(db_room)
            else:
                db_room.host_user_id = room_state.host_user_id
            db.commit()

    return {"message": "Left room"}


@router.patch("/rooms/{room_code}/settings")
def update_settings(
    room_code: str,
    data: RoomSettingsUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    room_state = room_manager.get_room(room_code)
    if not room_state:
        raise HTTPException(status_code=404, detail="Room not found")
    if room_state.host_user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only host can change settings")

    # Update in memory
    if data.test_mode is not None:
        room_state.test_mode = data.test_mode
    if data.mode_value is not None:
        room_state.mode_value = data.mode_value
    if data.word_list is not None:
        room_state.word_list = data.word_list
    if data.max_players is not None:
        room_state.max_players = data.max_players

    # Sync to DB
    db_room = db.query(Room).filter(Room.id == room_state.room_id).first()
    if db_room:
        if data.test_mode is not None:
            db_room.test_mode = data.test_mode
        if data.mode_value is not None:
            db_room.mode_value = data.mode_value
        if data.word_list is not None:
            db_room.word_list = data.word_list
        if data.max_players is not None:
            db_room.max_players = data.max_players
        db.commit()

    return {"message": "Settings updated"}


@router.post("/rooms/{room_code}/kick/{user_id}")
def kick_player(
    room_code: str,
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    room_state = room_manager.get_room(room_code)
    if not room_state:
        raise HTTPException(status_code=404, detail="Room not found")
    if room_state.host_user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only host can kick players")
    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot kick yourself")

    room_manager.remove_player(room_code, user_id)
    
    # Sync to DB
    db.query(RoomPlayer).filter(
        RoomPlayer.room_id == room_state.room_id,
        RoomPlayer.user_id == user_id,
    ).delete()
    db.commit()

    return {"message": "Player kicked"}


@router.get("/rooms/{room_code}/results")
def get_match_results(
    room_code: str,
    current_user: User = Depends(get_current_user),
):
    room_state = room_manager.get_room(room_code)
    if not room_state:
        raise HTTPException(status_code=404, detail="Room not found")
    return {
        "leaderboard": room_manager.get_leaderboard(room_code),
        "room_code": room_code,
        "status": room_state.status,
    }
