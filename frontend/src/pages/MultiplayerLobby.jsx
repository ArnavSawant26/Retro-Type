import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useMultiplayer } from "../context/MultiplayerContext";
import * as api from "../services/multiplayerApi";
import "./MultiplayerLobby.css";

const MultiplayerLobby = () => {
  const { user } = useAuth();
  const { connectToRoom } = useMultiplayer();
  const navigate = useNavigate();

  const [publicRooms, setPublicRooms] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const refreshPublicRooms = async () => {
    if (!user) return;
    try {
      const rooms = await api.listRooms();
      setPublicRooms(rooms);
    } catch (e) {
      console.error("Error loading public rooms:", e);
    }
  };

  useEffect(() => {
    refreshPublicRooms();
  }, [user]);

  const handleJoinDirect = async (code) => {
    if (!user) return;
    setIsLoading(true);
    setErrorMsg("");

    try {
      await api.joinRoom(code);
      connectToRoom(code);
      navigate(`/room/${code}`);
    } catch (e) {
      console.error("Failed to join room:", e);
      setErrorMsg(e.response?.data?.detail || "Could not join room.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="rt-lobby-page fade-in">
        <div className="card login-nudge-card text-center">
          <h2>⌨ MULTIPLAYER LOBBY</h2>
          <div className="nudge-message-box">
            <p>You must be signed in to play Retro Type Multiplayer matches.</p>
            <p className="neon-glow-text">RETRO-OPERATING SYSTEM ACCESS DENIED</p>
          </div>
          <button className="btn btn-primary" onClick={() => navigate("/login")}>
            SIGN IN / LOGIN
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="rt-lobby-page fade-in">
      <div className="lobby-header">
        <h1>⌨ MULTIPLAYER PORTAL</h1>
        <p className="lobby-tagline">Type against other runners in real time</p>
      </div>

      {errorMsg && <div className="lobby-error-alert card danger">{errorMsg}</div>}

      <div className="lobby-grid">
        {/* Actions side */}
        <div className="card lobby-portal-controls">
          <div>
            <h2>MULTIPLAYER ACTIONS</h2>
            <p className="portal-help-text">
              Host a new room with custom settings or join an active match using a 6-character room code.
            </p>
          </div>
          <div className="lobby-portal-actions">
            <button
              className="btn btn-primary"
              onClick={() => navigate("/create-room")}
              disabled={isLoading}
            >
              🛠 CREATE LOBBY ROOM
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => navigate("/join-room")}
              disabled={isLoading}
            >
              🔑 JOIN WITH LOBBY CODE
            </button>
          </div>
        </div>

        {/* Public list side */}
        <div className="card public-rooms-card" style={{ minHeight: "280px" }}>
          <div className="public-rooms-header">
            <h2>PUBLIC LOBBIES</h2>
            <button className="btn-sm-refresh" onClick={refreshPublicRooms} title="Refresh">
              ⟳
            </button>
          </div>

          <div className="rooms-list-container" style={{ maxHeight: "250px", overflowY: "auto" }}>
            {publicRooms.map((r) => (
              <div key={r.code} className="public-room-item">
                <div className="room-item-details">
                  <span className="room-item-host">{r.host_username}'s Room</span>
                  <span className="room-item-meta">
                    {r.test_mode === "words" ? `${r.mode_value} words` : `${r.mode_value}s`} | {r.word_list}
                  </span>
                </div>
                <div className="room-item-action">
                  <span className="room-item-players">
                    {r.player_count}/{r.max_players}
                  </span>
                  <button
                    className="btn btn-sm-join"
                    disabled={isLoading}
                    onClick={() => handleJoinDirect(r.code)}
                  >
                    JOIN
                  </button>
                </div>
              </div>
            ))}
            {publicRooms.length === 0 && (
              <div className="no-rooms-message" style={{ padding: "50px 10px" }}>
                No active public lobbies. Build a room to invite others!
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MultiplayerLobby;
