import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useMultiplayer } from "../context/MultiplayerContext";
import * as api from "../services/multiplayerApi";
import "./MultiplayerLobby.css";

const JoinRoom = () => {
  const { user } = useAuth();
  const { connectToRoom } = useMultiplayer();
  const navigate = useNavigate();

  const [joinCode, setJoinCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleJoinByCode = async (e) => {
    e.preventDefault();
    if (!user || !joinCode.trim()) return;
    setIsLoading(true);
    setErrorMsg("");

    const formattedCode = joinCode.trim().toUpperCase();

    try {
      await api.joinRoom(formattedCode);
      connectToRoom(formattedCode);
      navigate(`/room/${formattedCode}`);
    } catch (e) {
      console.error("Failed to join room:", e);
      setErrorMsg(e.response?.data?.detail || "Room not found or full.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="rt-lobby-page fade-in">
        <div className="card login-nudge-card text-center">
          <h2>⌨ JOIN ROOM</h2>
          <div className="nudge-message-box">
            <p>You must be signed in to join a multiplayer room.</p>
            <p className="neon-glow-text">ACCESS DENIED</p>
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
        <h1>⌨ JOIN WITH CODE</h1>
        <p className="lobby-tagline">Enter a lobby code to connect to a match</p>
      </div>

      {errorMsg && <div className="lobby-error-alert card danger">{errorMsg}</div>}

      <div className="card join-code-card join-room-page-card">
        <h2>ENTER LOBBY CODE</h2>
        <form className="join-code-form join-room-form-column" onSubmit={handleJoinByCode}>
          <input
            type="text"
            className="lobby-text-input join-room-input"
            placeholder="ENTER 6-CHAR CODE..."
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value)}
            maxLength={6}
          />
          <div className="form-actions" style={{ width: "100%" }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => navigate("/multiplayer")}
            >
              BACK
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isLoading || !joinCode.trim()}
            >
              {isLoading ? "CONNECTING..." : "JOIN LOBBY"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default JoinRoom;
