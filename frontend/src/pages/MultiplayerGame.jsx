import React, { useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useMultiplayer } from "../context/MultiplayerContext";
import { useMultiplayerTyping } from "../hooks/useMultiplayerTyping";
import PlayerRaceTrack from "../components/multiplayer/PlayerRaceTrack";
import LiveLeaderboard from "../components/multiplayer/LiveLeaderboard";
import "./MultiplayerGame.css";

const MultiplayerGame = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();

  const {
    room,
    words,
    gameState,
    leaderboard,
    myUserId,
    sendProgress,
    sendFinished,
    disconnectFromRoom,
  } = useMultiplayer();

  const containerRef = useRef(null);
  const wordRefs = useRef([]);

  // Safety redirect: If players refresh during match and lose state, redirect to lobby
  useEffect(() => {
    if (!room || gameState === "idle" || words.length === 0) {
      navigate("/multiplayer");
    }
  }, [room, gameState, words, navigate]);

  // Hook typing logic
  const {
    currentWord,
    currentLetter,
    letterState,
    extraLetters,
    extraLetterState,
    handleKey,
    wpm,
    acc,
    done,
    timeLeft,
    isTyping,
  } = useMultiplayerTyping({
    words,
    startTime: room?.start_time ? room.start_time * 1000 : null, // Convert unix seconds to js ms
    testMode: room?.test_mode || "words",
    modeValue: room?.mode_value || 30,
    onProgress: sendProgress,
    onFinished: sendFinished,
  });

  // Listen to keyboard event
  useEffect(() => {
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [handleKey]);

  // Auto scroll logic (matches TypingBox.jsx)
  useEffect(() => {
    const currentEl = wordRefs.current[currentWord];
    const container = containerRef.current;
    if (currentEl && container) {
      const top = currentEl.offsetTop;
      container.scrollTo({
        top: top - container.clientHeight * 0.4,
        behavior: "smooth",
      });
    }
  }, [currentWord]);

  return (
    <div className="rt-multiplayer-game fade-in">
      <div className="game-grid-layout">
        {/* Left column: Race track & typing area */}
        <div className="game-main-area">
          {/* Race Track visualizer */}
          <PlayerRaceTrack leaderboard={leaderboard} myUserId={myUserId} />

          {/* CRT Typing area */}
          <div className="rt-crt game-crt">
            <div className="rt-scanlines" />

            {/* Header statistics */}
            <div className="rt-header">
              <div className="rt-stats">
                <div className="rt-stat">
                  <span className="rt-stat-label">WPM</span>
                  <span className="rt-stat-val">{wpm}</span>
                </div>
                <div className="rt-stat">
                  <span className="rt-stat-label">ACC</span>
                  <span className="rt-stat-val">{acc}%</span>
                </div>
                {room?.test_mode === "time" && timeLeft !== null && (
                  <div className="rt-stat">
                    <span className="rt-stat-label">TIME</span>
                    <span className={`rt-stat-val ${timeLeft <= 5 ? "danger" : ""}`}>{timeLeft}s</span>
                  </div>
                )}
                {room?.test_mode === "words" && (
                  <div className="rt-stat">
                    <span className="rt-stat-label">WORDS</span>
                    <span className="rt-stat-val">
                      {currentWord}/{room?.mode_value}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Typing Terminal */}
            <div className="rt-terminal" ref={containerRef}>
              <div className="rt-words">
                {words.map((word, wIndex) => (
                  <span
                    key={wIndex}
                    ref={(el) => (wordRefs.current[wIndex] = el)}
                    className={`rt-word ${wIndex === currentWord ? "active" : ""} ${
                      wIndex < currentWord ? "typed" : ""
                    }`}
                  >
                    {word.split("").map((char, cIndex) => {
                      let className = "rt-letter";
                      if (letterState[wIndex]?.[cIndex] === "correct") className += " correct";
                      else if (letterState[wIndex]?.[cIndex] === "wrong") className += " wrong";

                      const isCursor = wIndex === currentWord && cIndex === currentLetter && !done;
                      if (isCursor) className += " cursor";

                      return (
                        <span key={cIndex} className={className}>
                          {char}
                        </span>
                      );
                    })}

                    {/* Extra letters */}
                    {(wIndex === currentWord ? extraLetters : extraLetterState[wIndex] || []).map(
                      (el, i) => (
                        <span key={`extra-${i}`} className="rt-letter extra">
                          {el}
                        </span>
                      )
                    )}
                  </span>
                ))}
              </div>
            </div>

            {/* Footer info */}
            <div className="rt-footer">
              <span className="rt-hint">
                {done ? "typing complete! waiting for other runners..." : "keep running. tab is disabled."}
              </span>
              <button className="btn btn-danger btn-sm" onClick={disconnectFromRoom}>
                QUIT RACE
              </button>
            </div>
          </div>
        </div>

        {/* Right column: Standings */}
        <div className="game-side-area">
          <LiveLeaderboard leaderboard={leaderboard} myUserId={myUserId} />
        </div>
      </div>
    </div>
  );
};

export default MultiplayerGame;
