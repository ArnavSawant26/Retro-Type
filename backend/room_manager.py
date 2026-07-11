import asyncio
import string
import random
import time
from dataclasses import dataclass, field
from fastapi import WebSocket


@dataclass
class PlayerState:
    user_id: int
    username: str
    is_host: bool = False
    is_ready: bool = False
    word_index: int = 0
    char_index: int = 0
    wpm: int = 0
    accuracy: float = 100.0
    progress: float = 0.0
    finished: bool = False
    finish_time: float | None = None
    mistakes: int = 0
    correct_words: int = 0
    incorrect_words: int = 0
    time_taken: float = 0.0
    color: str = "#39ff14"


@dataclass
class RoomState:
    room_id: int
    code: str
    host_user_id: int
    status: str = "waiting"  # "waiting", "countdown", "playing", "finished"
    players: dict = field(default_factory=dict)          # user_id -> PlayerState
    connections: dict = field(default_factory=dict)       # user_id -> WebSocket
    words: list = field(default_factory=list)
    start_time: float | None = None
    test_mode: str = "words"
    mode_value: int = 30
    word_list: str = "common200"
    max_players: int = 8
    is_private: bool = False
    match_id: int | None = None


PLAYER_COLORS = [
    "#39ff14",  # green
    "#ff3547",  # red
    "#00e5ff",  # cyan
    "#ffb627",  # amber
    "#bf5af2",  # purple
    "#ff6b6b",  # coral
    "#48dbfb",  # sky
    "#feca57",  # yellow
]


