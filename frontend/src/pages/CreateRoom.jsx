import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useMultiplayer } from "../context/MultiplayerContext";
import * as api from "../services/multiplayerApi";
import "./MultiplayerLobby.css"; // Reuse the existing lobby CSS variables

const LIST_OPTIONS = [
  { value: "common100", label: "Common 100" },
  { value: "common200", label: "Common 200" },
  { value: "code", label: "Code" },
  { value: "quotes", label: "Quotes" },
];

const CreateRoom = () => {
  const { user } = useAuth();
  const { connectToRoom } = useMultiplayer();
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Creation settings state
  const [isPrivate, setIsPrivate] = useState(false);
  const [maxPlayers, setMaxPlayers] = useState(8);
  const [testMode, setTestMode] = useState("words"); // "words", "time"
  const [modeValue, setModeValue] = useState(30); // count or seconds
  const [wordList, setWordList] = useState("common200");

  const handleCreateRoom = async (e) => {
    e.preventDefault();
    if (!user) return;
    setIsLoading(true);
    setErrorMsg("");

    try {
      const roomInfo = await api.createRoom({
        is_private: isPrivate,
        max_players: maxPlayers,
        test_mode: testMode,
        mode_value: Number(modeValue),
        word_list: wordList,
      });

      // Join the websocket server
      connectToRoom(roomInfo.code);
      navigate(`/room/${roomInfo.code}`);
    } catch (e) {
      console.error("Failed to create room:", e);
      setErrorMsg("Failed to create room. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="rt-lobby-page fade-in">
        <div className="card login-nudge-card text-center">
          <h2>⌨ CREATE ROOM</h2>
          <div className="nudge-message-box">
            <p>You must be signed in to create a multiplayer room.</p>
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
        <h1>⌨ CREATE NEW LOBBY</h1>
        <p className="lobby-tagline">Configure your typing room settings</p>
      </div>

      {errorMsg && <div className="lobby-error-alert card danger">{errorMsg}</div>}

      <div className="card create-room-card create-room-page-card">
        <h2>LOBBY SETTINGS</h2>
        <form className="create-room-form" onSubmit={handleCreateRoom}>
          <div className="form-group">
            <label>test mode</label>
            <div className="radio-pill-group">
              <button
                type="button"
                className={`pill-btn ${testMode === "words" ? "active" : ""}`}
                onClick={() => {
                  setTestMode("words");
                  setModeValue(30);
                }}
              >
                words
              </button>
              <button
                type="button"
                className={`pill-btn ${testMode === "time" ? "active" : ""}`}
                onClick={() => {
                  setTestMode("time");
                  setModeValue(30);
                }}
              >
                time
              </button>
            </div>
          </div>

          <div className="form-group">
            <label>{testMode === "words" ? "number of words" : "seconds"}</label>
            <select
              value={modeValue}
              onChange={(e) => setModeValue(Number(e.target.value))}
              className="lobby-select-input"
            >
              {testMode === "words" ? (
                <>
                  <option value={10}>10 words</option>
                  <option value={25}>25 words</option>
                  <option value={50}>50 words</option>
                  <option value={100}>100 words</option>
                </>
              ) : (
                <>
                  <option value={15}>15 seconds</option>
                  <option value={30}>30 seconds</option>
                  <option value={60}>60 seconds</option>
                  <option value={120}>120 seconds</option>
                </>
              )}
            </select>
          </div>

          <div className="form-group">
            <label>word list</label>
            <select
              value={wordList}
              onChange={(e) => setWordList(e.target.value)}
              className="lobby-select-input"
            >
              {LIST_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>max players ({maxPlayers})</label>
            <input
              type="range"
              min={2}
              max={8}
              value={maxPlayers}
              onChange={(e) => setMaxPlayers(Number(e.target.value))}
              className="lobby-slider"
            />
          </div>

          <div className="form-group checkbox-group">
            <input
              type="checkbox"
              id="isPrivate"
              checked={isPrivate}
              onChange={(e) => setIsPrivate(e.target.checked)}
            />
            <label htmlFor="isPrivate">make room private (code only required to join)</label>
          </div>

          <div className="form-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => navigate("/multiplayer")}
            >
              BACK TO PORTAL
            </button>
            <button type="submit" className="btn btn-primary" disabled={isLoading}>
              {isLoading ? "INITIALIZING..." : "GENERATE ROOM"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateRoom;
