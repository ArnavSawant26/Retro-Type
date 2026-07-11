import React from "react";
import "./PlayerRaceTrack.css";

const PlayerRaceTrack = ({ leaderboard = [], myUserId }) => {
  // Sort players by progress (descending) for race view
  const sortedPlayers = [...leaderboard].sort((a, b) => b.progress - a.progress);

  return (
    <div className="rt-race-tracks card fade-in">
      <div className="race-header">
        <span className="race-title">⌨ REAL-TIME RACE TRACK</span>
      </div>

      <div className="tracks-container">
        {sortedPlayers.map((player) => {
          const isMe = player.user_id === myUserId;
          const progressPercentage = Math.round(player.progress || 0);

          return (
            <div
              key={player.user_id}
              className={`race-track-row ${isMe ? "is-me" : ""}`}
              style={{ "--player-color": player.color }}
            >
              <div className="player-info">
                <span className="player-indicator" style={{ backgroundColor: player.color }} />
                <span className="username-label">
                  {player.username}
                  {isMe && <span className="you-label"> (You)</span>}
                </span>
                <span className="wpm-label">{player.wpm} WPM</span>
              </div>

              <div className="track-bar-outer">
                <div
                  className="track-bar-inner"
                  style={{
                    width: `${progressPercentage}%`,
                    backgroundColor: player.color,
                    boxShadow: `0 0 8px ${player.color}`,
                  }}
                >
                  <span className="progress-percent">{progressPercentage}%</span>
                </div>
              </div>

              <div className="player-rank">
                {player.finished ? (
                  <span className="finished-badge">✓ #{player.rank}</span>
                ) : (
                  <span className="rank-badge">#{player.rank || "-"}</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PlayerRaceTrack;
