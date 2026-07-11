import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useMultiplayer } from "../context/MultiplayerContext";
import PlayerCard from "../components/multiplayer/PlayerCard";
import RoomChat from "../components/multiplayer/RoomChat";
import CountdownOverlay from "../components/multiplayer/CountdownOverlay";
import "./WaitingRoom.css";

const LIST_OPTIONS = [
  { value: "common100", label: "Common 100" },
  { value: "common200", label: "Common 200" },
  { value: "code", label: "Code" },
  { value: "quotes", label: "Quotes" },
];

const WaitingRoom = () => {
  const { roomId } = useParams(); // roomId represents the code here
  const { user } = useAuth();
  const {
    roomCode: contextRoomCode,
    room,
    players,
    gameState,
    chatMessages,
    countdown,
    isHost,
    myUserId,
    connectToRoom,
    disconnectFromRoom,
    sendReady,
    startGame,
    sendChat,
    kickPlayer,
    updateSettings,
  } = useMultiplayer();

  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const [myReady, setMyReady] = useState(false);

  // Auto-connect to WebSocket room on page load / mount
  // Only connect if not already connected (e.g. after create/join already called connectToRoom)
  useEffect(() => {
    if (roomId && contextRoomCode !== roomId) {
      connectToRoom(roomId);
    }
    return () => {
      // Clean up connection on leave
    };
  }, [roomId]);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(roomId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleToggleReady = () => {
    const nextReady = !myReady;
    setMyReady(nextReady);
    sendReady(nextReady);
  };

  const handleStartGame = () => {
    // Requires at least 2 players to start
    if (players.length < 2) {
      alert("You need at least 2 players to start a multiplayer race!");
      return;
    }
    startGame();
  };

  const handleKick = (targetUserId) => {
    if (window.confirm("Are you sure you want to kick this player?")) {
      kickPlayer(targetUserId);
    }
  };

  const handleWordListChange = (e) => {
    updateSettings({ word_list: e.target.value });
  };

  const handleTestModeChange = (mode) => {
    const defaultVal = mode === "words" ? 30 : 30;
    updateSettings({ test_mode: mode, mode_value: defaultVal });
  };

  const handleModeValueChange = (e) => {
    updateSettings({ mode_value: Number(e.target.value) });
  };

  // Find host username
  const hostPlayer = players.find((p) => p.user_id === room?.host_user_id);
  const hostName = hostPlayer ? hostPlayer.username : "Unknown";

  return (
    <div className="rt-waiting-room fade-in">
      <div className="waiting-room-header">
        <div className="room-meta-left">
          <h1>⌨ LOBBY ROOM</h1>
          <p className="room-host-subtitle">Host: {hostName}</p>
        </div>

        {/* Room Code */}
        <div className="room-code-display card">
          <span className="code-label">LOBBY CODE</span>
          <div className="code-row">
            <span className="code-text">{roomId}</span>
            <button className="btn btn-copy" onClick={handleCopyCode}>
              {copied ? "COPIED!" : "COPY"}
            </button>
          </div>
        </div>
      </div>

      <div className="waiting-room-layout">
        {/* Left Side: Players & Controls */}
        <div className="waiting-room-main">
          {/* Settings for host / display settings for guest */}
          <div className="card room-settings-banner">
            <h3>⚙ MATCH CONFIGURATION</h3>
            {isHost ? (
              <div className="settings-controls-grid">
                <div className="control-box">
                  <label>Test Mode</label>
                  <div className="mode-pill-toggles">
                    <button
                      className={`toggle-pill ${room?.test_mode === "words" ? "active" : ""}`}
                      onClick={() => handleTestModeChange("words")}
                    >
                      WORDS
                    </button>
                    <button
                      className={`toggle-pill ${room?.test_mode === "time" ? "active" : ""}`}
                      onClick={() => handleTestModeChange("time")}
                    >
                      TIME
                    </button>
                  </div>
                </div>

                <div className="control-box">
                  <label>Duration / Length</label>
                  <select
                    value={room?.mode_value || 30}
                    onChange={handleModeValueChange}
                    className="settings-select"
                  >
                    {room?.test_mode === "words" ? (
                      <>
                        <option value={10}>10 words</option>
                        <option value={25}>25 words</option>
                        <option value={50}>50 words</option>
                        <option value={100}>100 words</option>
                      </>
                    ) : (
                      <>
                        <option value={15}>15s</option>
                        <option value={30}>30s</option>
                        <option value={60}>60s</option>
                        <option value={120}>120s</option>
                      </>
                    )}
                  </select>
                </div>

                <div className="control-box">
                  <label>Word Category</label>
                  <select
                    value={room?.word_list || "common200"}
                    onChange={handleWordListChange}
                    className="settings-select"
                  >
                    {LIST_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            ) : (
              <div className="guest-settings-view">
                <div className="guest-setting-item">
                  <span className="guest-label">MODE:</span>
                  <span className="guest-val">{room?.test_mode?.toUpperCase()}</span>
                </div>
                <div className="guest-setting-item">
                  <span className="guest-label">LENGTH:</span>
                  <span className="guest-val">
                    {room?.test_mode === "words" ? `${room?.mode_value} words` : `${room?.mode_value}s`}
                  </span>
                </div>
                <div className="guest-setting-item">
                  <span className="guest-label">CATEGORY:</span>
                  <span className="guest-val">
                    {LIST_OPTIONS.find((o) => o.value === room?.word_list)?.label || "Common"}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Connected players list */}
          <div className="players-list-section">
            <div className="list-title-row">
              <h3>
                RUNNERS IN LOBBY ({players.length}/{room?.max_players || 8})
              </h3>
            </div>
            <div className="players-grid">
              {players.map((p) => (
                <PlayerCard
                  key={p.user_id}
                  player={p}
                  isMe={p.user_id === myUserId}
                  showKick={isHost}
                  onKick={handleKick}
                />
              ))}
            </div>
          </div>

          {/* Lobby buttons */}
          <div className="lobby-actions-footer">
            <button className="btn btn-danger btn-leave" onClick={disconnectFromRoom}>
              EXIT LOBBY
            </button>

            {isHost ? (
              <button className="btn btn-primary btn-start" onClick={handleStartGame}>
                START MATCH (G)
              </button>
            ) : (
              <button
                className={`btn btn-ready ${myReady ? "btn-ready-active" : ""}`}
                onClick={handleToggleReady}
              >
                {myReady ? "✓ READY" : "MARK READY"}
              </button>
            )}
          </div>
        </div>

        {/* Right Side: Chat box */}
        <div className="waiting-room-chat">
          <RoomChat chatMessages={chatMessages} onSendMessage={sendChat} myUserId={myUserId} />
        </div>
      </div>

      {gameState === "countdown" && <CountdownOverlay countdown={countdown} />}
    </div>
  );
};

export default WaitingRoom;