class RoomManager:
    """Singleton in-memory manager for active multiplayer rooms."""

    def __init__(self):
        self._rooms: dict[str, RoomState] = {}  # code -> RoomState

    def _gen_code(self, length: int = 6) -> str:
        """Generate a unique room code."""
        chars = string.ascii_uppercase + string.digits
        while True:
            code = "".join(random.choices(chars, k=length))
            if code not in self._rooms:
                return code

    def create_room(self, room_id: int, code: str, host_user_id: int,
                    host_username: str, **settings) -> RoomState:
        """Register a new room in memory."""
        # Convert any incoming values
        is_private = settings.get("is_private", False)
        if isinstance(is_private, str):
            is_private = (is_private.lower() == "true")

        room = RoomState(
            room_id=room_id,
            code=code,
            host_user_id=host_user_id,
            is_private=is_private,
            test_mode=settings.get("test_mode", "words"),
            mode_value=settings.get("mode_value", 30),
            word_list=settings.get("word_list", "common200"),
            max_players=settings.get("max_players", 8)
        )
        host = PlayerState(
            user_id=host_user_id,
            username=host_username,
            is_host=True,
            color=PLAYER_COLORS[0],
        )
        room.players[host_user_id] = host
        self._rooms[code] = room
        return room

    def get_room(self, code: str) -> RoomState | None:
        return self._rooms.get(code)

    def get_room_by_id(self, room_id: int) -> RoomState | None:
        for room in self._rooms.values():
            if room.room_id == room_id:
                return room
        return None

    def add_player(self, code: str, user_id: int, username: str) -> PlayerState | None:
        room = self._rooms.get(code)
        if not room:
            return None
        if user_id in room.players:
            return room.players[user_id]  # already in room
        if len(room.players) >= room.max_players:
            return None
        color_idx = len(room.players) % len(PLAYER_COLORS)
        player = PlayerState(
            user_id=user_id,
            username=username,
            color=PLAYER_COLORS[color_idx],
        )
        room.players[user_id] = player
        return player

    def remove_player(self, code: str, user_id: int) -> bool:
        room = self._rooms.get(code)
        if not room or user_id not in room.players:
            return False
        del room.players[user_id]
        if user_id in room.connections:
            del room.connections[user_id]
        # If host left and players remain, transfer host
        if room.host_user_id == user_id and room.players:
            new_host_id = next(iter(room.players))
            room.host_user_id = new_host_id
            room.players[new_host_id].is_host = True
        # If no players left, remove room
        if not room.players:
            del self._rooms[code]
        return True

    def set_ready(self, code: str, user_id: int, ready: bool) -> bool:
        room = self._rooms.get(code)
        if not room or user_id not in room.players:
            return False
        room.players[user_id].is_ready = ready
        return True

    def update_progress(self, code: str, user_id: int, **kwargs) -> bool:
        room = self._rooms.get(code)
        if not room or user_id not in room.players:
            return False
        player = room.players[user_id]
        for key, val in kwargs.items():
            if hasattr(player, key):
                setattr(player, key, val)
        return True

    def mark_finished(self, code: str, user_id: int, **kwargs) -> int:
        """Mark player as finished, return their rank."""
        room = self._rooms.get(code)
        if not room or user_id not in room.players:
            return -1
        player = room.players[user_id]
        player.finished = True
        player.finish_time = time.time()
        for key, val in kwargs.items():
            if hasattr(player, key):
                setattr(player, key, val)
        # Calculate rank based on finish order
        finished_players = sorted(
            [p for p in room.players.values() if p.finished],
            key=lambda p: p.finish_time or float('inf')
        )
        try:
            rank = next(i + 1 for i, p in enumerate(finished_players) if p.user_id == user_id)
        except StopIteration:
            rank = len(finished_players)
        player.progress = 100.0
        return rank

    def all_finished(self, code: str) -> bool:
        room = self._rooms.get(code)
        if not room:
            return True
        return all(p.finished for p in room.players.values())

    def get_leaderboard(self, code: str) -> list[dict]:
        room = self._rooms.get(code)
        if not room:
            return []
        players = list(room.players.values())
        # Sort: finished first (by finish_time), then by progress desc, then WPM desc
        players.sort(key=lambda p: (
            0 if p.finished else 1,
            p.finish_time if p.finished else float('inf'),
            -p.progress,
            -p.wpm,
        ))
        result = []
        for rank, p in enumerate(players, 1):
            result.append({
                "rank": rank,
                "user_id": p.user_id,
                "username": p.username,
                "wpm": p.wpm,
                "accuracy": p.accuracy,
                "progress": p.progress,
                "finished": p.finished,
                "color": p.color,
                "mistakes": p.mistakes,
                "correct_words": p.correct_words,
                "incorrect_words": p.incorrect_words,
                "time_taken": p.time_taken,
            })
        return result

    def connect(self, code: str, user_id: int, ws: WebSocket):
        room = self._rooms.get(code)
        if room:
            room.connections[user_id] = ws

    def disconnect(self, code: str, user_id: int):
        room = self._rooms.get(code)
        if room and user_id in room.connections:
            del room.connections[user_id]

    async def broadcast(self, code: str, event: str, data: dict, exclude: int | None = None):
        """Send a JSON message to all connected clients in a room."""
        room = self._rooms.get(code)
        if not room:
            return
        message = {"event": event, "data": data}
        dead = []
        for uid, ws in room.connections.items():
            if uid == exclude:
                continue
            try:
                await ws.send_json(message)
            except Exception:
                dead.append(uid)
        for uid in dead:
            if uid in room.connections:
                del room.connections[uid]

    async def send_to(self, code: str, user_id: int, event: str, data: dict):
        """Send a message to a specific user."""
        room = self._rooms.get(code)
        if not room or user_id not in room.connections:
            return
        try:
            await room.connections[user_id].send_json({"event": event, "data": data})
        except Exception:
            pass

    def get_players_info(self, code: str) -> list[dict]:
        """Get player info for the waiting room."""
        room = self._rooms.get(code)
        if not room:
            return []
        return [
            {
                "user_id": p.user_id,
                "username": p.username,
                "is_host": p.is_host,
                "is_ready": p.is_ready,
                "color": p.color,
            }
            for p in room.players.values()
        ]

    def cleanup_room(self, code: str):
        if code in self._rooms:
            del self._rooms[code]

    def list_public_rooms(self) -> list[dict]:
        result = []
        for room in self._rooms.values():
            if not room.is_private and room.status == "waiting":
                host_player = room.players.get(room.host_user_id)
                host_username = host_player.username if host_player else "Unknown"
                result.append({
                    "room_id": room.room_id,
                    "code": room.code,
                    "host_username": host_username,
                    "player_count": len(room.players),
                    "max_players": room.max_players,
                    "test_mode": room.test_mode,
                    "mode_value": room.mode_value,
                    "word_list": room.word_list,
                })
        return result


# Singleton instance
room_manager = RoomManager()
