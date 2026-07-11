import asyncio
import time
from datetime import datetime, timezone
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
from jose import JWTError, jwt
from sqlalchemy.orm import Session
from database import SessionLocal
from models import User, Room, MultiplayerMatch, MatchResult
from auth import SECRET_KEY, ALGORITHM
from room_manager import room_manager
import random
from routers.words import COMMON_100, COMMON_200, CODE_WORDS, QUOTES, WORD_LISTS

router = APIRouter(tags=["websocket"])


def get_user_from_token(token: str, db: Session) -> User | None:
    """Validate JWT from WebSocket query param."""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = int(payload.get("sub"))
        return db.query(User).filter(User.id == user_id).first()
    except (JWTError, ValueError, TypeError):
        return None


def get_word_list(mode: str, count: int) -> list[str]:
    """Helper to generate list of words based on settings."""
    if mode == "quotes":
        quote = random.choice(QUOTES)
        return quote.split()
    word_list = WORD_LISTS.get(mode, COMMON_200)
    return [random.choice(word_list) for _ in range(count)]


@router.websocket("/ws/room/{room_code}")
async def room_websocket(websocket: WebSocket, room_code: str):
    # Extract token from query params
    token = websocket.query_params.get("token")
    if not token:
        await websocket.close(code=4001, reason="Missing token")
        return

    db = SessionLocal()
    try:
        user = get_user_from_token(token, db)
    finally:
        db.close()

    if not user:
        await websocket.close(code=4001, reason="Invalid token")
        return

    room = room_manager.get_room(room_code)
    if not room:
        await websocket.close(code=4004, reason="Room not found")
        return

    if user.id not in room.players:
        await websocket.close(code=4003, reason="Not a member of this room")
        return

    # Reset room from finished to waiting when someone reconnects
    room_was_reset = False
    if room.status == "finished":
        room.status = "waiting"
        room.words = []
        room.match_id = None
        for p in room.players.values():
            p.is_ready = False
            p.finished = False
            p.progress = 0.0
            p.wpm = 0
            p.finish_time = None
            p.mistakes = 0
            p.correct_words = 0
            p.incorrect_words = 0
            p.time_taken = 0.0
        
        db_session = SessionLocal()
        try:
            db_room = db_session.query(Room).filter(Room.id == room.room_id).first()
            if db_room:
                db_room.status = "waiting"
                db_session.commit()
        except Exception as e:
            print(f"[Websocket] Error updating room status: {e}")
        finally:
            db_session.close()
        room_was_reset = True

    await websocket.accept()
    room_manager.connect(room_code, user.id, websocket)

    # Notify others in the room
    player = room.players[user.id]
    await room_manager.broadcast(room_code, "player_joined", {
        "user_id": user.id,
        "username": user.username,
        "is_host": player.is_host,
        "is_ready": player.is_ready,
        "color": player.color,
    })

    # If the room was reset, broadcast the updated state to all connected clients
    if room_was_reset:
        await room_manager.broadcast(room_code, "room_state", {
            "status": room.status,
            "players": room_manager.get_players_info(room_code),
            "host_user_id": room.host_user_id,
            "test_mode": room.test_mode,
            "mode_value": room.mode_value,
            "word_list": room.word_list,
            "max_players": room.max_players,
            "words": [],
            "start_time": None,
        })
    else:
        # Send current room state to the newly connected player
        await room_manager.send_to(room_code, user.id, "room_state", {
            "status": room.status,
            "players": room_manager.get_players_info(room_code),
            "host_user_id": room.host_user_id,
            "test_mode": room.test_mode,
            "mode_value": room.mode_value,
            "word_list": room.word_list,
            "max_players": room.max_players,
            "words": room.words if room.status in ("playing", "countdown") else [],
            "start_time": room.start_time,
        })

    try:
        while True:
            data = await websocket.receive_json()
            event = data.get("event")
            event_data = data.get("data", {})

            if event == "ready":
                ready = event_data.get("ready", True)
                room_manager.set_ready(room_code, user.id, ready)
                await room_manager.broadcast(room_code, "player_ready", {
                    "user_id": user.id,
                    "ready": ready,
                })

            elif event == "start_game":
                if room.host_user_id != user.id:
                    continue
                if room.status != "waiting":
                    continue

                # Generate word list for this test
                try:
                    words = get_word_list(room.word_list, 200 if room.test_mode == "time" else room.mode_value)
                except Exception:
                    words = ["the", "be", "to", "of", "and", "a", "in", "that", "have", "it"] * 20

                room.words = words
                room.status = "countdown"

                # Reset all player states for the start
                for p in room.players.values():
                    p.word_index = 0
                    p.char_index = 0
                    p.wpm = 0
                    p.accuracy = 100.0
                    p.progress = 0.0
                    p.finished = False
                    p.finish_time = None
                    p.mistakes = 0
                    p.correct_words = 0
                    p.incorrect_words = 0
                    p.time_taken = 0.0

                await room_manager.broadcast(room_code, "game_starting", {
                    "countdown": 5,
                    "words": words,
                    "test_mode": room.test_mode,
                    "mode_value": room.mode_value,
                })

                # Create match in Database
                db = SessionLocal()
                try:
                    match = MultiplayerMatch(room_id=room.room_id)
                    db.add(match)
                    db.commit()
                    db.refresh(match)
                    room.match_id = match.id

                    # Update status in Database
                    db_room = db.query(Room).filter(Room.id == room.room_id).first()
                    if db_room:
                        db_room.status = "playing"
                        db.commit()
                finally:
                    db.close()

                # Start a countdown before launching the game
                async def countdown_timer():
                    await asyncio.sleep(5)
                    room.status = "playing"
                    room.start_time = time.time()
                    await room_manager.broadcast(room_code, "game_started", {
                        "start_time": room.start_time,
                    })

                    # If this is time mode, schedule auto-finishing
                    if room.test_mode == "time":
                        asyncio.create_task(_auto_finish_timer(room_code, room.mode_value))

                asyncio.create_task(countdown_timer())

            elif event == "progress":
                room_manager.update_progress(
                    room_code, user.id,
                    word_index=event_data.get("word_index", 0),
                    char_index=event_data.get("char_index", 0),
                    wpm=event_data.get("wpm", 0),
                    accuracy=event_data.get("accuracy", 100.0),
                    progress=event_data.get("progress", 0.0),
                )
                # Broadcast positions/speeds
                await room_manager.broadcast(room_code, "leaderboard_update", {
                    "players": room_manager.get_leaderboard(room_code),
                })

            elif event == "finished":
                rank = room_manager.mark_finished(
                    room_code, user.id,
                    wpm=event_data.get("wpm", 0),
                    accuracy=event_data.get("accuracy", 100.0),
                    mistakes=event_data.get("mistakes", 0),
                    correct_words=event_data.get("correct_words", 0),
                    incorrect_words=event_data.get("incorrect_words", 0),
                    time_taken=event_data.get("time_taken", 0.0),
                )

                await room_manager.broadcast(room_code, "player_finished", {
                    "user_id": user.id,
                    "username": user.username,
                    "rank": rank,
                    "wpm": event_data.get("wpm", 0),
                    "accuracy": event_data.get("accuracy", 100.0),
                })

                # Broadcast standings
                await room_manager.broadcast(room_code, "leaderboard_update", {
                    "players": room_manager.get_leaderboard(room_code),
                })

                # Check if everyone finished
                if room_manager.all_finished(room_code):
                    await _finish_match(room_code)

            elif event == "chat":
                msg = event_data.get("message", "")
                if msg.strip():
                    await room_manager.broadcast(room_code, "chat_message", {
                        "user_id": user.id,
                        "username": user.username,
                        "message": msg[:500],
                        "timestamp": time.time(),
                    })

            elif event == "kick_player":
                if room.host_user_id != user.id:
                    continue
                kick_id = event_data.get("user_id")
                if kick_id and kick_id != user.id:
                    await room_manager.send_to(room_code, kick_id, "player_kicked", {
                        "user_id": kick_id,
                    })
                    # Rest will be handled by client disconnect, but let's remove now
                    room_manager.remove_player(room_code, kick_id)
                    await room_manager.broadcast(room_code, "player_left", {
                        "user_id": kick_id,
                    })

    except WebSocketDisconnect:
        room_manager.disconnect(room_code, user.id)
        room = room_manager.get_room(room_code)
        if room:
            # If the user disconnected mid-game, mark them as finished with present scores
            if room.status == "playing" and user.id in room.players:
                player = room.players[user.id]
                if not player.finished:
                    room_manager.mark_finished(room_code, user.id)

            room_manager.remove_player(room_code, user.id)
            
            await room_manager.broadcast(room_code, "player_left", {
                "user_id": user.id,
                "new_host_id": room.host_user_id if room.players else None,
            })

            # Check if all remaining players are finished
            if room.status == "playing" and room_manager.all_finished(room_code):
                await _finish_match(room_code)


