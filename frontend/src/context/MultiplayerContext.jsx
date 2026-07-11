import { createContext, useContext, useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { wsService } from "../services/wsService";
import { useAuth } from "./AuthContext";
import * as api from "../services/multiplayerApi";

const MultiplayerContext = createContext(null);

export const MultiplayerProvider = ({ children }) => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [roomCode, setRoomCode] = useState(null);
  const [room, setRoom] = useState(null);
  const [players, setPlayers] = useState([]);
  const [gameState, setGameState] = useState("idle"); // "idle", "waiting", "countdown", "playing", "finished"
  const [words, setWords] = useState([]);
  const [chatMessages, setChatMessages] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [countdown, setCountdown] = useState(5);
  const [roomSettings, setRoomSettings] = useState(null);

  const countdownIntervalRef = useRef(null);

  const myUserId = user?.id;
  const isHost = room && myUserId && room.host_user_id === myUserId;

  // Cleanup helper
  const resetMultiplayerState = () => {
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
    }
    setRoomCode(null);
    setRoom(null);
    setPlayers([]);
    setGameState("idle");
    setWords([]);
    setChatMessages([]);
    setLeaderboard([]);
    setCountdown(5);
    setRoomSettings(null);
    wsService.disconnect();
  };

  const connectToRoom = (code) => {
    // If already connected to this room, skip the destructive reset+reconnect
    if (roomCode === code && wsService.ws && wsService.ws.readyState <= WebSocket.OPEN) {
      return;
    }
    resetMultiplayerState();
    setRoomCode(code);
    setGameState("waiting");
    wsService.connect(code);
  };

  const disconnectFromRoom = async () => {
    if (roomCode) {
      try {
        await api.leaveRoom(roomCode);
      } catch (e) {
        console.error("Error leaving room:", e);
      }
    }
    resetMultiplayerState();
    navigate("/multiplayer");
  };

  const sendReady = (ready) => {
    wsService.send("ready", { ready });
  };

  const startGame = () => {
    if (isHost) {
      wsService.send("start_game", {});
    }
  };

  const sendProgress = (data) => {
    wsService.send("progress", data);
  };

  const sendFinished = (data) => {
    wsService.send("finished", data);
  };

  const sendChat = (message) => {
    wsService.send("chat", { message });
  };

  const kickPlayer = async (userId) => {
    if (isHost && roomCode) {
      try {
        await api.kickPlayer(roomCode, userId);
        wsService.send("kick_player", { user_id: userId });
      } catch (e) {
        console.error("Error kicking player:", e);
      }
    }
  };

  const updateSettings = async (settings) => {
    if (isHost && roomCode) {
      try {
        await api.updateRoomSettings(roomCode, settings);
        // Force refresh state via WS broadcast or direct update
        setRoom((prev) => ({ ...prev, ...settings }));
      } catch (e) {
        console.error("Error updating settings:", e);
      }
    }
  };

  useEffect(() => {
    if (!roomCode) return;

    // ── WebSocket Listener Registrations ──
    const offConnected = wsService.on("connected", () => {
      console.log("✓ Connected to multiplayer WebSocket");
    });

    const offRoomState = wsService.on("room_state", (data) => {
      setRoom({
        host_user_id: data.host_user_id,
        test_mode: data.test_mode,
        mode_value: data.mode_value,
        word_list: data.word_list,
        max_players: data.max_players,
        start_time: data.start_time || null,
      });
      setPlayers(data.players);
      setGameState(data.status);
      if (data.words && data.words.length > 0) {
        setWords(data.words);
      }
      // Re-populate leaderboard if already playing/finished
      if (data.status === "playing" || data.status === "finished") {
        // Prepare initial layout
        setLeaderboard(
          data.players.map((p) => ({
            user_id: p.user_id,
            username: p.username,
            wpm: 0,
            accuracy: 100,
            progress: 0,
            finished: false,
            color: p.color,
          }))
        );
      }
    });

    const offPlayerJoined = wsService.on("player_joined", (player) => {
      setPlayers((prev) => {
        // Prevent duplicate entries
        if (prev.some((p) => p.user_id === player.user_id)) return prev;
        return [...prev, player];
      });
    });

    const offPlayerLeft = wsService.on("player_left", (data) => {
      setPlayers((prev) => prev.filter((p) => p.user_id !== data.user_id));
      if (data.new_host_id) {
        setRoom((prev) => prev ? { ...prev, host_user_id: data.new_host_id } : null);
        setPlayers((prev) =>
          prev.map((p) => (p.user_id === data.new_host_id ? { ...p, is_host: true } : p))
        );
      }
    });

    const offPlayerReady = wsService.on("player_ready", (data) => {
      setPlayers((prev) =>
        prev.map((p) => (p.user_id === data.user_id ? { ...p, is_ready: data.ready } : p))
      );
    });

    const offGameStarting = wsService.on("game_starting", (data) => {
      setWords(data.words);
      setGameState("countdown");
      setCountdown(data.countdown);

      // Ticker interval
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
      let count = data.countdown;
      countdownIntervalRef.current = setInterval(() => {
        count--;
        if (count >= 0) {
          setCountdown(count);
        } else {
          clearInterval(countdownIntervalRef.current);
        }
      }, 1000);
    });

    const offGameStarted = (data) => {
      setGameState("playing");
      // Store start_time in room state so the typing hook can use it
      setRoom((prev) => ({ ...prev, start_time: data.start_time }));
      navigate(`/game/${roomCode}`);
    };
    const offGameStartedUnsubscribe = wsService.on("game_started", offGameStarted);

    const offLeaderboardUpdate = wsService.on("leaderboard_update", (data) => {
      setLeaderboard(data.players);
    });

    const offPlayerFinished = wsService.on("player_finished", (data) => {
      // Small announcement or audio cue could go here
    });

    const offMatchFinished = wsService.on("match_finished", (data) => {
      setGameState("finished");
      setLeaderboard(data.leaderboard);
      navigate(`/results/${roomCode}`);
    });

    const offChatMessage = wsService.on("chat_message", (msg) => {
      setChatMessages((prev) => [...prev, msg].slice(-100)); // limit history to 100
    });

    const offPlayerKicked = wsService.on("player_kicked", (data) => {
      if (data.user_id === myUserId) {
        resetMultiplayerState();
        alert("You have been kicked from the room.");
        navigate("/multiplayer");
      }
    });

    const offDisconnected = wsService.on("disconnected", (data) => {
      console.log("⚠ Disconnected from room WebSocket", data);
    });

    return () => {
      offConnected();
      offRoomState();
      offPlayerJoined();
      offPlayerLeft();
      offPlayerReady();
      offGameStarting();
      offGameStartedUnsubscribe();
      offLeaderboardUpdate();
      offPlayerFinished();
      offMatchFinished();
      offChatMessage();
      offPlayerKicked();
      offDisconnected();
    };
  }, [roomCode, myUserId, navigate]);

  return (
    <MultiplayerContext.Provider
      value={{
        roomCode,
        room,
        players,
        gameState,
        words,
        chatMessages,
        leaderboard,
        countdown,
        isHost,
        myUserId,
        connectToRoom,
        disconnectFromRoom,
        sendReady,
        startGame,
        sendProgress,
        sendFinished,
        sendChat,
        kickPlayer,
        updateSettings,
      }}
    >
      {children}
    </MultiplayerContext.Provider>
  );
};

export const useMultiplayer = () => {
  const context = useContext(MultiplayerContext);
  if (!context) {
    throw new Error("useMultiplayer must be used within a MultiplayerProvider");
  }
  return context;
};
