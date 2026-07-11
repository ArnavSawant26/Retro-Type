import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useMultiplayer } from "../context/MultiplayerContext";
import PodiumDisplay from "../components/multiplayer/PodiumDisplay";
import MatchStats from "../components/multiplayer/MatchStats";
import * as api from "../services/multiplayerApi";
import "./MatchResults.css";

const MatchResults = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();

  const {
    leaderboard: contextLeaderboard,
    connectToRoom,
    disconnectFromRoom,
  } = useMultiplayer();

  const [leaderboard, setLeaderboard] = useState(contextLeaderboard || []);
  const [isLoading, setIsLoading] = useState(false);

  // If page was refreshed, fetch results via REST API instead of context
  useEffect(() => {
    if (leaderboard.length === 0 && roomId) {
      setIsLoading(true);
      api
        .getMatchResults(roomId)
        .then((data) => {
          setLeaderboard(data.leaderboard);
        })
        .catch((e) => {
          console.error("Error loading match results:", e);
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [roomId, leaderboard.length]);

  const handlePlayAgain = () => {
    // Return to the waiting room lobby
    connectToRoom(roomId);
    navigate(`/room/${roomId}`);
  };

  const handleBackToLobby = () => {
    disconnectFromRoom();
    navigate("/multiplayer");
  };

  const firstPlaceWinner = leaderboard.find((p) => p.rank === 1);

  return (
    <div className="rt-match-results-page fade-in">
      <div className="results-page-header">
        <h1>⌨ MATCH COMPLETE</h1>
        <p className="results-tagline">Final Standings & Speed Summary</p>
      </div>

      {isLoading ? (
        <div className="results-loading card text-center">
          <p className="loading-pulsate">LOADING SCOREBOARD STANDINGS...</p>
        </div>
      ) : (
        <>
          {firstPlaceWinner && (
            <div className="winner-announcement card">
              <span className="gold-crown-icon">🏆</span>
              <div className="winner-message">
                <span className="winner-label">RACE WINNER</span>
                <h2 style={{ color: firstPlaceWinner.color }}>{firstPlaceWinner.username}</h2>
                <p>Speed: {firstPlaceWinner.wpm} WPM | Accuracy: {Math.round(firstPlaceWinner.accuracy)}%</p>
              </div>
            </div>
          )}

          {/* Top 3 Podium pedestals */}
          <PodiumDisplay leaderboard={leaderboard} />

          {/* Detailed stats grids */}
          <MatchStats leaderboard={leaderboard} />

          {/* Navigation Action controls */}
          <div className="results-navigation-footer">
            <button className="btn btn-primary btn-results-nav" onClick={handlePlayAgain}>
              PLAY AGAIN (RETURN TO LOBBY)
            </button>
            <button className="btn btn-results-nav" onClick={handleBackToLobby}>
              BACK TO PORTAL
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default MatchResults;