async def _auto_finish_timer(room_code: str, duration: int):
    """Auto-finish time mode games when the timer expires."""
    await asyncio.sleep(duration)
    room = room_manager.get_room(room_code)
    if room and room.status == "playing":
        # Force finish remaining users
        for p in room.players.values():
            if not p.finished:
                p.finished = True
                p.finish_time = time.time()
        await _finish_match(room_code)


async def _finish_match(room_code: str):
    """Finalizes the match state and saves results to DB."""
    room = room_manager.get_room(room_code)
    if not room or room.status == "finished":
        return
    room.status = "finished"

    leaderboard = room_manager.get_leaderboard(room_code)

    # Save to Database
    db = SessionLocal()
    try:
        if room.match_id:
            match = db.query(MultiplayerMatch).filter(MultiplayerMatch.id == room.match_id).first()
            if match:
                match.ended_at = datetime.now(timezone.utc)
                for entry in leaderboard:
                    # Sync DB finished flag
                    finished_str = "true" if entry["finished"] else "false"
                    res = MatchResult(
                        match_id=room.match_id,
                        user_id=entry["user_id"],
                        rank=entry["rank"],
                        wpm=entry["wpm"],
                        accuracy=entry["accuracy"],
                        mistakes=entry["mistakes"],
                        correct_words=entry["correct_words"],
                        incorrect_words=entry["incorrect_words"],
                        time_taken=entry["time_taken"],
                        finished=finished_str,
                        finished_at=datetime.now(timezone.utc),
                    )
                    db.add(res)
                db.commit()

        db_room = db.query(Room).filter(Room.id == room.room_id).first()
        if db_room:
            db_room.status = "finished"
            db.commit()
    except Exception as e:
        print(f"Error saving match results: {e}")
    finally:
        db.close()

    # Broadcast match complete event
    await room_manager.broadcast(room_code, "match_finished", {
        "leaderboard": leaderboard,
    })
print("[Websocket] router loaded")
